// @vitest-environment jsdom
import { within } from '@testing-library/dom'
import postcss, { type ChildNode, type Rule } from 'postcss'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  readArticleView,
  readAuthorView,
  readHomeView,
  readSectionView,
  readTopicView,
} from '@/reader/read-model'
import type { ArticleView, AuthorView, HomeView, SectionView, TopicView } from '@/reader/views'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { InMemoryOriginalObjectStore } from '@/server/content/media'
import { labAuthors, labStories, labTopics } from '@/server/lab/north-house'
import { labStorySlug, seedLabContent } from '@/server/lab/seed'

import { readerDirectionStyleCss } from '../contract'
import { SwissArticle } from './article'
import { SwissAuthor } from './author'
import { SwissHome } from './home'
import { swissIndexDirection } from './index'
import { SwissSection } from './section'
import { SwissTopic } from './topic'

const root = '[data-reader-direction="swiss-index"]'

/** One width in each layout: phone, tablet and desktop. */
const widths = [390, 768, 1440] as const

/** Element resets style elements by their type alone, under the page wrapper. */
const resetSelector =
  /^(?:\.si-page|:where\(\.si-page\)) (?:\*|[a-z0-9]+|:(?:is|where)\([a-z0-9, ]+\))$/

/** Whether a media query of the direction's styles holds on a screen `width` pixels wide. */
function holds(query: string, width: number) {
  return query.split(' and ').every((feature) => {
    const [, bound, pixels] = /^\((min|max)-width: (\d+)px\)$/.exec(feature) ?? []
    // Print, reduced motion and forced colours are not the screens these checks render.
    if (!bound) return false
    return bound === 'min' ? width >= Number(pixels) : width <= Number(pixels)
  })
}

/** The direction's rules that apply at `width`, in source order, with their nesting resolved. */
function rulesAt(width: number) {
  const rules: { readonly css: string; readonly reset: boolean }[] = []
  const visit = (nodes: readonly ChildNode[]) => {
    for (const node of nodes) {
      if (node.type === 'rule') {
        const selectors = node.selectors.map((selector) => {
          if (!selector.startsWith('&')) throw new Error(`Unscoped selector: ${selector}`)
          return selector.slice(1).trim()
        })
        const scoped = selectors.map((selector) => `${root} ${selector}`.trim())
        rules.push({
          css: `${scoped.join(', ')} { ${node.nodes.join('; ')} }`,
          reset: selectors.every((selector) => resetSelector.test(selector)),
        })
      } else if (node.type === 'atrule' && node.name === 'media' && holds(node.params, width)) {
        visit(node.nodes ?? [])
      }
    }
  }
  const [scope] = postcss.parse(readerDirectionStyleCss(swissIndexDirection)!).nodes
  visit((scope as Rule).nodes)
  return rules
}

/** Renders a page inside the direction root, styled as at `width`, optionally without resets. */
function renderAt(page: ReactElement | string, width: number, { resets = true } = {}) {
  const rules = rulesAt(width).filter((rule) => resets || !rule.reset)
  const markup = typeof page === 'string' ? page : renderToStaticMarkup(page)
  document.head.innerHTML = `<style>${rules.map(({ css }) => css).join('\n')}</style>`
  document.body.innerHTML = `<div data-reader-direction="swiss-index">${markup}</div>`
  return document.body.firstElementChild as HTMLElement
}

const style = (element: Element) => getComputedStyle(element)

function label(element: Element) {
  return [element.localName, ...element.classList].join('.')
}

