import { randomBytes } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ session: vi.fn(), home: vi.fn(), compare: vi.fn() }))
vi.mock('next/headers', async () => (await import('../../tests/support/request-scope')).nextHeaders)
vi.mock('@/server/owner/auth', () => ({
  getOwnerAuth: () => ({ api: { getSession: mocks.session } }),
}))
vi.mock('@/reader/cache', () => ({ loadHomeView: mocks.home }))
vi.mock('./compare-data', () => ({ loadComparePage: mocks.compare }))

import { requestScope } from '../../tests/support/request-scope'
import { exitReaderLab, openReaderDirection, switchReaderDirection } from './actions'
import { openComparedDirection } from './compare-actions'
import { readerLabCookieName } from './cookie'

const origin = 'https://magazine.example'
const form = () => {
  const data = new FormData()
  data.set('direction', 'baseline')
  data.set('destination', 'latest-story')
  data.set('page', 'home')
  return data
}

beforeEach(() => {
  requestScope.reset()
  requestScope.setHeader('origin', origin)
  vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '')
  vi.stubEnv('MAGAZINE_RUNTIME_SITE_URL', origin)
  vi.stubEnv('BETTER_AUTH_URL', origin)
  vi.stubEnv('DATABASE_URL', 'postgresql://localhost/synthetic-unused')
  vi.stubEnv('BETTER_AUTH_SECRET', randomBytes(32).toString('hex'))
  vi.stubEnv('MAGAZINE_OWNER_EMAIL', 'owner@example.test')
  vi.stubEnv('MAGAZINE_OWNER_RECOVERY_WEBHOOK_URL', '')
})
afterEach(() => {
  requestScope.reset()
  vi.unstubAllEnvs()
})

describe.each(['missing', 'foreign'])('%s owner action session', (identity) => {
  beforeEach(() =>
    mocks.session.mockResolvedValue(
      identity === 'missing'
        ? null
        : {
            user: { id: 'foreign', name: 'Other', email: 'other@example.test' },
          },
    ),
  )
  it.each([openReaderDirection, openComparedDirection])(
    'rejects %s without cookie writes or content reads',
    async (run) => {
      await expect(run(form())).rejects.toMatchObject({
        digest: expect.stringContaining('/owner/sign-in'),
      })
      expect(mocks.session).toHaveBeenCalledOnce()
      expect(requestScope.writes).toEqual([])
      expect(mocks.home).not.toHaveBeenCalled()
      expect(mocks.compare).not.toHaveBeenCalled()
    },
  )
  it('allows only revocation cleanup when a direction switch loses its owner session', async () => {
    await switchReaderDirection(form())
    expect(requestScope.writes).toEqual([
      { name: readerLabCookieName, options: { maxAge: 0 }, value: '' },
    ])
    expect(mocks.home).not.toHaveBeenCalled()
    expect(mocks.compare).not.toHaveBeenCalled()
  })
})

it.each([openReaderDirection, switchReaderDirection, openComparedDirection, exitReaderLab])(
  'rejects cross-site %s before session reads or cookie writes',
  async (run) => {
    requestScope.setHeader('origin', 'https://other.example')
    await expect(run(form())).rejects.toThrow('Sign in')
    expect(mocks.session).not.toHaveBeenCalled()
    expect(requestScope.writes).toEqual([])
    expect(mocks.home).not.toHaveBeenCalled()
    expect(mocks.compare).not.toHaveBeenCalled()
  },
)
