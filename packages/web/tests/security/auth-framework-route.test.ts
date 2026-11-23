import { randomBytes } from 'node:crypto'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  // Better Auth captures NODE_ENV when its module loads and skips CSRF in test mode.
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('TEST', 'false')
  return { query: vi.fn(), connect: vi.fn() }
})
vi.mock('@/server/owner/runtime', () => ({ getOwnerRuntime: () => ({ pool: mocks }) }))

import * as route from '@/app/api/auth/[...all]/route'

const origin = 'https://magazine.example'
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '')
  vi.stubEnv('BETTER_AUTH_URL', origin)
  vi.stubEnv('DATABASE_URL', 'postgresql://localhost/synthetic-unused')
  vi.stubEnv('BETTER_AUTH_SECRET', randomBytes(32).toString('hex'))
  vi.stubEnv('MAGAZINE_OWNER_EMAIL', 'owner@example.test')
  vi.stubEnv('MAGAZINE_OWNER_RECOVERY_WEBHOOK_URL', '')
})
afterEach(() => vi.unstubAllEnvs())

it.each(['POST', 'PUT', 'PATCH', 'DELETE'] as const)(
  'delegates %s to the actual auth framework, which rejects unauthenticated credential changes without database effects',
  async (method) => {
    const response = await route[method](
      new Request(`${origin}/api/auth/change-password`, {
        method,
        headers: {
          origin,
          'content-type': 'application/json',
          'x-forwarded-for': `192.0.2.${['POST', 'PUT', 'PATCH', 'DELETE'].indexOf(method) + 1}`,
        },
        body: JSON.stringify({
          currentPassword: 'synthetic old password',
          newPassword: 'synthetic new password',
        }),
      }),
    )
    expect(response.status).toBe(method === 'POST' ? 401 : 404)
    expect(response.headers.has('set-cookie')).toBe(false)
    expect(mocks.query).not.toHaveBeenCalled()
    expect(mocks.connect).not.toHaveBeenCalled()
  },
)

it('rejects a cross-origin auth POST before database effects', async () => {
  const response = await route.POST(
    new Request(`${origin}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        origin: 'https://other.example',
        'content-type': 'application/json',
        'x-forwarded-for': '192.0.2.10',
        cookie: `magazine-owner.session_token=${randomBytes(16).toString('hex')}`,
      },
      body: JSON.stringify({
        currentPassword: 'synthetic old password',
        newPassword: 'synthetic new password',
      }),
    }),
  )
  expect(response.status).toBe(403)
  expect(mocks.query).not.toHaveBeenCalled()
  expect(mocks.connect).not.toHaveBeenCalled()
})
