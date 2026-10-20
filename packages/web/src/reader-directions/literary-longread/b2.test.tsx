// @vitest-environment jsdom
import { within } from '@testing-library/dom'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { ArticleBlock, ArticleView, ReaderImage, StoryCard } from '@/reader/views'

import { literaryLongreadDirection as direction } from './index'

const image: ReaderImage = {
  alt: 'An open book by the window',
  animated: false,
  caption: 'Afternoon reading.',
  contentType: 'image/jpeg',
  credit: { name: 'Library archive', url: 'https://example.org/archive' },
  focalPoint: { x: 0.2, y: 0.8 },
  height: 900,
  mediaId: 'book',
  src: '/api/media/book',
  width: 1200,
}
const paragraph: ArticleBlock = {
  kind: 'paragraph',
  content: [{ kind: 'text', text: 'The opening paragraph.', marks: [] }],
}
const stories: StoryCard[] = Array.from({ length: 4 }, (_, index) => ({
  title: `Related essay ${index}`,
  slug: `essay-${index}`,
  href: `/stories/essay-${index}`,
  dek: `The complete introduction to essay ${index}.`,
  image,
  publishedAt: '2026-10-19T12:00:00Z',
  readingMinutes: index + 2,
  section: null,
}))
const article: ArticleView = {
  authorLinks: [
    { name: 'A writer with a very long supplied name', href: '/authors/writer-one' },
    { name: 'Second writer', href: '/authors/writer-two' },
  ],
  authors: ['A writer with a very long supplied name', 'Second writer'],
  body: [paragraph],
  dek: 'An essay about the pleasure of reading.',
  hero: image,
  href: '/stories/reading',
  navigation: { sections: [] },
  publishedAt: '2026-10-19T12:00:00Z',
  readingMinutes: 8,
  related: stories,
  section: { href: '/sections/essays', name: 'Essays', slug: 'essays' },
  slug: 'reading',
  title: 'Reading at the window',
  topics: [{ name: 'Books and rooms', href: '/topics/books' }],
}
function markup(element: ReactNode) {
  const document = window.document.createElement('div')
  document.innerHTML = renderToStaticMarkup(element)
  return { document, screen: within(document) }
}

