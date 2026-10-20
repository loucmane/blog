import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

import { contrastRatio } from '../contrast'
import { readerDirectionStyleCss, readerDirectionTokenCss } from '../contract'
import { cinematicFeatureDirection } from './index'
import { styles } from './styles'
import { tokens } from './tokens'

const css = postcss.parse(styles)

function declarations(selector: string, media?: string) {
  const result: Record<string, string> = {}
  css.walkRules(selector, (rule) => {
    const parent = rule.parent
    if (
      media
        ? parent?.type !== 'atrule' || parent.name !== 'media' || parent.params !== media
        : parent?.type !== 'root'
    )
      return
    rule.walkDecls((decl) => {
      result[decl.prop] = decl.value
    })
  })
  return result
}

describe('Cinematic Feature b1 design constraints', () => {
  it('declares every text pairing and keeps UI boundaries above 3:1 in both themes', () => {
    expect(tokens.textPairs).toHaveLength(7)
    expect(tokens.textPairs).toContainEqual(['--cf-ground', '--cf-amber'])
    for (const palette of [tokens.light, { ...tokens.light, ...tokens.dark }]) {
      for (const [text, background] of tokens.textPairs)
        expect(contrastRatio(palette[text], palette[background])).toBeGreaterThanOrEqual(4.5)
      for (const background of ['--cf-ground', '--cf-paper'] as const)
        expect(contrastRatio(palette['--cf-ui-rule'], palette[background])).toBeGreaterThanOrEqual(
          3,
        )
    }
  })

  it('uses legible utility text and the specified mobile, tablet and desktop scales', () => {
    expect(tokens.light).toMatchObject({
      '--cf-label': '0.875rem',
      '--cf-small': '0.875rem',
      '--cf-body': '1.125rem',
      '--cf-title': '2.75rem',
      '--cf-collection-title': '2.5rem',
      '--cf-card': '1.75rem',
      '--cf-gutter': '1.25rem',
      '--cf-gap': '1rem',
      '--cf-space': '3rem',
    })
    expect(declarations('&', '(min-width: 768px)')).toMatchObject({
      '--cf-title': '4rem',
      '--cf-card': '2rem',
      '--cf-body': '1.25rem',
      '--cf-collection-title': '3.5rem',
      '--cf-gutter': '2rem',
      '--cf-gap': '1.5rem',
      '--cf-space': '4rem',
    })
    expect(declarations('&', '(min-width: 1024px)')).toMatchObject({
      '--cf-title': 'clamp(4rem, 6vw, 7rem)',
      '--cf-feature': '2.5rem',
      '--cf-collection-title': '4.5rem',
      '--cf-gutter': '3rem',
      '--cf-gap': '2rem',
      '--cf-space': '6rem',
    })
  })

  it('keeps home text opaque and captions below the photo at desktop, with no viewport-height stage', () => {
    expect(declarations('& .cf-lead')).toMatchObject({
      background: 'var(--cf-ground)',
      padding: '1.5rem',
    })
    expect(declarations('& .cf-cover-image figcaption')).toMatchObject({
      'grid-row': '2',
      background: 'var(--cf-ground)',
    })
    expect(declarations('& .cf-cover-content', '(min-width: 1024px)')['grid-row']).toBe('1')
    expect(declarations('& .cf-cover', '(min-width: 1024px)')['grid-template-rows']).toBe(
      'minmax(clamp(32rem, 56.25vw, 56rem), auto) auto',
    )
    expect(styles).not.toMatch(/svh|@starting-style|450ms|cf-cover-page \.cf-masthead/)
    expect(declarations('& .cf-masthead').background).toBe('var(--cf-ground)')
    expect(declarations('& .cf-cover::before')).toEqual({})
  })

  it('reserves cropped frames, inherits focal points through pictures, and preserves keyboard focus', () => {
    expect(declarations('& .cf-cover-image figure > :not(figcaption)')['aspect-ratio']).toBe(
      '4 / 3',
    )
    expect(
      declarations('& .cf-cover-image figure > :not(figcaption)', '(min-width: 768px)')[
        'aspect-ratio'
      ],
    ).toBe('16 / 9')
    expect(declarations('& .cf-card-image figure > :not(figcaption)')['aspect-ratio']).toBe('3 / 2')
    expect(
      declarations('& .cf-feature .cf-card-image figure > :not(figcaption)')['aspect-ratio'],
    ).toBe('4 / 3')
    for (const selector of ['& .cf-cover-image img', '& .cf-card-image img', '& .cf-thumbnail img'])
      expect(declarations(selector)).toMatchObject({
        'object-fit': 'cover',
        'object-position': 'inherit',
      })
    expect(declarations('& .cf-page :focus-visible')).toMatchObject({
      outline: '3px solid var(--cf-amber)',
      'outline-offset': '3px',
    })
    expect(
      declarations('& .cf-page :focus-visible', '(forced-colors: active)')['outline-color'],
    ).toBe('Highlight')
    expect(
      declarations(
        '& .cf-page *, & .cf-page *::before, & .cf-page *::after',
        '(prefers-reduced-motion: reduce)',
      ),
    ).toMatchObject({ transition: 'none', animation: 'none', 'scroll-behavior': 'auto' })
  })

  it('keeps emitted direction styles and tokens within the 24 KiB budget', () => {
    const emitted =
      readerDirectionStyleCss(cinematicFeatureDirection)! +
      readerDirectionTokenCss(cinematicFeatureDirection)!
    expect(Buffer.byteLength(emitted)).toBeLessThanOrEqual(24 * 1024)
  })
})
