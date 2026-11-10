import { describe, expect, it } from 'vitest'

import { InMemoryContentRepository } from '../content/in-memory-repository'
import { eraseSubscriber } from './erasure'
import { InMemorySubscriptionStore } from './in-memory-store'

describe('subscriber erasure', () => {
  it('recognizes missing and already-erased identities without moving retained dates', async () => {
    const store = new InMemorySubscriptionStore(new InMemoryContentRepository())
    const at = '2026-11-05T10:00:00.000Z'
    expect(await store.transaction((tx) => eraseSubscriber(tx, 'missing', at))).toBe('not-found')
    const anonymized = {
      id: 'erased',
      emailCanonical: null,
      status: 'unsubscribed' as const,
      confirmedAt: null,
      createdAt: at,
      updatedAt: at,
      unsubscribedAt: at,
    }
    await store.transaction((tx) => tx.insertSubscriber(anonymized))
    expect(
      await store.transaction((tx) => eraseSubscriber(tx, 'erased', '2026-12-01T10:00:00.000Z')),
    ).toBe('already-erased')
    expect(await store.transaction((tx) => tx.lockSubscriber('erased'))).toEqual(anonymized)
  })
})
