import { describe, expect, it } from 'vitest'

import { InMemoryContentRepository } from '../content/in-memory-repository'
import { inspectPortableContentBundle } from '../content/portability'
import { createLogger } from '../observability/logger'
import { subscriptionConsent } from './consent'
import { InMemorySubscriptionStore } from './in-memory-store'
import { OwnerSubscriberOperations } from './owner-operations'
import type { SubscriptionStore } from './ports'
import { SubscriptionService } from './service'

const at = '2026-11-05T10:00:00.000Z'
const later = '2026-11-06T10:00:00.000Z'
const email = 'reader@example.com'

async function setup() {
  const repository = new InMemoryContentRepository()
  const store = new InMemorySubscriptionStore(repository)
  const lines: string[] = []
  const logger = createLogger({
    correlationId: 'privacy-test-0001',
    sink: (line) => lines.push(line),
  })
  const service = new SubscriptionService(store, { now: () => new Date(at) })
  await service.subscribe({
    email,
    consentTextVersion: subscriptionConsent.version,
    source: 'subscription-form',
  })
  const subscriber = (await store.transaction((transaction) =>
    transaction.getSubscriberByEmail(email),
  ))!
  const consent = (
    await store.transaction((transaction) => transaction.listConsents(subscriber.id))
  )[0]!
  const token = (await service.prepareConfirmation({
    subscriberId: subscriber.id,
    consentId: consent.id,
  }))!
  const operations = new OwnerSubscriberOperations(store, logger, { now: () => new Date(later) })
  return { repository, store, lines, logger, operations, subscriber, consent, token, service }
}

describe('owner subscriber operations', () => {
  it('returns aggregates, exports only the requested identity, and audits with a redacted correlation id', async () => {
    const env = await setup()
    await env.service.subscribe({
      email: 'other@example.com',
      consentTextVersion: subscriptionConsent.version,
      source: 'subscription-form',
    })
    expect(await env.operations.summary()).toEqual({
      confirmed: 0,
      pending: 2,
      unsubscribed: 0,
      newestSubscriptionAt: at,
    })
    const bundle = await env.operations.exportSubscriber(' Reader@Example.COM ')
    expect(inspectPortableContentBundle(bundle).status).toBe('valid')
    expect(bundle?.data.subscribers).toEqual([env.subscriber])
    expect(bundle?.data.consents).toEqual([env.consent])
    expect(bundle?.data.subscriptionEvents.at(-1)?.type).toBeDefined()
    expect(bundle?.data.subscriptionEvents.filter(({ type }) => type === 'exported')).toHaveLength(
      1,
    )
    expect(JSON.stringify(bundle)).not.toContain('other@example.com')
    expect(JSON.stringify(bundle)).not.toContain(env.token.token)
    expect(env.lines).toHaveLength(1)
    expect(JSON.parse(env.lines[0]!)).toMatchObject({
      message: 'subscriber.exported',
      correlationId: 'privacy-test-0001',
    })
    expect(env.lines.join('')).not.toContain(email)
  })

  it('requires typed confirmation, erases credentials, withdraws consent, and repeats without another event', async () => {
    const env = await setup()
    await expect(env.operations.eraseSubscriber(email, 'other@example.com')).rejects.toThrow(
      'same email',
    )
    expect(await env.operations.eraseSubscriber(email, email)).toBe('erased')
    expect(await env.operations.eraseSubscriber(email, email)).toBe('not-found')
    expect(await env.operations.exportSubscriber(email)).toBeNull()
    expect(await env.service.confirm({ token: env.token.token })).toBe('invalid')
    const records = await env.store.transaction(async (transaction) => ({
      subscriber: await transaction.lockSubscriber(env.subscriber.id),
      consents: await transaction.listConsents(env.subscriber.id),
      events: await transaction.listEvents(env.subscriber.id),
    }))
    expect(records.subscriber).toMatchObject({
      emailCanonical: null,
      status: 'unsubscribed',
      unsubscribedAt: later,
    })
    expect(records.consents).toEqual([{ ...env.consent, withdrawnAt: later }])
    expect(records.events.filter(({ type }) => type === 'erased')).toHaveLength(1)
    expect(records.events.find(({ type }) => type === 'erased')).toMatchObject({
      consentId: null,
      createdAt: later,
    })
    expect(env.lines).toHaveLength(1)
    expect(env.lines.join('')).not.toContain(email)
    // A fresh subscription gets its own identity; old consent is never reassigned.
    await env.service.subscribe({
      email,
      consentTextVersion: subscriptionConsent.version,
      source: 'subscription-form',
    })
    expect(
      (await env.store.transaction((transaction) => transaction.getSubscriberByEmail(email)))?.id,
    ).not.toBe(env.subscriber.id)
  })

  it.each(['export', 'erase'] as const)(
    'rolls back %s when the audit cannot be appended and emits no success log',
    async (operation) => {
      const env = await setup()
      const refusing: SubscriptionStore = {
        transaction: (work) =>
          env.store.transaction((transaction) =>
            work(
              new Proxy(transaction, {
                get(target, key, receiver) {
                  if (key === 'appendEvent')
                    return async () => {
                      throw new Error('audit unavailable')
                    }
                  const value: unknown = Reflect.get(target, key, receiver)
                  return typeof value === 'function' ? value.bind(target) : value
                },
              }),
            ),
          ),
      }
      const operations = new OwnerSubscriberOperations(refusing, env.logger)
      await expect(
        operation === 'export'
          ? operations.exportSubscriber(email)
          : operations.eraseSubscriber(email, email),
      ).rejects.toThrow('audit unavailable')
      expect(
        await env.store.transaction((transaction) => transaction.getSubscriberByEmail(email)),
      ).toEqual(env.subscriber)
      expect(await env.service.confirm({ token: env.token.token })).toBe('confirmed')
      expect(env.lines).toEqual([])
    },
  )

  it('reports unknown addresses without audit records and rejects invalid input', async () => {
    const env = await setup()
    expect(await env.operations.exportSubscriber('unknown@example.com')).toBeNull()
    expect(await env.operations.eraseSubscriber('unknown@example.com', 'unknown@example.com')).toBe(
      'not-found',
    )
    await expect(env.operations.exportSubscriber('invalid')).rejects.toThrow('valid email')
    expect(env.lines).toEqual([])
  })
})
