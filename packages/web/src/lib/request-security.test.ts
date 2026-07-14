import { describe, expect, it } from 'vitest'

import {
  configuredSecretIsStrong,
  configuredSecretsAreDistinct,
  createPreviewScope,
  createPreviewToken,
  maxPreviewRequestBytes,
  normalizeStorySlug,
  previewScopeCookieOptions,
  previewScopeMatches,
  previewTokenMatches,
  readBoundedJson,
  readBearerToken,
  requestOriginMatches,
  secureTokenMatches,
} from './request-security'

describe('framework request security', () => {
  it.each(['framework-migration-proof', 'private-framework-draft', 'story-2'])(
    'accepts a normalized story slug: %s',
    (slug) => {
      expect(normalizeStorySlug(slug)).toBe(slug)
    },
  )

  it.each([null, undefined, '', '../secret', '/story', 'Story', 'story--draft', 'story?next=/'])(
    'rejects an unsafe story slug: %s',
    (slug) => {
      expect(normalizeStorySlug(slug)).toBeNull()
    },
  )

  it('rejects slugs that exceed the cache-tag safety bound', () => {
    expect(normalizeStorySlug('a'.repeat(121))).toBeNull()
  })

  it('accepts only a single strict bearer token', () => {
    expect(readBearerToken('Bearer task40-revalidation-fixture')).toBe(
      'task40-revalidation-fixture',
    )
    expect(readBearerToken('bearer task40-revalidation-fixture')).toBeNull()
    expect(readBearerToken('Bearer token with spaces')).toBeNull()
    expect(readBearerToken(null)).toBeNull()
  })

  it('fails closed for missing or unequal secrets', () => {
    expect(secureTokenMatches('task40-preview-fixture', 'task40-preview-fixture')).toBe(true)
    expect(secureTokenMatches('task40-preview-fixture', 'different-preview-fixture')).toBe(false)
    expect(secureTokenMatches('equal-length-token-a', 'equal-length-token-b')).toBe(false)
    expect(secureTokenMatches(null, 'task40-preview-fixture')).toBe(false)
    expect(secureTokenMatches('task40-preview-fixture', undefined)).toBe(false)
    expect(configuredSecretIsStrong('short-secret')).toBe(false)
    expect(configuredSecretIsStrong('a'.repeat(32))).toBe(true)
    expect(configuredSecretIsStrong('🔐'.repeat(16))).toBe(true)
    expect(configuredSecretIsStrong('a'.repeat(513))).toBe(false)
    expect(configuredSecretsAreDistinct('token-secret', 'cookie-secret')).toBe(true)
    expect(configuredSecretsAreDistinct('reused-secret', 'reused-secret')).toBe(false)
  })

  it('binds short-lived preview credentials and browser scope to one slug and purpose', () => {
    const now = Date.parse('2026-07-14T12:00:00Z')
    const tokenSecret = 'task40-token-secret-with-at-least-32-bytes'
    const cookieSecret = 'task40-cookie-secret-with-at-least-32-bytes'
    const token = createPreviewToken('private-framework-draft', tokenSecret, now)
    const scope = createPreviewScope('private-framework-draft', cookieSecret, now)

    expect(token).not.toBeNull()
    expect(scope).not.toBeNull()
    expect(
      previewTokenMatches(token ?? undefined, 'private-framework-draft', tokenSecret, now),
    ).toBe(true)
    expect(
      previewTokenMatches(token ?? undefined, 'framework-migration-proof', tokenSecret, now),
    ).toBe(false)
    expect(
      previewTokenMatches(
        token ?? undefined,
        'private-framework-draft',
        tokenSecret,
        now + 299_999,
      ),
    ).toBe(true)
    expect(
      previewTokenMatches(
        token ?? undefined,
        'private-framework-draft',
        tokenSecret,
        now + 300_000,
      ),
    ).toBe(false)
    expect(
      previewScopeMatches(scope ?? undefined, 'private-framework-draft', cookieSecret, now),
    ).toBe(true)
    expect(
      previewScopeMatches(scope ?? undefined, 'framework-migration-proof', cookieSecret, now),
    ).toBe(false)
    expect(
      previewScopeMatches(scope ?? undefined, 'private-framework-draft', 'wrong-secret', now),
    ).toBe(false)
    expect(
      previewScopeMatches(
        scope ?? undefined,
        'private-framework-draft',
        cookieSecret,
        now + 300_001,
      ),
    ).toBe(false)
    expect(previewScopeMatches('malformed', 'private-framework-draft', cookieSecret, now)).toBe(
      false,
    )
    expect(
      previewScopeMatches(token ?? undefined, 'private-framework-draft', tokenSecret, now),
    ).toBe(false)
  })

  it('requires an exact same-origin preview action and derives hardened cookie options', () => {
    const httpsSite = new URL('https://magazine.example')
    const httpSite = new URL('http://localhost:3100')

    expect(requestOriginMatches('https://magazine.example', httpsSite, 'same-origin')).toBe(true)
    expect(requestOriginMatches(null, httpsSite, 'same-origin')).toBe(true)
    expect(requestOriginMatches('null', httpsSite, 'same-origin')).toBe(false)
    expect(requestOriginMatches('https://attacker.example', httpsSite, 'cross-site')).toBe(false)
    expect(requestOriginMatches('null', httpsSite, 'cross-site')).toBe(false)
    expect(requestOriginMatches('https://magazine.example/path', httpsSite, 'same-origin')).toBe(
      false,
    )
    expect(requestOriginMatches(null, httpsSite, null)).toBe(false)
    expect(previewScopeCookieOptions(httpsSite)).toEqual({
      httpOnly: true,
      maxAge: 300,
      path: '/preview',
      sameSite: 'strict',
      secure: true,
    })
    expect(previewScopeCookieOptions(httpSite).secure).toBe(false)
  })

  it('parses only bounded JSON without trusting a declared body size', async () => {
    const valid = await readBoundedJson(
      new Request('https://magazine.example/api/preview', {
        body: JSON.stringify({ slug: 'private-framework-draft', token: 'fixture' }),
        method: 'POST',
      }),
    )
    const oversized = await readBoundedJson(
      new Request('https://magazine.example/api/preview', {
        body: JSON.stringify({ token: 'x'.repeat(maxPreviewRequestBytes) }),
        method: 'POST',
      }),
    )
    const falseLength = await readBoundedJson(
      new Request('https://magazine.example/api/preview', {
        body: JSON.stringify({ token: 'x'.repeat(maxPreviewRequestBytes) }),
        headers: { 'content-length': '10' },
        method: 'POST',
      }),
    )

    expect(valid).toEqual({
      ok: true,
      value: { slug: 'private-framework-draft', token: 'fixture' },
    })
    expect(oversized).toEqual({ ok: false, reason: 'too-large' })
    expect(falseLength).toEqual({ ok: false, reason: 'too-large' })
  })
})
