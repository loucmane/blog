// @vitest-environment jsdom
import fs from 'node:fs'
import path from 'node:path'

import { within } from '@testing-library/dom'
import { cleanup, fireEvent, render } from '@testing-library/react'
import postcss, { type AtRule, type Rule } from 'postcss'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { readerFailureView } from '@/reader/components/failure-view'
import { siteName } from '@/reader/components/site-header'

import type { ReaderFailureView } from '../contract'
import { contrastRatio } from '../contrast'
import { MonographError, MonographNotFound, MonographUnavailable } from './failure'
import { quietMonographDirection } from './index'
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

function mediaOf(rule: Rule) {
  return rule.parent?.type === 'atrule' ? (rule.parent as AtRule).params : undefined
}

/** Declarations of the rules whose selector list includes `selector`, inside `media` or at the top. */
function declarations(selector: string, media?: string) {
  const found: Record<string, string> = {}
  styleRules.walkRules((rule) => {
    if (mediaOf(rule) !== media || !rule.selectors.includes(selector)) return
    rule.walkDecls((declaration) => {
      found[declaration.prop] = `${declaration.value}${declaration.important ? ' !important' : ''}`
    })
  })
  return found
}

/** Every declaration of the matching properties, with its rule's selector and media. */
function uses(property: RegExp) {
  const found: { media: string | undefined; property: string; selector: string; value: string }[] =
    []
  styleRules.walkDecls(property, (declaration) => {
    const rule = declaration.parent as Rule
    found.push({
      media: mediaOf(rule),
      property: declaration.prop,
      selector: rule.selector,
      value: declaration.value,
    })
  })
  return found
}

// Spec section 2.7, with the unavailable page in the same block and today's copy.
const failures = [
  {
    label: 'Not found',
    message: 'The page may have moved, or the address may be mistyped.',
    page: (view: ReaderFailureView) => <MonographNotFound view={view} />,
    title: 'Page not found',
  },
  {
    label: 'Error',
    message: 'The page could not be shown. Please try again.',
    page: (view: ReaderFailureView) => <MonographError reset={() => {}} view={view} />,
    title: 'Something went wrong',
  },
  {
    label: 'Unavailable',
    message: 'The magazine cannot reach its stories right now. Please try again later.',
    page: (view: ReaderFailureView) => <MonographUnavailable view={view} />,
    title: 'Stories are unavailable',
  },
] as const

class ResizeObserverStub {
  disconnect() {}
  observe() {}
  unobserve() {}
}

