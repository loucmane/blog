// @vitest-environment jsdom
import { within } from '@testing-library/dom'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import { beforeAll, describe, expect, it } from 'vitest'

import { readArticleView, readAuthorView, readHomeView, readTopicView } from '@/reader/read-model'
import type { ArticleView, AuthorView, HomeView, TopicView } from '@/reader/views'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { InMemoryOriginalObjectStore } from '@/server/content/media'
import { labAuthors, labStories, labTopics } from '@/server/lab/north-house'
import { labStorySlug, seedLabContent } from '@/server/lab/seed'

import { cinematicFeatureDirection as direction } from './index'

function markup(element: ReactNode) {
  const document = window.document.implementation.createHTMLDocument()
  document.body.innerHTML = renderToStaticMarkup(element)
  return { document, screen: within(document.body) }
}

describe('Cinematic Feature b2 supplied views', () => {
  let article: ArticleView
  let author: AuthorView
  let topic: TopicView
  let home: HomeView

  beforeAll(async () => {
    const repository = new InMemoryContentRepository()
    await seedLabContent({ objects: new InMemoryOriginalObjectStore(), repository })
    const source = { mediaAvailable: true, repository }
    home = await readHomeView(source)
    const fullStory = labStories.find(({ id }) => id === 'article-lab-long-table')!
    article = (await readArticleView(source, labStorySlug(fullStory)))!
    author = (await readAuthorView(source, labAuthors[0]!.slug))!
    topic = (await readTopicView(source, labTopics[0]!.slug))!
  })

  it('keeps the article heading before the hero and preserves linked bylines and topics', () => {
    const { document, screen } = markup(<direction.Article view={article} />)
    const opening = document.querySelector('.cf-article-hero')!
    expect(opening.firstElementChild).toHaveClass('cf-article-heading')
    expect(document.querySelectorAll('h1')).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(article.title)
    for (const link of article.authorLinks)
      expect(
        within(document.querySelector('.cf-credits')!).getByRole('link', { name: link.name }),
      ).toHaveAttribute('href', link.href)
    const topics = screen.getByRole('region', { name: 'Topics' })
    expect(
      within(topics)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(article.topics.map(({ href }) => href))
    expect(document.querySelector('link[as="image"]')).toHaveAttribute(
      'media',
      '(min-width: 1024px)',
    )
    expect(document.querySelector('a a')).toBeNull()
    expect(document.querySelector('.cf-article-return a')).toHaveAttribute(
      'href',
      article.section!.href,
    )
  })

  it('omits absent modules, keeps name-only authors, and has no empty hero stage or preload', () => {
    const view = {
      ...article,
      hero: null,
      authorLinks: [],
      authors: ['A. Writer', 'B. Writer'],
      topics: [],
      related: [],
      section: null,
    }
    const { document, screen } = markup(<direction.Article view={view} />)
    expect(document.querySelector('.cf-credits')).toHaveTextContent('Words by A. Writer, B. Writer')
    expect(document.querySelector('.cf-credits a, .cf-hero, link[as="image"]')).toBeNull()
    expect(screen.queryByRole('region', { name: 'Topics' })).toBeNull()
    expect(document.querySelector('.cf-related')).toBeNull()
    expect(document.querySelector('.cf-article-return a')).toHaveTextContent('All stories')
    expect(document.querySelector('.cf-article-return a')).toHaveAttribute('href', '/')
    const anonymous = markup(<direction.Article view={{ ...view, authors: [] }} />)
    expect(anonymous.document.querySelector('.cf-credits')).not.toHaveTextContent('Words by')
  })

  it('keeps up to three distinct related links in supplied order, excluding the current story', () => {
    const all = [home.lead!, ...home.recent]
    const current = all.find(({ href }) => href === article.href)!
    const candidates = all.filter(({ href }) => href !== article.href)
    const related = [current, candidates[0]!, ...candidates]
    const { document } = markup(
      <direction.Article
        view={{
          ...article,
          related,
          body: [...article.body, { kind: 'editorial', variant: 'related-stories', blocks: [] }],
        }}
      />,
    )
    const region = within(document.querySelector('.cf-article-end')!).getByRole('region', {
      name: 'Related stories',
    })
    expect(
      within(region)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(candidates.slice(0, 3).map(({ title }) => title))
    for (const image of region.querySelectorAll('img')) {
      expect(image).toHaveAttribute('loading', 'lazy')
      expect(image.getAttribute('sizes')).toContain('(min-width: 1536px) 458.67px')
    }
    const body = document.querySelector('.cf-body')!
    expect(
      body.querySelector('[data-block="editorial"][data-variant="related-stories"]'),
    ).toBeTruthy()
    const onlyCurrent = markup(<direction.Article view={{ ...article, related: [current] }} />)
    expect(onlyCurrent.document.querySelector('.cf-related')).toBeNull()
  })

  it('forwards declared and explicitly overridden body/gallery sizes to the shared renderer', () => {
    expect(direction.imageSizes).toEqual({
      body: '(min-width: 768px) 42rem, 100vw',
      gallery: '(min-width: 768px) 42rem, 100vw',
    })
    const { document } = markup(
      <direction.Article view={article} imageSizes={{ body: '73vw', gallery: '37vw' }} />,
    )
    const gallery = document.querySelector('.cf-body [data-block="gallery"] img')!
    const body = document.querySelector('.cf-body > figure img')!
    expect(body).toHaveAttribute('sizes', '73vw')
    expect(gallery).toHaveAttribute('sizes', '37vw')
    for (const image of document.querySelectorAll('.cf-body img'))
      expect(image).toHaveAttribute('loading', 'lazy')
  })

  it('implements author and topic collections with one identity h1 and labelled story modules', () => {
    for (const [element, view, label, moduleName] of [
      [
        <direction.Author key="author" view={{ ...author, bio: 'Supplied biography.' }} />,
        author,
        'Author',
        `Stories by ${author.name}`,
      ],
      [
        <direction.Topic key="topic" view={{ ...topic, description: 'Supplied description.' }} />,
        topic,
        'Topic',
        `Stories about ${topic.name}`,
      ],
    ] as const) {
      const { document, screen } = markup(element)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(view.name)
      expect(document.querySelector('.cf-section-header .cf-label')).toHaveTextContent(label)
      expect(screen.getAllByRole('banner')).toHaveLength(1)
      expect(screen.getAllByRole('main')).toHaveLength(1)
      expect(screen.getAllByRole('contentinfo')).toHaveLength(1)
      const region = screen.getByRole('region', { name: moduleName })
      expect(
        within(region)
          .getAllByRole('heading', { level: 3 })
          .map((heading) => heading.textContent),
      ).toEqual(view.stories.map(({ title }) => title))
      expect(document.querySelectorAll('.cf-feature')).toHaveLength(1)
      expect(document.querySelectorAll('link[as="image"]')).toHaveLength(
        view.stories[0]?.image ? 1 : 0,
      )
    }
  })

  it('keeps empty author/topic identities without placeholder biographies, images, or counts', () => {
    for (const [element, message] of [
      [
        <direction.Author key="author" view={{ ...author, bio: null, stories: [] }} />,
        'No published stories by this author yet.',
      ],
      [
        <direction.Topic key="topic" view={{ ...topic, description: null, stories: [] }} />,
        'No stories have been published about this topic yet.',
      ],
    ] as const) {
      const { document, screen } = markup(element)
      expect(screen.getByText(message)).toBeTruthy()
      expect(
        document.querySelector('img, link[as="image"], .cf-author-bio, .cf-section-header .cf-dek'),
      ).toBeNull()
      expect(
        within(screen.getByRole('main')).getByRole('link', { name: 'All stories' }),
      ).toHaveAttribute('href', '/')
    }
    const { document } = markup(
      <direction.Author
        view={{ ...author, stories: [{ ...home.lead!, image: null }, ...home.recent] }}
      />,
    )
    expect(document.querySelector('link[as="image"]')).toBeNull()
    for (const image of document.querySelectorAll('main img'))
      expect(image).toHaveAttribute('loading', 'lazy')
  })

  it('retains all heading levels, ordered-list types, nested galleries and combined emphasis', () => {
    const paragraph = {
      kind: 'paragraph' as const,
      content: [
        {
          kind: 'text' as const,
          text: 'Emphasis',
          marks: [
            { kind: 'bold' as const },
            { kind: 'italic' as const },
            { kind: 'strike' as const },
            { kind: 'underline' as const },
            { kind: 'link' as const, href: 'https://example.com/source' },
          ],
        },
      ],
    }
    const { document } = markup(
      <direction.Article
        view={{
          ...article,
          body: [
            paragraph,
            ...([2, 3, 4, 5, 6] as const).map((level) => ({
              kind: 'heading' as const,
              level,
              content: [{ kind: 'text' as const, text: `Heading ${level}`, marks: [] }],
            })),
            ...(['1', 'a', 'A', 'i', 'I'] as const).map((numbering) => ({
              kind: 'numbered-list' as const,
              numbering,
              start: 3,
              items: [{ blocks: [paragraph] }],
            })),
            {
              kind: 'quote',
              blocks: [
                { kind: 'gallery', layout: 'diptych', images: [article.hero!, article.hero!] },
              ],
            },
            ...(['fact-box', 'key-points', 'methodology', 'related-stories'] as const).map(
              (variant) => ({
                kind: 'editorial' as const,
                variant,
                blocks: [paragraph],
              }),
            ),
            {
              kind: 'paragraph',
              content: [{ kind: 'text', text: 'Inline code', marks: [{ kind: 'code' }] }],
            },
          ],
        }}
      />,
    )
    const body = document.querySelector('.cf-body')!
    for (const tag of ['h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 's', 'u', 'a', 'code'])
      expect(body.querySelector(tag), tag).toBeTruthy()
    expect([...body.querySelectorAll('ol')].map((list) => [list.type, list.start])).toEqual(
      ['1', 'a', 'A', 'i', 'I'].map((type) => [type, 3]),
    )
    expect(body.querySelectorAll('[data-block="editorial"]')).toHaveLength(4)
    expect(body.querySelectorAll('blockquote [data-block="gallery"] img')).toHaveLength(2)
    expect(body.querySelector('strong em, em strong')).toBeTruthy()
  })
})
