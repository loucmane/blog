// @vitest-environment jsdom
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { ReaderImage } from '../views'
import { ReaderImageView } from './reader-image'

const image: ReaderImage = {
  alt: 'Illustration of low winter sun on a pine floor',
  caption: null,
  contentType: 'image/png',
  credit: null,
  focalPoint: { x: 0.5, y: 0.4 },
  height: 900,
  mediaId: 'media-lab-winter-light',
  src: '/api/media/media-lab-winter-light',
  width: 1600,
}

const sizes = '(min-width: 896px) 56rem, 100vw'

function render(value: ReaderImage, preload = false) {
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(
    createElement(ReaderImageView, { image: value, preload, sizes }),
  )
  return container
}

function srcSet(format: string, candidates: readonly (readonly [number, number])[]) {
  return candidates
    .map(
      ([width, descriptor]) =>
        `/api/media/media-lab-winter-light?w=${width}&fm=${format} ${descriptor}w`,
    )
    .join(', ')
}

const cappedAt1600 = [
  [320, 320],
  [640, 640],
  [960, 960],
  [1280, 1280],
  [1920, 1600],
] as const
const everyWidth = [
  [320, 320],
  [640, 640],
  [960, 960],
  [1280, 1280],
  [1920, 1920],
] as const

describe('reader images', () => {
  it('renders AVIF and WebP sources and a fallback over the allowlisted widths, with the stored size', () => {
    const container = render(image)
    const picture = container.querySelector('picture')
    const sources = [...(picture?.querySelectorAll(':scope > source') ?? [])]
    const img = picture?.querySelector(':scope > img')

    expect(sources.map((source) => source.getAttribute('type'))).toEqual([
      'image/avif',
      'image/webp',
    ])
    expect(sources.map((source) => source.getAttribute('srcset'))).toEqual([
      srcSet('avif', cappedAt1600),
      srcSet('webp', cappedAt1600),
    ])
    expect(sources.map((source) => source.getAttribute('sizes'))).toEqual([sizes, sizes])
    expect(img?.getAttribute('srcset')).toBe(srcSet('png', cappedAt1600))
    expect(img?.getAttribute('src')).toBe('/api/media/media-lab-winter-light?w=1920&fm=png')
    expect(img?.getAttribute('sizes')).toBe(sizes)
    expect(img?.getAttribute('width')).toBe('1600')
    expect(img?.getAttribute('height')).toBe('900')
    expect(img?.getAttribute('alt')).toBe(image.alt)
    expect(img?.getAttribute('decoding')).toBe('async')
  })

  it('fills a 3:2 frame with every allowlisted width when the original has no stored size', () => {
    const container = render({ ...image, height: null, width: null })
    const frame = container.firstElementChild
    const img = container.querySelector('picture > img')

    expect(frame?.className).toContain('aspect-[3/2]')
    expect(
      container.querySelector('picture > source[type="image/avif"]')?.getAttribute('srcset'),
    ).toBe(srcSet('avif', everyWidth))
    expect(img?.getAttribute('srcset')).toBe(srcSet('png', everyWidth))
    expect(img?.hasAttribute('width')).toBe(false)
    expect(img?.hasAttribute('height')).toBe(false)
    expect(img?.getAttribute('style')).toContain('object-position:50% 40%')
  })

  it('falls back to JPEG for a JPEG original', () => {
    const img = render({ ...image, contentType: 'image/jpeg' }).querySelector('picture > img')

    expect(img?.getAttribute('src')).toBe('/api/media/media-lab-winter-light?w=1920&fm=jpeg')
    expect(img?.getAttribute('srcset')).toBe(srcSet('jpeg', cappedAt1600))
  })

  it('loads a GIF straight from its original, which may be animated', () => {
    const container = render({ ...image, contentType: 'image/gif' })
    const img = container.querySelector('img')

    expect(container.querySelectorAll('source')).toHaveLength(0)
    expect(img?.getAttribute('src')).toBe('/api/media/media-lab-winter-light')
    expect(img?.hasAttribute('srcset')).toBe(false)
    expect(img?.getAttribute('width')).toBe('1600')
  })

  it('loads a lead image at once at high priority, and lazy-loads the others', () => {
    const lead = render(image, true)
    const leadImg = lead.querySelector('picture > img')

    expect(leadImg?.getAttribute('fetchpriority')).toBe('high')
    expect(leadImg?.hasAttribute('loading')).toBe(false)
    // React never preloads an image inside <picture> by itself, and the view adds no preload hint
    // that the production HTML would not carry.
    expect(lead.querySelector('link')).toBeNull()

    const other = render(image)
    expect(other.querySelector('picture > img')?.getAttribute('loading')).toBe('lazy')
    expect(other.querySelector('picture > img')?.hasAttribute('fetchpriority')).toBe(false)
    expect(other.querySelector('link')).toBeNull()
  })

  it('never routes reader images through the image optimizer', () => {
    for (const value of [
      image,
      { ...image, height: null, width: null },
      { ...image, contentType: 'image/gif' },
    ]) {
      expect(render(value, true).innerHTML).not.toContain('/_next/image')
    }
  })
})
