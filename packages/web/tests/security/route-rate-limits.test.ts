import { randomBytes } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  enable: vi.fn(),
  runtime: vi.fn(),
  owner: vi.fn(),
  story: vi.fn(),
}))
vi.mock('next/headers', () => ({ draftMode: async () => ({ enable: mocks.enable }) }))
vi.mock('@/lib/framework-content', () => ({ getFrameworkStory: mocks.story }))
vi.mock('@/server/owner/runtime', () => ({ getOwnerRuntime: mocks.runtime }))
vi.mock('@/server/owner/session', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  requireOwnerSession: mocks.owner,
}))
vi.mock('@/reader/cache', () => ({ expirePublicReader: vi.fn() }))

import { createPreviewToken, maxPreviewRequestBytes } from '@/lib/request-security'

const origin = 'https://magazine.example'
const secret = randomBytes(32).toString('hex')

function request(path: string, body?: unknown, token?: string) {
  return new NextRequest(`${origin}${path}`, {
    method: 'POST',
    headers: {
      origin,
      'content-type': 'application/json',
      'x-real-ip': '192.0.2.20',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

function unattributedPreviewRequest(body: string) {
  return new NextRequest(`${origin}/api/preview`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })
}

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-13T12:00:00Z'))
  vi.stubEnv('MAGAZINE_RUNTIME_SITE_URL', origin)
  vi.stubEnv('MAGAZINE_PREVIEW_TOKEN_SECRET', secret)
  vi.stubEnv('MAGAZINE_PREVIEW_COOKIE_SECRET', randomBytes(32).toString('hex'))
  vi.stubEnv('MAGAZINE_REVALIDATION_SECRET', randomBytes(32).toString('hex'))
  mocks.owner.mockResolvedValue({ id: 'owner-test', email: 'owner@example.test', name: 'Owner' })
  mocks.story.mockReturnValue({ slug: 'some-story' })
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

describe('route rate limits', () => {
  it.each([
    ['malformed JSON', '{', 400],
    ['invalid shape', JSON.stringify({ extra: true }), 400],
    ['missing credential', JSON.stringify({ slug: 'some-story' }), 401],
    [
      'wrong credential',
      JSON.stringify({ slug: 'some-story', token: randomBytes(32).toString('hex') }),
      401,
    ],
  ] as const)(
    'limits rejected previews with %s after parsing, then allows the next window',
    async (_kind, body, status) => {
      const { POST } = await import('@/app/api/preview/route')
      for (let attempt = 0; attempt < 120; attempt += 1) {
        const response = await POST(unattributedPreviewRequest(body))
        expect(response.status).toBe(status)
        expect(response.headers.has('set-cookie')).toBe(false)
      }
      const blocked = unattributedPreviewRequest(body)
      const response = await POST(blocked)
      expect(response.status).toBe(429)
      expect(response.headers.get('retry-after')).toBe('600')
      expect(response.headers.get('cache-control')).toContain('no-store')
      expect(response.headers.has('set-cookie')).toBe(false)
      expect(blocked.bodyUsed).toBe(true)
      expect(mocks.enable).not.toHaveBeenCalled()
      expect(mocks.story).not.toHaveBeenCalled()
      vi.advanceTimersByTime(600_000)
      expect((await POST(unattributedPreviewRequest(body))).status).toBe(status)
    },
  )

  it('never counts or blocks valid previews when the unattributed failure bucket is exhausted', async () => {
    const { POST } = await import('@/app/api/preview/route')
    const slug = 'some-story'
    const validBody = JSON.stringify({ slug, token: createPreviewToken(slug, secret) })
    const invalidBody = JSON.stringify({ slug })
    // Valid previews share the absent proxy metadata, but spend no failure allowance.
    for (let attempt = 0; attempt < 120; attempt += 1) {
      expect((await POST(unattributedPreviewRequest(validBody))).status).toBe(303)
      expect((await POST(unattributedPreviewRequest(invalidBody))).status).toBe(401)
    }
    expect((await POST(unattributedPreviewRequest(invalidBody))).status).toBe(429)
    const response = await POST(unattributedPreviewRequest(validBody))
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(`${origin}/preview/stories/${slug}`)
    expect(response.headers.get('set-cookie')).toContain('Path=/preview')
    expect(response.headers.has('retry-after')).toBe(false)
    expect(mocks.enable).toHaveBeenCalledTimes(121)
    expect(mocks.story).toHaveBeenCalledTimes(121)
    expect((await POST(unattributedPreviewRequest(invalidBody))).status).toBe(429)
  })

  it('preserves preview configuration, content-type and size errors after failure exhaustion', async () => {
    const { POST } = await import('@/app/api/preview/route')
    const body = JSON.stringify({ slug: 'some-story' })
    for (let attempt = 0; attempt < 120; attempt += 1) {
      expect((await POST(unattributedPreviewRequest(body))).status).toBe(401)
    }
    expect((await POST(unattributedPreviewRequest(body))).status).toBe(429)
    vi.stubEnv('MAGAZINE_PREVIEW_TOKEN_SECRET', '')
    expect((await POST(unattributedPreviewRequest(body))).status).toBe(503)
    vi.stubEnv('MAGAZINE_PREVIEW_TOKEN_SECRET', secret)
    const nonJson = unattributedPreviewRequest(body)
    nonJson.headers.set('content-type', 'text/plain')
    expect((await POST(nonJson)).status).toBe(415)
    const oversized = unattributedPreviewRequest(' '.repeat(maxPreviewRequestBytes + 1))
    expect((await POST(oversized)).status).toBe(413)
    expect(mocks.enable).not.toHaveBeenCalled()
    expect(mocks.story).not.toHaveBeenCalled()
  })

  it('limits authenticated media uploads before multipart parsing or storage', async () => {
    const { POST } = await import('@/app/api/owner/media/route')
    // Invalid upload metadata still spends the authenticated caller's allowance.
    for (let attempt = 0; attempt < 120; attempt += 1) {
      expect((await POST(request('/api/owner/media'))).status).toBe(422)
    }
    const blocked = request('/api/owner/media')
    const read = vi.spyOn(blocked, 'formData')
    const response = await POST(blocked)
    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('600')
    expect(read).not.toHaveBeenCalled()
    expect(mocks.runtime).not.toHaveBeenCalled()
    mocks.owner.mockResolvedValue({ id: 'another-owner', email: 'other@example.test' })
    expect((await POST(request('/api/owner/media'))).status).toBe(422)
  })

  it('limits failed revalidation authentication without blocking an authenticated caller', async () => {
    const { POST } = await import('@/app/api/revalidate/route')
    const configured = randomBytes(32).toString('hex')
    vi.stubEnv('MAGAZINE_REVALIDATION_SECRET', configured)
    for (let attempt = 0; attempt < 60; attempt += 1) {
      expect((await POST(request('/api/revalidate'))).status).toBe(401)
    }
    const response = await POST(request('/api/revalidate'))
    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('600')
    expect(mocks.runtime).not.toHaveBeenCalled()
    expect((await POST(request('/api/revalidate', {}, configured))).status).toBe(404)
  })

  it('never echoes a rejected preview credential or email in its limited response or logs', async () => {
    const { POST } = await import('@/app/api/preview/route')
    const logs = ['log', 'warn', 'error'].map((level) =>
      vi.spyOn(console, level as 'log').mockImplementation(() => undefined),
    )
    const token = createPreviewToken('some-story', secret)
    let response: Response | undefined
    for (let attempt = 0; attempt < 121; attempt += 1) {
      response = await POST(request('/api/preview', { slug: 'other-story', token }))
    }
    expect(response?.status).toBe(429)
    const output = `${await response?.text()}${JSON.stringify(logs.map((log) => log.mock.calls))}`
    expect(output).not.toContain(secret)
    expect(output).not.toContain(token)
    expect(output).not.toContain('owner@example.test')
  })
})
