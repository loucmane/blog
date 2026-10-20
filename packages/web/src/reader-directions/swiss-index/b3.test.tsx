// @vitest-environment jsdom
import fs from 'node:fs'
import path from 'node:path'

import { within } from '@testing-library/dom'
import { cleanup, fireEvent, render } from '@testing-library/react'
import postcss, { type AtRule, type Node as CssNode, type Rule } from 'postcss'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { readerFailureView } from '@/reader/components/failure-view'
import { siteName } from '@/reader/components/site-header'
import {
  readArticleView,
  readAuthorView,
  readHomeView,
  readSectionView,
  readTopicView,
} from '@/reader/read-model'
import type {
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
import { labAuthors, labSections, labStories, labTopics } from '@/server/lab/north-house'
import { labStorySlug, seedLabContent } from '@/server/lab/seed'

import { readerDirectionStyleCss, type ReaderFailureView } from '../contract'
import { SwissArticle } from './article'
import { SwissAuthor } from './author'
import { SwissError, SwissNotFound, SwissUnavailable } from './failure'
import { SwissHome } from './home'
import { swissIndexDirection } from './index'
import { SwissSection } from './section'
import { cardSizes, leadSizes, plateSizes } from './story-card'
import { SwissTopic } from './topic'

function markup(element: ReactNode) {
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(element)
  return { document: container, screen: within(container) }
}

function label(element: Element) {
  return [element.localName, ...element.classList].join('.')
}

/** Link text and targets, in document order. */
function links(root: Element) {
  return [...root.querySelectorAll('a')].map((link) => [
    link.textContent,
    link.getAttribute('href'),
  ])
}

function follows(first: Element, second: Element) {
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING)
}

const css = postcss.parse(readerDirectionStyleCss(swissIndexDirection)!)

/** The query of the media rule a rule sits in, or null outside any. */
function mediaOf(rule: Rule): string | null {
  for (
    let node = rule.parent as CssNode | undefined;
    node;
    node = node.parent as CssNode | undefined
  ) {
    if (node.type === 'atrule' && (node as AtRule).name === 'media') return (node as AtRule).params
  }
  return null
}

/** The declarations of every rule that lists `selector`, in source order, under one media query. */
function declarations(selector: string, media: string | null = null) {
  const merged: Record<string, string> = {}
  css.walkRules((rule) => {
    if (mediaOf(rule) !== media) return
    if (!rule.selectors.some((part) => part.replace(/^&\s*/, '') === selector)) return
    for (const node of rule.nodes) if (node.type === 'decl') merged[node.prop] = node.value
  })
  return merged
}

/** Every selector of the direction's rules, without the root's `&`. */
const selectors = (() => {
  const found: string[] = []
  css.walkRules((rule) => {
    found.push(...rule.selectors.map((part) => part.replace(/^&\s*/, '')))
  })
  return found
})()

/** The width in pixels that a `sizes` value describes on a screen `width` pixels wide. */
function described(sizes: string, width: number) {
  const pixels = (length: string) => {
    const [, value, unit] = /^(\d+(?:\.\d+)?)(rem|vw)$/.exec(length)!
    return Number(value) * (unit === 'vw' ? width / 100 : 16)
  }
  for (const entry of sizes.split(', ')) {
    const [, minimum, length] = /^(?:\(min-width: (\d+)px\) )?(.+)$/.exec(entry)!
    if (minimum && width < Number(minimum)) continue
    const calc = /^calc\((\S+) ([+-]) (\S+)\)$/.exec(length!)
    if (!calc) return pixels(length!)
    const [, first, sign, second] = calc
    return pixels(first!) + (sign === '-' ? -1 : 1) * pixels(second!)
  }
  throw new Error(`${sizes} describes no width at ${width}px`)
}

/**
 * Spec section 4's grid: the page between clamp(1.25rem, 3vw, 3rem) gutters, at most 84rem; four
 * columns 1.5rem apart from 1024px, two from 600px, one below. The lead plate spans two columns.
 */
function cellWidth(cell: 'lead' | 'plate', width: number) {
  const gutter = Math.min(Math.max(20, 0.03 * width), 48)
  const page = Math.min(width - 2 * gutter, 1344)
  const columns = width >= 1024 ? 4 : width >= 600 ? 2 : 1
  const column = (page - (columns - 1) * 24) / columns
  return cell === 'lead' && columns > 1 ? 2 * column + 24 : column
}

