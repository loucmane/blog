// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'

import { BaselineArticle } from '@/reader-directions/baseline/article'
import { defineReaderDirection } from '@/reader-directions/contract'
import type { ArticleBlock, ArticleView, ReaderImage } from '@/reader/views'

import { ArticleBody } from './article-body'

const image: ReaderImage = {
  alt: 'Winter light',
  animated: false,
  caption: 'A bright room',
  contentType: 'image/jpeg',
  credit: { name: 'Photographer', url: null },
  focalPoint: { x: 0.5, y: 0.5 },
  height: 1200,
  mediaId: 'room',
  src: '/api/media/room',
  width: 1800,
}
const body: readonly ArticleBlock[] = [
  { kind: 'image', image },
  { kind: 'gallery', images: [image], layout: 'diptych' },
  { kind: 'quote', blocks: [{ kind: 'image', image }] },
  {
    kind: 'numbered-list',
    start: 2,
    numbering: 'a',
    items: [
      {
        blocks: [
          {
            kind: 'editorial',
            variant: 'fact-box',
            blocks: [{ kind: 'gallery', images: [image], layout: 'grid' }],
          },
        ],
      },
    ],
  },
]
const view: ArticleView = {
  authorLinks: [],
  authors: [],
  body,
  dek: '',
  hero: null,
  href: '/stories/winter',
  navigation: { sections: [] },
  publishedAt: '2026-10-01T00:00:00Z',
  readingMinutes: 2,
  related: [],
  section: null,
  slug: 'winter',
  title: 'Winter',
  topics: [],
}

function documentFor(markup: string) {
  return new DOMParser().parseFromString(markup, 'text/html')
}

it('preserves default body and gallery sizes, responsive sources and captions', () => {
  const document = documentFor(renderToStaticMarkup(<ArticleBody blocks={body} />))
  expect(document.querySelectorAll('img')).toHaveLength(4)
  for (const element of document.querySelectorAll('img, source')) {
    expect(element.getAttribute('sizes')).toBe('(min-width: 768px) 42rem, 100vw')
    expect(element.getAttribute('srcset')).toContain('640w')
  }
  expect(document.querySelector('figcaption')?.textContent).toContain('A bright room')
})

it('forwards configured direction sizes through its Article view into nested img and source elements', () => {
  const definition = {
    Article: BaselineArticle,
    Home: () => null,
    Section: () => null,
    id: 'wide',
    name: 'Wide',
    thesis: 'Wide photographs.',
    imageSizes: { body: '(min-width: 60rem) 48rem, 100vw', gallery: '50vw' },
  }
  const direction = defineReaderDirection(definition)
  definition.Article = () => <p>Changed after registration</p>
  definition.imageSizes.body = '1px'
  const document = documentFor(renderToStaticMarkup(<direction.Article view={view} />))
  expect(document.querySelectorAll('img')).toHaveLength(4)
  for (const element of document.querySelectorAll('img, source')) {
    expect(element.getAttribute('sizes')).toBe(
      element.closest('[data-block="gallery"]') ? '50vw' : '(min-width: 60rem) 48rem, 100vw',
    )
  }
})

it('also accepts an explicit partial map without changing the gallery default', () => {
  const document = documentFor(
    renderToStaticMarkup(<ArticleBody blocks={body} imageSizes={{ body: '80vw' }} />),
  )
  expect(document.querySelector('img')?.getAttribute('sizes')).toBe('80vw')
  expect(document.querySelector('[data-block="gallery"] img')?.getAttribute('sizes')).toBe(
    '(min-width: 768px) 42rem, 100vw',
  )
})
