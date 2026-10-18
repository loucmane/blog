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
import { SwissArticle } from './article'
import { SwissHome } from './home'
import { SwissSection } from './section'
import { tokens } from './tokens'

function markup(element: ReactNode) {
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(element)
  return { document: container, screen: within(container) }
}

describe('Swiss Index with real published North House content', () => {
  let home: HomeView
  let section: SectionView
  const articles = new Map<string, ArticleView>()

  beforeAll(async () => {
    const repository = new InMemoryContentRepository()
    await seedLabContent({ objects: new InMemoryOriginalObjectStore(), repository })
    const source = { mediaAvailable: true, repository }
    home = await readHomeView(source)
    section = (await readSectionView(source, 'interiors'))!
    for (const story of labStories) {
      articles.set(story.id, (await readArticleView(source, labStorySlug(story)))!)
    }
  })

  it('meets AA for all text and accent pairs in both themes, including ink on signal orange', () => {
    for (const palette of [tokens.light, { ...tokens.light, ...tokens.dark }]) {
      for (const [text, background] of tokens.textPairs) {
        expect(contrastRatio(palette[text], palette[background])).toBeGreaterThanOrEqual(4.5)
      }
      expect(contrastRatio(palette['--si-ink'], palette['--si-paper'])).toBeGreaterThanOrEqual(3)
    }
  })

  it('renders every published title once, a three-story cover grid, and the remaining stories', () => {
    const { document, screen } = markup(<SwissHome view={home} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(siteName)
    for (const story of [home.lead!, ...home.recent]) {
      expect(screen.getByRole('heading', { name: story.title })).toBeTruthy()
      expect(
        screen.getAllByRole('link').some((link) => link.getAttribute('href') === story.href),
      ).toBe(true)
    }
    expect(document.querySelectorAll('.si-grid > li')).toHaveLength(3)
    expect(document.querySelectorAll('.si-latest li')).toHaveLength(home.recent.length - 2)
    expect(
      [...document.querySelectorAll('.si-number')].map((element) => element.textContent),
    ).toEqual([home.lead!, ...home.recent].map((_, index) => String(index + 1).padStart(2, '0')))
    expect(document.querySelectorAll('.si-state')).toHaveLength(1)
    expect(document.querySelector('.si-state')).toHaveTextContent('Lead')
    const lead = document.querySelector('.si-card-wide img')!
    expect(lead.getAttribute('alt')).toBe(home.lead!.image!.alt)
    expect(lead.getAttribute('width')).toBe(String(home.lead!.image!.width))
    expect(lead.getAttribute('fetchpriority')).toBe('high')
    expect(document.querySelectorAll('picture source')).toHaveLength(
      document.querySelectorAll('img').length * 2,
    )
  })

  it('handles empty stores and image-free leads without inventing images or content', () => {
    const empty = markup(
      <SwissHome view={{ lead: null, navigation: { sections: [] }, recent: [] }} />,
    )
    expect(empty.screen.getByRole('heading', { name: 'No stories yet' })).toBeTruthy()
    expect(empty.document.querySelectorAll('img')).toHaveLength(0)
    expect(empty.screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy()
    const story = home.recent.find((card) => !card.image)!
    const textLead = markup(<SwissHome view={{ ...home, lead: story, recent: [] }} />)
    expect(textLead.screen.getByRole('heading', { name: story.title })).toBeTruthy()
    expect(textLead.document.querySelector('.si-card-text')).toBeTruthy()
    expect(textLead.document.querySelectorAll('img')).toHaveLength(0)
    expect(textLead.document.querySelectorAll('.si-latest')).toHaveLength(0)
    expect(empty.document.querySelector('link[as="image"]')).toBeNull()
    expect(textLead.document.querySelector('link[as="image"]')).toBeNull()
  })

  it('discovers each page’s lead image early with the same responsive source and reserved dimensions', () => {
    const article = articles.get('article-lab-long-table')!
    const cases = [
      { element: <SwissHome view={home} />, image: home.lead!.image! },
      { element: <SwissArticle view={article} />, image: article.hero! },
      { element: <SwissSection view={section} />, image: section.stories[0]!.image! },
    ]
    for (const { element, image } of cases) {
      const { document } = markup(element)
      const lead = document.querySelector('main img')!
      const preferred = document.querySelector('main picture source')!
      const preloads = document.querySelectorAll('link[rel="preload"][as="image"]')
      expect(preloads).toHaveLength(1)
      const preload = preloads[0]!
      expect(preload.getAttribute('type')).toBe('image/avif')
      expect(preload.getAttribute('imagesrcset')).toBe(preferred.getAttribute('srcset'))
      expect(preload.getAttribute('imagesizes')).toBe(preferred.getAttribute('sizes'))
      expect(preload.getAttribute('imagesizes')).toBe(lead.getAttribute('sizes'))
      expect(preload.getAttribute('fetchpriority')).toBe('high')
      expect(preload.getAttribute('href')).toBe(`/api/media/${image.mediaId}?w=320&fm=avif`)
      const html = renderToStaticMarkup(
        <html lang="en">
          {/* eslint-disable-next-line @next/next/no-head-element -- Test React's HTML hoisting, without a Next runtime. */}
          <head />
          <body>{element}</body>
        </html>,
      )
      expect(html.indexOf('<link')).toBeGreaterThan(html.indexOf('<head>'))
      expect(html.indexOf('<link')).toBeLessThan(html.indexOf('</head>'))
      expect(lead.getAttribute('fetchpriority')).toBe('high')
      expect(lead.getAttribute('loading')).not.toBe('lazy')
      expect(lead.getAttribute('width')).toBe(String(image.width))
      expect(lead.getAttribute('height')).toBe(String(image.height))
      for (const laterImage of [...document.querySelectorAll('main img')].slice(1)) {
        expect(laterImage.getAttribute('loading')).toBe('lazy')
        expect(laterImage.hasAttribute('fetchpriority')).toBe(false)
      }
    }
  })

  it('preloads the original when a hero cannot safely use responsive variants', () => {
    const article = articles.get('article-lab-long-table')!
    for (const hero of [
      { ...article.hero!, animated: true },
      { ...article.hero!, contentType: 'image/gif' },
      { ...article.hero!, width: 9000, height: 9000 },
      { ...article.hero!, width: null, height: null },
    ]) {
      const { document } = markup(<SwissArticle view={{ ...article, hero }} />)
      const image = document.querySelector('.si-hero img')!
      const preloads = document.querySelectorAll('link[rel="preload"][as="image"]')
      expect(preloads).toHaveLength(1)
      expect(preloads[0]!.getAttribute('href')).toBe(hero.src)
      expect(preloads[0]!.getAttribute('type')).toBe(hero.contentType)
      expect(preloads[0]!.hasAttribute('imagesrcset')).toBe(false)
      expect(preloads[0]!.hasAttribute('imagesizes')).toBe(false)
      expect(document.querySelector('.si-hero source')).toBeNull()
      expect(image.getAttribute('src')).toBe(hero.src)
      if (hero.width === null) {
        expect(image.hasAttribute('width')).toBe(false)
        expect(image.hasAttribute('height')).toBe(false)
        expect(image.closest('picture')!.parentElement!.className).toContain('aspect-[3/2]')
      }
    }
  })

  it('does not promote a later section image when the first card is text only', () => {
    const stories = [{ ...section.stories[0]!, image: null }, ...section.stories.slice(1)]
    const { document } = markup(<SwissSection view={{ ...section, stories }} />)
    expect(document.querySelector('link[as="image"]')).toBeNull()
    expect(document.querySelectorAll('main img').length).toBeGreaterThan(0)
    for (const image of document.querySelectorAll('main img')) {
      expect(image.getAttribute('loading')).toBe('lazy')
      expect(image.hasAttribute('fetchpriority')).toBe(false)
    }
    const article = articles.get('article-lab-long-table')!
    const noHero = markup(<SwissArticle view={{ ...article, hero: null }} />)
    expect(noHero.document.querySelector('link[as="image"]')).toBeNull()
  })

  it('keeps long titles, a very short post, absent heroes, all body blocks, captions and links', () => {
    for (const view of articles.values()) {
      const { document, screen } = markup(<SwissArticle view={view} />)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(view.title)
      expect(document.querySelectorAll('main')).toHaveLength(1)
      expect(document.querySelectorAll('.si-hero')).toHaveLength(view.hero ? 1 : 0)
      if (view.hero) {
        expect(document.querySelector('.si-hero img')?.getAttribute('alt')).toBe(view.hero.alt)
        expect(document.querySelector('.si-hero figcaption')?.textContent).toContain(
          view.hero.caption,
        )
      }
    }
    const longRead = articles.get('article-lab-long-table')!
    const { document } = markup(<SwissArticle view={longRead} />)
    const body = document.querySelector('.si-body')!
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
    ]) {
      expect(body.querySelector(selector), selector).toBeTruthy()
    }
    expect(body.querySelector('a')?.getAttribute('href')).toBeTruthy()
  })

  it('handles empty, single-story and many-story sections and keeps current navigation', () => {
    for (const stories of [[], section.stories.slice(0, 1), section.stories]) {
      const { document, screen } = markup(<SwissSection view={{ ...section, stories }} />)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(section.name)
      expect(document.querySelectorAll('.si-grid > li')).toHaveLength(stories.length)
      expect(document.querySelector('.si-section-header .si-label')).toHaveTextContent(
        `${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`,
      )
      expect(document.querySelector('nav a[aria-current="page"]')?.getAttribute('href')).toBe(
        section.href,
      )
      for (const story of stories)
        expect(screen.getByRole('heading', { name: story.title })).toBeTruthy()
      if (stories.length === 0)
        expect(screen.getByText('No stories have been published in this section yet.')).toBeTruthy()
      if (stories.length === 0) expect(document.querySelector('link[as="image"]')).toBeNull()
    }
  })

  it('uses supplied article credits without inventing authors for uncredited stories', () => {
    const view = articles.get('article-lab-long-table')!
    const uncredited = markup(<SwissArticle view={{ ...view, authors: [], hero: null }} />)
    expect(uncredited.document.querySelector('.si-rail')?.textContent).not.toContain('Words')
    expect(uncredited.document.querySelector('.si-rail')?.textContent).not.toContain('Lead photo')
    const { document } = markup(<SwissArticle view={view} />)
    const rail = document.querySelector('.si-rail')!
    expect(rail.querySelector('time')?.getAttribute('datetime')).toBe(view.publishedAt)
    if (view.hero?.credit) expect(rail.textContent).toContain(view.hero.credit.name)
    const withAuthors = markup(
      <SwissArticle view={{ ...view, authors: ['A. Writer', 'B. Writer'] }} />,
    )
    expect(withAuthors.document.querySelector('.si-rail')).toHaveTextContent('A. Writer, B. Writer')
  })
})
