import { spawn } from 'node:child_process'

import { Pool } from 'pg'

import type { ContentMigration, MigrationClient } from '../database/migrations'
import {
  DrillError,
  fingerprint,
  hash,
  type DrillFailure,
  type TableEvidence,
} from './restore-drill-contract'

export type PostgresTool = 'pg_dump' | 'pg_restore'
export type PostgresToolRunner = (
  command: PostgresTool,
  args: readonly string[],
  databaseUrl?: string,
  input?: Uint8Array,
) => Promise<Buffer>

// A deliberately bounded local drill: raw archives are held in memory, never logged or saved.
export const runPostgresTool: PostgresToolRunner = (command, args, databaseUrl, input) =>
  new Promise((resolve, reject) => {
    // These subprocesses are PostgreSQL tools, not Next; omit its augmented required env fields.
    const environment = { PATH: process.env.PATH, LANG: 'C' } as unknown as NodeJS.ProcessEnv
    if (databaseUrl) {
      const url = new URL(databaseUrl)
      Object.assign(environment, {
        PGHOST: url.hostname.replace(/^\[|\]$/g, ''),
        PGPORT: url.port || '5432',
        PGDATABASE: url.pathname.slice(1),
        PGUSER: decodeURIComponent(url.username),
        PGPASSWORD: decodeURIComponent(url.password),
        PGSSLMODE: 'disable',
        PGCONNECT_TIMEOUT: '10',
      })
    }
    const child = spawn(command, [...args], {
      env: environment,
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 900_000,
    })
    const chunks: Buffer[] = []
    let size = 0
    let exceeded = false
    child.stdout.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > 256 * 1024 * 1024) {
        exceeded = true
        child.kill('SIGKILL')
      } else chunks.push(chunk)
    })
    child.once('error', () => reject(new DrillError('operation_failed')))
    child.stdin.on('error', () => reject(new DrillError('operation_failed')))
    child.once('close', (code) =>
      code === 0 && !exceeded
        ? resolve(Buffer.concat(chunks))
        : reject(new DrillError('operation_failed')),
    )
    child.stdin.end(input)
  })

export function drillPool(databaseUrl: string): Pool {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 2,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 60_000,
    options: '-c timezone=UTC -c search_path=public',
  })
  // Never let pg emit driver text containing connection information to stderr.
  pool.on('error', () => {})
  return pool
}

export function quotedIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}

export interface MigrationIdentity {
  readonly id: string
  readonly checksum: string
}

export async function migrationIdentity(
  client: Pick<MigrationClient, 'query'>,
): Promise<readonly MigrationIdentity[]> {
  const result = await client.query<{ id: string; checksum: string }>(
    'SELECT id, checksum FROM public.content_schema_migrations ORDER BY id',
  )
  return result.rows
}

export function requireMigrationPrefix(
  actual: readonly MigrationIdentity[],
  reviewed: readonly ContentMigration[],
): void {
  if (
    actual.length === 0 ||
    actual.length > reviewed.length ||
    actual.some(
      (entry, index) =>
        entry.id !== reviewed[index]?.id || entry.checksum !== reviewed[index]?.checksum,
    )
  ) {
    throw new DrillError('migration_identity_mismatch')
  }
}

export function postgres18Version(output: string): string {
  const version = output
    .trim()
    .match(/^(?:pg_(?:dump|restore) \(PostgreSQL\) )?(18(?:\.\d+)?)(?:\s.*)?$/)?.[1]
  if (!version) throw new DrillError('unsupported_version')
  return version
}

// Only these fixed labels appear in evidence; all other table identities are hashed.
const entityNames = new Set([
  'publication_settings',
  'authors',
  'articles',
  'article_revisions',
  'article_autosaves',
  'taxonomies',
  'article_taxonomies',
  'article_authors',
  'slug_redirects',
  'media_assets',
  'media_renditions',
  'reusable_blocks',
  'reusable_block_revisions',
  'publishing_jobs',
  'outbox_events',
  'audit_events',
  'idempotency_records',
  'article_search_documents',
  'owner_users',
  'owner_sessions',
  'owner_accounts',
  'owner_verifications',
  'owner_passkeys',
  'subscribers',
  'subscriber_consents',
  'subscription_events',
  'subscription_tokens',
  'content_publication_state',
  'analytics_page_views_daily',
  'web_vitals_daily',
])

export async function captureTables(
  client: Pick<MigrationClient, 'query'>,
): Promise<Record<string, TableEvidence>> {
  const tables = await client.query<{ schemaname: string; tablename: string }>(
    `SELECT schemaname, tablename FROM pg_catalog.pg_tables
     WHERE schemaname NOT IN ('pg_catalog', 'information_schema') AND schemaname NOT LIKE 'pg_toast%'
     ORDER BY schemaname, tablename`,
  )
  const result: Record<string, TableEvidence> = {}
  for (const { schemaname, tablename } of tables.rows) {
    if (schemaname === 'public' && tablename === 'content_schema_migrations') continue
    const rows = await client.query<{ value: string }>(
      `SELECT to_jsonb(t)::text AS value FROM ${quotedIdentifier(schemaname)}.${quotedIdentifier(tablename)} t`,
    )
    const label =
      schemaname === 'public' && entityNames.has(tablename)
        ? tablename
        : hash(`${schemaname}.${tablename}`)
    // PostgreSQL renders jsonb deterministically, including full-precision numeric values.
    result[label] = {
      count: rows.rows.length,
      sha256: fingerprint(rows.rows.map(({ value }) => hash(value)).sort()),
    }
  }
  return result
}

export function compareTables(
  source: Record<string, TableEvidence>,
  restored: Record<string, TableEvidence>,
): DrillFailure[] {
  const failures: DrillFailure[] = []
  for (const subject of new Set([...Object.keys(source), ...Object.keys(restored)])) {
    const expected = source[subject]
    const actual = restored[subject]
    if (!expected || !actual || expected.count !== actual.count)
      failures.push({ code: 'row_count_mismatch', stage: 'comparison', subject })
    else if (expected.sha256 !== actual.sha256)
      failures.push({ code: 'invariant_changed', stage: 'comparison', subject })
  }
  return failures
}
