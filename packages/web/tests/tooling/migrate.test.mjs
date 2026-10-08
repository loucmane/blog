import { EventEmitter } from 'node:events'

import { describe, expect, it, vi } from 'vitest'

import { runMigrations } from '../../scripts/migrate.mjs'
import { readContentMigrations } from '../../src/server/database/migrations'

// Deliberately synthetic placeholders, never usable hosted credentials.
const fixtureUrl = 'postgres://USER:PASSWORD@HOST/DB'

function harness({ recorded = [], ledger = false, rejectQuery, idleError = false } = {}) {
  const queries = []
  const pool = new EventEmitter()
  const release = vi.fn()
  pool.connect = vi.fn(async () => ({
    release,
    query: async (sql, values) => {
      queries.push({ sql, values })
      if (rejectQuery?.(sql)) throw new Error(fixtureUrl)
      if (sql.startsWith('SELECT to_regclass'))
        return { rows: [{ ledger: ledger ? 'content_schema_migrations' : null }] }
      if (sql === 'SELECT id, checksum FROM content_schema_migrations') return { rows: recorded }
      if (sql.startsWith('SELECT checksum'))
        return { rows: recorded.filter(({ id }) => id === values[0]) }
      if (idleError && sql === 'COMMIT') pool.emit('error', new Error(fixtureUrl))
      return { rows: [] }
    },
  }))
  pool.end = vi.fn(async () => {})
  const createPool = vi.fn(() => pool)
  const log = vi.fn()
  const error = vi.fn()
  return {
    pool,
    queries,
    release,
    createPool,
    log,
    error,
    output: () => [...log.mock.calls, ...error.mock.calls].flat().join('\n'),
    run: (args = [], environment = { DATABASE_URL: fixtureUrl }) =>
      runMigrations({ args, environment, createPool, log, error }),
  }
}

