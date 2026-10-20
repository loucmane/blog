// @vitest-environment jsdom
import { within } from '@testing-library/dom'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'

import { defaultReaderImageSizes } from '@/reader/components/image-sizes'
import { formatPublishedDate, formatReadingTime } from '@/reader/format'
import { readArticleView } from '@/reader/read-model'
import type { ArticleBlock, ArticleView, ReaderImage } from '@/reader/views'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { InMemoryOriginalObjectStore } from '@/server/content/media'
import { labStories } from '@/server/lab/north-house'
import { labStorySlug, seedLabContent } from '@/server/lab/seed'

import { articleImageSizes, heroSizes, SwissArticle, uprightHeroSizes } from './article'
import { swissIndexDirection } from './index'
import { cardSizes } from './story-card'

function markup(element: ReactNode) {
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(element)
  return { document: container, screen: within(container) }
}

function label(element: Element) {
  return [element.localName, ...element.classList].join('.')
}

function follows(first: Element, second: Element) {
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING)
}

/** Every link in `root` that points to `href`. */
function linksTo(root: Element, href: string) {
  return [...root.querySelectorAll('a')].filter((link) => link.getAttribute('href') === href)
}

/** Each term of a description list with its values: their text and link target, if any. */
function rows(list: Element) {
  return [...list.children].map((group) => ({
    term: group.querySelector('dt')?.textContent,
    values: [...group.querySelectorAll('dd')].map((value) => ({
      href: value.querySelector('a')?.getAttribute('href') ?? null,
      text: value.textContent,
    })),
  }))
}

/** The spec's orientation rule: upright below 1.2 times the height; no stored size is landscape. */
function isUpright(image: ReaderImage) {
  return image.width !== null && image.height !== null && image.width < 1.2 * image.height
}

/** Every image the story shows as a figure, in document order: the hero, then the body's. */
function figures(view: ArticleView) {
  const visit = (blocks: readonly ArticleBlock[]): ReaderImage[] =>
    blocks.flatMap((block) => {
      if (block.kind === 'image') return [block.image]
      if (block.kind === 'gallery') return [...block.images]
      if (block.kind === 'quote' || block.kind === 'editorial') return visit(block.blocks)
      if ('items' in block) return block.items.flatMap((item) => visit(item.blocks))
      return []
    })
  return [...(view.hero ? [view.hero] : []), ...visit(view.body)]
}

function credits(view: ArticleView) {
  return [...new Set(figures(view).flatMap(({ credit }) => (credit ? [credit.name] : [])))]
}

function storyCount(count: number) {
  return `${count} ${count === 1 ? 'story' : 'stories'}`
}

