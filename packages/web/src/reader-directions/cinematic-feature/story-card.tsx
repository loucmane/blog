import Link from 'next/link'

import { ReaderFigure, ReaderImageCredit, ReaderImageView } from '@/reader/components/reader-image'
import { formatReadingTime } from '@/reader/format'
import type { StoryCard } from '@/reader/views'

export const cardSizes =
  '(min-width: 1536px) 704px, (min-width: 1024px) calc(50vw - 64px), (min-width: 768px) calc(50vw - 44px), calc(100vw - 40px)'

export const featureSizes =
  '(min-width: 1536px) 821.33px, (min-width: 1024px) calc(58.333333vw - 74.666667px), (min-width: 768px) calc(100vw - 64px), calc(100vw - 40px)'

export const relatedSizes =
  '(min-width: 1536px) 458.67px, (min-width: 1024px) calc(33.333333vw - 53.333333px), (min-width: 768px) calc(50vw - 44px), calc(100vw - 40px)'

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
  eager = false,
  feature = false,
  headingLevel = 2,
  sizes,
}: {
  readonly story: StoryCard
  readonly preload?: boolean
  /** Loads at once at normal priority: a card that reaches the first view. */
  readonly eager?: boolean
  readonly feature?: boolean
  readonly headingLevel?: 2 | 3
  readonly sizes?: string
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <li className={`cf-card${feature ? ' cf-feature' : ''}${story.image ? '' : ' cf-card-text'}`}>
      {story.image ? (
        <div
          className="cf-card-image"
          style={{
            objectPosition: `${story.image.focalPoint.x * 100}% ${story.image.focalPoint.y * 100}%`,
          }}
        >
          <ReaderFigure
            image={story.image}
            sizes={sizes ?? (feature ? featureSizes : cardSizes)}
            preload={preload}
            eager={eager}
          />
        </div>
      ) : null}
      <div className="cf-card-copy">
        <StoryMeta story={story} />
        <Heading className="cf-card-title">
          <Link href={story.href}>{story.title}</Link>
        </Heading>
        {story.dek ? <p className="cf-card-dek">{story.dek}</p> : null}
      </div>
    </li>
  )
}

export function CinematicStoryRow({ story }: { readonly story: StoryCard }) {
  return (
    <li className={`cf-row${story.image ? '' : ' cf-card-text'}`}>
      <div className="cf-card-copy">
        <StoryMeta story={story} />
        <h3 className="cf-card-title">
          <Link href={story.href}>{story.title}</Link>
        </h3>
        {story.dek ? <p className="cf-card-dek">{story.dek}</p> : null}
      </div>
      {story.image ? (
        <figure className="cf-row-media">
          <div
            className="cf-thumbnail"
            style={{
              objectPosition: `${story.image.focalPoint.x * 100}% ${story.image.focalPoint.y * 100}%`,
            }}
          >
            <ReaderImageView image={story.image} sizes="80px" />
          </div>
          {story.image.credit ? (
            <figcaption>
              <ReaderImageCredit image={story.image} />
            </figcaption>
          ) : null}
        </figure>
      ) : null}
    </li>
  )
}
