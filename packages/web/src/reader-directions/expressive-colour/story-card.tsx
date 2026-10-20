import Link from 'next/link'

import { ReaderImageView } from '@/reader/components/reader-image'
import { formatPublishedDate, formatReadingTime } from '@/reader/format'
import type { StoryCard } from '@/reader/views'

import { storyColour } from './colours'
import { StoryMotif } from './motif'
import { cardSizes, leadSizes, secondarySizes } from './sizes'

export type StoryCardVariant = 'lead' | 'secondary' | 'standard' | 'related' | 'compact'

export function ExpressiveStoryCard({
  story,
  number,
  variant = 'standard',
  surface = 'filled',
  headingLevel = 2,
  solo = false,
  preload = false,
}: {
  readonly story: StoryCard
  readonly number?: number | undefined
  readonly variant?: StoryCardVariant
  readonly surface?: 'filled' | 'paper' | 'ground'
  readonly headingLevel?: 2 | 3
  readonly solo?: boolean
  readonly preload?: boolean
}) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2'
  const compact = variant === 'compact'
  const visualFirst = variant === 'lead' || variant === 'secondary'
  const badge =
    number === undefined ? null : (
      <span className="ec-number" aria-hidden="true">
        {String(number).padStart(2, '0')}
      </span>
    )
  const title = (
    <Heading
      id={`ec-story-${story.slug}`}
      className={story.title.length > 80 ? 'ec-card-title-long' : undefined}
    >
      {story.title}
    </Heading>
  )
  const date = <time dateTime={story.publishedAt}>{formatPublishedDate(story.publishedAt)}</time>
  const visual = compact ? null : (
    <div
      className="ec-card-visual"
      style={
        story.image
          ? {
              objectPosition: `${story.image.focalPoint.x * 100}% ${story.image.focalPoint.y * 100}%`,
            }
          : undefined
      }
    >
      {story.image ? (
        <ReaderImageView
          image={story.image}
          sizes={
            variant === 'lead' || solo
              ? leadSizes
              : variant === 'secondary'
                ? secondarySizes
                : cardSizes
          }
          preload={preload}
        />
      ) : (
        <StoryMotif slug={story.slug} />
      )}
    </div>
  )
  return (
    <li
      className={`ec-card ec-card-${variant}${solo ? ' ec-card-secondary-solo' : ''}`}
      data-variant={variant}
      data-surface={compact ? 'ground' : surface}
      data-story-colour={storyColour(story.slug).name}
    >
      <Link className="ec-card-link" href={story.href} aria-labelledby={`ec-story-${story.slug}`}>
        {compact ? (
          <>
            {badge}
            {title}
            <div className="ec-card-meta">
              {story.section ? <span>{story.section.name}</span> : null}
              {date}
              <span>{formatReadingTime(story.readingMinutes)}</span>
            </div>
          </>
        ) : (
          <>
            {visualFirst ? visual : null}
            <div className="ec-card-copy">
              <div className="ec-card-meta">
                {badge}
                {story.section ? <span>{story.section.name}</span> : null}
                <span>{formatReadingTime(story.readingMinutes)}</span>
              </div>
              {title}
              {story.dek ? <p className="ec-card-dek">{story.dek}</p> : null}
              <div className="ec-card-bottom">
                {date}
                <span className="ec-read" aria-hidden="true">
                  Read <span>→</span>
                </span>
              </div>
            </div>
            {!visualFirst ? visual : null}
          </>
        )}
      </Link>
    </li>
  )
}
