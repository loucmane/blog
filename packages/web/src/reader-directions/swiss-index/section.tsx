import type { SectionDirectionProps } from '../contract'
import { SwissEmptyList, SwissPageHeader, SwissPlateList } from './listing'
import { SwissShell } from './shell'
import { cardSizes } from './story-card'

export function SwissSection({ view }: SectionDirectionProps) {
  const firstImage = view.stories[0]?.image
  return (
    <SwissShell
      navigation={view.navigation}
      currentSection={view.slug}
      leadImage={firstImage ? { image: firstImage, sizes: cardSizes } : null}
    >
      <SwissPageHeader count={view.stories.length} label="Section" name={view.name}>
        {view.description ? <p className="si-dek">{view.description}</p> : null}
      </SwissPageHeader>
      {view.stories.length ? (
        // The section column would repeat the page's own section.
        <SwissPlateList
          earlierLabel={`Earlier in ${view.name}`}
          name={view.name}
          showSection={false}
          stories={view.stories}
        />
      ) : (
        <SwissEmptyList>No stories have been published in this section yet.</SwissEmptyList>
      )}
    </SwissShell>
  )
}
