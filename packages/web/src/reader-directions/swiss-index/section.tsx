import Link from 'next/link'

import type { SectionDirectionProps } from '../contract'
import { SwissIndexList, SwissLabelRow } from './index-row'
import { SwissShell } from './shell'
import { cardSizes, isLongTitle, platesAlone, SwissPlate } from './story-card'

/** Stories 01–04 are plates; the index lists the rest. */
const plateCount = 4

export function SwissSection({ view }: SectionDirectionProps) {
  const firstImage = view.stories[0]?.image
  const plates = view.stories.slice(0, plateCount)
  const alone = platesAlone(plates.map(() => 1))
  const earlier = view.stories.slice(plateCount)
  return (
    <SwissShell
      navigation={view.navigation}
      currentSection={view.slug}
      leadImage={firstImage ? { image: firstImage, sizes: cardSizes } : null}
    >
      <header className="si-section-header">
        <SwissLabelRow count={view.stories.length} label="Section" />
        <h1 className={isLongTitle(view.name) ? 'si-title-long' : undefined}>{view.name}</h1>
        {view.description ? <p className="si-dek">{view.description}</p> : null}
      </header>
      {plates.length ? (
        <>
          {/* eslint-disable-next-line jsx-a11y-x/no-redundant-roles -- Removed list styles drop list semantics in Safari. */}
          <ol aria-label={`${view.name} stories`} className="si-plates" role="list" start={1}>
            {plates.map((story, index) => (
              <SwissPlate
                key={story.slug}
                story={story}
                number={index + 1}
                preload={index === 0}
                alone={alone[index]}
              />
            ))}
          </ol>
          {earlier.length ? (
            <section className="si-earlier" aria-labelledby="si-earlier">
              <SwissLabelRow
                count={earlier.length}
                heading
                id="si-earlier"
                label={`Earlier in ${view.name}`}
              />
              <SwissIndexList showSection={false} start={plateCount + 1} stories={earlier} />
            </section>
          ) : null}
        </>
      ) : (
        <div className="si-section-empty">
          <p>No stories have been published in this section yet.</p>
          <p>
            <Link href="/">Front page</Link>
          </p>
        </div>
      )}
    </SwissShell>
  )
}
