// @vitest-environment jsdom
import { within } from '@testing-library/dom'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { ArticleView, ReaderImage, StoryCard } from '@/reader/views'

import { storyColour } from './colours'
import { expressiveColourDirection as direction } from './index'

const section = { name: 'Rooms', slug: 'rooms', href: '/sections/rooms' } as const
const navigation = { sections: [section] }
const image: ReaderImage = {
  mediaId: 'room',
  src: '/api/media/room',
  width: 1200,
  height: 800,
  contentType: 'image/jpeg',
  animated: false,
  focalPoint: { x: 0.2, y: 0.7 },
  alt: 'Light across a room',
  caption: 'A supplied caption',
  credit: { name: 'A. Photographer', url: 'https://example.com/photography' },
}
const story: StoryCard = {
  slug: 'a-room',
  href: '/stories/a-room',
  title: 'A room to read in',
  dek: 'A quiet corner.',
  publishedAt: '2026-10-02T12:00:00Z',
  readingMinutes: 4,
  section,
  image,
}
const article: ArticleView = {
  ...story,
  hero: image,
  authorLinks: [
    { name: 'A. Writer', href: '/authors/a-writer' },
    { name: 'B. Writer', href: '/authors/b-writer' },
  ],
  authors: ['A. Writer', 'B. Writer'],
  topics: [{ name: 'Rooms', href: '/topics/rooms' }],
  related: [],
  body: [{ kind: 'paragraph', content: [{ kind: 'text', text: 'Body copy.', marks: [] }] }],
  navigation,
}
function markup(element: ReactNode) {
  const container = document.createElement('div')
  document.body.replaceChildren(container)
  container.innerHTML = renderToStaticMarkup(element)
  return { container, screen: within(container) }
}
function follows(first: Element, second: Element) {
  expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
}