/**
 * The sizes switch to fixed widths at 1440px, where the page reaches 84rem at about 1430px: in
 * between they describe a column up to 2.4px wider than it is, and the two-column lead twice that.
 */
function slack(cell: 'lead' | 'plate') {
  return cell === 'lead' ? 5 : 2.5
}

function image(width: number | null, height: number | null): ReaderImage {
  return {
    alt: 'A test image',
    animated: false,
    caption: null,
    contentType: 'image/png',
    credit: null,
    focalPoint: { x: 0.5, y: 0.5 },
    height,
    mediaId: `test-${width}x${height}`,
    src: `/api/media/test-${width}x${height}`,
    width,
  }
}

// Spec section 2.7; the unavailable page keeps the shared copy (2.7, third item).
const failures = [
  {
    kind: 'NotFound',
    label: 'Error 404',
    message: 'We could not find the page you requested.',
    page: (view: ReaderFailureView) => <SwissNotFound view={view} />,
    title: 'Page not found',
  },
  {
    kind: 'Error',
    label: 'Error',
    message: 'We could not load this page.',
    page: (view: ReaderFailureView) => <SwissError reset={() => {}} view={view} />,
    title: 'Something went wrong',
  },
  {
    kind: 'Unavailable',
    label: 'Unavailable',
    message: 'The magazine cannot reach its stories right now. Please try again later.',
    page: (view: ReaderFailureView) => <SwissUnavailable view={view} />,
    title: 'Stories are unavailable',
  },
] as const

class ResizeObserverStub {
  disconnect() {}
  observe() {}
  unobserve() {}
}

