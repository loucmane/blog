import postcss, { type AtRule, type Node, type Rule } from 'postcss'
import { describe, expect, it } from 'vitest'

import { readerDirectionStyleCss, readerDirectionTokenCss } from '../contract'
import { swissIndexDirection } from './index'

const styleCss = readerDirectionStyleCss(swissIndexDirection)!
const tokenCss = readerDirectionTokenCss(swissIndexDirection)!
const css = postcss.parse(styleCss)

/** The query of the media rule a rule sits in, or null outside any. */
function mediaOf(rule: Rule): string | null {
  for (let node = rule.parent as Node | undefined; node; node = node.parent as Node | undefined) {
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

describe('Swiss Index styles', () => {
  it('keeps the direction CSS, styles and tokens together, within 20,000 bytes', () => {
    expect(Buffer.byteLength(styleCss) + Buffer.byteLength(tokenCss)).toBeLessThanOrEqual(20_000)
  })

  it('moves nothing: no transitions, animations, sticky or fixed elements, or smooth scrolling', () => {
    css.walkDecls((declaration) => {
      const where = `${(declaration.parent as Rule).selector} { ${declaration.toString()} }`
      if (/^(?:transition|animation)(?:-|$)/.test(declaration.prop)) {
        expect(declaration.value, where).toBe('none')
      }
      if (declaration.prop === 'position')
        expect(['sticky', 'fixed'], where).not.toContain(declaration.value)
      if (declaration.prop === 'scroll-behavior') expect(declaration.value, where).toBe('auto')
      // The skip link is the only element that moves into view, and only on focus.
      if (declaration.prop === 'transform') expect(where).toContain('.si-skip')
    })
    const guards = new Set<string>()
    css.walkAtRules('media', (rule) => {
      guards.add(rule.params)
    })
    expect([...guards]).toEqual(
      expect.arrayContaining([
        '(prefers-reduced-motion: reduce)',
        '(forced-colors: active)',
        'print',
      ]),
    )
  })

  it('rules the masthead, the index cells and the footer, and marks the current cell in signal', () => {
    expect(declarations('.si-masthead')).toMatchObject({
      'border-bottom': '4px solid var(--si-ink)',
    })
    expect(declarations('.si-footer')).toMatchObject({ 'border-top': '4px solid var(--si-ink)' })
    expect(declarations('.si-nav li')).toMatchObject({ 'border-left': '1px solid var(--si-ink)' })
    expect(declarations('.si-nav li[data-current]')).toMatchObject({
      'border-left': '4px solid var(--si-signal)',
    })
    // Colour is never the only cue: the current link keeps its underline.
    expect(declarations('.si-nav a[aria-current]')).toMatchObject({
      'text-decoration': 'underline',
    })
  })

  it('sets the section index in four columns, two on phones, and the footer index in three, two below desktop', () => {
    const columns = (selector: string, media: string | null = null) =>
      declarations(selector, media)['grid-template-columns']
    expect(columns('.si-nav ul')).toBe('repeat(4, minmax(0, 1fr))')
    expect(columns('.si-nav ul', '(max-width: 599px)')).toBe('repeat(2, minmax(0, 1fr))')
    expect(columns('.si-footer .si-nav ul')).toBe('repeat(3, minmax(0, 1fr))')
    expect(columns('.si-footer .si-nav ul', '(max-width: 1023px)')).toBe(
      'repeat(2, minmax(0, 1fr))',
    )
  })

  it('sets plates on the four-column grid and crops every image around its focal point', () => {
    expect(declarations('.si-plates')['grid-template-columns']).toBe('repeat(4, minmax(0, 1fr))')
    expect(declarations('.si-plates', '(max-width: 1023px)')['grid-template-columns']).toBe(
      'repeat(2, minmax(0, 1fr))',
    )
    expect(declarations('.si-plates', '(max-width: 599px)')['grid-template-columns']).toBe('1fr')
    expect(declarations('.si-plate-lead')).toMatchObject({ 'grid-column': 'span 2' })
    expect(declarations('.si-plate-image')).toMatchObject({
      'aspect-ratio': '4 / 3',
      background: 'var(--si-plate)',
    })
    expect(declarations('.si-plate-lead .si-plate-image')).toMatchObject({
      'aspect-ratio': '3 / 2',
    })
    expect(declarations('.si-plate-image img')).toMatchObject({
      'object-fit': 'cover',
      'object-position': 'var(--si-focus, 50% 50%)',
    })
  })

  it('draws number plates in ink on the plate surface, only where plates share a row', () => {
    expect(declarations('.si-number-plate')).toMatchObject({
      'aspect-ratio': '4 / 3',
      background: 'var(--si-plate)',
      color: 'var(--si-ink)',
      'font-size': 'var(--si-plate-number)',
      'font-weight': '800',
    })
    expect(declarations('.si-number-plate', '(max-width: 599px)')).toMatchObject({
      display: 'none',
    })
  })

  it('makes the title link the plate’s one target while the section link stays above it', () => {
    expect(declarations('.si-plate')).toMatchObject({ position: 'relative' })
    expect(declarations('.si-plate-title a::after')).toMatchObject({
      content: "''",
      position: 'absolute',
      inset: '0',
    })
    expect(declarations('.si-plate-meta a')).toMatchObject({ position: 'relative', 'z-index': '1' })
  })

  it('balances page h1s and plate titles at the developed sizes', () => {
    expect(declarations('.si-section-header h1')).toMatchObject({
      'font-size': 'var(--si-title)',
      'font-weight': '800',
      'letter-spacing': '-0.06em',
      'text-wrap': 'balance',
    })
    expect(declarations('.si-section-header h1', '(max-width: 599px)')).toMatchObject({
      'letter-spacing': '-0.04em',
    })
    expect(declarations('.si-plate-title')).toMatchObject({
      'font-size': 'var(--si-card)',
      'text-wrap': 'balance',
    })
    expect(declarations('.si-plate-lead .si-plate-title')['font-size']).toBe('var(--si-heading)')
    expect(declarations('.si-plate-text .si-plate-title')['font-size']).toBe('var(--si-title)')
    expect(declarations('.si-plate-long .si-plate-title')['font-size']).toBe('var(--si-title-long)')
    expect(declarations('.si-plate-dek')['max-width']).toBe('60ch')
    expect(declarations('.si-row-dek')['max-width']).toBe('65ch')
  })

  it('lays index rows on the grid: metadata, then title and dek, then section and reading time', () => {
    expect(declarations('.si-index > li')).toMatchObject({
      'border-top': '1px solid var(--si-ink)',
      'grid-template-columns': 'repeat(4, minmax(0, 1fr))',
    })
    expect(declarations('.si-row-copy')['grid-column']).toBe('2 / span 2')
    expect(declarations('.si-row-facts')['grid-column']).toBe('4')
    expect(declarations('.si-index-sectionless .si-row-copy')['grid-column']).toBe('2 / -1')
    expect(declarations('.si-index > li', '(max-width: 1023px)')['grid-template-columns']).toBe(
      'repeat(2, minmax(0, 1fr))',
    )
    expect(declarations('.si-index > li', '(max-width: 599px)')['grid-template-columns']).toBe(
      '1fr',
    )
  })

  it('styles the Theme trigger square, ruled and mono, 44px high, without a transition', () => {
    expect(declarations('.si-theme')).toMatchObject({
      border: '1px solid var(--si-ink)',
      'border-radius': '0',
      'box-shadow': 'none',
      'font-family': 'var(--si-mono)',
      'min-height': '44px',
      transition: 'none',
    })
  })

  it('keeps standalone links at least 44 pixels high', () => {
    for (const selector of [
      '.si-wordmark a',
      '.si-nav a',
      '.si-plate-meta a',
      '.si-plate-title a',
      '.si-row-title a',
      '.si-row-facts a',
      '.si-top-link',
      '.si-section-empty a',
    ]) {
      expect(declarations(selector)['min-height'], selector).toBe('44px')
    }
  })

  it('prints one column without the indexes, the Theme control or number plates', () => {
    for (const selector of [
      '.si-skip',
      '.si-nav',
      '.si-theme',
      '.si-top-link',
      '.si-number-plate',
    ]) {
      expect(declarations(selector, 'print'), selector).toMatchObject({ display: 'none' })
    }
    expect(declarations('.si-plates', 'print')).toMatchObject({ display: 'block' })
  })
})
