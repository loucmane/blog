import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { getTableColumns, getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { outboxStatuses } from '../content/domain'
import {
  subscriberStatuses,
  subscriptionEventTypes,
  subscriptionTokenPurposes,
} from '../subscriptions/domain'
import { subscriptionConfirmEventType } from '../subscriptions/service'
import { applyContentMigrations, readContentMigrations, type MigrationClient } from './migrations'
import { subscriptionTableColumns } from './postgres-subscriptions'
import {
  articleAuthors,
  contentPublicationState,
  contentTableNames,
  contentTables,
  mediaAssets,
  ownerAuthTableNames,
  ownerAuthTables,
} from './schema'

class FakeMigrationClient implements MigrationClient {
  readonly queries: { text: string; values: readonly unknown[] }[] = []
  readonly existing = new Map<string, string>()
  failOnMigration = false
  released = false

  async query<Row extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<{ rows: readonly Row[] }> {
    this.queries.push({ text, values })
    if (text.startsWith('SELECT checksum')) {
      const checksum = this.existing.get(String(values[0]))
      return { rows: (checksum ? [{ checksum }] : []) as unknown as Row[] }
    }
    if (this.failOnMigration && text.includes('CREATE TABLE publication_settings')) {
      throw new Error('synthetic interrupted migration')
    }
    if (text.startsWith('INSERT INTO content_schema_migrations')) {
      this.existing.set(String(values[0]), String(values[1]))
    }
    return { rows: [] }
  }

  release() {
    this.released = true
  }
}

describe('content database migrations', () => {
  it('keeps reviewed SQL and the Drizzle projection aligned', async () => {
    const migrationPath = path.join(
      process.cwd(),
      'packages/web/migrations/0001_content_foundation.sql',
    )
    const sql = await readFile(migrationPath, 'utf8')
    const followUpSql = (await readContentMigrations())
      .filter(({ id }) => id !== '0001_content_foundation')
      .map((migration) => migration.sql)
      .join('\n')
    const createdTables = [...sql.matchAll(/CREATE TABLE ([a-z_]+)/g)]
      .map((match) => match[1])
      .sort()

    expect(createdTables).toEqual([...contentTableNames].sort())
    for (const table of contentTables) {
      const tableName = getTableName(table)
      const block = sql.match(new RegExp(`CREATE TABLE ${tableName} \\(([\\s\\S]*?)\\n\\);`))?.[1]
      expect(block, `${tableName} SQL block`).toBeDefined()
      for (const column of Object.values(getTableColumns(table))) {
        const createdInitially = new RegExp(`^\\s+${column.name}\\s`, 'm').test(block ?? '')
        const addedLater = new RegExp(`ADD COLUMN ${column.name}\\s`, 'm').test(followUpSql)
        expect(createdInitially || addedLater, `${tableName}.${column.name}`).toBe(true)
      }
    }
    expect(sql).toContain('DEFERRABLE INITIALLY DEFERRED')
    expect(sql).toContain("original_sha256 ~ '^[0-9a-f]{64}$'")
    expect(sql).toContain('GENERATED ALWAYS AS')
    expect(sql).toContain('USING gin (document)')
    expect(sql).not.toContain('CREATE EXTENSION')
  })

  it('keeps the owner authentication migration aligned with its app-owned projection', async () => {
    const migrationPath = path.join(process.cwd(), 'packages/web/migrations/0002_owner_auth.sql')
    const sql = await readFile(migrationPath, 'utf8')
    const createdTables = [...sql.matchAll(/CREATE TABLE ([a-z_]+)/g)]
      .map((match) => match[1])
      .sort()

    expect(createdTables).toEqual([...ownerAuthTableNames].sort())
    for (const table of ownerAuthTables) {
      const tableName = getTableName(table)
      const block = sql.match(new RegExp(`CREATE TABLE ${tableName} \\(([\\s\\S]*?)\\n\\);`))?.[1]
      expect(block, `${tableName} SQL block`).toBeDefined()
      for (const column of Object.values(getTableColumns(table))) {
        expect(block, `${tableName}.${column.name}`).toMatch(
          new RegExp(`^\\s+${column.name}\\s`, 'm'),
        )
      }
    }
    expect(sql).toContain('ON DELETE CASCADE')
    expect(sql).toContain('credential_id text NOT NULL UNIQUE')
    expect(sql).toContain("WHEN article.status = 'published' THEN 'published'")
    expect(sql).toContain("WHEN article.status = 'unpublished' THEN 'unpublished'")
    const downSql = await readFile(
      path.join(process.cwd(), 'packages/web/migrations/0002_owner_auth.down.sql'),
      'utf8',
    )
    expect(downSql).toContain("DELETE FROM content_schema_migrations WHERE id = '0002_owner_auth'")
  })

  it('keeps the publication version migration aligned with its projection', async () => {
    const sql = await readFile(
      path.join(process.cwd(), 'packages/web/migrations/0003_publication_version.sql'),
      'utf8',
    )
    const tableName = getTableName(contentPublicationState)

    expect([...sql.matchAll(/CREATE TABLE ([a-z_]+)/g)].map((match) => match[1])).toEqual([
      tableName,
    ])
    const block = sql.match(new RegExp(`CREATE TABLE ${tableName} \\(([\\s\\S]*?)\\n\\);`))?.[1]
    for (const column of Object.values(getTableColumns(contentPublicationState))) {
      expect(block, `${tableName}.${column.name}`).toMatch(
        new RegExp(`^\\s+${column.name}\\s`, 'm'),
      )
    }
    expect(sql).toContain('CHECK (id = 1)')
    expect(sql).toContain(`INSERT INTO ${tableName} (id, version) VALUES (1, 0);`)
    const downSql = await readFile(
      path.join(process.cwd(), 'packages/web/migrations/0003_publication_version.down.sql'),
      'utf8',
    )
    expect(downSql).toContain(`DROP TABLE IF EXISTS ${tableName};`)
    expect(downSql).toContain(
      "DELETE FROM content_schema_migrations WHERE id = '0003_publication_version'",
    )
  })

  it('adds what was measured about media originals as a nullable column', async () => {
    const sql = await readFile(
      path.join(process.cwd(), 'packages/web/migrations/0004_media_asset_animation.sql'),
      'utf8',
    )
    const column = getTableColumns(mediaAssets).animated

    expect(column.name).toBe('animated')
    expect(column.notNull).toBe(false)
    expect(sql.trim()).toBe('ALTER TABLE media_assets ADD COLUMN animated boolean;')
    const downSql = await readFile(
      path.join(process.cwd(), 'packages/web/migrations/0004_media_asset_animation.down.sql'),
      'utf8',
    )
    expect(downSql).toContain('ALTER TABLE media_assets DROP COLUMN IF EXISTS animated;')
    expect(downSql).toContain(
      "DELETE FROM content_schema_migrations WHERE id = '0004_media_asset_animation'",
    )
  })

  it('keeps the article author migration aligned with its projection and reversible', async () => {
    const sql = await readFile(
      path.join(process.cwd(), 'packages/web/migrations/0005_article_authors.sql'),
      'utf8',
    )
    const tableName = getTableName(articleAuthors)

    expect([...sql.matchAll(/CREATE TABLE ([a-z_]+)/g)].map((match) => match[1])).toEqual([
      tableName,
    ])
    const block = sql.match(new RegExp(`CREATE TABLE ${tableName} \\(([\\s\\S]*?)\\n\\);`))?.[1]
    for (const column of Object.values(getTableColumns(articleAuthors))) {
      expect(block, `${tableName}.${column.name}`).toMatch(
        new RegExp(`^\\s+${column.name}\\s`, 'm'),
      )
    }
    expect(block).toContain('REFERENCES articles(id) ON DELETE CASCADE')
    expect(block).toContain('REFERENCES authors(id) ON DELETE RESTRICT')
    expect(block).toContain('PRIMARY KEY (article_id, author_id)')
    expect(block).toContain('UNIQUE (article_id, position)')
    expect(sql).toContain(`ON ${tableName} (author_id);`)
    const downSql = await readFile(
      path.join(process.cwd(), 'packages/web/migrations/0005_article_authors.down.sql'),
      'utf8',
    )
    expect(downSql).toContain(`DROP TABLE IF EXISTS ${tableName};`)
    expect(downSql).toContain(
      "DELETE FROM content_schema_migrations WHERE id = '0005_article_authors'",
    )
  })

  it('preflights pg_trgm, names it in public, and reverses the search query migration', async () => {
    const sql = await readFile(
      path.join(process.cwd(), 'packages/web/migrations/0006_search_query_support.sql'),
      'utf8',
    )
    const downSql = await readFile(
      path.join(process.cwd(), 'packages/web/migrations/0006_search_query_support.down.sql'),
      'utf8',
    )

    // Indexes only: the Drizzle projection checked above needs no new table or column.
    expect(sql).not.toMatch(/CREATE TABLE|ADD COLUMN/)
    // The preflight runs before anything needs the extension, and every refusal says why.
    expect(sql.indexOf('DO $preflight$')).toBeLessThan(sql.indexOf('CREATE INDEX'))
    expect(sql).toContain('CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;')
    for (const reason of [
      'but it is installed in schema %.',
      'this PostgreSQL server does not provide it.',
      'this migration could not create it: %',
    ]) {
      expect(sql).toContain(reason)
    }
    expect(sql).toContain('USING ERRCODE = SQLSTATE')
    expect(sql).toContain('ON article_search_documents USING gin (title public.gin_trgm_ops);')
    expect(sql).toMatch(
      /ON article_search_documents \(published_at DESC\)\s+INCLUDE \(article_id, slug, title\);/,
    )
    expect(downSql).toContain('DROP INDEX IF EXISTS article_search_documents_title_trgm_idx;')
    expect(downSql).toContain('DROP INDEX IF EXISTS article_search_documents_published_at_idx;')
    expect(downSql).toContain('DROP EXTENSION IF EXISTS pg_trgm;')
    expect(downSql).toContain('WHEN dependent_objects_still_exist OR insufficient_privilege')
    expect(downSql).toContain(
      "DELETE FROM content_schema_migrations WHERE id = '0006_search_query_support'",
    )
  })

  it('adds the outbox retry state, admits every outbox status, and reverses', async () => {
    const sql = await readFile(
      path.join(process.cwd(), 'packages/web/migrations/0007_outbox_retry_state.sql'),
      'utf8',
    )
    const downSql = await readFile(
      path.join(process.cwd(), 'packages/web/migrations/0007_outbox_retry_state.down.sql'),
      'utf8',
    )
    const checkedStatuses = (statements: string) =>
      [...statements.matchAll(/CHECK \(status IN \(([^)]*)\)\)/g)].map((match) =>
        (match[1] ?? '').split(',').map((status) => status.trim().replaceAll("'", '')),
      )

    expect(sql).not.toMatch(/CREATE TABLE/)
    expect(sql).toContain('ALTER TABLE outbox_events ADD COLUMN next_attempt_at timestamptz;')
    expect(sql).toContain('ALTER TABLE outbox_events ADD COLUMN dead_lettered_at timestamptz;')
    // The widened check admits exactly the statuses the domain names.
    expect(sql).toContain('ALTER TABLE outbox_events DROP CONSTRAINT outbox_events_status_check;')
    expect(checkedStatuses(sql)).toEqual([[...outboxStatuses]])

    // Down turns dead letters back into failed events before it narrows the check again.
    expect(downSql.indexOf("SET status = 'failed' WHERE status = 'dead_letter'")).toBeGreaterThan(
      -1,
    )
    expect(downSql.indexOf("SET status = 'failed' WHERE status = 'dead_letter'")).toBeLessThan(
      downSql.indexOf('ADD CONSTRAINT outbox_events_status_check'),
    )
    expect(checkedStatuses(downSql)).toEqual([['completed', 'failed', 'pending']])
    expect(downSql).toContain('ALTER TABLE outbox_events DROP COLUMN IF EXISTS next_attempt_at;')
    expect(downSql).toContain('ALTER TABLE outbox_events DROP COLUMN IF EXISTS dead_lettered_at;')
    expect(downSql).toContain(
      "DELETE FROM content_schema_migrations WHERE id = '0007_outbox_retry_state'",
    )
  })

  it('adds the subscription tables the adapter writes, keeps their history append-only, and reverses', async () => {
    const sql = await readFile(
      path.join(process.cwd(), 'packages/web/migrations/0008_subscribers_consent.sql'),
      'utf8',
    )
    const downSql = await readFile(
      path.join(process.cwd(), 'packages/web/migrations/0008_subscribers_consent.down.sql'),
      'utf8',
    )
    const block = (table: string) =>
      sql.match(new RegExp(`CREATE TABLE ${table} \\(([\\s\\S]*?)\\n\\);`))?.[1] ?? ''
    const columns = (table: string) =>
      [...block(table).matchAll(/^ {2}([a-z_]+) [a-z]/gm)].map((match) => match[1])
    const checked = (column: string) =>
      [...sql.matchAll(new RegExp(`CHECK \\(${column} IN \\(([^)]*)\\)\\)`, 'g'))].map((match) =>
        (match[1] ?? '').split(',').map((value) => value.trim().replaceAll("'", '')),
      )

    // Exactly the tables and columns the adapter writes; every key is the application's own.
    expect([...sql.matchAll(/CREATE TABLE ([a-z_]+)/g)].map((match) => match[1]).sort()).toEqual(
      Object.keys(subscriptionTableColumns).sort(),
    )
    for (const [table, expected] of Object.entries(subscriptionTableColumns)) {
      expect(columns(table), table).toEqual(expected)
    }
    expect(block('subscribers')).toContain('id text PRIMARY KEY,')
    expect(block('subscribers')).toContain('email_canonical text UNIQUE,')
    expect(block('subscription_tokens')).toContain(
      "token_hash text PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$')",
    )
    // The checks admit exactly the states, purposes and history the domain names.
    expect(checked('status')).toEqual([[...subscriberStatuses]])
    expect(checked('purpose')).toEqual([[...subscriptionTokenPurposes]])
    expect(checked('type')).toEqual([[...subscriptionEventTypes]])
    expect(sql).toMatch(
      /BEFORE UPDATE OR DELETE ON subscription_events\s+FOR EACH ROW EXECUTE FUNCTION subscription_events_append_only\(\);/,
    )
    expect(sql).toContain("USING ERRCODE = 'restrict_violation'")

    // Down drops what references another table first, and the confirmation emails still queued.
    expect(
      [...downSql.matchAll(/DROP TABLE IF EXISTS ([a-z_]+);/g)].map((match) => match[1]),
    ).toEqual(['subscription_tokens', 'subscription_events', 'subscriber_consents', 'subscribers'])
    expect(downSql).toContain('DROP FUNCTION IF EXISTS subscription_events_append_only();')
    expect(downSql).toContain(
      `DELETE FROM outbox_events WHERE type = '${subscriptionConfirmEventType}';`,
    )
    expect(downSql).toContain(
      "DELETE FROM content_schema_migrations WHERE id = '0008_subscribers_consent'",
    )
  })

  it('applies checksum-pinned migrations transactionally and skips exact replays', async () => {
    const migrations = await readContentMigrations()
    const first = new FakeMigrationClient()

    await expect(
      applyContentMigrations({ connect: async () => first }, migrations),
    ).resolves.toEqual({
      applied: [
        '0001_content_foundation',
        '0002_owner_auth',
        '0003_publication_version',
        '0004_media_asset_animation',
        '0005_article_authors',
        '0006_search_query_support',
        '0007_outbox_retry_state',
        '0008_subscribers_consent',
        '0009_distribution_telemetry',
      ],
      skipped: [],
    })
    expect(first.queries.at(0)?.text).toBe('BEGIN')
    expect(first.queries.at(-1)?.text).toBe('COMMIT')
    expect(first.released).toBe(true)

    const second = new FakeMigrationClient()
    for (const migration of migrations) second.existing.set(migration.id, migration.checksum)
    await expect(
      applyContentMigrations({ connect: async () => second }, migrations),
    ).resolves.toEqual({
      applied: [],
      skipped: [
        '0001_content_foundation',
        '0002_owner_auth',
        '0003_publication_version',
        '0004_media_asset_animation',
        '0005_article_authors',
        '0006_search_query_support',
        '0007_outbox_retry_state',
        '0008_subscribers_consent',
        '0009_distribution_telemetry',
      ],
    })
  })

  it('runs optional history validation on the locked client before writes and rolls refusals back', async () => {
    const migrations = await readContentMigrations()
    const client = new FakeMigrationClient()
    const refusal = new Error('synthetic incompatible history')

    await expect(
      applyContentMigrations({ connect: async () => client }, migrations, async (lockedClient) => {
        expect(lockedClient).toBe(client)
        expect(client.queries.map(({ text }) => text)).toEqual([
          'BEGIN',
          "SELECT pg_advisory_xact_lock(hashtext('magazine-content-migrations'))",
        ])
        throw refusal
      }),
    ).rejects.toBe(refusal)
    expect(client.queries.map(({ text }) => text)).toEqual([
      'BEGIN',
      "SELECT pg_advisory_xact_lock(hashtext('magazine-content-migrations'))",
      'ROLLBACK',
    ])
    expect(client.released).toBe(true)
  })

  it('preserves partial-list callers without command-level history validation', async () => {
    const migrations = await readContentMigrations()
    const client = new FakeMigrationClient()
    client.existing.set('9999_synthetic_other_release', '0'.repeat(64))
    client.existing.set(migrations[2]!.id, migrations[2]!.checksum)

    await expect(
      applyContentMigrations({ connect: async () => client }, migrations.slice(0, 2)),
    ).resolves.toEqual({
      applied: migrations.slice(0, 2).map(({ id }) => id),
      skipped: [],
    })
    expect(client.queries.at(-1)?.text).toBe('COMMIT')
    expect(client.released).toBe(true)
  })

  it('fails closed on checksum drift and rolls interrupted migrations back', async () => {
    const migrations = await readContentMigrations()
    const drift = new FakeMigrationClient()
    drift.existing.set(migrations[0]!.id, '0'.repeat(64))
    await expect(
      applyContentMigrations({ connect: async () => drift }, migrations),
    ).rejects.toThrow(/checksum does not match/)
    expect(drift.queries.at(-1)?.text).toBe('ROLLBACK')

    const interrupted = new FakeMigrationClient()
    interrupted.failOnMigration = true
    await expect(
      applyContentMigrations({ connect: async () => interrupted }, migrations),
    ).rejects.toThrow(/synthetic interrupted migration/)
    expect(interrupted.queries.at(-1)?.text).toBe('ROLLBACK')
    expect(interrupted.released).toBe(true)
  })
})
