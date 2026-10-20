import type { TopicDirectionProps } from '../contract'
import { SwissEmptyList, SwissPageHeader, SwissPlateList } from './listing'
import { SwissShell } from './shell'
import { cardSizes } from './story-card'

/** A topic page is laid out as a section page; its index keeps the section, since topics cross sections. */
export function SwissTopic({ view }: TopicDirectionProps) {
  const firstImage = view.stories[0]?.image
  return (
    <SwissShell
      navigation={view.navigation}
      leadImage={firstImage ? { image: firstImage, sizes: cardSizes } : null}
    >
      <SwissPageHeader count={view.stories.length} label="Topic" name={view.name}>
        {view.description ? <p className="si-dek">{view.description}</p> : null}
      </SwissPageHeader>
      {view.stories.length ? (
        <SwissPlateList
          earlierLabel={`Earlier stories on ${view.name}`}
          name={view.name}
          stories={view.stories}
        />
      ) : (
        <SwissEmptyList>No published stories on this topic yet.</SwissEmptyList>
      )}
    </SwissShell>
  )
}
