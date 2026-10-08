import { timingSafeEqual } from 'node:crypto'
import type * as Crypto from 'node:crypto'

import { betterAuth } from 'better-auth'
import type { Pool } from 'pg'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from '@/app/api/owner/setup/route'

import {
  handleOwnerSetup,
  ownerSetupPageState,
  ownerSetupTokenMatches,
  resolveOwnerSetupConfiguration,
} from './setup'

vi.mock('node:crypto', async (original) => ({
  ...(await original<typeof Crypto>()),
  timingSafeEqual: vi.fn((await original<typeof Crypto>()).timingSafeEqual),
}))
const { signUpEmail, runtime } = vi.hoisted(() => ({ signUpEmail: vi.fn(), runtime: vi.fn() }))
vi.mock('better-auth', () => ({ betterAuth: vi.fn(() => ({ api: { signUpEmail } })) }))
vi.mock('./runtime', () => ({ getOwnerRuntime: runtime }))

const environment = {
  BETTER_AUTH_SECRET: 'auth-secret-only-for-this-unit-test-32-bytes',
  BETTER_AUTH_URL: 'https://preview.example.com',
  DATABASE_URL: 'postgresql://localhost/unit',
  MAGAZINE_OWNER_EMAIL: 'Owner@example.com',
  MAGAZINE_OWNER_NAME: 'Test owner',
  MAGAZINE_OWNER_SETUP_TOKEN: 'setup-secret-only-for-this-unit-test-32-bytes',
  NODE_ENV: 'test',
}
const password = 'a long test password'

