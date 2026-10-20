import type { StoryCard } from '@/reader/views'

import { storyColour } from './colours'
import { StoryMotif } from './motif'
import { ExpressiveSpineStrip } from './spine-strip'

export function ExpressivePageHeader({
  name,
  slug,
  description,
  stories,
  kind = 'Section',
}: {
  readonly name: string
  readonly slug: string
  readonly description: string | null
  readonly stories: readonly StoryCard[]
  readonly kind?: 'Section' | 'Author' | 'Topic'
}) {
  return (
    <div className="ec-section-header">
      <p className="ec-label">
        {kind} · {stories.length} {stories.length === 1 ? 'story' : 'stories'}
      </p>
      <div className="ec-page-heading">
        {kind === 'Author' ? (
          <div
            className="ec-author-mark"
            data-story-colour={storyColour(slug).name}
            aria-hidden="true"
          >
            <StoryMotif slug={slug} />
          </div>
        ) : null}
        <h1 className={name.length > 80 ? 'ec-title-long' : undefined}>
          {kind !== 'Author' ? (
            <span
              className={`ec-chip${kind === 'Topic' ? ' ec-chip-ring' : ''}`}
              data-story-colour={storyColour(slug).name}
              aria-hidden="true"
            />
          ) : null}
          {name}
        </h1>
      </div>
      {description ? <p className="ec-dek">{description}</p> : null}
      <ExpressiveSpineStrip stories={stories} />
    </div>
  )
}
