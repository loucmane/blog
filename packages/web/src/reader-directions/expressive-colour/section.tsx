import type { SectionDirectionProps } from '../contract'
import { ExpressiveEmpty } from './empty'
import { ExpressivePageHeader } from './page-header'
import { ExpressiveShell } from './shell'
import { leadSizes } from './sizes'
import { ExpressiveStoryList } from './story-list'

export function ExpressiveSection({ view }: SectionDirectionProps) {
  const firstImage = view.stories[0]?.image
  return (
    <ExpressiveShell
      navigation={view.navigation}
      currentSection={view.slug}
      leadImage={firstImage ? { image: firstImage, sizes: leadSizes } : null}
    >
      <ExpressivePageHeader
        name={view.name}
        slug={view.slug}
        description={view.description}
        stories={view.stories}
      />
      {view.stories.length ? (
        <ExpressiveStoryList stories={view.stories} label={`${view.name} stories, newest first`} />
      ) : (
        <ExpressiveEmpty section />
      )}
    </ExpressiveShell>
  )
}
