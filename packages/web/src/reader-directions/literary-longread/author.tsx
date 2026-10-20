import type { AuthorDirectionProps } from '../contract'
import { LiteraryShell } from './shell'
import { thumbnailSizes } from './story-card'
import { LiteraryStoryIndex } from './story-index'

export function LiteraryAuthor({ view }: AuthorDirectionProps) {
  const firstImage = view.stories[0]?.image
  return (
    <LiteraryShell
      navigation={view.navigation}
      leadImage={firstImage ? { image: firstImage, sizes: thumbnailSizes } : null}
    >
      <header className="ll-section-header">
        <p className="ll-label">Author</p>
        <h1>{view.name}</h1>
        {view.bio ? <p className="ll-entity-description">{view.bio}</p> : null}
      </header>
      {view.stories.length > 0 ? (
        <section aria-labelledby="ll-author-stories">
          <h2 className="ll-index-heading" id="ll-author-stories">
            Stories by {view.name}
          </h2>
          <LiteraryStoryIndex
            stories={view.stories}
            headingLevel={3}
            emptyMessage="No published stories by this author yet."
          />
        </section>
      ) : (
        <LiteraryStoryIndex
          stories={view.stories}
          emptyMessage="No published stories by this author yet."
        />
      )}
    </LiteraryShell>
  )
}
