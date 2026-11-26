import { spawn } from 'node:child_process'
import { checkServerIdentity } from 'node:tls'

import { Client, Pool, type ClientConfig, type PoolConfig } from 'pg'

import type { ContentMigration, MigrationClient } from '../database/migrations'
import {
  DrillError,
  fingerprint,
  hash,
  type DrillFailure,
  type TableEvidence,
} from './restore-drill-contract'
import { mediaManifest } from './restore-drill-media'

export type PostgresTool = 'pg_dump' | 'pg_restore'
export type PostgresToolRunner = (
  command: PostgresTool,
  args: readonly string[],
  databaseUrl?: string,
  input?: Uint8Array,
) => Promise<Buffer>

export const maxArchiveBytes = 256 * 1024 * 1024

function postgresConnection(databaseUrl: string) {
  const url = new URL(databaseUrl)
  return {
    host: url.hostname.replace(/^\[|\]$/g, ''),
    port: Number(url.port || 5432),
    database: decodeURIComponent(url.pathname.slice(1)),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    sslmode: url.searchParams.get('sslmode') ?? 'disable',
    // Only a URL that backupDatabaseUrl checked carries it; the drill's own URLs have no parameters.
    channelBinding: url.searchParams.get('channel_binding'),
  }
}

// A deliberately bounded local drill: raw archives are held in memory, never logged or saved.
export const runPostgresTool: PostgresToolRunner = (command, args, databaseUrl, input) =>
  new Promise((resolve, reject) => {
    // These subprocesses are PostgreSQL tools, not Next; omit its augmented required env fields.
    const environment = { PATH: process.env.PATH, LANG: 'C' } as unknown as NodeJS.ProcessEnv
    if (databaseUrl) {
      const { host, port, database, user, password, sslmode, channelBinding } =
        postgresConnection(databaseUrl)
      Object.assign(environment, {
        PGHOST: host,
        PGPORT: String(port),
        PGDATABASE: database,
        PGUSER: user,
        PGPASSWORD: password,
        PGSSLMODE: sslmode,
        ...(sslmode === 'verify-full' ? { PGSSLROOTCERT: 'system', PGGSSENCMODE: 'disable' } : {}),
        // libpq enforces it: with `require`, pg_dump refuses a server that does not bind.
        ...(channelBinding === null ? {} : { PGCHANNELBINDING: channelBinding }),
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
      if (size > maxArchiveBytes) {
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

/** The SASL mechanism that binds SCRAM to the TLS channel: all `channel_binding=require` allows. */
const channelBoundMechanism = 'SCRAM-SHA-256-PLUS'

/**
 * A connection that requires channel binding was refused: the server did not authenticate it with
 * SCRAM-SHA-256-PLUS over TLS. It names no URL, host or driver text.
 */
export class ChannelBindingError extends Error {
  constructor() {
    super(
      'The server did not authenticate with SCRAM-SHA-256-PLUS, which channel_binding=require needs.',
    )
    this.name = 'ChannelBindingError'
  }
}

/** The parts of a pg 8.22 client that `requireChannelBinding` reads and wraps; see there. */
interface ClientInternals {
  readonly connection: {
    emit(event: string | symbol, ...args: unknown[]): boolean
    readonly stream: { destroy(): void; readonly getPeerCertificate?: unknown }
  }
  readonly saslSession?: { readonly mechanism?: unknown } | null
}

/** Clients that `requireChannelBinding` let through authentication, after a bound exchange. */
const channelBoundClients = new WeakSet<object>()

function offersChannelBinding(message: unknown): boolean {
  const mechanisms = (message as { readonly mechanisms?: unknown } | undefined)?.mechanisms
  return Array.isArray(mechanisms) && mechanisms.includes(channelBoundMechanism)
}

/**
 * Holds one node-postgres client to `channel_binding=require`, as libpq holds it. The client
 * answers no cleartext or MD5 password request, takes part in SASL only when the server offers
 * SCRAM-SHA-256-PLUS over TLS, and accepts the server's AuthenticationOk only once that exchange
 * ended with the server's signature checked. Plain SCRAM-SHA-256, and a server that authenticates
 * without asking, are refused too. A refusal fails the connection with a `ChannelBindingError`
 * before any password or hash is sent, and closes its socket; nothing the server sends after it
 * reaches the client.
 *
 * This is the one function that relies on pg internals, as pg 8.22 has them and its tests pin:
 * - `client.connection` emits each backend message under its pg-protocol name, before the client's
 *   own handlers see it, and its `stream` is the TLS socket once TLS is up;
 * - during SASL, `client.saslSession.mechanism` names the mechanism the client chose, and the
 *   client clears `saslSession` once the server's final signature checks out.
 * Should these change, this refuses connections rather than accept them, and `drillPool` hands out
 * no client that this did not see bind.
 */
function requireChannelBinding(client: Client): void {
  const internals = client as unknown as ClientInternals
  const { connection } = internals
  const emit = connection.emit.bind(connection)
  let refused = false
  let mechanism: unknown = null
  const refuse = (): boolean => {
    if (!refused) {
      refused = true
      emit('error', new ChannelBindingError())
      connection.stream.destroy()
    }
    return false
  }
  connection.emit = (event, ...args) => {
    // A refused connection only closes.
    if (refused) return event === 'end' && emit(event, ...args)
    switch (event) {
      case 'authenticationCleartextPassword':
      case 'authenticationMD5Password':
        return refuse()
      case 'authenticationSASL':
        if (
          !offersChannelBinding(args[0]) ||
          typeof connection.stream.getPeerCertificate !== 'function'
        ) {
          return refuse()
        }
        break
      case 'authenticationSASLFinal':
        // The client checks the server's signature in its own handler, then clears the session.
        mechanism = internals.saslSession?.mechanism
        break
      case 'authenticationOk':
        if (mechanism !== channelBoundMechanism || internals.saslSession !== null) return refuse()
        channelBoundClients.add(client)
        break
    }
    return emit(event, ...args)
  }
}

/**
 * The node-postgres client of a URL with `channel_binding=require`: one held to it as libpq holds
 * it (`requireChannelBinding`).
 */
export class ChannelBindingClient extends Client {
  constructor(config?: string | ClientConfig) {
    super(config)
    requireChannelBinding(this)
  }
}

/**
 * pg-pool calls this before it hands out a new client. One that `requireChannelBinding` did not
 * let through after a bound exchange is refused, so no pg change that hid authentication from it
 * could hand out a connection that did not bind.
 */
function requireChannelBound(client: object): void {
  if (!channelBoundClients.has(client)) throw new ChannelBindingError()
}

/**
 * The pool configuration `drillPool` uses for a URL that `backupDatabaseUrl` checked, or for one of
 * the drill's own URLs, which have no parameters.
 */
export function drillPoolConfig(databaseUrl: string): PoolConfig {
  const { sslmode, password, channelBinding, ...connection } = postgresConnection(databaseUrl)
  const required = channelBinding === 'require'
  // @types/pg 8.20 does not declare enableChannelBinding yet; pg 8.22 reads it.
  const config: PoolConfig & { readonly enableChannelBinding: boolean } = {
    ...connection,
    password: async () => password,
    ssl:
      sslmode === 'verify-full'
        ? {
            rejectUnauthorized: true,
            checkServerIdentity: (_, cert) => checkServerIdentity(connection.host, cert),
          }
        : false,
    // SCRAM-SHA-256-PLUS whenever the server offers it, as libpq does for `prefer`. For `require`,
    // as libpq does too, every connection must bind: no other authentication is accepted.
    enableChannelBinding: required || channelBinding === 'prefer',
    ...(required ? { Client: ChannelBindingClient, onConnect: requireChannelBound } : {}),
    max: 2,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 60_000,
    options: '-c timezone=UTC -c search_path=public',
  }
  return config
}

export function drillPool(databaseUrl: string): Pool {
  const pool = new Pool(drillPoolConfig(databaseUrl))
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

export async function capturePostgresSnapshot(input: {
  pool: Pool
  databaseUrl: string
  tools: PostgresToolRunner
  reviewed: readonly ContentMigration[]
  now: () => Date
}) {
  const snapshot = await input.pool.connect()
  try {
    await snapshot.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
    await snapshot.query("SET LOCAL idle_in_transaction_session_timeout = '15min'")
    const snapshotAt = input.now().toISOString()
    const { rows } = await snapshot.query<{ id: string }>('SELECT pg_export_snapshot() AS id')
    const migrations = await migrationIdentity(snapshot)
    requireMigrationPrefix(migrations, input.reviewed)
    const tables = await captureTables(snapshot)
    const media = await mediaManifest(snapshot)
    const archive = await input.tools(
      'pg_dump',
      [
        '--format=custom',
        '--no-owner',
        '--no-privileges',
        '--no-password',
        '--snapshot',
        rows[0]!.id,
      ],
      input.databaseUrl,
    )
    if (archive.length === 0 || archive.length > maxArchiveBytes)
      throw new DrillError('operation_failed')
    await snapshot.query('ROLLBACK')
    snapshot.release()
    return { snapshotAt, migrations, tables, media, archive }
  } catch (error) {
    // Destroy the connection on failure so a partially completed transaction cannot return to the pool.
    snapshot.release(true)
    throw error
  }
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
  'operation_runs',
])

/**
 * The tables each reviewed forward migration creates. A drill that restores an older ledger and
 * applies one of these migrations finds its tables in the restored copy only. The comparison
 * accepts them there only while they are empty, since the source could not hold their rows.
 */
export const forwardMigrationTables: Readonly<Record<string, readonly string[]>> = {
  '0011_operation_runs': ['operation_runs'],
}

/** The tables the given applied forward migrations created, by their evidence label. */
export function tablesCreatedBy(applied: readonly string[]): ReadonlySet<string> {
  return new Set(applied.flatMap((id) => forwardMigrationTables[id] ?? []))
}

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
    const rows = await client.query<{ digest: string }>(
      `SELECT encode(sha256(convert_to(to_jsonb(t)::text, 'UTF8')), 'hex') AS digest
       FROM ${quotedIdentifier(schemaname)}.${quotedIdentifier(tablename)} t`,
    )
    const label =
      schemaname === 'public' && entityNames.has(tablename)
        ? tablename
        : hash(`${schemaname}.${tablename}`)
    // PostgreSQL renders jsonb deterministically, including full-precision numeric values.
    result[label] = {
      count: rows.rows.length,
      sha256: fingerprint(rows.rows.map(({ digest }) => digest).sort()),
    }
  }
  return result
}

export function compareTables(
  source: Record<string, TableEvidence>,
  restored: Record<string, TableEvidence>,
  createdByForwardMigrations: ReadonlySet<string> = new Set(),
): DrillFailure[] {
  const failures: DrillFailure[] = []
  for (const subject of new Set([...Object.keys(source), ...Object.keys(restored)])) {
    const expected = source[subject]
    const actual = restored[subject]
    if (!expected && actual?.count === 0 && createdByForwardMigrations.has(subject)) continue
    if (!expected || !actual || expected.count !== actual.count)
      failures.push({ code: 'row_count_mismatch', stage: 'comparison', subject })
    else if (expected.sha256 !== actual.sha256)
      failures.push({ code: 'invariant_changed', stage: 'comparison', subject })
  }
  return failures
}
