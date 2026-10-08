// Registered by postgres.integration.test.ts for the existing Docker runner.
import { spawn } from 'node:child_process'
import path from 'node:path'

import { Pool } from 'pg'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { applyContentMigrations, readContentMigrations } from './migrations'

export function migrateCommandIntegrationTests({
  databaseUrl,
  schema,
}: {
  databaseUrl: string
  schema: string
}) {
  describe('deliberate migration command with PostgreSQL', () => {
    if (!/^migrate_command_[a-f0-9]+$/.test(schema)) throw new Error('Invalid test schema name')
    const admin = new Pool({ connectionString: databaseUrl, max: 2 })
    const target = new URL(databaseUrl)
    target.searchParams.set('options', `-c search_path=${schema}`)
    target.searchParams.set('application_name', schema)
    const pool = new Pool({ connectionString: target.href, max: 2 })
    const command = path.resolve('packages/web/scripts/migrate.mjs')
    const apply = ['--apply', '--environment', 'preview']

    function run(
      args: string[] = [],
      environment: Record<string, string> = {},
      cwd = process.cwd(),
    ) {
      return new Promise<{ status: number | null; output: string }>((resolve, reject) => {
        const child = spawn(process.execPath, ['--experimental-strip-types', command, ...args], {
          cwd,
          env: {
            ...process.env,
            NODE_ENV: 'test',
            VERCEL_ENV: 'preview',
            VERCEL_TARGET_ENV: 'preview',
            DATABASE_URL: target.href,
            ...environment,
          },
          stdio: ['ignore', 'pipe', 'pipe'],
          timeout: 25_000,
        })
        let output = ''
        child.stdout.on('data', (chunk) => {
          output += chunk.toString()
        })
        child.stderr.on('data', (chunk) => {
          output += chunk.toString()
        })
        child.once('error', reject)
        child.once('close', (status) => resolve({ status, output }))
      })
    }

    async function tables() {
      return (
        await admin.query(
          'SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY tablename',
          [schema],
        )
      ).rows.map(({ tablename }) => tablename)
    }

    async function ledger() {
      return (
        await pool.query(
          'SELECT id, checksum, applied_at FROM content_schema_migrations ORDER BY id',
        )
      ).rows
    }

    async function waitForMigrationLock() {
      await expect
        .poll(
          async () => {
            const result = await admin.query(
              "SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE application_name = $1 AND wait_event = 'advisory') AS waiting",
              [schema],
            )
            return result.rows[0].waiting
          },
          { timeout: 10_000 },
        )
        .toBe(true)
    }

    beforeEach(async () => {
      await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
      await admin.query(`CREATE SCHEMA "${schema}"`)
    })
    afterAll(async () => {
      await pool.end()
      await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
      await admin.end()
    })

    it('leaves an empty database untouched on default and environment-only dry runs', async () => {
      const migrations = await readContentMigrations()
      for (const args of [[], ['--environment', 'production']]) {
        const result = await run(args)
        expect(result.status).toBe(0)
        expect(result.output).toContain(`Pending migrations (${migrations.length})`)
        for (const migration of migrations) expect(result.output).toContain(migration.id)
        expect(result.output.includes(target.href)).toBe(false)
        expect(result.output.includes(decodeURIComponent(target.password))).toBe(false)
        expect(await tables()).toEqual([])
      }
    })

    it('applies in order from the package directory and leaves ledger identities and timestamps unchanged on replay', async () => {
      const migrations = await readContentMigrations()
      const first = await run(apply, {}, path.resolve('packages/web'))
      expect(first.status).toBe(0)
      expect(first.output).toContain(`Applied: ${migrations.length}; already applied: 0.`)
      const before = await ledger()
      expect(before.map(({ id, checksum }) => ({ id, checksum }))).toEqual(
        migrations.map(({ id, checksum }) => ({ id, checksum })),
      )
      const preview = await run()
      expect(preview.status).toBe(0)
      expect(preview.output).toContain('Pending migrations (0)')
      expect(await ledger()).toEqual(before)
      const replay = await run(apply)
      expect(replay.status).toBe(0)
      expect(replay.output).toContain(`Applied: 0; already applied: ${migrations.length}.`)
      expect(await ledger()).toEqual(before)
      expect(await tables()).toContain('owner_users')
    })

    it('continues a partially migrated database and lists only pending migrations', async () => {
      const migrations = await readContentMigrations()
      await applyContentMigrations(pool, migrations.slice(0, 1))
      const before = await ledger()
      const preview = await run()
      expect(preview.status).toBe(0)
      expect(preview.output).not.toContain(migrations[0]!.id)
      for (const migration of migrations.slice(1)) expect(preview.output).toContain(migration.id)
      expect(await ledger()).toEqual(before)
      expect((await run(apply)).status).toBe(0)
      expect((await ledger()).map(({ id }) => id)).toEqual(migrations.map(({ id }) => id))
    })

    it('requires production confirmation and never treats the environment flag alone as apply', async () => {
      const production = { NODE_ENV: 'production', VERCEL_ENV: 'production' }
      for (const args of [['--apply'], apply]) {
        expect((await run(args, production)).status).toBe(1)
        expect(await tables()).toEqual([])
      }
      expect((await run(['--environment', 'production'], production)).status).toBe(0)
      expect(await tables()).toEqual([])
      expect((await run(['--apply', '--environment', 'production'], production)).status).toBe(0)
      expect(await tables()).toContain('content_schema_migrations')
    })

    it('serializes simultaneous applies with the existing migration lock', async () => {
      const migrations = await readContentMigrations()
      const results = await Promise.all([run(apply), run(apply)])
      for (const result of results) expect(result.status).toBe(0)
      expect(
        results
          .map(({ output }) => Number(output.match(/Applied: (\d+);/)?.[1]))
          .reduce((sum, count) => sum + count, 0),
      ).toBe(migrations.length)
      expect((await ledger()).map(({ id }) => id)).toEqual(migrations.map(({ id }) => id))
    })

    it('waits for the established advisory lock before writing', async () => {
      const locker = await admin.connect()
      let running: ReturnType<typeof run> | undefined
      try {
        await locker.query('BEGIN')
        await locker.query("SELECT pg_advisory_xact_lock(hashtext('magazine-content-migrations'))")
        running = run(apply)
        await waitForMigrationLock()
        expect(await tables()).toEqual([])
      } finally {
        await locker.query('ROLLBACK')
        locker.release()
        if (running) expect((await running).status).toBe(0)
      }
    }, 20_000)

    it.each([
      ['unknown', 'unknown migration'],
      ['gap', 'ordering gap'],
      ['checksum', 'checksum differs'],
    ])(
      'rejects %s history committed while the command waits for the advisory lock',
      async (kind, refusal) => {
        const migrations = await readContentMigrations()
        await applyContentMigrations(pool, migrations.slice(0, 1))
        const beforeTables = await tables()
        const locker = await pool.connect()
        let running: ReturnType<typeof run> | undefined
        try {
          await locker.query('BEGIN')
          await locker.query(
            "SELECT pg_advisory_xact_lock(hashtext('magazine-content-migrations'))",
          )
          running = run(apply)
          // Observe the actual subprocess past preflight, blocked on our lock.
          await waitForMigrationLock()
          if (kind === 'checksum') {
            await locker.query('UPDATE content_schema_migrations SET checksum = $1', [
              '0'.repeat(64),
            ])
          } else {
            const entry =
              kind === 'unknown'
                ? { id: '9999_synthetic_other_release', checksum: '0'.repeat(64) }
                : migrations[2]!
            await locker.query(
              'INSERT INTO content_schema_migrations (id, checksum) VALUES ($1, $2)',
              [entry.id, entry.checksum],
            )
          }
          const changedLedger = (
            await locker.query(
              'SELECT id, checksum, applied_at FROM content_schema_migrations ORDER BY id',
            )
          ).rows
          // Commit the incompatible history and release the transaction lock together.
          await locker.query('COMMIT')
          const result = await running
          expect(result.status).toBe(1)
          expect(result.output).toContain(refusal)
          expect(result.output).not.toContain('Migration apply complete')
          expect(result.output).not.toContain('Applied:')
          expect(await ledger()).toEqual(changedLedger)
          expect(await tables()).toEqual(beforeTables)
        } finally {
          await locker.query('ROLLBACK')
          locker.release()
          if (running) await running
        }
      },
      20_000,
    )

    it('rejects checksum drift without applying pending SQL or exposing database error text', async () => {
      await applyContentMigrations(pool, (await readContentMigrations()).slice(0, 1))
      await pool.query('UPDATE content_schema_migrations SET checksum = $1', ['0'.repeat(64)])
      const before = await ledger()
      for (const args of [[], apply]) {
        const result = await run(args)
        expect(result.status).toBe(1)
        expect(result.output).toContain('checksum differs')
        expect(await ledger()).toEqual(before)
        expect(await tables()).not.toContain('owner_users')
      }
    })

    it('rolls all new SQL and the ledger back if a later migration fails', async () => {
      // A deliberate collision in migration 0002 must also roll back migration 0001.
      await pool.query('CREATE TABLE owner_users (synthetic_collision boolean)')
      const failed = await run(apply)
      expect(failed.status).toBe(1)
      expect(failed.output).toContain('Migration apply failed')
      expect(failed.output).not.toContain('already exists')
      expect(await tables()).toEqual(['owner_users'])
      await pool.query('DROP TABLE owner_users')
      expect((await run(apply)).status).toBe(0)
    })

    it('previews through a read-only connection but refuses to apply through it', async () => {
      const readOnly = new URL(target)
      readOnly.searchParams.set(
        'options',
        `-c search_path=${schema} -c default_transaction_read_only=on`,
      )
      const environment = { DATABASE_URL: readOnly.href }
      expect((await run([], environment)).status).toBe(0)
      expect((await run(apply, environment)).status).toBe(1)
      expect(await tables()).toEqual([])
    })

    it('returns a non-zero safe connection failure', async () => {
      const unreachable = new URL(target)
      unreachable.hostname = '127.0.0.1'
      unreachable.port = '1'
      const result = await run([], { DATABASE_URL: unreachable.href })
      expect(result.status).toBe(1)
      expect(result.output).toContain('Could not inspect migrations')
      expect(result.output.includes(unreachable.href)).toBe(false)
      expect(result.output.includes(decodeURIComponent(target.password))).toBe(false)
      expect(await tables()).toEqual([])
    })
  })
}
