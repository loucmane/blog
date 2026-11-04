import { describe, expect, it, vi } from 'vitest'

import type { OutboxEvent } from '../content/domain'
import { InMemoryContentRepository } from '../content/in-memory-repository'
import type { Clock } from '../content/ports'
import { subscriptionConsent } from './consent'
import { InMemorySubscriptionStore } from './in-memory-store'
import { createSubscriptionRequestLimiter, type SubscriptionRequestLimiter } from './rate-limit'
import {
  answerConfirmation,
  answerConfirmationLink,
  answerSubscriptionRequest,
  answerUnsubscribe,
  answerUnsubscribeLink,
  maxSubscriptionRequestBytes,
  subscriptionsUnavailable,
} from './requests'
import { SubscriptionService, type SubscribeOutcome } from './service'
import { createSubscriptionToken, subscriptionLinkPath } from './tokens'

const siteUrl = new URL('http://127.0.0.1:3000/')
const minute = 60_000

class TestClock implements Clock {
  constructor(private value: Date) {}

  advance(milliseconds: number) {
    this.value = new Date(this.value.valueOf() + milliseconds)
  }

  now(): Date {
    return new Date(this.value)
  }
}

function setup() {
  const clock = new TestClock(new Date('2026-11-03T09:00:00.000Z'))
  const repository = new InMemoryContentRepository()
  const store = new InMemorySubscriptionStore(repository)
  const service = new SubscriptionService(store, clock)
  const outcomes: SubscribeOutcome[] = []
  const recording: Pick<SubscriptionService, 'subscribe'> = {
    subscribe: async (input) => {
      const outcome = await service.subscribe(input)
      outcomes.push(outcome)
      return outcome
    },
  }
  const limiter: SubscriptionRequestLimiter = createSubscriptionRequestLimiter()
  let networks = 0
  /** A request from the site's own form, from a new network unless one is named. */
  const subscribe = (
    body: unknown,
    options: { headers?: Record<string, string>; network?: string } = {},
  ) => {
    networks += 1
    return answerSubscriptionRequest(
      new Request(new URL('/api/subscriptions', siteUrl), {
        body: typeof body === 'string' ? body : JSON.stringify(body),
        headers: {
          'content-type': 'application/json',
          origin: siteUrl.origin,
          'x-real-ip': options.network ?? `198.51.100.${networks}`,
          ...options.headers,
        },
        method: 'POST',
      }),
      { limiter, now: () => clock.now().valueOf(), service: recording, siteUrl },
    )
  }
  const outbox = (): Promise<readonly OutboxEvent[]> =>
    repository.inspect((transaction) => transaction.listOutboxEvents())
  const status = (email: string) =>
    store.transaction(
      async (transaction) => (await transaction.getSubscriberByEmail(email))?.status,
    )
  return { clock, limiter, outbox, outcomes, service, status, store, subscribe }
}

type Setup = ReturnType<typeof setup>

function form(email: string, extra: Record<string, unknown> = {}) {
  return { consentTextVersion: subscriptionConsent.version, email, ...extra }
}

function subscriberIdOf(env: Setup, email: string): Promise<string> {
  return env.store.transaction(
    async (transaction) => (await transaction.getSubscriberByEmail(email))?.id ?? '',
  )
}

/** The token the address's newest confirmation email would carry. */
async function confirmationToken(env: Setup, email: string): Promise<string> {
  const subscriberId = await subscriberIdOf(env, email)
  const event = (await env.outbox())
    .filter(({ aggregateId }) => aggregateId === subscriberId)
    .at(-1)
  const issued = await env.service.prepareConfirmation({
    consentId: String(event?.payload.consentId),
    subscriberId,
  })
  if (!issued) throw new Error(`No confirmation token for ${email}.`)
  return issued.token
}

async function unsubscribeToken(env: Setup, email: string): Promise<string> {
  const issued = await env.service.issueUnsubscribeToken({
    subscriberId: await subscriberIdOf(env, email),
  })
  if (!issued) throw new Error(`${email} is not confirmed.`)
  return issued.token
}

async function bytes(response: Response) {
  return {
    body: new Uint8Array(await response.arrayBuffer()),
    headers: [...response.headers],
    status: response.status,
  }
}

function link(path: string, method: 'GET' | 'POST' = 'GET', init: RequestInit = {}) {
  return new Request(new URL(path, siteUrl), { method, ...init })
}

