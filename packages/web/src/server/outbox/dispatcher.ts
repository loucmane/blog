import type { OutboxEvent } from '../content/domain'
import type { Clock, ContentRepository, ContentTransaction } from '../content/ports'
import { ContentService, SystemClock } from '../content/service'
import type { OutboxClaim, OutboxHandlers, OutboxStore, QueuedOutboxEvent } from './ports'
import { outboxRetryDelayMs } from './retry'

export const defaultOutboxBatchSize = 25
export const maxOutboxBatchSize = 100
export const defaultOutboxHandlerTimeoutMs = 30_000
const maxRecordedReasonLength = 1_000

/** What became of one dispatched event. */
export type DispatchedOutboxEvent =
  | { readonly event: OutboxEvent; readonly outcome: 'completed' | 'dead-lettered' }
  | { readonly event: OutboxEvent; readonly nextAttemptAt: string; readonly outcome: 'retrying' }

/** The ids of the events one drain dispatched, by what became of them. */
export interface OutboxDrainReport {
  readonly completed: readonly string[]
  readonly deadLettered: readonly string[]
  readonly retrying: readonly string[]
}

export interface OutboxDispatcherOptions {
  readonly clock?: Clock
  readonly handlers: OutboxHandlers
  /** How long one handler may run before its event is recorded as failed. */
  readonly handlerTimeoutMs?: number
  readonly store: OutboxStore
}

interface Failure {
  readonly reason: string
  /** False when trying again cannot help, so the event is dead-lettered at once. */
  readonly retryable: boolean
}

function recordedReason(reason: string): string {
  const trimmed = reason.trim() || 'The handler failed without a reason.'
  return trimmed.length > maxRecordedReasonLength
    ? `${trimmed.slice(0, maxRecordedReasonLength - 1)}…`
    : trimmed
}

/**
 * The repository ContentService.completeOutboxEvent records through while an event is dispatched:
 * the claim's own transaction, so the outcome commits or rolls back with the claim.
 */
export function claimRepository(transaction: ContentTransaction): ContentRepository {
  const unavailable = () =>
    Promise.reject(new Error('Only the claim transaction is available to an outbox outcome.'))
  return {
    readPublicationVersion: unavailable,
    transaction: (work) => work(transaction),
    tryExclusive: unavailable,
  }
}

/**
 * Delivers outbox events through the handler registered for each event type. Every event is
 * claimed, handled and recorded on its own, so a failing, unsupported or slow event never stops
 * the events after it: a handler that throws or runs past its time limit leaves its event to be
 * retried after a backoff, and an event without a handler is dead-lettered at once.
 */
export class OutboxDispatcher {
  private readonly clock: Clock
  private readonly handlerTimeoutMs: number

  constructor(private readonly options: OutboxDispatcherOptions) {
    this.clock = options.clock ?? new SystemClock()
    this.handlerTimeoutMs = options.handlerTimeoutMs ?? defaultOutboxHandlerTimeoutMs
  }

  /** Dispatches due events, one at a time, until none is due or `limit` have been dispatched. */
  async drain(input: { readonly limit?: number } = {}): Promise<OutboxDrainReport> {
    const limit = input.limit ?? defaultOutboxBatchSize
    if (!Number.isInteger(limit) || limit < 1 || limit > maxOutboxBatchSize) {
      throw new RangeError(`An outbox drain dispatches between 1 and ${maxOutboxBatchSize} events.`)
    }
    const completed: string[] = []
    const deadLettered: string[] = []
    const retrying: string[] = []
    const byOutcome = { completed, 'dead-lettered': deadLettered, retrying }
    for (let index = 0; index < limit; index += 1) {
      const dispatched = await this.dispatchNext()
      if (!dispatched) break
      byOutcome[dispatched.outcome].push(dispatched.event.id)
    }
    return { completed, deadLettered, retrying }
  }

  /** Claims, handles and records the oldest due event; null when no event is due. */
  async dispatchNext(): Promise<DispatchedOutboxEvent | null> {
    const claimed = await this.options.store.claimNextDue(
      this.clock.now().toISOString(),
      async (claim) => this.record(claim, await this.handle(claim.event)),
    )
    return claimed.claimed ? claimed.value : null
  }

  private async handle(event: QueuedOutboxEvent): Promise<Failure | null> {
    const handler = this.options.handlers.get(event.type)
    if (!handler) return { reason: `unsupported event type: ${event.type}`, retryable: false }
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    const handled = Promise.resolve().then(() =>
      handler(event, { idempotencyKey: event.id, signal: controller.signal }),
    )
    // A handler that outlives its time limit is abandoned, and its late failure is not unhandled.
    handled.catch(() => undefined)
    const timedOut = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        controller.abort()
        reject(new Error(`The handler did not finish within ${this.handlerTimeoutMs} ms.`))
      }, this.handlerTimeoutMs)
    })
    try {
      await Promise.race([handled, timedOut])
      return null
    } catch (error) {
      return { reason: error instanceof Error ? error.message : String(error), retryable: true }
    } finally {
      clearTimeout(timer)
    }
  }

  /**
   * Records the outcome through ContentService.completeOutboxEvent, in the claim's transaction,
   * and then the retry state that follows from it: a failed event is due again after its backoff,
   * or dead-lettered when it cannot be retried or its retries are spent.
   */
  private record(claim: OutboxClaim, failure: Failure | null): Promise<DispatchedOutboxEvent> {
    return claim.record(async (recording) => {
      const outcomes = new ContentService(claimRepository(recording.content), this.clock)
      const recorded = await outcomes.completeOutboxEvent(
        failure
          ? { error: recordedReason(failure.reason), eventId: claim.event.id }
          : { eventId: claim.event.id },
      )
      if (!failure) {
        await recording.saveRetryState({ deadLetteredAt: null, nextAttemptAt: null })
        return { event: recorded, outcome: 'completed' }
      }
      const delay = failure.retryable ? outboxRetryDelayMs(recorded.attempts) : null
      if (delay === null) {
        const deadLetter: OutboxEvent = { ...recorded, status: 'dead_letter' }
        await recording.content.saveOutboxEvent(deadLetter)
        await recording.saveRetryState({ deadLetteredAt: recorded.updatedAt, nextAttemptAt: null })
        return { event: deadLetter, outcome: 'dead-lettered' }
      }
      const nextAttemptAt = new Date(Date.parse(recorded.updatedAt) + delay).toISOString()
      await recording.saveRetryState({ deadLetteredAt: null, nextAttemptAt })
      return { event: recorded, nextAttemptAt, outcome: 'retrying' }
    })
  }
}
