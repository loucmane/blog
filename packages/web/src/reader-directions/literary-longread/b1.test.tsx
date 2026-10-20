// @vitest-environment jsdom
import { within } from '@testing-library/dom'
import postcss from 'postcss'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { formatPublishedDate, formatReadingTime } from '@/reader/format'
import type { ReaderImage, StoryCard } from '@/reader/views'

import { contrastRatio } from '../contrast'
import {
  readerDirectionFontCss,
  readerDirectionStyleCss,
  readerDirectionTokenCss,
} from '../contract'
import { LiteraryHome } from './home'
import { literaryLongreadDirection } from './index'
import { LiterarySection } from './section'
import { styles } from './styles'
import { tokens } from './tokens'

const image: ReaderImage = {
  alt: 'A table beside the window',
  animated: false,
  caption: 'Late afternoon at the table.',
  contentType: 'image/jpeg',
  credit: { name: 'The photographer', url: 'https://example.org/photographer' },
  focalPoint: { x: 0.2, y: 0.8 },
  height: 900,
  mediaId: 'table',
  src: '/api/media/table',
  width: 1200,
}
const section = { href: '/sections/essays', name: 'Essays', slug: 'essays' } as const
const navigation = { sections: [section] }
function story(index: number): StoryCard {
  return {
    dek: `The full introduction to essay ${index}, without an imposed line limit.`,
    href: `/stories/essay-${index}`,
    image,
    publishedAt: '2026-10-19T12:00:00Z',
    readingMinutes: index + 3,
    section,
    slug: `essay-${index}`,
    title: `Essay ${index}: A long title about the rooms we remember`,
  }
}
function markup(element: ReactNode) {
  const document = window.document.createElement('div')
  document.innerHTML = renderToStaticMarkup(element)
  return { document, screen: within(document) }
}

