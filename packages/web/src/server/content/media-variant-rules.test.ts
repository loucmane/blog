import { describe, expect, it } from 'vitest'

import {
  mediaVariantContentType,
  mediaVariantFormats,
  mediaVariantFormatsFor,
} from './media-variant-rules'

describe('media variant rules', () => {
  it('offers AVIF, WebP, and the original type as a fallback, and no variants for a GIF', () => {
    expect(mediaVariantFormatsFor('image/jpeg')).toEqual(['avif', 'webp', 'jpeg'])
    for (const contentType of ['image/png', 'image/webp', 'image/avif']) {
      expect(mediaVariantFormatsFor(contentType), contentType).toEqual(['avif', 'webp', 'png'])
    }
    for (const contentType of ['image/gif', 'image/svg+xml', 'application/pdf', '']) {
      expect(mediaVariantFormatsFor(contentType), contentType).toEqual([])
    }
  })

  it('serves each format with its image media type', () => {
    expect(mediaVariantFormats.map(mediaVariantContentType)).toEqual([
      'image/avif',
      'image/webp',
      'image/jpeg',
      'image/png',
    ])
  })
})