function request(
  body: unknown = { token: environment.MAGAZINE_OWNER_SETUP_TOKEN, password },
  headers: Record<string, string> = {},
) {
  return new Request('https://preview.example.com/api/owner/setup', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: environment.BETTER_AUTH_URL,
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

function database({ complete = false, attempts = 1, locked = true } = {}) {
  const query = vi.fn(async (sql: string) => {
    if (sql.includes('pg_try_advisory')) return { rows: [{ locked }] }
    if (sql.includes('AS complete')) return { rows: [{ complete }] }
    if (sql.includes('RETURNING')) return { rows: [{ attempts }] }
    return { rows: [] }
  })
  const release = vi.fn()
  const connect = vi.fn(async () => ({ query, release }))
  const pool = { query, connect } as unknown as Pool
  return { pool, query, connect, release }
}

beforeEach(() => {
  signUpEmail.mockReset().mockImplementation(
    async () =>
      new Response('{"token":"session-secret"}', {
        headers: {
          'set-cookie':
            'magazine-owner.session_token=signed-session; HttpOnly; Secure; SameSite=Lax; Path=/',
        },
      }),
  )
})

describe('hosted owner setup', () => {
  it.each([
    { MAGAZINE_OWNER_SETUP_TOKEN: undefined },
    { MAGAZINE_OWNER_SETUP_TOKEN: 'x'.repeat(31) },
    { MAGAZINE_OWNER_SETUP_TOKEN: 'x'.repeat(513) },
    { MAGAZINE_OWNER_EMAIL: undefined },
    { MAGAZINE_OWNER_EMAIL: 'invalid' },
    { MAGAZINE_OWNER_TEST_MODE: '1' },
    { MAGAZINE_CONTENT_BACKEND: 'framework-fixture' },
    { DATABASE_URL: undefined },
    { BETTER_AUTH_SECRET: 'short' },
  ])('fails closed for unavailable configuration %j', async (override) => {
    const env = { ...environment, ...override }
    const db = database()
    expect(resolveOwnerSetupConfiguration(env)).toBeNull()
    expect(await ownerSetupPageState(env, db.pool)).toBeNull()
    expect((await handleOwnerSetup(request(), env, db.pool)).status).toBe(404)
    expect(db.connect).not.toHaveBeenCalled()
    expect(db.query).not.toHaveBeenCalled()
  })

  it('enables the page only before an owner exists and never serializes the secret', async () => {
    expect(await ownerSetupPageState(environment, database().pool)).toEqual({
      email: 'owner@example.com',
      ready: false,
    })
    expect(await ownerSetupPageState(environment, database({ complete: true }).pool)).toEqual({
      email: 'owner@example.com',
      ready: true,
    })
    expect(
      resolveOwnerSetupConfiguration({
        ...environment,
        MAGAZINE_OWNER_SETUP_TOKEN: 'é'.repeat(16),
      }),
    ).not.toBeNull()
  })

  it('compares fixed-size digests in constant time even for empty and wrong-length input', () => {
    for (const candidate of [
      '',
      'short',
      'z'.repeat(512),
      environment.MAGAZINE_OWNER_SETUP_TOKEN,
    ]) {
      expect(ownerSetupTokenMatches(candidate, environment.MAGAZINE_OWNER_SETUP_TOKEN)).toBe(
        candidate === environment.MAGAZINE_OWNER_SETUP_TOKEN,
      )
    }
    expect(
      vi
        .mocked(timingSafeEqual)
        .mock.calls.slice(-4)
        .map(([a, b]) => [a.byteLength, b.byteLength]),
    ).toEqual(Array(4).fill([32, 32]))
  })

  it('refuses a wrong token and commits the rate-limit attempt without logging or echoing secrets', async () => {
    const logs = [vi.spyOn(console, 'log'), vi.spyOn(console, 'warn'), vi.spyOn(console, 'error')]
    const db = database()
    const response = await handleOwnerSetup(
      request({ token: 'wrong-secret', password }),
      environment,
      db.pool,
    )
    expect(response.status).toBe(403)
    expect(await response.text()).not.toMatch(/wrong-secret|test password|setup-secret/)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.has('set-cookie')).toBe(false)
    expect(signUpEmail).not.toHaveBeenCalled()
    expect(db.query).toHaveBeenLastCalledWith('COMMIT')
    expect(JSON.stringify(db.query.mock.calls)).not.toMatch(
      /wrong-secret|test password|setup-secret/,
    )
    for (const log of logs) expect(log).not.toHaveBeenCalled()
  })

  it.each([{ attempts: 6 }, { locked: false }])(
    'rate limits before expensive auth %j',
    async (state) => {
      const db = database(state)
      const response = await handleOwnerSetup(request(), environment, db.pool)
      expect(response.status).toBe(429)
      expect(response.headers.get('retry-after')).toBe('900')
      expect(signUpEmail).not.toHaveBeenCalled()
    },
  )

  it.each([{}, { token: '' }, { password }, ['invalid']])(
    'rejects a missing token %j',
    async (body) => {
      expect((await handleOwnerSetup(request(body), environment, database().pool)).status).toBe(403)
    },
  )

  it.each(['x'.repeat(13), 'x'.repeat(129)])(
    'enforces the existing password policy',
    async (candidate) => {
      const response = await handleOwnerSetup(
        request({ token: environment.MAGAZINE_OWNER_SETUP_TOKEN, password: candidate }),
        environment,
        database().pool,
      )
      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({ field: 'password' })
      expect(signUpEmail).not.toHaveBeenCalled()
    },
  )

  it('refuses cross-origin, non-JSON, and oversized requests', async () => {
    const db = database()
    const forbiddenHeaders: Record<string, string>[] = [
      { origin: 'https://other.example.com' },
      { 'sec-fetch-site': 'cross-site' },
      { origin: '' },
    ]
    for (const headers of forbiddenHeaders) {
      expect(
        (await handleOwnerSetup(request(undefined, headers), environment, db.pool)).status,
      ).toBe(403)
    }
    expect(
      (
        await handleOwnerSetup(
          request(undefined, { 'content-type': 'text/plain' }),
          environment,
          db.pool,
        )
      ).status,
    ).toBe(415)
    expect(db.connect).not.toHaveBeenCalled()
    expect(
      (await handleOwnerSetup(request({ token: 'x'.repeat(5000) }), environment, db.pool)).status,
    ).toBe(400)
    expect(signUpEmail).not.toHaveBeenCalled()
  })

  it('creates the configured identity through Better Auth and forwards only cookies after commit', async () => {
    const db = database()
    const response = await handleOwnerSetup(
      request({
        token: environment.MAGAZINE_OWNER_SETUP_TOKEN,
        password,
        email: 'attacker@example.com',
        name: 'Attacker',
      }),
      environment,
      db.pool,
    )
    expect(response.status).toBe(200)
    expect(signUpEmail).toHaveBeenCalledExactlyOnceWith({
      asResponse: true,
      body: { email: 'owner@example.com', name: 'Test owner', password },
    })
    expect(vi.mocked(betterAuth).mock.calls.at(-1)?.[0]).toMatchObject({
      emailAndPassword: { disableSignUp: false, minPasswordLength: 14 },
      plugins: [],
      logger: { disabled: true },
    })
    expect(response.headers.get('set-cookie')).toContain('HttpOnly')
    expect(await response.text()).not.toMatch(/session-secret|setup-secret|test password/)
    expect(db.query).toHaveBeenLastCalledWith('COMMIT')
    expect(db.release).toHaveBeenCalledOnce()
  })

  it('disables POST once any owner or permanent completion marker exists, regardless of token', async () => {
    expect(
      (await handleOwnerSetup(request(), environment, database({ complete: true }).pool)).status,
    ).toBe(404)
    expect(signUpEmail).not.toHaveBeenCalled()
  })

  it('rolls back auth failures without leaking dependency errors or cookies', async () => {
    signUpEmail.mockRejectedValueOnce(
      new Error(`secret ${environment.MAGAZINE_OWNER_SETUP_TOKEN} ${password}`),
    )
    const db = database()
    const response = await handleOwnerSetup(request(), environment, db.pool)
    expect(response.status).toBe(503)
    expect(response.headers.has('set-cookie')).toBe(false)
    expect(await response.text()).not.toMatch(/setup-secret|test password/)
    expect(db.query).toHaveBeenLastCalledWith('ROLLBACK')
    expect(db.release).toHaveBeenCalledOnce()
  })

  it('never releases cookies when the commit fails', async () => {
    const db = database()
    const base = db.query.getMockImplementation()!
    db.query.mockImplementation(async (sql) => {
      if (sql === 'COMMIT') throw new Error('commit failed')
      return base(sql)
    })
    const response = await handleOwnerSetup(request(), environment, db.pool)
    expect(response.status).toBe(503)
    expect(response.headers.has('set-cookie')).toBe(false)
  })

  it('wires the POST route to the configured runtime', async () => {
    for (const [key, value] of Object.entries(environment)) vi.stubEnv(key, value)
    runtime.mockReturnValue({ pool: database().pool })
    try {
      expect((await POST(request())).status).toBe(200)
    } finally {
      vi.unstubAllEnvs()
    }
  })
})
