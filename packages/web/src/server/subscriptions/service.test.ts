import { describe, expect, it } from 'vitest'

import type { OutboxEvent } from '../content/domain'
import { InMemoryContentRepository } from '../content/in-memory-repository'
import type { Clock, IdentifierSource } from '../content/ports'
import { InMemorySearch } from '../discovery/in-memory-search'
import { OutboxDispatcher } from '../outbox/dispatcher'
import { createOutboxHandlers } from '../outbox/handlers'
import { InMemoryOutboxStore } from '../outbox/in-memory-outbox-store'
import type { OutboxHandler } from '../outbox/ports'
import { subscriptionConsent } from './consent'
import { InMemorySubscriptionStore } from './in-memory-store'
import type { SubscriptionStore } from './ports'
import {
  confirmationRequestLimits,
  subscriptionConfirmEventType,
  SubscriptionInputError,
  SubscriptionService,
  type IssuedSubscriptionToken,
} from './service'
import { createSubscriptionToken, hashSubscriptionToken } from './tokens'

const minute = 60_000
const day = 24 * 60 * minute
const address = 'reader@example.com'

class TestClock implements Clock {
  constructor(private value: Date) {}

  advance(milliseconds: number) {
    this.value = new Date(this.value.valueOf() + milliseconds)
  }

  now(): Date {
    return new Date(this.value)
  }
}

class TestIdentifiers implements IdentifierSource {
  private sequence = 0

  next(kind: string): string {
    this.sequence += 1
    return `${kind}-${String(this.sequence).padStart(3, '0')}`
  }
}

/** The subscription service on the in-memory stores, sharing one content repository's outbox. */
function setup(wrap: (store: SubscriptionStore) => SubscriptionStore = (store) => store) {
  const clock = new TestClock(new Date('2026-11-03T09:00:00.000Z'))
  const repository = new InMemoryContentRepository()
  const store = new InMemorySubscriptionStore(repository)
  const service = new SubscriptionService(wrap(store), clock, new TestIdentifiers())
  const records = (email = address) =>
    store.transaction(async (transaction) => {
      const subscriber = await transaction.getSubscriberByEmail(email)
      if (!subscriber) return null
      return {
        consents: await transaction.listConsents(subscriber.id),
        events: await transaction.listEvents(subscriber.id),
        subscriber,
      }
    })
  const outbox = (): Promise<readonly OutboxEvent[]> =>
    repository.inspect((transaction) => transaction.listOutboxEvents())
  const request = (email = address) =>
    service.subscribe({
      consentTextVersion: subscriptionConsent.version,
      email,
      source: 'home/footer',
    })
  return { clock, outbox, records, repository, request, service, store }
}

type Setup = ReturnType<typeof setup>

/** What a confirmation email's handler reads from its event. */
function confirmationOf(event: OutboxEvent | undefined) {
  return {
    consentId: String(event?.payload.consentId),
    subscriberId: String(event?.payload.subscriberId),
  }
}

/** The token the newest confirmation email would carry. */
async function confirmationToken(env: Setup): Promise<IssuedSubscriptionToken> {
  const issued = await env.service.prepareConfirmation(confirmationOf((await env.outbox()).at(-1)))
  if (!issued) throw new Error('No confirmation token was issued.')
  return issued
}

async function confirmedSubscriber(env: Setup) {
  await env.request()
  expect(await env.service.confirm({ token: (await confirmationToken(env)).token })).toBe(
    'confirmed',
  )
  const subscriberId = (await env.records())?.subscriber.id ?? ''
  const unsubscribe = await env.service.issueUnsubscribeToken({ subscriberId })
  if (!unsubscribe) throw new Error('No unsubscribe token was issued.')
  return { subscriberId, unsubscribe }
}

/** Everything the store holds, as text, Maps included. */
function stored(env: Setup): string {
  return JSON.stringify((env.store as unknown as { state: unknown }).state, (_key, value) =>
    value instanceof Map ? [...value] : value,
  )
}

