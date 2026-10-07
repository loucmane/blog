import Link from 'next/link'

import { ReaderImageView } from '@/reader/components/reader-image'
import { formatReadingTime } from '@/reader/format'
import type { StoryCard } from '@/reader/views'

export const cardSizes =
  '(min-width: 1568px) 43.75rem, (min-width: 768px) calc(46vw - 1.25rem), (min-width: 500px) 92vw, calc(100vw - 2.5rem)'

export function StoryMeta({
  story,
}: {
  readonly story: Pick<StoryCard, 'section' | 'readingMinutes'>
}) {
  return (
    <div className="cf-story-meta">
      {story.section ? <Link href={story.section.href}>{story.section.name}</Link> : null}
      <span>{formatReadingTime(story.readingMinutes)}</span>
    </div>
  )
}

export function CinematicStoryCard({
  story,
  preload = false,
}: {
  readonly story: StoryCard
  readonly preload?: boolean
}) {
  return (
    <li className={`cf-card${story.image ? '' : ' cf-card-text'}`}>
      {story.image ? (
        <div
          className="cf-card-image"
          style={{
            objectPosition: `${story.image.focalPoint.x * 100}% ${story.image.focalPoint.y * 100}%`,
          }}
        >
          <ReaderImageView image={story.image} sizes={cardSizes} preload={preload} />
        </div>
      ) : null}
      <StoryMeta story={story} />
      <h2 className="cf-card-title">
        <Link href={story.href}>{story.title}</Link>
      </h2>
      {story.dek ? <p className="cf-card-dek">{story.dek}</p> : null}
    </li>
  )
}
