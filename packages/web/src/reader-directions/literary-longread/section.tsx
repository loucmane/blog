import Link from 'next/link'

import { ReaderImageView } from '@/reader/components/reader-image'
import { formatPublishedDate } from '@/reader/format'

import type { SectionDirectionProps } from '../contract'
import { LiteraryShell } from './shell'

const thumbnailSizes = '(min-width: 768px) 10rem, 5rem'

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
                {story.dek ? <p>{story.dek}</p> : null}
              </div>
              {story.image ? (
                <div className="ll-index-image">
                  <ReaderImageView
                    image={story.image}
                    preload={index === 0}
                    sizes={thumbnailSizes}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="ll-section-empty">No stories have been published in this section yet.</p>
      )}
    </LiteraryShell>
  )
}
