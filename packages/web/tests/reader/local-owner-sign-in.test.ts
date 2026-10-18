import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import OwnerSignInPage from '@/app/owner/sign-in/page'
import { signInAsLocalOwner } from '@/app/owner/sign-in/local-action'
import { createOwnerFixtureSession, ownerFixtureCookieName } from '@/server/owner/session'

import { requestScope } from '../support/request-scope'

vi.mock('next/headers', async () => (await import('../support/request-scope')).nextHeaders)
vi.mock('@/components/owner/sign-in-form', () => ({ SignInForm: () => 'Standard owner sign-in' }))

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test')
  vi.stubEnv('BETTER_AUTH_URL', 'http://localhost:3100')
  vi.stubEnv('DATABASE_URL', '')
  vi.stubEnv('MAGAZINE_OWNER_EMAIL', 'owner@example.test')
  vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '1')
  vi.stubEnv('MAGAZINE_OWNER_TEST_TOKEN', 'task43-owner-test-token-with-more-than-thirty-two-bytes')
  requestScope.reset()
  requestScope.setHeader('host', 'localhost:3100')
  requestScope.setHeader('origin', 'http://localhost:3100')
})

afterEach(() => {
  requestScope.reset()
  vi.unstubAllEnvs()
})

describe('local owner sign-in', () => {
  it('offers a console-free fixture sign-in and issues the existing signed, HttpOnly session', async () => {
    const markup = renderToStaticMarkup(await OwnerSignInPage())
    expect(markup).toContain('Standard owner sign-in')
    expect(markup).toContain('Sign in as the local owner')
    expect(markup).not.toContain('task43-owner-test-token')
    await expect(signInAsLocalOwner()).rejects.toMatchObject({
      digest: expect.stringContaining('/owner/reader-lab'),
    })
    expect(requestScope.writes).toEqual([
      {
        name: ownerFixtureCookieName,
        value: createOwnerFixtureSession(),
        options: { httpOnly: true, maxAge: 3600, path: '/', sameSite: 'strict', secure: false },
      },
    ])
  })

  it.each([
    ['NODE_ENV', 'production'],
    ['NODE_ENV', 'development'],
    ['MAGAZINE_OWNER_TEST_MODE', ''],
    ['BETTER_AUTH_URL', 'https://magazine.example'],
    ['MAGAZINE_OWNER_TEST_TOKEN', 'short'],
  ])('omits the button and refuses the action with %s=%s', async (key, value) => {
    vi.stubEnv(key, value)
    const markup = renderToStaticMarkup(await OwnerSignInPage())
    expect(markup).toContain('Standard owner sign-in')
    expect(markup).not.toContain('Sign in as the local owner')
    await expect(signInAsLocalOwner()).rejects.toMatchObject({
      digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
    })
    expect(requestScope.writes).toEqual([])
  })

  it.each(['host', 'x-forwarded-host'])(
    'omits sign-in for a nonlocal request %s',
    async (header) => {
      requestScope.setHeader(header, 'magazine.example')
      expect(renderToStaticMarkup(await OwnerSignInPage())).not.toContain(
        'Sign in as the local owner',
      )
      await expect(signInAsLocalOwner()).rejects.toMatchObject({
        digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
      })
      expect(requestScope.writes).toEqual([])
    },
  )

  it.each([
    ['origin', 'https://attacker.example'],
    ['origin', 'null'],
    ['sec-fetch-site', 'cross-site'],
  ])('refuses cross-site sign-in through %s', async (header, value) => {
    requestScope.setHeader(header, value)
    await expect(signInAsLocalOwner()).rejects.toMatchObject({
      digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
    })
    expect(requestScope.writes).toEqual([])
  })
})
