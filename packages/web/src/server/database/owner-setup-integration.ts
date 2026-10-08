// Registered by postgres.integration.test.ts so the existing Docker runner executes this suite.
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { verifyPassword } from 'better-auth/crypto'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { ownerAuthOptions } from '../owner/auth'
import { resolveOwnerAuthConfiguration } from '../owner/config'
import { handleOwnerSetup, ownerSetupPageState } from '../owner/setup'
import { applyContentMigrations, readContentMigrations } from './migrations'
import { ownerAuthSchema } from './schema'

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
      MAGAZINE_OWNER_SETUP_TOKEN: 'integration-setup-secret-at-least-32-bytes',
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

    function request(token = environment.MAGAZINE_OWNER_SETUP_TOKEN) {
      return new Request(`${environment.BETTER_AUTH_URL}/api/owner/setup`, {
        method: 'POST',
        headers: { origin: environment.BETTER_AUTH_URL, 'content-type': 'application/json' },
        body: JSON.stringify({ token, password }),
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
        email: environment.MAGAZINE_OWNER_EMAIL,
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
        email: environment.MAGAZINE_OWNER_EMAIL,
        ready: true,
      })
      expect((await handleOwnerSetup(request(), environment, pool)).status).toBe(404)
      // Even owner deletion or an email/token change cannot reopen a completed bootstrap.
      await pool.query('DELETE FROM owner_users')
      const changed = {
        ...environment,
        MAGAZINE_OWNER_EMAIL: 'new@example.com',
        MAGAZINE_OWNER_SETUP_TOKEN: 'changed-secret-with-at-least-32-bytes',
      }
      expect(
        (await handleOwnerSetup(request(changed.MAGAZINE_OWNER_SETUP_TOKEN), changed, pool)).status,
      ).toBe(404)
    })

    it('rejects bad tokens and shares a persistent limit with a second application pool', async () => {
      for (let i = 0; i < 5; i += 1)
        expect((await handleOwnerSetup(request(`wrong-${i}`), environment, pool)).status).toBe(403)
      const otherPool = new Pool({
        connectionString: databaseUrl,
        options: `-c search_path=${schema}`,
        max: 1,
      })
      try {
        const limited = await handleOwnerSetup(request(), environment, otherPool)
        expect(limited.status).toBe(429)
        expect(limited.headers.get('retry-after')).toBe('900')
        expect((await pool.query('SELECT * FROM owner_users')).rows).toHaveLength(0)
        await pool.query(
          "UPDATE idempotency_records SET created_at = now() - interval '16 minutes' WHERE operation = 'owner-setup'",
        )
        expect((await handleOwnerSetup(request(), environment, otherPool)).status).toBe(200)
      } finally {
        await otherPool.end()
      }
    })

    it('allows exactly one of two simultaneous attempts', async () => {
      const responses = await Promise.all([
        handleOwnerSetup(request(), environment, pool),
        handleOwnerSetup(request(), environment, pool),
      ])
      expect(responses.filter((response) => response.status === 200)).toHaveLength(1)
      expect(responses.filter((response) => [404, 429].includes(response.status))).toHaveLength(1)
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

    it('disables setup for a preexisting owner even with a different configured email', async () => {
      await pool.query(
        "INSERT INTO owner_users (id, email, name) VALUES ('preexisting', 'earlier@example.com', 'Earlier owner')",
      )
      expect((await ownerSetupPageState(environment, pool))?.ready).toBe(true)
      expect((await handleOwnerSetup(request(), environment, pool)).status).toBe(404)
      expect((await pool.query('SELECT * FROM owner_users')).rows).toHaveLength(1)
    })
  })
}
