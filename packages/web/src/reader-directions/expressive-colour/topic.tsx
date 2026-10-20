import type { TopicDirectionProps } from '../contract'
import { ExpressiveEmpty } from './empty'
import { ExpressivePageHeader } from './page-header'
import { ExpressiveShell } from './shell'
import { leadSizes } from './sizes'
import { ExpressiveStoryList } from './story-list'

export function ExpressiveTopic({ view }: TopicDirectionProps) {
  const firstImage = view.stories[0]?.image
  return (
    <ExpressiveShell
      navigation={view.navigation}
      leadImage={firstImage ? { image: firstImage, sizes: leadSizes } : null}
    >
      <ExpressivePageHeader
        kind="Topic"
        name={view.name}
        slug={view.slug}
        description={view.description}
        stories={view.stories}
      />
      {view.stories.length ? (
        <ExpressiveStoryList stories={view.stories} label={`${view.name} stories, newest first`} />
      ) : (
        <ExpressiveEmpty collection />
      )}
    </ExpressiveShell>
  )
}
