// @vitest-environment jsdom
import { within } from '@testing-library/dom'
import postcss, { type AtRule } from 'postcss'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import { beforeAll, describe, expect, it } from 'vitest'

import { siteName } from '@/reader/components/site-header'
import { formatPublishedDate } from '@/reader/format'
import { readArticleView, readHomeView, readSectionView } from '@/reader/read-model'
import type { ArticleView, HomeView, SectionView, StoryCard } from '@/reader/views'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { InMemoryOriginalObjectStore } from '@/server/content/media'
import { labStories } from '@/server/lab/north-house'
import { labStorySlug, seedLabContent } from '@/server/lab/seed'

import { readerDirectionStyleCss, readerDirectionTokenCss } from '../contract'
import { contrastRatio } from '../contrast'
import { MonographArticle } from './article'
import { plateFit, plateStyle } from './fit'
import { MonographHome } from './home'
import { quietMonographDirection } from './index'
import { MonographSection } from './section'
import { tokens } from './tokens'

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

describe('Quiet Monograph with real published North House content', () => {
  let home: HomeView
  let section: SectionView
  let craft: SectionView
  const articles = new Map<string, ArticleView>()
  const cards = new Map<string, StoryCard>()

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
    // Only genuine italics and weights: nothing on the page lets the browser fake a face.
    expect(declarations('& .qm-page')).toMatchObject({ 'font-synthesis': 'none' })
    styleRules.walkDecls((declaration) => {
      expect(`${declaration.prop}: ${declaration.value}`).not.toMatch(
        /^object-fit: cover|^font-weight: 300|^color-scheme: light|^font-synthesis(?!: none$)/,
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
    const cases = [
      { element: <MonographHome view={home} />, image: home.lead!.image! },
      { element: <MonographArticle view={article} />, image: article.hero! },
      { element: <MonographSection view={section} />, image: section.stories[0]!.image! },
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
})
