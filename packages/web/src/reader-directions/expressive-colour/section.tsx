import type { SectionDirectionProps } from '../contract'
import { storyColour } from './colours'
import { ExpressiveShell } from './shell'
import { cardSizes, ExpressiveStoryCard } from './story-card'

export function ExpressiveSection({ view }: SectionDirectionProps) {
  const firstImage = view.stories[0]?.image
  return (
    <ExpressiveShell
      navigation={view.navigation}
      currentSection={view.slug}
      leadImage={firstImage ? { image: firstImage, sizes: cardSizes } : null}
    >
      <header className="ec-section-header">
        <p className="ec-label">
          Section · {view.stories.length} {view.stories.length === 1 ? 'story' : 'stories'}
        </p>
        <h1>
          <span
            className="ec-chip"
            data-story-colour={storyColour(view.slug).name}
            aria-hidden="true"
          />
          {view.name}
        </h1>
        {view.description ? <p className="ec-dek">{view.description}</p> : null}
      </header>
      {view.stories.length ? (
        <ol className="ec-grid" aria-label={`${view.name} stories, newest first`}>
          {view.stories.map((story, index) => (
            <ExpressiveStoryCard
              key={story.slug}
              story={story}
              number={index + 1}
              preload={index === 0}
            />
          ))}
        </ol>
      ) : (
        <p className="ec-section-empty">No stories have been published in this section yet.</p>
      )}
    </ExpressiveShell>
  )
}
