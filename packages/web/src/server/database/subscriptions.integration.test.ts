import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { Pool } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { Clock, IdentifierSource } from '../content/ports'
import { OutboxDispatcher } from '../outbox/dispatcher'
import { createOutboxHandlers } from '../outbox/handlers'
import { subscriptionConsent } from '../subscriptions/consent'
import { createSubscriptionRequestLimiter } from '../subscriptions/rate-limit'
import { answerSubscriptionRequest } from '../subscriptions/requests'
import {
  subscriptionConfirmEventType,
  SubscriptionService,
  type IssuedSubscriptionToken,
} from '../subscriptions/service'
import { hashSubscriptionToken } from '../subscriptions/tokens'
import { applyContentMigrations, readContentMigrations } from './migrations'
import { PostgresContentRepository } from './postgres-content-repository'
import { PostgresOutboxStore } from './postgres-outbox-store'
import { PostgresSearchProjection } from './postgres-search-projection'
import { PostgresSubscriptionStore } from './postgres-subscriptions'

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required for the subscription integration suite`)
  return value
}

const databaseUrl = requiredEnvironment('TASK42_DATABASE_URL')
const migrationId = '0008_subscribers_consent'
const minute = 60_000
const day = 24 * 60 * minute
const start = '2026-11-03T09:00:00.000Z'
const address = 'reader@example.com'
const subscriptionTables = [
  'subscriber_consents',
  'subscribers',
  'subscription_events',
  'subscription_tokens',
]

class TestClock implements Clock {
  private value = new Date(start)

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

/** A schema of its own for each case, with every content migration applied or none. */
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

function harness(pool: Pool) {
  const clock = new TestClock()
  const identifiers = new Identifiers()
  const repository = new PostgresContentRepository(pool)
  const service = new SubscriptionService(
    new PostgresSubscriptionStore(repository),
    clock,
    identifiers,
  )
  const request = (email = address) =>
    service.subscribe({
      consentTextVersion: subscriptionConsent.version,
      email,
      source: 'subscription-form',
    })
  /** The token the address's newest confirmation email would carry. */
  const confirmationFor = async (email = address): Promise<IssuedSubscriptionToken> => {
    const queued = await pool.query<{ payload: { consentId: string; subscriberId: string } }>(
      `SELECT outbox.payload FROM outbox_events AS outbox
       JOIN subscribers ON subscribers.id = outbox.aggregate_id
       WHERE outbox.type = $1 AND subscribers.email_canonical = $2
       ORDER BY outbox.created_at DESC, outbox.id DESC LIMIT 1`,
      [subscriptionConfirmEventType, email],
    )
    const payload = queued.rows[0]?.payload
    const issued = payload ? await service.prepareConfirmation(payload) : null
    if (!issued) throw new Error(`No confirmation token for ${email}.`)
    return issued
  }
  const unsubscribeFor = async (email = address): Promise<IssuedSubscriptionToken> => {
    const subscriber = await pool.query<{ id: string }>(
      'SELECT id FROM subscribers WHERE email_canonical = $1',
      [email],
    )
    const issued = await service.issueUnsubscribeToken({
      subscriberId: subscriber.rows[0]?.id ?? '',
    })
    if (!issued) throw new Error(`${email} is not confirmed.`)
    return issued
  }
  return { clock, confirmationFor, repository, request, service, unsubscribeFor }
}

async function rowsOf(pool: Pool, table: string) {
  return (await pool.query(`SELECT * FROM ${table} ORDER BY 1`)).rows
}

/** Every row of the subscription tables and the outbox, as text. */
async function everything(pool: Pool): Promise<string> {
  const result = await pool.query<{ record_text: string }>(
    [...subscriptionTables, 'outbox_events']
      .map((table) => `SELECT row_to_json(stored)::text AS record_text FROM ${table} AS stored`)
      .join(' UNION ALL '),
  )
  return result.rows.map(({ record_text }) => record_text).join('\n')
}

describe('subscription migration 0008', () => {
  const database = isolatedSchema('subscriptions_migration', false)

  async function migrations() {
    const all = await readContentMigrations()
    return {
      before: all.filter(({ id }) => id < migrationId),
      upTo: all.filter(({ id }) => id <= migrationId),
    }
  }

  async function schemaState() {
    const { pool } = database
    const tables = await pool.query<{ name: string }>(
      `SELECT table_name::text AS name FROM information_schema.tables
       WHERE table_schema = current_schema() AND table_name::text = ANY($1::text[])
       ORDER BY table_name`,
      [subscriptionTables],
    )
    const functions = await pool.query<{ count: number }>(
      `SELECT count(*)::int AS count FROM pg_proc
       JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
       WHERE pg_proc.proname = 'subscription_events_append_only'
         AND pg_namespace.nspname = current_schema()`,
    )
    const recorded = await pool.query<{ recorded: boolean }>(
      'SELECT EXISTS (SELECT FROM content_schema_migrations WHERE id = $1) AS recorded',
      [migrationId],
    )
    return {
      appendOnlyFunction: functions.rows[0]?.count === 1,
      recorded: recorded.rows[0]?.recorded,
      tables: tables.rows.map(({ name }) => name),
    }
  }

  const added = { appendOnlyFunction: true, recorded: true, tables: subscriptionTables }
  const removed = { appendOnlyFunction: false, recorded: false, tables: [] }

  it('applies and reverses cleanly on an empty database and then a populated one', async () => {
    const { pool } = database
    const { before, upTo } = await migrations()
    const downSql = await readFile(
      path.join(process.cwd(), 'packages/web/migrations/0008_subscribers_consent.down.sql'),
      'utf8',
    )
    const apply = async () =>
      expect(await applyContentMigrations(pool, upTo)).toEqual({
        applied: [migrationId],
        skipped: before.map(({ id }) => id),
      })

    // Empty: up, down, and up again.
    await applyContentMigrations(pool, before)
    expect(await schemaState()).toEqual(removed)
    await apply()
    expect(await schemaState()).toEqual(added)
    await pool.query(downSql)
    expect(await schemaState()).toEqual(removed)
    await apply()
    expect(await schemaState()).toEqual(added)

    // Populated: an ended subscription, a confirmed one and a pending one, beside a story's event.
    const env = harness(pool)
    await pool.query(
      `INSERT INTO outbox_events
        (id, aggregate_id, type, payload, status, attempts, last_error, created_at, updated_at)
       VALUES ('outbox-story', 'article-story', 'article.published', '{}', 'pending', 0, NULL, $1, $1)`,
      [start],
    )
    for (const email of ['ended@example.com', 'confirmed@example.com', 'pending@example.com']) {
      await env.request(email)
    }
    for (const email of ['ended@example.com', 'confirmed@example.com']) {
      expect(await env.service.confirm({ token: (await env.confirmationFor(email)).token })).toBe(
        'confirmed',
      )
    }
    expect(
      await env.service.unsubscribe({
        token: (await env.unsubscribeFor('ended@example.com')).token,
      }),
    ).toBe('unsubscribed')
    const outbox = async () =>
      (
        await pool.query<{ id: string; type: string }>(
          'SELECT id, type FROM outbox_events ORDER BY created_at, id',
        )
      ).rows
    expect((await outbox()).map(({ type }) => type).sort()).toEqual([
      'article.published',
      ...Array<string>(3).fill(subscriptionConfirmEventType),
    ])

    await pool.query(downSql)

    // Only the subscription data went: the story's event is still queued.
    expect(await schemaState()).toEqual(removed)
    expect(await outbox()).toEqual([{ id: 'outbox-story', type: 'article.published' }])

    await apply()

    expect(await schemaState()).toEqual(added)
    for (const table of subscriptionTables) expect(await rowsOf(pool, table), table).toEqual([])
  }, 60_000)
})

describe('subscriptions on real PostgreSQL', () => {
  const database = isolatedSchema('subscriptions', true)

  it('stores a pending subscriber, its consent and its confirmation email in one transaction', async () => {
    const { pool } = database
    const env = harness(pool)

    expect(await env.request(' Reader@Example.COM ')).toBe('confirmation-queued')

    const at = new Date(start)
    expect(await rowsOf(pool, 'subscribers')).toEqual([
      {
        confirmed_at: null,
        created_at: at,
        email_canonical: address,
        id: 'subscriber-integration-001',
        status: 'pending',
        unsubscribed_at: null,
        updated_at: at,
      },
    ])
    expect(await rowsOf(pool, 'subscriber_consents')).toEqual([
      {
        consent_text_version: subscriptionConsent.version,
        granted_at: at,
        id: 'consent-integration-002',
        source: 'subscription-form',
        subscriber_id: 'subscriber-integration-001',
        withdrawn_at: null,
      },
    ])
    expect(await rowsOf(pool, 'subscription_events')).toEqual([
      {
        consent_id: 'consent-integration-002',
        created_at: at,
        id: 'subscription-event-integration-003',
        subscriber_id: 'subscriber-integration-001',
        type: 'confirmation-requested',
      },
    ])
    const outbox = await pool.query(
      'SELECT id, aggregate_id, type, payload, status, attempts FROM outbox_events',
    )
    expect(outbox.rows).toEqual([
      {
        aggregate_id: 'subscriber-integration-001',
        attempts: 0,
        id: 'outbox-integration-004',
        payload: {
          consentId: 'consent-integration-002',
          subscriberId: 'subscriber-integration-001',
        },
        status: 'pending',
        type: subscriptionConfirmEventType,
      },
    ])
    expect(JSON.stringify(outbox.rows)).not.toContain('example.com')

    // When the outbox refuses the event, the subscriber and the consent are not kept either.
    await pool.query(`CREATE FUNCTION refuse_outbox_event() RETURNS trigger
      LANGUAGE plpgsql AS $refuse$
      BEGIN
        RAISE EXCEPTION 'The outbox is unavailable.';
      END
      $refuse$`)
    await pool.query(`CREATE TRIGGER refuse_outbox_event BEFORE INSERT ON outbox_events
      FOR EACH ROW EXECUTE FUNCTION refuse_outbox_event()`)
    await expect(env.request('second@example.com')).rejects.toThrow('The outbox is unavailable.')
    expect(
      (
        await pool.query(
          `SELECT (SELECT count(*) FROM subscribers)::int AS subscribers,
                  (SELECT count(*) FROM subscriber_consents)::int AS consents,
                  (SELECT count(*) FROM subscription_events)::int AS events`,
        )
      ).rows,
    ).toEqual([{ consents: 1, events: 1, subscribers: 1 }])
  }, 60_000)

  it('claims one subscriber when requests for one new address race', async () => {
    const { pool } = database
    const env = harness(pool)

    const outcomes = await Promise.all(Array.from({ length: 5 }, () => env.request()))

    expect(outcomes.sort()).toEqual([
      'confirmation-queued',
      'throttled',
      'throttled',
      'throttled',
      'throttled',
    ])
    expect(
      (
        await pool.query(
          `SELECT (SELECT count(*) FROM subscribers)::int AS subscribers,
                  (SELECT count(*) FROM subscriber_consents)::int AS consents,
                  (SELECT count(*) FROM outbox_events)::int AS emails`,
        )
      ).rows,
    ).toEqual([{ consents: 1, emails: 1, subscribers: 1 }])
  }, 60_000)

  it('confirms with a single-use token kept only as its hash and good for confirming alone', async () => {
    const { pool } = database
    const env = harness(pool)
    await env.request()

    const issued = await env.confirmationFor()

    expect(await rowsOf(pool, 'subscription_tokens')).toEqual([
      {
        consent_id: 'consent-integration-002',
        consumed_at: null,
        created_at: new Date(start),
        expires_at: new Date(Date.parse(start) + 3 * day),
        purpose: 'confirm',
        subscriber_id: 'subscriber-integration-001',
        token_hash: hashSubscriptionToken(issued.token, 'confirm'),
      },
    ])
    // Nothing stored anywhere holds the token itself.
    expect(await everything(pool)).not.toContain(issued.token)

    // Scoped to confirming: the unsubscribe route finds nothing for it.
    expect(await env.service.unsubscribe({ token: issued.token })).toBe('invalid')
    env.clock.advance(minute)
    expect(await env.service.confirm({ token: issued.token })).toBe('confirmed')
    expect(await env.service.confirm({ token: issued.token })).toBe('already-confirmed')

    const confirmedAt = new Date(Date.parse(start) + minute)
    expect(await rowsOf(pool, 'subscribers')).toEqual([
      expect.objectContaining({ confirmed_at: confirmedAt, status: 'confirmed' }),
    ])
    expect(await rowsOf(pool, 'subscription_tokens')).toEqual([
      expect.objectContaining({ consumed_at: confirmedAt }),
    ])
    expect((await rowsOf(pool, 'subscription_events')).map(({ type }) => type)).toEqual([
      'confirmation-requested',
      'confirmed',
    ])
  }, 60_000)

  it('refuses an expired confirmation token and leaves the subscriber waiting', async () => {
    const { pool } = database
    const env = harness(pool)
    await env.request()
    const issued = await env.confirmationFor()
    env.clock.advance(3 * day)

    expect(await env.service.confirm({ token: issued.token })).toBe('expired')

    expect(await rowsOf(pool, 'subscribers')).toEqual([
      expect.objectContaining({ confirmed_at: null, status: 'pending' }),
    ])
  }, 60_000)

  it('unsubscribes in one step and keeps the withdrawn consent and the whole history', async () => {
    const { pool } = database
    const env = harness(pool)
    await env.request()
    await env.service.confirm({ token: (await env.confirmationFor()).token })
    const unsubscribe = await env.unsubscribeFor()
    env.clock.advance(day)

    expect(await env.service.unsubscribe({ token: unsubscribe.token })).toBe('unsubscribed')

    const ended = new Date(Date.parse(start) + day)
    expect(await rowsOf(pool, 'subscribers')).toEqual([
      expect.objectContaining({
        email_canonical: address,
        status: 'unsubscribed',
        unsubscribed_at: ended,
      }),
    ])
    expect(await rowsOf(pool, 'subscriber_consents')).toEqual([
      expect.objectContaining({
        consent_text_version: subscriptionConsent.version,
        granted_at: new Date(start),
        withdrawn_at: ended,
      }),
    ])
    expect(
      (await rowsOf(pool, 'subscription_tokens')).map(({ consumed_at, purpose }) => [
        purpose,
        consumed_at,
      ]),
    ).toEqual(
      expect.arrayContaining([
        ['confirm', new Date(start)],
        ['unsubscribe', ended],
      ]),
    )
    expect(await env.service.unsubscribe({ token: unsubscribe.token })).toBe('already-unsubscribed')

    // A new request starts a new subscription, which the old link cannot end.
    env.clock.advance(minute)
    expect(await env.request()).toBe('confirmation-queued')
    expect(await env.service.unsubscribe({ token: unsubscribe.token })).toBe('invalid')
    const history = await pool.query<{ consent_id: string | null; type: string }>(
      'SELECT type, consent_id FROM subscription_events ORDER BY created_at, id',
    )
    expect(history.rows.map(({ type }) => type)).toEqual([
      'confirmation-requested',
      'confirmed',
      'unsubscribed',
      'confirmation-requested',
    ])
    expect(
      (await rowsOf(pool, 'subscriber_consents')).map(({ withdrawn_at }) => withdrawn_at),
    ).toEqual([ended, null])
  }, 60_000)

  it('refuses to change or delete the recorded history, or the subscriber it belongs to', async () => {
    const { pool } = database
    const env = harness(pool)
    await env.request()

    await expect(
      pool.query("UPDATE subscription_events SET type = 'confirmed'"),
    ).rejects.toMatchObject({ code: '23001' })
    await expect(pool.query('DELETE FROM subscription_events')).rejects.toMatchObject({
      code: '23001',
    })
    await expect(pool.query('DELETE FROM subscribers')).rejects.toMatchObject({ code: '23001' })
    expect(await rowsOf(pool, 'subscription_events')).toHaveLength(1)
  }, 60_000)

  it('keeps every live subscription addressable and every stored token a hash', async () => {
    const { pool } = database
    const env = harness(pool)
    await env.request()

    await expect(
      pool.query("UPDATE subscribers SET email_canonical = NULL WHERE status = 'pending'"),
    ).rejects.toMatchObject({ code: '23514' })
    await expect(
      pool.query("UPDATE subscribers SET email_canonical = 'Reader@Example.com'"),
    ).rejects.toMatchObject({ code: '23514' })
    await expect(
      pool.query(
        `INSERT INTO subscription_tokens
          (token_hash, subscriber_id, purpose, consent_id, created_at, expires_at)
         VALUES ('not-a-hash', 'subscriber-integration-001', 'unsubscribe', NULL, $1, $2)`,
        [start, new Date(Date.parse(start) + day)],
      ),
    ).rejects.toMatchObject({ code: '23514' })
  }, 60_000)

  it('sets an unhandled confirmation email aside as a dead letter and keeps its payload', async () => {
    const { pool } = database
    const env = harness(pool)
    await env.request()
    const store = new PostgresOutboxStore(env.repository)
    const historicalHandlers = new Map(
      createOutboxHandlers({
        cache: { revalidate: async () => undefined },
        content: env.repository,
        search: new PostgresSearchProjection(pool),
      }),
    )
    historicalHandlers.delete(subscriptionConfirmEventType)
    const dispatcher = new OutboxDispatcher({
      clock: env.clock,
      handlers: historicalHandlers,
      store,
    })

    expect(await dispatcher.drain()).toEqual({
      completed: [],
      deadLettered: ['outbox-integration-004'],
      retrying: [],
    })

    expect(await store.listDeadLetters()).toEqual([
      expect.objectContaining({
        attempts: 1,
        deadLetteredAt: start,
        id: 'outbox-integration-004',
        lastError: `unsupported event type: ${subscriptionConfirmEventType}`,
        payload: {
          consentId: 'consent-integration-002',
          subscriberId: 'subscriber-integration-001',
        },
        status: 'dead_letter',
        type: subscriptionConfirmEventType,
      }),
    ])
    expect(await rowsOf(pool, 'subscribers')).toEqual([
      expect.objectContaining({ status: 'pending' }),
    ])
  }, 60_000)

  it('answers a request with the same bytes whatever the state of its address', async () => {
    const { pool } = database
    const env = harness(pool)
    for (const email of ['pending@example.com', 'confirmed@example.com', 'ended@example.com']) {
      await env.request(email)
    }
    for (const email of ['confirmed@example.com', 'ended@example.com']) {
      await env.service.confirm({ token: (await env.confirmationFor(email)).token })
    }
    await env.service.unsubscribe({ token: (await env.unsubscribeFor('ended@example.com')).token })
    env.clock.advance(minute)
    const siteUrl = new URL('http://127.0.0.1:3000/')
    const limiter = createSubscriptionRequestLimiter()

    const answers = []
    for (const [index, email] of [
      'new@example.com',
      'pending@example.com',
      'confirmed@example.com',
      'ended@example.com',
    ].entries()) {
      const response = await answerSubscriptionRequest(
        new Request(new URL('/api/subscriptions', siteUrl), {
          body: JSON.stringify({ consentTextVersion: subscriptionConsent.version, email }),
          headers: {
            'content-type': 'application/json',
            origin: siteUrl.origin,
            'x-real-ip': `198.51.100.${index + 1}`,
          },
          method: 'POST',
        }),
        { limiter, now: () => env.clock.now().valueOf(), service: env.service, siteUrl },
      )
      answers.push({
        body: await response.text(),
        headers: [...response.headers],
        status: response.status,
      })
    }

    expect(answers[0]?.status).toBe(202)
    for (const answer of answers.slice(1)) expect(answer).toEqual(answers[0])
    // Underneath, the new, pending and ended addresses were asked to confirm; the confirmed was not.
    expect(
      (
        await pool.query<{ email: string; status: string }>(
          'SELECT email_canonical AS email, status FROM subscribers ORDER BY email_canonical',
        )
      ).rows,
    ).toEqual([
      { email: 'confirmed@example.com', status: 'confirmed' },
      { email: 'ended@example.com', status: 'pending' },
      { email: 'new@example.com', status: 'pending' },
      { email: 'pending@example.com', status: 'pending' },
    ])
  }, 60_000)
})
