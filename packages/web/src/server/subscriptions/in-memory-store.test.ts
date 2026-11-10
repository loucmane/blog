import { describe, expect, it } from 'vitest'

import { InMemoryContentRepository } from '../content/in-memory-repository'
import type { Subscriber } from './domain'
import { InMemorySubscriptionStore } from './in-memory-store'

const at = '2026-11-03T09:00:00.000Z'
const subscriber: Subscriber & { readonly emailCanonical: string } = {
  confirmedAt: null,
  createdAt: at,
  emailCanonical: 'reader@example.com',
  id: 'subscriber-1',
  status: 'pending',
  unsubscribedAt: null,
  updatedAt: at,
}
const token = {
  consentId: null,
  consumedAt: null,
  createdAt: at,
  expiresAt: '2027-11-03T09:00:00.000Z',
  purpose: 'unsubscribe' as const,
  subscriberId: 'subscriber-1',
  tokenHash: 'a'.repeat(64),
}

function setup() {
  const repository = new InMemoryContentRepository()
  return { repository, store: new InMemorySubscriptionStore(repository) }
}

describe('in-memory subscription store', () => {
  it('restores anonymized identities and rolls token deletion and imports back with the content', async () => {
    const { store } = setup()
    await store.transaction(async (tx) => {
      await tx.insertSubscriber(subscriber)
      await tx.saveToken(token)
    })
    await expect(
      store.transaction(async (tx) => {
        await tx.deleteTokens(subscriber.id)
        await tx.insertSubscriber({
          ...subscriber,
          id: 'anonymized',
          emailCanonical: null,
          status: 'unsubscribed',
          unsubscribedAt: at,
        })
        throw new Error('rollback requested')
      }),
    ).rejects.toThrow('rollback requested')
    expect(await store.transaction((tx) => tx.getToken(token.tokenHash))).toEqual(token)
    expect(await store.transaction((tx) => tx.listSubscribers())).toEqual([subscriber])
    await store.transaction((tx) => tx.deleteTokens(subscriber.id))
    expect(await store.transaction((tx) => tx.getToken(token.tokenHash))).toBeNull()
    await expect(
      store.transaction((tx) => tx.insertSubscriber({ ...subscriber, id: 'duplicate-address' })),
    ).rejects.toThrow('already exists')
  })

  it('keeps the keys the database keeps', async () => {
    const { store } = setup()
    await store.transaction((transaction) => transaction.claimSubscriberByEmail(subscriber))
    const event = {
      consentId: null,
      createdAt: at,
      id: 'event-1',
      subscriberId: 'subscriber-1',
      type: 'unsubscribed' as const,
    }

    for (const write of [
      // Another address cannot take an id in use, and a token or event is stored once.
      () =>
        store.transaction((transaction) =>
          transaction.claimSubscriberByEmail({
            ...subscriber,
            emailCanonical: 'other@example.com',
          }),
        ),
      () =>
        store.transaction(async (transaction) => {
          await transaction.saveToken(token)
          await transaction.saveToken(token)
        }),
      () =>
        store.transaction(async (transaction) => {
          await transaction.appendEvent(event)
          await transaction.appendEvent(event)
        }),
      // Nothing is stored for a subscriber that does not exist.
      () =>
        store.transaction((transaction) =>
          transaction.saveToken({ ...token, subscriberId: 'subscriber-x' }),
        ),
      () =>
        store.transaction((transaction) =>
          transaction.updateSubscriber({ ...subscriber, id: 'subscriber-x' }),
        ),
    ]) {
      await expect(write()).rejects.toThrow()
    }
    expect(
      await store.transaction(async (transaction) => ({
        events: await transaction.listEvents('subscriber-1'),
        token: await transaction.getToken(token.tokenHash),
      })),
    ).toEqual({ events: [], token: null })
  })

  it('rolls the subscription records and the outbox back together when the work throws', async () => {
    const { repository, store } = setup()

    await expect(
      store.transaction(async (transaction) => {
        await transaction.claimSubscriberByEmail(subscriber)
        await transaction.queueOutboxEvent({
          aggregateId: 'subscriber-1',
          attempts: 0,
          createdAt: at,
          id: 'outbox-1',
          lastError: null,
          payload: {},
          status: 'pending',
          type: 'email.subscription-confirm',
          updatedAt: at,
        })
        throw new Error('The work failed.')
      }),
    ).rejects.toThrow('The work failed.')

    expect(
      await store.transaction((transaction) =>
        transaction.getSubscriberByEmail('reader@example.com'),
      ),
    ).toBeNull()
    expect(await repository.inspect((transaction) => transaction.listOutboxEvents())).toEqual([])
  })

  it('hands out copies, so a change outside a transaction stores nothing', async () => {
    const { store } = setup()
    const { subscriber: claimed } = await store.transaction((transaction) =>
      transaction.claimSubscriberByEmail(subscriber),
    )

    ;(claimed as { status: string }).status = 'confirmed'

    expect(
      (await store.transaction((transaction) => transaction.lockSubscriber('subscriber-1')))
        ?.status,
    ).toBe('pending')
  })
})
