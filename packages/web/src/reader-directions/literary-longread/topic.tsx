import type { TopicDirectionProps } from '../contract'
import { LiteraryShell } from './shell'
import { thumbnailSizes } from './story-card'
import { LiteraryStoryIndex } from './story-index'

export function LiteraryTopic({ view }: TopicDirectionProps) {
  const firstImage = view.stories[0]?.image
  return (
    <LiteraryShell
      navigation={view.navigation}
      leadImage={firstImage ? { image: firstImage, sizes: thumbnailSizes } : null}
    >
      <header className="ll-section-header">
        <p className="ll-label">Topic</p>
        <h1>{view.name}</h1>
        {view.description ? <p className="ll-entity-description">{view.description}</p> : null}
      </header>
      <section aria-labelledby="ll-topic-stories">
        <h2 className="ll-index-heading" id="ll-topic-stories">
          Stories
        </h2>
        <LiteraryStoryIndex
          stories={view.stories}
          headingLevel={3}
          emptyMessage="No published stories on this topic yet."
        />
      </section>
    </LiteraryShell>
  )
}