describe('Literary Long-read b1 design contract', () => {
  it('keeps supplied order, full introductions and metadata through cover, cards and Latest', () => {
    const stories = Array.from({ length: 8 }, (_, index) => story(index))
    const { document, screen } = markup(
      <LiteraryHome view={{ lead: stories[0]!, navigation, recent: stories.slice(1) }} />,
    )
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(
      [...document.querySelectorAll('main h2 a, main h3 a')].map((link) => link.textContent),
    ).toEqual(stories.map(({ title }) => title))
    expect(document.querySelectorAll('.ll-grid > li')).toHaveLength(4)
    expect(document.querySelectorAll('.ll-latest li')).toHaveLength(3)
    const entries = document.querySelectorAll('.ll-cover-panel, .ll-card, .ll-latest li')
    expect(entries).toHaveLength(stories.length)
    for (const [index, entry] of [...entries].entries()) {
      const card = stories[index]!
      expect(entry.textContent).toContain(card.dek)
      expect(entry.textContent).toContain(formatReadingTime(card.readingMinutes))
      expect(entry.querySelector('time')).toHaveAttribute('datetime', card.publishedAt)
      expect(entry.querySelector('time')).toHaveTextContent(formatPublishedDate(card.publishedAt))
    }
    expect(
      screen.getByRole('link', { name: `Read the story: ${stories[0]!.title}` }),
    ).toHaveAttribute('href', stories[0]!.href)
  })

  it('uses shared caption and credit semantics, focal crops, exact sizes and one preload', () => {
    const { document } = markup(
      <LiteraryHome view={{ lead: story(0), navigation, recent: [story(1)] }} />,
    )
    const sizes = [
      // This 4:3 source fills a 4:5 desktop crop: source width is 5/3 of the slot.
      '(min-width: 1344px) 65rem, (min-width: 1024px) calc(83.333333vw - 5rem), (min-width: 768px) calc(83.333333vw - 2.5rem), calc(100vw - 2.5rem)',
      '(min-width: 1344px) 38.25rem, (min-width: 1024px) calc(50vw - 3.75rem), (min-width: 768px) calc(50vw - 2.25rem), calc(100vw - 2.5rem)',
    ]
    const figures = document.querySelectorAll<HTMLElement>('main figure')
    expect(figures).toHaveLength(2)
    for (const [index, figure] of [...figures].entries()) {
      expect(figure.querySelector('figcaption')).toHaveTextContent(image.caption!)
      expect(within(figure).getByRole('link', { name: image.credit!.name })).toHaveAttribute(
        'href',
        image.credit!.url,
      )
      expect(figure.querySelector('img')).toHaveAttribute('alt', image.alt)
      expect(figure.querySelector('img')).toHaveAttribute('sizes', sizes[index])
      expect(figure.style.getPropertyValue('--ll-focal-point')).toBe('20% 80%')
    }
    const preloads = document.querySelectorAll('link[as="image"][href]')
    expect(preloads).toHaveLength(1)
    expect(preloads[0]).toHaveAttribute('imagesizes', sizes[0])
    expect(preloads[0]).toHaveAttribute(
      'imagesrcset',
      figures[0]!.querySelector('source')!.getAttribute('srcset'),
    )
    expect(figures[1]!.querySelector('img')).toHaveAttribute('loading', 'lazy')
    expect(document.querySelectorAll('a img')).toHaveLength(0)
  })

  it('preserves unknown-size focal positions and unlinked credits without empty captions', () => {
    for (const caption of [image.caption, null]) {
      const suppliedImage = {
        ...image,
        caption,
        credit: caption ? { name: 'Studio archive', url: null } : null,
        height: null,
        width: null,
      }
      const { document } = markup(
        <LiteraryHome
          view={{ lead: { ...story(0), image: suppliedImage }, navigation, recent: [] }}
        />,
      )
      const figure = document.querySelector('main figure')!
      expect(figure).not.toBeNull()
      expect(figure.querySelector('img')!.style.objectPosition).toBe('20% 80%')
      expect(figure.querySelectorAll('figcaption')).toHaveLength(caption ? 1 : 0)
      expect(figure.querySelectorAll('a')).toHaveLength(0)
      expect(document.querySelector('link[as="image"]')).toHaveAttribute('href', image.src)
    }
  })

  it('renders only present modules for zero, one and fewer than four secondary stories', () => {
    for (const count of [0, 1, 3]) {
      const recent = Array.from({ length: count }, (_, index) => ({
        ...story(index + 1),
        dek: '',
        image: null,
      }))
      const { document } = markup(
        <LiteraryHome view={{ lead: { ...story(0), image: null }, navigation, recent }} />,
      )
      expect(document.querySelectorAll('.ll-grid > li')).toHaveLength(count)
      expect(document.querySelectorAll('.ll-featured')).toHaveLength(count ? 1 : 0)
      expect(
        document.querySelectorAll('.ll-latest, main figure, main img, link[as="image"]'),
      ).toHaveLength(0)
      expect(document.querySelectorAll('.ll-card-dek')).toHaveLength(0)
    }
  })

  it('keeps section dates before copy, full deks, reading time and credited thumbnails', () => {
    const stories = [story(0), { ...story(1), image: null }]
    const { document, screen } = markup(
      <LiterarySection
        view={{ ...section, description: 'Essays from the magazine.', navigation, stories }}
      />,
    )
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: section.name })).toBeTruthy()
    for (const [index, row] of [...document.querySelectorAll('.ll-index-row')].entries()) {
      expect(row.firstElementChild?.tagName).toBe('TIME')
      expect(row.textContent).toContain(stories[index]!.dek)
      expect(row.textContent).toContain(formatReadingTime(stories[index]!.readingMinutes))
      expect(row.querySelectorAll('figure')).toHaveLength(index === 0 ? 1 : 0)
    }
    expect(document.querySelector('main figcaption')).toHaveTextContent(image.caption!)
    const sizes = '(min-width: 1024px) 10rem, (min-width: 768px) 6rem, 5rem'
    expect(document.querySelector('main img')).toHaveAttribute('sizes', sizes)
    expect(document.querySelector('link[as="image"]')).toHaveAttribute('imagesizes', sizes)
  })

  it('offers an All stories exit inside an empty section and keeps shell landmarks', () => {
    const { document, screen } = markup(
      <LiterarySection view={{ ...section, description: null, navigation, stories: [] }} />,
    )
    expect(screen.getAllByRole('banner')[0]).toBe(document.querySelector('.ll-masthead'))
    expect(screen.getByRole('contentinfo')).toBeTruthy()
    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('tabindex', '-1')
    expect(within(main).getByRole('link', { name: 'All stories' })).toHaveAttribute('href', '/')
    expect(document.querySelectorAll('nav [aria-current="page"]')).toHaveLength(1)
    expect(document.querySelector('.ll-dek')).toBeNull()
  })

  it('registers the warm palette, all eight text pairs and functional borders in both themes', () => {
    expect(tokens.light).toMatchObject({
      '--ll-paper': '#FBF8F2',
      '--ll-surface': '#F2ECE2',
      '--ll-border': '#8B7F72',
    })
    expect(tokens.dark).toMatchObject({ '--ll-surface': '#25211D', '--ll-border': '#9A8B7C' })
    expect(tokens.textPairs).toHaveLength(8)
    for (const palette of [tokens.light, { ...tokens.light, ...tokens.dark }]) {
      const values: Readonly<Record<string, string>> = palette
      for (const background of ['--ll-paper', '--ll-surface']) {
        expect(contrastRatio(values['--ll-border']!, values[background]!)).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('uses only the specified layout transitions, unclipped copy and the CSS budget', () => {
    const css = postcss.parse(styles)
    const media: string[] = []
    css.walkAtRules('media', (rule) => {
      media.push(rule.params)
    })
    expect(media.filter((query) => query.includes('width'))).toEqual([
      '(min-width: 768px)',
      '(min-width: 1024px)',
    ])
    css.walkDecls((declaration) => {
      expect(declaration.prop).not.toContain('line-clamp')
    })
    const coverRule = css.nodes.find(
      (node) => node.type === 'rule' && node.selector === '& .ll-page .ll-cover-title',
    )
    expect(coverRule?.toString()).not.toContain('uppercase')
    const bytes = new TextEncoder().encode(
      [
        readerDirectionFontCss(literaryLongreadDirection),
        readerDirectionStyleCss(literaryLongreadDirection),
        readerDirectionTokenCss(literaryLongreadDirection),
      ].join(''),
    ).length
    // Raised from 22,000 B for local fallback faces: operator decision, 2026-10-20 (blog-0044.63).
    expect(bytes).toBeLessThanOrEqual(23_500)
  })
})
