import type { SubscriptionTransaction } from './ports'

/** Caller holds the subscriber lock; the consent and event identities remain intact. */
export async function eraseSubscriber(
  transaction: SubscriptionTransaction,
  subscriberId: string,
  now: string,
): Promise<'erased' | 'already-erased' | 'not-found'> {
  const subscriber = await transaction.lockSubscriber(subscriberId)
  if (!subscriber) return 'not-found'
  if (subscriber.emailCanonical === null) return 'already-erased'
  await transaction.deleteTokens(subscriber.id)
  await transaction.withdrawConsents(subscriber.id, now)
  await transaction.updateSubscriber({
    ...subscriber,
    emailCanonical: null,
    confirmedAt: null,
    status: 'unsubscribed',
    unsubscribedAt: subscriber.unsubscribedAt ?? now,
    updatedAt: now,
  })
  return 'erased'
}
