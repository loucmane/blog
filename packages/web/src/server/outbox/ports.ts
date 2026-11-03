import type { OutboxEvent } from '../content/domain'
import type { ContentTransaction } from '../content/ports'

/** An outbox event as the dispatcher sees it: the stored event and when it is next due. */
export interface QueuedOutboxEvent extends OutboxEvent {
  /** When a failed event may be tried again. Null for a pending event, which is due at once. */
  readonly nextAttemptAt: string | null
}

/**
 * An event the dispatcher set aside: it needs the owner's attention and is never tried again. Its
 * reason is `lastError`.
 */
export interface DeadLetteredOutboxEvent extends OutboxEvent {
  /**
   * When it was set aside. A dead letter restored from an export carries no retry state; its last
   * update, which set it aside, stands in.
   */
  readonly deadLetteredAt: string
}

/** The retry state of an event, recorded after each of its outcomes. */
export interface OutboxRetryState {
  /** When a dead letter was set aside; null for every other event. */
  readonly deadLetteredAt: string | null
  /** When a failed event is due again; null for every other event. */
  readonly nextAttemptAt: string | null
}

/** The claim's transaction, in which the dispatcher records what became of the claimed event. */
export interface OutboxRecording {
  /** The content transaction ContentService.completeOutboxEvent records the outcome in. */
  readonly content: ContentTransaction
  saveRetryState(state: OutboxRetryState): Promise<void>
}

/** One claimed event. No other dispatcher takes it while the claim lasts. */
export interface OutboxClaim {
  readonly event: QueuedOutboxEvent
  /** Runs `work` in the claim's transaction. Call it once, after the event's handler settles. */
  record<T>(work: (recording: OutboxRecording) => Promise<T>): Promise<T>
}

export interface OutboxStore {
  /**
   * Claims the oldest due event, passing over any that another dispatcher holds, and runs `work`
   * with it. What `work` records commits with the claim when `work` resolves; when it throws,
   * nothing is recorded and the event stays due. Nothing is claimed when no event is due.
   */
  claimNextDue<T>(
    now: string,
    work: (claim: OutboxClaim) => Promise<T>,
  ): Promise<{ claimed: false } | { claimed: true; value: T }>
  /** Every dead letter, the earliest set aside first: the events that need attention. */
  listDeadLetters(): Promise<readonly DeadLetteredOutboxEvent[]>
}

/** What a handler is given with its event. */
export interface OutboxHandlerContext {
  /**
   * The id that ties this delivery to the request that wrote the event and to the other jobs of
   * the same change (`eventCorrelationId`). Handlers log under it, and an adapter hands it to its
   * provider where the provider takes one. The dispatcher always sets it; it is optional only so
   * that a handler can be called directly without one.
   */
  readonly correlationId?: string
  /**
   * The key an adapter hands on so that a repeated delivery has no second effect. It is derived
   * from the event id, so every retry and replay of the event carries the same key.
   */
  readonly idempotencyKey: string
  /** Aborted when the handler runs past the dispatcher's time limit for one event. */
  readonly signal: AbortSignal
}

/** Carries out one event's effect, and throws when it failed and the event should be retried. */
export type OutboxHandler = (event: OutboxEvent, context: OutboxHandlerContext) => Promise<void>

/** The handlers the dispatcher runs, by event type. An event of any other type is dead-lettered. */
export type OutboxHandlers = ReadonlyMap<string, OutboxHandler>

/** Expires cached reader views. */
export interface CacheRevalidator {
  /** Expires the cached views of these stories and every cached listing that may show them. */
  revalidate(input: {
    readonly idempotencyKey: string
    readonly slugs: readonly string[]
  }): Promise<void>
}
