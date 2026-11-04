import { describe, expect, it } from 'vitest'

import { redactEventPayload } from './redact'

describe('analytics allowlist', () => {
  it('keeps only the event contract and reduces identifying paths to patterns', () => {
    const secret = ['synthetic', 'private', 'value'].join('-')
    const extra = {
      address: 'reader@example.invalid',
      draft: 'Unpublished synthetic draft',
      id: secret,
      ip: '192.0.2.1',
      timestamp: '1999-01-01',
      token: secret,
      userAgent: 'Synthetic browser',
      visitorId: secret,
    }
    expect(
      redactEventPayload({
        ...extra,
        type: 'page_view',
        routePattern: `/stories/${secret}?email=${extra.address}#draft`,
      }),
    ).toEqual({ type: 'page_view', routePattern: '/stories/[slug]' })
    expect(
      redactEventPayload({
        ...extra,
        type: 'web_vital',
        routePattern: '/authors/reader',
        name: 'LCP',
        value: 2500.4,
      }),
    ).toEqual({ type: 'web_vital', routePattern: '/authors/[slug]', name: 'LCP', value: 2500 })
  })

  it.each([
    '/preview',
    '/preview/stories/private',
    '/owner',
    '/owner/stories/private/preview',
    '/api/owner/stories',
    '/subscriptions/confirm',
    '//owner',
    '/stories/../owner',
    '/stories/%2e%2e',
    '/stories/one/more',
    'https://example.invalid/stories/one',
    '',
    '/unknown',
  ])('rejects the nonpublic or ambiguous route %s', (routePattern) => {
    expect(redactEventPayload({ type: 'page_view', routePattern })).toBeNull()
    expect(
      redactEventPayload({ type: 'web_vital', routePattern, name: 'CLS', value: 0.1 }),
    ).toBeNull()
  })

  it.each(['/', '/stories/[slug]', '/authors/[slug]', '/topics/[slug]', '/sections/[slug]'])(
    'accepts only known route patterns: %s',
    (routePattern) => {
      expect(redactEventPayload({ type: 'page_view', routePattern })).toEqual({
        type: 'page_view',
        routePattern,
      })
    },
  )

  it.each([
    null,
    [],
    {},
    { type: 'unknown', routePattern: '/' },
    { type: 'web_vital', routePattern: '/', name: 'TTFB', value: 1 },
    ...[-1, Infinity, NaN, 60_001, '2500'].map((value) => ({
      type: 'web_vital',
      routePattern: '/',
      name: 'LCP',
      value,
    })),
    { type: 'web_vital', routePattern: '/', name: 'CLS', value: 10.1 },
  ])('refuses invalid input %#', (event) => {
    expect(redactEventPayload(event)).toBeNull()
  })

  it('retains valid zeroes and rounds CLS without carrying arbitrary precision', () => {
    expect(
      redactEventPayload({ type: 'web_vital', routePattern: '/', name: 'CLS', value: 0 }),
    ).toEqual({ type: 'web_vital', routePattern: '/', name: 'CLS', value: 0 })
    expect(
      redactEventPayload({ type: 'web_vital', routePattern: '/', name: 'CLS', value: 0.123456 }),
    ).toEqual({ type: 'web_vital', routePattern: '/', name: 'CLS', value: 0.123 })
  })
})
