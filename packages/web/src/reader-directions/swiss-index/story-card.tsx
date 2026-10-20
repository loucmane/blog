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
 * number plate, so titles stay aligned along a row.
 */
export function SwissPlate({
  story,
  number,
  lead = false,
  preload = false,
}: {
  readonly story: StoryCard
  readonly number: number
  readonly lead?: boolean
  readonly preload?: boolean
}) {
  const typographic = lead && !story.image
  const className = [
    'si-plate',
    lead && 'si-plate-lead',
    typographic && 'si-plate-text',
    typographic && [...story.title].length > longTitleLength && 'si-plate-long',
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
      ) : typographic ? null : (
        <div aria-hidden="true" className="si-number-plate">
          {storyNumber(number)}
        </div>
      )}
      <h2 className="si-plate-title">
        <Link href={story.href}>{story.title}</Link>
      </h2>
      {story.dek ? <p className="si-plate-dek">{story.dek}</p> : null}
    </li>
  )
}
