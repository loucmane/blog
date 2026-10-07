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
import { coverTextScrimOpacity } from './styles'
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

  it('meets AA for both reading surfaces and cover text over black and white image extremes', () => {
    for (const palette of [tokens.light, { ...tokens.light, ...tokens.dark }]) {
      for (const [text, background] of tokens.textPairs)
        expect(contrastRatio(palette[text], palette[background])).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(palette['--cf-ink'], palette['--cf-ground'])).toBeGreaterThanOrEqual(3)
    }
    const scrim = tokens.light['--cf-ground'].match(/[\da-f]{2}/gi)!.map((hex) => parseInt(hex, 16))
    // The text starts below --cf-cover-top at every breakpoint, where the local
    // scrim has reached its minimum opacity. The directional wash and bottom fade
    // can only increase that opacity; test both ends over the image's full range.
    for (const imageChannel of [0, 255]) {
      for (const opacity of [coverTextScrimOpacity, 1]) {
        const background = `rgb(${scrim
          .map((channel) => (channel * opacity + imageChannel * (1 - opacity)).toFixed(2))
          .join(' ')})`
        for (const text of ['--cf-ink', '--cf-secondary', '--cf-amber'] as const) {
          expect(contrastRatio(tokens.light[text], background)).toBeGreaterThanOrEqual(4.5)
        }
      }
    }
  })

  it('shows every title once and preserves the newest-first sequence beside the lead', () => {
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
      [...document.querySelectorAll('.cf-next h2')].map((heading) => heading.textContent),
    ).toEqual(home.recent.slice(0, 3).map(({ title }) => title))
    expect(document.querySelectorAll('.cf-further > li')).toHaveLength(home.recent.length - 3)
    expect(
      [...document.querySelectorAll('.cf-number')].map((number) => number.textContent),
    ).toEqual(['02', '03', '04'])
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
    expect(solo.document.querySelector('.cf-next, .cf-further, img, link[as="image"]')).toBeNull()
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
      markup(<CinematicArticle view={{ ...article, authors: [] }} />).document.querySelector(
        '.cf-credits',
      ),
    ).not.toHaveTextContent('Words by')
    expect(
      markup(
        <CinematicArticle view={{ ...article, authors: ['A. Writer', 'B. Writer'] }} />,
      ).document.querySelector('.cf-credits'),
    ).toHaveTextContent('Words by A. Writer, B. Writer')
  })

  it('handles empty, single-story and many-story sections with current navigation', () => {
    for (const stories of [[], section.stories.slice(0, 1), section.stories]) {
      const { document, screen } = markup(<CinematicSection view={{ ...section, stories }} />)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(section.name)
      expect(document.querySelectorAll('.cf-grid > li')).toHaveLength(stories.length)
      expect(document.querySelector('.cf-section-header .cf-label')).toHaveTextContent(
        `${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`,
      )
      expect(document.querySelector('nav a[aria-current="page"]')?.getAttribute('href')).toBe(
        section.href,
      )
      if (!stories.length)
        expect(screen.getByText('No stories have been published in this section yet.')).toBeTruthy()
    }
  })
})