describe('Quiet Monograph failure pages', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('registers its own not-found, error and unavailable views', () => {
    expect(quietMonographDirection.NotFound).toBe(MonographNotFound)
    expect(quietMonographDirection.Error).toBe(MonographError)
    expect(quietMonographDirection.Unavailable).toBe(MonographUnavailable)
  })

  it.each(failures)(
    'sets "$title" in the frame: one h1 naming it, the label, one sentence and the way home',
    ({ label, message, page, title }) => {
      const { document, screen } = markup(page(readerFailureView))
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      const heading = screen.getByRole('heading', { level: 1, name: title })
      expect(document.querySelectorAll('main')).toHaveLength(1)
      const main = document.querySelector('main')!
      expect(main.id).toBe('qm-main')
      expect(main.getAttribute('tabindex')).toBe('-1')
      const block = main.querySelector<HTMLElement>('.qm-failure')!
      expect(block.contains(heading)).toBe(true)
      const sentence = block.querySelector('.qm-failure-message')
      expect(block.querySelector('.qm-label')?.textContent).toBe(label)
      expect(sentence?.textContent).toBe(message)
      const home = within(block).getByRole('link', { name: 'Front page' })
      expect(home.getAttribute('href')).toBe('/')
      expect(links(main)).toEqual([['Front page', '/']])
      expectInOrder(block.querySelector('.qm-label'), heading, sentence, home)
      // The site name is a link in the masthead, never a second heading.
      const wordmark = document.querySelector('header.qm-masthead .qm-wordmark')!
      expect(wordmark.tagName).toBe('P')
      expect(links(wordmark)).toEqual([[siteName, '/']])
      expect(document.querySelector('.qm-footer-brand')?.textContent).toBe(siteName)
      // The shared failure model knows no sections: "Front page" alone, and nothing is current.
      expect(document.querySelectorAll('nav')).toHaveLength(3)
      for (const nav of document.querySelectorAll('nav')) {
        expect(links(nav)).toEqual([['Front page', '/']])
      }
      expect(document.querySelectorAll('[aria-current]')).toHaveLength(0)
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
      const { document } = markup(page(view))
      expect(document.querySelector('.qm-wordmark')?.textContent).toBe(view.siteName)
      expect(document.querySelector('.qm-footer-brand')?.textContent).toBe(view.siteName)
      for (const nav of document.querySelectorAll('nav')) {
        expect(links(nav)).toEqual([
          ['Front page', '/'],
          ['Craft', '/sections/craft'],
        ])
      }
      expect(document.querySelectorAll('[aria-current]')).toHaveLength(0)
    }
  })

  it('retries with a Try again button before the way home, wired to the boundary reset', () => {
    const reset = vi.fn()
    const { container } = render(<MonographError reset={reset} view={readerFailureView} />)
    const main = container.querySelector('main')!
    const retry = within(main).getByRole('button', { name: 'Try again' })
    expect(retry.getAttribute('type')).toBe('button')
    expect(retry.classList).toContain('qm-retry')
    expectInOrder(
      main.querySelector('h1'),
      retry,
      within(main).getByRole('link', { name: 'Front page' }),
    )
    expect(reset).not.toHaveBeenCalled()
    fireEvent.click(retry)
    expect(reset).toHaveBeenCalledOnce()
  })

  it('keeps the failure views synchronous and the direction graph client-compatible', () => {
    // The error view renders in the client error boundary; NotFound in its client upgrader.
    for (const view of [MonographNotFound, MonographError, MonographUnavailable]) {
      expect(Object.prototype.toString.call(view)).toBe('[object Function]')
    }
    // The registry's direction modules enter the failure boundary's lazy client graph.
    const folder = path.join(process.cwd(), 'packages/web/src/reader-directions/quiet-monograph')
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

  it('centres the failure block --qm-space below the masthead, at the title size, with a Jost sentence and a label-style Try again', () => {
    expect(declarations('& .qm-failure')).toMatchObject({
      'padding-block': 'var(--qm-space)',
      'text-align': 'center',
    })
    expect(declarations('& .qm-failure h1')).toMatchObject({
      'font-size': 'var(--qm-title)',
      'line-height': '1.05',
      'max-width': '14em',
    })
    expect(declarations('& .qm-page .qm-failure-message')).toMatchObject({
      'font-family': 'var(--qm-text)',
      'font-size': 'var(--qm-body)',
    })
    expect(declarations('& .qm-failure-actions')).toMatchObject({
      display: 'flex',
      'flex-wrap': 'wrap',
      'justify-content': 'center',
    })
    // The label style, in ink with a 1px underline, at least 44 by 44px.
    expect(declarations('& .qm-page .qm-retry')).toMatchObject({
      ...declarations('& .qm-page .qm-label'),
      background: 'transparent',
      border: '0',
      color: 'var(--qm-ink)',
      'min-height': '44px',
      'min-width': '44px',
      'text-decoration-line': 'underline',
      'text-decoration-thickness': '1px',
    })
  })
})

