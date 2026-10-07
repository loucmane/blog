import Link from 'next/link'

import { ReaderImageView } from '@/reader/components/reader-image'
import { formatReadingTime } from '@/reader/format'
import type { StoryCard } from '@/reader/views'

export const leadSizes =
  '(min-width: 1440px) 41.25rem, (min-width: 1024px) calc(47vw - 0.75rem), (min-width: 667px) 94vw, calc(100vw - 2.5rem)'
export const cardSizes =
  '(min-width: 1440px) 19.875rem, (min-width: 1024px) calc(23.5vw - 1.125rem), (min-width: 667px) calc(47vw - 0.75rem), (min-width: 600px) calc(50vw - 2rem), calc(100vw - 2.5rem)'

export function StoryMeta({
  story,
  number,
  lead = false,
}: {
  readonly story: StoryCard
  readonly number: number
  readonly lead?: boolean
}) {
  return (
    <div className="si-story-meta">
      <span className="si-number" aria-label={`Story ${number}`}>
        {String(number).padStart(2, '0')}
      </span>
      {lead ? <span className="si-state">Lead</span> : null}
      {story.section ? <Link href={story.section.href}>{story.section.name}</Link> : null}
      <span className="si-reading-time">{formatReadingTime(story.readingMinutes)}</span>
    </div>
  )
}

export function SwissStoryCard({
  story,
  number,
  lead = false,
  wide = false,
  preload = false,
}: {
  readonly story: StoryCard
  readonly number: number
  readonly lead?: boolean
  readonly wide?: boolean
  readonly preload?: boolean
}) {
  return (
    <li className={`si-card${wide ? ' si-card-wide' : ''}${story.image ? '' : ' si-card-text'}`}>
      <StoryMeta story={story} number={number} lead={lead} />
      {story.image ? (
        <div className="si-card-image">
          <ReaderImageView
            image={story.image}
            preload={preload}
            sizes={wide ? leadSizes : cardSizes}
          />
        </div>
      ) : null}
      <h2 className="si-card-title">
        <Link href={story.href}>{story.title}</Link>
      </h2>
      {story.dek ? <p className="si-card-dek">{story.dek}</p> : null}
    </li>
  )
}
