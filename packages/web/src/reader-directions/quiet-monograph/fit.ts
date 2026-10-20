import type { CSSProperties } from 'react'

import type { ReaderImageSizes } from '@/reader/components/image-sizes'
import type { ReaderImage } from '@/reader/views'

/*
 * Pictures are never cropped. Each plate slot has a box, a maximum width and an aspect ratio for
 * 768px and up and for narrower screens, and a picture is drawn at the share of the box width that
 * keeps it whole: fit = min(1, picture ratio / box ratio). The same factors scale the `sizes`
 * widths, so a portrait never fetches a landscape-width file.
 */

/** The cover (home lead), a room (home stories 2 to 4), or a bay in a section's hang. */
export type PlateSlot = 'bay' | 'cover' | 'room'

export interface PlateFit {
  /** Share of the box width the picture takes from 768px. */
  readonly fit: number
  /** Share of the box width the picture takes below 768px. */
  readonly fitSmall: number
}

/** Box ratios (width / height): 3:2, 5:4 and 1:1 from 768px; 4:5 below. */
const boxes: Record<PlateSlot, { readonly ratio: number; readonly smallRatio: number }> = {
  bay: { ratio: 1, smallRatio: 4 / 5 },
  cover: { ratio: 3 / 2, smallRatio: 4 / 5 },
  room: { ratio: 5 / 4, smallRatio: 4 / 5 },
}

/**
 * Each slot's width at each breakpoint, from the page width W: `100vw - 2.5rem` below 500px,
 * `92vw` from 500px and 75rem from about 1305px. The flag marks widths that use the wide factor.
 */
const slotWidths: Record<PlateSlot, readonly (readonly [string | null, string, boolean])[]> = {
  bay: [
    ['(min-width: 1600px)', '34rem', true],
    ['(min-width: 1305px)', '37.5rem - 3.5vw', true],
    ['(min-width: 768px)', '42.5vw', true],
    ['(min-width: 500px)', '92vw', false],
    [null, '100vw - 2.5rem', false],
  ],
  cover: [
    ['(min-width: 1009px)', '58rem', true],
    ['(min-width: 768px)', '92vw', true],
    ['(min-width: 500px)', '92vw', false],
    [null, '100vw - 2.5rem', false],
  ],
  room: [
    ['(min-width: 800px)', '46rem', true],
    ['(min-width: 768px)', '92vw', true],
    ['(min-width: 500px)', '92vw', false],
    [null, '100vw - 2.5rem', false],
  ],
}

function share(ratio: number, boxRatio: number): number {
  return Math.min(1, Math.round((ratio / boxRatio) * 1000) / 1000)
}

/** Fit factors, to three decimals. Originals without stored dimensions keep the shared 3:2 frame. */
export function plateFit(image: Pick<ReaderImage, 'height' | 'width'>, slot: PlateSlot): PlateFit {
  if (!image.width || !image.height) return { fit: 1, fitSmall: 1 }
  const ratio = image.width / image.height
  const box = boxes[slot]
  return { fit: share(ratio, box.ratio), fitSmall: share(ratio, box.smallRatio) }
}

function scaled(width: string, factor: number): string {
  const compound = width.includes(' ')
  if (factor === 1) return compound ? `calc(${width})` : width
  return `calc(${compound ? `(${width})` : width} * ${factor.toFixed(3)})`
}

/** The `sizes` value for a slot: its widths, each scaled by the picture's fit. */
export function plateSizes(slot: PlateSlot, { fit, fitSmall }: PlateFit): string {
  return slotWidths[slot]
    .map(([media, width, wide]) => {
      const value = scaled(width, wide ? fit : fitSmall)
      return media ? `${media} ${value}` : value
    })
    .join(', ')
}

/** The factors as the plate's inline custom properties, read by the image rules in styles.ts. */
export function plateStyle({ fit, fitSmall }: PlateFit): CSSProperties {
  return { '--qm-fit': String(fit), '--qm-fit-sm': String(fitSmall) } as CSSProperties
}

/*
 * Body figures and galleries step out to the figure width, min(W, 42rem), which is 42rem from
 * 731px. Two-up galleries are 20.25rem a cell from 768px, but the hook takes one gallery value, so
 * galleries use the figure's: a larger file rather than a blurred one.
 */
const figureSizes = '(min-width: 731px) 42rem, (min-width: 500px) 92vw, calc(100vw - 2.5rem)'

export const bodyImageSizes = {
  body: figureSizes,
  gallery: figureSizes,
} as const satisfies ReaderImageSizes