describe('Swiss Index article pages with real published North House content', () => {
  const articles = new Map<string, ArticleView>()
  let views: ArticleView[]

  beforeAll(async () => {
    const repository = new InMemoryContentRepository()
    await seedLabContent({ objects: new InMemoryOriginalObjectStore(), repository })
    const source = { mediaAvailable: true, repository }
    for (const story of labStories) {
      articles.set(story.id, (await readArticleView(source, labStorySlug(story)))!)
    }
    views = [...articles.values()]
  })

  it('sets one h1 per story, before the rail, at the long title size above 80 characters', () => {
    expect(views.some((view) => [...view.title].length > 80)).toBe(true)
    for (const view of views) {
      const { document, screen } = markup(<SwissArticle view={view} />)
      const titles = screen.getAllByRole('heading', { level: 1 })
      expect(titles).toHaveLength(1)
      expect(titles[0]).toHaveTextContent(view.title)
      expect(titles[0]!.closest('header')).toHaveClass('si-article-header')
      expect(titles[0]!.classList.contains('si-title-long')).toBe([...view.title].length > 80)
      expect(follows(titles[0]!, document.querySelector('.si-rail')!)).toBe(true)
      if (view.dek)
        expect(document.querySelector('.si-article-header .si-dek')).toHaveTextContent(view.dek)
    }
  })

  it('reads header, rail, hero, body and end matter in DOM order, then related stories after the article', () => {
    for (const view of views) {
      const { document } = markup(<SwissArticle view={view} />)
      const main = document.querySelector('main')!
      expect([...main.children].map(label), view.slug).toEqual([
        'article.si-article',
        ...(view.related.length ? ['section.si-related'] : []),
      ])
      const article = main.querySelector('article')!
      expect([...article.children].map(label), view.slug).toEqual([
        'header.si-article-header',
        'dl.si-rail',
        ...(view.hero
          ? [isUpright(view.hero) ? 'div.si-hero.si-hero-upright' : 'div.si-hero']
          : []),
        'div.si-body',
        ...(view.topics.length || credits(view).length ? ['dl.si-end'] : []),
      ])
    }
    // Without a hero the body follows the rail, and nothing is preloaded.
    const view = views.find((candidate) => candidate.hero)!
    const { document } = markup(<SwissArticle view={{ ...view, hero: null }} />)
    expect([...document.querySelector('article')!.children].map(label).slice(0, 3)).toEqual([
      'header.si-article-header',
      'dl.si-rail',
      'div.si-body',
    ])
    expect(document.querySelector('link[as="image"]')).toBeNull()
  })

  it('lists the section, one linked author per value, the date and the reading time in the rail', () => {
    expect(views.some((view) => view.authorLinks.length === 1)).toBe(true)
    expect(views.some((view) => view.authorLinks.length > 1)).toBe(true)
    for (const view of views) {
      const { document } = markup(<SwissArticle view={view} />)
      const rail = document.querySelector('.si-rail')!
      expect(rows(rail), view.slug).toEqual([
        ...(view.section
          ? [{ term: 'Section', values: [{ href: view.section.href, text: view.section.name }] }]
          : []),
        ...(view.authorLinks.length
          ? [
              {
                term: view.authorLinks.length === 1 ? 'Author' : 'Authors',
                values: view.authorLinks.map(({ href, name }) => ({ href, text: name })),
              },
            ]
          : []),
        {
          term: 'Published',
          values: [{ href: null, text: formatPublishedDate(view.publishedAt) }],
        },
        {
          term: 'Reading time',
          values: [{ href: null, text: formatReadingTime(view.readingMinutes) }],
        },
      ])
      expect(rail.querySelector('time')).toHaveAttribute('datetime', view.publishedAt)
      expect(document.textContent).not.toMatch(/Lead photo|Words/)
    }
    // An uncredited story has no author row, and nothing is invented for it.
    const { document } = markup(
      <SwissArticle view={{ ...views[0]!, authorLinks: [], authors: [] }} />,
    )
    expect(rows(document.querySelector('.si-rail')!).map(({ term }) => term)).not.toContain(
      'Author',
    )
    expect(rows(document.querySelector('.si-rail')!).map(({ term }) => term)).not.toContain(
      'Authors',
    )
  })

  it('sets landscape heroes across columns 2 to 4 and upright ones beside their caption, each with its own sizes', () => {
    const heroes = views.filter((view) => view.hero)
    expect(heroes.some((view) => isUpright(view.hero!))).toBe(true)
    expect(heroes.some((view) => !isUpright(view.hero!))).toBe(true)
    for (const view of heroes) {
      const sizes = isUpright(view.hero!) ? uprightHeroSizes : heroSizes
      const { document } = markup(<SwissArticle view={view} />)
      const hero = document.querySelector('.si-hero')!
      expect(hero.classList.contains('si-hero-upright'), view.slug).toBe(isUpright(view.hero!))
      expect(hero.querySelector('img')).toHaveAttribute('sizes', sizes)
      expect(hero.querySelector('img')).toHaveAttribute('fetchpriority', 'high')
      for (const source of hero.querySelectorAll('source'))
        expect(source).toHaveAttribute('sizes', sizes)
      const preloads = document.querySelectorAll('link[rel="preload"][as="image"]')
      expect(preloads).toHaveLength(1)
      expect(preloads[0]).toHaveAttribute('imagesizes', sizes)
      expect(hero.querySelector('figcaption')).toHaveTextContent(view.hero!.caption!)
    }
    // Width at least 1.2 times the height is landscape; an image without stored dimensions too.
    const view = heroes[0]!
    for (const [width, height, upright] of [
      [1200, 1000, false],
      [1199, 1000, true],
      [1000, 1000, true],
      [null, null, false],
    ] as const) {
      const { document } = markup(
        <SwissArticle view={{ ...view, hero: { ...view.hero!, height, width } }} />,
      )
      expect(document.querySelector('.si-hero')!.classList.contains('si-hero-upright')).toBe(
        upright,
      )
    }
  })

  it('closes the story with its topics and each image credit once, in figure order, as plain text', () => {
    expect(views.some((view) => view.topics.length > 1)).toBe(true)
    for (const view of views) {
      const { document } = markup(<SwissArticle view={view} />)
      const end = document.querySelector('.si-end')
      const expected = [
        ...(view.topics.length
          ? [
              {
                term: 'Topics',
                values: view.topics.map(({ href, name }) => ({ href, text: name })),
              },
            ]
          : []),
        ...(credits(view).length
          ? [{ term: 'Image credits', values: credits(view).map((text) => ({ href: null, text })) }]
          : []),
      ]
      if (expected.length) expect(rows(end!), view.slug).toEqual(expected)
      else expect(end, view.slug).toBeNull()
    }

    const view = views.find((candidate) => candidate.hero)!
    const image = (name: string, url: string | null = null): ReaderImage => ({
      ...view.hero!,
      credit: { name, url },
    })
    const paragraph: ArticleBlock = {
      content: [{ kind: 'text', marks: [], text: 'Text.' }],
      kind: 'paragraph',
    }
    const body: ArticleBlock[] = [
      { image: image('Ada Photo', 'https://example.com/ada'), kind: 'image' },
      paragraph,
      { images: [image('Bo Studio'), image('Ada Photo')], kind: 'gallery', layout: 'grid' },
      { blocks: [{ image: image('Cy Archive'), kind: 'image' }], kind: 'quote' },
      {
        blocks: [{ image: image('Di Lens'), kind: 'image' }],
        kind: 'editorial',
        variant: 'fact-box',
      },
      { items: [{ blocks: [{ image: image('Ed Frame'), kind: 'image' }] }], kind: 'bulleted-list' },
      { image: { ...view.hero!, credit: null }, kind: 'image' },
    ]
    const credited = markup(
      <SwissArticle view={{ ...view, body, hero: image('Hero Credit'), topics: [] }} />,
    )
    const end = credited.document.querySelector('.si-end')!
    expect(rows(end)).toEqual([
      {
        term: 'Image credits',
        values: ['Hero Credit', 'Ada Photo', 'Bo Studio', 'Cy Archive', 'Di Lens', 'Ed Frame'].map(
          (text) => ({ href: null, text }),
        ),
      },
    ])
    expect(end.querySelector('a')).toBeNull()
    // The caption keeps the credit's link.
    expect(
      linksTo(credited.document.querySelector('.si-body')!, 'https://example.com/ada'),
    ).toHaveLength(1)

    // A row shows only with content; without either row there is no end matter.
    const bare = markup(
      <SwissArticle view={{ ...view, body: [paragraph], hero: null, topics: [] }} />,
    )
    expect(bare.document.querySelector('.si-end')).toBeNull()
  })

  it('numbers related stories as plates from 01 with h3 titles, one story link each, lazily loaded', () => {
    const related = views.filter((view) => view.related.length)
    expect(related.length).toBeGreaterThan(0)
    for (const view of related) {
      const { document, screen } = markup(<SwissArticle view={view} />)
      const heading = screen.getByRole('heading', { level: 2, name: 'Related stories' })
      const region = heading.closest('section')!
      expect(region).toHaveClass('si-related')
      expect(region).toHaveAttribute('aria-labelledby', heading.id)
      expect(within(region).getByText(storyCount(view.related.length))).toBeTruthy()
      const list = within(region).getByRole('list')
      expect(list.tagName).toBe('OL')
      expect(list).toHaveClass('si-plates')
      expect(list).toHaveAttribute('start', '1')
      expect(list).toHaveAttribute('role', 'list')
      const plates = [...list.children] as HTMLElement[]
      expect(plates).toHaveLength(view.related.length)
      plates.forEach((plate, index) => {
        const story = view.related[index]!
        const title = within(plate).getByRole('heading', { level: 3 })
        expect(title).toHaveTextContent(story.title)
        expect(within(title).getByRole('link')).toHaveAttribute('href', story.href)
        expect(linksTo(plate, story.href)).toHaveLength(1)
        const number = plate.querySelector('.si-number')!
        expect(number).toHaveTextContent(String(index + 1).padStart(2, '0'))
        expect(number).toHaveAttribute('aria-hidden', 'true')
        if (story.image) {
          const image = plate.querySelector('img')!
          expect(image).toHaveAttribute('sizes', cardSizes)
          expect(image).toHaveAttribute('loading', 'lazy')
          expect(image).not.toHaveAttribute('fetchpriority')
        }
      })
      expect(region.querySelectorAll('h2')).toHaveLength(1)
      expect(region.querySelector('.si-state')).toBeNull()
      expect(
        document.querySelectorAll('link[rel="preload"][as="image"]').length,
      ).toBeLessThanOrEqual(1)
    }
    const { screen } = markup(<SwissArticle view={{ ...related[0]!, related: [] }} />)
    expect(screen.queryByRole('heading', { name: 'Related stories' })).toBeNull()
  })

  it('sizes body figures and galleries for this direction through the registered imageSizes map', () => {
    expect(swissIndexDirection.imageSizes).toEqual(articleImageSizes)
    expect(articleImageSizes.body).not.toBe(defaultReaderImageSizes.body)
    expect(articleImageSizes.gallery).not.toBe(defaultReaderImageSizes.gallery)
    const view = views.find(
      (candidate) =>
        candidate.hero &&
        candidate.body.some(({ kind }) => kind === 'image') &&
        candidate.body.some(({ kind }) => kind === 'gallery'),
    )!
    const { Article } = swissIndexDirection
    const { document } = markup(<Article view={view} />)
    const body = document.querySelector('.si-body')!
    const galleryImages = [...body.querySelectorAll('[data-block="gallery"] img')]
    const figureImages = [...body.querySelectorAll('img')].filter(
      (image) => !galleryImages.includes(image),
    )
    expect(galleryImages.length).toBeGreaterThan(0)
    expect(figureImages.length).toBeGreaterThan(0)
    for (const image of figureImages) expect(image).toHaveAttribute('sizes', articleImageSizes.body)
    for (const image of galleryImages)
      expect(image).toHaveAttribute('sizes', articleImageSizes.gallery)
    expect(document.querySelector('.si-hero img')).toHaveAttribute(
      'sizes',
      isUpright(view.hero!) ? uprightHeroSizes : heroSizes,
    )
  })
})
