import Link from 'next/link'

import { ReaderImageView } from '@/reader/components/reader-image'
import { formatPublishedDate, formatReadingTime } from '@/reader/format'
import type { StoryCard } from '@/reader/views'

import { storyColour } from './colours'
import { StoryMotif } from './motif'

export const leadSizes = '(min-width: 1408px) 590px, (min-width: 1024px) 42vw, 86vw'
export const cardSizes =
  '(min-width: 1408px) 388px, (min-width: 1024px) 28vw, (min-width: 768px) 42vw, 86vw'

export function ExpressiveStoryCard({
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
  return (
    <li
      className={`ec-card${lead ? ' ec-card-lead' : ''}`}
      data-story-colour={storyColour(story.slug).name}
    >
      <Link className="ec-card-link" href={story.href} aria-labelledby={`ec-story-${story.slug}`}>
        <div className="ec-card-copy">
          <div className="ec-card-meta">
            <span className="ec-number" aria-hidden="true">
              {String(number).padStart(2, '0')}
            </span>
            {story.section ? <span>{story.section.name}</span> : null}
            <span>{formatReadingTime(story.readingMinutes)}</span>
          </div>
          <h2 id={`ec-story-${story.slug}`}>{story.title}</h2>
          {story.dek ? <p className="ec-card-dek">{story.dek}</p> : null}
          <div className="ec-card-bottom">
            <time dateTime={story.publishedAt}>{formatPublishedDate(story.publishedAt)}</time>
            <span className="ec-read">
              Read <span aria-hidden="true">↗</span>
            </span>
          </div>
        </div>
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
              sizes={lead ? leadSizes : cardSizes}
              preload={preload}
            />
          ) : (
            <StoryMotif slug={story.slug} />
          )}
        </div>
      </Link>
    </li>
  )
}
