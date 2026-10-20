import Link from 'next/link'

import type { SectionDirectionProps } from '../contract'
import { CinematicShell } from './shell'
import { featureSizes, CinematicStoryCard } from './story-card'

export function CinematicSection({ view }: SectionDirectionProps) {
  const firstImage = view.stories[0]?.image
  return (
    <CinematicShell
      navigation={view.navigation}
      currentSection={view.slug}
      leadImage={firstImage ? { image: firstImage, sizes: featureSizes } : null}
    >
      <div className="cf-section-header">
        <p className="cf-label">Section</p>
        <h1 className="cf-collection-title">{view.name}</h1>
        {view.description ? <p className="cf-dek">{view.description}</p> : null}
      </div>
      {view.stories.length ? (
        <ul className="cf-grid cf-collection cf-interior" aria-label={`${view.name} stories`}>
          {view.stories.map((story, index) => (
            <CinematicStoryCard
              key={story.slug}
              story={story}
              feature={index === 0}
              preload={index === 0}
            />
          ))}
        </ul>
      ) : (
        <div className="cf-section-empty">
          <p>No stories have been published in this section yet.</p>
          <Link className="cf-read" href="/">
            All stories
          </Link>
        </div>
      )}
    </CinematicShell>
  )
}
