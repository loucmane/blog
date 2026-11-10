import { randomUUID, createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { Pool } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  canonicalJson,
  createPortableContentBundle,
  importPortableContentBundle,
} from '../content/portability'
import { CURRENT_CONTENT_DOCUMENT_VERSION } from '../content/document'
import { ContentService } from '../content/service'
import { createLogger } from '../observability/logger'
import { subscriptionConsent } from '../subscriptions/consent'
import { OwnerSubscriberOperations } from '../subscriptions/owner-operations'
import { SubscriptionService } from '../subscriptions/service'
import { applyContentMigrations, readContentMigrations } from './migrations'
import { PostgresContentRepository } from './postgres-content-repository'
import { PostgresSubscriptionStore } from './postgres-subscriptions'

const databaseUrl = process.env.TASK42_DATABASE_URL
if (!databaseUrl)
  throw new Error('TASK42_DATABASE_URL is required for owner subscriber integration')
const at = '2026-11-05T10:00:00.000Z'
const later = '2026-11-06T10:00:00.000Z'
const email = 'reader@example.com'
const migrationId = '0010_subscriber_privacy_events'

describe('owner subscriber privacy on PostgreSQL', () => {
  let admin: Pool
  let source: Pool
  let target: Pool
  let schemas: string[]
  beforeEach(async () => {
    admin = new Pool({ connectionString: databaseUrl, max: 1 })
    schemas = [0, 1].map(() => `privacy_${randomUUID().replaceAll('-', '')}`)
    for (const schema of schemas) await admin.query(`CREATE SCHEMA "${schema}"`)
    source = new Pool({
      connectionString: databaseUrl,
      max: 8,
      options: `-c search_path=${schemas[0]}`,
    })
    target = new Pool({
      connectionString: databaseUrl,
      max: 8,
      options: `-c search_path=${schemas[1]}`,
    })
    const migrations = await readContentMigrations()
    await applyContentMigrations(source, migrations)
    await applyContentMigrations(target, migrations)
  }, 60_000)
  afterEach(async () => {
    await source.end()
    await target.end()
    for (const schema of schemas) await admin.query(`DROP SCHEMA "${schema}" CASCADE`)
    await admin.end()
  }, 60_000)

  function harness(pool: Pool) {
    const repository = new PostgresContentRepository(pool)
    const store = new PostgresSubscriptionStore(repository)
    const lines: string[] = []
    const service = new SubscriptionService(store, { now: () => new Date(at) })
    const operations = new OwnerSubscriberOperations(
      store,
      createLogger({ correlationId: 'privacy-integration', sink: (line) => lines.push(line) }),
      { now: () => new Date(later) },
    )
    const subscribe = () =>
      service.subscribe({
        email,
        consentTextVersion: subscriptionConsent.version,
        source: 'subscription-form',
      })
    return { repository, store, service, operations, subscribe, lines }
  }

  it('round trips subscribers, consents, audit history and redirects, and accepts v1', async () => {
    const from = harness(source)
    await from.subscribe()
    const content = new ContentService(from.repository, { now: () => new Date(at) })
    await content.createArticle({
      id: 'story',
      title: 'Portable story',
      dek: '',
      slug: 'portable-story',
      idempotencyKey: 'create-story',
      document: {
        articleId: 'story',
        schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
        migrationProvenance: [],
        title: 'Portable story',
        document: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Portable content.' }] }],
        },
      },
    })
    await from.repository.transaction((tx) =>
      tx.saveRedirect({
        id: 'redirect',
        articleId: 'story',
        fromSlug: 'old-story',
        toSlug: 'portable-story',
        createdAt: at,
      }),
    )
    await from.operations.exportSubscriber(email)
    const bundle = await createPortableContentBundle(from.repository, later, from.store)
    const to = harness(target)
    await importPortableContentBundle(to.repository, bundle, to.store)
    expect(canonicalJson(await createPortableContentBundle(to.repository, later, to.store))).toBe(
      canonicalJson(bundle),
    )
    expect(bundle.data.subscriptionEvents.some(({ type }) => type === 'exported')).toBe(true)
    expect(bundle.data.redirects).toHaveLength(1)
    // Inspect legacy compatibility on a separate empty schema, after the full round trip.
    const legacySchema = `legacy_${randomUUID().replaceAll('-', '')}`
    await admin.query(`CREATE SCHEMA "${legacySchema}"`)
    const legacyPool = new Pool({
      connectionString: databaseUrl,
      max: 1,
      options: `-c search_path=${legacySchema}`,
    })
    try {
      await applyContentMigrations(legacyPool, await readContentMigrations())
      const {
        subscribers: _subscribers,
        consents: _consents,
        subscriptionEvents: _events,
        ...data
      } = bundle.data
      const { digest: _digest, ...base } = bundle
      const unsigned = { ...base, data, version: 1 }
      const legacy = {
        ...unsigned,
        digest: createHash('sha256').update(canonicalJson(unsigned)).digest('hex'),
      }
      await importPortableContentBundle(new PostgresContentRepository(legacyPool), legacy)
      expect(
        (await legacyPool.query('SELECT count(*)::int AS count FROM articles')).rows[0].count,
      ).toBe(1)
    } finally {
      await legacyPool.end()
      await admin.query(`DROP SCHEMA "${legacySchema}" CASCADE`)
    }
  }, 60_000)

  it('removes tokens and personal data, keeps withdrawn consent, and serializes repeated erasure', async () => {
    const env = harness(source)
    await env.subscribe()
    const subscriber = (await env.store.transaction((tx) => tx.getSubscriberByEmail(email)))!
    const consent = (await env.store.transaction((tx) => tx.listConsents(subscriber.id)))[0]!
    const token = (await env.service.prepareConfirmation({
      subscriberId: subscriber.id,
      consentId: consent.id,
    }))!
    expect(await env.service.confirm({ token: token.token })).toBe('confirmed')
    await env.service.issueUnsubscribeToken({ subscriberId: subscriber.id })
    const results = await Promise.all([
      env.operations.eraseSubscriber(email, email),
      env.operations.eraseSubscriber(email, email),
    ])
    expect(results.filter((result) => result === 'erased')).toHaveLength(1)
    expect(await env.operations.eraseSubscriber(email, email)).toBe('not-found')
    expect((await source.query('SELECT * FROM subscription_tokens')).rows).toEqual([])
    expect((await source.query('SELECT email_canonical, status FROM subscribers')).rows).toEqual([
      { email_canonical: null, status: 'unsubscribed' },
    ])
    expect(await env.store.transaction((tx) => tx.listConsents(subscriber.id))).toEqual([
      { ...consent, withdrawnAt: later },
    ])
    expect(
      (await env.store.transaction((tx) => tx.listEvents(subscriber.id))).filter(
        ({ type }) => type === 'erased',
      ),
    ).toHaveLength(1)
    expect(env.lines).toHaveLength(1)
    expect(env.lines.join('')).not.toContain(email)
    expect(await env.service.confirm({ token: token.token })).toBe('invalid')
    const bundle = await createPortableContentBundle(env.repository, later, env.store)
    const restored = harness(target)
    await importPortableContentBundle(restored.repository, bundle, restored.store)
    expect(
      canonicalJson(await createPortableContentBundle(restored.repository, later, restored.store)),
    ).toBe(canonicalJson(bundle))
  })

  it('reverses 0010 without privacy history and refuses rollback or malformed privacy rows once history exists', async () => {
    const down = await readFile(
      path.join(process.cwd(), `packages/web/migrations/${migrationId}.down.sql`),
      'utf8',
    )
    await target.query(down)
    expect((await applyContentMigrations(target, await readContentMigrations())).applied).toEqual([
      migrationId,
    ])
    const env = harness(source)
    await env.subscribe()
    const bundle = (await env.operations.exportSubscriber(email))!
    const subscriber = bundle.data.subscribers[0]!
    const consent = bundle.data.consents[0]!
    await expect(
      source.query(
        'INSERT INTO subscription_events (id, subscriber_id, type, consent_id, created_at) VALUES ($1,$2,$3,$4,$5)',
        ['invalid-privacy', subscriber.id, 'exported', consent.id, at],
      ),
    ).rejects.toMatchObject({ code: '23514' })
    await expect(
      source.query("UPDATE subscription_events SET type = 'erased' WHERE type = 'exported'"),
    ).rejects.toMatchObject({ code: '23001' })
    const connection = await source.connect()
    try {
      await expect(connection.query(down)).rejects.toThrow('privacy history exists')
    } finally {
      await connection.query('ROLLBACK')
      connection.release()
    }
    expect(
      (await source.query('SELECT id FROM content_schema_migrations WHERE id=$1', [migrationId]))
        .rows,
    ).toHaveLength(1)
    expect(
      (await env.store.transaction((tx) => tx.listEvents())).filter(
        ({ type }) => type === 'exported',
      ),
    ).toHaveLength(1)
  })
})
