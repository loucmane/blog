// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'

import { contrastRatio } from '../contrast'
import type { ReaderDirectionTokenSet } from '../contract'
import { ink, paper, storyColour, storyColours, storyHash, storyMotif } from './colours'
import { StoryMotif } from './motif'
import { styles } from './styles'
import { tokens } from './tokens'

afterEach(() => document.body.replaceChildren())

describe('stable story identity and decorative motifs', () => {
  it('pins the hash algorithm across builds, calls and input order', () => {
    expect(storyHash('')).toBe(2166136261)
    expect(storyHash('a')).toBe(3826002220)
    expect(storyHash('hello')).toBe(1335831723)
    expect(storyColour('hello').name).toBe('forest')
    const identities = ['hello', 'a', '', 'åäö', 'a-very-long-title'.repeat(100)]
    const original = new Map(identities.map((slug) => [slug, storyColour(slug)]))
    for (const slug of [...identities].reverse()) {
      expect(storyColour(slug)).toBe(original.get(slug))
      expect(storyHash(slug)).toBeGreaterThanOrEqual(0)
    }
    expect(Object.isFrozen(storyColours)).toBe(true)
    expect(storyColours.every(Object.isFrozen)).toBe(true)
  })

  it('allows a future typed owner preference only within the same accessible palette', () => {
    for (const colour of storyColours) expect(storyColour('hello', colour.name)).toBe(colour)
    expect(storyColour('hello', null)).toBe(storyColour('hello'))
  })

  it('reaches all colours and motif variants without depending on story list position', () => {
    const stories = Array.from({ length: 500 }, (_, index) => `story-${index}`)
    expect(new Set(stories.map((slug) => storyColour(slug).name)).size).toBe(6)
    expect(new Set(stories.map((slug) => storyMotif(slug).kind)).size).toBe(3)
    expect(new Set(stories.map((slug) => storyMotif(slug).rotation)).size).toBe(4)
    for (const slug of stories) {
      const svg = renderToStaticMarkup(<StoryMotif slug={slug} />)
      expect(svg).toBe(renderToStaticMarkup(<StoryMotif slug={slug} />))
      expect(svg).toContain('aria-hidden="true"')
      expect(svg).toContain('focusable="false"')
      expect(svg).toContain('viewBox="0 0 360 270"')
      expect(svg).toContain('width="360" height="270"')
      expect(svg).not.toMatch(/<image|<text|<title|<script|<foreignObject|href=|\bid=/)
      expect(svg.length).toBeLessThan(800)
    }
  })

  it.each([0, 1, 2])('gives paper motif %i both ink and story-colour paint', (kind) => {
    const slug = Array.from({ length: 100 }, (_, index) => `motif-${index}`).find(
      (candidate) => storyMotif(candidate).kind === kind,
    )!
    for (const theme of [tokens.light, { ...tokens.light, ...tokens.dark }]) {
      document.body.innerHTML = renderToStaticMarkup(
        <div className="ec-test">
          <div className="ec-page">
            <div className="ec-card" data-surface="paper" data-story-colour="cobalt">
              <StoryMotif slug={slug} />
            </div>
          </div>
        </div>,
      )
      const root = document.querySelector<HTMLElement>('.ec-test')!
      for (const [name, value] of Object.entries(theme)) root.style.setProperty(name, value)
      const sheet = document.createElement('style')
      sheet.textContent = styles.replaceAll('&', '.ec-test')
      document.body.append(sheet)
      const card = document.querySelector('.ec-card')!
      const paints = Array.from(card.querySelectorAll('path, circle')).flatMap((shape) => [
        shape.getAttribute('fill'),
        shape.getAttribute('stroke'),
      ])
      expect(paints).toContain('currentColor')
      expect(paints).toContain(
        kind === 1 ? 'var(--ec-story)' : 'var(--ec-motif-accent, currentColor)',
      )
      expect(getComputedStyle(card).getPropertyValue('--ec-motif-accent')).toBe('var(--ec-story)')
      expect(getComputedStyle(card).getPropertyValue('--ec-story')).toBe('var(--ec-cobalt)')
    }
  })
})

describe('the complete contrast matrix', () => {
  it('uses the stronger of paper or ink for every colour, including every small label', () => {
    const palette: ReaderDirectionTokenSet = tokens.light
    for (const colour of storyColours) {
      const ratio = contrastRatio(colour.foreground, colour.background)
      expect(ratio, colour.name).toBe(
        Math.max(contrastRatio(ink, colour.background), contrastRatio(paper, colour.background)),
      )
      expect(palette[`--ec-${colour.name}`]).toBe(colour.background)
      expect(palette[`--ec-on-${colour.name}`]).toBe(colour.foreground)
      for (const role of [
        'title',
        'mono label',
        'card dek',
        'link',
        'link hover',
        'focus ring',
        'pull quote',
        'quote attribution',
        'callout',
      ]) {
        expect(ratio, `${colour.name}: ${role}`).toBeGreaterThanOrEqual(4.5)
      }
    }
    for (const theme of [tokens.light, { ...tokens.light, ...tokens.dark }]) {
      const colours: ReaderDirectionTokenSet = theme
      for (const [text, background] of tokens.textPairs) {
        expect(contrastRatio(colours[text]!, colours[background]!)).toBeGreaterThanOrEqual(4.5)
      }
      expect(contrastRatio(colours['--ec-ink']!, colours['--ec-paper']!)).toBeGreaterThanOrEqual(7)
    }
    // Body, italic dek, captions, underlined links, unfilled navigation, paper focus ring;
    // and the reverse pair for filled navigation, skip link and selection.
    expect(contrastRatio(ink, paper)).toBeGreaterThan(15)
    expect(tokens).toHaveProperty('dark', {
      '--ec-scheme': 'dark',
      '--ec-paper': '#17141F',
      '--ec-paper-2': '#231F2D',
      '--ec-ink': '#F1E8DA',
      '--ec-ink-soft': '#C4BBCB',
    })
    expect(tokens.textPairs).toEqual(
      expect.arrayContaining([
        ['--ec-ink-soft', '--ec-paper'],
        ['--ec-ink', '--ec-paper-2'],
        ['--ec-ink-soft', '--ec-paper-2'],
      ]),
    )
  })
})
