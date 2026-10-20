import { describe, expect, it } from 'vitest'

import { plateFit, plateSizes, plateStyle, type PlateSlot } from './fit'

const shapes = {
  '3:2': { width: 1440, height: 960 },
  '16:9': { width: 1600, height: 900 },
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 960, height: 1200 },
  '9:16': { width: 900, height: 1600 },
  missing: { width: null, height: null },
} as const

// [fit at 768px and up, fit below 768px], from section 6 of the spec: min(1, ratio / box ratio).
const expectedFits: Record<PlateSlot, Record<keyof typeof shapes, readonly [number, number]>> = {
  cover: {
    '3:2': [1, 1],
    '16:9': [1, 1],
    '1:1': [0.667, 1],
    '4:5': [0.533, 1],
    '9:16': [0.375, 0.703],
    missing: [1, 1],
  },
  room: {
    '3:2': [1, 1],
    '16:9': [1, 1],
    '1:1': [0.8, 1],
    '4:5': [0.64, 1],
    '9:16': [0.45, 0.703],
    missing: [1, 1],
  },
  bay: {
    '3:2': [1, 1],
    '16:9': [1, 1],
    '1:1': [1, 1],
    '4:5': [0.8, 1],
    '9:16': [0.563, 0.703],
    missing: [1, 1],
  },
}

describe('Quiet Monograph plate fit', () => {
  it.each(Object.keys(expectedFits) as PlateSlot[])(
    'scales each picture to stay whole inside the %s box',
    (slot) => {
      for (const [shape, image] of Object.entries(shapes)) {
        const [fit, fitSmall] = expectedFits[slot][shape as keyof typeof shapes]
        expect(plateFit(image, slot), `${slot} ${shape}`).toEqual({ fit, fitSmall })
      }
    },
  )

  it('writes the slot widths of section 4, scaled by the fit to three decimals', () => {
    expect(plateSizes('cover', plateFit(shapes['3:2'], 'cover'))).toBe(
      '(min-width: 1009px) 58rem, (min-width: 768px) 92vw, (min-width: 500px) 92vw, calc(100vw - 2.5rem)',
    )
    // The spec's worked example: a 4:5 hero.
    expect(plateSizes('cover', plateFit(shapes['4:5'], 'cover'))).toBe(
      '(min-width: 1009px) calc(58rem * 0.533), (min-width: 768px) calc(92vw * 0.533), (min-width: 500px) 92vw, calc(100vw - 2.5rem)',
    )
    expect(plateSizes('cover', plateFit(shapes['9:16'], 'cover'))).toBe(
      '(min-width: 1009px) calc(58rem * 0.375), (min-width: 768px) calc(92vw * 0.375), (min-width: 500px) calc(92vw * 0.703), calc((100vw - 2.5rem) * 0.703)',
    )
    expect(plateSizes('room', plateFit(shapes['16:9'], 'room'))).toBe(
      '(min-width: 800px) 46rem, (min-width: 768px) 92vw, (min-width: 500px) 92vw, calc(100vw - 2.5rem)',
    )
    expect(plateSizes('room', plateFit(shapes['1:1'], 'room'))).toBe(
      '(min-width: 800px) calc(46rem * 0.800), (min-width: 768px) calc(92vw * 0.800), (min-width: 500px) 92vw, calc(100vw - 2.5rem)',
    )
    // With both factors at 1 the bay value is today's section card value.
    expect(plateSizes('bay', plateFit(shapes['1:1'], 'bay'))).toBe(
      '(min-width: 1600px) 34rem, (min-width: 1305px) calc(37.5rem - 3.5vw), (min-width: 768px) 42.5vw, (min-width: 500px) 92vw, calc(100vw - 2.5rem)',
    )
    expect(plateSizes('bay', plateFit(shapes['4:5'], 'bay'))).toBe(
      '(min-width: 1600px) calc(34rem * 0.800), (min-width: 1305px) calc((37.5rem - 3.5vw) * 0.800), (min-width: 768px) calc(42.5vw * 0.800), (min-width: 500px) 92vw, calc(100vw - 2.5rem)',
    )
    expect(plateSizes('bay', plateFit(shapes['9:16'], 'bay'))).toBe(
      '(min-width: 1600px) calc(34rem * 0.563), (min-width: 1305px) calc((37.5rem - 3.5vw) * 0.563), (min-width: 768px) calc(42.5vw * 0.563), (min-width: 500px) calc(92vw * 0.703), calc((100vw - 2.5rem) * 0.703)',
    )
    expect(plateSizes('bay', plateFit(shapes.missing, 'bay'))).toBe(
      plateSizes('bay', { fit: 1, fitSmall: 1 }),
    )
  })

  it('sets both factors as inline custom properties for the plate CSS', () => {
    expect(plateStyle(plateFit(shapes['4:5'], 'cover'))).toEqual({
      '--qm-fit': '0.533',
      '--qm-fit-sm': '1',
    })
  })
})
