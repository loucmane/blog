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
import { MonographArticle } from './article'
import { MonographHome } from './home'
import { MonographSection } from './section'
import { tokens } from './tokens'

function markup(element: ReactNode) {
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(element)
  return { document: container, screen: within(container) }
}

describe('Quiet Monograph with real published North House content', () => {
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

  it('uses readable text tokens and distinguishes decorative stone from small text', () => {
    for (const [text, background] of tokens.textPairs) {
      expect(contrastRatio(tokens.light[text], tokens.light[background])).toBeGreaterThanOrEqual(
        4.5,
      )
    }
    expect(
      contrastRatio(tokens.light['--qm-ink'], tokens.light['--qm-paper']),
    ).toBeGreaterThanOrEqual(3)
    expect(contrastRatio(tokens.light['--qm-stone'], tokens.light['--qm-paper'])).toBeLessThan(4.5)
  })

  it('renders every published title once, a three-story row, and the remaining stories', () => {
    const { document, screen } = markup(<MonographHome view={home} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(siteName)
    for (const story of [home.lead!, ...home.recent]) {
      expect(screen.getByRole('heading', { name: story.title })).toBeTruthy()
      expect(
        screen.getAllByRole('link').some((link) => link.getAttribute('href') === story.href),
      ).toBe(true)
    }
    expect(document.querySelectorAll('.qm-trio > li')).toHaveLength(3)
    expect(document.querySelectorAll('.qm-more li')).toHaveLength(home.recent.length - 3)
    const lead = document.querySelector('.qm-cover img')!
    expect(lead.getAttribute('alt')).toBe(home.lead!.image!.alt)
    expect(lead.getAttribute('width')).toBe(String(home.lead!.image!.width))
    expect(lead.getAttribute('fetchpriority')).toBe('high')
    expect(document.querySelectorAll('picture source')).toHaveLength(2)
  })

  it('handles empty stores and image-free leads without inventing images or content', () => {
    const empty = markup(
      <MonographHome view={{ lead: null, navigation: { sections: [] }, recent: [] }} />,
    )
    expect(empty.screen.getByRole('heading', { name: 'No stories yet' })).toBeTruthy()
    expect(empty.document.querySelectorAll('img')).toHaveLength(0)
    expect(empty.document.querySelector('summary')?.textContent).toBe('Menu')
    const story = home.recent.find((card) => !card.image)!
    const textLead = markup(<MonographHome view={{ ...home, lead: story, recent: [] }} />)
    expect(textLead.screen.getByRole('heading', { name: story.title })).toBeTruthy()
    expect(textLead.document.querySelector('.qm-cover-text')).toBeTruthy()
    expect(textLead.document.querySelectorAll('img')).toHaveLength(0)
    expect(textLead.document.querySelectorAll('.qm-recent, .qm-more')).toHaveLength(0)
  })

  it('keeps long titles, a very short post, absent heroes, all body blocks, captions and links', () => {
    for (const view of articles.values()) {
      const { document, screen } = markup(<MonographArticle view={view} />)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(view.title)
      expect(document.querySelectorAll('main')).toHaveLength(1)
      expect(document.querySelectorAll('.qm-hero')).toHaveLength(view.hero ? 1 : 0)
      if (view.hero) {
        expect(document.querySelector('.qm-hero img')?.getAttribute('alt')).toBe(view.hero.alt)
        expect(document.querySelector('.qm-hero figcaption')?.textContent).toContain(
          view.hero.caption,
        )
      }
    }
    const longRead = articles.get('article-lab-long-table')!
    const { document } = markup(<MonographArticle view={longRead} />)
    const body = document.querySelector('.qm-body')!
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
      const { document, screen } = markup(<MonographSection view={{ ...section, stories }} />)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(section.name)
      expect(document.querySelectorAll('.qm-grid > li')).toHaveLength(stories.length)
      expect(document.querySelector('nav a[aria-current="page"]')?.getAttribute('href')).toBe(
        section.href,
      )
      for (const story of stories)
        expect(screen.getByRole('heading', { name: story.title })).toBeTruthy()
      if (stories.length === 0)
        expect(screen.getByText('No stories have been published in this section yet.')).toBeTruthy()
    }
  })
})
