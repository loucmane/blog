import { describe, expect, it } from 'vitest'

import {
  adjacentDesignLabDirections,
  createDesignLabNavigationHref,
  groupDesignLabDirections,
  normalizeLegacyDesignLabHash,
  orderedDesignLabDirections,
  resolveDesignLabNavigation,
} from './navigation'
import type { DesignLabDirection, DesignLabDirectionProps } from './types'

function TestView(_props: DesignLabDirectionProps) {
  return null
}

function direction(
  id: string,
  collection: string,
  order: string,
  name: string,
): DesignLabDirection {
  return {
    id,
    metadata: {
      character: 'Quiet gallery furniture.',
      collection,
      name,
      order,
      ownerFit: 'Keeps the work legible.',
      risk: 'Requires disciplined hierarchy.',
      signature: 'A real index code.',
      thesis: `${name} thesis.`,
    },
    views: { desk: TestView, reader: TestView, write: TestView },
  }
}

const directions = [
  direction('folio', 'Round 4 · Finalists', 'D1', 'Folio'),
  direction('fullbleed', 'Round 5 · New concepts', 'N3', 'Fullbleed'),
  direction('mercury', 'Round 3 · Refined Instruments', 'C1', 'Mercury'),
  direction('blue-pencil', 'Round 1 · Foundations', 'A1', 'Blue Pencil'),
  direction('aperture', 'Round 2 · Studio Systems', 'B2', 'Aperture'),
] as const

describe('design-lab navigation model', () => {
  it('groups every registry direction in fixed round order', () => {
    const groups = groupDesignLabDirections(directions)

    expect(groups.map(({ label }) => label)).toEqual([
      'Round 1 · Archive',
      'Round 2 · Archive',
      'Round 3 · Archive',
      'Round 4 · Finalists',
      'Round 5 · New concepts',
    ])
    expect(orderedDesignLabDirections(groups).map(({ id }) => id)).toEqual([
      'blue-pencil',
      'aperture',
      'mercury',
      'folio',
      'fullbleed',
    ])
  })

  it('wraps previous and next across the complete ordered registry', () => {
    const ordered = orderedDesignLabDirections(groupDesignLabDirections(directions))

    expect(adjacentDesignLabDirections(ordered, 'blue-pencil').previous.id).toBe('fullbleed')
    expect(adjacentDesignLabDirections(ordered, 'fullbleed').next.id).toBe('blue-pencil')
  })

  it('resolves exact query state and fails closed for stale values', () => {
    const known = new Set(directions.map(({ id }) => id))

    expect(
      resolveDesignLabNavigation('?direction=folio&view=write&story=article-1', known),
    ).toEqual({
      directionId: 'folio',
      notice: null,
      view: 'write',
    })
    expect(resolveDesignLabNavigation('?direction=missing&view=reader', known)).toEqual({
      directionId: null,
      notice: '“missing” isn’t a direction. Showing all directions.',
      view: 'desk',
    })
    expect(resolveDesignLabNavigation('?direction=folio&view=gallery', known)).toEqual({
      directionId: 'folio',
      notice: '“gallery” isn’t a view. Showing the desk view.',
      view: 'desk',
    })
  })

  it('serializes direction changes without dropping story or unrelated query state', () => {
    const href = createDesignLabNavigationHref(
      'https://example.test/owner/design-lab?story=article-1&fixture=on#folio/desk',
      { directionId: 'fullbleed', kind: 'direction', view: 'reader' },
    )

    expect(href).toBe(
      '/owner/design-lab?story=article-1&fixture=on&direction=fullbleed&view=reader',
    )
    expect(createDesignLabNavigationHref(`https://example.test${href}`, { kind: 'index' })).toBe(
      '/owner/design-lab?story=article-1&fixture=on',
    )
  })

  it('normalizes a legacy hash once while respecting explicit query state', () => {
    expect(
      normalizeLegacyDesignLabHash(
        'https://example.test/owner/design-lab?story=article-1#halo/reader',
      ),
    ).toBe('/owner/design-lab?story=article-1&direction=halo&view=reader')
    expect(
      normalizeLegacyDesignLabHash(
        'https://example.test/owner/design-lab?direction=folio&view=write#halo/reader',
      ),
    ).toBe('/owner/design-lab?direction=folio&view=write')
  })
})
