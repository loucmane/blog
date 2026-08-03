import { describe, expect, it } from 'vitest'

import { createDesignLabRegistry, defineDesignLabDirection } from './contract'
import { designLabRegistry } from './registry'
import type { DesignLabDirection, DesignLabDirectionProps } from './types'

function TestView(_props: DesignLabDirectionProps) {
  return null
}

const metadata = {
  character: 'A visual character.',
  collection: 'Test collection',
  name: 'Test direction',
  order: '99',
  ownerFit: 'A clear owner fit.',
  risk: 'A known risk.',
  signature: 'A recognizable signature.',
  thesis: 'A focused design thesis.',
}

function definition(id: string): DesignLabDirection {
  return {
    id,
    metadata,
    views: { desk: TestView, reader: TestView, write: TestView },
  }
}

describe('design-lab direction contract', () => {
  it('registers every project-authored bakeoff direction', () => {
    expect(designLabRegistry.list().map(({ id }) => id)).toEqual([
      'folio',
      'contact',
      'halo',
      'blue-pencil',
      'light-table',
      'edition-zero',
      'margin-studio',
      'pressroom',
      'galley-27',
      'aperture',
      'live-issue',
      'mercury',
      'cutline',
      'edition-os',
    ])
    expect(designLabRegistry.list()).toHaveLength(14)
  })

  it('groups the complete bakeoff history without losing any required view', () => {
    expect(new Set(designLabRegistry.list().map(({ metadata }) => metadata.collection))).toEqual(
      new Set([
        'Round 1 · Foundations',
        'Round 2 · Studio Systems',
        'Round 3 · Refined Instruments',
        'Round 4 · Finalists',
      ]),
    )
    for (const direction of designLabRegistry.list()) {
      expect(Object.keys(direction.views).sort()).toEqual(['desk', 'reader', 'write'])
    }
  })

  it('accepts a complete new direction without backend-specific code', () => {
    const registry = createDesignLabRegistry([definition('new-direction')])
    expect(registry.first().id).toBe('new-direction')
    expect(registry.get('new-direction').views.write).toBe(TestView)
  })

  it('denies invalid and duplicate identifiers', () => {
    expect(() => defineDesignLabDirection(definition('Not valid'))).toThrow(/kebab-case/)
    expect(() =>
      createDesignLabRegistry([definition('duplicate'), definition('duplicate')]),
    ).toThrow(/Duplicate/)
  })

  it('denies missing metadata and views', () => {
    expect(() =>
      defineDesignLabDirection({
        ...definition('missing-metadata'),
        metadata: { ...metadata, thesis: '' },
      }),
    ).toThrow(/non-empty/)
    expect(() =>
      defineDesignLabDirection({
        ...definition('missing-view'),
        views: { ...definition('unused').views, write: undefined },
      } as unknown as DesignLabDirection),
    ).toThrow(/write view/)
  })
})
