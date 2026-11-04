import type { Clock, IdentifierSource } from '../content/ports'
import { RandomIdentifierSource, SystemClock } from '../content/service'
import { isConsentSource, subscriptionConsent } from './consent'
import {
  canonicalEmailAddress,
  type SubscriberConsent,
  type SubscriptionEvent,
  type SubscriptionEventType,
  type SubscriptionToken,
  type SubscriptionTokenPurpose,
} from './domain'
import type { SubscriptionTransaction, SubscriptionStore } from './ports'
import {
  createSubscriptionToken,
  hashSubscriptionToken,
  isSubscriptionToken,
  subscriptionTokenLifetimesMs,
} from './tokens'

/**
 * The outbox event a request queues: the email asking the reader to confirm. Its payload names the
 * subscriber and the consent to confirm, and nothing else: no address and no token, both of which
 * the email's handler (blog-0045.10) reads through `prepareConfirmation` when it sends.
 *
 * Until that handler is registered, the dispatcher dead-letters the event at once, as an
 * unsupported type: the row and its payload stay in the outbox, listed among the dead letters, but
 * are never tried again by themselves. Requeue them once the handler exists; a reader who asks
 * again queues a new one meanwhile.
 */
export const subscriptionConfirmEventType = 'email.subscription-confirm'

const minute = 60_000
const day = 24 * 60 * minute

/**
 * How often someone who has not confirmed is sent another confirmation email: not twice within a
 * minute, which absorbs a double submission, and not more than five times a day, whichever server
 * instance takes the request. A request past either cap is answered like any other and changes
 * nothing.
 */
export const confirmationRequestLimits = { minimumIntervalMs: minute, perDay: 5 } as const

export class SubscriptionInputError extends Error {
  readonly code = 'subscription_input' as const

  constructor(message: string) {
    super(message)
    this.name = 'SubscriptionInputError'
  }
}

export interface SubscribeInput {
  /** The version of the consent statement the form showed. */
  readonly consentTextVersion: string
  readonly email: string
  /** Where the form was, recorded with the consent. */
  readonly source: string
}

/**
 * What became of a request: `confirmation-queued` stored a consent and queued its confirmation
 * email; `already-confirmed` and `throttled` changed nothing. Callers must not tell the requester
 * which, or the form would reveal who subscribes.
 */
export type SubscribeOutcome = 'already-confirmed' | 'confirmation-queued' | 'throttled'
export type ConfirmOutcome = 'already-confirmed' | 'confirmed' | 'expired' | 'invalid'
export type UnsubscribeOutcome = 'already-unsubscribed' | 'expired' | 'invalid' | 'unsubscribed'

/** A token issued for one email, with the address the email goes to. */
export interface IssuedSubscriptionToken {
  readonly email: string
  readonly expiresAt: string
  readonly token: string
}

function throttled(consents: readonly SubscriberConsent[], now: number): boolean {
  const today = consents
    .map(({ grantedAt }) => Date.parse(grantedAt))
    .filter((grantedAt) => grantedAt > now - day)
  return (
    today.length >= confirmationRequestLimits.perDay ||
    today.some((grantedAt) => grantedAt > now - confirmationRequestLimits.minimumIntervalMs)
  )
}

/**
 * Newsletter subscriptions with confirmed (double) opt-in. A request stores a pending subscriber
 * and the consent given, and queues the confirmation email through the outbox, all in one
 * transaction. The email's link confirms; every newsletter's link unsubscribes in one step, which
 * withdraws the consent and keeps the record of it. Tokens are single-use, stored only as hashes,
 * and each is good for one action only.
 */
export class SubscriptionService {
  constructor(
    private readonly store: SubscriptionStore,
    private readonly clock: Clock = new SystemClock(),
    private readonly identifiers: IdentifierSource = new RandomIdentifierSource(),
  ) {}