/** A store whose outbox refuses every event, after the subscription records are written. */
function refusingOutbox(store: SubscriptionStore): SubscriptionStore {
  return {
    transaction: (work) =>
      store.transaction((transaction) =>
        work(
          new Proxy(transaction, {
            get(target, property, receiver) {
              if (property === 'queueOutboxEvent') {
                return async () => {
                  throw new Error('The outbox is unavailable.')
                }
              }
              const value: unknown = Reflect.get(target, property, receiver)
              return typeof value === 'function' ? value.bind(target) : value
            },
          }),
        ),
      ),
  }
}

describe('subscription requests', () => {
  it('stores a pending subscriber, its consent and its confirmation email in one transaction', async () => {
    const env = setup()

    expect(await env.request(' Reader@Example.COM ')).toBe('confirmation-queued')

    const records = await env.records()
    expect(records).toEqual({
      consents: [
        {
          consentTextVersion: subscriptionConsent.version,
          grantedAt: '2026-11-03T09:00:00.000Z',
          id: 'consent-002',
          source: 'home/footer',
          subscriberId: 'subscriber-001',
          withdrawnAt: null,
        },
      ],
      events: [
        {
          consentId: 'consent-002',
          createdAt: '2026-11-03T09:00:00.000Z',
          id: 'subscription-event-003',
          subscriberId: 'subscriber-001',
          type: 'confirmation-requested',
        },
      ],
      subscriber: {
        confirmedAt: null,
        createdAt: '2026-11-03T09:00:00.000Z',
        emailCanonical: address,
        id: 'subscriber-001',
        status: 'pending',
        unsubscribedAt: null,
        updatedAt: '2026-11-03T09:00:00.000Z',
      },
    })
    // The email is queued through the outbox, naming the subscriber and consent and nothing else.
    expect(await env.outbox()).toEqual([
      {
        aggregateId: 'subscriber-001',
        attempts: 0,
        createdAt: '2026-11-03T09:00:00.000Z',
        id: 'outbox-004',
        lastError: null,
        payload: { consentId: 'consent-002', subscriberId: 'subscriber-001' },
        status: 'pending',
        type: subscriptionConfirmEventType,
        updatedAt: '2026-11-03T09:00:00.000Z',
      },
    ])
    expect(JSON.stringify(await env.outbox())).not.toContain('example.com')
  })

  it('keeps no subscriber or consent when the outbox cannot take the confirmation email', async () => {
    const env = setup(refusingOutbox)

    await expect(env.request()).rejects.toThrow('The outbox is unavailable.')

    expect(await env.records()).toBeNull()
    expect(await env.outbox()).toEqual([])
  })

  it('records a consent for each request it asks again for, once a minute and five times a day at most', async () => {
    const env = setup()
    const outcomes: string[] = []

    outcomes.push(await env.request())
    // A double submission asks nothing more.
    outcomes.push(await env.request())
    for (let request = 1; request < confirmationRequestLimits.perDay; request += 1) {
      env.clock.advance(minute)
      outcomes.push(await env.request())
    }
    env.clock.advance(minute)
    outcomes.push(await env.request())
    // A day after the first request, it falls out of the count.
    env.clock.advance(day - 5 * minute)
    outcomes.push(await env.request())

    expect(outcomes).toEqual([
      'confirmation-queued',
      'throttled',
      'confirmation-queued',
      'confirmation-queued',
      'confirmation-queued',
      'confirmation-queued',
      'throttled',
      'confirmation-queued',
    ])
    const records = await env.records()
    expect(records?.consents).toHaveLength(6)
    expect(records?.events.map(({ type }) => type)).toEqual(Array(6).fill('confirmation-requested'))
    expect((await env.outbox()).map(({ payload }) => payload.consentId)).toEqual(
      records?.consents.map(({ id }) => id),
    )
    expect(records?.subscriber.status).toBe('pending')
  })

  it('leaves a confirmed subscriber as it is', async () => {
    const env = setup()
    await confirmedSubscriber(env)
    const before = await env.records()
    const queued = (await env.outbox()).length

    expect(await env.request()).toBe('already-confirmed')

    expect(await env.records()).toEqual(before)
    expect(await env.outbox()).toHaveLength(queued)
  })

  it('claims one subscriber for concurrent requests naming one new address', async () => {
    const env = setup()

    const outcomes = await Promise.all([env.request(), env.request(), env.request()])

    expect(outcomes.sort()).toEqual(['confirmation-queued', 'throttled', 'throttled'])
    expect((await env.records())?.consents).toHaveLength(1)
    expect(await env.outbox()).toHaveLength(1)
  })

  it('refuses input the form should have refused, before anything is stored', async () => {
    const env = setup()
    const valid = {
      consentTextVersion: subscriptionConsent.version,
      email: address,
      source: 'home',
    }

    for (const input of [
      { ...valid, email: 'not an address' },
      { ...valid, consentTextVersion: 'newsletter-2020-01-01' },
      { ...valid, source: 'Home Page' },
    ]) {
      await expect(env.service.subscribe(input)).rejects.toBeInstanceOf(SubscriptionInputError)
    }
    expect(await env.records()).toBeNull()
  })
})

