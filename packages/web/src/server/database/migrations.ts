import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

export interface MigrationQueryResult<
  Row extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly rows: readonly Row[]
}

export interface MigrationClient {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[],
  ): Promise<MigrationQueryResult<Row>>
  release(): void
}

export interface MigrationPool {
  connect(): Promise<MigrationClient>
}

export interface ContentMigration {
  readonly checksum: string
  readonly id: string
  readonly sql: string
}

export interface MigrationReport {
  readonly applied: readonly string[]
  readonly skipped: readonly string[]
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function resolveMigrationDirectory(cwd = process.cwd()): string {
  return cwd.endsWith(`${path.sep}packages${path.sep}web`)
    ? path.join(cwd, 'migrations')
    : path.join(cwd, 'packages', 'web', 'migrations')
}

export async function readContentMigrations(
  directory = resolveMigrationDirectory(),
): Promise<readonly ContentMigration[]> {
  const files = (await readdir(directory))
    .filter((file) => /^\d{4}_[a-z0-9_]+\.sql$/.test(file))
    .sort()
  return Promise.all(
    files.map(async (file) => {
      const sql = await readFile(path.join(directory, file), 'utf8')
      return { checksum: sha256(sql), id: file.replace(/\.sql$/, ''), sql }
    }),
  )
}

export async function applyContentMigrations(
  pool: MigrationPool,
  migrations: readonly ContentMigration[],
): Promise<MigrationReport> {
  const client = await pool.connect()
  const applied: string[] = []
  const skipped: string[] = []
  try {
    await client.query('BEGIN')
    await client.query("SELECT pg_advisory_xact_lock(hashtext('magazine-content-migrations'))")
    await client.query(`CREATE TABLE IF NOT EXISTS content_schema_migrations (
      id text PRIMARY KEY,
      checksum text NOT NULL CHECK (checksum ~ '^[0-9a-f]{64}$'),
      applied_at timestamptz NOT NULL DEFAULT now()
    )`)
    for (const migration of migrations) {
      const existing = await client.query<{ checksum: string }>(
        'SELECT checksum FROM content_schema_migrations WHERE id = $1',
        [migration.id],
      )
      const checksum = existing.rows[0]?.checksum
      if (checksum !== undefined) {
        if (checksum !== migration.checksum) {
          throw new Error(`Applied migration ${migration.id} checksum does not match reviewed SQL.`)
        }
        skipped.push(migration.id)
        continue
      }
      await client.query(migration.sql)
      await client.query('INSERT INTO content_schema_migrations (id, checksum) VALUES ($1, $2)', [
        migration.id,
        migration.checksum,
      ])
      applied.push(migration.id)
    }
    await client.query('COMMIT')
    return { applied, skipped }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
