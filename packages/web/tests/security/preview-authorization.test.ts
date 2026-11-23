import { randomBytes } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ enable: vi.fn(), disable: vi.fn(), story: vi.fn() }))
vi.mock('next/headers', () => ({
  draftMode: async () => ({ enable: mocks.enable, disable: mocks.disable }),
}))
vi.mock('@/lib/framework-content', () => ({ getFrameworkStory: mocks.story }))

import { POST as enable } from '@/app/api/preview/route'
import { POST as disable } from '@/app/api/preview/disable/route'
import { createPreviewToken } from '@/lib/request-security'

const origin = 'https://magazine.example'
const secret = randomBytes(32).toString('hex')
const slug = 'some-story'

beforeEach(() => {
  vi.stubEnv('MAGAZINE_RUNTIME_SITE_URL', origin)
  vi.stubEnv('MAGAZINE_PREVIEW_TOKEN_SECRET', secret)
  vi.stubEnv('MAGAZINE_PREVIEW_COOKIE_SECRET', randomBytes(32).toString('hex'))
  vi.stubEnv('MAGAZINE_REVALIDATION_SECRET', randomBytes(32).toString('hex'))
  mocks.story.mockReturnValue({ slug })
})
afterEach(() => vi.unstubAllEnvs())

it.each(['missing', 'wrong', 'other-slug', 'expired'])(
  'rejects a %s preview capability without draft-mode or cookie effects',
  async (kind) => {
    const token =
      kind === 'missing'
        ? undefined
        : kind === 'wrong'
          ? randomBytes(32).toString('hex')
          : createPreviewToken(
              kind === 'other-slug' ? 'other-story' : slug,
              secret,
              kind === 'expired' ? Date.now() - 600_000 : Date.now(),
            )
    const response = await enable(
      new NextRequest(`${origin}/api/preview`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, token }),
      }),
    )
    expect(response.status).toBe(401)
    expect(response.headers.has('set-cookie')).toBe(false)
    expect(mocks.enable).not.toHaveBeenCalled()
    expect(mocks.story).not.toHaveBeenCalled()
  },
)

it('accepts a valid slug-bound capability and issues only the scoped preview cookie', async () => {
  const response = await enable(
    new NextRequest(`${origin}/api/preview`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, token: createPreviewToken(slug, secret) }),
    }),
  )
  expect(response.status).toBe(303)
  expect(response.headers.get('location')).toBe(`${origin}/preview/stories/${slug}`)
  expect(mocks.enable).toHaveBeenCalledOnce()
  expect(response.headers.get('set-cookie')).toContain('Path=/preview')
})

it.each([undefined, 'https://other.example'])(
  'rejects preview cleanup with origin %s without disabling preview',
  async (requestOrigin) => {
    const response = await disable(
      new NextRequest(`${origin}/api/preview/disable`, {
        method: 'POST',
        ...(requestOrigin ? { headers: { origin: requestOrigin } } : {}),
      }),
    )
    expect(response.status).toBe(403)
    expect(mocks.disable).not.toHaveBeenCalled()
    expect(response.headers.has('set-cookie')).toBe(false)
  },
)