describe('Swiss Index failure pages (spec 2.7)', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('registers its own not-found, error and unavailable views', () => {
    expect(swissIndexDirection.NotFound).toBe(SwissNotFound)
    expect(swissIndexDirection.Error).toBe(SwissError)
    expect(swissIndexDirection.Unavailable).toBe(SwissUnavailable)
  })

  it.each(failures)(
    'sets "$title" in the frame: a label row, one h1 naming it, one sentence and the way back',
    ({ kind, label: rowLabel, message, page, title }) => {
      const { document, screen } = markup(page(readerFailureView))
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      const heading = screen.getByRole('heading', { level: 1, name: title })
      expect(document.querySelectorAll('main')).toHaveLength(1)
      const main = document.querySelector('main')!
      expect(main).toHaveAttribute('id', 'si-main')
      expect(main).toHaveAttribute('tabindex', '-1')
      const [skip] = screen.getAllByRole('link')
      expect(skip).toHaveTextContent('Skip to content')
      expect(skip).toHaveAttribute('href', '#si-main')
      // One block across columns 1-3: the label row, the h1, one sentence and the way back.
      const block = main.querySelector<HTMLElement>(':scope > .si-failure')!
      expect(block).toHaveAttribute('data-reader-failure')
      expect([...block.children].map(label)).toEqual([
        'div.si-label-row',
        'h1',
        'p.si-dek',
        'div.si-failure-actions',
      ])
      expect(block.contains(heading)).toBe(true)
      expect(block.querySelector('.si-label-row')).toHaveTextContent(rowLabel)
      expect(block.querySelector('.si-label-row .si-label')?.tagName).toBe('P')
      expect(block.querySelector('.si-count')).toBeNull()
      expect(block.querySelector('.si-dek')?.textContent).toBe(message)
      expect(links(main)).toEqual([['Front page', '/']])
      const buttons = within(main).queryAllByRole('button')
      expect(buttons.map((button) => button.textContent)).toEqual(
        kind === 'Error' ? ['Try again'] : [],
      )
      // The site name is a link in the masthead, never a second heading.
      const masthead = document.querySelector<HTMLElement>('.si-page > header')!
      expect(within(masthead).queryByRole('heading')).toBeNull()
      expect(masthead.querySelector('p.si-wordmark a[href="/"]')).toHaveTextContent(siteName)
      expect(within(masthead).getByRole('button', { name: 'Choose color theme' })).toBeTruthy()
      const footer = document.querySelector<HTMLElement>('.si-page > footer')!
      expect(footer.querySelector('.si-footer-name')?.textContent).toBe(siteName)
      expect(within(footer).getByRole('link', { name: 'Back to top' })).toHaveAttribute(
        'href',
        '#si-top',
      )
      // The shared failure model knows no sections: "Front page" alone, and nothing is current.
      for (const name of ['Sections', 'Site index']) {
        expect(links(screen.getByRole('navigation', { name }))).toEqual([['Front page', '/']])
      }
      expect(document.querySelectorAll('[aria-current], [data-current]')).toHaveLength(0)
      // Nothing to show or load: no picture and no preload.
      expect(document.querySelectorAll('img, picture, link')).toHaveLength(0)
    },
  )

  it('names the magazine and lists the sections exactly as the failure view supplies them', () => {
    const view: ReaderFailureView = {
      navigation: { sections: [{ href: '/sections/craft', name: 'Craft', slug: 'craft' }] },
      siteName: 'North House Review',
    }
    for (const { page } of failures) {
      const { document, screen } = markup(page(view))
      expect(document.querySelector('.si-wordmark')?.textContent).toBe(view.siteName)
      expect(document.querySelector('.si-footer-name')?.textContent).toBe(view.siteName)
      expect(document.textContent).not.toContain(siteName)
      for (const name of ['Sections', 'Site index']) {
        expect(links(screen.getByRole('navigation', { name }))).toEqual([
          ['Front page', '/'],
          ['Craft', '/sections/craft'],
        ])
      }
      expect(document.querySelectorAll('[aria-current], [data-current]')).toHaveLength(0)
    }
  })

  it('retries from a Try again button before the way back, wired to the boundary reset', () => {
    const reset = vi.fn()
    const { container } = render(<SwissError reset={reset} view={readerFailureView} />)
    const main = container.querySelector('main')!
    const retry = within(main).getByRole('button', { name: 'Try again' })
    expect(retry).toHaveAttribute('type', 'button')
    expect(retry).toHaveClass('si-retry')
    expect(follows(main.querySelector('h1')!, retry)).toBe(true)
    expect(follows(retry, within(main).getByRole('link', { name: 'Front page' }))).toBe(true)
    expect(reset).not.toHaveBeenCalled()
    fireEvent.click(retry)
    expect(reset).toHaveBeenCalledOnce()
    for (const View of [SwissNotFound, SwissUnavailable]) {
      cleanup()
      const page = render(<View view={readerFailureView} />)
      expect(within(page.container.querySelector('main')!).queryByRole('button')).toBeNull()
    }
  })

  it('keeps the failure views synchronous and every module of the direction client-compatible', () => {
    // The error view renders in the client error boundary, not-found in its client upgrader.
    for (const view of [SwissNotFound, SwissError, SwissUnavailable]) {
      expect(Object.prototype.toString.call(view)).toBe('[object Function]')
    }
    // The registry's direction modules enter the failure boundary's lazy client graph.
    const folder = path.join(process.cwd(), 'packages/web/src/reader-directions/swiss-index')
    const modules = fs
      .readdirSync(folder)
      .filter((file) => /\.tsx?$/.test(file) && !/\.(?:test|e2e)\.tsx?$|\.config\.ts$/.test(file))
    expect(modules).toContain('failure.tsx')
    for (const file of modules) {
      expect(fs.readFileSync(path.join(folder, file), 'utf8'), file).not.toMatch(
        /from ['"](?:server-only|next\/headers|next\/server|next\/cache)['"]|^['"]use server['"]/m,
      )
    }
  })

  it('sets the failure block across columns 1 to 3, full width below 1024px, at the page title size', () => {
    expect(declarations('.si-failure')).toMatchObject({
      display: 'grid',
      'grid-template-columns': 'repeat(4, minmax(0, 1fr))',
      'padding-top': '2rem',
    })
    expect(declarations('.si-failure > *')['grid-column']).toBe('1 / 4')
    expect(declarations('.si-failure', '(max-width: 1023px)')['grid-template-columns']).toBe('1fr')
    expect(declarations('.si-failure > *', '(max-width: 1023px)')['grid-column']).toBe('1')
    // The h1 is a page title: the same size, weight, tracking and balance as the others.
    expect(declarations('.si-failure h1')).toMatchObject({
      ...declarations('.si-page-header h1'),
      'margin-top': '1.5rem',
    })
    expect(declarations('.si-failure h1', '(max-width: 599px)')['letter-spacing']).toBe('-0.04em')
    expect(declarations('.si-failure', 'print').display).toBe('block')
    // Try again: square, a 1px ink border, a mono label, 44px high; Front page as a 44px link.
    expect(declarations('.si-retry')).toMatchObject({
      border: '1px solid var(--si-ink)',
      'border-radius': '0',
      'font-family': 'var(--si-mono)',
      'margin-left': '0',
      'min-height': '44px',
      'min-width': '44px',
    })
    expect(declarations('.si-failure-actions')).toMatchObject({
      display: 'flex',
      'flex-wrap': 'wrap',
    })
    expect(declarations('.si-failure-actions a')).toMatchObject({
      'font-family': 'var(--si-mono)',
      'min-height': '44px',
      'text-decoration-line': 'underline',
    })
  })
})

