import { randomBytes } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ session: vi.fn(), runtime: vi.fn(), subscriptions: vi.fn() }))
vi.mock('@/server/owner/auth', () => ({
  getOwnerAuth: () => ({ api: { getSession: mocks.session } }),
}))
vi.mock('@/server/owner/runtime', () => ({ getOwnerRuntime: mocks.runtime }))
vi.mock('@/server/subscriptions/runtime', () => ({ getSubscriptionRuntime: mocks.subscriptions }))
vi.mock('@/reader/cache', () => ({ expirePublicReader: vi.fn() }))

import { POST as create } from '@/app/api/owner/stories/route'
import { PATCH as save } from '@/app/api/owner/stories/[id]/route'
import { POST as action } from '@/app/api/owner/stories/[id]/actions/route'
import { POST as upload } from '@/app/api/owner/media/route'
import { POST as exportSubscriber } from '@/app/api/owner/subscribers/export/route'
import { POST as eraseSubscriber } from '@/app/api/owner/subscribers/erase/route'

const origin = 'https://magazine.example'
const context = { params: Promise.resolve({ id: 'story-test' }) }
const mutations = [
  ['app/api/owner/stories/route.ts#POST', (request: Request) => create(request), undefined],
  [
    'app/api/owner/stories/[id]/route.ts#PATCH',
    (request: Request) => save(request, context),
    undefined,
  ],
  ...[
    'publish',
    'schedule',
    'cancel-schedule',
    'unpublish',
    'delete',
    'restore',
    'restore-revision',
  ].map(
    (name) =>
      [`story action ${name}`, (request: Request) => action(request, context), name] as const,
  ),
  ['app/api/owner/media/route.ts#POST', (request: Request) => upload(request), undefined],
  [
    'app/api/owner/subscribers/export/route.ts#POST',
    (request: Request) => exportSubscriber(request),
    undefined,
  ],
  [
    'app/api/owner/subscribers/erase/route.ts#POST',
    (request: Request) => eraseSubscriber(request),
    undefined,
  ],
] as const

beforeEach(() => {
  vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '')
  vi.stubEnv('MAGAZINE_RUNTIME_SITE_URL', origin)
  vi.stubEnv('BETTER_AUTH_URL', origin)
  vi.stubEnv('DATABASE_URL', 'postgresql://localhost/synthetic-unused')
  vi.stubEnv('BETTER_AUTH_SECRET', randomBytes(32).toString('hex'))
  vi.stubEnv('MAGAZINE_OWNER_EMAIL', 'owner@example.test')
  vi.stubEnv('MAGAZINE_OWNER_RECOVERY_WEBHOOK_URL', '')
})
afterEach(() => vi.unstubAllEnvs())

describe.each(['missing', 'foreign'] as const)('%s owner session', (identity) => {
  it.each(mutations)(
    'rejects %s before parsing, storage, publication or export',
    async (_id, run, operation) => {
      mocks.session.mockResolvedValue(
        identity === 'missing'
          ? null
          : {
              user: { id: 'foreign', name: 'Other', email: 'other@example.test' },
            },
      )
      const request = new Request(`${origin}/api/owner/test`, {
        method: _id.includes('#PATCH') ? 'PATCH' : 'POST',
        headers: { origin, 'content-type': 'application/json' },
        body: JSON.stringify({ action: operation, email: 'reader@example.test' }),
      })
      const response = await run(request)
      expect(response.status).toBe(401)
      expect(request.bodyUsed).toBe(false)
      expect(response.headers.has('set-cookie')).toBe(false)
      expect(mocks.session).toHaveBeenCalledOnce()
      expect(mocks.runtime).not.toHaveBeenCalled()
      expect(mocks.subscriptions).not.toHaveBeenCalled()
    },
  )
})

it.each(mutations)('rejects a cross-site %s even with a valid owner session', async (_id, run) => {
  mocks.session.mockResolvedValue({
    user: { id: 'owner', name: 'Owner', email: 'owner@example.test' },
  })
  const request = new Request(`${origin}/api/owner/test`, {
    method: 'POST',
    headers: { origin: 'https://other.example', 'content-type': 'application/json' },
    body: '{}',
  })
  expect((await run(request)).status).toBe(401)
  expect(request.bodyUsed).toBe(false)
  expect(mocks.runtime).not.toHaveBeenCalled()
  expect(mocks.subscriptions).not.toHaveBeenCalled()
})
