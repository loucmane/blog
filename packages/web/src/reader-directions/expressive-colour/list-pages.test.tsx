// @vitest-environment jsdom
import { within } from '@testing-library/dom'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import type { HomeView, SectionView, StoryCard } from '@/reader/views'

import {
  readerDirectionFontCss,
  readerDirectionStyleCss,
  readerDirectionTokenCss,
} from '../contract'
import { storyColour, storyColours } from './colours'
import { ExpressiveHome } from './home'
import { expressiveColourDirection } from './index'
import { ExpressiveSection } from './section'
import { ExpressiveStoryList } from './story-list'

const section = { name: 'Interiors', slug: 'interiors', href: '/sections/interiors' } as const
const navigation = { sections: [section] }
function stories(count: number): StoryCard[] {
  return Array.from({ length: count }, (_, index) => ({
    title: `A room for story ${index + 1}`,
    slug: `story-${index + 1}`,
    href: `/stories/story-${index + 1}`,
    dek: 'A supplied description of this room.',
    publishedAt: '2026-10-01T12:00:00Z',
    readingMinutes: 4,
    section,
    image: {
      mediaId: 'room',
      src: '/api/media/room',
      alt: 'A sunlit room',
      contentType: 'image/jpeg',
      width: 1200,
      height: 800,
      focalPoint: { x: 0.2, y: 0.7 },
      animated: false,
      caption: null,
      credit: null,
    },
  }))
}
function homeView(cards: readonly StoryCard[]): HomeView {
  return { lead: cards[0] ?? null, recent: cards.slice(1), navigation }
}
function sectionView(cards: readonly StoryCard[]): SectionView {
  return { ...section, description: null, stories: cards, navigation }
}
function markup(element: ReactNode) {
  const container = document.createElement('div')
  document.body.replaceChildren(container)
  container.innerHTML = renderToStaticMarkup(element)
  return { container, screen: within(container) }
}

