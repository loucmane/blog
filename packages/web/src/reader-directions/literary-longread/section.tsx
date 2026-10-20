import Link from 'next/link'

import { formatPublishedDate, formatReadingTime } from '@/reader/format'

import type { SectionDirectionProps } from '../contract'
import { LiteraryShell } from './shell'
import { LiteraryFigure, thumbnailSizes } from './story-card'

export function LiterarySection({ view }: SectionDirectionProps) {
  const firstImage = view.stories[0]?.image
  return (
    <LiteraryShell
      navigation={view.navigation}
      currentSection={view.slug}
      leadImage={firstImage ? { image: firstImage, sizes: thumbnailSizes } : null}
    >
      <header className="ll-section-header">
        <p className="ll-label">Section</p>
        <h1>{view.name}</h1>
        {view.description ? <p className="ll-dek">{view.description}</p> : null}
      </header>
      {view.stories.length > 0 ? (
        <ul className="ll-index">
          {view.stories.map((story, index) => (
            <li className={`ll-index-row${story.image ? '' : ' ll-index-text'}`} key={story.slug}>
              <time className="ll-date" dateTime={story.publishedAt}>
                {formatPublishedDate(story.publishedAt)}
              </time>
              <div className="ll-index-copy">
                <h2>
                  <Link href={story.href}>{story.title}</Link>
                </h2>
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
          <p>No stories have been published in this section yet.</p>
          <Link href="/">All stories</Link>
        </div>
      )}
    </LiteraryShell>
  )
}
