import type { OutboxEvent } from '../content/domain'
import type { ContentRepository } from '../content/ports'
import type {
  DeadLetteredOutboxEvent,
  OutboxClaim,
  OutboxRetryState,
  OutboxStore,
  QueuedOutboxEvent,
} from './ports'

function byCreation(left: OutboxEvent, right: OutboxEvent): number {
  return left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id)
}

function isDue(event: QueuedOutboxEvent, now: string): boolean {
  if (event.status === 'pending') return true
  if (event.status !== 'failed') return false
  return event.nextAttemptAt === null || Date.parse(event.nextAttemptAt) <= Date.parse(now)
}

/**
 * The outbox store test double: events live in the content repository, as the content service
 * writes them, and their retry state lives in memory. A claim keeps its event from every other
 * claim until it ends; the outcome is recorded in one content transaction, with the retry state
 * kept only when that transaction commits.
 */
export class InMemoryOutboxStore implements OutboxStore {
  private readonly claimed = new Set<string>()
  private readonly retryStates = new Map<string, OutboxRetryState>()

  constructor(private readonly repository: ContentRepository) {}

  async claimNextDue<T>(
    now: string,
    work: (claim: OutboxClaim) => Promise<T>,
  ): Promise<{ claimed: false } | { claimed: true; value: T }> {
    const events = await this.repository.transaction((transaction) =>
      transaction.listOutboxEvents(),
    )
    const event = events
      .map((stored) => this.queued(stored))
      .filter((queued) => !this.claimed.has(queued.id) && isDue(queued, now))
      .sort(byCreation)[0]
    if (!event) return { claimed: false }
    this.claimed.add(event.id)
    let recorded = false
    try {
      const value = await work({
        event,
        record: async (recording) => {
          if (recorded) throw new Error(`Outbox event ${event.id} was already recorded.`)
          recorded = true
          let retryState: OutboxRetryState | undefined
          const result = await this.repository.transaction((content) =>
            recording({
              content,
              saveRetryState: async (state) => {
                retryState = state
              },
            }),
          )
          if (retryState) this.retryStates.set(event.id, retryState)
          return result
        },
      })
      return { claimed: true, value }
    } finally {
      this.claimed.delete(event.id)
    }
  }

  async listDeadLetters(): Promise<readonly DeadLetteredOutboxEvent[]> {
    const events = await this.repository.transaction((transaction) =>
      transaction.listOutboxEvents(),
    )
    return events
      .filter(({ status }) => status === 'dead_letter')
      .map((event) => ({
        ...event,
        deadLetteredAt: this.retryStates.get(event.id)?.deadLetteredAt ?? event.updatedAt,
      }))
      .sort(
        (left, right) =>
          left.deadLetteredAt.localeCompare(right.deadLetteredAt) ||
          left.id.localeCompare(right.id),
      )
  }

  private queued(event: OutboxEvent): QueuedOutboxEvent {
    const nextAttemptAt =
      event.status === 'failed' ? (this.retryStates.get(event.id)?.nextAttemptAt ?? null) : null
    return { ...event, nextAttemptAt }
  }
}
