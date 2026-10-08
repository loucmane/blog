// Registered by postgres.integration.test.ts so the existing Docker runner executes this suite.
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { verifyPassword } from 'better-auth/crypto'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool, type QueryResult } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { ownerAuthOptions } from '../owner/auth'
import { resolveOwnerAuthConfiguration } from '../owner/config'
import { handleOwnerSetup, ownerSetupPageState } from '../owner/setup'
import { applyContentMigrations, readContentMigrations } from './migrations'
import { ownerAuthSchema } from './schema'

const fixtureToken = (label: string) => `fixture-${label}-`.padEnd(48, 'x')

export function ownerSetupIntegrationTests({
  databaseUrl,
  schema,
}: {
  databaseUrl: string
  schema: string
}) {
  describe('hosted owner setup with PostgreSQL and real Better Auth', () => {
    const admin = new Pool({ connectionString: databaseUrl, max: 1 })
    const pool = new Pool({
      connectionString: databaseUrl,
      max: 4,
      options: `-c search_path=${schema}`,
    })
    const environment = {
      DATABASE_URL: databaseUrl,
      BETTER_AUTH_URL: 'https://preview.example.com',
      BETTER_AUTH_SECRET: 'integration-auth-secret-at-least-32-bytes',
      MAGAZINE_OWNER_EMAIL: 'owner@example.com',
      MAGAZINE_OWNER_NAME: 'Preview owner',
      MAGAZINE_OWNER_SETUP_TOKEN: fixtureToken('initial-setup'),
      NODE_ENV: 'test',
    }
    const password = 'four unrelated words for integration'
    const options = ownerAuthOptions(
      resolveOwnerAuthConfiguration(environment),
      drizzleAdapter(drizzle(pool), {
        provider: 'pg',
        schema: ownerAuthSchema,
        transaction: true,
      }),
    )
    const auth = betterAuth({ ...options, plugins: [], logger: { disabled: true } })

    function request(token = environment.MAGAZINE_OWNER_SETUP_TOKEN, action = 'create') {
      return new Request(`${environment.BETTER_AUTH_URL}/api/owner/setup`, {
        method: 'POST',
        headers: { origin: environment.BETTER_AUTH_URL, 'content-type': 'application/json' },
        body: JSON.stringify({ token, password, action }),
      })
    }

    beforeAll(async () => {
      // Generated schema name isolates this suite from content/backup integration fixtures.
      if (!/^owner_setup_[a-f0-9]+$/.test(schema)) throw new Error('Invalid test schema name')
      await admin.query(`CREATE SCHEMA "${schema}"`)
      await applyContentMigrations(pool, await readContentMigrations())
    })
    beforeEach(async () => {
      await pool.query('TRUNCATE owner_users CASCADE')
      await pool.query("DELETE FROM idempotency_records WHERE operation = 'owner-setup'")
    })
    afterAll(async () => {
      await pool.end()
      if (/^owner_setup_[a-f0-9]+$/.test(schema))
        await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
      await admin.end()
    })

    it('creates one configured owner, a Better Auth password and a usable signed-in session', async () => {
      expect(await ownerSetupPageState(environment, pool)).toEqual({
        ready: false,
      })
      const response = await handleOwnerSetup(request(), environment, pool)
      expect(response.status).toBe(200)
      const users = await pool.query('SELECT * FROM owner_users')
      expect(users.rows).toHaveLength(1)
      expect(users.rows[0]).toMatchObject({
        email: environment.MAGAZINE_OWNER_EMAIL,
        name: environment.MAGAZINE_OWNER_NAME,
      })
      const accounts = await pool.query('SELECT * FROM owner_accounts')
      expect(accounts.rows).toHaveLength(1)
      expect(accounts.rows[0].provider_id).toBe('credential')
      expect(accounts.rows[0].password).not.toBe(password)
      expect(await verifyPassword({ password, hash: accounts.rows[0].password })).toBe(true)
      expect((await pool.query('SELECT * FROM owner_sessions')).rows).toHaveLength(1)
      const cookies = response.headers.getSetCookie()
      expect(cookies.join(';')).toMatch(/HttpOnly/i)
      expect(cookies.join(';')).toMatch(/Secure/i)
      expect(cookies.join(';')).toMatch(/SameSite=Lax/i)
      const session = await auth.api.getSession({
        headers: new Headers({ cookie: cookies.map((cookie) => cookie.split(';')[0]).join('; ') }),
      })
      expect(session?.user.email).toBe(environment.MAGAZINE_OWNER_EMAIL)
      const publicSignUp = await auth.api.signUpEmail({
        asResponse: true,
        body: { email: 'stranger@example.com', name: 'Stranger', password },
      })
      expect(publicSignUp.ok).toBe(false)
      expect(await response.text()).not.toContain(environment.MAGAZINE_OWNER_SETUP_TOKEN)
      expect(await ownerSetupPageState(environment, pool)).toEqual({
        ready: true,
      })
      expect((await handleOwnerSetup(request(), environment, pool)).status).toBe(404)
      // Even owner deletion or an email/token change cannot reopen a completed bootstrap.
      await pool.query('DELETE FROM owner_users')
      const changed = {
        ...environment,
        MAGAZINE_OWNER_EMAIL: 'new@example.com',
        MAGAZINE_OWNER_SETUP_TOKEN: fixtureToken('changed-owner'),
      }
      expect(
        (await handleOwnerSetup(request(changed.MAGAZINE_OWNER_SETUP_TOKEN), changed, pool)).status,
      ).toBe(404)
    })

    it('shares exhausted admission across pools without writes or locks, then permits token rotation', async () => {
      const otherPool = new Pool({
        connectionString: databaseUrl,
        options: `-c search_path=${schema}`,
        max: 1,
      })
      try {
        for (let i = 0; i < 5; i += 1)
          expect(
            (await handleOwnerSetup(request(`wrong-${i}`), environment, i % 2 ? otherPool : pool))
              .status,
          ).toBe(403)
        const before = await pool.query(
          "SELECT key, result, created_at, xmin::text FROM idempotency_records WHERE operation = 'owner-setup' ORDER BY key",
        )
        const locker = await pool.connect()
        const responses: string[] = []
        try {
          await locker.query('BEGIN')
          await locker.query(
            "SELECT key FROM idempotency_records WHERE operation = 'owner-setup' AND key = 'singleton' FOR UPDATE",
          )
          await locker.query('LOCK TABLE owner_users, owner_accounts IN SHARE ROW EXCLUSIVE MODE')
          // Exhausted requests must not wait for either the singleton or creation locks.
          for (const database of [pool, otherPool]) {
            for (const action of ['verify', 'create']) {
              for (const token of ['wrong', environment.MAGAZINE_OWNER_SETUP_TOKEN]) {
                const limited = await handleOwnerSetup(
                  request(token, action),
                  environment,
                  database,
                )
                expect(limited.status).toBe(429)
                expect(limited.headers.get('retry-after')).toBe('900')
                expect(limited.headers.has('set-cookie')).toBe(false)
                responses.push(await limited.text())
              }
            }
          }
        } finally {
          await locker.query('ROLLBACK')
          locker.release()
        }
        expect(new Set(responses).size).toBe(1)
        expect(
          (
            await pool.query(
              "SELECT key, result, created_at, xmin::text FROM idempotency_records WHERE operation = 'owner-setup' ORDER BY key",
            )
          ).rows,
        ).toEqual(before.rows)
        expect((await pool.query('SELECT * FROM owner_users')).rows).toHaveLength(0)
        const rotated = {
          ...environment,
          MAGAZINE_OWNER_SETUP_TOKEN: fixtureToken('rotated-setup'),
        }
        expect((await handleOwnerSetup(request(), rotated, otherPool)).status).toBe(403)
        const verified = await handleOwnerSetup(
          request(rotated.MAGAZINE_OWNER_SETUP_TOKEN, 'verify'),
          rotated,
          pool,
        )
        expect(verified.status).toBe(200)
        expect(await verified.json()).toMatchObject({ email: environment.MAGAZINE_OWNER_EMAIL })
        expect(verified.headers.has('set-cookie')).toBe(false)
        expect(
          (await handleOwnerSetup(request(rotated.MAGAZINE_OWNER_SETUP_TOKEN), rotated, otherPool))
            .status,
        ).toBe(200)
      } finally {
        await otherPool.end()
      }
    })

    it('admits at most five failing comparisons during a concurrent burst across two pools', async () => {
      const otherPool = new Pool({
        connectionString: databaseUrl,
        options: `-c search_path=${schema}`,
        max: 4,
      })
      try {
        const responses = await Promise.all(
          Array.from({ length: 10 }, (_, index) =>
            handleOwnerSetup(request(`wrong-${index}`), environment, index % 2 ? pool : otherPool),
          ),
        )
        expect(responses.filter((response) => response.status === 403)).toHaveLength(5)
        expect(responses.filter((response) => response.status === 429)).toHaveLength(5)
        expect(
          (
            await pool.query(
              "SELECT result FROM idempotency_records WHERE operation = 'owner-setup' AND key LIKE 'attempts:%'",
            )
          ).rows,
        ).toEqual([{ result: { attempts: 5 } }])
        expect((await pool.query('SELECT * FROM owner_users')).rows).toHaveLength(0)
      } finally {
        await otherPool.end()
      }
    })

    it('expires the invalid-token window without overwriting a permanent completion marker', async () => {
      for (let i = 0; i < 6; i += 1) await handleOwnerSetup(request('wrong'), environment, pool)
      await pool.query(
        "UPDATE idempotency_records SET created_at = now() - interval '16 minutes' WHERE operation = 'owner-setup' AND key LIKE 'attempts:%'",
      )
      expect((await handleOwnerSetup(request('wrong'), environment, pool)).status).toBe(403)
      expect((await handleOwnerSetup(request(), environment, pool)).status).toBe(200)
      await pool.query('DELETE FROM owner_users')
      expect((await handleOwnerSetup(request('wrong'), environment, pool)).status).toBe(404)
      expect((await handleOwnerSetup(request(), environment, pool)).status).toBe(404)
    })

    it('allows exactly one of two simultaneous attempts', async () => {
      const responses = await Promise.all([
        handleOwnerSetup(request(), environment, pool),
        handleOwnerSetup(request(), environment, pool),
      ])
      expect(responses.filter((response) => response.status === 200)).toHaveLength(1)
      expect(responses.filter((response) => [404, 503].includes(response.status))).toHaveLength(1)
      for (const table of ['owner_users', 'owner_accounts', 'owner_sessions'])
        expect((await pool.query(`SELECT * FROM ${table}`)).rows).toHaveLength(1)
    })

    it('rolls back user and credential writes if session creation fails, then permits a retry', async () => {
      await pool.query(
        `CREATE FUNCTION reject_setup_session() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test session failure'; END $$`,
      )
      await pool.query(
        'CREATE TRIGGER reject_setup_session BEFORE INSERT ON owner_sessions FOR EACH ROW EXECUTE FUNCTION reject_setup_session()',
      )
      try {
        const failed = await handleOwnerSetup(request(), environment, pool)
        expect(failed.status).toBe(503)
        expect(failed.headers.has('set-cookie')).toBe(false)
        for (const table of ['owner_users', 'owner_accounts', 'owner_sessions'])
          expect((await pool.query(`SELECT * FROM ${table}`)).rows).toHaveLength(0)
        expect((await ownerSetupPageState(environment, pool))?.ready).toBe(false)
      } finally {
        await pool.query('DROP TRIGGER reject_setup_session ON owner_sessions')
        await pool.query('DROP FUNCTION reject_setup_session()')
      }
      expect((await handleOwnerSetup(request(), environment, pool)).status).toBe(200)
    })

    it('rolls back the real user, credential and session if the completion update affects no row', async () => {
      await pool.query(`CREATE FUNCTION reject_setup_completion() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF NEW.operation = 'owner-setup' AND NEW.key = 'singleton'
            AND NEW.result->>'reason' = 'created' THEN RETURN NULL; END IF;
          RETURN NEW;
        END $$`)
      await pool.query(
        'CREATE TRIGGER reject_setup_completion BEFORE UPDATE ON idempotency_records FOR EACH ROW EXECUTE FUNCTION reject_setup_completion()',
      )
      try {
        const response = await handleOwnerSetup(request(), environment, pool)
        expect(response.status).toBe(503)
        expect(response.headers.has('set-cookie')).toBe(false)
        for (const table of ['owner_users', 'owner_accounts', 'owner_sessions'])
          expect((await pool.query(`SELECT * FROM ${table}`)).rows).toHaveLength(0)
        expect(await ownerSetupPageState(environment, pool)).toEqual({ ready: false })
      } finally {
        await pool.query('DROP TRIGGER reject_setup_completion ON idempotency_records')
        await pool.query('DROP FUNCTION reject_setup_completion()')
      }
      expect((await handleOwnerSetup(request(), environment, pool)).status).toBe(200)
    })

    it.each(['page', 'verify', 'create'])(
      'permanently latches a partial external user observed by %s',
      async (mode) => {
        await pool.query(
          "INSERT INTO owner_users (id, email, name) VALUES ('preexisting', 'earlier@example.com', 'Earlier owner')",
        )
        if (mode === 'page') {
          expect(await ownerSetupPageState(environment, pool)).toEqual({ ready: true })
        } else {
          expect((await handleOwnerSetup(request(undefined, mode), environment, pool)).status).toBe(
            404,
          )
        }
        expect((await pool.query('SELECT * FROM owner_users')).rows).toHaveLength(1)
        expect(
          (
            await pool.query(
              "SELECT result FROM idempotency_records WHERE operation = 'owner-setup' AND key = 'singleton'",
            )
          ).rows[0].result,
        ).toEqual({ completed: true, reason: 'existing-auth-state' })
        await pool.query('DELETE FROM owner_users')
        expect((await handleOwnerSetup(request(), environment, pool)).status).toBe(404)
        const changed = {
          ...environment,
          MAGAZINE_OWNER_EMAIL: 'changed@example.com',
          MAGAZINE_OWNER_SETUP_TOKEN: fixtureToken('changed-identity'),
        }
        expect(
          (await handleOwnerSetup(request(changed.MAGAZINE_OWNER_SETUP_TOKEN), changed, pool))
            .status,
        ).toBe(404)
        expect(await ownerSetupPageState(changed, pool)).toEqual({ ready: true })
      },
    )

    it.each(['page', 'invalid'])(
      'serializes a %s observation, external deletion and creation without overwriting disablement',
      async (mode) => {
        // Seed a committed, unlocked singleton so this tests FOR UPDATE, not an insert conflict.
        expect(await ownerSetupPageState(environment, pool)).toEqual({ ready: false })
        await pool.query(
          "INSERT INTO owner_users (id, email, name) VALUES ('external', 'external@example.com', 'External owner')",
        )
        // Pause the observer after it saw the external user, before its latch commits.
        await pool.query(`CREATE FUNCTION pause_setup_latch() RETURNS trigger LANGUAGE plpgsql AS $$
          BEGIN
            IF NEW.operation = 'owner-setup' AND NEW.key = 'singleton'
              AND NEW.result->>'reason' = 'existing-auth-state' THEN
              PERFORM pg_advisory_xact_lock(hashtext(TG_TABLE_SCHEMA), 1603);
            END IF;
            RETURN NEW;
          END $$`)
        await pool.query(
          'CREATE TRIGGER pause_setup_latch BEFORE UPDATE ON idempotency_records FOR EACH ROW EXECUTE FUNCTION pause_setup_latch()',
        )
        const otherPool = new Pool({
          connectionString: databaseUrl,
          options: `-c search_path=${schema}`,
          max: 1,
        })
        const barrier = await pool.connect()
        let observation: Promise<unknown> | undefined
        let creation: Promise<Response> | undefined
        try {
          const creatorPid = (await otherPool.query('SELECT pg_backend_pid() AS pid')).rows[0]
            .pid as number
          await barrier.query('BEGIN')
          await barrier.query('SELECT pg_advisory_xact_lock(hashtext($1), 1603)', [schema])
          const barrierPid = (await barrier.query('SELECT pg_backend_pid() AS pid')).rows[0]
            .pid as number
          observation =
            mode === 'page'
              ? ownerSetupPageState(environment, pool)
              : handleOwnerSetup(request('wrong'), environment, pool)
          let observerPid = 0
          await expect
            .poll(
              async () => {
                const waiting = await pool.query(
                  'SELECT pid FROM pg_stat_activity WHERE $1 = ANY(pg_blocking_pids(pid))',
                  [barrierPid],
                )
                observerPid = waiting.rows[0]?.pid ?? 0
                return observerPid
              },
              { timeout: 1500 },
            )
            .toBeGreaterThan(0)
          // The observer's plain SELECT permits this independent deletion to commit.
          await pool.query("DELETE FROM owner_users WHERE id = 'external'")
          creation = handleOwnerSetup(request(), environment, otherPool)
          await expect
            .poll(
              async () => {
                const waiting = await pool.query('SELECT pg_blocking_pids($1) AS blockers', [
                  creatorPid,
                ])
                return waiting.rows[0].blockers
              },
              { timeout: 1000 },
            )
            .toContain(observerPid)
          await barrier.query('COMMIT')
          const observed = await observation
          if (mode === 'page') expect(observed).toEqual({ ready: true })
          else expect((observed as Response).status).toBe(404)
          const response = await creation
          expect(response.status).toBe(404)
          expect(response.headers.has('set-cookie')).toBe(false)
          expect(
            (
              await pool.query(
                "SELECT result FROM idempotency_records WHERE operation = 'owner-setup' AND key = 'singleton'",
              )
            ).rows,
          ).toEqual([{ result: { completed: true, reason: 'existing-auth-state' } }])
          for (const table of ['owner_users', 'owner_accounts', 'owner_sessions'])
            expect((await pool.query(`SELECT * FROM ${table}`)).rows).toHaveLength(0)
        } finally {
          await barrier.query('ROLLBACK')
          await Promise.allSettled([observation, creation])
          barrier.release()
          await otherPool.end()
          await pool.query('DROP TRIGGER pause_setup_latch ON idempotency_records')
          await pool.query('DROP FUNCTION pause_setup_latch()')
        }
      },
      15_000,
    )

    it('holds the user table lock through creation and makes an independent insert wait', async () => {
      // A real database barrier pauses Better Auth at INSERT, after the emptiness check.
      // The independent writer never takes the setup lock or uses the setup API.
      await pool.query(`CREATE FUNCTION pause_setup_insert() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF NEW.email = 'owner@example.com' THEN
            PERFORM pg_advisory_xact_lock(hashtext(TG_TABLE_SCHEMA), 1602);
          END IF;
          RETURN NEW;
        END $$`)
      await pool.query(
        'CREATE TRIGGER pause_setup_insert BEFORE INSERT ON owner_users FOR EACH ROW EXECUTE FUNCTION pause_setup_insert()',
      )
      const barrier = await pool.connect()
      const writer = await pool.connect()
      let setup: Promise<Response> | undefined
      let insert: Promise<QueryResult> | undefined
      try {
        await barrier.query('BEGIN')
        await barrier.query('SELECT pg_advisory_xact_lock(hashtext($1), 1602)', [schema])
        const barrierPid = (await barrier.query('SELECT pg_backend_pid() AS pid')).rows[0]
          .pid as number
        setup = handleOwnerSetup(request(), environment, pool)
        let setupPid = 0
        await expect
          .poll(
            async () => {
              const waiting = await pool.query(
                'SELECT pid FROM pg_stat_activity WHERE $1 = ANY(pg_blocking_pids(pid))',
                [barrierPid],
              )
              setupPid = waiting.rows[0]?.pid ?? 0
              return setupPid
            },
            { timeout: 1500 },
          )
          .toBeGreaterThan(0)
        await writer.query('BEGIN')
        await writer.query("SET LOCAL statement_timeout = '5s'")
        const writerPid = (await writer.query('SELECT pg_backend_pid() AS pid')).rows[0]
          .pid as number
        insert = writer.query(
          "INSERT INTO owner_users (id, email, name) VALUES ('concurrent', 'other@example.com', 'External owner')",
        )
        await expect
          .poll(
            async () => {
              const result = await pool.query('SELECT pg_blocking_pids($1) AS blockers', [
                writerPid,
              ])
              return result.rows[0].blockers
            },
            { timeout: 1000 },
          )
          .toContain(setupPid)
        await barrier.query('COMMIT')
        expect((await setup).status).toBe(200)
        await insert
        // The external insert can finish only after setup commits; roll it back in cleanup.
        expect((await pool.query('SELECT email FROM owner_users')).rows).toEqual([
          { email: environment.MAGAZINE_OWNER_EMAIL },
        ])
      } finally {
        await barrier.query('ROLLBACK')
        await Promise.allSettled([setup, insert])
        await writer.query('ROLLBACK')
        barrier.release()
        writer.release()
        await pool.query('DROP TRIGGER pause_setup_insert ON owner_users')
        await pool.query('DROP FUNCTION pause_setup_insert()')
      }
    }, 15_000)

    it('refuses creation while an independent insert is uncommitted, then latches that user', async () => {
      const writer = await pool.connect()
      try {
        await writer.query('BEGIN')
        await writer.query(
          "INSERT INTO owner_users (id, email, name) VALUES ('concurrent', 'other@example.com', 'External owner')",
        )
        const response = await handleOwnerSetup(request(), environment, pool)
        expect(response.status).toBe(503)
        expect(response.headers.has('set-cookie')).toBe(false)
        await writer.query('COMMIT')
        expect((await handleOwnerSetup(request(), environment, pool)).status).toBe(404)
        expect((await pool.query('SELECT email FROM owner_users')).rows).toEqual([
          { email: 'other@example.com' },
        ])
      } finally {
        await writer.query('ROLLBACK')
        writer.release()
      }
    })
  })
}
