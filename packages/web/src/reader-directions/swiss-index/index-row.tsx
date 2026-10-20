import Link from 'next/link'

import { formatPublishedDate, formatReadingTime } from '@/reader/format'
import type { StoryCard } from '@/reader/views'

import { storyNumber } from './story-card'

export function storyCount(count: number) {
  return `${count} ${count === 1 ? 'story' : 'stories'}`
}

/** A mono label at the left and the story count at the right; a heading when it heads a list. */
export function SwissLabelRow({
  count,
  heading = false,
  id,
  label,
}: {
  readonly count: number
  readonly heading?: boolean
  readonly id?: string
  readonly label: string
}) {
  const Label = heading ? 'h2' : 'p'
  return (
    <div className="si-label-row">
      <Label className="si-label" id={id}>
        {label}
      </Label>
      <p className="si-label si-count">{storyCount(count)}</p>
    </div>
  )
}

/**
 * Numbered index rows: the number and date, the title and dek, then the section and reading time.
 * Without the section column, the reading time joins the number and date.
 */
export function SwissIndexList({
  showSection = true,
  start,
  stories,
}: {
  readonly showSection?: boolean
  readonly start: number
  readonly stories: readonly StoryCard[]
}) {
  return (
    // eslint-disable-next-line jsx-a11y-x/no-redundant-roles -- Removed list styles drop list semantics in Safari.
    <ol
      className={showSection ? 'si-index' : 'si-index si-index-sectionless'}
      role="list"
      start={start}
    >
      {stories.map((story, index) => {
        const readingTime = (
          <span className="si-reading-time">{formatReadingTime(story.readingMinutes)}</span>
        )
        return (
          <li key={story.slug}>
            <div className="si-row-meta">
              <span aria-hidden="true" className="si-number">
                {storyNumber(start + index)}
              </span>
              <time dateTime={story.publishedAt}>{formatPublishedDate(story.publishedAt)}</time>
              {showSection ? null : readingTime}
            </div>
            <div className="si-row-copy">
              <h3 className="si-row-title">
                <Link href={story.href}>{story.title}</Link>
              </h3>
              {story.dek ? <p className="si-row-dek">{story.dek}</p> : null}
            </div>
            {showSection ? (
              <div className="si-row-facts">
                {story.section ? <Link href={story.section.href}>{story.section.name}</Link> : null}
                {readingTime}
              </div>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
