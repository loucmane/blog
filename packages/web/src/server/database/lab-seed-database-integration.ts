// Registered in the coordinator-owned Docker PostgreSQL suite.
import { randomUUID } from 'node:crypto'

import { Client, Pool } from 'pg'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'

import { seedLabContent } from '../lab/seed'
import { applyContentMigrations, readContentMigrations } from './migrations'
import { PostgresContentRepository } from './postgres-content-repository'

const seedLockKey = 'magazine:lab-seed:north-house:v1'

export function labSeedDatabaseIntegrationTests({ databaseUrl }: { databaseUrl: string }) {
  describe('seed database deadlines on real PostgreSQL sessions', () => {
    let schema: string
    let admin: Pool
    let pool: Pool
    let independent: Pool
    let client: Client
    let queries: MockInstance<Client['query']>
    let end: MockInstance<Client['end']>
    let probe: (client: Client, query: Client['query']) => void
    let repository: PostgresContentRepository

    beforeEach(async () => {
      schema = `lab_seed_bounds_${randomUUID().replaceAll('-', '')}`
      admin = new Pool({ connectionString: databaseUrl, max: 1 })
      await admin.query(`CREATE SCHEMA "${schema}"`)
      const target = new URL(databaseUrl)
      target.searchParams.set('options', `-c search_path=${schema}`)
      pool = new Pool({ connectionString: target.href, max: 1 })
      independent = new Pool({ connectionString: target.href, max: 2 })
      await applyContentMigrations(pool, await readContentMigrations())
      vi.spyOn(pool, 'connect')
      probe = () => {}
      repository = new PostgresContentRepository(pool, (configuration) => {
        client = new Client(configuration)
        // Capture the real method before spying: a forwarding spy has no mock implementation.
        const query = client.query.bind(client)
        queries = vi.spyOn(client, 'query')
        end = vi.spyOn(client, 'end')
        probe(client, query)
        return client
      })
    })

    afterEach(async () => {
      vi.restoreAllMocks()
      await pool?.end()
      await independent?.end()
      await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
      await admin.end()
    })

    async function assertSeedConnectionClosed() {
      expect(pool.connect).not.toHaveBeenCalled()
      expect(end).toHaveBeenCalledExactlyOnceWith()
      await expect.poll(() => client.connection.stream.destroyed).toBe(true)
    }

    async function assertLockAvailable() {
      const observer = await independent.connect()
      try {
        await expect
          .poll(
            async () => {
              const result = await observer.query<{ acquired: boolean }>(
                'SELECT pg_try_advisory_lock(hashtextextended($1, 0)) AS acquired',
                [seedLockKey],
              )
              return result.rows[0]?.acquired
            },
            { timeout: 2_000 },
          )
          .toBe(true)
      } finally {
        await observer.query('SELECT pg_advisory_unlock(hashtextextended($1, 0))', [seedLockKey])
        observer.release(true)
      }
    }

    async function assertEmpty() {
      const observer = new PostgresContentRepository(independent)
      expect(await observer.readPublicationVersion()).toBe(0)
      await observer.transaction(async (transaction) => {
        expect(await transaction.listTaxonomyTerms()).toEqual([])
        expect(await transaction.listArticles()).toEqual([])
      })
    }

    it('cancels a blocked seed through lock_timeout, rolls back, releases its lock and retries', async () => {
      const blocker = await independent.connect()
      try {
        await blocker.query('BEGIN')
        await blocker.query('LOCK TABLE taxonomies IN ACCESS EXCLUSIVE MODE')
        await expect(
          seedLabContent(
            { repository, objects: null },
            {
              lockTimeoutMs: 75,
              statementTimeoutMs: 5_000,
              runTimeoutMs: 10_000,
            },
          ),
        ).rejects.toMatchObject({ code: '55P03' })
        expect(queries.mock.calls.some(([text]) => text === 'ROLLBACK')).toBe(true)
        await assertSeedConnectionClosed()
        await assertLockAvailable()
      } finally {
        await blocker.query('ROLLBACK')
        blocker.release()
      }
      await assertEmpty()
      expect((await seedLabContent({ repository, objects: null })).stories.created).toHaveLength(8)
    })

    it('cancels a slow statement through statement_timeout and rolls back before releasing the lock', async () => {
      // A fixture-only trigger makes actual seed SQL slow; no migration or product hook changes.
      await independent.query(`
        CREATE FUNCTION delay_seed_insert() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN PERFORM pg_sleep(1); RETURN NEW; END $$;
        CREATE TRIGGER delay_seed_insert BEFORE INSERT ON taxonomies
        FOR EACH ROW EXECUTE FUNCTION delay_seed_insert();
      `)
      await expect(
        seedLabContent(
          { repository, objects: null },
          {
            statementTimeoutMs: 75,
            runTimeoutMs: 10_000,
          },
        ),
      ).rejects.toMatchObject({ code: '57014' })
      expect(queries.mock.calls.some(([text]) => text === 'ROLLBACK')).toBe(true)
      await assertSeedConnectionClosed()
      await assertLockAvailable()
      await assertEmpty()
      await independent.query('DROP TRIGGER delay_seed_insert ON taxonomies')
      expect((await seedLabContent({ repository, objects: null })).stories.created).toHaveLength(8)
    })

    it('expires the run while publication bookkeeping is blocked and rolls back on disconnect', async () => {
      const blocker = await independent.connect()
      try {
        await blocker.query('BEGIN')
        await blocker.query('SELECT version FROM content_publication_state WHERE id = 1 FOR UPDATE')
        await expect(
          seedLabContent(
            { repository, objects: null },
            {
              runTimeoutMs: 500,
              statementTimeoutMs: 5_000,
              lockTimeoutMs: 5_000,
            },
          ),
        ).rejects.toThrow(/timed out|statement timeout|lock timeout/)
        expect(
          queries.mock.calls.some(
            ([text]) =>
              typeof text === 'string' && text.startsWith('UPDATE content_publication_state'),
          ),
        ).toBe(true)
        expect(queries.mock.calls.some(([text]) => text === 'COMMIT')).toBe(false)
        await assertSeedConnectionClosed()
        await assertLockAvailable()
      } finally {
        await blocker.query('ROLLBACK')
        blocker.release()
      }
      await assertEmpty()
      expect((await seedLabContent({ repository, objects: null })).stories.created).toHaveLength(8)
    })

    it('rolls back real publication bookkeeping if the deadline has passed before COMMIT', async () => {
      const now = performance.now.bind(performance)
      let elapsed = 0
      const clock = vi.spyOn(performance, 'now').mockImplementation(() => now() + elapsed)
      probe = (client, query) => {
        queries.mockImplementation((async (text: string, values?: unknown[]) => {
          const result = await query(text, values)
          // Advance the monotonic clock on delivery of the real UPDATE result. This exercises
          // the pre-COMMIT check deterministically, even if the deadline timer has not fired.
          if (text.startsWith('UPDATE content_publication_state')) elapsed = 10_000
          return result
        }) as typeof client.query)
      }
      await expect(
        seedLabContent(
          { repository, objects: null },
          {
            runTimeoutMs: 10_000,
          },
        ),
      ).rejects.toThrow('run deadline')
      expect(
        queries.mock.calls.some(
          ([text]) =>
            typeof text === 'string' && text.startsWith('UPDATE content_publication_state'),
        ),
      ).toBe(true)
      expect(queries.mock.calls.some(([text]) => text === 'COMMIT')).toBe(false)
      expect(queries.mock.calls.some(([text]) => text === 'ROLLBACK')).toBe(true)
      await assertSeedConnectionClosed()
      clock.mockRestore()
      probe = () => {}
      await assertEmpty()
      await assertLockAvailable()
      expect((await seedLabContent({ repository, objects: null })).stories.created).toHaveLength(8)
      await assertSeedConnectionClosed()
    })

    it('destroys a connection whose unlock never completes and frees its real advisory lock', async () => {
      const ended = vi.fn()
      probe = (client, query) => {
        client.once('end', ended)
        queries.mockImplementation((async (text: string, values?: unknown[]) => {
          if (text.includes('pg_advisory_unlock')) {
            // Deliberately withhold the unlock query: only destroying the session can free it.
            return new Promise(() => {})
          }
          const result = await query(text, values)
          if (text.includes('pg_try_advisory_lock')) {
            // Prove ownership before starting the short cleanup timer, so a slow CI
            // connection cannot race the assertion against that timer.
            const before = await independent.query<{ acquired: boolean }>(
              'SELECT pg_try_advisory_lock(hashtextextended($1, 0)) AS acquired',
              [seedLockKey],
            )
            expect(before.rows[0]?.acquired).toBe(false)
          }
          return result
        }) as typeof client.query)
      }
      await expect(
        seedLabContent({ repository, objects: null }, { cleanupTimeoutMs: 500 }),
      ).rejects.toThrow('database operation timed out')
      expect(queries.mock.calls.some(([text]) => text === 'COMMIT')).toBe(true)
      expect(
        queries.mock.calls.some(
          ([text]) => typeof text === 'string' && text.includes('pg_advisory_unlock'),
        ),
      ).toBe(true)
      await assertSeedConnectionClosed()
      await assertLockAvailable()
      await expect.poll(() => ended.mock.calls.length).toBe(1)
      // Work committed before cleanup remains idempotent on a fresh session.
      probe = () => {}
      expect((await seedLabContent({ repository, objects: null })).stories.created).toEqual([])
      await assertSeedConnectionClosed()
      const owner = await pool.connect()
      try {
        for (const name of [
          'statement_timeout',
          'lock_timeout',
          'idle_in_transaction_session_timeout',
        ]) {
          const actual = await owner.query(`SHOW ${name}`)
          const baseline = await independent.query(`SHOW ${name}`)
          expect(actual.rows).toEqual(baseline.rows)
        }
      } finally {
        owner.release()
      }
    })
  })
}
