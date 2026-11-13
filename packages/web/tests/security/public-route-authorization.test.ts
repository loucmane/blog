import { randomBytes } from 'node:crypto'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ runtime: vi.fn(), sink: vi.fn() }))
vi.mock('@/server/subscriptions/runtime', () => ({ getSubscriptionRuntime: mocks.runtime }))
vi.mock('@/server/analytics/runtime', () => ({ getAnalyticsSink: mocks.sink }))

import { POST as subscribe } from '@/app/api/subscriptions/route'
import { POST as confirm } from '@/app/subscriptions/confirm/route'
import { POST as unsubscribe } from '@/app/subscriptions/unsubscribe/route'
import { POST as vitals } from '@/app/api/vitals/route'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { InMemorySubscriptionStore } from '@/server/subscriptions/in-memory-store'
import { SubscriptionService } from '@/server/subscriptions/service'
import { createSubscriptionRequestLimiter } from '@/server/subscriptions/rate-limit'
import { subscriptionConsent } from '@/server/subscriptions/consent'

const origin = 'https://magazine.example'
let store: InMemorySubscriptionStore
let repository: InMemoryContentRepository

beforeEach(async () => {
  vi.stubEnv('MAGAZINE_RUNTIME_SITE_URL', origin)
  repository = new InMemoryContentRepository()
  store = new InMemorySubscriptionStore(repository)
  const service = new SubscriptionService(store)
  mocks.runtime.mockReturnValue({ service, store, limiter: createSubscriptionRequestLimiter() })
  await service.subscribe({
    email: 'reader@example.test',
    source: 'subscription-form',
    consentTextVersion: subscriptionConsent.version,
  })
})
afterEach(() => vi.unstubAllEnvs())

async function snapshot() {
  return store.transaction(async (tx) => ({
    subscribers: await tx.listSubscribers(),
    events: await tx.listEvents(),
    consents: await tx.listConsents(),
    outbox: await tx.content.listOutboxEvents(),
  }))
}

it.each([confirm, unsubscribe])(
  'rejects missing and unknown bearer-link capabilities in %s without subscriber or outbox changes',
  async (run) => {
    const before = await snapshot()
    for (const query of ['', `?token=${randomBytes(32).toString('base64url')}`]) {
      const response = await run(
        new Request(`${origin}/subscriptions/link${query}`, { method: 'POST' }),
      )
      expect(response.status).toBe(404)
      expect(await snapshot()).toEqual(before)
      expect(response.headers.has('set-cookie')).toBe(false)
    }
  },
)

it.each([subscribe, vitals])(
  'rejects a foreign or missing origin in %s before consuming the body or storing data',
  async (run) => {
    const before = await snapshot()
    for (const requestOrigin of [undefined, 'https://other.example']) {
      const request = new Request(`${origin}/api/intake`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(requestOrigin ? { origin: requestOrigin } : {}),
        },
        body: JSON.stringify({
          email: 'new-reader@example.test',
          consentTextVersion: subscriptionConsent.version,
        }),
      })
      expect((await run(request)).status).toBe(403)
      expect(request.bodyUsed).toBe(false)
      expect(await snapshot()).toEqual(before)
      expect(mocks.sink).not.toHaveBeenCalled()
    }
  },
)
