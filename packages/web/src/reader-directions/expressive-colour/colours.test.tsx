// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { contrastRatio } from '../contrast'
import type { ReaderDirectionTokenSet } from '../contract'
import { ink, paper, storyColour, storyColours, storyHash, storyMotif } from './colours'
import { StoryMotif } from './motif'
import { tokens } from './tokens'

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
    for (const [text, background] of tokens.textPairs) {
      expect(contrastRatio(palette[text]!, palette[background]!)).toBeGreaterThanOrEqual(4.5)
    }
    // Body, italic dek, captions, underlined links, unfilled navigation, paper focus ring;
    // and the reverse pair for filled navigation, skip link and selection.
    expect(contrastRatio(ink, paper)).toBeGreaterThan(15)
    expect(tokens).not.toHaveProperty('dark')
  })
})