describe('subscription tokens', () => {
  it('confirms with a token issued for the queued email, stored only as its hash', async () => {
    const env = setup()
    await env.request()

    const issued = await confirmationToken(env)

    expect(issued.email).toBe(address)
    expect(issued.expiresAt).toBe('2026-11-06T09:00:00.000Z')
    // The store and the outbox hold the token's hash, never the token.
    expect(stored(env)).toContain(hashSubscriptionToken(issued.token, 'confirm'))
    expect(stored(env)).not.toContain(issued.token)
    expect(JSON.stringify(await env.outbox())).not.toContain(issued.token)

    env.clock.advance(minute)
    expect(await env.service.confirm({ token: issued.token })).toBe('confirmed')

    const records = await env.records()
    expect(records?.subscriber).toMatchObject({
      confirmedAt: '2026-11-03T09:01:00.000Z',
      status: 'confirmed',
    })
    expect(records?.events.at(-1)).toMatchObject({
      consentId: records?.consents[0]?.id,
      type: 'confirmed',
    })
  })

  it('uses a confirmation token once: every token of the request is spent by the first use', async () => {
    const env = setup()
    await env.request()
    // A retried delivery issued a second token; the reader may hold either.
    const first = await confirmationToken(env)
    const second = await confirmationToken(env)

    expect(await env.service.confirm({ token: second.token })).toBe('confirmed')
    expect(await env.service.confirm({ token: first.token })).toBe('already-confirmed')
    expect(await env.service.confirm({ token: second.token })).toBe('already-confirmed')
    expect((await env.records())?.events.filter(({ type }) => type === 'confirmed')).toHaveLength(1)

    // Once the subscription has ended and a new one is requested, neither can confirm it.
    const { unsubscribe } = await confirmedSubscriberState(env)
    expect(await env.service.unsubscribe({ token: unsubscribe.token })).toBe('unsubscribed')
    env.clock.advance(minute)
    expect(await env.request()).toBe('confirmation-queued')
    expect(await env.service.confirm({ token: first.token })).toBe('invalid')
    expect(await env.service.confirm({ token: second.token })).toBe('invalid')
    expect((await env.records())?.subscriber.status).toBe('pending')
  })

  it('scopes every token to the one action it was issued for', async () => {
    const env = setup()
    await env.request()
    const confirm = await confirmationToken(env)

    expect(await env.service.unsubscribe({ token: confirm.token })).toBe('invalid')
    expect(await env.service.confirm({ token: confirm.token })).toBe('confirmed')

    const subscriberId = (await env.records())?.subscriber.id ?? ''
    const unsubscribe = await env.service.issueUnsubscribeToken({ subscriberId })
    expect(await env.service.confirm({ token: unsubscribe?.token })).toBe('invalid')
    expect(stored(env)).not.toContain(hashSubscriptionToken(unsubscribe?.token ?? '', 'confirm'))
    expect((await env.records())?.subscriber.status).toBe('confirmed')
    expect(await env.service.unsubscribe({ token: unsubscribe?.token })).toBe('unsubscribed')
  })

  it('refuses an expired token, an unknown one and anything not shaped like a token', async () => {
    const env = setup()
    await env.request()
    const issued = await confirmationToken(env)
    env.clock.advance(3 * 24 * 60 * minute)

    expect(await env.service.confirm({ token: issued.token })).toBe('expired')
    expect(await env.service.confirm({ token: createSubscriptionToken() })).toBe('invalid')
    expect((await env.records())?.subscriber.status).toBe('pending')

    // A malformed value never reaches the store.
    const untouched = new SubscriptionService({
      transaction: () => Promise.reject(new Error('The store was read.')),
    })
    for (const token of [undefined, null, '', 'short', 42, { token: issued.token }]) {
      expect(await untouched.confirm({ token })).toBe('invalid')
      expect(await untouched.unsubscribe({ token })).toBe('invalid')
    }
  })

  it('issues tokens only while the subscriber is in the state its email is for', async () => {
    const env = setup()
    await env.request()
    const pending = confirmationOf((await env.outbox())[0])

    expect(
      await env.service.prepareConfirmation({ ...pending, subscriberId: 'subscriber-x' }),
    ).toBeNull()
    expect(await env.service.prepareConfirmation({ ...pending, consentId: 'consent-x' })).toBeNull()
    expect(await env.service.issueUnsubscribeToken(pending)).toBeNull()
    expect(await env.service.issueUnsubscribeToken({ subscriberId: 'subscriber-x' })).toBeNull()

    expect(await env.service.confirm({ token: (await confirmationToken(env)).token })).toBe(
      'confirmed',
    )
    // A late or repeated confirmation email sends nothing once the subscriber has confirmed.
    expect(await env.service.prepareConfirmation(pending)).toBeNull()
    const unsubscribe = await env.service.issueUnsubscribeToken(pending)
    expect(unsubscribe).toMatchObject({ email: address, expiresAt: '2027-11-03T09:00:00.000Z' })

    expect(await env.service.unsubscribe({ token: unsubscribe?.token })).toBe('unsubscribed')
    expect(await env.service.issueUnsubscribeToken(pending)).toBeNull()
    expect(await env.service.prepareConfirmation(pending)).toBeNull()
  })
})

