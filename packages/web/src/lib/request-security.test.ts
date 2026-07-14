import { describe, expect, it } from 'vitest'

import { normalizeStorySlug, readBearerToken, secureTokenMatches } from './request-security'

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
    expect(secureTokenMatches(null, 'task40-preview-fixture')).toBe(false)
    expect(secureTokenMatches('task40-preview-fixture', undefined)).toBe(false)
  })
})
