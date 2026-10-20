import type { HomeDirectionProps } from '../contract'
import { SwissIndexList, SwissLabelRow } from './index-row'
import { SwissShell } from './shell'
import { plateSizes, platesAlone, SwissPlate } from './story-card'

/** The cover holds stories 01–03; the index lists the rest. */
const coverSize = 3

export function SwissHome({ view }: HomeDirectionProps) {
  const { lead } = view
  const cover = view.recent.slice(0, coverSize - 1)
  const earlier = view.recent.slice(coverSize - 1)
  // Plate 01 spans two columns.
  const alone = platesAlone([2, ...cover.map(() => 1)])
  return (
    <SwissShell
      isHome
      navigation={view.navigation}
      leadImage={lead?.image ? { image: lead.image, sizes: plateSizes(lead.image, 'lead') } : null}
    >
      {lead ? (
        <>
          {/* eslint-disable-next-line jsx-a11y-x/no-redundant-roles -- Removed list styles drop list semantics in Safari. */}
          <ol aria-label="Latest stories" className="si-plates si-cover" role="list" start={1}>
            <SwissPlate story={lead} number={1} lead preload />
            {cover.map((story, index) => (
              <SwissPlate
                key={story.slug}
                story={story}
                number={index + 2}
                // From 1024px plates 02 and 03 share the first row with plate 01.
                eager
                alone={alone[index + 1]}
              />
            ))}
          </ol>
          {earlier.length ? (
            <section className="si-earlier" aria-labelledby="si-earlier">
              <SwissLabelRow
                count={earlier.length}
                heading
                id="si-earlier"
                label="Earlier stories"
              />
              <SwissIndexList start={coverSize + 1} stories={earlier} />
            </section>
          ) : null}
        </>
      ) : (
        <section className="si-empty" aria-labelledby="si-empty">
          <h2 id="si-empty">No stories yet</h2>
          <p>New stories will appear here when they are published.</p>
        </section>
      )}
    </SwissShell>
  )
}
