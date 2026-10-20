// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'

import { BaselineArticle } from '@/reader-directions/baseline/article'
import { defineReaderDirection } from '@/reader-directions/contract'
import { readerDirections } from '@/reader-directions/registry'
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

const sharedSizes = '(min-width: 768px) 42rem, 100vw'
const layouts = ['grid', 'diptych', 'carousel'] as const
type Slot = 'image' | (typeof layouts)[number]
type Inset = 'quote' | 'bulleted' | 'numbered' | 'checklist' | 'editorial'

/** An image block and a gallery of each layout, each image named for its place and slot. */
function everySlot(place: string): ArticleBlock[] {
  return [
    { kind: 'image', image: { ...image, alt: `${place} image` } },
    ...layouts.map((layout): ArticleBlock => ({
      kind: 'gallery',
      images: [{ ...image, alt: `${place} ${layout}` }],
      layout,
    })),
  ]
}

/** Every block that nests other blocks. */
const insets: Readonly<Record<Inset, (blocks: readonly ArticleBlock[]) => ArticleBlock>> = {
  quote: (blocks) => ({ kind: 'quote', blocks }),
  bulleted: (blocks) => ({ kind: 'bulleted-list', items: [{ blocks }] }),
  numbered: (blocks) => ({ kind: 'numbered-list', items: [{ blocks }], numbering: '1', start: 1 }),
  checklist: (blocks) => ({ kind: 'checklist', items: [{ blocks, checked: false }] }),
  editorial: (blocks) => ({ kind: 'editorial', blocks, variant: 'fact-box' }),
}

/** Every slot at the top level, inside each kind of inset, and two insets deep. */
const slotBody: readonly ArticleBlock[] = [
  ...everySlot('top'),
  ...Object.entries(insets).map(([place, inset]) => inset(everySlot(place))),
  insets.quote([insets.checklist(everySlot('deep'))]),
]
const places = ['top', ...Object.keys(insets), 'deep']

/** The sizes each picture carries, by its image's alt text, or every value if its elements differ. */
function sizesByAlt(markup: string) {
  return Object.fromEntries(
    [...documentFor(markup).querySelectorAll('picture')].map((picture) => {
      const sizes = [
        ...new Set(
          [...picture.querySelectorAll('source, img')].map((element) =>
            element.getAttribute('sizes'),
          ),
        ),
      ]
      return [
        picture.querySelector('img')?.getAttribute('alt'),
        sizes.length === 1 ? sizes[0] : sizes,
      ]
    }),
  )
}

