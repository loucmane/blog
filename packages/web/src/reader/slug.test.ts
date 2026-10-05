import { describe, expect, it } from 'vitest'

import { assertValidSlug } from '@/server/content/domain'

import { maxReaderSlugLength, normalizeReaderSlug } from './slug'

describe('reader slug boundary', () => {
  it('accepts every slug the content model can store', () => {
    const longest = assertValidSlug('a'.repeat(maxReaderSlugLength))

    expect(normalizeReaderSlug('ab')).toBe('ab')
    expect(normalizeReaderSlug('the-quiet-architecture-of-winter-light')).toBe(
      'the-quiet-architecture-of-winter-light',
    )
    expect(normalizeReaderSlug('a'.repeat(121))).toBe('a'.repeat(121))
    expect(normalizeReaderSlug(longest)).toBe(longest)
  })

  it('rejects malformed, oversized, and non-string slugs before any lookup', () => {
    for (const value of [
      'a',
      'a'.repeat(maxReaderSlugLength + 1),
      'Upper-case',
      'trailing-',
      '-leading',
      'double--hyphen',
      '../private',
      'with space',
      42,
      null,
    ]) {
      expect(normalizeReaderSlug(value), String(value)).toBeNull()
    }
  })
})