describe('subscription request', () => {
  it('answers an address that is new, pending, asked too often, confirmed or unsubscribed with the same bytes', async () => {
    const env = setup()
    await env.service.subscribe({ ...form('pending@example.com'), source: 'subscription-form' })
    await env.service.subscribe({ ...form('confirmed@example.com'), source: 'subscription-form' })
    await env.service.subscribe({ ...form('gone@example.com'), source: 'subscription-form' })
    await env.service.confirm({ token: await confirmationToken(env, 'confirmed@example.com') })
    await env.service.confirm({ token: await confirmationToken(env, 'gone@example.com') })
    await env.service.unsubscribe({ token: await unsubscribeToken(env, 'gone@example.com') })
    env.clock.advance(minute)
    await env.service.subscribe({ ...form('asked@example.com'), source: 'subscription-form' })

    const answers = []
    for (const email of [
      'new@example.com',
      'pending@example.com',
      'asked@example.com',
      'confirmed@example.com',
      'gone@example.com',
    ]) {
      answers.push(await bytes(await env.subscribe(form(email))))
    }

    // Underneath, each was handled differently.
    expect(env.outcomes).toEqual([
      'confirmation-queued',
      'confirmation-queued',
      'throttled',
      'already-confirmed',
      'confirmation-queued',
    ])
    expect(answers[0]?.status).toBe(202)
    expect(answers[0]?.headers).toEqual([
      ['cache-control', 'private, no-store'],
      ['content-type', 'application/json; charset=utf-8'],
      ['referrer-policy', 'no-referrer'],
      ['x-robots-tag', 'noindex, nofollow'],
    ])
    for (const answer of answers.slice(1)) expect(answer).toEqual(answers[0])
    expect(JSON.parse(new TextDecoder().decode(answers[0]?.body))).toEqual({
      message:
        'Thank you. If this address still has to confirm its subscription, look for our email with the link to confirm it.',
    })
  })

  it('records the consent with the source the form names, or the default one', async () => {
    const env = setup()

    await env.subscribe(form('reader@example.com', { source: 'stories/footer' }))
    await env.subscribe(form('other@example.com'))

    const sources = await env.store.transaction(async (transaction) =>
      Promise.all(
        ['reader@example.com', 'other@example.com'].map(async (email) => {
          const subscriber = await transaction.getSubscriberByEmail(email)
          return (await transaction.listConsents(subscriber?.id ?? ''))[0]?.source
        }),
      ),
    )
    expect(sources).toEqual(['stories/footer', 'subscription-form'])
  })

  it.each([
    ['another origin', { origin: 'https://elsewhere.example' }],
    ['a cross-site fetch without an origin', { origin: '', 'sec-fetch-site': 'cross-site' }],
    ['no origin at all', { origin: '' }],
  ])('refuses a request from %s before counting or reading it', async (_case, headers) => {
    const env = setup()
    const subscribe = vi.spyOn(env.service, 'subscribe')
    const cleaned = Object.fromEntries(Object.entries(headers).filter(([, value]) => value))

    const response = await answerSubscriptionRequest(
      new Request(new URL('/api/subscriptions', siteUrl), {
        body: JSON.stringify(form('reader@example.com')),
        headers: { 'content-type': 'application/json', ...cleaned },
        method: 'POST',
      }),
      { limiter: env.limiter, service: env.service, siteUrl },
    )

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Subscribe with the form on this site.' })
    expect(subscribe).not.toHaveBeenCalled()
    expect(env.limiter.network.size).toBe(0)
  })

  it.each(['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data'])(
    'refuses a %s body',
    async (contentType) => {
      const env = setup()

      const response = await env.subscribe(form('reader@example.com'), {
        headers: { 'content-type': contentType },
      })

      expect(response.status).toBe(415)
      expect(env.outcomes).toEqual([])
    },
  )

  it.each([
    ['broken JSON', '{"email":', 400, 'The subscription request is not valid.'],
    ['a list', '[]', 400, 'The subscription request is not valid.'],
    [
      'no address',
      { consentTextVersion: subscriptionConsent.version },
      400,
      'The subscription request is not valid.',
    ],
    [
      'an address that is not text',
      form('x', { email: 42 }),
      400,
      'The subscription request is not valid.',
    ],
    [
      'an unknown field',
      form('reader@example.com', { name: 'Reader' }),
      400,
      'The subscription request is not valid.',
    ],
    [
      'a source that is not a short path',
      form('reader@example.com', { source: 'Front Page' }),
      400,
      'The subscription request is not valid.',
    ],
    [
      'a body too large to read',
      form('reader@example.com', { source: 'a'.repeat(maxSubscriptionRequestBytes) }),
      413,
      'The subscription request is too large.',
    ],
    ['an invalid address', form('reader@localhost'), 400, 'Enter a valid email address.'],
    [
      'an older consent statement',
      form('reader@example.com', { consentTextVersion: 'newsletter-2020-01-01' }),
      409,
      'The consent statement has changed. Reload the page, then try again.',
    ],
  ])('refuses %s without storing anything', async (_case, body, status, error) => {
    const env = setup()

    const response = await env.subscribe(body)

    expect(response.status).toBe(status)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(await response.json()).toEqual({ error })
    expect(env.outcomes).toEqual([])
    expect(await env.outbox()).toEqual([])
  })

  it('counts every request against its network before reading it', async () => {
    const env = setup()
    const network = '192.0.2.10'

    for (let request = 0; request < 10; request += 1) {
      expect((await env.subscribe(form(`reader${request}@example.com`), { network })).status).toBe(
        202,
      )
    }
    const limited = await env.subscribe(form('another@example.com'), { network })
    const unread = await env.subscribe('{"not": "read"', { network })

    for (const response of [limited, unread]) {
      expect(response.status).toBe(429)
      expect(response.headers.get('retry-after')).toBe('600')
      expect(await response.json()).toEqual({
        error: 'Too many requests. Wait a few minutes, then try again.',
      })
    }
    expect((await env.subscribe(form('another@example.com'))).status).toBe(202)
    env.clock.advance(10 * minute)
    expect((await env.subscribe(form('later@example.com'), { network })).status).toBe(202)
  })

  it('counts nothing by network when no proxy reports one, and still limits each address', async () => {
    const env = setup()
    const unreported = { network: '' }

    for (let request = 0; request < 12; request += 1) {
      expect((await env.subscribe(form(`reader${request}@example.com`), unreported)).status).toBe(
        202,
      )
    }

    expect(env.limiter.network.size).toBe(0)
    for (let request = 0; request < 2; request += 1) {
      expect((await env.subscribe(form('reader0@example.com'), unreported)).status).toBe(202)
    }
    expect((await env.subscribe(form('reader0@example.com'), unreported)).status).toBe(429)
  })

  it('limits each address alike, whatever its state, from any network', async () => {
    const env = setup()
    await env.service.subscribe({ ...form('confirmed@example.com'), source: 'subscription-form' })
    await env.service.confirm({ token: await confirmationToken(env, 'confirmed@example.com') })

    const answers = []
    for (const email of ['new@example.com', 'confirmed@example.com']) {
      for (let request = 0; request < 3; request += 1) {
        expect((await env.subscribe(form(email))).status).toBe(202)
      }
      answers.push(await bytes(await env.subscribe(form(email))))
    }

    expect(answers[0]?.status).toBe(429)
    expect(answers[1]).toEqual(answers[0])
    expect(answers[0]?.headers).toContainEqual(['retry-after', '3600'])
  })

  it('answers 503 when the store fails, and logs no address', async () => {
    const env = setup()
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.spyOn(env.service, 'subscribe').mockRejectedValue(
      Object.assign(new Error('Key (email_canonical)=(reader@example.com) already exists.'), {
        code: '23505',
      }),
    )
    const limiter = createSubscriptionRequestLimiter()

    const response = await answerSubscriptionRequest(
      new Request(new URL('/api/subscriptions', siteUrl), {
        body: JSON.stringify(form('reader@example.com')),
        headers: { 'content-type': 'application/json', origin: siteUrl.origin },
        method: 'POST',
      }),
      { limiter, service: env.service, siteUrl },
    )

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({
      error: 'Subscriptions are unavailable right now. Try again later.',
    })
    expect(log).toHaveBeenCalledWith('A subscription request could not be stored (23505).')
    expect(JSON.stringify(log.mock.calls)).not.toContain('reader@example.com')
  })

  it('answers 503 while subscriptions have no store', async () => {
    const response = subscriptionsUnavailable()

    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
  })
})

