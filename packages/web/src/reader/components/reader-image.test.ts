import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { ReaderImage } from '../views'
import { ReaderImageView } from './reader-image'

const image: ReaderImage = {
  alt: 'Illustration of low winter sun on a pine floor',
  caption: null,
  credit: null,
  focalPoint: { x: 0.5, y: 0.4 },
  height: 900,
  mediaId: 'media-lab-winter-light',
  src: '/api/media/media-lab-winter-light',
  width: 1600,
}

describe('reader images', () => {
  it.each([
    ['with stored dimensions', image],
    ['without stored dimensions', { ...image, height: null, width: null }],
  ])(
    'load %s straight from the revocable media route, not the image optimizer',
    (_label, value) => {
      const markup = renderToStaticMarkup(
        createElement(ReaderImageView, { image: value, sizes: '100vw' }),
      )

      expect(markup).toContain('src="/api/media/media-lab-winter-light"')
      expect(markup).not.toContain('/_next/image')
      expect(markup).not.toMatch(/srcset/i)
    },
  )
})
