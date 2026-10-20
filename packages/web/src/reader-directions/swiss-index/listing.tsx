import Link from 'next/link'
import type { ReactNode } from 'react'

import type { StoryCard } from '@/reader/views'

import { SwissIndexList, SwissLabelRow } from './index-row'
import { isLongTitle, platesAlone, SwissPlate } from './story-card'

/** Stories 01–04 are plates on section and topic pages; the index lists the rest. */
const plateCount = 4

/**
 * The header of a section, topic or author page: the label row with the story count, the name as
 * the page's one `h1`, and the dek, description or bio passed as children when one is stored.
 */
export function SwissPageHeader({
  children,
  count,
  label,
  name,
}: {
  readonly children?: ReactNode
  readonly count: number
  readonly label: string
  readonly name: string
}) {
  return (
    <header className="si-page-header">
      <SwissLabelRow count={count} label={label} />
      <h1 className={isLongTitle(name) ? 'si-title-long' : undefined}>{name}</h1>
      {children}
    </header>
  )
}

/** Plates 01–04, then index rows from 05 under a label row. Plate 01's image is the lead image. */
export function SwissPlateList({
  earlierLabel,
  name,
  showSection = true,
  stories,
}: {
  readonly earlierLabel: string
  readonly name: string
  readonly showSection?: boolean
  readonly stories: readonly StoryCard[]
}) {
  const plates = stories.slice(0, plateCount)
  const alone = platesAlone(plates.map(() => 1))
  const earlier = stories.slice(plateCount)
  return (
    <>
      {/* eslint-disable-next-line jsx-a11y-x/no-redundant-roles -- Removed list styles drop list semantics in Safari. */}
      <ol aria-label={`${name} stories`} className="si-plates" role="list" start={1}>
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
          <SwissLabelRow count={earlier.length} heading id="si-earlier" label={earlierLabel} />
          <SwissIndexList showSection={showSection} start={plateCount + 1} stories={earlier} />
        </section>
      ) : null}
    </>
  )
}

/** A page's empty list: one sentence under a 1px rule, and a way to the front page. */
export function SwissEmptyList({ children }: { readonly children: ReactNode }) {
  return (
    <div className="si-list-empty">
      <p>{children}</p>
      <p>
        <Link href="/">Front page</Link>
      </p>
    </div>
  )
}
