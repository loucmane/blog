import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

import { ReaderImageView } from '@/reader/components/reader-image'
import { formatPublishedDate, formatReadingTime } from '@/reader/format'
import type { ReaderImage, StoryCard } from '@/reader/views'

import { plateFit, plateSizes, plateStyle, type PlateSlot } from './fit'
import { SectionLabel } from './shell'

/** A picture placed in a plate slot: its `sizes` and the inline fit factors for the CSS. */
export interface PlatePicture {
  readonly image: ReaderImage
  readonly sizes: string
  readonly style: CSSProperties
}

export function platePicture(image: ReaderImage | null, slot: PlateSlot): PlatePicture | null {
  if (!image) return null
  const fit = plateFit(image, slot)
  return { image, sizes: plateSizes(slot, fit), style: plateStyle(fit) }
}

/** Titles over 80 characters take the long-title size. */
export function isLongTitle(title: string): boolean {
  return [...title].length > 80
}

/** A story list. Safari drops list semantics from lists without list styles unless role says so. */
export function StoryList({
  children,
  className,
}: {
  readonly children: ReactNode
  readonly className: string
}) {
  return (
    // eslint-disable-next-line jsx-a11y-x/no-redundant-roles -- Keeps list semantics in Safari.
    <ul className={className} role="list">
      {children}
    </ul>
  )
}

/** "N stories", "1 story" or "No stories", for the count line under a page's name. */
export function storyCount(count: number): string {
  if (count === 0) return 'No stories'
  return count === 1 ? '1 story' : `${count} stories`
}

/** The date and reading time, or only the reading time where the row already shows the date. */
export function MetaLine({
  date = true,
  story,
}: {
  readonly date?: boolean
  readonly story: Pick<StoryCard, 'publishedAt' | 'readingMinutes'>
}) {
  return (
    <p className="qm-meta">
      {date ? (
        <>
          <time dateTime={story.publishedAt}>{formatPublishedDate(story.publishedAt)}</time>
          <span aria-hidden="true"> · </span>
        </>
      ) : null}
      {formatReadingTime(story.readingMinutes)}
    </p>
  )
}

/** The picture, whole, at its fit share of the plate's box. */
export function PlateBox({
  bay = false,
  picture,
  preload,
}: {
  readonly bay?: boolean
  readonly picture: PlatePicture
  readonly preload: boolean
}) {
  return (
    <div className={bay ? 'qm-plate-box qm-bay' : 'qm-plate-box'}>
      <ReaderImageView image={picture.image} preload={preload} sizes={picture.sizes} />
    </div>
  )
}

function PlateTitle({
  className,
  heading: Heading,
  story,
}: {
  readonly className: string
  readonly heading: 'h2' | 'h3'
  readonly story: StoryCard
}) {
  return (
    <Heading className={`qm-plate-title ${className}`}>
      <Link href={story.href}>{story.title}</Link>
    </Heading>
  )
}

/**
 * A story with a band of its own: the plate, then its wall label. Home's stories 2 to 4, the
 * first story to read next, and an author's latest story, whose picture leads the page.
 */
export function Room({
  heading,
  preload = false,
  story,
}: {
  readonly heading: 'h2' | 'h3'
  readonly preload?: boolean
  readonly story: StoryCard
}) {
  const picture = platePicture(story.image, 'room')
  return (
    <li
      className={picture ? 'qm-room qm-plate' : 'qm-room qm-plate qm-plate-text'}
      style={picture?.style}
    >
      {picture ? <PlateBox picture={picture} preload={preload} /> : null}
      <div className="qm-wall-label">
        <SectionLabel section={story.section} />
        <PlateTitle className="qm-room-title" heading={heading} story={story} />
        {story.dek ? <p className="qm-plate-dek">{story.dek}</p> : null}
        <MetaLine story={story} />
      </div>
    </li>
  )
}

/** The first letter or digit of a title, for a monogram bay. */
function monogram(title: string): string | null {
  return /[\p{L}\p{N}]/u.exec(title)?.[0] ?? null
}

/**
 * A story in a section's hang. The picture stands whole on the bottom edge of a square bay, so
 * titles align across a row. A story without a picture gets a monogram bay when it shares a row.
 */
export function HangItem({
  preload,
  sharesRow,
  showSection = false,
  story,
}: {
  readonly preload: boolean
  readonly sharesRow: boolean
  readonly showSection?: boolean
  readonly story: StoryCard
}) {
  const picture = platePicture(story.image, 'bay')
  const letter = picture || !sharesRow ? null : monogram(story.title)
  const className = picture
    ? 'qm-hang-item qm-plate'
    : `qm-hang-item qm-plate qm-plate-text${letter ? ' qm-plate-monogram' : ''}`
  return (
    <li className={className} style={picture?.style}>
      {picture ? <PlateBox bay picture={picture} preload={preload} /> : null}
      {letter ? (
        <div aria-hidden="true" className="qm-bay qm-monogram">
          {letter}
        </div>
      ) : null}
      <div className="qm-wall-label">
        {showSection ? <SectionLabel section={story.section} /> : null}
        <PlateTitle className="qm-hang-title" heading="h2" story={story} />
        {story.dek ? <p className="qm-plate-dek">{story.dek}</p> : null}
        <MetaLine story={story} />
      </div>
    </li>
  )
}

/**
 * A checklist row: the section, or the date where the section is fixed, then the title and the
 * meta line. Rows have no pictures.
 */
export function ChecklistRow({
  dated = false,
  story,
}: {
  readonly dated?: boolean
  readonly story: StoryCard
}) {
  const label = dated ? (
    <time dateTime={story.publishedAt}>{formatPublishedDate(story.publishedAt)}</time>
  ) : story.section ? (
    <Link href={story.section.href}>{story.section.name}</Link>
  ) : null
  return (
    <li className="qm-row">
      {label ? <p className="qm-label qm-row-label">{label}</p> : null}
      <div className="qm-row-body">
        <h3 className="qm-row-title">
          <Link href={story.href}>{story.title}</Link>
        </h3>
        <MetaLine date={!dated} story={story} />
      </div>
    </li>
  )
}
