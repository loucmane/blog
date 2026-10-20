import type { StoryCard } from '@/reader/views'

import { storyColour, type StoryColourName } from './colours'
import { ExpressiveStoryCard, type StoryCardVariant } from './story-card'

type ListLayout = 'home' | 'section' | 'related'

function variantAt(index: number, layout: ListLayout): StoryCardVariant {
  if (layout === 'related') return 'related'
  if (index === 0) return 'lead'
  if (layout === 'home' && index < 3) return 'secondary'
  return index < (layout === 'home' ? 9 : 13) ? 'standard' : 'compact'
}

function arrangeStories(stories: readonly StoryCard[], layout: ListLayout) {
  let previousFilled: StoryColourName | null = null
  return stories.map((story, index) => {
    const variant = variantAt(index, layout)
    const colour = storyColour(story.slug).name
    const surface =
      variant === 'compact' ? 'ground' : previousFilled === colour ? 'paper' : 'filled'
    if (variant !== 'compact') previousFilled = surface === 'filled' ? colour : null
    return { story, variant, surface } as const
  })
}

export function ExpressiveStoryList({
  stories,
  label,
  layout = 'section',
}: {
  readonly stories: readonly StoryCard[]
  readonly label: string
  readonly layout?: ListLayout
}) {
  if (!stories.length) return null
  return (
    <ol className="ec-grid" aria-label={label}>
      {arrangeStories(stories, layout).map(({ story, variant, surface }, index) => (
        <ExpressiveStoryCard
          key={story.slug}
          story={story}
          variant={variant}
          surface={surface}
          headingLevel={layout === 'related' ? 3 : 2}
          number={layout === 'related' ? undefined : index + 1}
          solo={layout === 'home' && stories.length === 2 && index === 1}
          preload={layout !== 'related' && index === 0}
        />
      ))}
    </ol>
  )
}
