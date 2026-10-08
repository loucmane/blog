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

const fixtureToken = (label: string) => `fixture-${label}-`.padEnd(48, 'x')

const environment = {
  BETTER_AUTH_SECRET: 'auth-secret-only-for-this-unit-test-32-bytes',
  BETTER_AUTH_URL: 'https://preview.example.com',
  DATABASE_URL: 'postgresql://localhost/unit',
  MAGAZINE_OWNER_EMAIL: 'Owner@example.com',
  MAGAZINE_OWNER_NAME: 'Test owner',
  MAGAZINE_OWNER_SETUP_TOKEN: fixtureToken('setup-secret'),
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

function database({
  complete = false,
  occupied = false,
  attempts = 0,
  locked = true,
  completionUpdated = true,
} = {}) {
  const query = vi.fn(async (sql: string, _values?: unknown[]) => {
    if (sql.startsWith('LOCK TABLE') && !locked) throw new Error('lock unavailable')
    if (sql.includes('AS complete')) return { rows: [{ complete }] }
    if (sql.includes('AS occupied')) return { rows: [{ occupied }] }
    if (sql.includes('AS limited')) return { rows: [{ limited: attempts >= 5 }] }
    return { rows: [], rowCount: completionUpdated ? 1 : 0 }
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

  it('returns only availability to the page, never the identity or secret', async () => {
    expect(await ownerSetupPageState(environment, database().pool)).toEqual({
      ready: false,
    })
    expect(await ownerSetupPageState(environment, database({ complete: true }).pool)).toEqual({
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

  it('returns identical exhausted responses with one bounded read, no comparison, writes or locks', async () => {
    const bodies = []
    for (const action of ['verify', 'create']) {
      for (const token of ['wrong', environment.MAGAZINE_OWNER_SETUP_TOKEN]) {
        const db = database({ attempts: 5 })
        const response = await handleOwnerSetup(
          request({ action, token, password }),
          environment,
          db.pool,
        )
        expect(response.status).toBe(429)
        expect(response.headers.get('retry-after')).toBe('900')
        expect(response.headers.has('set-cookie')).toBe(false)
        bodies.push(await response.text())
        const statements = db.query.mock.calls.map(([sql]) => sql)
        expect(statements.filter((sql) => /SELECT/.test(sql))).toHaveLength(1)
        expect(statements.some((sql) => /INSERT|UPDATE|DELETE|LOCK TABLE/.test(sql))).toBe(false)
        expect(db.query).toHaveBeenCalledWith("SET LOCAL statement_timeout = '3s'")
        expect(db.query).toHaveBeenLastCalledWith('COMMIT')
        expect(db.release).toHaveBeenCalledOnce()
      }
    }
    expect(new Set(bodies).size).toBe(1)
    expect(timingSafeEqual).not.toHaveBeenCalled()
    expect(signUpEmail).not.toHaveBeenCalled()
  })

  it('rechecks admission after waiting for the singleton without comparing a now-limited candidate', async () => {
    const db = database()
    const base = db.query.getMockImplementation()!
    let reads = 0
    db.query.mockImplementation(async (sql, values) => {
      if (sql.includes('AS limited')) return { rows: [{ limited: ++reads > 1 }] }
      return base(sql, values)
    })
    const response = await handleOwnerSetup(request(), environment, db.pool)
    expect(response.status).toBe(429)
    expect(reads).toBe(2)
    expect(timingSafeEqual).not.toHaveBeenCalled()
    expect(signUpEmail).not.toHaveBeenCalled()
    expect(db.query.mock.calls.some(([sql]) => sql.startsWith('LOCK TABLE'))).toBe(false)
    expect(db.query.mock.calls.some(([sql]) => sql.includes('LEAST(5'))).toBe(false)
    expect(db.query).toHaveBeenLastCalledWith('COMMIT')
  })

  it('keys admission by configured token generation, independent of the candidate and forwarded IP', async () => {
    const keys = []
    for (const configured of [
      environment.MAGAZINE_OWNER_SETUP_TOKEN,
      environment.MAGAZINE_OWNER_SETUP_TOKEN,
      fixtureToken('rotated-setup'),
    ]) {
      const db = database({ attempts: 5 })
      const response = await handleOwnerSetup(
        request({ token: `wrong-${keys.length}` }, { 'x-forwarded-for': `192.0.2.${keys.length}` }),
        { ...environment, MAGAZINE_OWNER_SETUP_TOKEN: configured },
        db.pool,
      )
      expect(response.status).toBe(429)
      const key = db.query.mock.calls.find(([sql]) => sql.includes('AS limited'))?.[1]?.[0]
      expect(key).toMatch(/^attempts:[a-f0-9]{64}$/)
      expect(key).not.toContain(configured)
      keys.push(key)
    }
    expect(keys[0]).toBe(keys[1])
    expect(keys[2]).not.toBe(keys[0])
  })

  it('rolls back a singleton-lock timeout without comparing the token or accessing auth state', async () => {
    const db = database()
    const base = db.query.getMockImplementation()!
    db.query.mockImplementation(async (sql, values) => {
      if (sql.includes('FOR UPDATE')) throw new Error('lock timeout')
      return base(sql, values)
    })
    expect((await handleOwnerSetup(request(), environment, db.pool)).status).toBe(503)
    expect(timingSafeEqual).not.toHaveBeenCalled()
    expect(signUpEmail).not.toHaveBeenCalled()
    expect(db.query.mock.calls.some(([sql]) => sql.includes('AS occupied'))).toBe(false)
    expect(db.query).toHaveBeenLastCalledWith('ROLLBACK')
    expect(db.release).toHaveBeenCalledOnce()
  })

  it('fails safely and releases the transaction when another writer holds a table lock', async () => {
    const db = database({ locked: false })
    const response = await handleOwnerSetup(request(), environment, db.pool)
    expect(response.status).toBe(503)
    expect(response.headers.has('set-cookie')).toBe(false)
    expect(signUpEmail).not.toHaveBeenCalled()
    expect(db.query).toHaveBeenLastCalledWith('ROLLBACK')
    expect(db.release).toHaveBeenCalledOnce()
  })

  it.each(['page', 'verify', 'create', 'invalid'])(
    'latches observed auth state through %s',
    async (mode) => {
      const db = database({ occupied: true })
      if (mode === 'page') {
        expect(await ownerSetupPageState(environment, db.pool)).toEqual({ ready: true })
      } else {
        const body =
          mode === 'invalid'
            ? { token: 'wrong' }
            : {
                token: environment.MAGAZINE_OWNER_SETUP_TOKEN,
                ...(mode === 'verify' ? { action: 'verify' } : { password }),
              }
        expect((await handleOwnerSetup(request(body), environment, db.pool)).status).toBe(404)
      }
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('jsonb_build_object'), [
        'existing-auth-state',
      ])
      expect(db.query).toHaveBeenLastCalledWith('COMMIT')
      expect(signUpEmail).not.toHaveBeenCalled()
      const statements = db.query.mock.calls.map(([sql]) => sql)
      const markerLock = statements.findIndex((sql) => sql.includes('FOR UPDATE'))
      expect(markerLock).toBeGreaterThan(statements.findIndex((sql) => sql.includes('DO NOTHING')))
      expect(markerLock).toBeLessThan(statements.findIndex((sql) => sql.includes('AS occupied')))
    },
  )

  it('reveals the configured email only after verification without creating an account or cookies', async () => {
    for (const token of ['wrong', environment.MAGAZINE_OWNER_SETUP_TOKEN]) {
      const response = await handleOwnerSetup(
        request({ action: 'verify', token }),
        environment,
        database().pool,
      )
      expect(response.status).toBe(token === 'wrong' ? 403 : 200)
      const text = await response.text()
      expect(text.includes('owner@example.com')).toBe(token !== 'wrong')
      expect(text).not.toContain(environment.MAGAZINE_OWNER_SETUP_TOKEN)
      expect(response.headers.has('set-cookie')).toBe(false)
    }
    expect(signUpEmail).not.toHaveBeenCalled()
  })

  it.each([{}, { token: '' }, { password }])('rejects a missing token %j', async (body) => {
    expect((await handleOwnerSetup(request(body), environment, database().pool)).status).toBe(403)
  })

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
    expect((await handleOwnerSetup(request(['invalid']), environment, db.pool)).status).toBe(400)
    expect(db.connect).not.toHaveBeenCalled()
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
    const sql = db.query.mock.calls.map(([statement]) => statement)
    const tableLock = sql.findIndex((statement) => statement.startsWith('LOCK TABLE'))
    expect(tableLock).toBeGreaterThan(
      sql.findIndex((statement) => statement.includes('FOR UPDATE')),
    )
    expect(tableLock).toBeLessThan(sql.findIndex((statement) => statement.includes('AS occupied')))
  })

  it('disables POST once any owner or permanent completion marker exists, regardless of token', async () => {
    const db = database({ complete: true })
    expect((await handleOwnerSetup(request(), environment, db.pool)).status).toBe(404)
    expect(
      db.query.mock.calls.some(([sql]) => /LOCK TABLE|AS occupied|jsonb_build_object/.test(sql)),
    ).toBe(false)
    expect(timingSafeEqual).not.toHaveBeenCalled()
    expect(signUpEmail).not.toHaveBeenCalled()
  })

  it('rolls back all auth writes and withholds cookies when the completion guard fails', async () => {
    const db = database({ completionUpdated: false })
    const response = await handleOwnerSetup(request(), environment, db.pool)
    expect(signUpEmail).toHaveBeenCalledOnce()
    expect(response.status).toBe(503)
    expect(response.headers.has('set-cookie')).toBe(false)
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("AND result->>'completed' = 'false'"),
      ['created'],
    )
    expect(db.query).toHaveBeenLastCalledWith('ROLLBACK')
    expect(db.release).toHaveBeenCalledOnce()
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