describe('confirmation and unsubscribe links', () => {
  it('opens a confirmation link on a page whose one button posts it back, and changes nothing', async () => {
    const env = setup()
    await env.subscribe(form('reader@example.com'))
    const token = await confirmationToken(env, 'reader@example.com')

    const response = answerConfirmationLink(link(subscriptionLinkPath('confirm', token)))
    const page = await response.text()

    expect(response.status).toBe(200)
    expect(Object.fromEntries(response.headers)).toEqual({
      'cache-control': 'private, no-store',
      'content-type': 'text/html; charset=utf-8',
      'referrer-policy': 'no-referrer',
      'x-robots-tag': 'noindex, nofollow',
    })
    expect(page).toContain('<h1>Confirm your subscription</h1>')
    expect(page).toContain(`<form method="post" action="/subscriptions/confirm?token=${token}">`)
    expect(page).toContain('<button type="submit">Confirm my subscription</button>')
    expect(page).toContain('<meta name="referrer" content="no-referrer">')
    expect(await env.status('reader@example.com')).toBe('pending')
  })

  it('confirms in one step when the button is pressed, and says so again after', async () => {
    const env = setup()
    await env.subscribe(form('reader@example.com'))
    const token = await confirmationToken(env, 'reader@example.com')
    const press = () =>
      answerConfirmation(link(subscriptionLinkPath('confirm', token), 'POST'), env.service)

    const confirmed = await press()
    expect(confirmed.status).toBe(200)
    expect(await confirmed.text()).toContain('<h1>Subscription confirmed</h1>')
    expect(await env.status('reader@example.com')).toBe('confirmed')

    const again = await press()
    expect(again.status).toBe(200)
    expect(await again.text()).toContain('This subscription is already confirmed.')
  })

  it('says when a confirmation link has expired or does not work', async () => {
    const env = setup()
    await env.subscribe(form('reader@example.com'))
    const token = await confirmationToken(env, 'reader@example.com')
    env.clock.advance(3 * 24 * 60 * minute)

    const expired = await answerConfirmation(
      link(subscriptionLinkPath('confirm', token), 'POST'),
      env.service,
    )
    const unknown = await answerConfirmation(
      link(subscriptionLinkPath('confirm', createSubscriptionToken()), 'POST'),
      env.service,
    )

    expect(expired.status).toBe(410)
    expect(await expired.text()).toContain('<h1>This link has expired</h1>')
    expect(unknown.status).toBe(404)
    expect(await unknown.text()).toContain('<h1>This link does not work</h1>')
  })

  it.each([
    ['no token', '/subscriptions/confirm'],
    ['a malformed token', '/subscriptions/confirm?token=%3Cscript%3E'],
  ])('opens a link with %s as one that does not work, with no button', async (_case, path) => {
    const response = answerConfirmationLink(link(path))
    const page = await response.text()

    expect(response.status).toBe(404)
    expect(page).toContain('<h1>This link does not work</h1>')
    expect(page).not.toContain('<form')
    expect(page).not.toContain('<script>')
  })

  it('opens and answers an unsubscribe link, including a mail client one-click post', async () => {
    const env = setup()
    await env.subscribe(form('reader@example.com'))
    await env.service.confirm({ token: await confirmationToken(env, 'reader@example.com') })
    const path = subscriptionLinkPath(
      'unsubscribe',
      await unsubscribeToken(env, 'reader@example.com'),
    )

    const opened = answerUnsubscribeLink(link(path))
    expect(opened.status).toBe(200)
    expect(await opened.text()).toContain(
      `<form method="post" action="${path}">\n<button type="submit">Unsubscribe</button>`,
    )
    expect(await env.status('reader@example.com')).toBe('confirmed')

    // RFC 8058: the mail client posts List-Unsubscribe=One-Click to the link itself.
    const oneClick = await answerUnsubscribe(
      link(path, 'POST', {
        body: 'List-Unsubscribe=One-Click',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      }),
      env.service,
    )
    expect(oneClick.status).toBe(200)
    expect(await oneClick.text()).toContain('<h1>You are unsubscribed</h1>')
    expect(await env.status('reader@example.com')).toBe('unsubscribed')

    const again = await answerUnsubscribe(link(path, 'POST'), env.service)
    expect(again.status).toBe(200)
    expect(await again.text()).toContain('The newsletter is no longer sent to this address.')
    const unknown = await answerUnsubscribe(
      link(subscriptionLinkPath('unsubscribe', createSubscriptionToken()), 'POST'),
      env.service,
    )
    expect(unknown.status).toBe(404)
    expect(answerUnsubscribeLink(link('/subscriptions/unsubscribe')).status).toBe(404)
  })

  it('answers 503 when the store fails or is not configured, and logs no token', async () => {
    const env = setup()
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const token = createSubscriptionToken()
    vi.spyOn(env.service, 'unsubscribe').mockRejectedValue(new Error(`token ${token} broke`))

    const failed = await answerUnsubscribe(
      link(subscriptionLinkPath('unsubscribe', token), 'POST'),
      env.service,
    )
    const missing = await answerConfirmation(
      link(subscriptionLinkPath('confirm', token), 'POST'),
      null,
    )

    for (const response of [failed, missing]) {
      expect(response.status).toBe(503)
      expect(await response.text()).toContain('<h1>Please try again</h1>')
    }
    expect(log).toHaveBeenCalledWith('A subscription link could not be answered (Error).')
    expect(JSON.stringify(log.mock.calls)).not.toContain(token)
  })
})
