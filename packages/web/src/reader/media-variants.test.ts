import { describe, expect, it } from 'vitest'

import { mediaVariantFormats, mediaVariantWidths } from '@/server/content/media-variant-rules'

import {
  mediaVariantCandidates,
  mediaVariantPath,
  parseMediaRequest,
  readerImageSources,
} from './media-variants'

function query(search: string) {
  return parseMediaRequest(new URLSearchParams(search))
}

describe('public media variant requests', () => {
  it('reads an empty query as the original', () => {
    expect(query('')).toEqual({ kind: 'original' })
  })

  it('reads every allowlisted width and format, in either order', () => {
    for (const width of mediaVariantWidths) {
      for (const format of mediaVariantFormats) {
        expect(query(`w=${width}&fm=${format}`), `${width} ${format}`).toEqual({
          kind: 'variant',
          variant: { format, width },
        })
      }
    }
    expect(query('fm=webp&w=320')).toEqual({
      kind: 'variant',
      variant: { format: 'webp', width: 320 },
    })
  })

  it('rejects any other width, format, or parameter', () => {
    for (const search of [
      'w=500&fm=avif',
      'w=0&fm=avif',
      'w=-320&fm=avif',
      'w=320.0&fm=avif',
      'w=0320&fm=avif',
      'w=%2B320&fm=avif',
      'w=%20320&fm=avif',
      'w=1e3&fm=avif',
      'w=3200&fm=avif',
      'w=abc&fm=avif',
      'w=&fm=avif',
      'w=320&fm=gif',
      'w=320&fm=jpg',
      'w=320&fm=AVIF',
      'w=320&fm=svg',
      'w=320&fm=',
      'w=320',
      'fm=webp',
      'w=320&w=640&fm=webp',
      'w=320&fm=webp&fm=avif',
      'w=320&fm=webp&q=90',
      'width=320&format=webp',
      'download',
    ]) {
      expect(query(search), search).toEqual({ kind: 'invalid' })
    }
  })

  it('builds variant paths from the encoded id and the allowlisted values only', () => {
    expect(mediaVariantPath('media-lab-winter-light', { format: 'avif', width: 640 })).toBe(
      '/api/media/media-lab-winter-light?w=640&fm=avif',
    )
    expect(mediaVariantPath('media a/b', { format: 'png', width: 1920 })).toBe(
      '/api/media/media%20a%2Fb?w=1920&fm=png',
    )
  })
})

describe('reader image candidates', () => {
  it('lists every width when the original width is unknown or larger than the widest variant', () => {
    for (const originalWidth of [null, 1920, 4000]) {
      expect(mediaVariantCandidates(originalWidth), String(originalWidth)).toEqual(
        mediaVariantWidths.map((width) => ({ descriptor: width, width })),
      )
    }
  })

  it('stops at the first width that reaches the original, described at the original width', () => {
    expect(mediaVariantCandidates(1600)).toEqual([
      { descriptor: 320, width: 320 },
      { descriptor: 640, width: 640 },
      { descriptor: 960, width: 960 },
      { descriptor: 1280, width: 1280 },
      { descriptor: 1600, width: 1920 },
    ])
    expect(mediaVariantCandidates(1280)).toEqual([
      { descriptor: 320, width: 320 },
      { descriptor: 640, width: 640 },
      { descriptor: 960, width: 960 },
      { descriptor: 1280, width: 1280 },
    ])
    expect(mediaVariantCandidates(100)).toEqual([{ descriptor: 100, width: 320 }])
  })

  it('builds AVIF and WebP sources plus a fallback in the original type', () => {
    const srcSet = (format: string) =>
      [
        `/api/media/media-wide?w=320&fm=${format} 320w`,
        `/api/media/media-wide?w=640&fm=${format} 640w`,
        `/api/media/media-wide?w=960&fm=${format} 960w`,
        `/api/media/media-wide?w=1280&fm=${format} 1280w`,
        `/api/media/media-wide?w=1920&fm=${format} 1600w`,
      ].join(', ')

    expect(
      readerImageSources({ contentType: 'image/png', mediaId: 'media-wide', width: 1600 }),
    ).toEqual({
      fallback: { src: '/api/media/media-wide?w=1920&fm=png', srcSet: srcSet('png') },
      sources: [
        { srcSet: srcSet('avif'), type: 'image/avif' },
        { srcSet: srcSet('webp'), type: 'image/webp' },
      ],
    })
    expect(
      readerImageSources({ contentType: 'image/jpeg', mediaId: 'media-photo', width: null })
        ?.fallback,
    ).toEqual({
      src: '/api/media/media-photo?w=1920&fm=jpeg',
      srcSet: mediaVariantWidths
        .map((width) => `/api/media/media-photo?w=${width}&fm=jpeg ${width}w`)
        .join(', '),
    })
  })

  it('leaves a GIF to its original, which may be animated', () => {
    expect(
      readerImageSources({ contentType: 'image/gif', mediaId: 'media-anim', width: 800 }),
    ).toBeNull()
  })
})
