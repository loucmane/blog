import { describe, expect, it } from 'vitest'

import { ifNoneMatchIncludes, mediaEntityTag, mediaVariantEntityTag } from './media'

const checksum = 'c'.repeat(64)
const entityTag = `"${checksum}"`
const malformedChecksums = [
  '',
  'C'.repeat(64),
  'c'.repeat(63),
  `${'c'.repeat(63)}"`,
  `${checksum}\n`,
]

describe('public media validators', () => {
  it('derives a strong entity tag only from a lowercase SHA-256 checksum', () => {
    expect(mediaEntityTag({ originalSha256: checksum })).toBe(entityTag)
    for (const malformed of malformedChecksums) {
      expect(mediaEntityTag({ originalSha256: malformed }), JSON.stringify(malformed)).toBeNull()
    }
  })

  it('derives a variant entity tag from the original checksum, the width, and the format', () => {
    const variantTag = mediaVariantEntityTag(
      { originalSha256: checksum },
      { format: 'avif', width: 640 },
    )

    expect(variantTag).toBe(`"${checksum}-v1-640.avif"`)
    expect(variantTag).not.toBe(entityTag)
    expect(
      new Set([
        variantTag,
        mediaVariantEntityTag({ originalSha256: checksum }, { format: 'webp', width: 640 }),
        mediaVariantEntityTag({ originalSha256: checksum }, { format: 'avif', width: 960 }),
        mediaVariantEntityTag({ originalSha256: 'd'.repeat(64) }, { format: 'avif', width: 640 }),
      ]).size,
    ).toBe(4)
    for (const malformed of malformedChecksums) {
      expect(
        mediaVariantEntityTag({ originalSha256: malformed }, { format: 'avif', width: 640 }),
        JSON.stringify(malformed),
      ).toBeNull()
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
