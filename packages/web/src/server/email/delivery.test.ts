import { describe, expect, it, vi } from 'vitest'

import { CURRENT_CONTENT_DOCUMENT_VERSION } from '../content/document'
import type { OutboxEvent } from '../content/domain'
import { InMemoryContentRepository } from '../content/in-memory-repository'
import { ContentService } from '../content/service'
import { InMemorySearch } from '../discovery/in-memory-search'
import { jobRecordSource, projectJobView } from '../observability/jobs'
import { createLogger } from '../observability/logger'
import { OutboxDispatcher } from '../outbox/dispatcher'
import { createOutboxHandlers } from '../outbox/handlers'
import { InMemoryOutboxStore } from '../outbox/in-memory-outbox-store'
import { outboxRetryDelaysMs } from '../outbox/retry'
import { subscriptionConsent } from '../subscriptions/consent'
import { InMemorySubscriptionStore } from '../subscriptions/in-memory-store'
import { SubscriptionService } from '../subscriptions/service'
import { ConsoleEmailSender } from './console'
import type { EmailSender, OutboundEmail } from './ports'

function setup() {
  let instant = Date.parse('2026-11-04T09:00:00.000Z')
  const clock = { now: () => new Date(instant) }
  const repository = new InMemoryContentRepository()
  const subscriptions = new SubscriptionService(new InMemorySubscriptionStore(repository), clock)
  const content = new ContentService(repository, clock)
  const records: Record<string, unknown>[] = []
  const logger = createLogger({
    correlationId: 'email-test-correlation',
    sink: (line) => records.push(JSON.parse(line)),
  })
  const sender = new ConsoleEmailSender(logger)
  const send = vi.spyOn(sender, 'send')
  const store = new InMemoryOutboxStore(repository)
  const handlersFor = (adapter: EmailSender = sender) =>
    createOutboxHandlers({
      cache: { revalidate: async () => undefined },
      content: repository,
      search: new InMemorySearch(),
      email: { sender: adapter, siteUrl: new URL('https://magazine.example/'), subscriptions },
    })
  const dispatcherFor = (adapter: EmailSender = sender) =>
    new OutboxDispatcher({
      clock,
      handlers: handlersFor(adapter),
      logger,
      store,
    })
  const events = () => repository.inspect((transaction) => transaction.listOutboxEvents())
  const queue = (event: OutboxEvent) =>
    repository.transaction((transaction) => transaction.saveOutboxEvent(event))
  const request = () =>
    subscriptions.subscribe({
      email: 'reader@example.com',
      source: 'subscription-form',
      consentTextVersion: subscriptionConsent.version,
    })
  return {
    advance: (ms: number) => {
      instant += ms
    },
    clock,
    content,
    dispatcherFor,
    events,
    handlersFor,
    logger,
    queue,
    records,
    repository,
    request,
    send,
    store,
    subscriptions,
  }
}

type Setup = ReturnType<typeof setup>

async function confirmation(env: Setup) {
  await env.request()
  const event = (await env.events())[0]
  if (!event) throw new Error('Missing confirmation event')
  return event
}

function tokenIn(message: OutboundEmail): string {
  const link = message.text.match(/https:\/\/\S+/)?.[0]
  if (!link) throw new Error('Missing confirmation link')
  return new URL(link).searchParams.get('token') ?? ''
}

async function issue(env: Setup) {
  const confirm = await confirmation(env)
  await env.dispatcherFor().drain()
  const first = env.send.mock.calls[0]?.[0]
  if (!first) throw new Error('Missing email')
  expect(await env.subscriptions.confirm({ token: tokenIn(first) })).toBe('confirmed')
  const title = 'Glass <lanterns> & light'
  const created = await env.content.createArticle({
    dek: 'Published introduction',
    id: 'article-email',
    slug: 'glass-lanterns',
    title,
    idempotencyKey: 'create-email-story',
    document: {
      articleId: 'article-email',
      title,
      schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
      migrationProvenance: [],
      document: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Published copy' }] }],
      },
    },
  })
  const published = await env.content.publish({
    articleId: created.article.id,
    revisionId: created.revision.id,
    expectedVersion: created.article.version,
    idempotencyKey: 'publish-email-story',
  })
  const event: OutboxEvent = {
    ...confirm,
    id: 'outbox-issue',
    aggregateId: created.article.id,
    type: 'email.issue',
    payload: {
      articleId: created.article.id,
      revisionId: published.revision.id,
      subscriberId: confirm.aggregateId,
    },
  }
  return { event, published }
}

