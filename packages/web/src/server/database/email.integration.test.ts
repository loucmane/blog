import { randomUUID } from 'node:crypto'

import { Pool } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { OutboxEvent } from '../content/domain'
import type { EmailSender, OutboundEmail } from '../email/ports'
import { createLogger } from '../observability/logger'
import { OutboxDispatcher } from '../outbox/dispatcher'
import { createOutboxHandlers } from '../outbox/handlers'
import { subscriptionConsent } from '../subscriptions/consent'
import { SubscriptionService, subscriptionConfirmEventType } from '../subscriptions/service'
import { applyContentMigrations, readContentMigrations } from './migrations'
import { PostgresContentRepository } from './postgres-content-repository'
import { PostgresOutboxStore } from './postgres-outbox-store'
import { PostgresSearchProjection } from './postgres-search-projection'
import { PostgresSubscriptionStore } from './postgres-subscriptions'

const databaseUrl = process.env.TASK42_DATABASE_URL
if (!databaseUrl) throw new Error('TASK42_DATABASE_URL is required for the email integration suite')
const now = '2026-11-04T09:00:00.000Z'

describe('PostgreSQL email delivery and rollout requeue', () => {
  let admin: Pool
  let pool: Pool
  let schema: string

  beforeEach(async () => {
    schema = `email_${randomUUID().replaceAll('-', '')}`
    admin = new Pool({ connectionString: databaseUrl, max: 1 })
    await admin.query(`CREATE SCHEMA "${schema}"`)
    pool = new Pool({ connectionString: databaseUrl, max: 8, options: `-c search_path=${schema}` })
    await applyContentMigrations(pool, await readContentMigrations())
  }, 60_000)

  afterEach(async () => {
    await pool.end()
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
    await admin.end()
  }, 60_000)

  async function setup() {
    const clock = { now: () => new Date(now) }
    const repository = new PostgresContentRepository(pool)
    const subscriptions = new SubscriptionService(new PostgresSubscriptionStore(repository), clock)
    const store = new PostgresOutboxStore(repository)
    const messages = new Map<string, OutboundEmail>()
    const sender: EmailSender = {
      send: async (message, key) => {
        const duplicate = messages.has(key)
        if (!duplicate) messages.set(key, message)
        return { delivery: 'accepted', duplicate }
      },
    }
    const logger = createLogger({ correlationId: 'email-integration', sink: () => undefined })
    const handlers = createOutboxHandlers({
      cache: { revalidate: async () => undefined },
      content: repository,
      search: new PostgresSearchProjection(pool),
      email: { sender, subscriptions, siteUrl: new URL('https://magazine.example/') },
    })
    await subscriptions.subscribe({
      email: 'reader@example.com',
      source: 'subscription-form',
      consentTextVersion: subscriptionConsent.version,
    })
    const event = (await repository.transaction((tx) => tx.listOutboxEvents()))[0]
    if (!event) throw new Error('Missing confirmation event')
    return { clock, event, handlers, logger, messages, repository, store, subscriptions }
  }

  it('atomically requeues only historical unsupported confirmations, once even with concurrent callers', async () => {
    const env = await setup()
    const historical = new Map(env.handlers)
    historical.delete(subscriptionConfirmEventType)
    await new OutboxDispatcher({ ...env, handlers: historical }).drain()
    const others: OutboxEvent[] = [
      {
        ...env.event,
        id: 'other-delivery-failure',
        status: 'dead_letter',
        attempts: 6,
        lastError: 'Email delivery failed',
      },
      {
        ...env.event,
        id: 'other-event',
        type: 'email.issue',
        status: 'dead_letter',
        attempts: 1,
        lastError: `unsupported event type: ${subscriptionConfirmEventType}`,
      },
      {
        ...env.event,
        id: 'already-completed',
        status: 'completed',
        attempts: 1,
        lastError: `unsupported event type: ${subscriptionConfirmEventType}`,
      },
    ]
    await env.repository.transaction(async (tx) => {
      for (const event of others) await tx.saveOutboxEvent(event)
    })
    const results = await Promise.all([
      env.store.requeueUnsupportedConfirmations(now),
      new PostgresOutboxStore(env.repository).requeueUnsupportedConfirmations(now),
    ])
    expect(results.flat()).toEqual([env.event.id])
    expect(await env.store.requeueUnsupportedConfirmations(now)).toEqual([])
    expect(
      (
        await pool.query(
          'SELECT status, attempts, last_error, next_attempt_at, dead_lettered_at, payload FROM outbox_events WHERE id = $1',
          [env.event.id],
        )
      ).rows,
    ).toEqual([
      {
        status: 'pending',
        attempts: 0,
        last_error: null,
        next_attempt_at: null,
        dead_lettered_at: null,
        payload: env.event.payload,
      },
    ])
    const retained = await env.repository.transaction((tx) => tx.listOutboxEvents())
    for (const other of others) expect(retained.find(({ id }) => id === other.id)).toEqual(other)
    expect(await new OutboxDispatcher(env).drain()).toEqual({
      completed: [env.event.id],
      deadLettered: [],
      retrying: [],
    })
    expect(env.messages.size).toBe(1)
    const message = env.messages.get(env.event.id)
    const link = message?.text.match(/https:\/\/\S+/)?.[0]
    if (!link) throw new Error('Missing confirmation link')
    expect(
      await env.subscriptions.confirm({ token: new URL(link).searchParams.get('token') }),
    ).toBe('confirmed')
  }, 60_000)

  it('replays after delivery commits but recording rolls back without another external effect', async () => {
    const env = await setup()
    const interrupted = new OutboxDispatcher({
      ...env,
      store: {
        listDeadLetters: () => env.store.listDeadLetters(),
        claimNextDue: (at, work) =>
          env.store.claimNextDue(at, (claim) =>
            work({
              ...claim,
              record: async () => {
                throw new Error('Recording interrupted')
              },
            }),
          ),
      },
    })
    await expect(interrupted.dispatchNext()).rejects.toThrow('Recording interrupted')
    expect(env.messages.size).toBe(1)
    expect(await env.repository.transaction((tx) => tx.getOutboxEvent(env.event.id))).toMatchObject(
      { status: 'pending', attempts: 0 },
    )
    expect((await new OutboxDispatcher(env).dispatchNext())?.outcome).toBe('completed')
    expect(env.messages.size).toBe(1)
    expect(await env.store.requeueUnsupportedConfirmations(now)).toEqual([])
  }, 60_000)
})