describe('Swiss Index plate sizes, the preload and priority, with real North House content', () => {
  let home: HomeView
  let sections: SectionView[]
  let topics: TopicView[]
  let authors: AuthorView[]
  let articles: ArticleView[]

  // Seeding generates every sample image with sharp: load-sensitive, so allow 30 seconds.
  beforeAll(async () => {
    const repository = new InMemoryContentRepository()
    await seedLabContent({ objects: new InMemoryOriginalObjectStore(), repository })
    const source = { mediaAvailable: true, repository }
    home = await readHomeView(source)
    sections = await Promise.all(
      labSections.map(async ({ slug }) => (await readSectionView(source, slug))!),
    )
    topics = await Promise.all(
      labTopics.map(async ({ slug }) => (await readTopicView(source, slug))!),
    )
    authors = await Promise.all(
      labAuthors.map(async ({ slug }) => (await readAuthorView(source, slug))!),
    )
    articles = await Promise.all(
      labStories.map(async (story) => (await readArticleView(source, labStorySlug(story)))!),
    )
  }, 30_000)

  it('keeps the spec’s sizes for each slot, which describe its cell from 320 to 2560 pixels', () => {
    expect(leadSizes).toBe(
      '(min-width: 1440px) 41.25rem, (min-width: 1024px) calc(47vw - 0.75rem), (min-width: 667px) 94vw, calc(100vw - 2.5rem)',
    )
    expect(cardSizes).toBe(
      '(min-width: 1440px) 19.875rem, (min-width: 1024px) calc(23.5vw - 1.125rem), (min-width: 667px) calc(47vw - 0.75rem), (min-width: 600px) calc(50vw - 2rem), calc(100vw - 2.5rem)',
    )
    for (let width = 320; width <= 2560; width++) {
      for (const [cell, sizes] of [
        ['lead', leadSizes],
        ['plate', cardSizes],
      ] as const) {
        const extra = described(sizes, width) - cellWidth(cell, width)
        expect(extra, `${cell} at ${width}px`).toBeGreaterThanOrEqual(-0.01)
        expect(extra, `${cell} at ${width}px`).toBeLessThanOrEqual(slack(cell))
      }
    }
  })

  it('widens a plate’s sizes by its crop, so a source wider than its cell is never under-fetched', () => {
    // A source no wider than its cell fills it across: the spec's sizes, unchanged.
    expect(plateSizes(image(1440, 960), 'lead')).toBe(leadSizes)
    expect(plateSizes(image(1200, 900), 'plate')).toBe(cardSizes)
    for (const [width, height] of [
      [1080, 1080],
      [960, 1200],
      [900, 1350],
    ] as const) {
      expect(plateSizes(image(width, height), 'plate')).toBe(cardSizes)
      expect(plateSizes(image(width, height), 'lead')).toBe(leadSizes)
    }
    // Without stored dimensions the shared component serves the original, without sizes.
    expect(plateSizes(image(null, null), 'plate')).toBe(cardSizes)
    // A 16:9 source covering a 4:3 cell paints 4/3 of the cell's width.
    expect(plateSizes(image(1600, 900), 'plate')).toBe(
      '(min-width: 1440px) 26.5rem, (min-width: 1024px) calc(31.3333vw - 1.5rem), (min-width: 667px) calc(62.6667vw - 1rem), (min-width: 600px) calc(66.6667vw - 2.6667rem), calc(133.3333vw - 3.3333rem)',
    )
    for (const [width, height] of [
      [1600, 900],
      [1440, 960],
      [1500, 1000],
      [2400, 1000],
    ] as const) {
      for (const [cell, ratio] of [
        ['lead', 3 / 2],
        ['plate', 4 / 3],
      ] as const) {
        const crop = Math.max(1, width / height / ratio)
        const sizes = plateSizes(image(width, height), cell)
        for (let viewport = 320; viewport <= 2560; viewport += 7) {
          const painted = cellWidth(cell, viewport) * crop
          const name = `${width}x${height} ${cell} at ${viewport}px`
          expect(described(sizes, viewport), name).toBeGreaterThanOrEqual(painted - 0.05)
          expect(described(sizes, viewport), name).toBeLessThanOrEqual(painted + slack(cell) * crop)
        }
      }
    }
  })

  it('sizes every plate picture, its sources and the preload for the plate’s own crop', () => {
    const pages = [
      <SwissHome key="home" view={home} />,
      ...sections.map((view) => <SwissSection key={view.slug} view={view} />),
      ...topics.map((view) => <SwissTopic key={view.slug} view={view} />),
      ...articles.map((view) => <SwissArticle key={view.slug} view={view} />),
    ]
    // Home lists every sample story, so each plate's story is found by its link.
    const stories = new Map<string | null, StoryCard>(
      [home.lead!, ...home.recent].map((story) => [story.href, story] as const),
    )
    expect(stories.size).toBe(labStories.length)
    let widened = 0
    for (const page of pages) {
      const { document } = markup(page)
      for (const plate of document.querySelectorAll<HTMLElement>('.si-plate')) {
        const picture = plate.querySelector('.si-plate-image img')
        const story = stories.get(plate.querySelector('.si-plate-title a')!.getAttribute('href'))!
        if (!story.image) {
          expect(picture).toBeNull()
          continue
        }
        const sizes = plateSizes(
          story.image,
          plate.classList.contains('si-plate-lead') ? 'lead' : 'plate',
        )
        if (sizes !== leadSizes && sizes !== cardSizes) widened += 1
        expect(picture).toHaveAttribute('sizes', sizes)
        for (const source of plate.querySelectorAll('source')) {
          expect(source).toHaveAttribute('sizes', sizes)
        }
      }
      const lead = document.querySelector('main img[fetchpriority="high"]')
      const preload = document.querySelector('link[rel="preload"][as="image"][href]')
      if (preload && lead?.closest('.si-plate')) {
        expect(preload).toHaveAttribute('imagesizes', lead.getAttribute('sizes')!)
      }
    }
    // The sample has sources wider than their cells (the 16:9 boathouse in a 4:3 plate).
    expect(widened).toBeGreaterThan(0)
  })

  it('emits one preload and one high-priority image per page, both for the lead image, and lazy-loads the rest', () => {
    const craft = sections.find(({ stories }) => stories[0] && !stories[0].image)!
    expect(craft).toBeDefined()
    const chair = [home.lead!, ...home.recent].find((story) => !story.image)!
    const landscape = articles.find(({ hero }) => hero && hero.width! >= 1.2 * hero.height!)!
    const upright = articles.find(({ hero }) => hero && hero.width! < 1.2 * hero.height!)!
    const imageFree = articles.find(({ hero }) => !hero)!
    const cases: { name: string; page: ReactNode; lead: ReaderImage | null }[] = [
      { name: 'home', page: <SwissHome view={home} />, lead: home.lead!.image },
      {
        name: 'home with a typographic lead',
        page: (
          <SwissHome
            view={{ ...home, lead: chair, recent: home.recent.filter((story) => story !== chair) }}
          />
        ),
        lead: null,
      },
      ...sections.map((view) => ({
        name: `section ${view.slug}`,
        page: <SwissSection view={view} />,
        lead: view.stories[0]?.image ?? null,
      })),
      ...topics.map((view) => ({
        name: `topic ${view.slug}`,
        page: <SwissTopic view={view} />,
        lead: view.stories[0]?.image ?? null,
      })),
      { name: 'landscape article', page: <SwissArticle view={landscape} />, lead: landscape.hero },
      { name: 'upright article', page: <SwissArticle view={upright} />, lead: upright.hero },
      { name: 'image-free article', page: <SwissArticle view={imageFree} />, lead: null },
      ...authors.map((view) => ({
        name: `author ${view.slug}`,
        page: <SwissAuthor view={view} />,
        lead: null,
      })),
      ...failures.map(({ kind, page }) => ({
        name: kind,
        page: page(readerFailureView),
        lead: null,
      })),
    ]
    expect(cases.filter(({ lead }) => lead).length).toBeGreaterThan(3)
    for (const { name, page, lead } of cases) {
      const { document } = markup(page)
      const preloads = document.querySelectorAll('link[rel="preload"][as="image"]')
      const priority = document.querySelectorAll('img[fetchpriority]')
      expect(preloads, name).toHaveLength(lead ? 1 : 0)
      expect(priority, name).toHaveLength(lead ? 1 : 0)
      const images = [...document.querySelectorAll('main img')]
      for (const picture of images) {
        if (picture === priority[0]) continue
        expect(picture, name).toHaveAttribute('loading', 'lazy')
      }
      if (!lead) continue
      const [preload] = preloads
      const [first] = priority
      expect(first, name).toHaveAttribute('fetchpriority', 'high')
      expect(first, name).not.toHaveAttribute('loading')
      expect(first!.getAttribute('alt'), name).toBe(lead.alt)
      expect(preload, name).toHaveAttribute('fetchpriority', 'high')
      expect(preload!.getAttribute('href'), name).toMatch(new RegExp(`^/api/media/${lead.mediaId}`))
      expect(preload!.getAttribute('imagesizes'), name).toBe(first!.getAttribute('sizes'))
      // The lead image is the page's first picture, so nothing above it waits on it.
      expect(images[0], name).toBe(first)
    }
  })
})

