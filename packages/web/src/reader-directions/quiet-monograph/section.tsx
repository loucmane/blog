import Link from 'next/link'

import { ReaderImageView } from '@/reader/components/reader-image'
import { formatPublishedDate } from '@/reader/format'

import type { SectionDirectionProps } from '../contract'
import { MonographShell } from './shell'

const cardSizes =
  '(min-width: 1600px) 34rem, (min-width: 1305px) calc(37.5rem - 3.5vw), (min-width: 768px) 42.5vw, (min-width: 500px) 92vw, calc(100vw - 2.5rem)'

export function MonographSection({ view }: SectionDirectionProps) {
  const leadImage = view.stories[0]?.image
  return (
    <MonographShell
      currentSection={view.slug}
      leadImage={leadImage ? { image: leadImage, sizes: cardSizes } : null}
      navigation={view.navigation}
    >
      <header className="qm-section-header">
        <p className="qm-label">Section</p>
        <h1>{view.name}</h1>
        {view.description ? <p className="qm-dek">{view.description}</p> : null}
      </header>
      {view.stories.length > 0 ? (
        <ul className="qm-grid">
          {view.stories.map((story, index) => (
            <li
              className={story.image ? 'qm-grid-story' : 'qm-grid-story qm-story-text'}
              key={story.slug}
            >
              <Link className="qm-story-link" href={story.href}>
                {story.image ? (
                  <ReaderImageView image={story.image} preload={index === 0} sizes={cardSizes} />
                ) : null}
                <h2 className="qm-card-title">{story.title}</h2>
              </Link>
              {story.dek ? <p className="qm-story-dek">{story.dek}</p> : null}
              <p className="qm-date">
                <time dateTime={story.publishedAt}>{formatPublishedDate(story.publishedAt)}</time>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="qm-section-empty">No stories have been published in this section yet.</p>
      )}
    </MonographShell>
  )
}
