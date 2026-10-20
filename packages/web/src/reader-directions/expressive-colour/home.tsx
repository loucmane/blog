import type { HomeDirectionProps } from '../contract'
import { ExpressiveEmpty } from './empty'
import { ExpressiveShell } from './shell'
import { leadSizes } from './sizes'
import { ExpressiveStoryList } from './story-list'

export function ExpressiveHome({ view }: HomeDirectionProps) {
  const stories = view.lead ? [view.lead, ...view.recent] : view.recent
  return (
    <ExpressiveShell
      isHome
      navigation={view.navigation}
      stories={stories}
      leadImage={stories[0]?.image ? { image: stories[0].image, sizes: leadSizes } : null}
    >
      {stories.length ? (
        <ExpressiveStoryList stories={stories} layout="home" label="Stories, newest first" />
      ) : (
        <ExpressiveEmpty />
      )}
    </ExpressiveShell>
  )
}