describe('Expressive Colour article, author and topic pages (spec 2.4–2.6)', () => {
  it('keeps linked credits and dek inside the cover, and follows the reading order to topics', () => {
    const { container, screen } = markup(<direction.Article view={article} />)
    const band = container.querySelector<HTMLElement>('.ec-article-band')!
    expect(within(band).getByRole('heading', { level: 1 })).toHaveTextContent(article.title)
    expect(within(band).getByText(article.dek)).toBeTruthy()
    expect(band.querySelector('.ec-credits')).toHaveTextContent(
      'By A. Writer and B. Writer · October 2, 2026',
    )
    for (const author of article.authorLinks) {
      expect(within(band).getByRole('link', { name: author.name })).toHaveAttribute(
        'href',
        author.href,
      )
    }
    expect(band.querySelector('time')).toHaveAttribute('datetime', article.publishedAt)
    for (const name of ['Sections', 'Footer']) {
      expect(
        within(screen.getByRole('navigation', { name })).getByRole('link', { name: 'Rooms' }),
      ).toHaveAttribute('aria-current', 'true')
    }
    expect(within(band).getByRole('link', { name: 'Rooms' })).toHaveAttribute(
      'aria-current',
      'true',
    )
    const hero = container.querySelector('.ec-hero')!
    const body = container.querySelector('.ec-body')!
    const end = container.querySelector('.ec-end-mark')!
    const topics = screen.getByRole('navigation', { name: 'Topics' })
    follows(band, hero)
    follows(hero, body)
    follows(body, end)
    follows(end, topics)
    expect(end).toHaveAttribute('aria-hidden', 'true')
    expect(within(topics).getByRole('link', { name: 'Topic: Rooms' })).toHaveAttribute(
      'href',
      '/topics/rooms',
    )
    for (const role of ['banner', 'main', 'contentinfo'] as const) {
      // dom-accessibility-api treats nested headers as banners; HTML AAM and the
      // browser give an article header no landmark role. Check its context too.
      expect(
        screen.getAllByRole(role).filter((element) => !element.closest('article')),
      ).toHaveLength(1)
    }
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('uses linked authors first, falls back to supplied names and omits absent data', () => {
    const fallback = markup(
      <direction.Article
        view={{ ...article, authorLinks: [], authors: ['C. Writer', 'D. Writer'] }}
      />,
    )
    expect(fallback.container.querySelector('.ec-credits')).toHaveTextContent(
      'By C. Writer and D. Writer · October 2, 2026',
    )
    const { container, screen } = markup(
      <direction.Article
        view={{
          ...article,
          authorLinks: [],
          authors: [],
          topics: [],
          hero: null,
          section: null,
          dek: '',
        }}
      />,
    )
    expect(container.querySelector('.ec-credits')).toHaveTextContent('October 2, 2026')
    expect(container.querySelector('.ec-credits')).not.toHaveTextContent('By')
    expect(screen.queryByRole('navigation', { name: 'Topics' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Read next' })).toBeNull()
    expect(container.querySelector('.ec-hero, .ec-dek, link[as="image"]')).toBeNull()
    expect(container.querySelector('.ec-cover-motif .ec-motif')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(container.querySelector('.ec-article-meta')).toHaveTextContent('Story')
  })

  it.each([
    [1200, 800, 'landscape'],
    [1200, 1000, 'landscape'],
    [1000, 1000, 'cover'],
    [800, 1000, 'cover'],
    [null, null, 'landscape'],
  ] as const)(
    'places a %s × %s hero in the %s layout with one matching preload',
    (width, height, layout) => {
      const { container } = markup(
        <direction.Article view={{ ...article, hero: { ...image, width, height } }} />,
      )
      const hero = container.querySelector('.ec-hero')!
      expect(hero).toHaveClass(`ec-hero-${layout}`)
      expect(Boolean(hero.closest('.ec-article-band'))).toBe(layout === 'cover')
      expect(container.querySelectorAll('.ec-hero img')).toHaveLength(1)
      expect(container.querySelectorAll('link[rel="preload"][as="image"]')).toHaveLength(1)
      const img = hero.querySelector('img')!
      expect(img).toHaveAttribute('fetchpriority', 'high')
      expect(img).not.toHaveAttribute('loading', 'lazy')
      if (width !== null) {
        expect(container.querySelector('link[as="image"]')).toHaveAttribute(
          'imagesizes',
          img.getAttribute('sizes'),
        )
        expect(img.getAttribute('sizes')).toContain(layout === 'cover' ? '472px' : '1312px')
      }
      expect(hero).toHaveAttribute('style', 'object-position:20% 70%')
      expect(hero.querySelector('figcaption')).toHaveTextContent(image.caption!)
    },
  )

  it('steps down only titles over 80 characters and preserves the full title', () => {
    for (const length of [80, 81]) {
      const title = 'A'.repeat(length)
      const { screen } = markup(<direction.Article view={{ ...article, title }} />)
      const heading = screen.getByRole('heading', { level: 1, name: title })
      expect(heading.classList.contains('ec-title-long')).toBe(length > 80)
    }
  })

  it.each([0, 1, 3])(
    'renders %i related stories after the article, with unnumbered h3 cards',
    (count) => {
      const related = Array.from({ length: count }, (_, index) => ({
        ...story,
        slug: `related-${index}`,
        href: `/stories/related-${index}` as const,
        title: `Related room ${index}`,
      }))
      const { container, screen } = markup(<direction.Article view={{ ...article, related }} />)
      const region = screen.queryByRole('region', { name: 'Read next' })
      if (!count) {
        expect(region).toBeNull()
        return
      }
      follows(screen.getByRole('article'), region!)
      expect(region!.parentElement).toBe(screen.getByRole('main'))
      expect(within(region!).getByRole('heading', { name: 'Read next', level: 2 })).toBeTruthy()
      expect(within(region!).getAllByRole('heading', { level: 3 })).toHaveLength(count)
      expect(region!.querySelector('.ec-number')).toBeNull()
      for (const card of related) {
        expect(within(region!).getByRole('link', { name: card.title })).toHaveAttribute(
          'href',
          card.href,
        )
      }
      for (const img of region!.querySelectorAll('img')) {
        expect(img).toHaveAttribute('loading', 'lazy')
        expect(img).not.toHaveAttribute('fetchpriority')
      }
      expect(container.querySelectorAll('link[as="image"]')).toHaveLength(1)
    },
  )

  it('forwards the registered and explicit image sizes through nested shared blocks', () => {
    const view: ArticleView = {
      ...article,
      body: [
        {
          kind: 'editorial',
          variant: 'key-points',
          blocks: [
            { kind: 'image', image },
            { kind: 'gallery', layout: 'grid', images: [image] },
            { kind: 'gallery', layout: 'diptych', images: [image, image] },
            { kind: 'gallery', layout: 'carousel', images: [image] },
          ],
        },
      ],
    }
    expect(direction.imageSizes.body).toBe(
      '(min-width: 768px) 720px, (min-width: 534px) 94vw, calc(100vw - 2rem)',
    )
    expect(direction.imageSizes.gallery).toContain('(min-width: 1280px) 366px')
    for (const sizes of [direction.imageSizes, { body: '50vw', gallery: '25vw' }]) {
      const { container } = markup(<direction.Article view={view} imageSizes={sizes} />)
      for (const element of container.querySelectorAll(
        '.ec-body > section > figure :is(source, img)',
      ))
        expect(element).toHaveAttribute('sizes', sizes.body)
      for (const element of container.querySelectorAll('[data-block="gallery"] :is(source, img)'))
        expect(element).toHaveAttribute('sizes', sizes.gallery)
      expect(container.querySelectorAll('[data-block="gallery"]')).toHaveLength(3)
      for (const img of container.querySelectorAll('.ec-body img')) {
        expect(img).toHaveAttribute('loading', 'lazy')
        expect(img).not.toHaveAttribute('fetchpriority')
        expect(img).toHaveAttribute('alt', image.alt)
        expect(img).toHaveAttribute('width', String(image.width))
        expect(img).toHaveAttribute('height', String(image.height))
        expect(img.closest('figure')?.querySelector('figcaption')).toHaveTextContent(image.caption!)
      }
      expect(container.querySelectorAll('link[as="image"][href]')).toHaveLength(1)
    }
    expect(direction.tokens?.light['--ec-measure']).toBe('45rem')
    expect(direction.tokens?.light['--ec-feature']).toBe('56rem')
    expect(direction.tokens?.light['--ec-wide']).toBe('72rem')
  })

  for (const kind of ['Author', 'Topic'] as const) {
    it(`registers the ${kind.toLowerCase()} page with its own header, story list and empty state`, () => {
      const Page = direction[kind]
      for (const stories of [
        [],
        [story],
        Array.from({ length: 14 }, (_, index) => ({
          ...story,
          slug: `room-${index}`,
          href: `/stories/room-${index}` as const,
        })),
      ]) {
        const view = {
          name: 'Reading rooms',
          slug: 'reading-rooms',
          navigation,
          stories,
          href: '/authors/reading-rooms' as const,
          bio: null,
          description: null,
        }
        // The two registration slots have distinct href types but the same presentation contract.
        const element =
          kind === 'Author' ? (
            <direction.Author view={view} />
          ) : (
            <direction.Topic view={{ ...view, href: '/topics/reading-rooms' }} />
          )
        expect(Page).toBeTypeOf('function')
        const { container, screen } = markup(element)
        for (const role of ['banner', 'main', 'contentinfo'] as const)
          expect(screen.getAllByRole(role)).toHaveLength(1)
        expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
        expect(container.querySelector('.ec-section-header .ec-label')).toHaveTextContent(
          `${kind} · ${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`,
        )
        expect(container.querySelector('.ec-section-header .ec-dek')).toBeNull()
        const mark = container.querySelector(
          kind === 'Author' ? '.ec-author-mark' : '.ec-chip-ring',
        )
        expect(mark).toHaveAttribute('aria-hidden', 'true')
        expect(mark).toHaveAttribute('data-story-colour', storyColour(view.slug).name)
        expect(container.querySelectorAll('.ec-grid > li')).toHaveLength(stories.length)
        if (stories.length) {
          expect(container.querySelector('.ec-card')).toHaveAttribute('data-variant', 'lead')
          expect(container.querySelectorAll('.ec-spine-strip > span')).toHaveLength(stories.length)
          expect(container.querySelectorAll('link[as="image"]')).toHaveLength(1)
          if (stories.length === 14)
            expect(container.querySelector('.ec-card:last-child')).toHaveAttribute(
              'data-variant',
              'compact',
            )
        } else {
          expect(screen.getByText('No stories are published here yet.')).toBeTruthy()
          expect(container.querySelector('.ec-spine-strip, link[as="image"]')).toBeNull()
        }
      }
    })
  }
  it('shows supplied author bios and topic descriptions without inventing portraits', () => {
    const common = { name: 'Reader', slug: 'reader', navigation, stories: [] }
    const author = markup(
      <direction.Author
        view={{ ...common, href: '/authors/reader', bio: 'Supplied biography.' }}
      />,
    )
    expect(author.container.querySelector('.ec-dek')).toHaveTextContent('Supplied biography.')
    expect(author.container.querySelector('img')).toBeNull()
    const topic = markup(
      <direction.Topic
        view={{ ...common, href: '/topics/reader', description: 'Supplied description.' }}
      />,
    )
    expect(topic.container.querySelector('.ec-dek')).toHaveTextContent('Supplied description.')
  })
})
