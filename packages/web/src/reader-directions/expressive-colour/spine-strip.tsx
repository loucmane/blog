import type { StoryCard } from '@/reader/views'

import { storyColour } from './colours'

export function ExpressiveSpineStrip({ stories }: { readonly stories: readonly StoryCard[] }) {
  if (!stories.length) return null
  return (
    <div className="ec-spine-strip" aria-hidden="true">
      {stories.slice(0, 24).map((story) => (
        <span key={story.slug} data-story-colour={storyColour(story.slug).name} />
      ))}
    </div>
  )
}
