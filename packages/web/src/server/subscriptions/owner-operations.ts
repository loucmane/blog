import { randomUUID } from 'node:crypto'

import { createPortableSubscriberBundle } from '../content/portability'
import type { Clock, IdentifierSource } from '../content/ports'
import type { Logger } from '../observability/logger'
import { canonicalEmailAddress } from './domain'
import { eraseSubscriber } from './erasure'
import type { SubscriptionStore } from './ports'

export class SubscriberInputError extends Error {
  constructor(readonly reason: 'invalid-address' | 'confirmation-mismatch') {
    super(
      reason === 'invalid-address'
        ? 'Enter a valid email address.'
        : 'Type the same email address in both fields to confirm deletion.',
    )
  }
}

export const subscriberMessages = {
  erased:
    'The email address and subscription links were deleted. The anonymized consent history was kept.',
  'already-erased': 'Personal data was already deleted. Nothing was changed.',
  'not-found': 'No subscriber with that address; nothing was deleted.',
  'export-not-found': 'No subscriber with that address; nothing was exported.',
  'invalid-address': 'Enter a valid email address.',
  'confirmation-mismatch': 'Type the same email address in both fields to confirm deletion.',
  unavailable: 'Subscriber information is unavailable. Try again shortly.',
} as const

function address(value: unknown): string {
  const canonical = canonicalEmailAddress(value)
  if (canonical === null) throw new SubscriberInputError('invalid-address')
  return canonical
}

/** The same three operations for the owner page, API, and host maintainer command. */
export class OwnerSubscriberOperations {
  constructor(
    private readonly store: SubscriptionStore,
    private readonly logger: Logger,
    private readonly clock: Clock = { now: () => new Date() },
    private readonly identifiers: IdentifierSource = { next: (kind) => `${kind}-${randomUUID()}` },
  ) {}

  summary() {
    return this.store.transaction((transaction) => transaction.subscriberSummary())
  }

  async exportSubscriber(email: unknown) {
    const canonical = address(email)
    const bundle = await this.store.transaction(async (transaction) => {
      const found = await transaction.getSubscriberByEmail(canonical)
      if (!found) return null
      const subscriber = await transaction.lockSubscriber(found.id)
      // Erasure can commit between the lookup and the lock.
      if (!subscriber || subscriber.emailCanonical !== canonical) return null
      const now = this.clock.now().toISOString()
      await transaction.appendEvent({
        id: this.identifiers.next('subscription-event'),
        subscriberId: subscriber.id,
        consentId: null,
        type: 'exported',
        createdAt: now,
      })
      return createPortableSubscriberBundle(
        subscriber,
        await transaction.listConsents(subscriber.id),
        await transaction.listEvents(subscriber.id),
        now,
      )
    })
    if (bundle)
      this.logger.info('subscriber.exported', {
        email: canonical,
        subscriberId: bundle.data.subscribers[0]!.id,
      })
    return bundle
  }

  async eraseSubscriber(email: unknown, confirmation: unknown) {
    const canonical = address(email)
    if (canonicalEmailAddress(confirmation) !== canonical)
      throw new SubscriberInputError('confirmation-mismatch')
    const result = await this.store.transaction(async (transaction) => {
      const found = await transaction.getSubscriberByEmail(canonical)
      if (!found) return 'not-found' as const
      const subscriber = await transaction.lockSubscriber(found.id)
      if (!subscriber || subscriber.emailCanonical !== canonical) return 'already-erased' as const
      const now = this.clock.now().toISOString()
      const status = await eraseSubscriber(transaction, subscriber.id, now)
      if (status === 'erased')
        await transaction.appendEvent({
          id: this.identifiers.next('subscription-event'),
          subscriberId: subscriber.id,
          consentId: null,
          type: 'erased',
          createdAt: now,
        })
      return status
    })
    if (result === 'erased') this.logger.info('subscriber.erased', { email: canonical })
    return result
  }
}
