import { randomBytes } from 'node:crypto'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ runtime: vi.fn(), signup: vi.fn() }))
vi.mock('@/server/owner/runtime', () => ({ getOwnerRuntime: mocks.runtime }))
vi.mock('better-auth', () => ({ betterAuth: () => ({ api: { signUpEmail: mocks.signup } }) }))
import { POST } from '@/app/api/owner/setup/route'

const origin = 'https://magazine.example'
const secret = randomBytes(32).toString('hex')
beforeEach(() => {
  vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '')
  vi.stubEnv('MAGAZINE_CONTENT_BACKEND', 'postgres')
  vi.stubEnv('BETTER_AUTH_URL', origin)
  vi.stubEnv('DATABASE_URL', 'postgresql://localhost/synthetic-unused')
  vi.stubEnv('BETTER_AUTH_SECRET', randomBytes(32).toString('hex'))
  vi.stubEnv('MAGAZINE_OWNER_EMAIL', 'owner@example.test')
  vi.stubEnv('MAGAZINE_OWNER_SETUP_TOKEN', secret)
  vi.stubEnv('MAGAZINE_OWNER_RECOVERY_WEBHOOK_URL', '')
})
afterEach(() => vi.unstubAllEnvs())

it.each(['missing', 'wrong'])(
  'rejects a %s setup token without creating credentials, accounts or a session',
  async (identity) => {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes('AS complete')) return { rows: [{ complete: false }] }
      if (sql.includes('AS occupied')) return { rows: [{ occupied: false }] }
      if (sql.includes('AS limited')) return { rows: [{ limited: false }] }
      return { rows: [], rowCount: 1 }
    })
    mocks.runtime.mockReturnValue({ pool: { connect: async () => ({ query, release: vi.fn() }) } })
    const response = await POST(
      new Request(`${origin}/api/owner/setup`, {
        method: 'POST',
        headers: { origin, 'content-type': 'application/json' },
        body: JSON.stringify({
          ...(identity === 'wrong' ? { token: randomBytes(32).toString('hex') } : {}),
          password: 'synthetic long password',
        }),
      }),
    )
    expect(response.status).toBe(403)
    expect(response.headers.has('set-cookie')).toBe(false)
    expect(mocks.signup).not.toHaveBeenCalled()
    // Security attempt/latch bookkeeping is intentional; account/session tables are untouched.
    const writes = query.mock.calls
      .map(([sql]) => sql)
      .filter((sql) => /INSERT|UPDATE|DELETE/.test(sql) && !sql.startsWith('SELECT'))
    expect(writes.length).toBeGreaterThan(0)
    expect(writes.every((sql) => sql.includes('idempotency_records'))).toBe(true)
    expect(await response.text()).not.toContain(secret)
  },
)
