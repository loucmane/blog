import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'

import { POST } from '@/app/api/internal/lab-seed/route'
import { expirePublicReader } from '@/reader/cache'
import { OwnerConfigurationError } from '@/server/owner/config'
import * as runtime from '@/server/owner/runtime'

import {
  labSeedEnvironmentKeys,
  refusedLabSeedEnvironments,
} from '../support/lab-seed-environments'

vi.mock('@/reader/cache', () => ({ expirePublicReader: vi.fn() }))

const token = 'fixture-lab-seed-'.padEnd(48, 'x')
const origin = 'https://preview.example.invalid'
let runtimeSpy: MockInstance<typeof runtime.getOwnerRuntime>

function request(authorization: string | null = `Bearer ${token}`) {
  return new Request(`${origin}/api/internal/lab-seed`, {
    method: 'POST',
    headers: authorization === null ? {} : { authorization },
  })
}

beforeEach(() => {
  for (const key of labSeedEnvironmentKeys) vi.stubEnv(key, undefined)
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('MAGAZINE_DEPLOYMENT_ENVIRONMENT', 'preview')
  vi.stubEnv('MAGAZINE_LAB_SEED_TOKEN', token)
  runtimeSpy = vi.spyOn(runtime, 'getOwnerRuntime').mockImplementation(() => {
    throw new OwnerConfigurationError('No fixture provided')
  })
})
afterEach(() => vi.unstubAllEnvs())

async function expectRefused(input = request()) {
  const response = await POST(input)
  expect(response.status).toBe(404)
  expect(response.headers.get('cache-control')).toBe('private, no-store')
  expect(await response.json()).toEqual({ error: 'The lab seed is not available.' })
  expect(runtimeSpy).not.toHaveBeenCalled()
  expect(expirePublicReader).not.toHaveBeenCalled()
}

describe('hosted lab seed admission', () => {
  it.each(refusedLabSeedEnvironments)(
    'refuses $name without touching storage',
    async ({ environment }) => {
      for (const key of labSeedEnvironmentKeys) vi.stubEnv(key, environment[key])
      await expectRefused()
    },
  )

  it.each([undefined, '', 'short', 'x'.repeat(513), 'é'.repeat(257)])(
    'refuses an absent or invalid configured token (%#)',
    async (value) => {
      vi.stubEnv('MAGAZINE_LAB_SEED_TOKEN', value)
      await expectRefused()
    },
  )

  it.each([
    null,
    'Basic fixture',
    'Bearer wrong',
    `Bearer ${token} extra`,
    `bearer ${token}`,
    `Bearer ${'x'.repeat(513)}`,
  ])('refuses invalid caller authorization (%#)', async (authorization) => {
    await expectRefused(request(authorization))
  })

  it('does not accept a token or Preview opt-in from URL or headers', async () => {
    vi.stubEnv('MAGAZINE_DEPLOYMENT_ENVIRONMENT', undefined)
    await expectRefused(
      new Request(`${origin}/api/internal/lab-seed?token=${token}&environment=preview`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'x-vercel-env': 'preview',
          'x-magazine-deployment-environment': 'preview',
        },
      }),
    )
    vi.stubEnv('MAGAZINE_DEPLOYMENT_ENVIRONMENT', 'preview')
    await expectRefused(
      new Request(`${origin}/api/internal/lab-seed?token=${token}`, { method: 'POST' }),
    )
  })

  it('reports missing runtime configuration without leaking details', async () => {
    const response = await POST(request())
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({
      error: 'No content store is configured for this server.',
    })
    expect(expirePublicReader).not.toHaveBeenCalled()
  })

  function memoryRuntime() {
    return runtime.createOwnerRuntime({
      NODE_ENV: 'test',
      MAGAZINE_OWNER_TEST_MODE: '1',
      MAGAZINE_OWNER_TEST_TOKEN: token,
      MAGAZINE_OWNER_EMAIL: 'owner@example.test',
      BETTER_AUTH_URL: 'http://localhost:3100',
    })
  }

  it('refuses Preview without media storage before content writes', async () => {
    const owner = memoryRuntime()
    const transaction = vi.spyOn(owner.repository, 'transaction')
    runtimeSpy.mockReturnValue({ ...owner, objects: null })
    const response = await POST(request())
    expect(response.status).toBe(503)
    expect(transaction).not.toHaveBeenCalled()
    expect(expirePublicReader).not.toHaveBeenCalled()
  })

  it('keeps the production owner fixture guard active in Preview', async () => {
    runtimeSpy.mockImplementation(() =>
      runtime.createOwnerRuntime({ ...process.env, MAGAZINE_OWNER_TEST_MODE: '1' }),
    )
    expect((await POST(request())).status).toBe(503)
    expect(expirePublicReader).not.toHaveBeenCalled()
  })

  it(
    'seeds and invalidates readers with production Node, explicit Preview and a matching token',
    { timeout: 15_000 },
    async () => {
      vi.stubEnv('VERCEL_ENV', 'preview')
      vi.stubEnv('VERCEL_TARGET_ENV', 'preview')
      runtimeSpy.mockReturnValue(memoryRuntime())
      const response = await POST(request())
      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBe('private, no-store')
      const report = await response.json()
      expect(report.stories.created).toHaveLength(8)
      expect(report.images.created).toHaveLength(9)
      expect(report.images.skipped).toBeNull()
      expect(expirePublicReader).toHaveBeenCalledOnce()
      expect(JSON.stringify(report)).not.toContain(token)
    },
  )
})