describe('Quiet Monograph accessibility and Core Web Vitals rules', () => {
  it('draws text only in ink and stone ink, each a pair checked in both themes, and stone only as decoration', () => {
    for (const { selector, value } of uses(/^color$/)) {
      if (selector.includes('.qm-monogram')) {
        // Monograms are aria-hidden display letters: decoration, at 3:1 or more.
        expect(value).toBe('var(--qm-stone)')
        continue
      }
      // Links inherit the ink or stone ink they sit in.
      expect(
        ['inherit', 'transparent', 'var(--qm-ink)', 'var(--qm-stone-ink)'],
        selector,
      ).toContain(value)
    }
    for (const { selector, value } of uses(/^background(?:-color)?$/)) {
      expect(['var(--qm-paper)', 'var(--qm-sand)', 'transparent'], selector).toContain(value)
    }
    expect(tokens.textPairs).toEqual(
      expect.arrayContaining([
        ['--qm-ink', '--qm-paper'],
        ['--qm-stone-ink', '--qm-paper'],
        ['--qm-ink', '--qm-sand'],
      ]),
    )
    // Stone ink never sits on sand: sand grounds (selection, image placeholders) carry ink.
    styleRules.walkRules((rule) => {
      const values = new Map<string, string>()
      rule.walkDecls((declaration) => {
        values.set(declaration.prop, declaration.value)
      })
      if ((values.get('background') ?? values.get('background-color')) !== 'var(--qm-sand)') return
      expect(values.get('color') ?? 'var(--qm-ink)', rule.selector).toBe('var(--qm-ink)')
    })
    const light: Record<string, string> = tokens.light
    const dark: Record<string, string> = { ...tokens.light, ...tokens.dark }
    for (const theme of [light, dark]) {
      // Large decorative letters and the non-text ink marks (focus ring, boxes) reach 3:1.
      expect(contrastRatio(theme['--qm-stone']!, theme['--qm-paper']!)).toBeGreaterThanOrEqual(3)
      expect(contrastRatio(theme['--qm-ink']!, theme['--qm-paper']!)).toBeGreaterThanOrEqual(3)
    }
  })

  it('keeps keyboard focus visible: an ink ring on links, summaries and buttons, Highlight in forced colours, and nothing hiding it', () => {
    expect(declarations('& .qm-page :is(a, summary, button):focus-visible')).toMatchObject({
      outline: '2px solid var(--qm-ink)',
      'outline-offset': '5px',
    })
    expect(
      declarations('& .qm-page :is(a, summary, button):focus-visible', '(forced-colors: active)'),
    ).toMatchObject({ 'outline-color': 'Highlight' })
    for (const { property, selector, value } of uses(/^outline/)) {
      expect(`${property}: ${value}`, selector).not.toMatch(
        /^outline(?:-style)?: (?:none|0)\b|^outline-width: 0|^outline-color: transparent/,
      )
    }
    // The Theme trigger draws no ring, border or shadow of its own; the ink ring replaces them.
    expect(declarations('& .qm-page .qm-theme')).toMatchObject({
      border: '0',
      'box-shadow': 'none',
    })
  })

  it('moves only the plate shadow, never scrolls smoothly, and stops everything under reduced motion', () => {
    const moving = uses(/^transition/).filter(
      ({ media, value }) => media !== '(prefers-reduced-motion: reduce)' && value !== 'none',
    )
    expect(moving.map(({ value }) => value)).toEqual(['box-shadow 200ms ease-out'])
    expect(moving[0]!.selector).toContain('.qm-plate-box picture img')
    expect(uses(/^animation/).map(({ value }) => value)).toEqual(['none'])
    expect(uses(/^scroll-behavior$/).map(({ value }) => value)).toEqual(['auto'])
    for (const selector of ['& .qm-page *', '& .qm-page *::before', '& .qm-page *::after']) {
      expect(declarations(selector, '(prefers-reduced-motion: reduce)')).toMatchObject({
        animation: 'none',
        'scroll-behavior': 'auto',
        transition: 'none',
      })
    }
    // The plate rule (0,2,2) outranks the general guard (0,2,0), so the guard names it as well.
    for (const selector of moving[0]!.selector.split(/,\s*/)) {
      expect(declarations(selector, '(prefers-reduced-motion: reduce)'), selector).toMatchObject({
        transition: 'none',
      })
    }
  })

  it('keeps emphasis visible on cold views: only em may slant the upright fallback, and nothing is bolded', () => {
    expect(
      uses(/^font-synthesis/).map(({ property, selector, value }) => [selector, property, value]),
    ).toEqual([
      ['& .qm-page', 'font-synthesis', 'none'],
      ['& .qm-page em', 'font-synthesis-style', 'auto'],
    ])
    // Each family's italic shares its upright, metric-adjusted fallback (fonts.ts), so a face that
    // misses its block period leaves no italic to draw with.
    for (const font of quietMonographDirection.fonts) {
      expect(
        font.sources.some(({ style }) => style === 'italic'),
        font.variable,
      ).toBe(true)
    }
    // Browsers synthesize bold only from 600; the direction uses 400 and 500.
    for (const { value } of uses(/^font-weight$/)) expect(['400', '500']).toContain(value)
  })
})
