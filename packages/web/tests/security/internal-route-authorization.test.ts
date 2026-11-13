import { randomBytes } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  runtime: vi.fn(),
  store: vi.fn(),
  expire: vi.fn(),
  seed: vi.fn(),
  jobs: vi.fn(),
  dispatcher: vi.fn(),
}))
vi.mock('@/server/owner/runtime', () => ({ getOwnerRuntime: mocks.runtime }))
vi.mock('@/reader/store', () => ({ resolveReaderStore: mocks.store }))
vi.mock('@/reader/cache', () => ({ expirePublicReader: mocks.expire }))
vi.mock('@/server/lab/seed', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  seedLabContent: mocks.seed,
}))
vi.mock('@/server/owner/publication-worker', () => ({ runDuePublicationJobs: mocks.jobs }))
vi.mock('@/server/outbox/dispatcher', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  createOutboxDispatcher: mocks.dispatcher,
}))

const cases = [
  ['revalidate', 'MAGAZINE_REVALIDATION_SECRET', 401, () => import('@/app/api/revalidate/route')],
  [
    'internal/lab-seed',
    'MAGAZINE_LAB_SEED_TOKEN',
    404,
    () => import('@/app/api/internal/lab-seed/route'),
  ],
  [
    'internal/publication-jobs',
    'MAGAZINE_PUBLICATION_WORKER_TOKEN',
    404,
    () => import('@/app/api/internal/publication-jobs/route'),
  ],
  [
    'internal/outbox/drain',
    'MAGAZINE_OUTBOX_DRAIN_SECRET',
    401,
    () => import('@/app/api/internal/outbox/drain/route'),
  ],
  [
    'owner/fixture-session',
    'MAGAZINE_OWNER_TEST_TOKEN',
    404,
    () => import('@/app/api/owner/fixture-session/route'),
  ],
] as const
const origin = 'http://localhost:3100'
const secret = randomBytes(32).toString('hex')

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-13T12:00:00Z'))
  vi.stubEnv('NODE_ENV', 'test')
  vi.stubEnv('MAGAZINE_DEPLOYMENT_ENVIRONMENT', 'preview')
  vi.stubEnv('VERCEL_ENV', undefined)
  vi.stubEnv('VERCEL_TARGET_ENV', undefined)
  vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '1')
  vi.stubEnv('MAGAZINE_OWNER_EMAIL', 'owner@example.test')
  vi.stubEnv('BETTER_AUTH_URL', origin)
  vi.stubEnv('MAGAZINE_RUNTIME_SITE_URL', origin)
  vi.stubEnv('MAGAZINE_PREVIEW_TOKEN_SECRET', randomBytes(32).toString('hex'))
  vi.stubEnv('MAGAZINE_PREVIEW_COOKIE_SECRET', randomBytes(32).toString('hex'))
  for (const [, name] of cases) vi.stubEnv(name, secret)
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

function request(path: string, token?: string, network = '192.0.2.35') {
  return new NextRequest(`${origin}/api/${path}`, {
    method: 'POST',
    headers: {
      origin,
      'content-type': 'application/json',
      'x-real-ip': network,
      'x-correlation-id': 'security-rejection-test',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: '{}',
  })
}

describe.each(cases)('%s credentials', (path, _name, status, load) => {
  it.each(['missing', 'wrong'])(
    'rejects %s credentials before any business side effect',
    async (identity) => {
      const { POST } = await load()
      const input = request(
        path,
        identity === 'wrong' ? randomBytes(32).toString('hex') : undefined,
      )
      const response = await POST(input)
      expect(response.status).toBe(status)
      expect(input.bodyUsed).toBe(false)
      expect(response.headers.has('set-cookie')).toBe(false)
      for (const effect of Object.values(mocks)) expect(effect).not.toHaveBeenCalled()
    },
  )

  it('throttles failed credentials with a Retry-After and bounded response, per network', async () => {
    const { POST } = await load()
    const logs = (['log', 'warn', 'error'] as const).map((level) =>
      vi.spyOn(console, level).mockImplementation(() => undefined),
    )
    for (let attempt = 0; attempt < 60; attempt += 1) {
      expect((await POST(request(path))).status).toBe(status)
    }
    vi.advanceTimersByTime(1_000)
    const response = await POST(request(path, randomBytes(32).toString('hex')))
    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('599')
    expect(response.headers.get('cache-control')).toContain('no-store')
    if (path === 'internal/outbox/drain')
      expect(response.headers.get('x-correlation-id')).toBe('security-rejection-test')
    expect((await POST(request(path, undefined, '192.0.2.36'))).status).toBe(status)
    const output = `${await response.text()}${JSON.stringify(logs.map((log) => log.mock.calls))}`
    expect(output).not.toContain(secret)
    expect(output).not.toContain('owner@example.test')
    for (const effect of Object.values(mocks)) expect(effect).not.toHaveBeenCalled()
    vi.advanceTimersByTime(599_000)
    expect((await POST(request(path))).status).toBe(status)
  })
})

it('keeps the failed-authentication fallback active when proxy metadata is absent', async () => {
  const { POST } = await import('@/app/api/revalidate/route')
  for (let attempt = 0; attempt < 61; attempt += 1) {
    const input = request('revalidate')
    input.headers.delete('x-real-ip')
    expect((await POST(input)).status).toBe(attempt < 60 ? 401 : 429)
  }
})
