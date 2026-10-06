import { SiteHeader } from '@/reader/components/site-header'
import { StoryCardView } from '@/reader/components/story-card'

import type { SectionDirectionProps } from '../contract'

const storyImageSizes = '(min-width: 1024px) 30rem, (min-width: 768px) 45vw, 100vw'

export function BaselineSection({ view }: SectionDirectionProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader navigation={view.navigation} />
      <main className="container mx-auto px-4 py-10">
        <header className="mb-12 flex max-w-3xl flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">Section</p>
          <h1 className="text-4xl font-semibold md:text-6xl">{view.name}</h1>
          {view.description ? (
            <p className="text-xl text-muted-foreground">{view.description}</p>
          ) : null}
        </header>
        {view.stories.length > 0 ? (
          <ul className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {view.stories.map((card) => (
              <li key={card.slug}>
                <StoryCardView card={card} headingLevel={2} imageSizes={storyImageSizes} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-lg text-muted-foreground">
            No stories have been published in this section yet.
          </p>
        )}
      </main>
    </div>
  )
}
