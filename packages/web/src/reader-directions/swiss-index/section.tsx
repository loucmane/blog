import type { SectionDirectionProps } from '../contract'
import { SwissShell } from './shell'
import { cardSizes, SwissStoryCard } from './story-card'

export function SwissSection({ view }: SectionDirectionProps) {
  const firstImage = view.stories[0]?.image
  return (
    <SwissShell
      navigation={view.navigation}
      currentSection={view.slug}
      leadImage={firstImage ? { image: firstImage, sizes: cardSizes } : null}
    >
      <header className="si-section-header">
        <p className="si-label">
          Section{' '}
          <span>
            {view.stories.length} {view.stories.length === 1 ? 'story' : 'stories'}
          </span>
        </p>
        <h1>{view.name}</h1>
        {view.description ? <p className="si-dek">{view.description}</p> : null}
      </header>
      {view.stories.length ? (
        <ul className="si-grid" aria-label={`${view.name} stories`}>
          {view.stories.map((story, index) => (
            <SwissStoryCard
              key={story.slug}
              story={story}
              number={index + 1}
              preload={index === 0}
            />
          ))}
        </ul>
      ) : (
        <p className="si-section-empty">No stories have been published in this section yet.</p>
      )}
    </SwissShell>
  )
}
