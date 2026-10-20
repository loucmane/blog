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
    // Emitted compactly: the readable source's line breaks, indentation and spaces around braces
    // are not sent with every page.
    expect(styleCss).not.toMatch(/\n|\s[{}]|[{}]\s/)
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
      'text-decoration-line': 'underline',
    })
  })

  it('keeps every underline 1px: rules set the line, and only the link reset uses the shorthand', () => {
    // The text-decoration shorthand also resets the thickness the link reset sets.
    const shorthands: string[] = []
    css.walkDecls('text-decoration', (declaration) => {
      shorthands.push(`${(declaration.parent as Rule).selector} { ${declaration.toString()} }`)
    })
    expect(shorthands).toEqual(['& :where(.si-page) a { text-decoration: none }'])
    expect(declarations(':where(.si-page) a')['text-decoration-thickness']).toBe('1px')
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
    for (const selector of ['.si-page-header h1', '.si-article-header h1']) {
      expect(declarations(selector), selector).toMatchObject({
        'font-size': 'var(--si-title)',
        'font-weight': '800',
        'letter-spacing': '-0.06em',
        'text-wrap': 'balance',
      })
      expect(declarations(selector, '(max-width: 599px)'), selector).toMatchObject({
        'letter-spacing': '-0.04em',
      })
      expect(declarations(`${selector}.si-title-long`)['font-size'], selector).toBe(
        'var(--si-title-long)',
      )
    }
    // Deks and bios are secondary, at 50ch; a bio keeps its line breaks.
    expect(declarations('.si-dek')).toMatchObject({
      color: 'var(--si-secondary)',
      'font-size': 'var(--si-dek)',
      'max-width': '50ch',
    })
    expect(declarations('.si-bio')).toMatchObject({ 'white-space': 'pre-line' })
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

  it('lays index rows on the grid from 600px, and as a metadata line, title and dek on phones', () => {
    expect(declarations('.si-index > li')).toMatchObject({
      'border-top': '1px solid var(--si-ink)',
      'grid-template-columns': 'repeat(4, minmax(0, 1fr))',
    })
    expect(declarations('.si-row-copy')['grid-column']).toBe('2 / span 2')
    expect(declarations('.si-row-facts-wide')['grid-column']).toBe('4')
    expect(declarations('.si-index-sectionless .si-row-copy')['grid-column']).toBe('2 / -1')
    expect(declarations('.si-index > li', '(max-width: 1023px)')['grid-template-columns']).toBe(
      'repeat(2, minmax(0, 1fr))',
    )
    expect(declarations('.si-row-copy', '(max-width: 1023px)')['grid-column']).toBe('2')
    expect(declarations('.si-index-sectionless .si-row-copy', '(max-width: 1023px)')).toMatchObject(
      { 'grid-column': '2' },
    )
    expect(declarations('.si-index > li', '(max-width: 599px)')).toMatchObject({
      display: 'flex',
      'flex-direction': 'column',
    })
    expect(declarations('.si-row-meta', '(max-width: 599px)')).toMatchObject({
      'flex-direction': 'row',
      'flex-wrap': 'wrap',
    })
  })

  it('shows one copy of an index row’s section and reading time: in the metadata below 1024px, after the dek from 1024px', () => {
    // Desktop is the default; one query swaps the copies, so no width shows both or neither.
    expect(declarations('.si-row-facts-narrow')).toMatchObject({ display: 'none' })
    expect(declarations('.si-row-facts-narrow', '(max-width: 1023px)')).toMatchObject({
      display: 'flex',
    })
    expect(declarations('.si-row-facts-wide', '(max-width: 1023px)')).toMatchObject({
      display: 'none',
    })
    expect(declarations('.si-row-facts-narrow', '(max-width: 599px)')).toMatchObject({
      display: 'contents',
    })
    // DOM, focus and visual order agree: no rule moves an item away from its place in the DOM.
    const reordered: string[] = []
    css.walkDecls('order', (declaration) => {
      reordered.push(`${(declaration.parent as Rule).selector} { ${declaration.toString()} }`)
    })
    expect(reordered).toEqual([])
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
      '.si-list-empty a',
      '.si-rail a',
      '.si-end a',
      '.si-page figcaption a',
      ".si-body [data-block='embed'] a",
      '.si-failure-actions a',
      '.si-retry',
      '.si-theme',
    ]) {
      expect(declarations(selector)['min-height'], selector).toBe('44px')
    }
  })

  it('prints one column without the indexes, the Theme control, number plates or related stories', () => {
    for (const selector of [
      '.si-skip',
      '.si-nav',
      '.si-theme',
      '.si-top-link',
      '.si-number-plate',
      '.si-related',
    ]) {
      expect(declarations(selector, 'print'), selector).toMatchObject({ display: 'none' })
    }
    for (const selector of [
      '.si-plates',
      '.si-article',
      '.si-end > div',
      '.si-hero-upright figure',
    ]) {
      expect(declarations(selector, 'print'), selector).toMatchObject({ display: 'block' })
    }
  })

  it('sets the article on the grid: the rail in column 1 beside header, hero and body; one column in DOM order below 1024px', () => {
    expect(declarations('.si-article')).toMatchObject({
      'column-gap': 'var(--si-gap)',
      display: 'grid',
      'grid-template-areas':
        "'rail head head head' 'rail hero hero hero' 'rail body body body' 'end end end end'",
      'grid-template-columns': 'repeat(4, minmax(0, 1fr))',
    })
    // The DOM order of the article's parts: header, rail, hero, body, end matter.
    expect(declarations('.si-article', '(max-width: 1023px)')).toMatchObject({
      'grid-template-areas': "'head' 'rail' 'hero' 'body' 'end'",
      'grid-template-columns': 'minmax(0, 1fr)',
    })
    for (const [selector, area] of [
      ['.si-article-header', 'head'],
      ['.si-rail', 'rail'],
      ['.si-hero', 'hero'],
      ['.si-body', 'body'],
      ['.si-end', 'end'],
    ] as const) {
      expect(declarations(selector)['grid-area'], selector).toBe(area)
    }
    expect(declarations('.si-rail')['border-top']).toBe('4px solid var(--si-ink)')
    expect(declarations('.si-end')['border-top']).toBe('4px solid var(--si-ink)')
    // Body text runs 65ch from the left edge of column 2.
    expect(declarations('.si-body')['max-width']).toBe('var(--si-measure)')
    expect(declarations('.si-related')['margin-top']).toBe('var(--si-space)')
  })

  it('sets an upright hero in columns 2 and 3 with its caption in column 4, beside it on tablets and under it on phones', () => {
    expect(declarations('.si-hero-upright figure')).toMatchObject({
      'column-gap': 'var(--si-gap)',
      display: 'grid',
      'grid-template-columns': 'repeat(3, minmax(0, 1fr))',
    })
    // The picture takes no part in layout: its image and the decorative figure number are the
    // grid's items, and its sources render nothing.
    expect(declarations('.si-hero-upright figure::before')['grid-column']).toBe('1 / -1')
    expect(declarations('.si-hero-upright source')).toMatchObject({ display: 'none' })
    expect(declarations('.si-hero-upright img')['grid-column']).toBe('1 / span 2')
    expect(declarations('.si-hero-upright figcaption')).toMatchObject({
      'grid-column': '3',
      'margin-top': '0',
    })
    expect(declarations('.si-hero-upright figure', '(max-width: 1023px)')).toMatchObject({
      'grid-template-columns': 'repeat(2, minmax(0, 1fr))',
    })
    expect(declarations('.si-hero-upright img', '(max-width: 1023px)')['grid-column']).toBe('1')
    expect(declarations('.si-hero-upright figcaption', '(max-width: 1023px)')['grid-column']).toBe(
      '2',
    )
    expect(declarations('.si-hero-upright figure', '(max-width: 599px)')).toMatchObject({
      display: 'block',
    })
    expect(declarations('.si-page figcaption')['max-width']).toBe('65ch')
    // The figure number is decorative: generated content with an empty alternative.
    expect(declarations('.si-article figure:has(picture)::before').content).toBe(
      "'Fig. ' counter(si-figure) / ''",
    )
  })

  it('sets rail and end matter terms in mono at the label size and values at the small size, with underlined 44px links', () => {
    for (const selector of ['.si-rail', '.si-end']) {
      expect(declarations(selector), selector).toMatchObject({
        'font-family': 'var(--si-mono)',
        'font-size': 'var(--si-small)',
      })
      expect(declarations(`${selector} dt`), selector).toMatchObject({
        color: 'var(--si-secondary)',
        'font-size': 'var(--si-label)',
      })
      expect(declarations(`${selector} a`), selector).toMatchObject({
        'min-height': '44px',
        'min-width': '44px',
        'text-decoration-line': 'underline',
      })
    }
    // End matter: terms in column 1, values across columns 2 to 4; terms above values below 1024px.
    expect(declarations('.si-end > div')).toMatchObject({
      display: 'grid',
      'grid-template-columns': 'repeat(4, minmax(0, 1fr))',
    })
    expect(declarations('.si-end dt')['grid-column']).toBe('1')
    expect(declarations('.si-end dd')['grid-column']).toBe('2 / -1')
    expect(declarations('.si-end > div', '(max-width: 1023px)')).toMatchObject({ display: 'block' })
  })

  it('treats every editorial block kind and inline mark to the spec', () => {
    expect(declarations('.si-body :is(h2, h3, h4, h5, h6)')['margin-block']).toBe('2.75rem 1rem')
    expect(declarations('.si-body h2')).toMatchObject({
      'border-top': '1px solid var(--si-ink)',
      'font-size': 'var(--si-heading)',
      'padding-top': '0.75rem',
    })
    expect(declarations('.si-body h3')['font-size']).toBe('var(--si-card)')
    expect(declarations('.si-body :is(h4, h5, h6)')['font-size']).toBe('var(--si-dek)')
    expect(declarations('.si-body blockquote')).toMatchObject({
      'border-left': '4px solid var(--si-ink)',
      'padding-left': '1.5rem',
    })
    expect(declarations(".si-body [data-block='pull-quote']")['border-block']).toBe(
      '1px solid var(--si-ink)',
    )
    expect(declarations('.si-body li::marker')['font-family']).toBe('var(--si-mono)')
    // Checklist boxes are drawn: the glyphs lie outside the Latin subsets (fonts.test.ts). They
    // mark the checklist's own items only, never a list nested in a task (cascade.test.tsx).
    expect(
      declarations(".si-body [data-block='checklist'] > li > span[aria-hidden]"),
    ).toMatchObject({
      display: 'none',
    })
    expect(declarations(".si-body [data-block='checklist'] > li::before")).toMatchObject({
      border: '2px solid var(--si-ink)',
      'box-sizing': 'border-box',
      content: "''",
      height: '1em',
      width: '1em',
    })
    expect(
      declarations(".si-body [data-block='checklist'] > li[data-checked='true']::before")
        .background,
    ).toBe('var(--si-ink)')
    expect(
      declarations(
        ".si-body [data-block='checklist'] > li[data-checked='true']::before",
        '(forced-colors: active)',
      ),
    ).toMatchObject({ background: 'CanvasText', 'forced-color-adjust': 'none' })
    expect(declarations(".si-body [data-block='gallery']")['grid-template-columns']).toBe(
      'repeat(2, minmax(0, 1fr))',
    )
    expect(declarations(".si-body [data-layout='carousel']")['grid-template-columns']).toBe('1fr')
    expect(
      declarations(".si-body [data-block='gallery']", '(max-width: 599px)')[
        'grid-template-columns'
      ],
    ).toBe('1fr')
    // Callouts: a 1px ink box with a mono capital label; tip on the plate; warning with a signal rule.
    expect(declarations(".si-body [data-block='callout']").border).toBe('1px solid var(--si-ink)')
    expect(declarations(".si-body [data-block='callout'] > :first-child")).toMatchObject({
      'font-family': 'var(--si-mono)',
      'text-transform': 'uppercase',
    })
    expect(declarations(".si-body [data-block='callout'][data-variant='tip']").background).toBe(
      'var(--si-plate)',
    )
    expect(
      declarations(".si-body [data-block='callout'][data-variant='warning']")['border-left'],
    ).toBe('4px solid var(--si-signal)')
    expect(declarations('.si-body pre')).toMatchObject({
      background: 'var(--si-plate)',
      'border-block': '1px solid var(--si-ink)',
      'white-space': 'pre-wrap',
    })
    expect(declarations('.si-body hr')).toMatchObject({
      'border-top': '4px solid var(--si-ink)',
      'margin-block': '3rem',
    })
    // Embeds are link cards with a decorative arrow.
    expect(declarations(".si-body [data-block='embed']").border).toBe('1px solid var(--si-ink)')
    expect(declarations(".si-body [data-block='embed'] a")).toMatchObject({
      'font-size': 'var(--si-card)',
      'font-weight': '700',
    })
    expect(declarations(".si-body [data-block='embed'] a::after").content).toBe("'↗' / ''")
    // Editorial blocks: a visible label that repeats the section's name without announcing it twice.
    expect(declarations(".si-body [data-block='editorial']::before")).toMatchObject({
      content: "attr(aria-label) / ''",
      display: 'block',
      'font-family': 'var(--si-mono)',
      'text-transform': 'uppercase',
    })
    expect(declarations(".si-body [data-variant='fact-box']").background).toBe('var(--si-plate)')
    for (const variant of ['key-points', 'related-stories']) {
      expect(declarations(`.si-body [data-variant='${variant}']`)['border-top'], variant).toBe(
        '4px solid var(--si-ink)',
      )
    }
    expect(declarations(".si-body [data-variant='methodology']")).toMatchObject({
      'border-top': '1px solid var(--si-ink)',
      color: 'var(--si-secondary)',
      'font-size': 'var(--si-copy)',
    })
    // Inline marks: bold 700, links underlined, underline dotted so it does not read as a link.
    expect(declarations('.si-body strong')['font-weight']).toBe('700')
    expect(declarations('.si-body a')['text-decoration-line']).toBe('underline')
    expect(declarations('.si-body u')['text-decoration-style']).toBe('dotted')
  })
})