  /**
   * Records a request to subscribe. A new address, or one that unsubscribed, becomes a pending
   * subscriber; a pending one is asked again, within `confirmationRequestLimits`; a confirmed one is
   * left as it is. Throws SubscriptionInputError for input the form should have refused.
   */
  async subscribe(input: SubscribeInput): Promise<SubscribeOutcome> {
    const email = canonicalEmailAddress(input.email)
    if (!email) throw new SubscriptionInputError('Enter a valid email address.')
    if (input.consentTextVersion !== subscriptionConsent.version) {
      throw new SubscriptionInputError('The consent statement has changed. Reload the page.')
    }
    if (!isConsentSource(input.source)) {
      throw new SubscriptionInputError('The subscription form names an unknown source.')
    }
    return this.store.transaction(async (transaction) => {
      const now = this.clock.now()
      const at = now.toISOString()
      const { created, subscriber } = await transaction.claimSubscriberByEmail({
        confirmedAt: null,
        createdAt: at,
        emailCanonical: email,
        id: this.identifiers.next('subscriber'),
        status: 'pending',
        unsubscribedAt: null,
        updatedAt: at,
      })
      if (subscriber.status === 'confirmed') return 'already-confirmed'
      if (!created && throttled(await transaction.listConsents(subscriber.id), now.valueOf())) {
        return 'throttled'
      }
      if (subscriber.status === 'unsubscribed') {
        await transaction.updateSubscriber({
          ...subscriber,
          confirmedAt: null,
          status: 'pending',
          unsubscribedAt: null,
          updatedAt: at,
        })
      }
      const consent: SubscriberConsent = {
        consentTextVersion: input.consentTextVersion,
        grantedAt: at,
        id: this.identifiers.next('consent'),
        source: input.source,
        subscriberId: subscriber.id,
        withdrawnAt: null,
      }
      await transaction.saveConsent(consent)
      await transaction.appendEvent(
        this.event(subscriber.id, 'confirmation-requested', consent.id, at),
      )
      await transaction.queueOutboxEvent({
        aggregateId: subscriber.id,
        attempts: 0,
        createdAt: at,
        id: this.identifiers.next('outbox'),
        lastError: null,
        payload: { consentId: consent.id, subscriberId: subscriber.id },
        status: 'pending',
        type: subscriptionConfirmEventType,
        updatedAt: at,
      })
      return 'confirmation-queued'
    })
  }

  /**
   * For the confirmation email's handler: a new token confirming the consent the event names, and
   * the address to send it to. Null once the subscriber no longer waits for confirmation or the
   * consent is unknown or withdrawn, so a late or repeated event sends nothing. Every call issues a
   * token of its own, and none replaces another: a retried delivery may reach the reader with any
   * of them, and the first one used confirms and uses up the rest.
   */
  async prepareConfirmation(input: {
    readonly consentId: string
    readonly subscriberId: string
  }): Promise<IssuedSubscriptionToken | null> {
    return this.store.transaction(async (transaction) => {
      const subscriber = await transaction.lockSubscriber(input.subscriberId)
      if (!subscriber || subscriber.status !== 'pending' || subscriber.emailCanonical === null) {
        return null
      }
      const consent = (await transaction.listConsents(subscriber.id)).find(
        ({ id }) => id === input.consentId,
      )
      if (!consent || consent.withdrawnAt !== null) return null
      return this.issue(
        transaction,
        subscriber.id,
        subscriber.emailCanonical,
        'confirm',
        consent.id,
      )
    })
  }

  /**
   * For an email to a confirmed subscriber: a new token for its unsubscribe link, and the address.
   * Null unless the subscriber is confirmed. Each email carries a token of its own.
   */
  async issueUnsubscribeToken(input: {
    readonly subscriberId: string
  }): Promise<IssuedSubscriptionToken | null> {
    return this.store.transaction(async (transaction) => {
      const subscriber = await transaction.lockSubscriber(input.subscriberId)
      if (!subscriber || subscriber.status !== 'confirmed' || subscriber.emailCanonical === null) {
        return null
      }
      return this.issue(transaction, subscriber.id, subscriber.emailCanonical, 'unsubscribe', null)
    })
  }

