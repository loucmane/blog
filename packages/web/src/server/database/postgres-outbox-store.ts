import type {
  DeadLetteredOutboxEvent,
  OutboxClaim,
  OutboxStore,
  QueuedOutboxEvent,
} from '../outbox/ports'
import {
  mapOutbox,
  type OutboxRow,
  type PostgresContentRepository,
} from './postgres-content-repository'

/** An outbox row with the retry state of migration 0007. */
interface RetryStateRow extends OutboxRow {
  dead_lettered_at: Date | string | null
  next_attempt_at: Date | string | null
}

function nullableIso(value: Date | string | null): string | null {
  return value === null ? null : new Date(value).toISOString()
}

// The oldest due event. SKIP LOCKED passes over events other dispatchers have claimed, so no two
// dispatchers run one event, and none waits behind another's slow event.
const claimDueEvent = `SELECT * FROM outbox_events
WHERE status = 'pending'
  OR (status = 'failed' AND (next_attempt_at IS NULL OR next_attempt_at <= $1))
ORDER BY created_at, id
LIMIT 1
FOR UPDATE SKIP LOCKED`

// A dead letter restored from an export has no dead_lettered_at; its last update set it aside.
const listDeadLetters = `SELECT *, coalesce(dead_lettered_at, updated_at) AS set_aside_at
FROM outbox_events
WHERE status = 'dead_letter'
ORDER BY set_aside_at, id`

/**
 * The outbox store on PostgreSQL. A claim is a transaction holding the event's row lock: the
 * outcome is recorded in the same transaction, through the content repository's own transaction,
 * and commits with the claim.
 */
export class PostgresOutboxStore implements OutboxStore {
  constructor(private readonly repository: PostgresContentRepository) {}

  async claimNextDue<T>(
    now: string,
    work: (claim: OutboxClaim) => Promise<T>,
  ): Promise<{ claimed: false } | { claimed: true; value: T }> {
    return this.repository.transactionOnConnection(async (content, connection) => {
      const row = (await connection.query<RetryStateRow>(claimDueEvent, [now])).rows[0]
      if (!row) return { claimed: false }
      const event: QueuedOutboxEvent = {
        ...mapOutbox(row),
        nextAttemptAt: nullableIso(row.next_attempt_at),
      }
      let recorded = false
      const value = await work({
        event,
        record: async (recording) => {
          if (recorded) throw new Error(`Outbox event ${event.id} was already recorded.`)
          recorded = true
          return recording({
            content,
            saveRetryState: async (state) => {
              await connection.query(
                'UPDATE outbox_events SET next_attempt_at = $2, dead_lettered_at = $3 WHERE id = $1',
                [event.id, state.nextAttemptAt, state.deadLetteredAt],
              )
            },
          })
        },
      })
      return { claimed: true, value }
    })
  }

  async listDeadLetters(): Promise<readonly DeadLetteredOutboxEvent[]> {
    return this.repository.transactionOnConnection(async (_content, connection) =>
      (
        await connection.query<RetryStateRow & { set_aside_at: Date | string }>(listDeadLetters)
      ).rows.map((row) => ({
        ...mapOutbox(row),
        deadLetteredAt: new Date(row.set_aside_at).toISOString(),
      })),
    )
  }
}
