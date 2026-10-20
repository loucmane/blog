// @vitest-environment jsdom
import { within } from '@testing-library/dom'
import postcss, { type AtRule } from 'postcss'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import { beforeAll, describe, expect, it } from 'vitest'

import { siteName } from '@/reader/components/site-header'
import { formatPublishedDate } from '@/reader/format'
import { authorPath } from '@/reader/paths'
import {
  readArticleView,
  readAuthorView,
  readHomeView,
  readSectionView,
  readTopicView,
} from '@/reader/read-model'
import type {
  ArticleBlock,
  ArticleView,
  AuthorView,
  HomeView,
  ReaderImage,
  SectionView,
  StoryCard,
  TopicView,
} from '@/reader/views'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { InMemoryOriginalObjectStore } from '@/server/content/media'
import { labAuthors, labStories, labTopics } from '@/server/lab/north-house'
import { labStorySlug, seedLabContent } from '@/server/lab/seed'

import { readerDirectionStyleCss, readerDirectionTokenCss } from '../contract'
import { contrastRatio } from '../contrast'
import { MonographArticle } from './article'
import { MonographAuthor } from './author'
import { plateFit, plateSizes, plateStyle, type PlateSlot } from './fit'
import { MonographHome } from './home'
import { quietMonographDirection } from './index'
import { MonographSection } from './section'
import { tokens } from './tokens'
import { MonographTopic } from './topic'

function markup(element: ReactNode) {
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(element)
  return { document: container, screen: within(container) }
}

