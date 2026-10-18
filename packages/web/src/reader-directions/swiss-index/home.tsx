import Link from 'next/link'

import type { HomeDirectionProps } from '../contract'
import { SwissShell } from './shell'
import { leadSizes, StoryMeta, SwissStoryCard } from './story-card'

export function SwissHome({ view }: HomeDirectionProps) {
  const { lead } = view
  const latest = view.recent.slice(2)
  return (
    <SwissShell
      isHome
      navigation={view.navigation}
      leadImage={lead?.image ? { image: lead.image, sizes: leadSizes } : null}
    >
      {lead ? (
        <>
          <ul className="si-grid si-home-grid" aria-label="Latest stories">
            <SwissStoryCard story={lead} number={1} lead wide preload />
            {view.recent.slice(0, 2).map((story, index) => (
              <SwissStoryCard key={story.slug} story={story} number={index + 2} />
            ))}
          </ul>
          {latest.length ? (
            <section className="si-latest" aria-labelledby="si-latest">
              <h2 className="si-label" id="si-latest">
                Further reading
              </h2>
              <ol start={4} className="si-index">
                {latest.map((story, index) => (
                  <li key={story.slug}>
                    <StoryMeta story={story} number={index + 4} />
                    <div className="si-index-copy">
                      <h3>
                        <Link href={story.href}>{story.title}</Link>
                      </h3>
                      {story.dek ? <p>{story.dek}</p> : null}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </>
      ) : (
        <section className="si-empty" aria-labelledby="si-empty">
          <h2 id="si-empty">No stories yet</h2>
          <p>New stories will appear here when they are published.</p>
        </section>
      )}
    </SwissShell>
  )
}
