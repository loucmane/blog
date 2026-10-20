// @vitest-environment jsdom
import { within } from '@testing-library/dom'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import { beforeAll, describe, expect, it } from 'vitest'

import { siteName } from '@/reader/components/site-header'
import { formatPublishedDate, formatReadingTime } from '@/reader/format'
import { readArticleView, readHomeView, readSectionView } from '@/reader/read-model'
import type { ArticleView, HomeView, ReaderImage, SectionView } from '@/reader/views'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { InMemoryOriginalObjectStore } from '@/server/content/media'
import { labStories } from '@/server/lab/north-house'
import { labStorySlug, seedLabContent } from '@/server/lab/seed'

import { defineReaderDirection } from '../contract'
import { contrastRatio } from '../contrast'
import { SwissArticle } from './article'
import { SwissHome } from './home'
import { swissIndexDirection } from './index'
import { SwissSection } from './section'
import { cardSizes, leadSizes } from './story-card'
import { tokens } from './tokens'

function markup(element: ReactNode) {
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(element)
  return { document: container, screen: within(container) }
}

/** Every link in `root` that points to `href`. */
function linksTo(root: Element, href: string) {
  return [...root.querySelectorAll('a')].filter((link) => link.getAttribute('href') === href)
}

/** Name and target of every link in a navigation, in order. */
function navLinks(navigation: HTMLElement) {
  return within(navigation)
    .getAllByRole('link')
    .map((link) => ({ href: link.getAttribute('href'), name: link.textContent }))
}

/** The inline focal point a cropping cell sets for its image. */
function focus(image: ReaderImage) {
  const percent = (value: number) => `${Number((value * 100).toFixed(2))}%`
  return `--si-focus:${percent(image.focalPoint.x)} ${percent(image.focalPoint.y)}`
}

function follows(first: Element, second: Element) {
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING)
}

/**
 * The section a level-2 heading names. A detached container cannot resolve `aria-labelledby`
 * for a role query, so the link from section to heading is asserted directly.
 */
