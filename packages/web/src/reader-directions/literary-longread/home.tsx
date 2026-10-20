import Link from 'next/link'

import { formatPublishedDate, formatReadingTime } from '@/reader/format'

import type { HomeDirectionProps } from '../contract'
import { coverSizes } from './image-sizes'
import { LiteraryShell, SectionLabel } from './shell'
import { LiteraryFigure, LiteraryStoryCard, LiteraryStoryMeta } from './story-card'

export function LiteraryHome({ view }: HomeDirectionProps) {
  const { lead } = view
  const featured = view.recent.slice(0, 4)
  const latest = view.recent.slice(4)
  return (
    <LiteraryShell
      isHome
      navigation={view.navigation}
      leadImage={lead?.image ? { image: lead.image, sizes: coverSizes(lead.image) } : null}
    >
      {lead ? (
        <>
          <section
            aria-label="Lead story"
            className={`ll-cover${lead.image ? '' : ' ll-cover-text'}`}
          >
            <div className="ll-cover-panel">
              <SectionLabel section={lead.section} />
              <h2 className="ll-cover-title">
                <Link href={lead.href}>{lead.title}</Link>
              </h2>
              {lead.dek ? <p className="ll-cover-dek">{lead.dek}</p> : null}
              <LiteraryStoryMeta story={lead} />
              <Link
                className="ll-read"
                href={lead.href}
                aria-label={`Read the story: ${lead.title}`}
              >
                Read the story
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            {lead.image ? (
              <LiteraryFigure
                className="ll-cover-image"
                image={lead.image}
                preload
                sizes={coverSizes(lead.image)}
              />
            ) : null}
          </section>
          {featured.length > 0 ? (
            <section aria-labelledby="ll-featured" className="ll-featured">
              <h2 className="ll-label ll-section-label" id="ll-featured">
                More stories
              </h2>
              <ul className="ll-grid">
                {featured.map((story) => (
                  <li key={story.slug}>
                    <LiteraryStoryCard story={story} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {latest.length > 0 ? (
            <section aria-labelledby="ll-latest" className="ll-latest">
              <h2 id="ll-latest">Latest</h2>
              <ul>
                {latest.map((story) => (
                  <li key={story.slug}>
                    <time className="ll-date" dateTime={story.publishedAt}>
                      {formatPublishedDate(story.publishedAt)}
                    </time>
                    <div>
                      <SectionLabel section={story.section} />
                      <h3 className="ll-card-title">
                        <Link href={story.href}>{story.title}</Link>
                      </h3>
                      {story.dek ? <p className="ll-card-dek">{story.dek}</p> : null}
                      <p className="ll-meta">{formatReadingTime(story.readingMinutes)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <section aria-labelledby="ll-empty" className="ll-empty">
          <h2 id="ll-empty">No stories yet</h2>
          <p>New stories will appear here when they are published.</p>
        </section>
      )}
    </LiteraryShell>
  )
}
