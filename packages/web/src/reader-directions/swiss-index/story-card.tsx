import Link from 'next/link'
import type { CSSProperties } from 'react'

import { ReaderImageView } from '@/reader/components/reader-image'
import { formatReadingTime } from '@/reader/format'
import type { ReaderImage, StoryCard } from '@/reader/views'

export const leadSizes =
  '(min-width: 1440px) 41.25rem, (min-width: 1024px) calc(47vw - 0.75rem), (min-width: 667px) 94vw, calc(100vw - 2.5rem)'
export const cardSizes =
  '(min-width: 1440px) 19.875rem, (min-width: 1024px) calc(23.5vw - 1.125rem), (min-width: 667px) calc(47vw - 0.75rem), (min-width: 600px) calc(50vw - 2rem), calc(100vw - 2.5rem)'

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
 */
export function SwissPlate({
  story,
  number,
  lead = false,
  preload = false,
  alone = [],
}: {
  readonly story: StoryCard
  readonly number: number
  readonly lead?: boolean
  readonly preload?: boolean
  /** The layouts in which this plate has its grid row to itself, from `platesAlone`. */
  readonly alone?: readonly PlateWidth[] | undefined
}) {
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
            sizes={lead ? leadSizes : cardSizes}
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
      <h2 className="si-plate-title">
        <Link href={story.href}>{story.title}</Link>
      </h2>
      {story.dek ? <p className="si-plate-dek">{story.dek}</p> : null}
    </li>
  )
}