describe('Swiss Index accessibility and page-speed rules in the direction styles', () => {
  it('keeps one visible focus ring: 2px currentColor at a 4px offset, Highlight in forced colours, never removed', () => {
    expect(declarations('.si-page :focus-visible')).toMatchObject({
      outline: '2px solid currentColor',
      'outline-offset': '4px',
    })
    expect(declarations('.si-page :focus-visible', '(forced-colors: active)')).toMatchObject({
      'outline-color': 'Highlight',
    })
    css.walkDecls(/^outline/, (declaration) => {
      const where = `${(declaration.parent as Rule).selector} { ${declaration.toString()} }`
      expect(declaration.value, where).not.toMatch(/^(?:none|0)\b|transparent/)
    })
  })

  it('leaves numbered lists with a type to the shared renderer: no type selectors, and no reset or default for them', () => {
    // HTML matches the type attribute case-insensitively, so ol[type='a'] also styles type="A".
    expect(
      selectors.filter((selector) => /\[type/.test(selector) && !/:not\(\[type\]\)/.test(selector)),
    ).toEqual([])
    expect(declarations(':where(.si-page) :where(ul, ol:not([type]))')).toMatchObject({
      'list-style': 'none',
      padding: '0',
    })
    expect(selectors).not.toContain(':where(.si-page) :where(ul, ol)')
    expect(declarations('.si-body ol:not([type])')['list-style-type']).toBe('decimal')
    expect(declarations('.si-body ol')['list-style-type']).toBeUndefined()
    // Markers are mono, which has no italic face: upright wherever the list sits.
    expect(declarations('.si-body li::marker')).toMatchObject({
      'font-family': 'var(--si-mono)',
      'font-style': 'normal',
    })
  })

  it('keeps inline code in mono’s own faces, upright and regular, in both mark orders', () => {
    // IBM Plex Mono has 400 and 500 upright faces only: emphasis or bold would be synthesized.
    expect(declarations('.si-body code')).toMatchObject({
      'font-family': 'var(--si-mono)',
      'font-style': 'normal',
      'font-weight': '400',
    })
    expect(declarations('.si-body code :is(em, strong)')).toMatchObject({
      'font-style': 'normal',
      'font-weight': '400',
    })
  })
})
