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
  it('lists every width for an original at least as wide as the widest variant', () => {
    for (const originalWidth of [1920, 4000]) {
      expect(mediaVariantCandidates(originalWidth), String(originalWidth)).toEqual(
        mediaVariantWidths.map((width) => ({ descriptor: width, width })),
      )
    }
  })

  it('lists no width for an original of unknown width, since none could be described truthfully', () => {
    expect(mediaVariantCandidates(null)).toEqual([])
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
    expect(mediaVariantCandidates(800)).toEqual([
      { descriptor: 320, width: 320 },
      { descriptor: 640, width: 640 },
      { descriptor: 800, width: 960 },
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
      readerImageSources({
        animated: false,
        contentType: 'image/png',
        height: 900,
        mediaId: 'media-wide',
        width: 1600,
      }),
    ).toEqual({
      fallback: { src: '/api/media/media-wide?w=1920&fm=png', srcSet: srcSet('png') },
      sources: [
        { srcSet: srcSet('avif'), type: 'image/avif' },
        { srcSet: srcSet('webp'), type: 'image/webp' },
      ],
    })
    expect(
      readerImageSources({
        animated: false,
        contentType: 'image/jpeg',
        height: 600,
        mediaId: 'media-photo',
        width: 800,
      })?.fallback,
    ).toEqual({
      src: '/api/media/media-photo?w=960&fm=jpeg',
      srcSet: [
        '/api/media/media-photo?w=320&fm=jpeg 320w',
        '/api/media/media-photo?w=640&fm=jpeg 640w',
        '/api/media/media-photo?w=960&fm=jpeg 800w',
      ].join(', '),
    })
  })

  it('leaves an image to its original when a variant could lose frames, be too large, or claim a width it lacks', () => {
    const still = {
      animated: false,
      contentType: 'image/png',
      height: 600,
      mediaId: 'media-still',
      width: 800,
    }

    for (const [label, image] of [
      ['a GIF, which may be animated', { ...still, contentType: 'image/gif' }],
      ['an animated WebP', { ...still, animated: true, contentType: 'image/webp' }],
      ['an animated PNG', { ...still, animated: true }],
      ['an image above the pixel limit', { ...still, height: 9000, width: 9000 }],
      ['an image of unknown size', { ...still, height: null, width: null }],
      ['an image never measured', { ...still, animated: null, height: null, width: null }],
    ] as const) {
      expect(readerImageSources(image), label).toBeNull()
    }
  })
})
