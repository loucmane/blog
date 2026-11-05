import { createHash } from 'node:crypto'

import type { OutboxEvent } from '../content/domain'
import type { Clock, ContentRepository, ContentTransaction } from '../content/ports'
import { ContentService, SystemClock } from '../content/service'
import {
  createLogger,
  isCorrelationId,
  newCorrelationId,
  type Logger,
} from '../observability/logger'
import { createOutboxHandlers, type OutboxHandlerDependencies } from './handlers'
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
  /**
   * Where each event's outcome is logged once it is recorded, under the event's correlation id: a
   * completion as info, a failure that will be retried as a warning, a dead letter or an outcome
   * that could not be recorded as an error. A console logger unless given.
   */
  readonly logger?: Logger
  readonly store: OutboxStore
}

export type OutboxDispatcherDependencies = Omit<OutboxDispatcherOptions, 'handlers'> &
  OutboxHandlerDependencies

/** Builds the application dispatcher without exposing its effect handlers to route callers. */
export function createOutboxDispatcher(
  dependencies: OutboxDispatcherDependencies,
): OutboxDispatcher {
  return new OutboxDispatcher({
    ...dependencies,
    handlers: createOutboxHandlers(dependencies),
  })
}

interface Failure {
  readonly reason: string
  /** False when trying again cannot help, so the event is dead-lettered at once. */
  readonly retryable: boolean
}

/** The logger of the event a dispatch claimed, set once it has claimed one. */
interface ClaimedEventLogger {
  logger?: Logger
}

/** One recorded dispatch, with what its outcome is logged with once the claim commits. */
interface RecordedDispatch {
  readonly dispatched: DispatchedOutboxEvent
  readonly durationMs: number
  readonly logger: Logger
}

/**
 * The correlation id an event's handler and log lines carry (BR-12). An event that recorded the id
 * of the request that wrote it, as `payload.correlationId`, carries that id. Any other event
 * carries an id derived from what all the events of one content change share, their story and the
 * instant they were written: the jobs of one publication, and every retry of each, share one id.
 */
export function eventCorrelationId(
  event: Pick<OutboxEvent, 'aggregateId' | 'createdAt' | 'payload'>,
): string {
  const recorded = event.payload.correlationId
  if (isCorrelationId(recorded)) return recorded
  const change = createHash('sha256').update(`${event.aggregateId}\n${event.createdAt}`)
  return `outbox-${change.digest('hex').slice(0, 32)}`
}

/**
 * When a failed event is due again: its last failure plus the backoff for the failures it has had.
 * Null for an event that has not failed, or whose retries are spent. The dispatcher records this as
 * the event's retry state; the owner job view shows it.
 */
export function retryDueAt(
  event: Pick<OutboxEvent, 'attempts' | 'status' | 'updatedAt'>,
): string | null {
  if (event.status !== 'failed') return null
  const delay = outboxRetryDelayMs(event.attempts)
  return delay === null ? null : new Date(Date.parse(event.updatedAt) + delay).toISOString()
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
 * retried after a backoff, and an event without a handler is dead-lettered at once. Each handler
 * is given the event's correlation id, and each outcome is logged under it.
 */
export class OutboxDispatcher {
  private readonly clock: Clock
  private readonly handlerTimeoutMs: number
  private readonly logger: Logger

  constructor(private readonly options: OutboxDispatcherOptions) {
    this.clock = options.clock ?? new SystemClock()
    this.handlerTimeoutMs = options.handlerTimeoutMs ?? defaultOutboxHandlerTimeoutMs
    this.logger = options.logger ?? createLogger({ correlationId: newCorrelationId() })
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

  /**
   * Claims, handles and records the oldest due event; null when no event is due. Its outcome is
   * logged once the claim has committed it; when it could not be recorded, the event stays due
   * and that is logged instead.
   */
  async dispatchNext(): Promise<DispatchedOutboxEvent | null> {
    const holder: ClaimedEventLogger = {}
    let claimed: { claimed: false } | { claimed: true; value: RecordedDispatch }
    try {
      claimed = await this.options.store.claimNextDue(this.clock.now().toISOString(), (claim) =>
        this.dispatch(claim, holder),
      )
    } catch (error) {
      if (holder.logger) holder.logger.error('outbox.event.unrecorded', { error })
      else this.logger.error('outbox.claim.failed', { error })
      throw error
    }
    if (!claimed.claimed) return null
    const { dispatched, durationMs, logger } = claimed.value
    this.logOutcome(logger, dispatched, durationMs)
    return dispatched
  }

  /** Handles and records one claimed event, under a logger bound to its correlation id. */
  private async dispatch(
    claim: OutboxClaim,
    holder: ClaimedEventLogger,
  ): Promise<RecordedDispatch> {
    const { event } = claim
    const correlationId = eventCorrelationId(event)
    const logger = this.logger.child({
      correlationId,
      fields: { aggregateId: event.aggregateId, eventId: event.id, eventType: event.type },
    })
    holder.logger = logger
    const started = this.clock.now().valueOf()
    const failure = await this.handle(event, correlationId)
    const durationMs = this.clock.now().valueOf() - started
    return { dispatched: await this.record(claim, failure), durationMs, logger }
  }

  private logOutcome(logger: Logger, dispatched: DispatchedOutboxEvent, durationMs: number) {
    const { attempts, lastError } = dispatched.event
    if (dispatched.outcome === 'completed') {
      logger.info('outbox.event.completed', { attempts, durationMs })
    } else if (dispatched.outcome === 'retrying') {
      const { nextAttemptAt } = dispatched
      logger.warn('outbox.event.retrying', { attempts, durationMs, lastError, nextAttemptAt })
    } else {
      logger.error('outbox.event.dead-lettered', { attempts, durationMs, lastError })
    }
  }

  private async handle(event: QueuedOutboxEvent, correlationId: string): Promise<Failure | null> {
    const handler = this.options.handlers.get(event.type)
    if (!handler) return { reason: `unsupported event type: ${event.type}`, retryable: false }
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    const handled = Promise.resolve().then(() =>
      handler(event, { correlationId, idempotencyKey: event.id, signal: controller.signal }),
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
      const nextAttemptAt = failure.retryable ? retryDueAt(recorded) : null
      if (nextAttemptAt === null) {
        const deadLetter: OutboxEvent = { ...recorded, status: 'dead_letter' }
        await recording.content.saveOutboxEvent(deadLetter)
        await recording.saveRetryState({ deadLetteredAt: recorded.updatedAt, nextAttemptAt: null })
        return { event: deadLetter, outcome: 'dead-lettered' }
      }
      await recording.saveRetryState({ deadLetteredAt: null, nextAttemptAt })
      return { event: recorded, nextAttemptAt, outcome: 'retrying' }
    })
  }
}
