import { Pool } from 'pg'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { InMemoryContentRepository } from '../content/in-memory-repository'
import { PostgresContentRepository } from '../database/postgres-content-repository'
import { PostgresSubscriptionStore } from '../database/postgres-subscriptions'
import { OwnerConfigurationError } from '../owner/config'
import { subscriptionConsent } from './consent'
import { InMemorySubscriptionStore } from './in-memory-store'
import { createSubscriptionRuntime, getSubscriptionRuntime } from './runtime'
import { subscriptionConfirmEventType } from './service'
import { OwnerSubscriberOperations } from './owner-operations'
import { createLogger } from '../observability/logger'

const runtimeSymbol = Symbol.for('magazine.subscription-runtime')

function storeOf(runtime: ReturnType<typeof createSubscriptionRuntime>) {
  return (runtime.service as unknown as { store: unknown }).store
}

afterEach(() => {
  delete (globalThis as unknown as Record<symbol, unknown>)[runtimeSymbol]
})

describe('subscription runtime', () => {
  it('keeps subscriptions on PostgreSQL when the owner runtime has a pool', async () => {
    const pool = new Pool({ connectionString: 'postgresql://reader@127.0.0.1:1/magazine' })

    const runtime = createSubscriptionRuntime({
      pool,
      repository: new PostgresContentRepository(pool),
    })

    expect(storeOf(runtime)).toBeInstanceOf(PostgresSubscriptionStore)
    expect(runtime.limiter.address).not.toBe(runtime.limiter.network)
    await pool.end()
  })

  it("queues into the owner test mode's in-memory outbox when there is no pool", async () => {
    const repository = new InMemoryContentRepository()
    const runtime = createSubscriptionRuntime({ pool: null, repository })

    expect(storeOf(runtime)).toBeInstanceOf(InMemorySubscriptionStore)
    await runtime.service.subscribe({
      consentTextVersion: subscriptionConsent.version,
      email: 'reader@example.com',
      source: 'subscription-form',
    })
    expect(
      (await repository.inspect((transaction) => transaction.listOutboxEvents())).map(
        ({ type }) => type,
      ),
    ).toEqual([subscriptionConfirmEventType])
    const operations = new OwnerSubscriberOperations(
      runtime.store,
      createLogger({ correlationId: 'shared-runtime-test', sink: () => undefined }),
    )
    expect(await operations.summary()).toMatchObject({ pending: 1 })
    expect(
      (await operations.exportSubscriber('reader@example.com'))?.data.subscribers,
    ).toHaveLength(1)
  })

  it('is made once for the process', () => {
    const owner = vi.fn(() => ({ pool: null, repository: new InMemoryContentRepository() }))

    const first = getSubscriptionRuntime(owner)

    expect(first).not.toBeNull()
    expect(getSubscriptionRuntime(owner)).toBe(first)
    expect(owner).toHaveBeenCalledOnce()
  })

  it.each([
    [
      'a configuration error',
      new OwnerConfigurationError('The owner workspace requires PostgreSQL.'),
    ],
    ['an error coded as one', Object.assign(new Error('missing'), { code: 'owner_configuration' })],
  ])('is null while the owner runtime reports %s, and tries again later', (_case, error) => {
    const unconfigured = () => {
      throw error
    }

    expect(getSubscriptionRuntime(unconfigured)).toBeNull()
    expect(
      getSubscriptionRuntime(() => ({ pool: null, repository: new InMemoryContentRepository() })),
    ).not.toBeNull()
  })

  it('lets any other failure through', () => {
    const broken = () => {
      throw new Error('The pool could not be made.')
    }

    expect(() => getSubscriptionRuntime(broken)).toThrow('The pool could not be made.')
  })
})
