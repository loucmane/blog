import Link from 'next/link'

import { ReaderImageView } from '@/reader/components/reader-image'
import { formatPublishedDate } from '@/reader/format'

import type { HomeDirectionProps } from '../contract'
import { LiteraryShell, SectionLabel } from './shell'

const coverSizes =
  '(min-width: 1376px) 39rem, (min-width: 768px) 46vw, (min-width: 500px) 92vw, calc(100vw - 2.5rem)'
const cardSizes =
  '(min-width: 1376px) 18rem, (min-width: 1024px) 21vw, (min-width: 600px) 44vw, (min-width: 500px) 92vw, calc(100vw - 2.5rem)'

export function LiteraryHome({ view }: HomeDirectionProps) {
  const { lead } = view
  const featured = view.recent.slice(0, 4)
  const latest = view.recent.slice(4)
  return (
    <LiteraryShell
      isHome
      navigation={view.navigation}
      leadImage={lead?.image ? { image: lead.image, sizes: coverSizes } : null}
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
              <Link className="ll-read" href={lead.href}>
                Read the story <span aria-hidden="true">→</span>
                <span className="ll-sr-only">: {lead.title}</span>
              </Link>
            </div>
            {lead.image ? (
              <div className="ll-cover-image">
                <ReaderImageView image={lead.image} preload sizes={coverSizes} />
              </div>
            ) : null}
          </section>
          {featured.length > 0 ? (
            <section aria-labelledby="ll-featured" className="ll-featured">
              <h2 className="ll-label ll-section-label" id="ll-featured">
                More stories
              </h2>
              <ul className="ll-grid">
                {featured.map((story) => (
                  <li className={`ll-card${story.image ? '' : ' ll-card-text'}`} key={story.slug}>
                    {story.image ? (
                      <div className="ll-card-image">
                        <ReaderImageView image={story.image} sizes={cardSizes} />
                      </div>
                    ) : null}
                    <SectionLabel section={story.section} />
                    <h3 className="ll-card-title">
                      <Link href={story.href}>{story.title}</Link>
                    </h3>
                    {story.dek ? <p className="ll-card-dek">{story.dek}</p> : null}
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
