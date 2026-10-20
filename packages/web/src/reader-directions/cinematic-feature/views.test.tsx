// @vitest-environment jsdom
import { within } from '@testing-library/dom'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import { beforeAll, describe, expect, it } from 'vitest'

import { siteName } from '@/reader/components/site-header'
import { readArticleView, readHomeView, readSectionView } from '@/reader/read-model'
import type { ArticleView, HomeView, SectionView } from '@/reader/views'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { InMemoryOriginalObjectStore } from '@/server/content/media'
import { labStories } from '@/server/lab/north-house'
import { labStorySlug, seedLabContent } from '@/server/lab/seed'

import { contrastRatio } from '../contrast'
import { CinematicArticle } from './article'
import { CinematicHome } from './home'
import { CinematicSection } from './section'
import { styles } from './styles'
import { tokens } from './tokens'

function markup(element: ReactNode) {
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(element)
  return { document: container, screen: within(container) }
}

describe('Cinematic Feature with published North House content', () => {
  let home: HomeView
  let section: SectionView
  const articles = new Map<string, ArticleView>()

  beforeAll(async () => {
    const repository = new InMemoryContentRepository()
    await seedLabContent({ objects: new InMemoryOriginalObjectStore(), repository })
    const source = { mediaAvailable: true, repository }
    home = await readHomeView(source)
    section = (await readSectionView(source, 'interiors'))!
    for (const story of labStories)
      articles.set(story.id, (await readArticleView(source, labStorySlug(story)))!)
  })

  it('meets AA on opaque heading panels and paper surfaces in both themes', () => {
    for (const palette of [tokens.light, { ...tokens.light, ...tokens.dark }]) {
      for (const [text, background] of tokens.textPairs)
        expect(contrastRatio(palette[text], palette[background])).toBeGreaterThanOrEqual(4.5)
    }
    expect(styles).not.toContain('linear-gradient')
    const longest = [...articles.values()].reduce((first, second) =>
      first.title.length >= second.title.length ? first : second,
    )
    const { document } = markup(<CinematicArticle view={longest} />)
    for (const selector of ['.cf-story-meta', '.cf-title', '.cf-dek', '.cf-credits'])
      expect(document.querySelector(selector)?.closest('.cf-article-panel')).toBeTruthy()
  })

  it('shows the lead, two secondary stories and all remaining rows once in supplied order', () => {
    const { document, screen } = markup(<CinematicHome view={home} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(siteName)
    for (const story of [home.lead!, ...home.recent]) {
      expect(screen.getByRole('heading', { name: story.title })).toBeTruthy()
      expect(
        screen.getAllByRole('link').some((link) => link.getAttribute('href') === story.href),
      ).toBe(true)
    }
    expect(
      [...document.querySelectorAll('.cf-secondary h3')].map((heading) => heading.textContent),
    ).toEqual(home.recent.slice(0, 2).map(({ title }) => title))
    expect(
      [...document.querySelectorAll('.cf-latest h3')].map((heading) => heading.textContent),
    ).toEqual(home.recent.slice(2).map(({ title }) => title))
    expect(screen.getByRole('heading', { name: 'More stories', level: 2 })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Latest stories', level: 2 })).toBeTruthy()
    expect(document.querySelector('.cf-number, .cf-next')).toBeNull()
    expect(
      screen.getByRole('link', { name: `Read the story: ${home.lead!.title}` }),
    ).toHaveAttribute('href', home.lead!.href)
    expect(document.querySelector('.cf-cover-image img')?.getAttribute('alt')).toBe(
      home.lead!.image!.alt,
    )
  })

  it('handles no posts and a lone lead without an image', () => {
    const empty = markup(
      <CinematicHome view={{ navigation: { sections: [] }, lead: null, recent: [] }} />,
    )
    expect(empty.screen.getByRole('heading', { name: 'No stories yet' })).toBeTruthy()
    expect(empty.document.querySelector('img, link[as="image"]')).toBeNull()
    const solo = markup(
      <CinematicHome view={{ ...home, lead: { ...home.lead!, image: null }, recent: [] }} />,
    )
    expect(solo.document.querySelector('.cf-hero-text')).toBeTruthy()
    expect(
      solo.document.querySelector('.cf-secondary, .cf-latest, img, link[as="image"]'),
    ).toBeNull()
  })

  it('omits empty home modules and keeps whole deks for any number of recent stories', () => {
    for (const count of [0, 1, 2, home.recent.length]) {
      const recent = home.recent.slice(0, count)
      const { document, screen } = markup(<CinematicHome view={{ ...home, recent }} />)
      expect(document.querySelectorAll('.cf-secondary li')).toHaveLength(Math.min(2, count))
      expect(document.querySelectorAll('.cf-latest li')).toHaveLength(Math.max(0, count - 2))
      expect(screen.queryByRole('heading', { name: 'More stories' }) !== null).toBe(count > 0)
      expect(screen.queryByRole('heading', { name: 'Latest stories' }) !== null).toBe(count > 2)
      for (const story of recent) {
        const heading = screen.getByRole('heading', { name: story.title, level: 3 })
        expect(heading.closest('li')).toHaveTextContent(story.dek)
      }
    }
  })

  it('preserves full image captions and separate credit links, with credit-only compact thumbnails', () => {
    const image = {
      ...home.lead!.image!,
      caption: 'A supplied photograph caption.',
      credit: { name: 'Supplied photographer', url: 'https://example.com/photographer' },
      focalPoint: { x: 0.2, y: 0.8 },
    }
    const recent = home.recent.map((story) => ({ ...story, image }))
    for (const element of [
      <CinematicHome key="home" view={{ ...home, lead: { ...home.lead!, image }, recent }} />,
      <CinematicSection key="section" view={{ ...section, stories: recent }} />,
    ]) {
      const { document } = markup(element)
      for (const img of document.querySelectorAll('main img')) {
        const figure = img.closest('figure')!
        expect(figure, 'each supplied image keeps its figure and credit').not.toBeNull()
        expect(img).toHaveAttribute('alt', image.alt)
        const caption = figure.querySelector('figcaption')!
        expect(caption).toHaveTextContent(image.credit.name)
        if (figure.closest('.cf-row')) expect(caption).not.toHaveTextContent(image.caption)
        else expect(caption).toHaveTextContent(image.caption)
        expect(within(caption).getByRole('link')).toHaveAttribute('href', image.credit.url)
        expect(caption.closest('a')).toBeNull()
        const frame = img.closest<HTMLElement>('[style]')!
        expect(frame.style.objectPosition).toBe('20% 80%')
      }
      expect(document.querySelector('a a')).toBeNull()
    }
  })

  it('renders image-free cards without placeholders and omits absent captions', () => {
    const { document } = markup(
      <CinematicHome
        view={{
          ...home,
          lead: { ...home.lead!, image: { ...home.lead!.image!, caption: null, credit: null } },
          recent: home.recent.map((story) => ({ ...story, image: null })),
        }}
      />,
    )
    expect(document.querySelector('figcaption')).toBeNull()
    expect(document.querySelectorAll('main img')).toHaveLength(1)
    expect(document.querySelectorAll('.cf-card-text')).toHaveLength(home.recent.length)
  })

  it('keeps a labelled shell, focusable skip target and one page heading with long navigation', () => {
    const navigation = {
      sections: Array.from({ length: 12 }, (_, i) => ({
        ...section,
        name: `Section ${i} with a long name`,
        slug: `section-${i}`,
      })),
    }
    for (const element of [
      <CinematicHome key="home" view={{ ...home, navigation }} />,
      <CinematicSection key="section" view={{ ...section, navigation }} />,
    ]) {
      const { document, screen } = markup(element)
      expect(screen.getAllByRole('banner')).toHaveLength(1)
      expect(screen.getAllByRole('main')).toHaveLength(1)
      expect(screen.getAllByRole('contentinfo')).toHaveLength(1)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      expect(
        within(screen.getByRole('navigation', { name: 'Sections' })).getAllByRole('link'),
      ).toHaveLength(13)
      expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute(
        'href',
        '#cf-main',
      )
      expect(document.querySelector('#cf-main')).toHaveAttribute('tabindex', '-1')
    }
  })

  it('preloads exactly the lead with matching sources and dimensions, leaving later images lazy', () => {
    const article = articles.get('article-lab-long-table')!
    for (const element of [
      <CinematicHome key="home" view={home} />,
      <CinematicArticle key="article" view={article} />,
      <CinematicSection key="section" view={section} />,
    ]) {
      const { document } = markup(element)
      const image = document.querySelector('main img')!
      const source = document.querySelector('main picture source')!
      const preloads = document.querySelectorAll('link[as="image"]')
      expect(preloads).toHaveLength(1)
      expect(preloads[0]!.getAttribute('type')).toBe('image/avif')
      expect(preloads[0]!.getAttribute('imagesrcset')).toBe(source.getAttribute('srcset'))
      expect(preloads[0]!.getAttribute('imagesizes')).toBe(image.getAttribute('sizes'))
      expect(image.getAttribute('fetchpriority')).toBe('high')
      expect(image.getAttribute('loading')).not.toBe('lazy')
      expect(Number(image.getAttribute('width'))).toBeGreaterThan(0)
      expect(Number(image.getAttribute('height'))).toBeGreaterThan(0)
      for (const later of [...document.querySelectorAll('main img')].slice(1)) {
        expect(later.getAttribute('loading')).toBe('lazy')
        expect(later.hasAttribute('fetchpriority')).toBe(false)
      }
      const html = renderToStaticMarkup(
        <html lang="en">
          {/* eslint-disable-next-line @next/next/no-head-element -- Exercise React's preload hoisting without Next. */}
          <head />
          <body>{element}</body>
        </html>,
      )
      expect(html.indexOf('<link')).toBeGreaterThan(html.indexOf('<head>'))
      expect(html.indexOf('<link')).toBeLessThan(html.indexOf('</head>'))
    }
  })

  it('preserves original-image fallbacks and does not promote later images to lead priority', () => {
    const article = articles.get('article-lab-long-table')!
    for (const hero of [
      { ...article.hero!, animated: true },
      { ...article.hero!, contentType: 'image/gif' },
      { ...article.hero!, width: null, height: null },
      { ...article.hero!, width: 9000, height: 9000 },
    ]) {
      const { document } = markup(<CinematicArticle view={{ ...article, hero }} />)
      const preload = document.querySelector('link[as="image"]')!
      expect(preload.getAttribute('href')).toBe(hero.src)
      expect(preload.hasAttribute('imagesrcset')).toBe(false)
      expect(document.querySelector('.cf-hero source')).toBeNull()
      expect(document.querySelector('.cf-hero img')?.getAttribute('src')).toBe(hero.src)
    }
    for (const element of [
      <CinematicArticle key="article" view={{ ...article, hero: null }} />,
      <CinematicSection
        key="section"
        view={{
          ...section,
          stories: [{ ...section.stories[0]!, image: null }, ...section.stories.slice(1)],
        }}
      />,
    ]) {
      const { document } = markup(element)
      expect(document.querySelector('link[as="image"]')).toBeNull()
      for (const image of document.querySelectorAll('main img'))
        expect(image.getAttribute('loading')).toBe('lazy')
    }
  })

  it('retains real titles, captions, credits and every shared body block through all seeded article states', () => {
    for (const view of articles.values()) {
      const { document, screen } = markup(<CinematicArticle view={view} />)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(view.title)
      expect(document.querySelectorAll('main')).toHaveLength(1)
      expect(document.querySelectorAll('.cf-hero')).toHaveLength(view.hero ? 1 : 0)
      expect(document.querySelector('time')?.getAttribute('datetime')).toBe(view.publishedAt)
      if (view.hero) {
        expect(document.querySelector('.cf-hero img')?.getAttribute('alt')).toBe(view.hero.alt)
        if (view.hero.caption)
          expect(document.querySelector('.cf-hero figcaption')).toHaveTextContent(view.hero.caption)
        if (view.hero.credit)
          expect(document.querySelector('.cf-hero figcaption')).toHaveTextContent(
            view.hero.credit.name,
          )
      } else expect(document.querySelector('.cf-hero-text')).toBeTruthy()
    }
    const { document } = markup(<CinematicArticle view={articles.get('article-lab-long-table')!} />)
    const body = document.querySelector('.cf-body')!
    for (const selector of [
      'p',
      'h2',
      'h3',
      'blockquote',
      'ol',
      'ul',
      'pre code',
      'hr',
      'figure picture',
      '[data-block="pull-quote"]',
      '[data-block="gallery"]',
      '[data-block="checklist"]',
      '[data-block="callout"]',
      '[data-block="embed"]',
      '[data-block="editorial"]',
    ])
      expect(body.querySelector(selector), selector).toBeTruthy()
    expect(body.querySelector('a')?.getAttribute('href')).toBeTruthy()
  })

  it('shows supplied authors and does not invent uncredited bylines', () => {
    const article = articles.get('article-lab-long-table')!
    expect(
      markup(
        <CinematicArticle view={{ ...article, authorLinks: [], authors: [] }} />,
      ).document.querySelector('.cf-credits'),
    ).not.toHaveTextContent('Words by')
    expect(
      markup(
        <CinematicArticle
          view={{ ...article, authorLinks: [], authors: ['A. Writer', 'B. Writer'] }}
        />,
      ).document.querySelector('.cf-credits'),
    ).toHaveTextContent('Words by A. Writer and B. Writer')
  })

  it('handles empty, single-story and many-story sections with current navigation', () => {
    for (const stories of [[], section.stories.slice(0, 1), section.stories]) {
      const { document, screen } = markup(<CinematicSection view={{ ...section, stories }} />)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(section.name)
      expect(document.querySelectorAll('.cf-collection > li')).toHaveLength(stories.length)
      expect(document.querySelectorAll('.cf-feature')).toHaveLength(stories.length ? 1 : 0)
      expect(document.querySelector('.cf-section-header .cf-label')).toHaveTextContent(/^Section$/)
      expect(
        [...document.querySelectorAll('.cf-collection h2')].map((heading) => heading.textContent),
      ).toEqual(stories.map(({ title }) => title))
      expect(document.querySelector('nav a[aria-current="page"]')?.getAttribute('href')).toBe(
        section.href,
      )
      if (!stories.length) {
        expect(screen.getByText('No stories have been published in this section yet.')).toBeTruthy()
        expect(
          within(screen.getByRole('main')).getByRole('link', { name: 'All stories' }),
        ).toHaveAttribute('href', '/')
      }
    }
  })

  it('uses feature, two-column and thumbnail sizes matching the specified slots', () => {
    const { document: homeDocument } = markup(<CinematicHome view={home} />)
    const { document: sectionDocument } = markup(<CinematicSection view={section} />)
    expect(homeDocument.querySelector('.cf-cover-image img')).toHaveAttribute('sizes', '100vw')
    for (const img of homeDocument.querySelectorAll('.cf-secondary img')) {
      expect(img).toHaveAttribute(
        'sizes',
        '(min-width: 1536px) 704px, (min-width: 1024px) calc(50vw - 64px), (min-width: 768px) calc(50vw - 44px), calc(100vw - 40px)',
      )
    }
    for (const img of homeDocument.querySelectorAll('.cf-latest img'))
      expect(img).toHaveAttribute('sizes', '80px')
    expect(sectionDocument.querySelector('.cf-feature img')).toHaveAttribute(
      'sizes',
      '(min-width: 1536px) 821.33px, (min-width: 1024px) calc(58.333333vw - 74.666667px), (min-width: 768px) calc(100vw - 64px), calc(100vw - 40px)',
    )
  })
})
