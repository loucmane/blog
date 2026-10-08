import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { Client, Pool } from 'pg'

import { applyContentMigrations, readContentMigrations } from '../src/server/database/migrations.ts'

const usage =
  'Usage: node packages/web/scripts/migrate.mjs [--apply --environment preview|production]'
const migrationDirectory = fileURLToPath(new URL('../migrations/', import.meta.url))

class CommandError extends Error {}

function parseArguments(args, environment) {
  let apply = false
  let targetEnvironment
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--apply' && !apply) {
      apply = true
    } else if (args[index] === '--environment' && targetEnvironment === undefined) {
      targetEnvironment = args[++index]
      if (!['preview', 'production'].includes(targetEnvironment)) {
        throw new CommandError('Use --environment preview or --environment production.')
      }
    } else {
      throw new CommandError(usage)
    }
  }
  if (apply && !targetEnvironment) {
    throw new CommandError(
      'Applying migrations requires --environment preview or --environment production.',
    )
  }
  if (
    apply &&
    (environment.NODE_ENV === 'production' ||
      environment.VERCEL_ENV === 'production' ||
      environment.VERCEL_TARGET_ENV === 'production') &&
    targetEnvironment !== 'production'
  ) {
    throw new CommandError('Production requires --apply --environment production.')
  }
  return { apply, targetEnvironment }
}

function connectionConfiguration(environment) {
  const connectionString = environment.DATABASE_URL
  if (!connectionString?.trim())
    throw new CommandError('Set DATABASE_URL before running migrations.')
  try {
    const url = new URL(connectionString)
    if (
      !['postgres:', 'postgresql:'].includes(url.protocol) ||
      !url.hostname ||
      url.pathname.length < 2
    ) {
      throw new Error('Invalid URL')
    }
    return { connectionString, max: 1, connectionTimeoutMillis: 10_000 }
  } catch {
    throw new CommandError('DATABASE_URL must be a PostgreSQL URL with a host and database name.')
  }
}

function targetDescription(configuration) {
  // Let pg resolve URL query overrides and defaults, exactly as it will for the pool.
  const client = new Client(configuration)
  const url = new URL(configuration.connectionString)
  const secrets = [
    configuration.connectionString,
    client.user,
    client.password,
    url.username,
    url.password,
    decodeURIComponent(url.username),
    decodeURIComponent(url.password),
  ]
    .filter((value) => typeof value === 'string' && value.length > 0)
    .flatMap((value) => [value, encodeURIComponent(value)])
    .sort((a, b) => b.length - a.length)
  const redact = (value) => {
    let result = String(value)
    for (const secret of secrets) result = result.replaceAll(secret, '[redacted]')
    return JSON.stringify(result)
  }
  return `Target: host=${redact(client.host)} port=${redact(client.port)} database=${redact(client.database)} (credentials redacted)`
}

async function pendingMigrations(client, migrations) {
  // Do not create even the migration ledger on a dry run of an empty database.
  const table = await client.query("SELECT to_regclass('content_schema_migrations') AS ledger")
  const recorded = table.rows[0]?.ledger
    ? (await client.query('SELECT id, checksum FROM content_schema_migrations')).rows
    : []
  const reviewed = new Map(migrations.map((migration) => [migration.id, migration.checksum]))
  for (const entry of recorded) {
    if (!reviewed.has(entry.id)) {
      throw new CommandError(
        'The database contains an unknown migration. Use the matching reviewed release before applying.',
      )
    }
    if (reviewed.get(entry.id) !== entry.checksum) {
      throw new CommandError(
        'An applied migration checksum differs from the reviewed SQL. Stop and investigate; do not edit the ledger.',
      )
    }
  }
  const applied = new Set(recorded.map((entry) => entry.id))
  if (migrations.slice(0, applied.size).some((migration) => !applied.has(migration.id))) {
    throw new CommandError(
      'The migration history has an ordering gap. Stop and investigate before applying.',
    )
  }
  return migrations.filter((migration) => !applied.has(migration.id))
}

async function previewMigrations(pool, migrations) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
    const pending = await pendingMigrations(client, migrations)
    await client.query('COMMIT')
    return pending
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    client.release()
  }
}

export async function runMigrations({
  args = process.argv.slice(2),
  environment = process.env,
  log = console.log,
  error = console.error,
  createPool = (configuration) => new Pool(configuration),
} = {}) {
  let pool
  let failure =
    'Could not read migration configuration. Check DATABASE_URL and PostgreSQL connection settings.'
  let exitCode = 0
  let poolError = false
  try {
    if (args.length === 1 && args[0] === '--help') {
      log(usage)
      log('Dry run by default. DATABASE_URL is read from the environment and is never printed.')
      return 0
    }
    const options = parseArguments(args, environment)
    const configuration = connectionConfiguration(environment)
    log(targetDescription(configuration))
    log(
      `Mode: ${options.apply ? 'apply' : 'dry run'}; environment: ${options.targetEnvironment ?? 'unspecified'}`,
    )
    failure =
      'Could not load the reviewed migrations. Run from a complete repository checkout with packages/web/migrations present.'
    const migrations = await readContentMigrations(migrationDirectory)
    if (migrations.length === 0)
      throw new CommandError('No reviewed migrations were found; refusing to continue.')
    failure =
      'Could not inspect migrations. Check database reachability, credentials, TLS settings and read permissions.'
    pool = createPool(configuration)
    // Never let pg's idle-client error event print a raw driver error or connection data.
    pool.on('error', () => {
      poolError = true
    })
    const pending = await previewMigrations(pool, migrations)
    log(`Pending migrations (${pending.length}):`)
    for (const migration of pending) log(`  ${migration.id}`)
    if (pending.length === 0) log('  (none)')
    if (poolError) throw new Error('Database connection failed')
    if (!options.apply) {
      log(
        'Dry run complete. No changes made. To apply, rerun with --apply --environment preview (or production).',
      )
    } else {
      failure =
        'Migration apply failed. Check database connectivity, write permissions and migration history. Re-run the dry run before retrying; no success is assumed.'
      const report = await applyContentMigrations(pool, migrations, async (client) => {
        // The preflight may be stale after waiting for another release to finish.
        await pendingMigrations(client, migrations)
      })
      if (poolError) throw new Error('Database connection failed')
      log(`Applied: ${report.applied.length}; already applied: ${report.skipped.length}.`)
      log('Migration apply complete.')
    }
  } catch (cause) {
    // Only our fixed messages are safe: SQL/driver errors can contain connection secrets.
    error(cause instanceof CommandError ? cause.message : failure)
    exitCode = 1
  } finally {
    if (pool) {
      try {
        await pool.end()
      } catch {
        error(
          'Could not close the database connection cleanly. Re-run the dry run to check migration state.',
        )
        exitCode = 1
      }
    }
  }
  return exitCode
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = await runMigrations()
}