/** Fails unless every element exists and they follow each other in document order. */
function expectInOrder(...elements: readonly (Element | null | undefined)[]) {
  elements.forEach((element, index) => expect(element, `element ${index}`).toBeTruthy())
  for (let index = 1; index < elements.length; index++) {
    expect(
      elements[index - 1]!.compareDocumentPosition(elements[index]!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      `element ${index - 1} before element ${index}`,
    ).toBeTruthy()
  }
}

/** Link text and targets, in document order. */
function links(root: Element) {
  return [...root.querySelectorAll('a')].map((link) => [
    link.textContent,
    link.getAttribute('href'),
  ])
}

const styleRules = postcss.parse(quietMonographDirection.styles!)

/** Declarations of the rules whose selector list includes `selector`, inside `media` or at the top. */
function declarations(selector: string, media?: string) {
  const found: Record<string, string> = {}
  styleRules.walkRules((rule) => {
    const parent = rule.parent?.type === 'atrule' ? (rule.parent as AtRule).params : undefined
    if (parent !== media || !rule.selectors.includes(selector)) return
    rule.walkDecls((declaration) => {
      found[declaration.prop] = `${declaration.value}${declaration.important ? ' !important' : ''}`
    })
  })
  return found
}

const coverSizes =
  '(min-width: 1009px) 58rem, (min-width: 768px) 92vw, (min-width: 500px) 92vw, calc(100vw - 2.5rem)'
const roomSizes =
  '(min-width: 800px) 46rem, (min-width: 768px) 92vw, (min-width: 500px) 92vw, calc(100vw - 2.5rem)'
const baySizes =
  '(min-width: 1600px) 34rem, (min-width: 1305px) calc(37.5rem - 3.5vw), (min-width: 768px) 42.5vw, (min-width: 500px) 92vw, calc(100vw - 2.5rem)'
// Body figures and galleries, spec section 6: the hook takes one gallery value, the figure's.
const figureSizes = '(min-width: 731px) 42rem, (min-width: 500px) 92vw, calc(100vw - 2.5rem)'

/** The inline fit factors and the `sizes` value a plate in this slot gives its picture. */
function slotted(image: ReaderImage, slot: PlateSlot) {
  const fit = plateFit(image, slot)
  return {
    sizes: plateSizes(slot, fit),
    style: Object.entries(plateStyle(fit))
      .map(([property, value]) => `${property}:${value}`)
      .join(';'),
  }
}

/** The count line under a section, topic or author name. */
function countLine(count: number) {
  if (count === 0) return 'No stories'
  return count === 1 ? '1 story' : `${count} stories`
}

/** The section label and title links of a plate or row, in that order. */
function storyLinks(story: StoryCard) {
  return [
    [story.section!.name, story.section!.href],
    [story.title, story.href],
  ]
}

describe('Quiet Monograph with real published North House content', () => {
  let home: HomeView
  let section: SectionView
  let craft: SectionView
  const articles = new Map<string, ArticleView>()
  const authors = new Map<string, AuthorView>()
  const cards = new Map<string, StoryCard>()
  const topics = new Map<string, TopicView>()

  beforeAll(async () => {
    const repository = new InMemoryContentRepository()
    await seedLabContent({ objects: new InMemoryOriginalObjectStore(), repository })
    const source = { mediaAvailable: true, repository }
    home = await readHomeView(source)
    section = (await readSectionView(source, 'interiors'))!
    craft = (await readSectionView(source, 'craft'))!
    for (const story of labStories) {
      articles.set(story.id, (await readArticleView(source, labStorySlug(story)))!)
      cards.set(
        story.id,
        [home.lead!, ...home.recent].find(({ slug }) => slug === labStorySlug(story))!,
      )
    }
    for (const { slug } of labAuthors) authors.set(slug, (await readAuthorView(source, slug))!)
    for (const { slug } of labTopics) topics.set(slug, (await readTopicView(source, slug))!)
  })

  /** The sample's sections, in navigation order, after "Front page". */
  function contents() {
    return [['Front page', '/'], ...home.navigation.sections.map(({ href, name }) => [name, href])]
  }

  /** Copies of a section's stories under new slugs, to fill longer lists. */
  function moreStories(count: number): StoryCard[] {
    return Array.from({ length: count }, (_, index) => {
      const story = section.stories[index % section.stories.length]!
      return {
        ...story,
        href: `/stories/sample-${index + 1}`,
        slug: `sample-${index + 1}`,
        title: `Sample story ${index + 1}`,
      }
    })
  }

  it('declares the paper and graphite palettes and reads in both themes', () => {
    expect(tokens.light).toMatchObject({
      '--qm-paper': '#F6F5F1',
      '--qm-ink': '#1C1B19',
      '--qm-stone-ink': '#6B665E',
      '--qm-stone': '#7A766E',
      '--qm-sand': '#D9D3C7',
      '--qm-print': '0 0.5rem 1.75rem #1C1B1914',
      '--qm-print-hover': '0 0.75rem 2.25rem #1C1B1926',
      '--qm-scheme': 'light',
      '--qm-copy': '1rem',
      '--qm-dek': 'clamp(1.375rem, 1.1rem + 0.8vw, 1.875rem)',
      '--qm-title-long': 'clamp(2rem, 1.4rem + 2vw, 3.25rem)',
      '--qm-section-title': 'clamp(2.75rem, 1.5rem + 6vw, 7.5rem)',
      '--qm-wordmark': 'clamp(0.9375rem, 0.8rem + 0.5vw, 1.3125rem)',
      '--qm-monogram': 'clamp(6rem, 3rem + 8vw, 10rem)',
      '--qm-measure': '30em',
    })
    expect(tokens.dark).toEqual({
      '--qm-paper': '#2E2B27',
      '--qm-ink': '#EEEBE4',
      '--qm-stone-ink': '#B5AEA2',
      '--qm-stone': '#8C867C',
      '--qm-sand': '#4A463F',
      '--qm-print': 'none',
      '--qm-print-hover': 'none',
      '--qm-scheme': 'dark',
    })
    const light: Record<string, string> = tokens.light
    const dark: Record<string, string> = { ...tokens.light, ...tokens.dark }
    const ratios = (theme: Record<string, string>) =>
      tokens.textPairs.map(([text, background]) =>
        Number(contrastRatio(theme[text]!, theme[background]!).toFixed(2)),
      )
    expect(tokens.textPairs).toEqual([
      ['--qm-ink', '--qm-paper'],
      ['--qm-stone-ink', '--qm-paper'],
      ['--qm-ink', '--qm-sand'],
    ])
    expect(ratios(light)).toEqual([15.78, 5.22, 11.55])
    expect(ratios(dark)).toEqual([11.83, 6.4, 7.88])
    for (const theme of [light, dark]) {
      // Stone ink never sits on sand, and stone is only ever decorative.
      expect(contrastRatio(theme['--qm-stone-ink']!, theme['--qm-sand']!)).toBeLessThan(4.5)
      expect(contrastRatio(theme['--qm-stone']!, theme['--qm-paper']!)).toBeLessThan(4.5)
    }
    // The contract checks the same pairs in both themes when the direction registers.
    expect(quietMonographDirection.tokens?.dark).toEqual(tokens.dark)
    expect(readerDirectionTokenCss(quietMonographDirection)).toContain(
      '.dark [data-reader-direction="quiet-monograph"]{--qm-paper:#2E2B27;',
    )
  })

  it('keeps its CSS within budget, uncropped, unsynthesized and in step with the theme', () => {
    const css =
      readerDirectionStyleCss(quietMonographDirection)! +
      readerDirectionTokenCss(quietMonographDirection)!
    expect(new TextEncoder().encode(css).length).toBeLessThanOrEqual(20_000)
    expect(declarations('&')).toMatchObject({
      background: 'var(--qm-paper)',
      'color-scheme': 'var(--qm-scheme)',
    })
    // Only genuine italics and weights: the page lets the browser fake no face. The one exception,
    // emphasis on a cold view, is pinned in b3.test.tsx.
    expect(declarations('& .qm-page')).toMatchObject({ 'font-synthesis': 'none' })
    styleRules.walkDecls((declaration) => {
      expect(`${declaration.prop}: ${declaration.value}`).not.toMatch(
        /^object-fit: cover|^font-weight: 300|^color-scheme: light/,
      )
    })
    styleRules.walkRules((rule) => {
      // ReaderImageView puts a <picture> between every image and its parent.
      expect(rule.selector, rule.selector).not.toMatch(/>\s*img/)
    })
    expect(declarations('& .qm-cover-title')).not.toHaveProperty('text-transform')
    expect(declarations('& .qm-page .qm-dek')).toMatchObject({
      'font-family': 'var(--qm-display)',
      'font-size': 'var(--qm-dek)',
      'font-style': 'italic',
      'max-width': '20em',
    })
    expect(declarations('& .qm-plate-box picture img')).toMatchObject({
      height: 'auto',
      width: 'calc(var(--qm-fit-sm, 1) * 100%)',
      transition: 'box-shadow 200ms ease-out',
    })
    expect(declarations('& .qm-plate-box picture img', '(min-width: 768px)')).toMatchObject({
      width: 'calc(var(--qm-fit, 1) * 100%)',
    })
    expect(declarations('& .qm-bay', '(min-width: 768px)')).toMatchObject({
      'aspect-ratio': '1',
      'align-items': 'flex-end',
      display: 'flex',
      'justify-content': 'center',
    })
    expect(declarations('& .qm-plate-box > div picture img')).toMatchObject({
      'object-fit': 'contain',
      'object-position': '50% 50% !important',
    })
    // One "Sections" navigation at a time: the menu below 1024px, the row from 1024px.
    expect(declarations('& .qm-nav-row')).toMatchObject({ display: 'none' })
    expect(declarations('& .qm-menu', '(min-width: 1024px)')).toMatchObject({ display: 'none' })
    expect(declarations('& .qm-nav-row', '(min-width: 1024px)')).toMatchObject({
      display: 'block',
    })
    expect(declarations('& .qm-page *', '(prefers-reduced-motion: reduce)')).toMatchObject({
      transition: 'none',
    })
    expect(declarations('& .qm-page :is(a, summary, button):focus-visible')).toMatchObject({
      outline: '2px solid var(--qm-ink)',
      'outline-offset': '5px',
    })
  })

  it('frames every page with the masthead, one Sections menu per width, and the Contents footer', () => {
    const article = articles.get('article-lab-long-table')!
    for (const [element, current] of [
      [<MonographHome key="home" view={home} />, '/'],
      [<MonographSection key="section" view={section} />, section.href],
      [<MonographArticle key="article" view={article} />, null],
      [<MonographAuthor key="author" view={authors.get(labAuthors[0]!.slug)!} />, null],
      [<MonographTopic key="topic" view={topics.get(labTopics[0]!.slug)!} />, null],
    ] as const) {
      const { document, screen } = markup(element)
      const page = document.querySelector('.qm-page')!
      expect(page.id).toBe('qm-top')
      // Not named `skip`: the CI capability check reads skip(...) calls as disabled tests.
      const skipLink = screen.getByRole('link', { name: 'Skip to content' })
      expect(skipLink.getAttribute('href')).toBe('#qm-main')
      expect(page.querySelector('a, button, summary')).toBe(skipLink)
      const main = document.querySelector('main')!
      expect(main.id).toBe('qm-main')
      expect(main.getAttribute('tabindex')).toBe('-1')
      const masthead = document.querySelector<HTMLElement>('header.qm-masthead')!
      const theme = within(masthead).getByRole('button', { name: 'Choose color theme' })
      expect(theme.classList).toContain('qm-theme')
      const summary = masthead.querySelector('details.qm-menu > summary')!
      expect(summary.textContent).toBe('Menu')
      const sections = [...masthead.querySelectorAll('nav[aria-label="Sections"]')]
      expect(sections).toHaveLength(2)
      expect(sections[0]!.parentElement).toBe(masthead.querySelector('details.qm-menu'))
      expect(sections[1]!.classList).toContain('qm-nav-row')
      expectInOrder(masthead.querySelector('.qm-wordmark a'), theme, summary, sections[1])
      // The row layout places exactly these four boxes; the Theme popup renders in a portal.
      expect([...masthead.children].map(({ className }) => className)).toEqual([
        'qm-wordmark',
        expect.stringContaining('qm-theme'),
        'qm-menu',
        'qm-nav-row',
      ])
      for (const nav of sections) {
        expect(links(nav)).toEqual(contents())
        expect(
          [...nav.querySelectorAll('[aria-current="page"]')].map((link) =>
            link.getAttribute('href'),
          ),
        ).toEqual(current ? [current] : [])
      }
      const footer = document.querySelector<HTMLElement>('footer.qm-footer')!
      expect(footer.querySelector('.qm-footer-brand')?.textContent).toBe(siteName)
      const footerContents = within(footer).getByRole('navigation', { name: 'Contents' })
      expect(links(footerContents)).toEqual(contents())
      expect(within(footer).getByRole('link', { name: 'Back to top' }).getAttribute('href')).toBe(
        '#qm-top',
      )
      expectInOrder(masthead, main, footer)
      expect(document.textContent).not.toMatch(/↗|All stories|Read the story|Skip to stories/)
    }
  })

  it('opens home with the cover, three rooms and the earlier checklist, newest first', () => {
    const { document, screen } = markup(<MonographHome view={home} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(siteName)
    const main = document.querySelector('main')!
    const lead = home.lead!

    const cover = main.querySelector<HTMLElement>('.qm-cover')!
    const coverTitle = within(cover).getByRole('heading', {
      level: 2,
      name: lead.title,
    })
    expect(coverTitle.classList).not.toContain('qm-title-long')
    expect(links(cover)).toEqual([
      [lead.section!.name, lead.section!.href],
      [lead.title, lead.href],
    ])
    expect(cover.querySelectorAll('[aria-label], [tabindex]')).toHaveLength(0)
    expectInOrder(
      cover.querySelector('.qm-label'),
      coverTitle,
      cover.querySelector('.qm-plate-box'),
      cover.querySelector('.qm-dek'),
      cover.querySelector('.qm-meta'),
    )
    expect(cover.querySelector('.qm-dek')?.textContent).toBe(lead.dek)
    expect(cover.querySelector('.qm-meta time')?.getAttribute('datetime')).toBe(lead.publishedAt)
    expect(cover.querySelector('.qm-meta')?.textContent).toBe(
      `${formatPublishedDate(lead.publishedAt)} · ${lead.readingMinutes} min read`,
    )
    expect(cover.querySelector('.qm-meta [aria-hidden="true"]')?.textContent).toBe(' · ')
    const coverImage = cover.querySelector('.qm-plate-box picture img')!
    expect(coverImage.getAttribute('alt')).toBe(lead.image!.alt)
    expect(coverImage.getAttribute('fetchpriority')).toBe('high')
    expect(coverImage.getAttribute('sizes')).toBe(coverSizes)
    expect(cover.getAttribute('style')).toBe('--qm-fit:1;--qm-fit-sm:1')

    const rooms = main.querySelector<HTMLElement>('.qm-rooms')!
    const recentHeading = within(rooms).getByRole('heading', {
      level: 2,
      name: 'Recent stories',
    })
    expect(recentHeading.classList).toContain('qm-sr-only')
    const roomList = rooms.querySelector('ul')!
    expect(roomList.getAttribute('role')).toBe('list')
    const roomItems = [...roomList.children]
    expect(roomItems.map((room) => room.querySelector('h3')?.textContent)).toEqual(
      home.recent.slice(0, 3).map(({ title }) => title),
    )
    for (const [index, room] of roomItems.entries()) {
      const story = home.recent[index]!
      expect(room.tagName).toBe('LI')
      expect(links(room)).toEqual([
        [story.section!.name, story.section!.href],
        [story.title, story.href],
      ])
      expect(room.querySelector('.qm-plate-dek')?.textContent).toBe(story.dek)
      expectInOrder(
        story.image ? room.querySelector('.qm-plate-box') : room,
        room.querySelector('.qm-label'),
        room.querySelector('h3'),
        room.querySelector('.qm-plate-dek'),
        room.querySelector('.qm-meta'),
      )
      if (story.image) {
        expect(room.querySelector('img')?.getAttribute('loading')).toBe('lazy')
      } else {
        expect(room.classList).toContain('qm-plate-text')
        expect(room.querySelector('.qm-plate-box, img')).toBeNull()
        expect(room.hasAttribute('style')).toBe(false)
      }
    }
    const boathouse = roomItems[0]!
    expect(boathouse.getAttribute('style')).toBe('--qm-fit:1;--qm-fit-sm:1')
    expect(boathouse.querySelector('img')?.getAttribute('sizes')).toBe(roomSizes)
    const shelf = roomItems[2]!
    expect(shelf.getAttribute('style')).toBe('--qm-fit:0.8;--qm-fit-sm:1')
    expect(shelf.querySelector('img')?.getAttribute('sizes')).toBe(
      '(min-width: 800px) calc(46rem * 0.800), (min-width: 768px) calc(92vw * 0.800), (min-width: 500px) 92vw, calc(100vw - 2.5rem)',
    )

    const earlier = main.querySelector<HTMLElement>('.qm-earlier')!
    const earlierHeading = within(earlier).getByRole('heading', {
      level: 2,
      name: 'Earlier stories',
    })
    expect(earlierHeading.classList).toContain('qm-label')
    const rows = [...earlier.querySelectorAll('ul[role="list"] > li.qm-row')]
    expect(rows.map((row) => row.querySelector('h3')?.textContent)).toEqual(
      home.recent.slice(3).map(({ title }) => title),
    )
    for (const [index, row] of rows.entries()) {
      const story = home.recent[3 + index]!
      expect(links(row)).toEqual([
        [story.section!.name, story.section!.href],
        [story.title, story.href],
      ])
      expectInOrder(row.querySelector('.qm-row-label'), row.querySelector('h3'))
      expect(row.querySelector('.qm-meta')?.textContent).toBe(
        `${formatPublishedDate(story.publishedAt)} · ${story.readingMinutes} min read`,
      )
    }
    expect(earlier.querySelectorAll('img')).toHaveLength(0)
    expectInOrder(cover, rooms, earlier)
    expect(main.querySelectorAll('section[aria-label], section[aria-labelledby]')).toHaveLength(0)
    expect(document.querySelectorAll('link[rel="preload"][as="image"]')).toHaveLength(1)
  })

  it('sets long cover titles smaller and shows portrait plates whole at their own width', () => {
    const boathouse = cards.get('article-lab-boathouse')!
    expect(boathouse.title.length).toBeGreaterThan(80)
    const long = markup(<MonographHome view={{ ...home, lead: boathouse, recent: [] }} />)
    expect(long.document.querySelector('.qm-cover h2')?.classList).toContain('qm-title-long')
    const portrait = cards.get('article-lab-north-colour')!
    const tall = markup(<MonographHome view={{ ...home, lead: portrait, recent: [] }} />)
    const cover = tall.document.querySelector('.qm-cover')!
    expect(cover.getAttribute('style')).toBe('--qm-fit:0.533;--qm-fit-sm:1')
    const sizes =
      '(min-width: 1009px) calc(58rem * 0.533), (min-width: 768px) calc(92vw * 0.533), (min-width: 500px) 92vw, calc(100vw - 2.5rem)'
    expect(cover.querySelector('img')?.getAttribute('sizes')).toBe(sizes)
    expect(tall.document.querySelector('link[as="image"]')?.getAttribute('imagesizes')).toBe(sizes)
  })

  it('keeps the earlier checklist to nine stories', () => {
    const recent = moreStories(14)
    const { document } = markup(<MonographHome view={{ ...home, recent }} />)
    expect(document.querySelectorAll('.qm-rooms li')).toHaveLength(3)
    expect(
      [...document.querySelectorAll('.qm-earlier li h3')].map(({ textContent }) => textContent),
    ).toEqual(recent.slice(3, 12).map(({ title }) => title))
  })

  it('handles empty stores and image-free leads without inventing images or content', () => {
    const empty = markup(
      <MonographHome view={{ lead: null, navigation: { sections: [] }, recent: [] }} />,
    )
    expect(empty.screen.getByRole('heading', { level: 1 })).toHaveTextContent(siteName)
    expect(empty.screen.getByRole('heading', { level: 2, name: 'No stories yet' })).toBeTruthy()
    expect(
      empty.screen.getByText('New stories will appear here when they are published.'),
    ).toBeTruthy()
    expect(empty.document.querySelectorAll('img, .qm-cover, .qm-rooms, .qm-earlier')).toHaveLength(
      0,
    )
    expect(empty.document.querySelector('summary')?.textContent).toBe('Menu')
    for (const nav of empty.document.querySelectorAll('nav')) {
      expect(links(nav)).toEqual([['Front page', '/']])
    }
    expect(empty.document.querySelector('link[as="image"]')).toBeNull()

    const story = cards.get('article-lab-chair')!
    const textLead = markup(<MonographHome view={{ ...home, lead: story, recent: [] }} />)
    expect(textLead.screen.getByRole('heading', { level: 2, name: story.title })).toBeTruthy()
    expect(textLead.document.querySelector('.qm-cover.qm-cover-text')).toBeTruthy()
    expect(textLead.document.querySelectorAll('img, .qm-plate-box')).toHaveLength(0)
    expect(textLead.document.querySelector('.qm-cover')?.hasAttribute('style')).toBe(false)
    expect(textLead.document.querySelectorAll('.qm-rooms, .qm-earlier')).toHaveLength(0)
    expect(textLead.document.querySelector('link[as="image"]')).toBeNull()
  })

  it('discovers each page’s lead image early with the same responsive source and reserved dimensions', () => {
    const article = articles.get('article-lab-long-table')!
    // The author page leads with the latest story's picture, the topic page with its first plate's.
    const author = [...authors.values()].find(({ stories }) => stories[0]?.image)!
    const topic = [...topics.values()].find(({ stories }) => stories[0]?.image)!
    const cases = [
      { element: <MonographHome view={home} />, image: home.lead!.image! },
      { element: <MonographArticle view={article} />, image: article.hero! },
      { element: <MonographSection view={section} />, image: section.stories[0]!.image! },
      { element: <MonographAuthor view={author} />, image: author.stories[0]!.image! },
      { element: <MonographTopic view={topic} />, image: topic.stories[0]!.image! },
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
      const { document } = markup(<MonographArticle view={{ ...article, hero }} />)
      const image = document.querySelector('.qm-hero img')!
      const preloads = document.querySelectorAll('link[rel="preload"][as="image"]')
      expect(preloads).toHaveLength(1)
      expect(preloads[0]!.getAttribute('href')).toBe(hero.src)
      expect(preloads[0]!.getAttribute('type')).toBe(hero.contentType)
      expect(preloads[0]!.hasAttribute('imagesrcset')).toBe(false)
      expect(preloads[0]!.hasAttribute('imagesizes')).toBe(false)
      expect(document.querySelector('.qm-hero source')).toBeNull()
      expect(image.getAttribute('src')).toBe(hero.src)
      if (hero.width === null) {
        expect(image.hasAttribute('width')).toBe(false)
        expect(image.hasAttribute('height')).toBe(false)
        expect(image.closest('picture')!.parentElement!.className).toContain('aspect-[3/2]')
      }
    }
  })

  it('does not promote a later section image when the first story is text only', () => {
    const stories = [{ ...section.stories[0]!, image: null }, ...section.stories.slice(1)]
    const { document } = markup(<MonographSection view={{ ...section, stories }} />)
    expect(document.querySelector('link[as="image"]')).toBeNull()
    expect(document.querySelectorAll('main img').length).toBeGreaterThan(0)
    for (const image of document.querySelectorAll('main img')) {
      expect(image.getAttribute('loading')).toBe('lazy')
      expect(image.hasAttribute('fetchpriority')).toBe(false)
    }
    const article = articles.get('article-lab-long-table')!
    const noHero = markup(<MonographArticle view={{ ...article, hero: null }} />)
    expect(noHero.document.querySelector('link[as="image"]')).toBeNull()
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

  it('hangs a section’s first six stories in square bays under its header and count', () => {
    const { document, screen } = markup(<MonographSection view={section} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    const header = document.querySelector('.qm-section-header')!
    expect(header.querySelector('.qm-label')?.textContent).toBe('Section')
    expect(header.querySelector('h1')?.textContent).toBe('Interiors')
    expect(header.querySelector('.qm-dek')).toBeNull()
    expect(header.querySelector('.qm-meta')?.textContent).toBe('4 stories')
    expectInOrder(
      header.querySelector('.qm-label'),
      header.querySelector('h1'),
      header.querySelector('.qm-meta'),
    )
    const hang = document.querySelector('ul.qm-hang')!
    expect(hang.getAttribute('role')).toBe('list')
    const items = [...hang.children]
    expect(items.map((item) => item.querySelector('h2')?.textContent)).toEqual(
      section.stories.map(({ title }) => title),
    )
    for (const [index, item] of items.entries()) {
      const story = section.stories[index]!
      expect(links(item)).toEqual([[story.title, story.href]])
      expect(item.querySelector('.qm-label')).toBeNull()
      expectInOrder(
        item.querySelector('.qm-bay'),
        item.querySelector('h2'),
        item.querySelector('.qm-plate-dek'),
        item.querySelector('.qm-meta'),
      )
      expect(item.querySelector('.qm-bay picture img')?.getAttribute('alt')).toBe(story.image!.alt)
    }
    // Interiors, newest first: the boathouse (16:9), shelf (1:1), long table (3:2), north room (4:5).
    expect(items.map((item) => item.getAttribute('style'))).toEqual([
      '--qm-fit:1;--qm-fit-sm:1',
      '--qm-fit:1;--qm-fit-sm:1',
      '--qm-fit:1;--qm-fit-sm:1',
      '--qm-fit:0.8;--qm-fit-sm:1',
    ])
    expect(items[0]!.querySelector('img')?.getAttribute('sizes')).toBe(baySizes)
    expect(items[3]!.querySelector('img')?.getAttribute('sizes')).toBe(
      '(min-width: 1600px) calc(34rem * 0.800), (min-width: 1305px) calc((37.5rem - 3.5vw) * 0.800), (min-width: 768px) calc(42.5vw * 0.800), (min-width: 500px) 92vw, calc(100vw - 2.5rem)',
    )
    expect(document.querySelector('.qm-earlier')).toBeNull()
    expect(document.querySelectorAll('.qm-monogram')).toHaveLength(0)
  })

  it('gives an image-free story a monogram bay only when it shares a row', () => {
    // Craft: the chair (no image) is newest and shares the first row with the next story's plate.
    const { document } = markup(<MonographSection view={craft} />)
    const [chair, handle] = [...document.querySelectorAll('.qm-hang > li')]
    expect(chair!.classList).toContain('qm-plate-text')
    const monogram = chair!.querySelector('.qm-bay.qm-monogram')!
    expect(monogram.getAttribute('aria-hidden')).toBe('true')
    expect(monogram.textContent).toBe('N')
    expect(chair!.querySelector('img')).toBeNull()
    // Derive the neighbour's fit from its own image, so the test follows the sample content.
    const neighbour = craft.stories[1]!.image!
    const expectedStyle = Object.entries(plateStyle(plateFit(neighbour, 'bay')))
      .map(([property, value]) => `${property}:${value}`)
      .join(';')
    expect(handle!.getAttribute('style')).toBe(expectedStyle)
    expect(handle!.querySelector('img')?.getAttribute('loading')).toBe('lazy')
    expect(document.querySelector('link[as="image"]')).toBeNull()

    const alone = markup(<MonographSection view={{ ...craft, stories: [craft.stories[0]!] }} />)
    expect(alone.document.querySelector('.qm-section-header .qm-meta')?.textContent).toBe('1 story')
    expect(alone.document.querySelector('.qm-monogram')).toBeNull()
    const odd = markup(
      <MonographSection
        view={{ ...craft, stories: [...section.stories.slice(0, 2), craft.stories[0]!] }}
      />,
    )
    expect(odd.document.querySelector('.qm-monogram')).toBeNull()
    const pair = markup(
      <MonographSection
        view={{
          ...craft,
          stories: [craft.stories[0]!, { ...craft.stories[0]!, slug: 'other', title: '7 rooms' }],
        }}
      />,
    )
    expect(
      [...pair.document.querySelectorAll('.qm-monogram')].map((bay) => bay.textContent),
    ).toEqual(['N', '7'])
  })

  it('shows originals without stored dimensions whole in the shared 3:2 frame', () => {
    const portrait = section.stories[3]!
    const image = { ...portrait.image!, width: null, height: null }
    const { document } = markup(
      <MonographSection view={{ ...section, stories: [{ ...portrait, image }] }} />,
    )
    const item = document.querySelector('.qm-hang > li')!
    expect(item.getAttribute('style')).toBe('--qm-fit:1;--qm-fit-sm:1')
    const frame = item.querySelector('.qm-plate-box > div')!
    expect(frame.className).toContain('aspect-[3/2]')
    const img = frame.querySelector('picture img')!
    expect(img.hasAttribute('width')).toBe(false)
    expect(img.getAttribute('src')).toBe(image.src)
    expect(document.querySelector('link[as="image"]')?.getAttribute('href')).toBe(image.src)
  })

  it('lists stories after the sixth as dated checklist rows without the section', () => {
    const stories = moreStories(8)
    const { document, screen } = markup(<MonographSection view={{ ...section, stories }} />)
    expect(document.querySelector('.qm-section-header .qm-meta')?.textContent).toBe('8 stories')
    expect(document.querySelectorAll('.qm-hang > li')).toHaveLength(6)
    const earlier = document.querySelector('.qm-earlier')!
    const heading = screen.getByRole('heading', { level: 2, name: 'Earlier in Interiors' })
    expect(heading.classList).toContain('qm-label')
    expect(earlier.contains(heading)).toBe(true)
    const rows = [...earlier.querySelectorAll('ul[role="list"] > li.qm-row')]
    expect(rows).toHaveLength(2)
    for (const [index, row] of rows.entries()) {
      const story = stories[6 + index]!
      expect(row.querySelector('h3')?.textContent).toBe(story.title)
      expect(links(row)).toEqual([[story.title, story.href]])
      expect(row.querySelector('.qm-row-label time')?.getAttribute('datetime')).toBe(
        story.publishedAt,
      )
      expect(row.querySelector('.qm-meta')?.textContent).toBe(`${story.readingMinutes} min read`)
    }
    expect(earlier.querySelectorAll('img')).toHaveLength(0)
  })

  it('shows a section description, an empty state and the current section', () => {
    const described = markup(
      <MonographSection view={{ ...section, description: 'Rooms and the light in them.' }} />,
    )
    expect(described.document.querySelector('.qm-section-header .qm-dek')?.textContent).toBe(
      'Rooms and the light in them.',
    )
    const { document, screen } = markup(<MonographSection view={{ ...section, stories: [] }} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(section.name)
    expect(document.querySelector('.qm-section-header .qm-meta')?.textContent).toBe('No stories')
    expect(screen.getByText('No stories have been published in this section yet.')).toBeTruthy()
    expect(links(document.querySelector('.qm-section-empty')!)).toEqual([['Front page', '/']])
    expect(document.querySelectorAll('.qm-hang, .qm-earlier, img')).toHaveLength(0)
    expect(document.querySelector('link[as="image"]')).toBeNull()
    expect(
      [...document.querySelectorAll('nav [aria-current="page"]')].map((link) =>
        link.getAttribute('href'),
      ),
    ).toEqual([section.href, section.href, section.href])
  })

  it('opens an article with its plate, then the header, body, topics and Read next, in DOM order', () => {
    const view = articles.get('article-lab-long-table')!
    const { document, screen } = markup(<MonographArticle view={view} />)
    const article = document.querySelector('main > article')!
    const hero = article.querySelector<HTMLElement>('.qm-hero')!
    const header = article.querySelector<HTMLElement>('header.qm-article-header')!
    const body = article.querySelector('.qm-body')
    const end = article.querySelector<HTMLElement>('footer.qm-end')!
    const readNext = document.querySelector<HTMLElement>('main > section.qm-read-next')!
    expectInOrder(hero, header, body, end, readNext)

    // The plate: the hero whole in the cover's box, preloaded, with its caption as a wall label.
    const { sizes, style } = slotted(view.hero!, 'cover')
    expect(hero.getAttribute('style')).toBe(style)
    const image = hero.querySelector('figure picture img')!
    expect(image.getAttribute('sizes')).toBe(sizes)
    expect(image.getAttribute('fetchpriority')).toBe('high')
    expect(hero.querySelector('figure > figcaption')?.textContent).toContain(view.hero!.caption)
    // Its only focusable content is a credit link.
    expect(hero.querySelectorAll('a')).toHaveLength(view.hero!.credit?.url ? 1 : 0)
    const preloads = document.querySelectorAll('link[rel="preload"][as="image"]')
    expect(preloads).toHaveLength(1)
    expect(preloads[0]!.getAttribute('imagesizes')).toBe(sizes)

    // The header: section label, title, dek, byline and meta line.
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    const title = within(header).getByRole('heading', { level: 1, name: view.title })
    expect(title.classList).not.toContain('qm-title-long')
    expectInOrder(
      header.querySelector('.qm-label'),
      title,
      header.querySelector('.qm-dek'),
      header.querySelector('.qm-byline'),
      header.querySelector('.qm-meta'),
    )
    expect(links(header.querySelector('.qm-label')!)).toEqual([
      [view.section!.name, view.section!.href],
    ])
    expect(header.querySelector('.qm-dek')?.textContent).toBe(view.dek)
    expect(header.querySelector('.qm-meta')?.textContent).toBe(
      `${formatPublishedDate(view.publishedAt)} · ${view.readingMinutes} min read`,
    )
    expect(header.querySelector('.qm-meta time')?.getAttribute('datetime')).toBe(view.publishedAt)

    // End matter: the topics in the story's order, as a list of links.
    const topicsHeading = within(end).getByRole('heading', { level: 2, name: 'Topics' })
    expect(topicsHeading.classList).toContain('qm-label')
    const topicList = end.querySelector('ul')!
    expect(topicList.getAttribute('role')).toBe('list')
    expect(links(topicList)).toEqual(view.topics.map(({ href, name }) => [name, href]))

    // Read next: the first related story as a room with an h3, the rest as checklist rows.
    const readNextHeading = within(readNext).getByRole('heading', { level: 2, name: 'Read next' })
    expect(readNextHeading.classList).toContain('qm-label')
    const list = readNext.querySelector('ul')!
    expect(list.getAttribute('role')).toBe('list')
    const [room, ...rows] = [...list.children]
    const [next, ...more] = view.related
    expect(room!.classList).toContain('qm-room')
    expect(room!.querySelector('h3')?.textContent).toBe(next!.title)
    expect(links(room!)).toEqual(storyLinks(next!))
    if (next!.image) {
      const roomImage = room!.querySelector('picture img')!
      expect(room!.getAttribute('style')).toBe(slotted(next!.image, 'room').style)
      expect(roomImage.getAttribute('sizes')).toBe(slotted(next!.image, 'room').sizes)
      expect(roomImage.getAttribute('loading')).toBe('lazy')
    }
    expect(rows.map(({ className }) => className)).toEqual(more.map(() => 'qm-row'))
    expect(rows.map((row) => row.querySelector('h3')?.textContent)).toEqual(
      more.map(({ title }) => title),
    )
    rows.forEach((row, index) => expect(links(row)).toEqual(storyLinks(more[index]!)))
    expect(readNext.querySelectorAll('.qm-row img')).toHaveLength(0)
    // Headings under the h1: the story's own, then Topics and Read next, without new landmarks.
    expect(
      [...document.querySelectorAll('main h2')].slice(-2).map(({ textContent }) => textContent),
    ).toEqual(['Topics', 'Read next'])
    for (const part of [end, readNext]) {
      expect(part.matches('[aria-label], [aria-labelledby]')).toBe(false)
    }
  })

  it('credits the authors as links joined as an English list, and leaves out an empty byline', () => {
    for (const story of labStories) {
      const view = articles.get(story.id)!
      // The view keeps the sample's byline order.
      expect(view.authorLinks).toEqual(
        story.authors.map((slug) => ({
          href: authorPath(slug),
          name: labAuthors.find((author) => author.slug === slug)!.name,
        })),
      )
      const { document } = markup(<MonographArticle view={view} />)
      const byline = document.querySelector('.qm-article-header .qm-byline')!
      expect(byline.textContent).toBe(
        `By ${new Intl.ListFormat('en', { type: 'conjunction' }).format(view.authors)}`,
      )
      expect(links(byline)).toEqual(view.authorLinks.map(({ href, name }) => [name, href]))
    }
    const credits = labAuthors.map(({ name, slug }) => ({ href: authorPath(slug), name }))
    const [first, second, third] = credits.map(({ name }) => name)
    const view = articles.get('article-lab-long-table')!
    for (const [count, byline] of [
      [1, `By ${first}`],
      [2, `By ${first} and ${second}`],
      [3, `By ${first}, ${second}, and ${third}`],
    ] as const) {
      const authorLinks = credits.slice(0, count)
      const { document } = markup(
        <MonographArticle
          view={{ ...view, authorLinks, authors: authorLinks.map(({ name }) => name) }}
        />,
      )
      expect(document.querySelector('.qm-byline')?.textContent).toBe(byline)
      expect(document.querySelectorAll('.qm-byline a')).toHaveLength(count)
    }
    const { document } = markup(
      <MonographArticle view={{ ...view, authorLinks: [], authors: [] }} />,
    )
    expect(document.querySelector('.qm-byline')).toBeNull()
    expect(document.querySelector('.qm-article-header')?.textContent).not.toMatch(/\bBy\b/)
  })

  it('sizes long titles down, opens image-free stories with the header, and shows 4:5 heroes whole', () => {
    const boathouse = articles.get('article-lab-boathouse')!
    expect([...boathouse.title].length).toBeGreaterThan(80)
    expect(
      markup(<MonographArticle view={boathouse} />).document.querySelector('h1')?.classList,
    ).toContain('qm-title-long')

    const chair = articles.get('article-lab-chair')!
    expect(chair.hero).toBeNull()
    const text = markup(<MonographArticle view={chair} />)
    const article = text.document.querySelector('article')!
    expect(article.classList).toContain('qm-article-text')
    expect(article.firstElementChild?.matches('header.qm-article-header')).toBe(true)
    expect(text.document.querySelectorAll('.qm-hero, link[as="image"]')).toHaveLength(0)

    // Spec section 6's worked example: a 4:5 hero is drawn at 0.533 of the box from 768px.
    const portraits = [...articles.values()].filter(
      ({ hero }) => hero?.width && hero.height && hero.width * 5 === hero.height * 4,
    )
    expect(portraits.length).toBeGreaterThan(0)
    const sizes =
      '(min-width: 1009px) calc(58rem * 0.533), (min-width: 768px) calc(92vw * 0.533), (min-width: 500px) 92vw, calc(100vw - 2.5rem)'
    for (const view of portraits) {
      const { document } = markup(<MonographArticle view={view} />)
      expect(document.querySelector('.qm-hero')?.getAttribute('style')).toBe(
        '--qm-fit:0.533;--qm-fit-sm:1',
      )
      expect(document.querySelector('.qm-hero img')?.getAttribute('sizes')).toBe(sizes)
      expect(document.querySelector('link[as="image"]')?.getAttribute('imagesizes')).toBe(sizes)
    }
  })

  it('leaves out topics and Read next when a story has none, and never promotes a Read next picture', () => {
    const view = articles.get('article-lab-long-table')!
    const bare = markup(<MonographArticle view={{ ...view, related: [], topics: [] }} />)
    expect(bare.document.querySelectorAll('.qm-end, .qm-read-next')).toHaveLength(0)
    expect(bare.screen.queryByRole('heading', { name: 'Topics' })).toBeNull()
    expect(bare.screen.queryByRole('heading', { name: 'Read next' })).toBeNull()

    // A single related story is a room alone; one without a picture is a text room.
    const chair = cards.get('article-lab-chair')!
    const single = markup(<MonographArticle view={{ ...view, related: [chair] }} />)
    const items = single.document.querySelectorAll('.qm-read-next li')
    expect(items).toHaveLength(1)
    expect(items[0]!.classList).toContain('qm-plate-text')
    expect(single.document.querySelectorAll('.qm-read-next :is(img, .qm-row)')).toHaveLength(0)

    const { document } = markup(<MonographArticle view={view} />)
    expect(document.querySelectorAll('.qm-read-next img').length).toBeGreaterThan(0)
    for (const image of document.querySelectorAll('.qm-read-next img')) {
      expect(image.getAttribute('loading')).toBe('lazy')
      expect(image.hasAttribute('fetchpriority')).toBe(false)
    }
  })

  it('registers its author and topic pages and passes its body and gallery sizes to ArticleBody', () => {
    expect(quietMonographDirection.Author).toBe(MonographAuthor)
    expect(quietMonographDirection.Topic).toBe(MonographTopic)
    expect(quietMonographDirection.imageSizes).toEqual({ body: figureSizes, gallery: figureSizes })
    const view = articles.get('article-lab-long-table')!
    const { document } = markup(<quietMonographDirection.Article view={view} />)
    expect(document.querySelector('.qm-body [data-block="gallery"] img')).toBeTruthy()
    const bodyImages = [...document.querySelectorAll('.qm-body img')]
    expect(bodyImages.length).toBeGreaterThan(1)
    for (const image of bodyImages) {
      expect(image.getAttribute('sizes')).toBe(figureSizes)
      for (const source of image.closest('picture')!.querySelectorAll('source')) {
        expect(source.getAttribute('sizes')).toBe(figureSizes)
      }
    }
    // The hero keeps its own plate sizes.
    expect(document.querySelector('.qm-hero img')?.getAttribute('sizes')).toBe(
      slotted(view.hero!, 'cover').sizes,
    )
  })

  it('sets an author page as a header, the latest story as a room, and the rest as rows', () => {
    for (const author of labAuthors) {
      const view = authors.get(author.slug)!
      const credited = labStories.filter(({ authors }) => authors.includes(author.slug))
      expect(view.stories.map(({ slug }) => slug)).toEqual(credited.map(labStorySlug))
      const { document, screen } = markup(<MonographAuthor view={view} />)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      const header = document.querySelector<HTMLElement>('header.qm-author-header')!
      expect(header.querySelector('.qm-label')?.textContent).toBe('Author')
      expect(within(header).getByRole('heading', { level: 1 }).textContent).toBe(author.name)
      // No invented biographies: the guest contributor has none.
      expect(header.querySelector('.qm-bio')?.textContent ?? null).toBe(author.bio || null)
      expect(header.querySelector('.qm-meta')?.textContent).toBe(countLine(credited.length))
      expectInOrder(
        header.querySelector('.qm-label'),
        header.querySelector('h1'),
        ...(author.bio ? [header.querySelector('.qm-bio')] : []),
        header.querySelector('.qm-meta'),
      )

      const [latest, ...more] = view.stories
      const room = document.querySelector<HTMLElement>('main ul[role="list"] > li.qm-room')!
      expect(within(room).getByRole('heading', { level: 2 }).textContent).toBe(latest!.title)
      expect(links(room)).toEqual(storyLinks(latest!))
      const preload = document.querySelector('link[rel="preload"][as="image"]')
      if (latest!.image) {
        const { sizes, style } = slotted(latest!.image, 'room')
        expect(room.getAttribute('style')).toBe(style)
        expect(room.querySelector('img')?.getAttribute('sizes')).toBe(sizes)
        expect(room.querySelector('img')?.getAttribute('fetchpriority')).toBe('high')
        expect(preload?.getAttribute('imagesizes')).toBe(sizes)
      } else {
        expect(room.classList).toContain('qm-plate-text')
        expect(preload).toBeNull()
      }
      expect(document.querySelectorAll('main img')).toHaveLength(latest!.image ? 1 : 0)

      const earlier = document.querySelector<HTMLElement>('.qm-earlier')
      expect(Boolean(earlier)).toBe(more.length > 0)
      if (!earlier) continue
      const moreHeading = within(earlier).getByRole('heading', {
        level: 2,
        name: `More by ${author.name}`,
      })
      expect(moreHeading.classList).toContain('qm-label')
      const rows = [...earlier.querySelectorAll('ul[role="list"] > li.qm-row')]
      expect(rows.map((row) => row.querySelector('h3')?.textContent)).toEqual(
        more.map(({ title }) => title),
      )
      rows.forEach((row, index) => expect(links(row)).toEqual(storyLinks(more[index]!)))
      expectInOrder(header, room, earlier)
    }
  })

  it('gives an author with one story no list after it, and one with none an empty state', () => {
    const view = authors.get(labAuthors[0]!.slug)!
    const one = markup(<MonographAuthor view={{ ...view, stories: view.stories.slice(0, 1) }} />)
    expect(one.document.querySelector('.qm-meta')?.textContent).toBe('1 story')
    expect(one.document.querySelectorAll('.qm-room')).toHaveLength(1)
    expect(one.document.querySelector('.qm-earlier')).toBeNull()

    const { document, screen } = markup(
      <MonographAuthor view={{ ...view, bio: null, stories: [] }} />,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(view.name)
    expect(document.querySelector('.qm-meta')?.textContent).toBe('No stories')
    expect(screen.getByText(`No published stories by ${view.name} yet.`)).toBeTruthy()
    expect(links(document.querySelector('.qm-section-empty')!)).toEqual([['Front page', '/']])
    expect(
      document.querySelectorAll('.qm-bio, .qm-room, .qm-earlier, img, link[as="image"]'),
    ).toHaveLength(0)
    expect(document.querySelectorAll('nav [aria-current]')).toHaveLength(0)
  })

  it('hangs a topic’s stories like a section’s, keeping their section labels across sections', () => {
    for (const topic of labTopics) {
      const view = topics.get(topic.slug)!
      const filed = labStories.filter(({ topics }) => topics.includes(topic.slug))
      expect(view.stories.map(({ slug }) => slug)).toEqual(filed.map(labStorySlug))
      const { document, screen } = markup(<MonographTopic view={view} />)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      const header = document.querySelector('header.qm-section-header')!
      expect(header.querySelector('.qm-label')?.textContent).toBe('Topic')
      expect(header.querySelector('h1')?.textContent).toBe(topic.name)
      // Topics have no stored description yet, and none is invented.
      expect(header.querySelector('.qm-dek')).toBeNull()
      expect(header.querySelector('.qm-meta')?.textContent).toBe(countLine(filed.length))

      const hung = view.stories.slice(0, 6)
      const items = [...document.querySelectorAll('ul.qm-hang[role="list"] > li')]
      expect(items.map((item) => item.querySelector('h2')?.textContent)).toEqual(
        hung.map(({ title }) => title),
      )
      items.forEach((item, index) => {
        const story = hung[index]!
        expect(links(item)).toEqual(storyLinks(story))
        expectInOrder(
          item.querySelector('.qm-bay') ?? item,
          item.querySelector('.qm-label'),
          item.querySelector('h2'),
          item.querySelector('.qm-meta'),
        )
        const sharesRow = index % 2 === 1 || index + 1 < hung.length
        expect(item.querySelector('.qm-monogram') !== null).toBe(!story.image && sharesRow)
      })
      const first = view.stories[0]!
      expect(
        document.querySelector('link[rel="preload"][as="image"]')?.getAttribute('imagesizes') ??
          null,
      ).toBe(first.image ? slotted(first.image, 'bay').sizes : null)
      // A topic is not a section: no navigation link is current.
      expect(document.querySelectorAll('nav [aria-current]')).toHaveLength(0)
    }
  })

  it('lists a topic’s stories after the sixth as rows with section labels, and handles empty topics', () => {
    const view = topics.get(labTopics[0]!.slug)!
    const stories = moreStories(8)
    const described = 'Low sun, long shadows and the rooms that hold them.'
    const { document, screen } = markup(
      <MonographTopic view={{ ...view, description: described, stories }} />,
    )
    expect(document.querySelector('.qm-section-header .qm-dek')?.textContent).toBe(described)
    expect(document.querySelector('.qm-section-header .qm-meta')?.textContent).toBe('8 stories')
    expect(document.querySelectorAll('.qm-hang > li')).toHaveLength(6)
    const heading = screen.getByRole('heading', { level: 2, name: `Earlier in ${view.name}` })
    expect(heading.classList).toContain('qm-label')
    const rows = [...document.querySelectorAll('.qm-earlier ul[role="list"] > li.qm-row')]
    expect(rows).toHaveLength(2)
    rows.forEach((row, index) => {
      const story = stories[6 + index]!
      expect(links(row)).toEqual(storyLinks(story))
      expect(row.querySelector('.qm-meta')?.textContent).toBe(
        `${formatPublishedDate(story.publishedAt)} · ${story.readingMinutes} min read`,
      )
    })

    const empty = markup(<MonographTopic view={{ ...view, stories: [] }} />)
    expect(empty.screen.getByRole('heading', { level: 1 })).toHaveTextContent(view.name)
    expect(empty.document.querySelector('.qm-section-header .qm-meta')?.textContent).toBe(
      'No stories',
    )
    expect(empty.screen.getByText('No published stories on this topic yet.')).toBeTruthy()
    expect(links(empty.document.querySelector('.qm-section-empty')!)).toEqual([['Front page', '/']])
    expect(
      empty.document.querySelectorAll('.qm-hang, .qm-earlier, img, link[as="image"]'),
    ).toHaveLength(0)
  })

  it('styles the article plate, header and end matter, and every editorial block, to the spec', () => {
    // The hero: whole in the cover's box, at its fit share of the box width.
    expect(declarations('& .qm-hero')).toMatchObject({ width: 'min(100%, 58rem)' })
    expect(declarations('& .qm-hero picture img')).toMatchObject({
      height: 'auto',
      width: 'calc(var(--qm-fit-sm, 1) * 100%)',
      'box-shadow': 'var(--qm-print)',
    })
    expect(declarations('& .qm-hero picture img', '(min-width: 768px)')).toMatchObject({
      width: 'calc(var(--qm-fit, 1) * 100%)',
    })
    expect(declarations('& .qm-hero figure > div picture img')).toMatchObject({
      'object-fit': 'contain',
      'object-position': '50% 50% !important',
    })
    // Header: titles at most 14em, the long-title size, and author names as links in ink.
    expect(declarations('& .qm-article-header h1')).toMatchObject({
      'font-size': 'var(--qm-title)',
      'line-height': '1.05',
      'max-width': '14em',
    })
    expect(declarations('& .qm-page .qm-title-long')).toMatchObject({
      'font-size': 'var(--qm-title-long)',
    })
    expect(declarations('& .qm-byline')).toMatchObject({
      color: 'var(--qm-stone-ink)',
      'font-size': 'var(--qm-small)',
    })
    expect(declarations('& .qm-byline a')).toMatchObject({
      color: 'var(--qm-ink)',
      'text-decoration': 'underline',
    })
    // End matter under a centred 4rem stone rule, with 44px topic links; no Read next in print.
    expect(declarations('& .qm-end::before')).toMatchObject({
      'border-top': '1px solid var(--qm-stone)',
      width: '4rem',
    })
    // Topics take the navigation's label-style links: 44px targets in a wrapping, centred row.
    expect(declarations('& :is(.qm-nav-row, .qm-footer, .qm-end) a')).toMatchObject({
      'min-height': '44px',
      'min-width': '44px',
      'text-transform': 'uppercase',
    })
    expect(declarations('& :is(.qm-nav-row, .qm-footer, .qm-end) ul')).toMatchObject({
      'flex-wrap': 'wrap',
      'justify-content': 'center',
    })
    expect(declarations('& .qm-read-next', 'print')).toMatchObject({ display: 'none' })
    // Author pages: the name at the title size, the bio at most 24em.
    expect(declarations('& .qm-author-header h1')).toMatchObject({ 'font-size': 'var(--qm-title)' })
    expect(declarations('& .qm-page .qm-bio')).toMatchObject({ 'max-width': '24em' })

    // Body: figures whole and at most 85svh high; two-up galleries in square bays from 768px.
    expect(declarations('& .qm-body figure img')).toMatchObject({
      background: 'transparent',
      'max-height': '85svh',
      'object-fit': 'contain',
    })
    expect(
      declarations(
        "& .qm-body [data-block='gallery']:not([data-layout='carousel']) img",
        '(min-width: 768px)',
      ),
    ).toMatchObject({ 'aspect-ratio': '1', 'object-position': '50% 100%' })
    expect(declarations('& .qm-page figure:has(picture) > figcaption')).toMatchObject({
      'max-width': '34em',
      'text-align': 'center',
    })
    // Headings keep 1.25rem below them: the next block does not add its own space.
    expect(declarations('& .qm-body :is(h2, h3, h4, h5, h6) + *')).toMatchObject({
      'margin-top': '0',
    })
    expect(declarations("& .qm-body [data-block='pull-quote'] blockquote")).toMatchObject({
      'font-family': 'var(--qm-display)',
      'font-size': 'var(--qm-heading)',
      'font-style': 'italic',
    })
    // Labels, attributions and editorial names share the label style.
    for (const selector of [
      "& .qm-body [data-block='pull-quote'] figcaption",
      "& .qm-body [data-block='callout'] > p:first-child > strong",
      "& .qm-body [data-block='editorial']::before",
    ]) {
      expect(declarations(selector), selector).toMatchObject(declarations('& .qm-page .qm-label'))
    }
    // Lists: the reset never reaches a typed list, so each keeps its own marker (1, a, A, i, I).
    expect(declarations('& .qm-page :where(ul, ol:not([type]))')).toMatchObject({
      'list-style': 'none',
    })
    expect(declarations('& .qm-body ol:not([type])')).toMatchObject({
      'list-style-type': 'decimal',
    })
    expect(declarations('& .qm-body li::marker')).toMatchObject({ color: 'var(--qm-stone-ink)' })
    styleRules.walkRules((rule) => {
      // Attribute selectors match `type` case-insensitively, so ol[type='a'] also matches "A".
      expect(rule.selector, rule.selector).not.toMatch(/\[type\s*=/)
    })
    styleRules.walkDecls((declaration) => {
      // DOM, focus and visual order agree: nothing is reordered.
      expect(declaration.prop, declaration.parent?.toString()).not.toBe('order')
    })
    // Checklist boxes drawn in ink in place of the glyphs, ticked with two borders when done.
    expect(
      declarations("& .qm-body [data-block='checklist'] li > span[aria-hidden]"),
    ).toMatchObject({
      border: '1px solid var(--qm-ink)',
      color: 'transparent',
      height: '0.85em',
      width: '0.85em',
    })
    expect(
      declarations("& .qm-body [data-checked='true'] > span[aria-hidden]::after"),
    ).toMatchObject({ 'border-width': '0 1px 1px 0', content: "''" })
    // Callouts differ by line weight and by their label, not by colour.
    expect(declarations("& .qm-body [data-block='callout'][data-variant='warning']")).toMatchObject(
      { border: '2px solid var(--qm-ink)' },
    )
    // Editorial blocks name themselves once: the visible label has an empty alternative.
    expect(declarations("& .qm-body [data-block='editorial']::before")).toMatchObject({
      content: "attr(aria-label) / ''",
      display: 'block',
    })
    expect(declarations("& .qm-body [data-variant='key-points']")).toMatchObject({
      'border-inline': '0',
    })
    expect(declarations("& .qm-body [data-variant='methodology']")).toMatchObject({
      color: 'var(--qm-stone-ink)',
      'font-size': 'var(--qm-copy)',
    })
    expect(declarations("& .qm-body [data-block='embed'] a")).toMatchObject({
      'font-family': 'var(--qm-display)',
      'font-size': 'var(--qm-card)',
      'min-height': '44px',
    })
    expect(declarations('& .qm-body u')).toMatchObject({
      'text-decoration': 'underline dotted var(--qm-stone)',
    })
  })

  it('renders every numbered-list type with its own marker, inline, through the direction', () => {
    const view = articles.get('article-lab-long-table')!
    const numbering = ['1', 'a', 'A', 'i', 'I'] as const
    const body: ArticleBlock[] = numbering.map((type) => ({
      items: [{ blocks: [{ content: [], kind: 'paragraph' }] }],
      kind: 'numbered-list',
      numbering: type,
      start: 1,
    }))
    const { document } = markup(<quietMonographDirection.Article view={{ ...view, body }} />)
    expect(
      [...document.querySelectorAll('.qm-body ol')].map((list) => [
        list.getAttribute('type'),
        (list as HTMLElement).style.listStyleType,
      ]),
    ).toEqual([
      ['1', 'decimal'],
      ['a', 'lower-alpha'],
      ['A', 'upper-alpha'],
      ['i', 'lower-roman'],
      ['I', 'upper-roman'],
    ])
  })
})
