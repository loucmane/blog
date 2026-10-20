import Link from 'next/link'

import { ReaderFigure } from '@/reader/components/reader-image'

import type { HomeDirectionProps } from '../contract'
import { CinematicShell } from './shell'
import { CinematicStoryCard, CinematicStoryRow, StoryMeta } from './story-card'

export function CinematicHome({ view }: HomeDirectionProps) {
  const { lead } = view
  return (
    <CinematicShell
      isHome
      cover={Boolean(lead)}
      navigation={view.navigation}
      leadImage={lead?.image ? { image: lead.image, sizes: '100vw' } : null}
    >
      {lead ? (
        <>
          <div className={`cf-cover${lead.image ? '' : ' cf-hero-text'}`}>
            {lead.image ? (
              <div
                className="cf-cover-image"
                style={{
                  objectPosition: `${lead.image.focalPoint.x * 100}% ${lead.image.focalPoint.y * 100}%`,
                }}
              >
                <ReaderFigure image={lead.image} sizes="100vw" preload />
              </div>
            ) : null}
            <div className="cf-cover-content">
              <div className="cf-lead">
                <StoryMeta story={lead} />
                <h2 className="cf-title">
                  <Link href={lead.href}>{lead.title}</Link>
                </h2>
                {lead.dek ? <p className="cf-dek">{lead.dek}</p> : null}
                <Link
                  className="cf-read"
                  href={lead.href}
                  aria-label={`Read the story: ${lead.title}`}
                >
                  Read the story <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
          </div>
          {view.recent.length ? (
            <section className="cf-secondary cf-interior cf-module" aria-labelledby="cf-more">
              <h2 id="cf-more" className="cf-module-title">
                More stories
              </h2>
              <ul className="cf-grid">
                {view.recent.slice(0, 2).map((story) => (
                  <CinematicStoryCard key={story.slug} story={story} headingLevel={3} />
                ))}
              </ul>
            </section>
          ) : null}
          {view.recent.length > 2 ? (
            <section className="cf-latest cf-interior cf-module" aria-labelledby="cf-latest">
              <h2 id="cf-latest" className="cf-module-title">
                Latest stories
              </h2>
              <ul>
                {view.recent.slice(2).map((story) => (
                  <CinematicStoryRow key={story.slug} story={story} />
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <section className="cf-empty" aria-labelledby="cf-empty">
          <p className="cf-label">All stories</p>
          <h2 id="cf-empty">No stories yet</h2>
          <p>New stories will appear here when they are published.</p>
        </section>
      )}
    </CinematicShell>
  )
}
