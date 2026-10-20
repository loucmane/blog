import type { StoryCard } from '@/reader/views'

import { storyColour } from './colours'
import { ExpressiveSpineStrip } from './spine-strip'

export function ExpressivePageHeader({
  name,
  slug,
  description,
  stories,
}: {
  readonly name: string
  readonly slug: string
  readonly description: string | null
  readonly stories: readonly StoryCard[]
}) {
  return (
    <div className="ec-section-header">
      <p className="ec-label">
        Section · {stories.length} {stories.length === 1 ? 'story' : 'stories'}
      </p>
      <h1 className={name.length > 80 ? 'ec-title-long' : undefined}>
        <span className="ec-chip" data-story-colour={storyColour(slug).name} aria-hidden="true" />
        {name}
      </h1>
      {description ? <p className="ec-dek">{description}</p> : null}
      <ExpressiveSpineStrip stories={stories} />
    </div>
  )
}