describe('outbox email delivery', () => {
  it('queues a request without sending, confirms through a dispatched link and keeps sensitive data out of logs', async () => {
    const env = setup()
    const event = await confirmation(env)
    expect(env.send).not.toHaveBeenCalled()
    expect(event.payload).toEqual({
      consentId: expect.any(String),
      subscriberId: event.aggregateId,
    })
    expect(await env.dispatcherFor().drain()).toEqual({
      completed: [event.id],
      retrying: [],
      deadLettered: [],
    })
    const message = env.send.mock.calls[0]?.[0]
    if (!message) throw new Error('Missing email')
    expect(env.send).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: 'reader@example.com',
        listUnsubscribe: null,
        listUnsubscribePost: null,
        correlationId: expect.any(String),
      }),
      event.id,
    )
    expect(await env.subscriptions.confirm({ token: tokenIn(message) })).toBe('confirmed')
    expect(JSON.stringify(env.records)).not.toContain(tokenIn(message))
    expect(JSON.stringify(env.records)).not.toContain(message.recipient)
    expect(
      env.records.filter(({ message: name }) => name === 'email.delivery.simulated')[0]
        ?.correlationId,
    ).toBe(
      env.records.find(({ message: name }) => name === 'outbox.event.completed')?.correlationId,
    )
  })

  it('replays the same event through a fresh dispatcher without another simulated delivery', async () => {
    const env = setup()
    const event = await confirmation(env)
    await env.dispatcherFor().drain()
    await env.queue(event)
    await env.dispatcherFor().drain()
    expect(env.send.mock.calls.map(([, key]) => key)).toEqual([event.id, event.id])
    expect(
      env.records.filter(({ message }) => message === 'email.delivery.simulated'),
    ).toHaveLength(1)
    const original = env.send.mock.calls[0]?.[0]
    if (!original) throw new Error('Missing original email')
    expect(await env.subscriptions.confirm({ token: tokenIn(original) })).toBe('confirmed')
  })

  it('retries an uncertain transport outcome with the same key and no second external effect', async () => {
    const env = setup()
    const event = await confirmation(env)
    const delivered = new Set<string>()
    const adapter: EmailSender = {
      send: vi.fn<EmailSender['send']>(async (_message, key) => {
        if (delivered.has(key)) return { delivery: 'accepted', duplicate: true }
        delivered.add(key)
        throw new Error('Transport accepted the message but the response was lost')
      }),
    }
    expect((await env.dispatcherFor(adapter).dispatchNext())?.outcome).toBe('retrying')
    env.advance(60_000)
    expect((await env.dispatcherFor(adapter).dispatchNext())?.outcome).toBe('completed')
    expect([...delivered]).toEqual([event.id])
    expect(adapter.send).toHaveBeenCalledTimes(2)
  })

  it('sends only the published revision to a confirmed subscriber with usable unsubscribe headers', async () => {
    const env = setup()
    const { event, published } = await issue(env)
    expect(env.send).toHaveBeenCalledTimes(1) // Publishing itself never sends.
    await env.content.saveDraft({
      articleId: published.article.id,
      expectedVersion: published.article.version,
      idempotencyKey: 'draft-after-publish',
      title: 'Unpublished headline',
      document: { ...published.revision.document, title: 'Unpublished headline' },
    })
    await env.queue(event)
    await env.dispatcherFor().drain()
    const message = env.send.mock.calls.at(-1)?.[0]
    if (!message) throw new Error('Missing issue email')
    expect(env.send).toHaveBeenCalledTimes(2)
    expect(env.send.mock.calls.at(-1)?.[1]).toBe(event.id)
    expect(message.subject).toBe('Glass <lanterns> & light')
    expect(message.html).toContain('Glass &lt;lanterns&gt; &amp; light')
    expect(message.text).toContain('https://magazine.example/stories/glass-lanterns')
    expect(message.text).not.toContain('Unpublished')
    expect(message.listUnsubscribePost).toBe('List-Unsubscribe=One-Click')
    const unsubscribe = new URL(message.listUnsubscribe?.slice(1, -1) ?? '')
    expect(unsubscribe.pathname).toBe('/subscriptions/unsubscribe')
    expect(
      await env.subscriptions.unsubscribe({ token: unsubscribe.searchParams.get('token') }),
    ).toBe('unsubscribed')
    await env.queue({ ...event, id: 'outbox-after-unsubscribe' })
    await env.dispatcherFor().drain()
    expect(env.send).toHaveBeenCalledTimes(2)
  })

  it.each(['unavailable', 'rate-limited'])(
    'uses every S2 backoff for a %s transport, exposes the dead letter and preserves canonical content',
    async (reason) => {
      const env = setup()
      const { event } = await issue(env)
      await env.dispatcherFor().drain()
      await env.queue(event)
      const before = await env.repository.inspect(async (tx) => ({
        article: await tx.getArticle(event.aggregateId),
        revisions: await tx.listRevisions(event.aggregateId),
        audit: await tx.listAuditEvents(),
      }))
      const adapter: EmailSender = {
        send: vi.fn(async () => {
          throw new Error(`${reason}: reader@example.com`)
        }),
      }
      const dispatcher = env.dispatcherFor(adapter)
      for (const [index, delay] of outboxRetryDelaysMs.entries()) {
        expect(await dispatcher.dispatchNext()).toMatchObject({
          outcome: 'retrying',
          event: { attempts: index + 1 },
          nextAttemptAt: new Date(env.clock.now().valueOf() + delay).toISOString(),
        })
        env.advance(delay - 1)
        expect(await dispatcher.dispatchNext()).toBeNull()
        env.advance(1)
      }
      expect(await dispatcher.dispatchNext()).toMatchObject({
        outcome: 'dead-lettered',
        event: { attempts: 6 },
      })
      expect(adapter.send).toHaveBeenCalledTimes(6)
      expect(await dispatcher.dispatchNext()).toBeNull()
      const view = projectJobView(await jobRecordSource(env.repository, env.store).read(), {
        now: env.clock.now(),
        formatTime: String,
      })
      expect(view.counts['needs-attention']).toBe(1)
      expect(view.jobs['needs-attention'][0]?.maintainer).toMatchObject({
        id: event.id,
        attempts: 6,
        status: 'dead_letter',
      })
      expect((await env.store.listDeadLetters())[0]?.lastError).not.toContain('reader@example.com')
      expect(
        await env.repository.inspect(async (tx) => ({
          article: await tx.getArticle(event.aggregateId),
          revisions: await tx.listRevisions(event.aggregateId),
          audit: await tx.listAuditEvents(),
        })),
      ).toEqual(before)
    },
  )

  it('does not send stale, mismatched or malformed issue events', async () => {
    const env = setup()
    const { event, published } = await issue(env)
    const handlers = env.handlersFor()
    const handler = handlers.get('email.issue')
    if (!handler) throw new Error('Missing handler')
    const context = { idempotencyKey: event.id, signal: new AbortController().signal }
    await expect(handler({ ...event, payload: {} }, context)).rejects.toThrow('subscriberId')
    await expect(handler({ ...event, aggregateId: 'another-article' }, context)).rejects.toThrow(
      'does not match',
    )
    await handler(
      { ...event, payload: { ...event.payload, revisionId: 'obsolete-revision' } },
      context,
    )
    await env.content.unpublish({
      articleId: published.article.id,
      expectedVersion: published.article.version,
      idempotencyKey: 'withdraw-email-story',
      reason: 'Test withdrawal',
    })
    await handler(event, context)
    expect(env.send).toHaveBeenCalledTimes(1)
  })

  it('does not send an obsolete confirmation or a dispatch aborted during token preparation', async () => {
    const env = setup()
    const event = await confirmation(env)
    const handler = env.handlersFor().get(event.type)
    if (!handler) throw new Error('Missing handler')
    const controller = new AbortController()
    const context = { idempotencyKey: event.id, signal: controller.signal }
    await expect(
      handler({ ...event, aggregateId: 'different-subscriber' }, context),
    ).rejects.toThrow('does not match')
    await handler(
      { ...event, payload: { ...event.payload, consentId: 'unknown-consent' } },
      context,
    )
    expect(env.send).not.toHaveBeenCalled()
    vi.spyOn(env.subscriptions, 'prepareConfirmation').mockImplementationOnce(async () => {
      controller.abort()
      return null
    })
    await expect(handler(event, context)).rejects.toThrow()
    expect(env.send).not.toHaveBeenCalled()
  })
})
