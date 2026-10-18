import type { SectionDirectionProps } from '../contract'
import { CinematicShell } from './shell'
import { cardSizes, CinematicStoryCard } from './story-card'

export function CinematicSection({ view }: SectionDirectionProps) {
  const firstImage = view.stories[0]?.image
  return (
    <CinematicShell
      navigation={view.navigation}
      currentSection={view.slug}
      leadImage={firstImage ? { image: firstImage, sizes: cardSizes } : null}
    >
      <header className="cf-section-header">
        <p className="cf-label">
          Section{' '}
          <span>
            {view.stories.length} {view.stories.length === 1 ? 'story' : 'stories'}
          </span>
        </p>
        <h1 className="cf-title">{view.name}</h1>
        {view.description ? <p className="cf-dek">{view.description}</p> : null}
      </header>
      {view.stories.length ? (
        <ul className="cf-grid" aria-label={`${view.name} stories`}>
          {view.stories.map((story, index) => (
            <CinematicStoryCard key={story.slug} story={story} preload={index === 0} />
          ))}
        </ul>
      ) : (
        <p className="cf-section-empty">No stories have been published in this section yet.</p>
      )}
    </CinematicShell>
  )
}
