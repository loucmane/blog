import { describe, expect, it, vi } from 'vitest'

import { CURRENT_CONTENT_DOCUMENT_VERSION, type ContentDocument } from '../content/document'
import type { OutboxEvent } from '../content/domain'
import { InMemoryContentRepository } from '../content/in-memory-repository'
import type { Clock, IdentifierSource } from '../content/ports'
import { ContentReader, listPublishedStories } from '../content/reader'
import { ContentService } from '../content/service'
import { InMemorySearch } from '../discovery/in-memory-search'
import { createLogger } from '../observability/logger'
import { redactedEmail, redactedSecret } from '../observability/redact'
import {
  claimRepository,
  defaultOutboxHandlerTimeoutMs,
  eventCorrelationId,
  maxOutboxBatchSize,
  OutboxDispatcher,
  retryDueAt,
} from './dispatcher'
import { createOutboxHandlers } from './handlers'
import { InMemoryOutboxStore } from './in-memory-outbox-store'
import type {
  CacheRevalidator,
  OutboxHandler,
  OutboxHandlerContext,
  OutboxHandlers,
  OutboxStore,
} from './ports'
import { outboxRetryDelayMs, outboxRetryDelaysMs } from './retry'

const minute = 60_000
const hour = 60 * minute

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

/**
 * A stand-in for an external provider that honours idempotency keys: a delivery under a key it
 * has seen has no second effect. It refuses every delivery while it is down.
 */
class StandInProvider {
  readonly attempts: string[] = []
  readonly effects = new Map<string, string>()
  down = true

  constructor(private readonly name: string) {}

  async deliver(key: string, effect: string): Promise<void> {
    this.attempts.push(key)
    if (this.down) throw new Error(`${this.name} is unavailable`)
    if (!this.effects.has(key)) this.effects.set(key, effect)
  }
}

function document(articleId: string, title: string, text: string): ContentDocument {
  return {
    articleId,
    document: { content: [{ content: [{ text, type: 'text' }], type: 'paragraph' }], type: 'doc' },
    migrationProvenance: [],
    schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
    title,
  }
}

function setup(options: { handlerTimeoutMs?: number } = {}) {
  const clock = new TestClock(new Date('2026-11-03T09:00:00.000Z'))
  const repository = new InMemoryContentRepository()
  const content = new ContentService(repository, clock, new TestIdentifiers())
  const store = new InMemoryOutboxStore(repository)
  const search = new InMemorySearch()
  const cache = new StandInProvider('cache revalidation')
  const revalidator: CacheRevalidator = {
    revalidate: ({ idempotencyKey, slugs }) => cache.deliver(idempotencyKey, slugs.join(' ')),
  }
  const logs: Record<string, unknown>[] = []
  // The logger a drain request gives its dispatcher, under the drain's own correlation id.
  const logger = createLogger({
    clock,
    correlationId: 'drain-request-0001',
    sink: (line) => logs.push(JSON.parse(line)),
  })
  const dispatcherWith = (handlers: OutboxHandlers, outboxStore: OutboxStore = store) =>
    new OutboxDispatcher({ clock, handlers, logger, store: outboxStore, ...options })
  const phaseHandlers = createOutboxHandlers({ cache: revalidator, content: repository, search })
  return { cache, clock, content, dispatcherWith, logs, phaseHandlers, repository, search, store }
}

/** Handlers that record the context each event was handed, by event id, before running. */
function recordingContexts(handlers: OutboxHandlers) {
  const contexts = new Map<string, OutboxHandlerContext[]>()
  const recorded = new Map<string, OutboxHandler>(
    [...handlers].map(([type, handler]) => [
      type,
      async (event, context) => {
        contexts.set(event.id, [...(contexts.get(event.id) ?? []), context])
        await handler(event, context)
      },
    ]),
  )
  return { contexts, recorded }
}