/** The confirmed subscriber's id and a fresh unsubscribe token, for a subscriber confirmed already. */
async function confirmedSubscriberState(env: Setup) {
  const subscriberId = (await env.records())?.subscriber.id ?? ''
  const unsubscribe = await env.service.issueUnsubscribeToken({ subscriberId })
  if (!unsubscribe) throw new Error('The subscriber is not confirmed.')
  return { subscriberId, unsubscribe }
}

describe('unsubscribing', () => {
  it('unsubscribes in one step without signing in and keeps the withdrawal in the consent history', async () => {
    const env = setup()
    const { unsubscribe } = await confirmedSubscriber(env)
    const second = await env.service.issueUnsubscribeToken({
      subscriberId: (await env.records())?.subscriber.id ?? '',
    })
    env.clock.advance(day)

    expect(await env.service.unsubscribe({ token: unsubscribe.token })).toBe('unsubscribed')

    const records = await env.records()
    expect(records?.subscriber).toMatchObject({
      emailCanonical: address,
      status: 'unsubscribed',
      unsubscribedAt: '2026-11-04T09:00:00.000Z',
    })
    // The consent stays on record, withdrawn; the history gains the unsubscription.
    expect(records?.consents).toEqual([
      expect.objectContaining({
        consentTextVersion: subscriptionConsent.version,
        grantedAt: '2026-11-03T09:00:00.000Z',
        source: 'home/footer',
        withdrawnAt: '2026-11-04T09:00:00.000Z',
      }),
    ])
    expect(records?.events.map(({ consentId, type }) => [type, consentId])).toEqual([
      ['confirmation-requested', records?.consents[0]?.id],
      ['confirmed', records?.consents[0]?.id],
      ['unsubscribed', null],
    ])
    // Every link of the ended subscription now says so and changes nothing more.
    expect(await env.service.unsubscribe({ token: unsubscribe.token })).toBe('already-unsubscribed')
    expect(await env.service.unsubscribe({ token: second?.token })).toBe('already-unsubscribed')
    expect((await env.records())?.events).toHaveLength(3)
  })

  it('starts a new subscription for an address that unsubscribed, which an old link cannot end', async () => {
    const env = setup()
    const { unsubscribe } = await confirmedSubscriber(env)
    expect(await env.service.unsubscribe({ token: unsubscribe.token })).toBe('unsubscribed')
    env.clock.advance(day)

    expect(await env.request()).toBe('confirmation-queued')

    const records = await env.records()
    expect(records?.subscriber).toMatchObject({
      confirmedAt: null,
      status: 'pending',
      unsubscribedAt: null,
    })
    expect(records?.consents.map(({ withdrawnAt }) => withdrawnAt)).toEqual([
      '2026-11-03T09:00:00.000Z',
      null,
    ])
    expect(await env.service.unsubscribe({ token: unsubscribe.token })).toBe('invalid')

    expect(await env.service.confirm({ token: (await confirmationToken(env)).token })).toBe(
      'confirmed',
    )
    expect(await env.service.unsubscribe({ token: unsubscribe.token })).toBe('invalid')
    expect((await env.records())?.subscriber.status).toBe('confirmed')
  })

  it('refuses an unsubscribe token once it has expired', async () => {
    const env = setup()
    const { unsubscribe } = await confirmedSubscriber(env)
    env.clock.advance(365 * day)

    expect(await env.service.unsubscribe({ token: unsubscribe.token })).toBe('expired')
    expect((await env.records())?.subscriber.status).toBe('confirmed')
  })
})

