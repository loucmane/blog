import type { TopicDirectionProps } from '../contract'
import { HangPage } from './section'

/** A topic page: the section layout under the label "Topic", with each story's section shown. */
export function MonographTopic({ view }: TopicDirectionProps) {
  return (
    <HangPage
      description={view.description}
      empty="No published stories on this topic yet."
      kind="Topic"
      name={view.name}
      navigation={view.navigation}
      stories={view.stories}
    />
  )
}
