import { SiteHeader } from '@/reader/components/site-header'
import { StoryCardView } from '@/reader/components/story-card'

import type { HomeDirectionProps } from '../contract'

const leadImageSizes = '(min-width: 1024px) 60rem, 100vw'
const recentImageSizes = '(min-width: 1024px) 30rem, (min-width: 768px) 45vw, 100vw'

export function BaselineHome({ view }: HomeDirectionProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader isHome navigation={view.navigation} />
      <main className="container mx-auto flex flex-col gap-16 px-4 py-10">
        {!view.lead ? (
          <section aria-labelledby="no-stories" className="max-w-2xl py-12">
            <h2 className="mb-4 text-3xl font-semibold" id="no-stories">
              No stories yet
            </h2>
            <p className="text-lg text-muted-foreground">
              Nothing has been published so far. New stories appear here as soon as they are
              published.
            </p>
          </section>
        ) : (
          <>
            <section aria-label="Lead story" className="max-w-5xl">
              <StoryCardView
                card={view.lead}
                headingLevel={2}
                imageSizes={leadImageSizes}
                preloadImage
                prominence="lead"
              />
            </section>
            {view.recent.length > 0 ? (
              <section aria-labelledby="recent-stories">
                <h2 className="mb-8 text-2xl font-semibold" id="recent-stories">
                  Recent stories
                </h2>
                <ul className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                  {view.recent.map((card) => (
                    <li key={card.slug}>
                      <StoryCardView card={card} headingLevel={3} imageSizes={recentImageSizes} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </main>
    </div>
  )
}