async function publishStory(content: ContentService, slug: string) {
  const articleId = `article-${slug}`
  const created = await content.createArticle({
    dek: `About ${slug}`,
    document: document(articleId, `Title of ${slug}`, `Published words about ${slug}.`),
    id: articleId,
    idempotencyKey: `create-${slug}`,
    slug,
    title: `Title of ${slug}`,
  })
  return content.publish({
    articleId,
    expectedVersion: created.article.version,
    idempotencyKey: `publish-${slug}`,
    revisionId: created.revision.id,
  })
}

async function outbox(repository: InMemoryContentRepository): Promise<readonly OutboxEvent[]> {
  return repository.inspect((transaction) => transaction.listOutboxEvents())
}

async function seedEvent(
  repository: InMemoryContentRepository,
  event: Pick<OutboxEvent, 'createdAt' | 'id' | 'type'> & Partial<OutboxEvent>,
) {
  await repository.transaction((transaction) =>
    transaction.saveOutboxEvent({
      aggregateId: 'article-seeded',
      attempts: 0,
      lastError: null,
      payload: {},
      status: 'pending',
      updatedAt: event.createdAt,
      ...event,
    }),
  )
}

describe('outbox dispatcher', () => {
  it('keeps publication and reading independent of every external adapter, retries each failed event, and replays without duplicates', async () => {
    const { cache, clock, content, dispatcherWith, phaseHandlers, repository, search, store } =
      setup()
    const email = new StandInProvider('email')
    const analytics = new StandInProvider('analytics')
    const cards = new StandInProvider('card generation')
    // Stand-ins for the publication effects later slices add: each provider is keyed by the event.
    const handlers = new Map<string, OutboxHandler>([
      ...phaseHandlers,
      [
        'article.published',
        async (event, { idempotencyKey }) => {
          await email.deliver(`${idempotencyKey}:email`, event.aggregateId)
          await analytics.deliver(`${idempotencyKey}:analytics`, event.aggregateId)
          await cards.deliver(`${event.aggregateId}:${String(event.payload.revisionId)}`, 'card')
        },
      ],
    ])
    const dispatcher = dispatcherWith(handlers)

    const published = await publishStory(content, 'quiet-rooms')

    // The publication committed and readers see it at once, before any event is delivered.
    expect(published.article.status).toBe('published')
    expect(await new ContentReader(repository).loadPublished('quiet-rooms')).toMatchObject({
      article: { id: 'article-quiet-rooms', status: 'published' },
    })
    const first = await dispatcher.drain()
    const events = await outbox(repository)
    const ids = Object.fromEntries(events.map(({ id, type }) => [type, id]))
    expect(first).toEqual({
      completed: [ids['search.upsert']],
      deadLettered: [],
      retrying: [ids['cache.revalidate'], ids['article.published']],
    })
    expect(events.filter(({ status }) => status === 'failed')).toEqual([
      expect.objectContaining({ attempts: 1, lastError: 'cache revalidation is unavailable' }),
      expect.objectContaining({ attempts: 1, lastError: 'email is unavailable' }),
    ])

    // The providers recover; each failed event is retried from the outbox once its backoff ends.
    for (const provider of [cache, email, analytics, cards]) provider.down = false
    expect(await dispatcher.drain()).toEqual({ completed: [], deadLettered: [], retrying: [] })
    clock.advance(minute)
    expect(await dispatcher.drain()).toEqual({
      completed: [ids['cache.revalidate'], ids['article.published']],
      deadLettered: [],
      retrying: [],
    })

    // Every event is delivered a second time, as after a crash before its outcome was recorded.
    await repository.transaction(async (transaction) => {
      for (const event of await transaction.listOutboxEvents()) {
        await transaction.saveOutboxEvent({ ...event, status: 'pending' })
      }
    })
    expect((await dispatcher.drain()).completed).toHaveLength(3)

    const effects = (provider: StandInProvider) => [...provider.effects.keys()]
    expect(effects(email)).toEqual([`${ids['article.published']}:email`])
    expect(effects(analytics)).toEqual([`${ids['article.published']}:analytics`])
    expect(effects(cards)).toEqual([`article-quiet-rooms:${published.revision.id}`])
    expect(effects(cache)).toEqual([ids['cache.revalidate']])
    // Every delivery of an event carried the key derived from that event's id.
    expect(new Set(email.attempts)).toEqual(new Set([`${ids['article.published']}:email`]))
    expect(new Set(cache.attempts)).toEqual(new Set([ids['cache.revalidate']]))
    // One search document and one listing entry, however often the events ran.
    expect((await search.search({ limit: 10, offset: 0, query: 'quiet' })).total).toBe(1)
    const listed = await repository.inspect((transaction) => listPublishedStories(transaction))
    expect(listed.map(({ article }) => article.slug)).toEqual(['quiet-rooms'])
    expect(await store.listDeadLetters()).toEqual([])
  })

  it('dead-letters an unsupported event type at once and completes every other event in its batch', async () => {
    const { cache, clock, content, dispatcherWith, phaseHandlers, repository, store } = setup()
    cache.down = false
    const dispatcher = dispatcherWith(phaseHandlers)
    const published = await publishStory(content, 'first-story')
    await seedEvent(repository, {
      createdAt: published.article.updatedAt,
      id: 'outbox-000-unknown',
      type: 'newsletter.unknown',
    })
    await content.changeSlug({
      articleId: published.article.id,
      expectedVersion: published.article.version,
      idempotencyKey: 'rename-first-story',
      slug: 'renamed-story',
    })

    const report = await dispatcher.drain()

    expect(report.deadLettered).toEqual(['outbox-000-unknown'])
    expect(report.retrying).toEqual([])
    const events = await outbox(repository)
    expect(events.filter(({ status }) => status === 'completed').map(({ type }) => type)).toEqual([
      'cache.revalidate',
      'search.upsert',
      'article.published',
      'article.slug-changed',
    ])
    expect(report.completed).toHaveLength(4)
    const [deadLetter] = await store.listDeadLetters()
    expect(deadLetter).toMatchObject({
      // Dispatched once, found to have no handler, and never retried.
      attempts: 1,
      deadLetteredAt: clock.now().toISOString(),
      id: 'outbox-000-unknown',
      lastError: 'unsupported event type: newsletter.unknown',
      status: 'dead_letter',
    })
    clock.advance(13 * hour)
    expect(await dispatcher.drain()).toEqual({ completed: [], deadLettered: [], retrying: [] })
    expect((await store.listDeadLetters())[0]?.attempts).toBe(1)
  })

  it('completes article.published with the acknowledge-only handler and never dead-letters it', async () => {
    const { cache, content, dispatcherWith, phaseHandlers, repository, store } = setup()
    const dispatcher = dispatcherWith(phaseHandlers)
    await publishStory(content, 'acknowledged-story')
    const ids = Object.fromEntries((await outbox(repository)).map(({ id, type }) => [type, id]))
    const publication = async () =>
      (await outbox(repository)).find(({ type }) => type === 'article.published')

    // The cache adapter is down; acknowledging the publication does not depend on it.
    expect(await dispatcher.drain()).toEqual({
      completed: [ids['search.upsert'], ids['article.published']],
      deadLettered: [],
      retrying: [ids['cache.revalidate']],
    })
    expect(await publication()).toMatchObject({ attempts: 1, lastError: null, status: 'completed' })

    // A second delivery, as after a crash before its outcome was recorded, completes as well.
    await repository.transaction(async (transaction) => {
      for (const event of await transaction.listOutboxEvents()) {
        if (event.type === 'article.published') {
          await transaction.saveOutboxEvent({ ...event, status: 'pending' })
        }
      }
    })
    expect(await dispatcher.drain()).toEqual({
      completed: [ids['article.published']],
      deadLettered: [],
      retrying: [],
    })
    expect(await publication()).toMatchObject({ attempts: 2, lastError: null, status: 'completed' })
    // Only the cache event reached the cache adapter.
    expect(cache.attempts).toEqual([ids['cache.revalidate']])
    expect(await store.listDeadLetters()).toEqual([])
  })

  it('backs off 1 m, 5 m, 30 m, 2 h and 12 h, then dead-letters when the fifth retry fails too', async () => {
    const { clock, dispatcherWith, repository, store } = setup()
    const handler = vi.fn(async () => {
      throw new Error('provider refused the request')
    })
    const dispatcher = dispatcherWith(new Map([['email.issue', handler]]))
    await seedEvent(repository, {
      createdAt: clock.now().toISOString(),
      id: 'outbox-email',
      type: 'email.issue',
    })

    const waits: number[] = []
    for (const delay of outboxRetryDelaysMs) {
      const dispatched = await dispatcher.dispatchNext()
      if (dispatched?.outcome !== 'retrying') throw new Error('The event should be retrying.')
      waits.push(Date.parse(dispatched.nextAttemptAt) - clock.now().valueOf())
      // Not due a moment before the backoff ends, and due as it ends.
      clock.advance(delay - 1)
      expect(await dispatcher.dispatchNext()).toBeNull()
      clock.advance(1)
    }
    const last = await dispatcher.dispatchNext()

    expect(waits).toEqual([minute, 5 * minute, 30 * minute, 2 * hour, 12 * hour])
    expect(last).toMatchObject({
      event: { attempts: 6, status: 'dead_letter' },
      outcome: 'dead-lettered',
    })
    expect(handler).toHaveBeenCalledTimes(6)
    expect(await store.listDeadLetters()).toEqual([
      expect.objectContaining({ id: 'outbox-email', lastError: 'provider refused the request' }),
    ])
    clock.advance(24 * hour)
    expect(await dispatcher.dispatchNext()).toBeNull()
    expect(outboxRetryDelayMs(0)).toBe(minute)
    expect(outboxRetryDelayMs(6)).toBeNull()
  })

  it('records a slow handler as failed when its time limit passes and goes on to the next event', async () => {
    vi.useFakeTimers()
    try {
      const { dispatcherWith, repository } = setup({ handlerTimeoutMs: 5_000 })
      let aborted = false
      let settleLate: (reason: Error) => void = () => undefined
      const slow: OutboxHandler = (_event, { signal }) =>
        new Promise<void>((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            aborted = true
          })
          settleLate = reject
        })
      const quick = vi.fn(async () => undefined)
      const dispatcher = dispatcherWith(
        new Map([
          ['slow.effect', slow],
          ['quick.effect', quick],
        ]),
      )
      await seedEvent(repository, {
        createdAt: '2026-11-03T08:00:00.000Z',
        id: 'outbox-slow',
        type: 'slow.effect',
      })
      await seedEvent(repository, {
        createdAt: '2026-11-03T08:00:01.000Z',
        id: 'outbox-quick',
        type: 'quick.effect',
      })

      const draining = dispatcher.drain()
      await vi.advanceTimersByTimeAsync(5_000)
      const report = await draining
      // The abandoned handler gives up later; its rejection is not left unhandled.
      settleLate(new Error('gave up after the abort'))
      await vi.advanceTimersByTimeAsync(0)

      expect(report).toEqual({
        completed: ['outbox-quick'],
        deadLettered: [],
        retrying: ['outbox-slow'],
      })
      expect(aborted).toBe(true)
      expect(quick).toHaveBeenCalledOnce()
      expect((await outbox(repository)).find(({ id }) => id === 'outbox-slow')).toMatchObject({
        lastError: 'The handler did not finish within 5000 ms.',
        status: 'failed',
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('records why a handler failed, whatever it threw, within a bounded length', async () => {
    const { dispatcherWith, repository } = setup()
    const thrown: unknown[] = ['a plain string', new Error(''), new Error('x'.repeat(5_000))]
    const dispatcher = dispatcherWith(
      new Map([
        [
          'any.effect',
          async () => {
            throw thrown.shift()
          },
        ],
      ]),
    )
    for (const [index, createdAt] of ['08:00', '08:01', '08:02'].entries()) {
      await seedEvent(repository, {
        createdAt: `2026-11-03T${createdAt}:00.000Z`,
        id: `outbox-reason-${index}`,
        type: 'any.effect',
      })
    }

    expect((await dispatcher.drain()).retrying).toHaveLength(3)
    const reasons = (await outbox(repository)).map(({ lastError }) => lastError ?? '')

    expect(reasons.slice(0, 2)).toEqual(['a plain string', 'The handler failed without a reason.'])
    expect(reasons[2]).toHaveLength(1_000)
    expect(reasons[2]?.endsWith('…')).toBe(true)
  })

  it('passes each handler its event, the key derived from the event id, its correlation id, and an abort signal', async () => {
    const { dispatcherWith, repository } = setup()
    const handler = vi.fn(async () => undefined)
    await seedEvent(repository, {
      createdAt: '2026-11-03T08:00:00.000Z',
      id: 'outbox-context',
      payload: { slug: 'context-story' },
      type: 'context.effect',
    })

    await dispatcherWith(new Map([['context.effect', handler]])).drain()

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'outbox-context', payload: { slug: 'context-story' } }),
      {
        correlationId: eventCorrelationId({
          aggregateId: 'article-seeded',
          createdAt: '2026-11-03T08:00:00.000Z',
          payload: {},
        }),
        idempotencyKey: 'outbox-context',
        signal: expect.any(AbortSignal),
      },
    )
  })

  it('gives every job of one publication, and every retry of each, one correlation id (BR-12)', async () => {
    const { cache, clock, content, dispatcherWith, logs, phaseHandlers, repository } = setup()
    const { contexts, recorded } = recordingContexts(phaseHandlers)
    const dispatcher = dispatcherWith(recorded)

    await publishStory(content, 'shared-id')
    const first = await outbox(repository)
    // The cache adapter is down for the first drain, so its event is handed over twice.
    await dispatcher.drain()
    cache.down = false
    clock.advance(minute)
    await dispatcher.drain()
    clock.advance(minute)
    await publishStory(content, 'another-story')
    await dispatcher.drain()

    const shared = eventCorrelationId(first[0]!)
    const handedOver = first.flatMap(({ id }) => contexts.get(id) ?? [])
    expect(first).toHaveLength(3)
    expect(handedOver).toHaveLength(4)
    expect(new Set(handedOver.map(({ correlationId }) => correlationId))).toEqual(new Set([shared]))
    expect(shared).toMatch(/^outbox-[\da-f]{32}$/)
    // Each outcome is logged under the publication's id, not the drain's.
    const forFirst = logs.filter(({ eventId }) => first.some(({ id }) => id === eventId))
    expect(forFirst.map(({ correlationId, message }) => [message, correlationId])).toEqual([
      ['outbox.event.retrying', shared],
      ['outbox.event.completed', shared],
      ['outbox.event.completed', shared],
      ['outbox.event.completed', shared],
    ])
    // Another publication's jobs share an id of their own.
    const second = (await outbox(repository)).filter(
      ({ aggregateId }) => aggregateId === 'article-another-story',
    )
    const secondIds = second.flatMap(({ id }) => contexts.get(id) ?? []).map((c) => c.correlationId)
    expect(new Set(secondIds).size).toBe(1)
    expect(secondIds[0]).not.toBe(shared)
  })

  it('carries the correlation id the request that wrote an event recorded on it', async () => {
    const { dispatcherWith, logs, repository } = setup()
    const handler = vi.fn(async () => undefined)
    await seedEvent(repository, {
      createdAt: '2026-11-03T08:00:00.000Z',
      id: 'outbox-recorded',
      payload: { correlationId: 'publish-request-0001' },
      type: 'context.effect',
    })
    await seedEvent(repository, {
      createdAt: '2026-11-03T08:00:01.000Z',
      id: 'outbox-malformed',
      payload: { correlationId: 'not an id' },
      type: 'context.effect',
    })

    await dispatcherWith(new Map([['context.effect', handler]])).drain()

    const handed = handler.mock.calls.map((call) => (call as unknown[])[1] as OutboxHandlerContext)
    expect(handed.map(({ correlationId }) => correlationId)).toEqual([
      'publish-request-0001',
      eventCorrelationId({
        aggregateId: 'article-seeded',
        createdAt: '2026-11-03T08:00:01.000Z',
        payload: {},
      }),
    ])
    expect(logs[0]).toMatchObject({
      correlationId: 'publish-request-0001',
      eventId: 'outbox-recorded',
      message: 'outbox.event.completed',
    })
  })

  it('logs each outcome under its event’s correlation id, redacted, once it is recorded', async () => {
    const { dispatcherWith, logs, repository } = setup()
    for (const [index, type] of ['ok.effect', 'flaky.effect', 'missing.effect'].entries()) {
      await seedEvent(repository, {
        aggregateId: `article-${index}`,
        createdAt: `2026-11-03T08:00:0${index}.000Z`,
        id: `outbox-${type}`,
        type,
      })
    }
    const dispatcher = dispatcherWith(
      new Map<string, OutboxHandler>([
        ['ok.effect', async () => undefined],
        [
          'flaky.effect',
          async () => {
            throw new Error('provider rejected owner@magazine.example: token=tok_live_123')
          },
        ],
      ]),
    )

    await dispatcher.drain()

    const correlationOf = (index: number, createdAt: string) =>
      eventCorrelationId({ aggregateId: `article-${index}`, createdAt, payload: {} })
    expect(logs).toEqual([
      {
        aggregateId: 'article-0',
        attempts: 1,
        correlationId: correlationOf(0, '2026-11-03T08:00:00.000Z'),
        durationMs: 0,
        eventId: 'outbox-ok.effect',
        eventType: 'ok.effect',
        level: 'info',
        message: 'outbox.event.completed',
        time: '2026-11-03T09:00:00.000Z',
      },
      {
        aggregateId: 'article-1',
        attempts: 1,
        correlationId: correlationOf(1, '2026-11-03T08:00:01.000Z'),
        durationMs: 0,
        eventId: 'outbox-flaky.effect',
        eventType: 'flaky.effect',
        lastError: `provider rejected ${redactedEmail}: token=${redactedSecret}`,
        level: 'warn',
        message: 'outbox.event.retrying',
        nextAttemptAt: '2026-11-03T09:01:00.000Z',
        time: '2026-11-03T09:00:00.000Z',
      },
      {
        aggregateId: 'article-2',
        attempts: 1,
        correlationId: correlationOf(2, '2026-11-03T08:00:02.000Z'),
        durationMs: 0,
        eventId: 'outbox-missing.effect',
        eventType: 'missing.effect',
        lastError: 'unsupported event type: missing.effect',
        level: 'error',
        message: 'outbox.event.dead-lettered',
        time: '2026-11-03T09:00:00.000Z',
      },
    ])
    // What is stored for the maintainer is the handler's own message; only the log is redacted.
    expect((await outbox(repository))[1]?.lastError).toBe(
      'provider rejected owner@magazine.example: token=tok_live_123',
    )
  })

  it('logs an outcome it could not record and leaves the event due, and a claim that failed', async () => {
    const { dispatcherWith, logs, repository, store } = setup()
    await seedEvent(repository, {
      createdAt: '2026-11-03T08:00:00.000Z',
      id: 'outbox-unrecorded',
      type: 'ok.effect',
    })
    const unrecording: OutboxStore = {
      claimNextDue: (now, work) =>
        store.claimNextDue(now, (claim) =>
          work({
            ...claim,
            record: () =>
              Promise.reject(new Error('lost postgres://magazine:hunter2@db.internal/magazine')),
          }),
        ),
      listDeadLetters: () => store.listDeadLetters(),
    }
    const unreachable: OutboxStore = {
      claimNextDue: () => Promise.reject(new Error('connection refused')),
      listDeadLetters: () => store.listDeadLetters(),
    }
    const handlers = new Map([['ok.effect', async () => undefined]])

    await expect(dispatcherWith(handlers, unrecording).dispatchNext()).rejects.toThrow(/^lost/)
    await expect(dispatcherWith(handlers, unreachable).dispatchNext()).rejects.toThrow(
      'connection refused',
    )

    expect(logs).toEqual([
      expect.objectContaining({
        correlationId: eventCorrelationId({
          aggregateId: 'article-seeded',
          createdAt: '2026-11-03T08:00:00.000Z',
          payload: {},
        }),
        error: expect.objectContaining({
          message: `lost postgres://${redactedSecret}@db.internal/magazine`,
        }),
        eventId: 'outbox-unrecorded',
        level: 'error',
        message: 'outbox.event.unrecorded',
      }),
      expect.objectContaining({
        correlationId: 'drain-request-0001',
        error: expect.objectContaining({ message: 'connection refused' }),
        level: 'error',
        message: 'outbox.claim.failed',
      }),
    ])
    expect((await outbox(repository))[0]).toMatchObject({ attempts: 0, status: 'pending' })
  })

  it('puts a failed event’s next try at its last failure plus the backoff, and none once its retries are spent', () => {
    const failed = { attempts: 1, status: 'failed', updatedAt: '2026-11-03T09:00:00.000Z' } as const

    expect(retryDueAt(failed)).toBe('2026-11-03T09:01:00.000Z')
    expect(retryDueAt({ ...failed, attempts: 5 })).toBe('2026-11-03T21:00:00.000Z')
    expect(retryDueAt({ ...failed, attempts: 6 })).toBeNull()
    expect(retryDueAt({ ...failed, status: 'pending' })).toBeNull()
  })

  it('logs to the console under an id of its own when given no logger', async () => {
    const { clock, repository, store } = setup()
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    await seedEvent(repository, {
      createdAt: '2026-11-03T08:00:00.000Z',
      id: 'outbox-console',
      type: 'ok.effect',
    })

    await new OutboxDispatcher({
      clock,
      handlers: new Map([['ok.effect', async () => undefined]]),
      store,
    }).drain()

    expect(JSON.parse(String(log.mock.calls[0]?.[0]))).toMatchObject({
      eventId: 'outbox-console',
      message: 'outbox.event.completed',
    })
  })

  it('drains at most the requested number of events and refuses an unusable limit', async () => {
    const { dispatcherWith, repository } = setup()
    const dispatcher = dispatcherWith(new Map([['noop.effect', async () => undefined]]))
    for (const index of [1, 2, 3]) {
      await seedEvent(repository, {
        createdAt: `2026-11-03T08:00:0${index}.000Z`,
        id: `outbox-limit-${index}`,
        type: 'noop.effect',
      })
    }

    expect((await dispatcher.drain({ limit: 2 })).completed).toEqual([
      'outbox-limit-1',
      'outbox-limit-2',
    ])
    expect((await dispatcher.drain()).completed).toEqual(['outbox-limit-3'])
    for (const limit of [0, 1.5, maxOutboxBatchSize + 1]) {
      await expect(dispatcher.drain({ limit })).rejects.toThrow(RangeError)
    }
    expect(defaultOutboxHandlerTimeoutMs).toBe(30_000)
  })

  it('lets concurrent drains share the queue without dispatching an event twice', async () => {
    const { dispatcherWith, repository } = setup()
    const seen: string[] = []
    const handler: OutboxHandler = async (event) => {
      seen.push(event.id)
      await new Promise((resolve) => setTimeout(resolve, 5))
    }
    for (const index of [1, 2, 3, 4]) {
      await seedEvent(repository, {
        createdAt: `2026-11-03T08:00:0${index}.000Z`,
        id: `outbox-shared-${index}`,
        type: 'shared.effect',
      })
    }
    const handlers = new Map([['shared.effect', handler]])

    const reports = await Promise.all([
      dispatcherWith(handlers).drain(),
      dispatcherWith(handlers).drain(),
    ])

    expect(reports.flatMap(({ completed }) => completed).sort()).toEqual([
      'outbox-shared-1',
      'outbox-shared-2',
      'outbox-shared-3',
      'outbox-shared-4',
    ])
    expect(seen.sort()).toEqual(reports.flatMap(({ completed }) => completed).sort())
  })

  it('records outcomes only in the claim transaction', async () => {
    const repository = claimRepository({} as never)

    await expect(repository.readPublicationVersion()).rejects.toThrow(/claim transaction/)
    await expect(repository.tryExclusive('key', async () => undefined)).rejects.toThrow(
      /claim transaction/,
    )
  })
})
