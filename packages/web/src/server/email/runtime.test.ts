import type { Pool } from 'pg'
import { describe, expect, it, vi } from 'vitest'

const { owner, subscriptionRuntime } = vi.hoisted(() => ({
  owner: vi.fn(),
  subscriptionRuntime: vi.fn(),
}))
vi.mock('../owner/runtime', () => ({ getOwnerRuntime: owner }))
vi.mock('../subscriptions/runtime', () => ({ getSubscriptionRuntime: subscriptionRuntime }))

import { InMemoryContentRepository } from '../content/in-memory-repository'
import { PostgresContentRepository } from '../database/postgres-content-repository'
import { InMemorySearch } from '../discovery/in-memory-search'
import { createLogger } from '../observability/logger'
import { OutboxDispatcher } from '../outbox/dispatcher'
import { createOutboxHandlers } from '../outbox/handlers'
import { InMemoryOutboxStore } from '../outbox/in-memory-outbox-store'
import { subscriptionConsent } from '../subscriptions/consent'
import { InMemorySubscriptionStore } from '../subscriptions/in-memory-store'
import { SubscriptionService } from '../subscriptions/service'
import { consoleEmailSender } from './console'
import { emailDeliveryFor } from './runtime'

describe('default email delivery wiring', () => {
  it('uses the existing owner test subscription store and a shared console sender, only when dispatched', async () => {
    const repository = new InMemoryContentRepository()
    const service = new SubscriptionService(new InMemorySubscriptionStore(repository))
    owner.mockReturnValue({ repository })
    subscriptionRuntime.mockReturnValue({ service })
    const send = vi.spyOn(consoleEmailSender, 'send')
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    await service.subscribe({
      email: 'reader@example.com',
      source: 'subscription-form',
      consentTextVersion: subscriptionConsent.version,
    })
    const handlers = createOutboxHandlers({
      content: repository,
      search: new InMemorySearch(),
      cache: { revalidate: async () => undefined },
    })
    expect(owner).not.toHaveBeenCalled()
    expect(subscriptionRuntime).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
    const dispatcher = new OutboxDispatcher({
      handlers,
      store: new InMemoryOutboxStore(repository),
      logger: createLogger({ correlationId: 'email-default-test', sink: () => undefined }),
    })
    expect((await dispatcher.dispatchNext())?.outcome).toBe('completed')
    expect(send).toHaveBeenCalledOnce()
    expect(emailDeliveryFor(repository).sender).toBe(consoleEmailSender)
    expect(emailDeliveryFor(repository).subscriptions).toBe(service)
  })

  it('reads subscriptions from the supplied PostgreSQL repository without selecting another runtime', async () => {
    const query = vi.fn(async () => ({ rows: [] }))
    const pool = { connect: async () => ({ query, release: vi.fn() }) } as unknown as Pool
    const repository = new PostgresContentRepository(pool)
    const delivery = emailDeliveryFor(repository)
    expect(delivery.sender).toBe(consoleEmailSender)
    expect(
      await delivery.subscriptions.prepareConfirmation({
        subscriberId: 'missing',
        consentId: 'missing',
      }),
    ).toBeNull()
    expect(query.mock.calls.length).toBeGreaterThan(0)
    expect(owner).not.toHaveBeenCalled()
    expect(subscriptionRuntime).not.toHaveBeenCalled()
  })

  it('refuses an unrelated fixture store or missing subscription runtime instead of silently dropping email', () => {
    const repository = new InMemoryContentRepository()
    owner.mockReturnValue({ repository: new InMemoryContentRepository() })
    expect(() => emailDeliveryFor(repository)).toThrow('dispatcher content store')
    owner.mockReturnValue({ repository })
    subscriptionRuntime.mockReturnValue(null)
    expect(() => emailDeliveryFor(repository)).toThrow('subscription runtime')
  })
})
