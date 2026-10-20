import Link from 'next/link'
import type { CSSProperties } from 'react'

import { ReaderImageView } from '@/reader/components/reader-image'
import { formatReadingTime } from '@/reader/format'
import type { ReaderImage, StoryCard } from '@/reader/views'

/**
 * One entry of a `sizes` value, from `minWidth` up: a fixed width in rem, or a share of the
 * viewport in vw less a length in rem.
 */
type SizesEntry = { readonly minWidth?: number } & (
  { readonly rem: number } | { readonly less?: number; readonly vw: number }
)

/** A plate's cell: the home lead's, or any other plate's. */
export type PlateCell = 'lead' | 'plate'

/** The cells plates crop their images into: their width (spec sections 4 and 6) and shape. */
const cells: Record<
  PlateCell,
  { readonly entries: readonly SizesEntry[]; readonly ratio: number }
> = {
  // Columns 1-2 from 1024px, both columns from 600px, the page below.
  lead: {
    entries: [
      { minWidth: 1440, rem: 41.25 },
      { minWidth: 1024, less: 0.75, vw: 47 },
      { minWidth: 667, vw: 94 },
      { less: 2.5, vw: 100 },
    ],
    ratio: 3 / 2,
  },
  // One column of four from 1024px, one of two from 600px, the page below.
  plate: {
    entries: [
      { minWidth: 1440, rem: 19.875 },
      { minWidth: 1024, less: 1.125, vw: 23.5 },
      { minWidth: 667, less: 0.75, vw: 47 },
      { minWidth: 600, less: 2, vw: 50 },
      { less: 2.5, vw: 100 },
    ],
    ratio: 4 / 3,
  },
}

function sizesValue(entries: readonly SizesEntry[], scale: number) {
  const scaled = (value: number) => Number((value * scale).toFixed(4))
  return entries
    .map((entry) => {
      const width =
        'rem' in entry
          ? `${scaled(entry.rem)}rem`
          : entry.less
            ? `calc(${scaled(entry.vw)}vw - ${scaled(entry.less)}rem)`
            : `${scaled(entry.vw)}vw`
      return entry.minWidth ? `(min-width: ${entry.minWidth}px) ${width}` : width
    })
    .join(', ')
}

/** The spec's sizes for the lead plate and for every other plate: the width of each cell. */
export const leadSizes = sizesValue(cells.lead.entries, 1)
export const cardSizes = sizesValue(cells.plate.entries, 1)

/**
 * The sizes of a plate's picture. A cell crops its image to fill it (`object-fit: cover`), so a
 * source wider than the cell is drawn wider than the cell, by the ratio of the two shapes; the
 * width descriptors measure the whole source, so the sizes grow by that ratio and the browser
 * picks a file sharp enough for the part it shows. Sources no wider than their cell keep the
 * cell's width. The preload repeats the picture's sizes.
 */
export function plateSizes(image: ReaderImage, cell: PlateCell) {
  const { entries, ratio } = cells[cell]
  const shape = image.width && image.height ? image.width / image.height : 0
  return sizesValue(entries, Math.max(1, shape / ratio))
}

/** Titles longer than this many characters use the long title size. */
const longTitleLength = 80

/** Whether a page title or typographic lead is set at `--si-title-long`; counts characters. */
export function isLongTitle(title: string) {
  return [...title].length > longTitleLength
}

/** Plate columns on tablets (600px) and desktops (1024px); phones stack plates in one column. */
const plateColumns = { tablet: 2, desktop: 4 } as const

/** A layout in which plates share grid rows. */
export type PlateWidth = keyof typeof plateColumns

const plateWidths = Object.keys(plateColumns) as PlateWidth[]

/**
 * For each plate, given the columns each one spans, the layouts in which it has a grid row to
 * itself. Plates fill rows in order, as grid auto-placement does: a plate that spans more columns
 * than its row has left starts the next row.
 */
export function platesAlone(spans: readonly number[]) {
  const alone = spans.map((): PlateWidth[] => [])
  for (const width of plateWidths) {
    const columns: number = plateColumns[width]
    let row = -1
    let used = columns
    const rows = spans.map((span) => {
      if (used + span > columns) {
        row += 1
        used = 0
      }
      used += span
      return row
    })
    rows.forEach((plateRow, index) => {
      if (rows.filter((other) => other === plateRow).length === 1) alone[index]!.push(width)
    })
  }
  return alone
}

/** A story's place in a list, as the two-digit number the index shows. */
export function storyNumber(number: number) {
  return String(number).padStart(2, '0')
}

/** The cropping cell's focal point, read by its image's `object-position`. */
function focus(image: ReaderImage): CSSProperties {
  const percent = (value: number) => `${Number((value * 100).toFixed(2))}%`
  return {
    '--si-focus': `${percent(image.focalPoint.x)} ${percent(image.focalPoint.y)}`,
  } as CSSProperties
}

/**
 * A numbered plate in a list of stories. The title link is the plate's one story link: its target
 * covers the image cell, and the section link sits above it. The front page's lead without an
 * image is set as a typographic lead; any other plate without one keeps its cell as a decorative
 * number plate in the layouts where it shares a grid row, so titles stay aligned along the row.
 * Titles are `h2` in a page's own lists and `h3` under the article's related-stories heading.
 */
export function SwissPlate({
  story,
  number,
  lead = false,
  preload = false,
  alone = [],
  headingLevel = 2,
}: {
  readonly story: StoryCard
  readonly number: number
  readonly lead?: boolean
  readonly preload?: boolean
  /** The layouts in which this plate has its grid row to itself, from `platesAlone`. */
  readonly alone?: readonly PlateWidth[] | undefined
  readonly headingLevel?: 2 | 3
}) {
  const Title = headingLevel === 3 ? 'h3' : 'h2'
  const typographic = lead && !story.image
  const numberPlate =
    !story.image && !typographic && plateWidths.some((width) => !alone.includes(width))
  const className = [
    'si-plate',
    lead && 'si-plate-lead',
    typographic && 'si-plate-text',
    typographic && isLongTitle(story.title) && 'si-plate-long',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <li className={className}>
      <div className="si-plate-meta">
        <span aria-hidden="true" className="si-number">
          {storyNumber(number)}
        </span>
        {lead ? <span className="si-state">Lead</span> : null}
        {story.section ? <Link href={story.section.href}>{story.section.name}</Link> : null}
        <span className="si-reading-time">{formatReadingTime(story.readingMinutes)}</span>
      </div>
      {story.image ? (
        <div className="si-plate-image" style={focus(story.image)}>
          <ReaderImageView
            image={story.image}
            preload={preload}
            sizes={plateSizes(story.image, lead ? 'lead' : 'plate')}
          />
        </div>
      ) : numberPlate ? (
        <div
          aria-hidden="true"
          className="si-number-plate"
          data-alone={alone.join(' ') || undefined}
        >
          {storyNumber(number)}
        </div>
      ) : null}
      <Title className="si-plate-title">
        <Link href={story.href}>{story.title}</Link>
      </Title>
      {story.dek ? <p className="si-plate-dek">{story.dek}</p> : null}
    </li>
  )
}