  /** Confirms the subscription a confirmation token was issued for, and uses up every such token. */
  async confirm(input: { readonly token: unknown }): Promise<ConfirmOutcome> {
    if (!isSubscriptionToken(input.token)) return 'invalid'
    const tokenHash = hashSubscriptionToken(input.token, 'confirm')
    return this.store.transaction(async (transaction) => {
      const held = await this.heldToken(transaction, tokenHash, 'confirm')
      if (!held) return 'invalid'
      const { subscriber, token } = held
      if (subscriber.status === 'confirmed') return 'already-confirmed'
      if (subscriber.status !== 'pending' || token.consumedAt !== null) return 'invalid'
      const now = this.clock.now()
      if (Date.parse(token.expiresAt) <= now.valueOf()) return 'expired'
      const at = now.toISOString()
      await transaction.updateSubscriber({
        ...subscriber,
        confirmedAt: at,
        status: 'confirmed',
        updatedAt: at,
      })
      await transaction.consumeTokens(subscriber.id, ['confirm'], at)
      await transaction.appendEvent(this.event(subscriber.id, 'confirmed', token.consentId, at))
      return 'confirmed'
    })
  }

  /**
   * Ends a subscription in one step, without signing in: the subscriber is unsubscribed, every
   * consent they gave is marked withdrawn and kept, and every token they hold is used up.
   */
  async unsubscribe(input: { readonly token: unknown }): Promise<UnsubscribeOutcome> {
    if (!isSubscriptionToken(input.token)) return 'invalid'
    const tokenHash = hashSubscriptionToken(input.token, 'unsubscribe')
    return this.store.transaction(async (transaction) => {
      const held = await this.heldToken(transaction, tokenHash, 'unsubscribe')
      if (!held) return 'invalid'
      const { subscriber, token } = held
      if (subscriber.status === 'unsubscribed') return 'already-unsubscribed'
      // A used token was spent by an earlier unsubscription, so it cannot end a newer subscription.
      if (token.consumedAt !== null) return 'invalid'
      const now = this.clock.now()
      if (Date.parse(token.expiresAt) <= now.valueOf()) return 'expired'
      const at = now.toISOString()
      await transaction.updateSubscriber({
        ...subscriber,
        status: 'unsubscribed',
        unsubscribedAt: at,
        updatedAt: at,
      })
      await transaction.withdrawConsents(subscriber.id, at)
      await transaction.consumeTokens(subscriber.id, ['confirm', 'unsubscribe'], at)
      await transaction.appendEvent(this.event(subscriber.id, 'unsubscribed', null, at))
      return 'unsubscribed'
    })
  }

  /**
   * The token with this hash and its subscriber, read under the subscriber's lock; null when the
   * token is unknown. The first read only finds whose token it is: the token is read again once
   * the lock is held, so a use of it that committed meanwhile is seen.
   */
  private async heldToken(
    transaction: SubscriptionTransaction,
    tokenHash: string,
    purpose: SubscriptionTokenPurpose,
  ) {
    const found = await transaction.getToken(tokenHash)
    if (!found || found.purpose !== purpose) return null
    const subscriber = await transaction.lockSubscriber(found.subscriberId)
    const token = await transaction.getToken(tokenHash)
    return subscriber && token ? { subscriber, token } : null
  }

  private async issue(
    transaction: SubscriptionTransaction,
    subscriberId: string,
    email: string,
    purpose: SubscriptionTokenPurpose,
    consentId: string | null,
  ): Promise<IssuedSubscriptionToken> {
    const now = this.clock.now()
    const token = createSubscriptionToken()
    const stored: SubscriptionToken = {
      consentId,
      consumedAt: null,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.valueOf() + subscriptionTokenLifetimesMs[purpose]).toISOString(),
      purpose,
      subscriberId,
      tokenHash: hashSubscriptionToken(token, purpose),
    }
    await transaction.saveToken(stored)
    return { email, expiresAt: stored.expiresAt, token }
  }

  private event(
    subscriberId: string,
    type: SubscriptionEventType,
    consentId: string | null,
    createdAt: string,
  ): SubscriptionEvent {
    return {
      consentId,
      createdAt,
      id: this.identifiers.next('subscription-event'),
      subscriberId,
      type,
    }
  }
}
