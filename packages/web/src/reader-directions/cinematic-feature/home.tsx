import Link from 'next/link'

import { ReaderImageView } from '@/reader/components/reader-image'

import type { HomeDirectionProps } from '../contract'
import { CinematicShell } from './shell'
import { CinematicStoryCard, StoryMeta } from './story-card'

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
                <ReaderImageView image={lead.image} sizes="100vw" preload />
              </div>
            ) : null}
            <div className="cf-cover-content">
              <div className="cf-lead">
                <StoryMeta story={lead} />
                <h2 className="cf-title">
                  <Link href={lead.href}>{lead.title}</Link>
                </h2>
                {lead.dek ? <p className="cf-dek">{lead.dek}</p> : null}
                <Link className="cf-read" href={lead.href}>
                  Read the story <span aria-hidden="true">↗</span>
                </Link>
              </div>
              {view.recent.length ? (
                <ol className="cf-next" aria-label="Next stories, newest first" start={2}>
                  {view.recent.slice(0, 3).map((story, index) => (
                    <li key={story.slug}>
                      <span className="cf-number" aria-hidden="true">
                        {String(index + 2).padStart(2, '0')}
                      </span>
                      <div className="cf-next-copy">
                        <h2>
                          <Link href={story.href}>{story.title}</Link>
                        </h2>
                        <StoryMeta story={story} />
                      </div>
                      {story.image ? (
                        <div className="cf-thumbnail">
                          <ReaderImageView image={story.image} sizes="80px" />
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          </div>
          {view.recent.length > 3 ? (
            <ul className="cf-grid cf-further" aria-label="More stories">
              {view.recent.slice(3).map((story) => (
                <CinematicStoryCard key={story.slug} story={story} />
              ))}
            </ul>
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
