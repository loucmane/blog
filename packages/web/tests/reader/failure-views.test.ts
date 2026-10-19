import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import NotFound from '@/app/not-found'
import HomePage from '@/app/page'
import { resolveErrorPresentation } from '@/reader/components/resolve-error-presentation'
import { createOwnerFixtureSession, ownerFixtureCookieName } from '@/server/owner/session'

import { requestScope } from '../support/request-scope'

vi.mock('next/headers', async () => (await import('../support/request-scope')).nextHeaders)
vi.mock('next/server', () => ({ connection: vi.fn(async () => undefined) }))
// Keep selection/authentication real while simulating a missing story store independently.
vi.mock('@/reader/cache', () => ({ loadHomeView: vi.fn(async () => ({ status: 'unavailable' })) }))

const labCookie = 'reader_lab_direction'
beforeEach(() => {
  vi.stubEnv('BETTER_AUTH_URL', 'http://127.0.0.1:3100')
  vi.stubEnv('MAGAZINE_RUNTIME_SITE_URL', 'http://127.0.0.1:3100')
  vi.stubEnv('MAGAZINE_OWNER_EMAIL', 'owner@example.test')
  vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '1')
  vi.stubEnv('MAGAZINE_OWNER_TEST_TOKEN', 'failure-view-fixture-token-with-more-than-32-bytes')
  requestScope.reset()
})
afterEach(() => {
  requestScope.reset()
  vi.unstubAllEnvs()
})

it.each([undefined, 'v1.forged-signature'])(
  'ignores an unauthorized lab cookie on every failure surface (%s)',
  async (session) => {
    requestScope.setCookies({
      [labCookie]: 'quiet-monograph',
      ...(session ? { [ownerFixtureCookieName]: session } : {}),
    })
    expect(await resolveErrorPresentation()).toEqual({ directionId: 'baseline', lab: false })
    for (const element of [createElement(NotFound), await HomePage()]) {
      const markup = renderToStaticMarkup(element)
      expect(markup).toContain('data-reader-direction="baseline"')
      expect(markup).not.toMatch(/data-reader-lab-bar|@font-face|woff2/)
    }
  },
)

it('resolves the owner selection for all failure surfaces without returning private data', async () => {
  requestScope.setCookies({
    [labCookie]: 'quiet-monograph',
    [ownerFixtureCookieName]: createOwnerFixtureSession(),
  })
  expect(await resolveErrorPresentation()).toEqual({ directionId: 'quiet-monograph', lab: true })
  // Even owners receive a static baseline 404 until the client action authorizes an upgrade.
  const notFound = renderToStaticMarkup(createElement(NotFound))
  expect(notFound).toContain('data-reader-direction="baseline"')
  expect(notFound).not.toMatch(/data-reader-lab-bar|@font-face|woff2/)
  for (const page of [HomePage]) {
    const markup = renderToStaticMarkup(await page())
    expect(markup).toContain('data-reader-direction="quiet-monograph"')
    expect(markup).toContain('data-reader-lab-bar')
    expect(markup).toContain('/reader-directions/quiet-monograph/fonts/')
    expect([...markup.matchAll(/<h1[\s>]/g)]).toHaveLength(1)
  }
})

it('falls back for an unknown selection or when the owner session cannot be checked', async () => {
  requestScope.setCookies({
    [labCookie]: 'unknown',
    [ownerFixtureCookieName]: createOwnerFixtureSession(),
  })
  expect(await resolveErrorPresentation()).toEqual({ directionId: 'baseline', lab: false })
  vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '')
  vi.stubEnv('DATABASE_URL', '')
  requestScope.setCookies({ [labCookie]: 'quiet-monograph', [ownerFixtureCookieName]: 'v1.any' })
  expect(await resolveErrorPresentation()).toEqual({ directionId: 'baseline', lab: false })
})
