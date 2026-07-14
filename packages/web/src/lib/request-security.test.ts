import { describe, expect, it } from 'vitest'

import {
  createPreviewScope,
  normalizeStorySlug,
  previewScopeMatches,
  readBearerToken,
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
  })

  it('binds short-lived preview scope to one slug and trusted time', () => {
    const now = Date.parse('2026-07-14T12:00:00Z')
    const scope = createPreviewScope('private-framework-draft', 'preview-secret', now)

    expect(scope).not.toBeNull()
    expect(
      previewScopeMatches(scope ?? undefined, 'private-framework-draft', 'preview-secret', now),
    ).toBe(true)
    expect(
      previewScopeMatches(scope ?? undefined, 'framework-migration-proof', 'preview-secret', now),
    ).toBe(false)
    expect(
      previewScopeMatches(scope ?? undefined, 'private-framework-draft', 'wrong-secret', now),
    ).toBe(false)
    expect(
      previewScopeMatches(
        scope ?? undefined,
        'private-framework-draft',
        'preview-secret',
        now + 300_001,
      ),
    ).toBe(false)
    expect(previewScopeMatches('malformed', 'private-framework-draft', 'preview-secret', now)).toBe(
      false,
    )
  })
})
