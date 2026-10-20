import type { SectionDirectionProps } from '../contract'
import { LiteraryShell } from './shell'
import { thumbnailSizes } from './story-card'
import { LiteraryStoryIndex } from './story-index'

export function LiterarySection({ view }: SectionDirectionProps) {
  const firstImage = view.stories[0]?.image
  return (
    <LiteraryShell
      navigation={view.navigation}
      currentSection={view.slug}
      leadImage={firstImage ? { image: firstImage, sizes: thumbnailSizes } : null}
    >
      <header className="ll-section-header">
        <p className="ll-label">Section</p>
        <h1>{view.name}</h1>
        {view.description ? <p className="ll-dek">{view.description}</p> : null}
      </header>
      <LiteraryStoryIndex
        stories={view.stories}
        emptyMessage="No stories have been published in this section yet."
      />
    </LiteraryShell>
  )
}
