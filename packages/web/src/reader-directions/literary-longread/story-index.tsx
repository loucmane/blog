import Link from 'next/link'

import { formatPublishedDate, formatReadingTime } from '@/reader/format'
import type { StoryCard } from '@/reader/views'

import { LiteraryFigure, thumbnailSizes } from './story-card'

export function LiteraryStoryIndex({
  stories,
  headingLevel = 2,
  emptyMessage,
}: {
  readonly stories: readonly StoryCard[]
  readonly headingLevel?: 2 | 3
  readonly emptyMessage: string
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return stories.length > 0 ? (
    // eslint-disable-next-line jsx-a11y-x/no-redundant-roles -- Removed list styles drop list semantics in Safari.
    <ul className="ll-index" role="list">
      {stories.map((story, index) => (
        <li className={`ll-index-row${story.image ? '' : ' ll-index-text'}`} key={story.slug}>
          <time className="ll-date" dateTime={story.publishedAt}>
            {formatPublishedDate(story.publishedAt)}
          </time>
          <div className="ll-index-copy">
            <Heading>
              <Link href={story.href}>{story.title}</Link>
            </Heading>
            {story.dek ? <p className="ll-card-dek">{story.dek}</p> : null}
            <p className="ll-meta">{formatReadingTime(story.readingMinutes)}</p>
          </div>
          {story.image ? (
            <LiteraryFigure
              className="ll-index-image"
              image={story.image}
              preload={index === 0}
              sizes={thumbnailSizes}
            />
          ) : null}
        </li>
      ))}
    </ul>
  ) : (
    <div className="ll-section-empty">
      <p>{emptyMessage}</p>
      <Link href="/">All stories</Link>
    </div>
  )
}