describe('developed home and section lists', () => {
  it.each([1, 2, 3, 10, 13])(
    'lays out %i home stories in chronological tiers without dropping content',
    (count) => {
      const cards = stories(count)
      const { container, screen } = markup(<ExpressiveHome view={homeView(cards)} />)
      const list = screen.getByRole('list', { name: 'Stories, newest first' })
      const items = within(list).getAllByRole('listitem')
      expect(items).toHaveLength(count)
      expect(items.map((item) => item.getAttribute('data-variant'))).toEqual(
        cards.map((_, index) =>
          index === 0 ? 'lead' : index < 3 ? 'secondary' : index < 9 ? 'standard' : 'compact',
        ),
      )
      expect(
        items.map((item) => within(item).getByRole('heading', { level: 2 }).textContent),
      ).toEqual(cards.map(({ title }) => title))
      for (const [index, item] of items.entries()) {
        expect(within(item).getByRole('link', { name: cards[index]!.title })).toHaveAttribute(
          'href',
          cards[index]!.href,
        )
        expect(item.querySelector('.ec-number')).toHaveTextContent(
          String(index + 1).padStart(2, '0'),
        )
        if (index >= 9) {
          expect(item.querySelector('img, picture, svg, .ec-card-dek')).toBeNull()
          expect(item.querySelector('time')).toHaveAttribute('datetime', cards[index]!.publishedAt)
          expect(item).toHaveTextContent('Interiors')
          expect(item).toHaveTextContent('4 min read')
        }
      }
      expect(container.querySelectorAll('.ec-card-secondary-solo')).toHaveLength(
        count === 2 ? 1 : 0,
      )
      expect(container.querySelectorAll('link[rel="preload"][as="image"]')).toHaveLength(1)
      const image = items[0]!.querySelector('img')!
      expect(image).toHaveAttribute(
        'sizes',
        '(min-width: 1408px) 690px, (min-width: 1024px) 49vw, (min-width: 768px) 88vw, calc(100vw - 5rem)',
      )
      expect(container.querySelector('link[as="image"]')).toHaveAttribute(
        'imagesizes',
        image.getAttribute('sizes'),
      )
      expect(image.closest('.ec-card-visual')).toHaveAttribute('style', 'object-position:20% 70%')
    },
  )

  it('gives sections one lead, twelve standard cards, then compact rows and at most 24 spines', () => {
    const cards = stories(27)
    const { container, screen } = markup(<ExpressiveSection view={sectionView(cards)} />)
    const items = within(
      screen.getByRole('list', { name: 'Interiors stories, newest first' }),
    ).getAllByRole('listitem')
    expect(items.map((item) => item.getAttribute('data-variant'))).toEqual([
      'lead',
      ...Array<string>(12).fill('standard'),
      ...Array<string>(14).fill('compact'),
    ])
    expect(container.querySelectorAll('main img')).toHaveLength(13)
    expect(container.querySelectorAll('.ec-spine-strip > span')).toHaveLength(24)
    expect(container.querySelector('.ec-spine-strip')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('link[as="image"]')?.getAttribute('imagesizes')).toBe(
      items[0]!.querySelector('img')!.getAttribute('sizes'),
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Interiors')
  })

  it('alternates repeated colours without reassigning a story identity', () => {
    const cards = stories(100)
      .filter(({ slug }) => storyColour(slug).name === 'lilac')
      .slice(0, 5)
    const { container } = markup(<ExpressiveHome view={homeView(cards)} />)
    const items = [...container.querySelectorAll('.ec-card')]
    expect(items.map((item) => item.getAttribute('data-surface'))).toEqual([
      'filled',
      'paper',
      'filled',
      'paper',
      'filled',
    ])
    expect(items.every((item) => item.getAttribute('data-story-colour') === 'lilac')).toBe(true)
    expect(
      [...container.querySelectorAll('.ec-spine-strip > span')].map((bar) =>
        bar.getAttribute('data-story-colour'),
      ),
    ).toEqual(cards.map(({ slug }) => storyColour(slug).name))
  })

  it('steps down titles over 80 characters without truncating their accessible names', () => {
    const cards = stories(4).map((story, index) => ({
      ...story,
      title: `${index} ${'A long room title '.repeat(8)}`.trim(),
    }))
    const { screen, container } = markup(<ExpressiveHome view={homeView(cards)} />)
    expect(container.querySelectorAll('.ec-card-title-long')).toHaveLength(4)
    for (const card of cards) expect(screen.getByRole('link', { name: card.title })).toBeTruthy()
    const page = markup(<ExpressiveSection view={{ ...sectionView([]), name: 'A'.repeat(81) }} />)
    expect(page.screen.getByRole('heading', { level: 1 })).toHaveClass('ec-title-long')
  })

  it('keeps navigation, theme and landmarks in reading order, with decorative colour wayfinding', () => {
    for (const element of [
      <ExpressiveHome key="home" view={homeView(stories(3))} />,
      <ExpressiveSection key="section" view={sectionView(stories(3))} />,
    ]) {
      const { screen, container } = markup(element)
      for (const role of ['banner', 'main', 'contentinfo'] as const)
        expect(screen.getAllByRole(role)).toHaveLength(1)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute(
        'href',
        '#ec-main',
      )
      expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1')
      const banner = screen.getByRole('banner')
      const theme = within(banner).getByRole('button', { name: 'Choose color theme' })
      const sections = within(banner).getByRole('navigation', { name: 'Sections' })
      expect(
        theme.compareDocumentPosition(sections) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
      const footer = screen.getByRole('navigation', { name: 'Footer' })
      expect(within(footer).getByRole('link', { name: 'All stories' })).toHaveAttribute('href', '/')
      expect(within(footer).getByRole('link', { name: 'Interiors' })).toHaveAttribute(
        'href',
        section.href,
      )
      expect(container.querySelector('.ec-footer-stripe')).toHaveAttribute('aria-hidden', 'true')
      expect(
        [...container.querySelectorAll('.ec-footer-stripe > span')].map((segment) =>
          segment.getAttribute('data-story-colour'),
        ),
      ).toEqual(storyColours.map(({ name }) => name))
    }
  })

  it('omits empty lists, strips and descriptions but retains useful empty states and motifs', () => {
    for (const element of [
      <ExpressiveHome key="home" view={homeView([])} />,
      <ExpressiveSection key="section" view={sectionView([])} />,
    ]) {
      const { container, screen } = markup(element)
      expect(screen.getByRole('heading', { name: 'No stories yet', level: 2 })).toBeTruthy()
      expect(container.querySelector('.ec-empty .ec-motif')).toHaveAttribute('aria-hidden', 'true')
      expect(
        container.querySelector(
          '.ec-grid, .ec-spine-strip, .ec-section-header .ec-dek, link[as="image"]',
        ),
      ).toBeNull()
    }
  })

  it('keeps the complete inline font, token and style payload within the proposed 24 KB budget', () => {
    const css = [
      readerDirectionFontCss(expressiveColourDirection),
      readerDirectionTokenCss(expressiveColourDirection),
      readerDirectionStyleCss(expressiveColourDirection),
    ].join('')
    expect(new TextEncoder().encode(css).length).toBeLessThanOrEqual(24_000)
  })

  it('supports related-list heading levels without numbers or a second preload', () => {
    const cards = stories(3)
    const { container, screen } = markup(
      <ExpressiveStoryList stories={cards} label="Read next" layout="related" />,
    )
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3)
    expect(container.querySelector('.ec-number, link[as="image"]')).toBeNull()
    for (const image of container.querySelectorAll('img'))
      expect(image).toHaveAttribute('loading', 'lazy')
  })

  it('keeps the registered author and topic fallbacks rendering while b2 is pending', () => {
    const Author = expressiveColourDirection.Author
    const Topic = expressiveColourDirection.Topic
    const author = markup(
      <Author
        view={{
          name: 'A. Writer',
          slug: 'a-writer',
          href: '/authors/a-writer',
          bio: null,
          stories: stories(2),
          navigation,
        }}
      />,
    )
    expect(author.screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(author.screen.getByRole('heading', { level: 1 })).toHaveTextContent('A. Writer')
    const topic = markup(
      <Topic
        view={{
          name: 'Rooms',
          slug: 'rooms',
          href: '/topics/rooms',
          description: null,
          stories: [],
          navigation,
        }}
      />,
    )
    expect(topic.screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(topic.screen.getByRole('heading', { level: 1 })).toHaveTextContent('Rooms')
  })
})
