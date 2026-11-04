import type { OutboxEvent } from '../content/domain'
import type {
  Subscriber,
  SubscriberConsent,
  SubscriptionEvent,
  SubscriptionToken,
  SubscriptionTokenPurpose,
} from './domain'

/**
 * One transaction over the subscription records. It shares its commit with the outbox, so an event
 * it queues is stored with the change that queued it, or not at all.
 *
 * Every change to a subscriber, its consents or its tokens happens while the transaction holds the
 * subscriber's lock, taken by `claimSubscriberByEmail` or `lockSubscriber`. A token found before the
 * lock is taken is read again under it.
 */
export interface SubscriptionTransaction {
  /** Appends to the subscription history, which is never changed or emptied. */
  appendEvent(event: SubscriptionEvent): Promise<void>
  /**
   * The subscriber with the candidate's address, locked until the commit. When there is none, the
   * candidate is stored, and `created` says so.
   */
  claimSubscriberByEmail(candidate: Subscriber & { readonly emailCanonical: string }): Promise<{
    readonly created: boolean
    readonly subscriber: Subscriber
  }>
  /** Marks every unused token of the subscriber for these purposes as used at `consumedAt`. */
  consumeTokens(
    subscriberId: string,
    purposes: readonly SubscriptionTokenPurpose[],
    consumedAt: string,
  ): Promise<void>
  getSubscriberByEmail(emailCanonical: string): Promise<Subscriber | null>
  getToken(tokenHash: string): Promise<SubscriptionToken | null>
  /** A subscriber's consents, the earliest granted first. */
  listConsents(subscriberId: string): Promise<readonly SubscriberConsent[]>
  /** A subscriber's history, the earliest first. */
  listEvents(subscriberId: string): Promise<readonly SubscriptionEvent[]>
  /** The subscriber, locked until the commit; null when there is none. */
  lockSubscriber(id: string): Promise<Subscriber | null>
  /** Queues an outbox event in this transaction. */
  queueOutboxEvent(event: OutboxEvent): Promise<void>
  /** Stores a new consent. */
  saveConsent(consent: SubscriberConsent): Promise<void>
  /** Stores a new token. */
  saveToken(token: SubscriptionToken): Promise<void>
  /** Writes a subscriber's status and its timestamps. */
  updateSubscriber(subscriber: Subscriber): Promise<void>
  /** Sets the withdrawal time of each of the subscriber's consents not yet withdrawn. */
  withdrawConsents(subscriberId: string, withdrawnAt: string): Promise<void>
}

export interface SubscriptionStore {
  /** Runs `work` in one transaction: it commits when `work` resolves and rolls back when it throws. */
  transaction<T>(work: (transaction: SubscriptionTransaction) => Promise<T>): Promise<T>
}