describe('deliberate migration command', () => {
  it('previews every reviewed migration without creating a ledger or acquiring a write connection', async () => {
    const test = harness()
    expect(await test.run()).toBe(0)
    expect(test.queries.map(({ sql }) => sql)).toEqual([
      'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY',
      "SELECT to_regclass('content_schema_migrations') AS ledger",
      'COMMIT',
    ])
    for (const migration of await readContentMigrations())
      expect(test.output()).toContain(migration.id)
    expect(test.output()).toContain('No changes made')
    expect(test.output()).toContain('host="HOST"')
    expect(test.output()).toContain('database="DB"')
    expect(test.output()).not.toContain(fixtureUrl)
    expect(test.output()).not.toContain('PASSWORD')
    expect(test.output()).not.toContain('USER')
    expect(test.release).toHaveBeenCalledOnce()
    expect(test.pool.end).toHaveBeenCalledOnce()
  })

  it.each([
    [['--apply'], { DATABASE_URL: fixtureUrl }, /requires --environment/],
    [['--apply', '--environment', 'staging'], { DATABASE_URL: fixtureUrl }, /Use --environment/],
    [['--environment'], { DATABASE_URL: fixtureUrl }, /Use --environment/],
    [['--apply', '--apply', '--environment', 'preview'], { DATABASE_URL: fixtureUrl }, /Usage/],
    [
      ['--environment', 'preview', '--environment', 'production'],
      { DATABASE_URL: fixtureUrl },
      /Usage/,
    ],
    [[fixtureUrl], { DATABASE_URL: fixtureUrl }, /Usage/],
    [[], {}, /Set DATABASE_URL/],
    [[], { DATABASE_URL: fixtureUrl.replace('postgres:', 'https:') }, /PostgreSQL URL/],
    [[], { DATABASE_URL: 'PASSWORD' }, /PostgreSQL URL/],
    [[], { DATABASE_URL: 'postgres://HOST' }, /PostgreSQL URL/],
    ...['NODE_ENV', 'VERCEL_ENV', 'VERCEL_TARGET_ENV'].map((name) => [
      ['--apply', '--environment', 'preview'],
      { DATABASE_URL: fixtureUrl, [name]: 'production' },
      /Production requires/,
    ]),
  ])('refuses unsafe input before connecting (%j)', async (args, environment, message) => {
    const test = harness()
    expect(await test.run(args, environment)).toBe(1)
    expect(test.createPool).not.toHaveBeenCalled()
    expect(test.output()).toMatch(message)
    expect(test.output()).not.toContain('PASSWORD')
    expect(test.output()).not.toContain(fixtureUrl)
  })

  it('prints help without needing a database', async () => {
    const test = harness()
    expect(await test.run(['--help'], {})).toBe(0)
    expect(test.output()).toContain('Usage:')
    expect(test.createPool).not.toHaveBeenCalled()
  })

  it('prints the effective target, including pg URL overrides, without credentials', async () => {
    const test = harness()
    expect(
      await test.run([], {
        DATABASE_URL: `${fixtureUrl}?host=OTHER_HOST&dbname=OTHER_DB&password=OTHER_PASSWORD`,
      }),
    ).toBe(0)
    expect(test.output()).toContain('host="OTHER_HOST"')
    // pg takes the database from the URL path, ignoring the dbname query parameter.
    expect(test.output()).toContain('database="DB"')
    expect(test.output()).not.toContain('PASSWORD')
  })

  it('redacts credentials even if repeated in the target and escapes terminal control characters', async () => {
    const test = harness()
    const url = new URL(fixtureUrl)
    url.password = 'SYNTHETIC PASSWORD'
    url.pathname = '/SYNTHETIC PASSWORD\u001b[31m'
    url.searchParams.set('password', 'OVERRIDE_PASSWORD')
    expect(await test.run([], { DATABASE_URL: url.href })).toBe(0)
    expect(test.output()).not.toContain('SYNTHETIC')
    expect(test.output()).not.toContain('\u001b')
    expect(test.output()).toContain('[redacted]')
  })

  it.each(['unknown', 'checksum', 'gap'])('refuses %s history without applying', async (kind) => {
    const migrations = await readContentMigrations()
    const recorded =
      kind === 'unknown'
        ? [{ id: fixtureUrl, checksum: '0'.repeat(64) }]
        : kind === 'checksum'
          ? [{ id: migrations[0].id, checksum: '0'.repeat(64) }]
          : [migrations[1]]
    const test = harness({ ledger: true, recorded })
    expect(await test.run(['--apply', '--environment', 'preview'])).toBe(1)
    expect(test.queries.at(-1).sql).toBe('ROLLBACK')
    expect(test.pool.connect).toHaveBeenCalledOnce()
    expect(test.output()).not.toContain('PASSWORD')
    expect(test.pool.end).toHaveBeenCalledOnce()
  })

  it.each(['preview', 'production'])(
    'uses the existing ordered, locked migration runner for %s apply',
    async (environment) => {
      const test = harness()
      expect(
        await test.run(['--apply', '--environment', environment], {
          DATABASE_URL: fixtureUrl,
          NODE_ENV: environment === 'production' ? 'production' : 'test',
        }),
      ).toBe(0)
      const sql = test.queries.map(({ sql }) => sql)
      expect(sql).toContain("SELECT pg_advisory_xact_lock(hashtext('magazine-content-migrations'))")
      const migrations = await readContentMigrations()
      expect(
        test.queries
          .filter(({ sql }) => sql.startsWith('INSERT INTO content_schema_migrations'))
          .map(({ values }) => values),
      ).toEqual(migrations.map(({ id, checksum }) => [id, checksum]))
      expect(test.output()).toContain(`Applied: ${migrations.length}; already applied: 0.`)
      expect(test.release).toHaveBeenCalledTimes(2)
    },
  )

  it('reports no pending migrations and skips exact replays', async () => {
    const migrations = await readContentMigrations()
    const test = harness({ ledger: true, recorded: migrations })
    expect(await test.run(['--apply', '--environment', 'preview'])).toBe(0)
    expect(test.output()).toContain('Pending migrations (0)')
    expect(test.output()).toContain(`Applied: 0; already applied: ${migrations.length}.`)
    expect(test.queries.some(({ sql }) => sql.startsWith('INSERT INTO'))).toBe(false)
  })

  it.each(['inspect', 'apply', 'idle', 'close'])(
    'returns a safe failure for %s errors and releases connections',
    async (phase) => {
      const test = harness({
        rejectQuery: (sql) =>
          phase === 'inspect'
            ? sql.startsWith('SELECT to_regclass')
            : phase === 'apply' && sql.includes('CREATE TABLE publication_settings'),
        idleError: phase === 'idle',
      })
      if (phase === 'close') test.pool.end.mockRejectedValue(new Error(fixtureUrl))
      expect(await test.run(['--apply', '--environment', 'preview'])).toBe(1)
      expect(test.error).toHaveBeenCalled()
      expect(test.output()).not.toContain('PASSWORD')
      expect(test.output()).not.toContain(fixtureUrl)
      if (phase !== 'close') expect(test.output()).not.toContain('Migration apply complete')
      if (phase === 'apply') expect(test.queries.at(-1).sql).toBe('ROLLBACK')
      expect(test.pool.end).toHaveBeenCalledOnce()
      expect(test.release).toHaveBeenCalled()
    },
  )
})