describe('the confirmation email in the outbox', () => {
  function dispatcherFor(env: Setup, handlers: ReadonlyMap<string, OutboxHandler>) {
    const store = new InMemoryOutboxStore(env.repository)
    return { dispatcher: new OutboxDispatcher({ clock: env.clock, handlers, store }), store }
  }

  it('is dead-lettered at once while no handler sends it, and kept with its payload', async () => {
    const env = setup()
    await env.request()
    const [queued] = await env.outbox()
    const historicalHandlers = new Map(
      createOutboxHandlers({
        cache: { revalidate: async () => undefined },
        content: env.repository,
        search: new InMemorySearch(),
      }),
    )
    historicalHandlers.delete(subscriptionConfirmEventType)
    const { dispatcher, store } = dispatcherFor(env, historicalHandlers)

    expect(await dispatcher.drain()).toEqual({
      completed: [],
      deadLettered: [queued?.id],
      retrying: [],
    })

    // Set aside for the owner, not lost: the row stays, with what its handler will need.
    expect(await store.listDeadLetters()).toEqual([
      {
        ...queued,
        attempts: 1,
        deadLetteredAt: '2026-11-03T09:00:00.000Z',
        lastError: `unsupported event type: ${subscriptionConfirmEventType}`,
        status: 'dead_letter',
      },
    ])
    env.clock.advance(day)
    expect(await dispatcher.drain()).toEqual({ completed: [], deadLettered: [], retrying: [] })
    expect((await env.records())?.subscriber.status).toBe('pending')
  })

  it('carries all a handler needs to send the confirmation, and a repeat sends nothing', async () => {
    const env = setup()
    await env.request()
    const sent: IssuedSubscriptionToken[] = []
    const sendConfirmation: OutboxHandler = async (event) => {
      const issued = await env.service.prepareConfirmation(confirmationOf(event))
      if (issued) sent.push(issued)
    }
    const { dispatcher } = dispatcherFor(
      env,
      new Map([[subscriptionConfirmEventType, sendConfirmation]]),
    )

    expect((await dispatcher.drain()).completed).toHaveLength(1)
    expect(sent.map(({ email }) => email)).toEqual([address])
    expect(await env.service.confirm({ token: sent[0]?.token })).toBe('confirmed')

    await sendConfirmation((await env.outbox())[0] as OutboxEvent, {
      idempotencyKey: 'replay',
      signal: new AbortController().signal,
    })
    expect(sent).toHaveLength(1)
  })
})