describe('Literary Long-read b2 presentation', () => {
  it('keeps linked credits, topics, related cards and the exit in article reading order', () => {
    const { document, screen } = markup(<direction.Article view={article} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Skip to article' })).toHaveAttribute(
      'href',
      '#ll-main',
    )
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1')
    for (const selector of ['.ll-byline', '.ll-authors']) {
      expect(
        [...document.querySelectorAll(`${selector} a`)].map((link) => [
          link.textContent,
          link.getAttribute('href'),
        ]),
      ).toEqual(article.authorLinks.map(({ name, href }) => [name, href]))
    }
    expect(
      [...document.querySelectorAll('.ll-article > *')].map((element) => element.className),
    ).toEqual(['ll-article-header', 'll-hero', 'll-body', 'll-end-matter'])
    expect(
      [...document.querySelector('.ll-end-matter')!.children].map((element) => element.className),
    ).toEqual(['ll-closing-rule', 'll-authors', 'll-topics', 'll-related', 'll-article-exit'])
    expect(document.querySelector('.ll-closing-rule')).toHaveAttribute('aria-hidden', 'true')
    expect(within(document.querySelector('.ll-topics')!).getByRole('list')).toHaveAttribute(
      'role',
      'list',
    )
    expect(document.querySelector('.ll-related-grid')).toHaveAttribute('role', 'list')
    expect(screen.getByRole('link', { name: 'Books and rooms' })).toHaveAttribute(
      'href',
      '/topics/books',
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Related stories' })).toBeTruthy()
    expect(
      [...document.querySelectorAll('.ll-related h3')].map((heading) => heading.textContent),
    ).toEqual(stories.slice(0, 3).map(({ title }) => title))
    expect(document.querySelectorAll('.ll-related img')).toHaveLength(3)
    for (const relatedImage of document.querySelectorAll('.ll-related img')) {
      expect(relatedImage).toHaveAttribute('loading', 'lazy')
      expect(relatedImage).toHaveAttribute(
        'sizes',
        '(min-width: 1344px) 25rem, (min-width: 1024px) calc(33.333333vw - 3rem), (min-width: 768px) calc(100vw - 3rem), calc(100vw - 2.5rem)',
      )
    }
    expect(within(document.querySelector('.ll-article-exit')!).getByRole('link')).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('omits absent modules and retains unlinked author names without inventing URLs', () => {
    for (const related of [[], stories.slice(0, 1)]) {
      const { document, screen } = markup(
        <direction.Article
          view={{
            ...article,
            authorLinks: [],
            authors: [],
            dek: '',
            hero: null,
            related,
            topics: [],
          }}
        />,
      )
      expect(document.querySelectorAll('.ll-authors, .ll-topics, .ll-hero, .ll-dek')).toHaveLength(
        0,
      )
      expect(document.querySelector('link[as="image"]')).toBeNull()
      expect(document.querySelector('.ll-byline')).not.toHaveTextContent('By ')
      expect(document.querySelectorAll('.ll-related')).toHaveLength(related.length ? 1 : 0)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(article.title)
    }
    const { document } = markup(
      <direction.Article view={{ ...article, authorLinks: [], authors: ['Unlinked writer'] }} />,
    )
    expect(document.querySelector('.ll-byline')).toHaveTextContent('By Unlinked writer')
    expect(document.querySelector('.ll-authors')).toHaveTextContent('Unlinked writer')
    expect(document.querySelectorAll('.ll-byline a, .ll-authors a')).toHaveLength(0)
    const mixed = markup(
      <direction.Article
        view={{ ...article, authors: [article.authors[0]!, 'Guest writer', article.authors[1]!] }}
      />,
    )
    expect(mixed.document.querySelector('.ll-byline')).toHaveTextContent(
      `By ${article.authors[0]}, Guest writer, ${article.authors[1]}`,
    )
    expect(mixed.document.querySelectorAll('.ll-byline a')).toHaveLength(article.authorLinks.length)
  })

  it('registers custom author/topic indexes, optional copy, correct heading levels and empty exits', () => {
    for (const kind of ['author', 'topic'] as const) {
      for (const suppliedStories of [[], stories.slice(0, 1), stories]) {
        for (const description of [null, 'Supplied introduction.\nA second line.']) {
          const view = {
            name: 'A long entity name that must wrap naturally',
            slug: 'books',
            navigation: article.navigation,
            stories: suppliedStories,
          }
          const { document, screen } = markup(
            kind === 'author' ? (
              <direction.Author view={{ ...view, href: '/authors/books', bio: description }} />
            ) : (
              <direction.Topic view={{ ...view, href: '/topics/books', description }} />
            ),
          )
          expect(document.querySelector('.ll-page')).toBeTruthy()
          expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
          if (suppliedStories.length > 0) {
            expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
              kind === 'author'
                ? 'Stories by A long entity name that must wrap naturally'
                : 'Stories',
            )
            expect(document.querySelector('.ll-index')).toHaveAttribute('role', 'list')
          } else {
            expect(screen.queryByRole('heading', { level: 2 })).toBeNull()
            expect(document.querySelector(`[aria-labelledby="ll-${kind}-stories"]`)).toBeNull()
          }
          expect(document.querySelectorAll('.ll-index h3')).toHaveLength(suppliedStories.length)
          expect(document.querySelectorAll('.ll-entity-description')).toHaveLength(
            description ? 1 : 0,
          )
          expect(document.querySelectorAll('link[as="image"]')).toHaveLength(
            suppliedStories.length ? 1 : 0,
          )
          if (suppliedStories.length === 0) {
            expect(
              screen.getByText(
                kind === 'author'
                  ? 'No published stories by this author yet.'
                  : 'No published stories on this topic yet.',
              ),
            ).toBeTruthy()
            expect(
              within(document.querySelector('.ll-section-empty')!).getByRole('link'),
            ).toHaveAttribute('href', '/')
          }
        }
      }
    }
  })

  it('does not promote later images on author or topic indexes', () => {
    for (const kind of ['author', 'topic']) {
      const view = {
        name: 'Writer',
        slug: 'writer',
        navigation: article.navigation,
        stories: [{ ...stories[0]!, image: null }, ...stories.slice(1)],
      }
      const { document } = markup(
        kind === 'author' ? (
          <direction.Author view={{ ...view, bio: null, href: '/authors/writer' }} />
        ) : (
          <direction.Topic view={{ ...view, description: null, href: '/topics/writer' }} />
        ),
      )
      expect(document.querySelector('link[as="image"]')).toBeNull()
      for (const img of document.querySelectorAll('main img')) {
        expect(img).toHaveAttribute('loading', 'lazy')
        expect(img).toHaveAttribute(
          'sizes',
          '(min-width: 1024px) 10rem, (min-width: 768px) 6rem, 5rem',
        )
      }
    }
  })

  it('forwards registered sizes through all shared blocks and preserves their semantic variants', () => {
    const blocks: ArticleBlock[] = [
      {
        kind: 'paragraph',
        content: [
          ...(['bold', 'italic', 'code', 'strike', 'underline'] as const).map((kind) => ({
            kind: 'text' as const,
            text: kind,
            marks: [{ kind }],
          })),
          {
            kind: 'text',
            text: 'linked',
            marks: [{ kind: 'link', href: 'https://example.org/essay' }],
          },
          { kind: 'break' },
          { kind: 'text', text: 'strong italic', marks: [{ kind: 'bold' }, { kind: 'italic' }] },
        ],
      },
      ...([2, 3, 4, 5, 6] as const).map((level) => ({
        kind: 'heading' as const,
        level,
        content: [{ kind: 'text' as const, marks: [], text: `Level ${level}` }],
      })),
      { kind: 'quote', blocks: [paragraph, { kind: 'image', image }] },
      {
        kind: 'pull-quote',
        attribution: 'The writer',
        content: [{ kind: 'text', marks: [], text: 'Words to remember.' }],
      },
      {
        kind: 'bulleted-list',
        items: [
          { blocks: [paragraph, { kind: 'bulleted-list', items: [{ blocks: [paragraph] }] }] },
        ],
      },
      ...(['1', 'a', 'A', 'i', 'I'] as const).map((numbering) => ({
        kind: 'numbered-list' as const,
        numbering,
        start: 4,
        items: [{ blocks: [paragraph] }],
      })),
      {
        kind: 'checklist',
        items: [
          { checked: true, blocks: [paragraph] },
          { checked: false, blocks: [paragraph] },
        ],
      },
      { kind: 'image', image },
      ...(['grid', 'diptych', 'carousel'] as const).map((layout) => ({
        kind: 'gallery' as const,
        layout,
        images: [image, image],
      })),
      ...(['note', 'tip', 'warning'] as const).map((variant) => ({
        kind: 'callout' as const,
        variant,
        label: variant,
        content: [{ kind: 'text' as const, text: 'Supplied note.', marks: [] }],
      })),
      { kind: 'code', language: null, text: 'A long code line '.repeat(50) },
      { kind: 'divider' },
      ...(['vimeo', 'youtube'] as const).map((provider) => ({
        kind: 'embed' as const,
        provider,
        fallback: 'Follow the supplied link.',
        title: provider,
        url: 'https://example.org/video',
      })),
      ...(['fact-box', 'key-points', 'methodology', 'related-stories'] as const).map((variant) => ({
        kind: 'editorial' as const,
        variant,
        blocks: [paragraph, { kind: 'image' as const, image }],
      })),
    ]
    const { document } = markup(<direction.Article view={{ ...article, body: blocks }} />)
    const body = document.querySelector('.ll-body')!
    for (const selector of [
      'strong',
      'em',
      'code',
      's',
      'u',
      'a',
      'br',
      'em strong',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul ul',
      'pre',
      'hr',
    ]) {
      expect(body.querySelector(selector), selector).toBeTruthy()
    }
    for (const list of body.querySelectorAll('ol')) expect(list).toHaveAttribute('start', '4')
    expect([...body.querySelectorAll('ol')].map((ol) => ol.type)).toEqual(['1', 'a', 'A', 'i', 'I'])
    expect(body.querySelector('[data-block="checklist"]')).toHaveTextContent('Done:')
    expect(body.querySelector('[data-block="checklist"]')).toHaveTextContent('Not done:')
    expect(body.querySelector('iframe, input')).toBeNull()
    expect(body.querySelectorAll('[data-block="editorial"]')).toHaveLength(4)
    expect(body.querySelectorAll('[data-block="callout"]')).toHaveLength(3)
    expect(body.querySelectorAll('[data-block="gallery"]')).toHaveLength(3)
    expect(direction.imageSizes?.body).toBe(
      '(min-width: 768px) 42rem, (min-width: 712px) 42rem, calc(100vw - 2.5rem)',
    )
    for (const img of body.querySelectorAll('img')) {
      expect(img).toHaveAttribute('loading', 'lazy')
      const expected = img.closest('[data-block="gallery"]')
        ? direction.imageSizes?.gallery
        : direction.imageSizes?.body
      expect(img).toHaveAttribute('sizes', expected)
      for (const source of img.closest('picture')!.querySelectorAll('source')) {
        expect(source).toHaveAttribute('sizes', expected)
      }
    }
    expect(document.querySelector('.ll-hero img')).toHaveAttribute(
      'sizes',
      '(min-width: 1056px) 60rem, (min-width: 1024px) calc(100vw - 6rem), (min-width: 768px) calc(100vw - 3rem), calc(100vw - 2.5rem)',
    )
  })
})
