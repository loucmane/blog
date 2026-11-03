import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { Pool } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { readArticleView, readHomeView } from '../../reader/read-model'
import { CURRENT_CONTENT_DOCUMENT_VERSION, type ContentDocument } from '../content/document'
import type { Clock, IdentifierSource } from '../content/ports'
import { ContentService } from '../content/service'
import { reindexSearchDocuments, type ReindexConnection } from '../discovery/reindex'
import { OutboxDispatcher } from '../outbox/dispatcher'
import { createOutboxHandlers } from '../outbox/handlers'
import type { OutboxHandler } from '../outbox/ports'
import { outboxRetryDelaysMs } from '../outbox/retry'
import { applyContentMigrations, readContentMigrations } from './migrations'
import { PostgresContentRepository } from './postgres-content-repository'
import { PostgresOutboxStore } from './postgres-outbox-store'
import { PostgresSearchProjection } from './postgres-search-projection'
import { PostgresSearchQuery } from './postgres-search-query'

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required for the outbox integration suite`)
  return value
}

const databaseUrl = requiredEnvironment('TASK42_DATABASE_URL')
const minute = 60_000
const hour = 60 * minute

class TestClock implements Clock {
  private value = new Date('2026-11-03T09:00:00.000Z')

  advance(milliseconds: number) {
    this.value = new Date(this.value.valueOf() + milliseconds)
  }

  now(): Date {
    return new Date(this.value)
  }
}

class Identifiers implements IdentifierSource {
  private index = 0

  next(kind: string): string {
    this.index += 1
    return `${kind}-integration-${String(this.index).padStart(3, '0')}`
  }
}

/**
 * A stand-in for an external provider that honours idempotency keys: a delivery under a key it
 * has seen has no second effect. It refuses every delivery while it is down.
 */
class StandInProvider {
  readonly attempts: string[] = []
  readonly effects = new Map<string, string>()

  constructor(
    private readonly name: string,
    public down: boolean,
  ) {}

  async deliver(key: string, effect: string): Promise<void> {
    this.attempts.push(key)
    if (this.down) throw new Error(`${this.name} is unavailable`)
    if (!this.effects.has(key)) this.effects.set(key, effect)
  }
}

function storyDocument(articleId: string, title: string): ContentDocument {
  return {
    articleId,
    document: {
      content: [
        { content: [{ text: `Published notes for ${title}.`, type: 'text' }], type: 'paragraph' },
      ],
      type: 'doc',
    },
    migrationProvenance: [],
    schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
    title,
  }
}

async function publishStory(content: ContentService, slug: string) {
  const articleId = `article-${slug}`
  const title = `Title of ${slug}`
  const created = await content.createArticle({
    dek: `About ${slug}`,
    document: storyDocument(articleId, title),
    id: articleId,
    idempotencyKey: `create-${slug}`,
    slug,
    title,
  })
  return content.publish({
    articleId,
    expectedVersion: created.article.version,
    idempotencyKey: `publish-${slug}`,
    revisionId: created.revision.id,
  })
}

/** Every content migration in its own schema, so each case sees only its own rows. */
function isolatedSchema(prefix: string, migrate: boolean) {
  const state = {} as { admin: Pool; pool: Pool; schema: string }
  beforeEach(async () => {
    state.schema = `${prefix}_${randomUUID().replaceAll('-', '')}`
    state.admin = new Pool({ connectionString: databaseUrl, max: 1 })
    await state.admin.query(`CREATE SCHEMA "${state.schema}"`)
    state.pool = new Pool({
      connectionString: databaseUrl,
      max: 8,
      options: `-c search_path=${state.schema}`,
    })
    if (migrate) await applyContentMigrations(state.pool, await readContentMigrations())
  }, 60_000)
  afterEach(async () => {
    await state.pool.end()
    await state.admin.query(`DROP SCHEMA IF EXISTS "${state.schema}" CASCADE`)
    await state.admin.end()
  }, 60_000)
  return state
}

function harness(pool: Pool, adaptersDown: boolean) {
  const clock = new TestClock()
  const repository = new PostgresContentRepository(pool)
  const content = new ContentService(repository, clock, new Identifiers())
  const store = new PostgresOutboxStore(repository)
  const providers = {
    analytics: new StandInProvider('analytics', adaptersDown),
    cache: new StandInProvider('cache revalidation', adaptersDown),
    cards: new StandInProvider('card generation', adaptersDown),
    email: new StandInProvider('email', adaptersDown),
  }
  const handlers = new Map<string, OutboxHandler>([
    ...createOutboxHandlers({
      cache: {
        revalidate: ({ idempotencyKey, slugs }) =>
          providers.cache.deliver(idempotencyKey, slugs.join(' ')),
      },
      content: repository,
      search: new PostgresSearchProjection(pool),
    }),
    // Stand-ins for the publication effects later slices add, each keyed at the adapter boundary.
    [
      'article.published',
      async (event, { idempotencyKey }) => {
        await providers.email.deliver(`${idempotencyKey}:email`, event.aggregateId)
        await providers.analytics.deliver(`${idempotencyKey}:analytics`, event.aggregateId)
        await providers.cards.deliver(
          `${event.aggregateId}:${String(event.payload.revisionId)}`,
          'card',
        )
      },
    ],
  ])
  const dispatcher = new OutboxDispatcher({ clock, handlers, store })
  return { clock, content, dispatcher, providers, repository, store }
}

async function outboxRows(pool: Pool) {
  const result = await pool.query(
    `SELECT id, type, status, attempts, last_error, next_attempt_at, dead_lettered_at, updated_at
     FROM outbox_events ORDER BY created_at, id`,
  )
  return result.rows.map((row) => ({
    attempts: row.attempts as number,
    deadLetteredAt: row.dead_lettered_at ? (row.dead_lettered_at as Date).toISOString() : null,
    id: row.id as string,
    lastError: row.last_error as string | null,
    nextAttemptAt: row.next_attempt_at ? (row.next_attempt_at as Date).toISOString() : null,
    status: row.status as string,
    type: row.type as string,
    updatedAt: (row.updated_at as Date).toISOString(),
  }))
}

async function idsByType(pool: Pool): Promise<Record<string, string>> {
  return Object.fromEntries((await outboxRows(pool)).map(({ id, type }) => [type, id]))
}

describe('outbox dispatcher on real PostgreSQL', () => {
  const database = isolatedSchema('outbox', true)

  it('publishes and serves readers with every external adapter down, retries each failed event, and replays without duplicates', async () => {
    const { pool } = database
    const { clock, content, dispatcher, providers, repository, store } = harness(pool, true)
    const source = { mediaAvailable: false, repository }

    const published = await publishStory(content, 'quiet-rooms')

    // The publication row committed, and the article is readable at once, before any delivery.
    expect(
      (await pool.query('SELECT status FROM articles WHERE id = $1', [published.article.id])).rows,
    ).toEqual([{ status: 'published' }])
    expect(await readArticleView(source, 'quiet-rooms')).toMatchObject({
      title: 'Title of quiet-rooms',
    })

    const ids = await idsByType(pool)
    expect(await dispatcher.drain()).toEqual({
      completed: [ids['search.upsert']],
      deadLettered: [],
      retrying: [ids['cache.revalidate'], ids['article.published']],
    })
    const retryAt = new Date(clock.now().valueOf() + minute).toISOString()
    expect(
      (await outboxRows(pool)).map(({ attempts, lastError, nextAttemptAt, status, type }) => ({
        attempts,
        lastError,
        nextAttemptAt,
        status,
        type,
      })),
    ).toEqual([
      {
        attempts: 1,
        lastError: 'cache revalidation is unavailable',
        nextAttemptAt: retryAt,
        status: 'failed',
        type: 'cache.revalidate',
      },
      {
        attempts: 1,
        lastError: null,
        nextAttemptAt: null,
        status: 'completed',
        type: 'search.upsert',
      },
      {
        attempts: 1,
        lastError: 'email is unavailable',
        nextAttemptAt: retryAt,
        status: 'failed',
        type: 'article.published',
      },
    ])

    // The providers recover. Each failed event is retried from the outbox once its backoff ends.
    for (const provider of Object.values(providers)) provider.down = false
    expect(await dispatcher.drain()).toEqual({ completed: [], deadLettered: [], retrying: [] })
    clock.advance(minute)
    expect(await dispatcher.drain()).toEqual({
      completed: [ids['cache.revalidate'], ids['article.published']],
      deadLettered: [],
      retrying: [],
    })

    // Every event is delivered a second time, as after a crash before its outcome was recorded.
    await pool.query("UPDATE outbox_events SET status = 'pending', next_attempt_at = NULL")
    expect((await dispatcher.drain()).completed).toHaveLength(3)

    const effects = (provider: StandInProvider) => [...provider.effects.keys()]
    expect(effects(providers.email)).toEqual([`${ids['article.published']}:email`])
    expect(effects(providers.analytics)).toEqual([`${ids['article.published']}:analytics`])
    expect(effects(providers.cards)).toEqual([`${published.article.id}:${published.revision.id}`])
    expect(effects(providers.cache)).toEqual([ids['cache.revalidate']])
    expect(new Set(providers.email.attempts)).toEqual(
      new Set([`${ids['article.published']}:email`]),
    )
    expect(
      (
        await pool.query(
          'SELECT count(*)::int AS count FROM article_search_documents WHERE article_id = $1',
          [published.article.id],
        )
      ).rows,
    ).toEqual([{ count: 1 }])
    expect(
      (await new PostgresSearchQuery(pool).search({ limit: 10, offset: 0, query: 'quiet rooms' }))
        .total,
    ).toBe(1)
    const home = await readHomeView(source)
    expect([home.lead, ...home.recent].flatMap((card) => (card ? [card.slug] : []))).toEqual([
      'quiet-rooms',
    ])
    expect(await store.listDeadLetters()).toEqual([])
  }, 60_000)

  it('dead-letters an unsupported event type at once while every other event in the batch completes', async () => {
    const { pool } = database
    const { clock, content, dispatcher, store } = harness(pool, false)
    await publishStory(content, 'first-story')
    // Queued with the first story's events, ahead of them by id.
    await pool.query(
      `INSERT INTO outbox_events
        (id, aggregate_id, type, payload, status, attempts, last_error, created_at, updated_at)
       VALUES ($1, 'article-first-story', 'newsletter.unknown', '{}', 'pending', 0, NULL, $2, $2)`,
      ['outbox-integration-000-unknown', clock.now().toISOString()],
    )
    clock.advance(1_000)
    await publishStory(content, 'second-story')

    const report = await dispatcher.drain()

    expect(report.deadLettered).toEqual(['outbox-integration-000-unknown'])
    expect(report.retrying).toEqual([])
    expect(report.completed).toHaveLength(6)
    const rows = await outboxRows(pool)
    expect(rows.filter(({ status }) => status === 'completed')).toHaveLength(6)
    expect(rows.find(({ id }) => id === 'outbox-integration-000-unknown')).toEqual({
      // Dispatched once, found to have no handler, and set aside without a retry.
      attempts: 1,
      deadLetteredAt: clock.now().toISOString(),
      id: 'outbox-integration-000-unknown',
      lastError: 'unsupported event type: newsletter.unknown',
      nextAttemptAt: null,
      status: 'dead_letter',
      type: 'newsletter.unknown',
      updatedAt: clock.now().toISOString(),
    })
    // Visible as needing attention, with its reason.
    expect(await store.listDeadLetters()).toEqual([
      expect.objectContaining({
        deadLetteredAt: clock.now().toISOString(),
        id: 'outbox-integration-000-unknown',
        lastError: 'unsupported event type: newsletter.unknown',
        type: 'newsletter.unknown',
      }),
    ])
    clock.advance(13 * hour)
    expect(await dispatcher.drain()).toEqual({ completed: [], deadLettered: [], retrying: [] })
    expect((await outboxRows(pool)).find(({ status }) => status === 'dead_letter')?.attempts).toBe(
      1,
    )
  }, 60_000)

  it('stores each backoff and dead-letters the event when its fifth retry fails', async () => {
    const { pool } = database
    const clock = new TestClock()
    const store = new PostgresOutboxStore(new PostgresContentRepository(pool))
    const dispatcher = new OutboxDispatcher({
      clock,
      handlers: new Map([
        [
          'email.issue',
          async () => {
            throw new Error('provider refused the request')
          },
        ],
      ]),
      store,
    })
    await pool.query(
      `INSERT INTO outbox_events
        (id, aggregate_id, type, payload, status, attempts, last_error, created_at, updated_at)
       VALUES ('outbox-email', 'issue-1', 'email.issue', '{}', 'pending', 0, NULL, $1, $1)`,
      [clock.now().toISOString()],
    )

    const waits: number[] = []
    for (const delay of outboxRetryDelaysMs) {
      expect((await dispatcher.dispatchNext())?.outcome).toBe('retrying')
      const [row] = await outboxRows(pool)
      waits.push(Date.parse(row?.nextAttemptAt ?? '') - Date.parse(row?.updatedAt ?? ''))
      clock.advance(delay - 1)
      expect(await dispatcher.dispatchNext()).toBeNull()
      clock.advance(1)
    }
    expect((await dispatcher.dispatchNext())?.outcome).toBe('dead-lettered')

    expect(waits).toEqual([minute, 5 * minute, 30 * minute, 2 * hour, 12 * hour])
    expect(await outboxRows(pool)).toEqual([
      expect.objectContaining({
        attempts: 6,
        deadLetteredAt: clock.now().toISOString(),
        lastError: 'provider refused the request',
        nextAttemptAt: null,
        status: 'dead_letter',
      }),
    ])
  }, 60_000)

  it('lets a second dispatcher pass over an event another one holds', async () => {
    const { pool } = database
    const clock = new TestClock()
    const store = new PostgresOutboxStore(new PostgresContentRepository(pool))
    let slowStarted: () => void = () => undefined
    let releaseSlow: () => void = () => undefined
    const started = new Promise<void>((resolve) => {
      slowStarted = resolve
    })
    const released = new Promise<void>((resolve) => {
      releaseSlow = resolve
    })
    const handled: string[] = []
    const handlers = new Map<string, OutboxHandler>([
      [
        'slow.effect',
        async (event) => {
          slowStarted()
          await released
          handled.push(event.id)
        },
      ],
      [
        'quick.effect',
        async (event) => {
          handled.push(event.id)
          releaseSlow()
        },
      ],
    ])
    for (const [id, type, createdAt] of [
      ['outbox-slow', 'slow.effect', '2026-11-03T08:00:00.000Z'],
      ['outbox-quick', 'quick.effect', '2026-11-03T08:00:01.000Z'],
    ]) {
      await pool.query(
        `INSERT INTO outbox_events
          (id, aggregate_id, type, payload, status, attempts, last_error, created_at, updated_at)
         VALUES ($1, 'article-shared', $2, '{}', 'pending', 0, NULL, $3, $3)`,
        [id, type, createdAt],
      )
    }

    const slow = new OutboxDispatcher({ clock, handlers, store }).dispatchNext()
    await started
    // The slow event's row is locked; the second dispatcher skips it rather than waiting on it.
    const quick = await new OutboxDispatcher({ clock, handlers, store }).dispatchNext()

    expect(quick).toMatchObject({ event: { id: 'outbox-quick' }, outcome: 'completed' })
    expect(await slow).toMatchObject({ event: { id: 'outbox-slow' }, outcome: 'completed' })
    expect(handled).toEqual(['outbox-quick', 'outbox-slow'])
  }, 60_000)

  it('rebuilds the search documents in a shadow table and swaps them in without exposing part of a corpus', async () => {
    const { pool } = database
    const { clock, content, dispatcher, repository } = harness(pool, false)
    for (const slug of ['alpha-story', 'bravo-story', 'charlie-story', 'delta-story']) {
      clock.advance(minute)
      await publishStory(content, slug)
    }
    await content.unpublish({
      articleId: 'article-delta-story',
      expectedVersion: 2,
      idempotencyKey: 'unpublish-delta',
      reason: 'Reindex proof',
    })
    await dispatcher.drain()
    // The live documents drift: a stale title, and a document that should have gone.
    await pool.query(
      "UPDATE article_search_documents SET title = 'Stale title' WHERE article_id = 'article-alpha-story'",
    )
    await pool.query(
      `INSERT INTO article_search_documents
        (article_id, slug, title, search_text, published_at, updated_at)
       VALUES ('article-delta-story', 'delta-story', 'Leftover', 'Leftover words', $1, $1)`,
      [clock.now().toISOString()],
    )
    const corpus = async () =>
      (
        await pool.query<{ article_id: string; title: string }>(
          'SELECT article_id, title FROM article_search_documents ORDER BY article_id',
        )
      ).rows
    const staleHits = async () =>
      (await new PostgresSearchQuery(pool).search({ limit: 10, offset: 0, query: 'stale' })).total

    let duringSwap: { corpus: unknown; staleHits: number } | null = null
    const intercepted = {
      connect: async (): Promise<ReindexConnection> => {
        const client = await pool.connect()
        return {
          query: (async (text: string, values?: unknown[]) => {
            if (text === 'BEGIN') {
              // Charlie is unpublished after the rebuild read it, and the dispatcher removes it.
              await content.unpublish({
                articleId: 'article-charlie-story',
                expectedVersion: 2,
                idempotencyKey: 'unpublish-charlie',
                reason: 'Reindex proof',
              })
              await dispatcher.drain()
            }
            if (text === 'COMMIT')
              duringSwap = { corpus: await corpus(), staleHits: await staleHits() }
            return client.query(text, values)
          }) as ReindexConnection['query'],
          release: (destroy?: boolean) => client.release(destroy),
        }
      },
    }

    const report = await reindexSearchDocuments({
      content: repository,
      pageSize: 2,
      pool: intercepted,
    })

    expect(report).toEqual({ articles: 4, changed: 1, documents: 2 })
    // Until the swap commits, searches read the whole corpus as it was.
    expect(duringSwap).toEqual({
      corpus: [
        { article_id: 'article-alpha-story', title: 'Stale title' },
        { article_id: 'article-bravo-story', title: 'Title of bravo-story' },
        { article_id: 'article-delta-story', title: 'Leftover' },
      ],
      staleHits: 1,
    })
    // Then the rebuilt corpus in one step: the published copies, and nothing for unpublished
    // stories, including charlie, whose document the dispatcher already removed.
    expect(await corpus()).toEqual([
      { article_id: 'article-alpha-story', title: 'Title of alpha-story' },
      { article_id: 'article-bravo-story', title: 'Title of bravo-story' },
    ])
    expect(await staleHits()).toBe(0)
  }, 60_000)
})

describe('outbox migration 0007', () => {
  const database = isolatedSchema('outbox_migration', false)
  const migrationId = '0007_outbox_retry_state'
  const added = {
    columns: ['dead_lettered_at', 'next_attempt_at'],
    deadLetterAllowed: true,
    recorded: true,
  }
  const removed = { columns: [], deadLetterAllowed: false, recorded: false }

  async function migrations() {
    const all = await readContentMigrations()
    return {
      before: all.filter(({ id }) => id < migrationId),
      upTo: all.filter(({ id }) => id <= migrationId),
    }
  }

  async function retryState() {
    const { pool } = database
    const columns = await pool.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = current_schema() AND table_name = 'outbox_events'
         AND column_name IN ('dead_lettered_at', 'next_attempt_at')
       ORDER BY column_name`,
    )
    const check = await pool.query<{ definition: string }>(
      `SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint
       WHERE conname = 'outbox_events_status_check' AND conrelid = 'outbox_events'::regclass`,
    )
    const recorded = await pool.query(
      'SELECT EXISTS (SELECT FROM content_schema_migrations WHERE id = $1) AS recorded',
      [migrationId],
    )
    return {
      columns: columns.rows.map(({ column_name }) => column_name),
      deadLetterAllowed: check.rows[0]?.definition.includes("'dead_letter'") ?? false,
      recorded: recorded.rows[0]?.recorded as boolean,
    }
  }

  it('applies and reverses cleanly on an empty database and then a populated one', async () => {
    const { pool } = database
    const { before, upTo } = await migrations()
    const downSql = await readFile(
      path.join(process.cwd(), 'packages/web/migrations/0007_outbox_retry_state.down.sql'),
      'utf8',
    )
    const apply = async () =>
      expect(await applyContentMigrations(pool, upTo)).toEqual({
        applied: [migrationId],
        skipped: before.map(({ id }) => id),
      })

    // Empty: up, down, and up again.
    await applyContentMigrations(pool, before)
    expect(await retryState()).toEqual(removed)
    await apply()
    expect(await retryState()).toEqual(added)
    await pool.query(downSql)
    expect(await retryState()).toEqual(removed)
    await apply()
    expect(await retryState()).toEqual(added)

    // Populated: every status, with retry state on the failed event and the dead letter.
    const at = '2026-11-03T09:00:00.000Z'
    const later = '2026-11-03T10:00:00.000Z'
    for (const [id, status, error, nextAttemptAt, deadLetteredAt] of [
      ['outbox-pending', 'pending', null, null, null],
      ['outbox-completed', 'completed', null, null, null],
      ['outbox-failed', 'failed', 'provider refused', later, null],
      ['outbox-dead', 'dead_letter', 'unsupported event type: newsletter.unknown', null, at],
    ]) {
      await pool.query(
        `INSERT INTO outbox_events
          (id, aggregate_id, type, payload, status, attempts, last_error, created_at, updated_at,
           next_attempt_at, dead_lettered_at)
         VALUES ($1, 'article-migration', 'any.effect', '{}', $2, 1, $3, $4, $4, $5, $6)`,
        [id, status, error, at, nextAttemptAt, deadLetteredAt],
      )
    }
    const rows = async () =>
      (
        await pool.query<{ id: string; last_error: string | null; status: string }>(
          'SELECT id, status, last_error FROM outbox_events ORDER BY id',
        )
      ).rows

    await pool.query(downSql)

    expect(await retryState()).toEqual(removed)
    // The dead letter is a failed event again, its reason kept; nothing else changed.
    expect(await rows()).toEqual([
      { id: 'outbox-completed', last_error: null, status: 'completed' },
      {
        id: 'outbox-dead',
        last_error: 'unsupported event type: newsletter.unknown',
        status: 'failed',
      },
      { id: 'outbox-failed', last_error: 'provider refused', status: 'failed' },
      { id: 'outbox-pending', last_error: null, status: 'pending' },
    ])
    await expect(
      pool.query("UPDATE outbox_events SET status = 'dead_letter' WHERE id = 'outbox-dead'"),
    ).rejects.toMatchObject({ code: '23514' })

    await apply()

    expect(await retryState()).toEqual(added)
    expect(await rows()).toHaveLength(4)
    expect(
      (
        await pool.query(
          'SELECT count(*)::int AS count FROM outbox_events WHERE next_attempt_at IS NOT NULL OR dead_lettered_at IS NOT NULL',
        )
      ).rows,
    ).toEqual([{ count: 0 }])
  }, 60_000)
})