describe('Swiss Index computed styles', () => {
  let home: HomeView
  let section: SectionView
  let article: ArticleView
  let upright: ArticleView
  let author: AuthorView
  let topic: TopicView

  beforeAll(async () => {
    const repository = new InMemoryContentRepository()
    await seedLabContent({ objects: new InMemoryOriginalObjectStore(), repository })
    const source = { mediaAvailable: true, repository }
    home = await readHomeView(source)
    section = (await readSectionView(source, 'interiors'))!
    const longTable = labStories.find(({ id }) => id === 'article-lab-long-table')!
    article = (await readArticleView(source, labStorySlug(longTable)))!
    const articles = await Promise.all(
      labStories.map(async (story) => (await readArticleView(source, labStorySlug(story)))!),
    )
    // The spec's upright hero: narrower than 1.2 times its height.
    upright = articles.find(
      ({ hero }) => hero?.width && hero.height && hero.width < 1.2 * hero.height,
    )!
    author = (await readAuthorView(source, labAuthors[0]!.slug))!
    topic = (await readTopicView(source, labTopics[0]!.slug))!
  })

  afterEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
  })

  it('keeps the cover clear of the masthead and balances plate titles over the element resets', () => {
    for (const width of widths) {
      const front = renderAt(<SwissHome view={home} />, width)
      expect(style(front.querySelector('.si-cover')!).paddingTop, `${width}px`).toBe('1.5rem')
      const titles = [...front.querySelectorAll('.si-plate-title')]
      expect(titles).toHaveLength(3)
      for (const title of titles) {
        expect(style(title).getPropertyValue('text-wrap'), `${width}px`).toBe('balance')
      }
      // Other headings stay pretty.
      for (const heading of front.querySelectorAll('.si-row-title, .si-label-row h2')) {
        expect(style(heading).getPropertyValue('text-wrap'), `${width}px`).toBe('pretty')
      }
      // Rules set the line alone, keeping the reset's 1px thickness; the e2e file reads it too.
      expect(
        style(front.querySelector('.si-top-link')!).getPropertyValue('text-decoration-line'),
      ).toBe('underline')

      const sectionPage = renderAt(<SwissSection view={section} />, width)
      for (const title of sectionPage.querySelectorAll('main h1, .si-plate-title')) {
        expect(style(title).getPropertyValue('text-wrap'), `${width}px`).toBe('balance')
      }
    }
  })

  it(
    'never lets an element reset decide a value that a component rule declares, on any page or width',
    // Eleven pages at three widths, each resolved twice: well over the default under a full run.
    { timeout: 60_000 },
    () => {
      const stories = [home.lead!, ...home.recent]
      const pages = [
        <SwissHome key="home" view={home} />,
        <SwissHome key="empty" view={{ lead: null, navigation: { sections: [] }, recent: [] }} />,
        <SwissSection key="section" view={{ ...section, stories }} />,
        <SwissSection key="empty-section" view={{ ...section, stories: [] }} />,
        <SwissArticle key="article" view={article} />,
        <SwissArticle key="upright" view={upright} />,
        <SwissArticle key="no-hero" view={{ ...article, hero: null }} />,
        <SwissAuthor key="author" view={author} />,
        <SwissAuthor key="empty-author" view={{ ...author, stories: [] }} />,
        <SwissTopic key="topic" view={{ ...topic, stories }} />,
        <SwissTopic key="empty-topic" view={{ ...topic, stories: [] }} />,
      ].map((page) => renderToStaticMarkup(page))
      const resets = rulesAt(1440).flatMap(({ css, reset }) => (reset ? [css] : []))
      for (const elements of ['(ul, ol)', '(h1, h2, h3, h4, h5, h6)', ' a {']) {
        expect(
          resets.some((css) => css.includes(elements)),
          elements,
        ).toBe(true)
      }
      // jsdom keeps some shorthands (text-decoration, list-style, logical margins and padding) apart
      // from their longhands; the e2e file checks the cover and the titles in a browser as well.
      const defeated: string[] = []
      for (const width of widths) {
        const flat = rulesAt(width)
        for (const page of pages) {
          const styled = renderAt(page, width)
          const rules = [...document.styleSheets[0]!.cssRules] as CSSStyleRule[]
          expect(rules).toHaveLength(flat.length)
          const matched = (reset: boolean) =>
            rules.flatMap((rule, index) =>
              flat[index]!.reset === reset && !rule.selectorText.includes('::')
                ? [...document.querySelectorAll(rule.selectorText)].map((element) => ({
                    element,
                    names: Array.from(rule.style),
                  }))
                : [],
            )
          // A reset can only defeat a component rule on an element both match.
          const resetOn = new Map<Element, Set<string>>()
          for (const { element, names } of matched(true)) {
            resetOn.set(element, new Set([...(resetOn.get(element) ?? []), ...names]))
          }
          const elements = [styled, ...styled.querySelectorAll('*')]
          const position = new Map(elements.map((element, index) => [element, index]))
          const checks = matched(false).flatMap(({ element, names }) =>
            names
              .filter((name) => resetOn.get(element)?.has(name))
              .map((name) => ({ at: position.get(element)!, name })),
          )
          const resolve = (root: HTMLElement) => {
            const all = [root, ...root.querySelectorAll('*')]
            return checks.map(({ at, name }) => style(all[at]!).getPropertyValue(name))
          }
          const withResets = resolve(styled)
          const componentsAlone = resolve(renderAt(page, width, { resets: false }))
          checks.forEach(({ at, name }, index) => {
            const [value, expected] = [withResets[index], componentsAlone[index]]
            if (value !== expected) {
              defeated.push(`${width}px ${label(elements[at]!)} ${name}: ${value}, not ${expected}`)
            }
          })
        }
      }
      expect([...new Set(defeated)]).toEqual([])
    },
  )

  it('renders one copy of each index row’s section and reading time per width, where the layout reads it', () => {
    const story = home.recent[2]!
    const firstRow = (width: number) =>
      renderAt(<SwissHome view={home} />, width).querySelector<HTMLElement>(
        '.si-earlier .si-index > li',
      )!
    const rendered = (row: Element) =>
      [...row.querySelectorAll('.si-row-facts')].filter((facts) => style(facts).display !== 'none')
    // Testing Library leaves out what display: none hides from the keyboard and assistive technology.
    const links = (row: HTMLElement) =>
      within(row)
        .getAllByRole('link')
        .map((link) => link.textContent)
    for (const width of widths) {
      const row = firstRow(width)
      const facts = rendered(row)
      expect(facts.map(label), `${width}px`).toEqual([
        width < 1024
          ? 'div.si-row-facts.si-row-facts-narrow'
          : 'div.si-row-facts.si-row-facts-wide',
      ])
      expect(facts[0]!.querySelector('a')).toHaveTextContent(story.section!.name)
      // Phones and tablets read the metadata first; desktop reads the title before column 4.
      expect(links(row), `${width}px`).toEqual(
        width < 1024 ? [story.section!.name, story.title] : [story.title, story.section!.name],
      )
    }

    // Phones: one metadata line of number, date, section and reading time, then the title and dek.
    const phone = firstRow(390)
    expect(style(phone).display).toBe('flex')
    expect(style(phone).flexDirection).toBe('column')
    const meta = phone.querySelector('.si-row-meta')!
    expect(style(meta).flexDirection).toBe('row')
    expect(style(meta).flexWrap).toBe('wrap')
    expect(style(meta.querySelector('.si-row-facts-narrow')!).display).toBe('contents')
    // Tablets: column 1 holds all the metadata, column 2 the title and dek.
    const tablet = firstRow(768)
    expect(style(tablet).display).toBe('grid')
    expect(style(tablet.querySelector('.si-row-meta .si-row-facts-narrow')!).display).toBe('flex')
    expect(style(tablet.querySelector('.si-row-copy')!).gridColumn).toBe('2')
    // Desktop: number and date, the title and dek across columns 2 and 3, then column 4.
    const desktop = firstRow(1440)
    expect(style(desktop).display).toBe('grid')
    expect(style(desktop.querySelector('.si-row-copy')!).gridColumn).toBe('2 / span 2')
    expect(style(desktop.querySelector('.si-row-facts-wide')!).gridColumn).toBe('4')

    // Section pages leave out the section column: each row links only to its story.
    const stories = [home.lead!, ...home.recent]
    for (const width of widths) {
      const page = renderAt(<SwissSection view={{ ...section, stories }} />, width)
      const rows = [...page.querySelectorAll<HTMLElement>('.si-earlier .si-index > li')]
      expect(rows).toHaveLength(stories.length - 4)
      rows.forEach((row, index) => {
        expect(row.querySelector('.si-row-facts')).toBeNull()
        expect(links(row), `${width}px`).toEqual([stories[index + 4]!.title])
        expect(style(row.querySelector('.si-row-meta .si-reading-time')!).display).not.toBe('none')
      })
    }
  })

  it('sets a section name over 80 characters at the long title size at every width', () => {
    for (const width of widths) {
      for (const [length, size] of [
        [80, 'var(--si-title)'],
        [81, 'var(--si-title-long)'],
        [120, 'var(--si-title-long)'],
      ] as const) {
        const page = renderAt(
          <SwissSection view={{ ...section, name: 'N'.repeat(length) }} />,
          width,
        )
        expect(style(page.querySelector('main h1')!).fontSize, `${length} at ${width}px`).toBe(size)
      }
    }
  })

  it('shows number plates only where an image-free plate shares its row, at each width', () => {
    const stories = [home.lead!, ...home.recent]
      .slice(0, 3)
      .map((story) => ({ ...story, image: null }))
    const shown = (width: number) =>
      [
        ...renderAt(<SwissSection view={{ ...section, stories }} />, width).querySelectorAll(
          '.si-number-plate',
        ),
      ].map((plate) => style(plate).display !== 'none')
    // Plate 03 of three has a tablet row to itself; on desktop all three share one row.
    expect(shown(390)).toEqual([false, false, false])
    expect(shown(768)).toEqual([true, true, false])
    expect(shown(1440)).toEqual([true, true, true])
    // The seeded front page: the chair story, 03, shares its row on tablet and desktop.
    expect(
      widths.map(
        (width) =>
          style(renderAt(<SwissHome view={home} />, width).querySelector('.si-number-plate')!)
            .display,
      ),
    ).toEqual(['none', 'flex', 'flex'])
  })

  it('sets the article on the grid on desktops and in one column in DOM order below 1024px', () => {
    const areas = [
      ['.si-article-header', 'head'],
      ['.si-rail', 'rail'],
      ['.si-hero', 'hero'],
      ['.si-body', 'body'],
      ['.si-end', 'end'],
    ] as const
    for (const width of widths) {
      const page = renderAt(<SwissArticle view={article} />, width)
      const grid = page.querySelector('.si-article')!
      expect(style(grid).display, `${width}px`).toBe('grid')
      expect(style(grid).getPropertyValue('grid-template-areas'), `${width}px`).toBe(
        width < 1024
          ? "'head' 'rail' 'hero' 'body' 'end'"
          : "'rail head head head' 'rail hero hero hero' 'rail body body body' 'end end end end'",
      )
      // Each part sits in its own area; the narrow template lists them in DOM order.
      expect([...grid.children].map((part) => style(part).getPropertyValue('grid-area'))).toEqual(
        areas.map(([, area]) => area),
      )
      for (const [selector, area] of areas) {
        expect(page.querySelector(selector)?.parentElement, selector).toBe(grid)
        expect(style(page.querySelector(selector)!).getPropertyValue('grid-area'), selector).toBe(
          area,
        )
      }
      // End matter: terms beside their values on desktops, above them below 1024px.
      const endRows = [...page.querySelectorAll('.si-end > div')]
      expect(endRows.length).toBeGreaterThan(0)
      for (const row of endRows)
        expect(style(row).display, `${width}px`).toBe(width < 1024 ? 'block' : 'grid')
      // Deks are secondary, at 50ch.
      const dek = page.querySelector('.si-article-header .si-dek')!
      expect(style(dek).getPropertyValue('color')).toBe('var(--si-secondary)')
      expect(style(dek).maxWidth).toBe('50ch')
      // Body links keep the 1px underline the link reset sets.
      const link = page.querySelector('.si-body p a')!
      expect(style(link).getPropertyValue('text-decoration-line')).toBe('underline')
      expect(style(link).getPropertyValue('text-decoration-thickness')).toBe('1px')
    }
  })

  it('sets an upright hero beside its caption on desktops and tablets and above it on phones', () => {
    for (const width of widths) {
      const page = renderAt(<SwissArticle view={upright} />, width)
      const figure = page.querySelector('.si-hero.si-hero-upright figure')!
      const image = figure.querySelector('img')!
      const caption = figure.querySelector('figcaption')!
      for (const source of figure.querySelectorAll('source'))
        expect(style(source).display).toBe('none')
      if (width < 600) {
        expect(style(figure).display).toBe('block')
        expect(style(caption).marginTop).toBe('0.75rem')
        continue
      }
      expect(style(figure).display, `${width}px`).toBe('grid')
      expect(style(figure).gridTemplateColumns, `${width}px`).toBe(
        width < 1024 ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
      )
      expect(style(image).gridColumn, `${width}px`).toBe(width < 1024 ? '1' : '1 / span 2')
      expect(style(caption).gridColumn, `${width}px`).toBe(width < 1024 ? '2' : '3')
      expect(style(caption).marginTop, `${width}px`).toBe('0px')
    }
    // A landscape hero keeps its caption under it.
    const landscape = renderAt(<SwissArticle view={article} />, 1440)
    expect(style(landscape.querySelector('.si-hero figure')!).display).not.toBe('grid')
  })

  it('heads author and topic pages like a section, at the page title sizes', () => {
    for (const width of widths) {
      for (const page of [
        renderAt(<SwissAuthor view={author} />, width),
        renderAt(<SwissTopic view={topic} />, width),
        renderAt(<SwissAuthor view={{ ...author, name: 'N'.repeat(81) }} />, width),
      ]) {
        const title = page.querySelector('main h1')!
        expect(style(title).fontSize, `${width}px`).toBe(
          title.textContent!.length > 80 ? 'var(--si-title-long)' : 'var(--si-title)',
        )
        expect(style(title).getPropertyValue('text-wrap'), `${width}px`).toBe('balance')
      }
      const bio = renderAt(<SwissAuthor view={author} />, width).querySelector('.si-bio')!
      expect(style(bio).getPropertyValue('white-space')).toBe('pre-line')
      expect(style(bio).getPropertyValue('color')).toBe('var(--si-secondary)')
    }
  })

  it('keeps section index and site index links at the small size on phones too', () => {
    for (const width of widths) {
      const links = [...renderAt(<SwissHome view={home} />, width).querySelectorAll('.si-nav a')]
      expect(links.length).toBeGreaterThan(2)
      for (const link of links) expect(style(link).fontSize, `${width}px`).toBe('var(--si-small)')
    }
  })
})