function regionNamedBy(screen: ReturnType<typeof within>, name: string) {
  const heading = screen.getByRole('heading', { level: 2, name })
  const region = heading.closest('section')!
  expect(region).toHaveAttribute('aria-labelledby', heading.id)
  return region
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

  it('declares the developed type scale and the plate surface, with its text pairs checked at registration', () => {
    expect(tokens.light).toMatchObject({
      '--si-paper': '#FFFFFF',
      '--si-ink': '#0E0E0E',
      '--si-secondary': '#6A6A6A',
      '--si-signal': '#FF4F1F',
      '--si-signal-ink': '#0E0E0E',
      '--si-plate': '#F2F2F2',
      '--si-label': '0.75rem',
      '--si-small': '0.8125rem',
      '--si-copy': '1rem',
      '--si-body': 'clamp(1.125rem, 1rem + 0.5vw, 1.25rem)',
      '--si-card': 'clamp(1.5rem, 1.15rem + 1vw, 2.125rem)',
      '--si-dek': 'clamp(1.25rem, 1rem + 0.8vw, 1.75rem)',
      '--si-heading': 'clamp(2rem, 1.25rem + 2vw, 3.25rem)',
      '--si-title': 'clamp(2.5rem, 1rem + 5.5vw, 6rem)',
      '--si-title-long': 'clamp(2rem, 1rem + 3vw, 3.75rem)',
      '--si-wordmark': 'clamp(2rem, 3.1vw, 2.875rem)',
      '--si-plate-number': 'clamp(4rem, 2rem + 6vw, 7.5rem)',
    })
    // Signal and signal ink keep their light values in dark mode.
    expect(tokens.dark).toEqual({
      '--si-paper': '#000000',
      '--si-ink': '#F5F5F0',
      '--si-secondary': '#A6A6A6',
      '--si-plate': '#1A1A1A',
    })
    const ratios = [
      ['--si-ink', '--si-paper', 19.3, 19.2],
      ['--si-secondary', '--si-paper', 5.41, 8.63],
      ['--si-signal-ink', '--si-signal', 5.87, 5.87],
      ['--si-ink', '--si-plate', 17.24, 15.91],
      ['--si-secondary', '--si-plate', 4.83, 7.15],
    ] as const
    expect(tokens.textPairs).toEqual(ratios.map(([text, background]) => [text, background]))
    const dark = { ...tokens.light, ...tokens.dark }
    for (const [text, background, light, inDark] of ratios) {
      expect(contrastRatio(tokens.light[text], tokens.light[background])).toBeCloseTo(light, 1)
      expect(contrastRatio(dark[text], dark[background])).toBeCloseTo(inDark, 1)
    }
    expect(() => defineReaderDirection(swissIndexDirection)).not.toThrow()
    expect(swissIndexDirection.tokens?.textPairs).toHaveLength(5)
  })

  it('frames the front page with a skip link, the masthead, the Theme control and both indexes', () => {
    const { document, screen } = markup(<SwissHome view={home} />)
    const [skip] = screen.getAllByRole('link')
    expect(skip).toHaveTextContent('Skip to content')
    expect(skip).toHaveAttribute('href', '#si-main')
    const main = document.querySelector('main')!
    expect(document.querySelectorAll('main')).toHaveLength(1)
    expect(main).toHaveAttribute('id', 'si-main')
    expect(main).toHaveAttribute('tabindex', '-1')

    const masthead = document.querySelector('.si-page > header')!
    const wordmark = within(masthead as HTMLElement).getByRole('heading', { level: 1 })
    expect(wordmark).toHaveTextContent(siteName)
    expect(within(wordmark).getByRole('link')).toHaveAttribute('href', '/')
    const theme = within(masthead as HTMLElement).getByRole('button', {
      name: 'Choose color theme',
    })
    const sections = within(masthead as HTMLElement).getByRole('navigation', { name: 'Sections' })
    // Row 1 is the wordmark and the Theme control; row 2 the section index.
    expect(follows(wordmark, theme)).toBe(true)
    expect(follows(theme, sections)).toBe(true)
    const index = [
      { href: '/', name: 'Front page' },
      ...home.navigation.sections.map(({ href, name }) => ({ href, name })),
    ]
    expect(navLinks(sections)).toEqual(index)
    const frontPage = within(sections).getByRole('link', { name: 'Front page' })
    expect(frontPage).toHaveAttribute('aria-current', 'page')
    expect(frontPage.closest('li')).toHaveAttribute('data-current')
    expect(sections.querySelectorAll('[aria-current]')).toHaveLength(1)
    expect(sections.querySelectorAll('[data-current]')).toHaveLength(1)

    const footer = document.querySelector('.si-page > footer')!
    expect(footer).toHaveTextContent(siteName)
    const siteIndex = within(footer as HTMLElement).getByRole('navigation', { name: 'Site index' })
    expect(navLinks(siteIndex)).toEqual(index)
    const top = within(footer as HTMLElement).getByRole('link', { name: 'Back to top' })
    const anchor = document.querySelector(top.getAttribute('href')!)
    expect(anchor).toBe(document.querySelector('.si-page'))
    expect(anchor?.contains(main)).toBe(true)
    expect(follows(main, footer)).toBe(true)
    expect(document.textContent).not.toMatch(/All stories|Skip to stories/)
  })

  it('marks the current section in both indexes and sets the wordmark as a paragraph off the front page', () => {
    const { document, screen } = markup(<SwissSection view={section} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    const masthead = document.querySelector('.si-page > header')!
    expect(within(masthead as HTMLElement).queryByRole('heading')).toBeNull()
    expect(masthead.querySelector('p.si-wordmark a[href="/"]')).toHaveTextContent(siteName)
    expect(
      within(masthead as HTMLElement).getByRole('button', { name: 'Choose color theme' }),
    ).toBeTruthy()
    for (const name of ['Sections', 'Site index']) {
      const navigation = screen.getByRole('navigation', { name })
      const current = within(navigation).getByRole('link', { name: section.name })
      expect(current).toHaveAttribute('aria-current', 'page')
      expect(current.closest('li')).toHaveAttribute('data-current')
      expect(within(navigation).getByRole('link', { name: 'Front page' })).not.toHaveAttribute(
        'aria-current',
      )
      expect(navigation.querySelectorAll('[aria-current]')).toHaveLength(1)
    }
  })

  it('sets the cover as a numbered list of three plates with one story link each and hidden numbers', () => {
    const { document, screen } = markup(<SwissHome view={home} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(siteName)
    const cover = screen.getByRole('list', { name: 'Latest stories' })
    expect(cover.tagName).toBe('OL')
    expect(cover).toHaveAttribute('start', '1')
    expect(cover).toHaveAttribute('role', 'list')
    const stories = [home.lead!, ...home.recent.slice(0, 2)]
    const plates = [...cover.children] as HTMLElement[]
    expect(plates).toHaveLength(3)
    plates.forEach((plate, index) => {
      const story = stories[index]!
      const title = within(plate).getByRole('heading', { level: 2 })
      expect(title).toHaveTextContent(story.title)
      expect(within(title).getByRole('link')).toHaveAttribute('href', story.href)
      // One story link per plate: the title link's target covers the image cell.
      expect(linksTo(plate, story.href)).toHaveLength(1)
      if (story.section) expect(linksTo(plate, story.section.href)).toHaveLength(1)
      expect(plate).toHaveTextContent(formatReadingTime(story.readingMinutes))
      if (story.dek) expect(plate).toHaveTextContent(story.dek)
      const number = plate.querySelector('.si-number')!
      expect(number).toHaveTextContent(String(index + 1).padStart(2, '0'))
      expect(number).toHaveAttribute('aria-hidden', 'true')
      expect(number).not.toHaveAttribute('aria-label')
      if (story.image) {
        const image = plate.querySelector('img')!
        expect(image).toHaveAttribute('alt', story.image.alt)
        expect(image).toHaveAttribute('sizes', index === 0 ? leadSizes : cardSizes)
        expect(image.closest('.si-plate-image')?.getAttribute('style')).toBe(focus(story.image))
        expect(plate.querySelector('.si-number-plate')).toBeNull()
      } else {
        // An image-free plate beside others keeps its cell as a decorative number plate.
        const numberPlate = plate.querySelector('.si-number-plate')!
        expect(numberPlate).toHaveTextContent(String(index + 1).padStart(2, '0'))
        expect(numberPlate).toHaveAttribute('aria-hidden', 'true')
        expect(plate.querySelector('img')).toBeNull()
      }
    })
    expect(stories.slice(1).some((story) => !story.image)).toBe(true)
    expect(plates[0]!.querySelector('.si-plate-image')?.getAttribute('style')).toBe(
      '--si-focus:62% 40%',
    )
    expect(plates[0]!.querySelector('img')).toHaveAttribute('fetchpriority', 'high')
    expect(within(plates[0]!).getByText('Lead')).toHaveClass('si-state')
    expect(document.querySelectorAll('.si-state')).toHaveLength(1)
    expect(document.querySelectorAll('[aria-label^="Story "]')).toHaveLength(0)
    expect(document.querySelectorAll('picture source')).toHaveLength(
      document.querySelectorAll('img').length * 2,
    )
  })

  it('lists stories from 04 as index rows with dates, sections and reading times, without images', () => {
    const { screen } = markup(<SwissHome view={home} />)
    const rows = home.recent.slice(2)
    expect(rows.length).toBeGreaterThan(0)
    const earlier = regionNamedBy(screen, 'Earlier stories')
    expect(within(earlier).getByText(`${rows.length} stories`)).toBeTruthy()
    const list = within(earlier).getByRole('list')
    expect(list.tagName).toBe('OL')
    expect(list).toHaveAttribute('start', '4')
    expect(list).toHaveAttribute('role', 'list')
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(rows.length)
    items.forEach((item, index) => {
      const story = rows[index]!
      const title = within(item).getByRole('heading', { level: 3 })
      expect(title).toHaveTextContent(story.title)
      expect(within(title).getByRole('link')).toHaveAttribute('href', story.href)
      expect(linksTo(item, story.href)).toHaveLength(1)
      const time = item.querySelector('time')!
      expect(time).toHaveAttribute('datetime', story.publishedAt)
      expect(time).toHaveTextContent(formatPublishedDate(story.publishedAt))
      if (story.section) {
        expect(within(item).getByRole('link', { name: story.section.name })).toHaveAttribute(
          'href',
          story.section.href,
        )
      }
      expect(item).toHaveTextContent(formatReadingTime(story.readingMinutes))
      const number = item.querySelector('.si-number')!
      expect(number).toHaveTextContent(String(index + 4).padStart(2, '0'))
      expect(number).toHaveAttribute('aria-hidden', 'true')
    })
    expect(earlier.querySelector('img, picture, .si-number-plate')).toBeNull()
    for (const story of [home.lead!, ...home.recent]) {
      expect(screen.getByRole('heading', { name: story.title })).toBeTruthy()
    }
  })

  it('sets an image-free lead as a typographic lead and never promotes story 02 to the lead image', () => {
    const chair = home.recent.find((story) => !story.image)!
    const illustrated = [home.lead!, ...home.recent].filter((story) => story.image)
    const { document, screen } = markup(
      <SwissHome view={{ ...home, lead: chair, recent: illustrated.slice(0, 4) }} />,
    )
    const [lead, second] = [
      ...screen.getByRole('list', { name: 'Latest stories' }).children,
    ] as HTMLElement[]
    expect(lead).toHaveClass('si-plate-text')
    expect(lead!.querySelector('img, .si-number-plate, .si-plate-image')).toBeNull()
    expect(within(lead!).getByRole('heading', { level: 2 })).toHaveTextContent(chair.title)
    expect(lead).toHaveTextContent(chair.dek)
    expect(within(lead!).getByText('Lead')).toBeTruthy()
    expect(second!.querySelector('img')).toBeTruthy()
    expect(document.querySelector('link[as="image"]')).toBeNull()
    for (const image of document.querySelectorAll('main img')) {
      expect(image).toHaveAttribute('loading', 'lazy')
      expect(image).not.toHaveAttribute('fetchpriority')
    }
    const alone = markup(<SwissHome view={{ ...home, lead: chair, recent: [] }} />)
    expect(alone.document.querySelectorAll('img')).toHaveLength(0)
    expect(alone.screen.queryByRole('heading', { name: 'Earlier stories' })).toBeNull()
    expect(alone.document.querySelector('link[as="image"]')).toBeNull()
  })

  it('sets a typographic lead title over 80 characters at the long title size', () => {
    const long = [home.lead!, ...home.recent].find((story) => story.title.length > 80)!
    const short = home.lead!
    expect(short.title.length).toBeLessThanOrEqual(80)
    const plateFor = (lead: typeof short) =>
      markup(<SwissHome view={{ ...home, lead: { ...lead, image: null }, recent: [] }} />)
        .screen.getByRole('list', { name: 'Latest stories' })
        .querySelector('li')!
    expect(plateFor(long)).toHaveClass('si-plate-text', 'si-plate-long')
    expect(plateFor(short)).toHaveClass('si-plate-text')
    expect(plateFor(short)).not.toHaveClass('si-plate-long')
  })

  it('shows the empty front page under its rule with only the Front page link in each index', () => {
    const { document, screen } = markup(
      <SwissHome view={{ lead: null, navigation: { sections: [] }, recent: [] }} />,
    )
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(siteName)
    expect(screen.getByRole('heading', { level: 2, name: 'No stories yet' })).toBeTruthy()
    expect(screen.getByText('New stories will appear here when they are published.')).toBeTruthy()
    expect(screen.queryByRole('list', { name: 'Latest stories' })).toBeNull()
    expect(document.querySelectorAll('img')).toHaveLength(0)
    expect(document.querySelector('link[as="image"]')).toBeNull()
    for (const name of ['Sections', 'Site index']) {
      expect(navLinks(screen.getByRole('navigation', { name }))).toEqual([
        { href: '/', name: 'Front page' },
      ])
    }
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

  it('heads a section with its label row, the name as the only h1 and a description only when stored', () => {
    const { document, screen } = markup(<SwissSection view={section} />)
    const header = document.querySelector('main header')!
    const label = header.querySelector('.si-label-row')!
    expect(label).toHaveTextContent('Section')
    expect(within(label as HTMLElement).getByText(`${section.stories.length} stories`)).toBeTruthy()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(within(header as HTMLElement).getByRole('heading', { level: 1 })).toHaveTextContent(
      section.name,
    )
    expect(section.description).toBeNull()
    expect(header.querySelector('.si-dek')).toBeNull()
    const description = 'Rooms, light and the things that live in them.'
    const described = markup(<SwissSection view={{ ...section, description }} />)
    expect(described.screen.getByText(description)).toHaveClass('si-dek')
  })

  it('sets plates 01 to 04 and an index from 05 without the section column', () => {
    const stories = [home.lead!, ...home.recent]
    expect(stories.length).toBeGreaterThan(4)
    const { document, screen } = markup(<SwissSection view={{ ...section, stories }} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(
      within(document.querySelector<HTMLElement>('main header')!).getByText(
        `${stories.length} stories`,
      ),
    ).toBeTruthy()
    const plates = screen.getByRole('list', { name: `${section.name} stories` })
    expect(plates.tagName).toBe('OL')
    expect(plates).toHaveAttribute('start', '1')
    expect(plates).toHaveAttribute('role', 'list')
    expect(plates.children).toHaveLength(4)
    ;([...plates.children] as HTMLElement[]).forEach((plate, index) => {
      const story = stories[index]!
      expect(within(plate).getByRole('heading', { level: 2 })).toHaveTextContent(story.title)
      expect(linksTo(plate, story.href)).toHaveLength(1)
      if (story.image) expect(plate.querySelector('img')).toHaveAttribute('sizes', cardSizes)
      else expect(plate.querySelector('.si-number-plate')).toHaveAttribute('aria-hidden', 'true')
    })
    const rows = stories.slice(4)
    const earlier = regionNamedBy(screen, `Earlier in ${section.name}`)
    expect(within(earlier).getByText(`${rows.length} stories`)).toBeTruthy()
    const list = within(earlier).getByRole('list')
    expect(list.tagName).toBe('OL')
    expect(list).toHaveAttribute('start', '5')
    expect(list).toHaveAttribute('role', 'list')
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(rows.length)
    items.forEach((item, index) => {
      const story = rows[index]!
      expect(within(item).getByRole('heading', { level: 3 })).toHaveTextContent(story.title)
      // Without the section column a row links only to its story.
      expect([...item.querySelectorAll('a')].map((link) => link.getAttribute('href'))).toEqual([
        story.href,
      ])
      expect(item.querySelector('time')).toHaveAttribute('datetime', story.publishedAt)
      expect(item).toHaveTextContent(formatReadingTime(story.readingMinutes))
      expect(item.querySelector('.si-number')).toHaveTextContent(String(index + 5).padStart(2, '0'))
    })
    expect(earlier.querySelector('img')).toBeNull()
  })

  it('handles empty, single-story and many-story sections and keeps current navigation', () => {
    for (const stories of [[], section.stories.slice(0, 1), section.stories]) {
      const { document, screen } = markup(<SwissSection view={{ ...section, stories }} />)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(section.name)
      expect(
        screen.queryByRole('list', { name: `${section.name} stories` })?.children ?? [],
      ).toHaveLength(Math.min(stories.length, 4))
      expect(document.querySelector('.si-section-header .si-label-row')).toHaveTextContent(
        `${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`,
      )
      expect(document.querySelector('nav a[aria-current="page"]')?.getAttribute('href')).toBe(
        section.href,
      )
      for (const story of stories)
        expect(screen.getByRole('heading', { name: story.title })).toBeTruthy()
      if (stories.length === 0) {
        expect(screen.getByText('No stories have been published in this section yet.')).toBeTruthy()
        expect(
          within(document.querySelector('main')!).getByRole('link', { name: 'Front page' }),
        ).toHaveAttribute('href', '/')
        expect(document.querySelector('link[as="image"]')).toBeNull()
        expect(screen.queryByRole('heading', { name: `Earlier in ${section.name}` })).toBeNull()
      }
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