/** The sizes every image in slotBody should carry, from its slot and whether it is nested. */
function expectedSizes(sizesFor: (slot: Slot, nested: boolean) => string | undefined) {
  return Object.fromEntries(
    places.flatMap((place) =>
      (['image', ...layouts] as const).map((slot) => [
        `${place} ${slot}`,
        sizesFor(slot, place !== 'top'),
      ]),
    ),
  )
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

it('sets each numbered list marker inline, so case survives any stylesheet', () => {
  const expected = {
    '1': 'decimal',
    a: 'lower-alpha',
    A: 'upper-alpha',
    i: 'lower-roman',
    I: 'upper-roman',
  } as const
  const lists: ArticleBlock[] = Object.keys(expected).map((numbering) => ({
    kind: 'numbered-list',
    start: 3,
    numbering: numbering as keyof typeof expected,
    items: [{ blocks: [{ kind: 'paragraph', content: [] }] }],
  }))
  const document = new DOMParser().parseFromString(
    renderToStaticMarkup(<ArticleBody blocks={lists} />),
    'text/html',
  )
  const rendered = [...document.querySelectorAll('ol')].map((list) => [
    list.getAttribute('type'),
    list.getAttribute('start'),
    list.style.listStyleType,
  ])
  expect(rendered).toEqual(
    Object.entries(expected).map(([numbering, marker]) => [numbering, '3', marker]),
  )
})

it('gives checklists and galleries, whose markers every direction removes, an explicit list role', () => {
  const blocks: ArticleBlock[] = [
    { kind: 'checklist', items: [{ blocks: [], checked: true }] },
    ...layouts.map((layout): ArticleBlock => ({ kind: 'gallery', images: [image], layout })),
    {
      kind: 'bulleted-list',
      items: [{ blocks: [{ kind: 'checklist', items: [{ blocks: [], checked: false }] }] }],
    },
    { kind: 'numbered-list', items: [{ blocks: [] }], numbering: '1', start: 1 },
  ]
  const document = documentFor(renderToStaticMarkup(<ArticleBody blocks={blocks} />))
  expect(
    [...document.querySelectorAll('ul, ol')].map((list) => [
      list.localName,
      list.getAttribute('data-block'),
      list.getAttribute('role'),
    ]),
  ).toEqual([
    ['ul', 'checklist', 'list'],
    ['ul', 'gallery', 'list'],
    ['ul', 'gallery', 'list'],
    ['ul', 'gallery', 'list'],
    // Bulleted and numbered lists keep their markers, so their native role is enough.
    ['ul', null, null],
    ['ul', 'checklist', 'list'],
    ['ol', null, null],
  ])
})

it('sizes every image as before, at any depth, when no layout or inset hint is set', () => {
  expect(sizesByAlt(renderToStaticMarkup(<ArticleBody blocks={slotBody} />))).toEqual(
    expectedSizes(() => sharedSizes),
  )
  expect(
    sizesByAlt(
      renderToStaticMarkup(
        <ArticleBody blocks={slotBody} imageSizes={{ body: '80vw', gallery: '40vw' }} />,
      ),
    ),
  ).toEqual(expectedSizes((slot) => (slot === 'image' ? '80vw' : '40vw')))
})

it('gives gallery items their layout hint, or gallery where it is unset, without an inset hint', () => {
  const sizes = { body: '80vw', carousel: '70vw', diptych: '45vw', gallery: '40vw', grid: '30vw' }
  expect(
    sizesByAlt(renderToStaticMarkup(<ArticleBody blocks={slotBody} imageSizes={sizes} />)),
  ).toEqual(expectedSizes((slot) => (slot === 'image' ? sizes.body : sizes[slot])))
  expect(
    sizesByAlt(
      renderToStaticMarkup(
        <ArticleBody blocks={slotBody} imageSizes={{ gallery: '40vw', grid: '30vw' }} />,
      ),
    ),
  ).toEqual(
    expectedSizes(
      (slot) => ({ carousel: '40vw', diptych: '40vw', grid: '30vw', image: sharedSizes })[slot],
    ),
  )
})

it('gives every nested image and gallery item the inset hint, however deep, and no top-level one', () => {
  const sizes = { body: '80vw', gallery: '40vw', grid: '30vw', inset: '60vw' }
  expect(
    sizesByAlt(renderToStaticMarkup(<ArticleBody blocks={slotBody} imageSizes={sizes} />)),
  ).toEqual(
    expectedSizes((slot, nested) =>
      nested ? '60vw' : { carousel: '40vw', diptych: '40vw', grid: '30vw', image: '80vw' }[slot],
    ),
  )
})

it('forwards a direction’s layout and inset hints through its registered Article view', () => {
  const direction = defineReaderDirection({
    Article: BaselineArticle,
    Home: () => null,
    Section: () => null,
    id: 'hinted',
    imageSizes: { carousel: '70vw', diptych: '45vw', grid: '30vw', inset: '60vw' },
    name: 'Hinted',
    thesis: 'Every slot has its own sizes.',
  })
  expect(
    sizesByAlt(renderToStaticMarkup(<direction.Article view={{ ...view, body: slotBody }} />)),
  ).toEqual(
    expectedSizes((slot, nested) =>
      nested
        ? '60vw'
        : { carousel: '70vw', diptych: '45vw', grid: '30vw', image: sharedSizes }[slot],
    ),
  )
})

it.each(readerDirections.directions.map((direction) => [direction.name, direction] as const))(
  'sizes every %s body image by its registered map, as before until it sets an optional hint',
  (_, direction) => {
    const { body, gallery, inset, ...layoutHints } = direction.imageSizes
    expect(
      sizesByAlt(renderToStaticMarkup(<direction.Article view={{ ...view, body: slotBody }} />)),
    ).toEqual(
      expectedSizes(
        (slot, nested) =>
          (nested ? inset : undefined) ??
          (slot === 'image' ? body : (layoutHints[slot] ?? gallery)),
      ),
    )
  },
)
