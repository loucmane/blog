import { describe, expect, it } from 'vitest'

import { ifNoneMatchIncludes, mediaEntityTag } from './media'

const checksum = 'c'.repeat(64)
const entityTag = `"${checksum}"`

describe('public media validators', () => {
  it('derives a strong entity tag only from a lowercase SHA-256 checksum', () => {
    expect(mediaEntityTag({ originalSha256: checksum })).toBe(entityTag)
    for (const malformed of [
      '',
      'C'.repeat(64),
      'c'.repeat(63),
      `${'c'.repeat(63)}"`,
      `${checksum}\n`,
    ]) {
      expect(mediaEntityTag({ originalSha256: malformed }), JSON.stringify(malformed)).toBeNull()
    }
  })

  it('matches If-None-Match with the weak comparison RFC 9110 requires', () => {
    for (const header of [
      entityTag,
      `W/${entityTag}`,
      `"an-older-image", W/"another",${entityTag}`,
      ' * ',
    ]) {
      expect(ifNoneMatchIncludes(header, entityTag), header).toBe(true)
    }
  })

  it('rejects absent, different, unquoted, and partial entity tags', () => {
    for (const header of [
      null,
      '',
      '"an-older-image"',
      checksum,
      `W/${checksum}`,
      `"${checksum.slice(1)}"`,
      `"${checksum}c"`,
    ]) {
      expect(ifNoneMatchIncludes(header, entityTag), String(header)).toBe(false)
    }
  })
})
