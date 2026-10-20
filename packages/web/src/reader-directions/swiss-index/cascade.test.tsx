// @vitest-environment jsdom
import postcss, { type ChildNode, type Rule } from 'postcss'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { readArticleView, readHomeView, readSectionView } from '@/reader/read-model'
import type { ArticleView, HomeView, SectionView } from '@/reader/views'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { InMemoryOriginalObjectStore } from '@/server/content/media'
import { labStories } from '@/server/lab/north-house'
import { labStorySlug, seedLabContent } from '@/server/lab/seed'

import { readerDirectionStyleCss } from '../contract'
import { SwissArticle } from './article'
import { SwissHome } from './home'
import { swissIndexDirection } from './index'
import { SwissSection } from './section'

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

  beforeAll(async () => {
    const repository = new InMemoryContentRepository()
    await seedLabContent({ objects: new InMemoryOriginalObjectStore(), repository })
    const source = { mediaAvailable: true, repository }
    home = await readHomeView(source)
    section = (await readSectionView(source, 'interiors'))!
    const longTable = labStories.find(({ id }) => id === 'article-lab-long-table')!
    article = (await readArticleView(source, labStorySlug(longTable)))!
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
      // jsdom resolves the shorthand on its own; the e2e file reads the line in a browser.
      expect(style(front.querySelector('.si-top-link')!).textDecoration).toBe('underline')

      const sectionPage = renderAt(<SwissSection view={section} />, width)
      for (const title of sectionPage.querySelectorAll('main h1, .si-plate-title')) {
        expect(style(title).getPropertyValue('text-wrap'), `${width}px`).toBe('balance')
      }
    }
  })

  it(
    'never lets an element reset decide a value that a component rule declares, on any page or width',
    // Five pages at three widths, each resolved twice: well over the default under a full run.
    { timeout: 20_000 },
    () => {
      const pages = [
        <SwissHome key="home" view={home} />,
        <SwissHome key="empty" view={{ lead: null, navigation: { sections: [] }, recent: [] }} />,
        <SwissSection key="section" view={{ ...section, stories: [home.lead!, ...home.recent] }} />,
        <SwissSection key="empty-section" view={{ ...section, stories: [] }} />,
        <SwissArticle key="article" view={article} />,
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

  it('sets phone index rows as one metadata line, then the title and dek; wider rows keep their columns', () => {
    const firstRow = (width: number) =>
      renderAt(<SwissHome view={home} />, width).querySelector('.si-earlier .si-index > li')!
    const phone = firstRow(390)
    expect(style(phone).display).toBe('flex')
    expect(style(phone).flexWrap).toBe('wrap')
    // The two metadata groups flow as one line; the title and dek follow on lines of their own.
    for (const group of phone.querySelectorAll('.si-row-meta, .si-row-facts')) {
      expect(style(group).display).toBe('contents')
    }
    const copy = phone.querySelector('.si-row-copy')!
    expect(style(copy).order).toBe('1')
    expect(style(copy).flexBasis).toBe('100%')
    for (const fact of phone.querySelectorAll('.si-row-meta > *, .si-row-facts > *')) {
      expect(Number(style(fact).order || 0)).toBeLessThan(1)
    }

    const tablet = firstRow(768)
    expect(style(tablet).display).toBe('grid')
    expect(style(tablet.querySelector('.si-row-meta')!).display).toBe('flex')
    expect(style(tablet.querySelector('.si-row-facts')!).gridArea).toBe('2 / 1')
    expect(style(tablet.querySelector('.si-row-copy')!).gridArea).toBe('1 / 2 / span 2')

    const desktop = firstRow(1440)
    expect(style(desktop).display).toBe('grid')
    expect(style(desktop.querySelector('.si-row-copy')!).gridColumn).toBe('2 / span 2')
    expect(style(desktop.querySelector('.si-row-facts')!).gridColumn).toBe('4')
    for (const row of [tablet, desktop]) {
      expect(Number(style(row.querySelector('.si-row-copy')!).order || 0)).toBe(0)
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

  it('keeps section index and site index links at the small size on phones too', () => {
    for (const width of widths) {
      const links = [...renderAt(<SwissHome view={home} />, width).querySelectorAll('.si-nav a')]
      expect(links.length).toBeGreaterThan(2)
      for (const link of links) expect(style(link).fontSize, `${width}px`).toBe('var(--si-small)')
    }
  })
})
