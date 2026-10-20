import { storyColour } from './colours'
import { StoryMotif } from './motif'

export function ExpressiveEmpty({ section = false }: { readonly section?: boolean }) {
  return (
    <section
      className="ec-empty"
      aria-labelledby="ec-empty-title"
      data-story-colour={storyColour('empty').name}
    >
      <div>
        {!section ? <p className="ec-label">All stories</p> : null}
        <h2 id="ec-empty-title">No stories yet</h2>
        <p>
          {section
            ? 'No stories have been published in this section yet.'
            : 'New stories will appear here when they are published.'}
        </p>
      </div>
      <div className="ec-empty-motif">
        <StoryMotif slug="empty" />
      </div>
    </section>
  )
}
