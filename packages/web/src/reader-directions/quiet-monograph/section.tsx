import Link from 'next/link'

import type { ReaderNavigation, StoryCard } from '@/reader/views'

import type { SectionDirectionProps } from '../contract'
import { ChecklistRow, HangItem, platePicture, StoryList, storyCount } from './plate'
import { MonographShell } from './shell'

/** The hang holds the first six stories; later ones are rows. */
const hangCount = 6

/**
 * The section layout, which topic pages share: a header, the hang, then "Earlier in" rows. A topic
 * crosses sections, so its plates and rows keep their section labels; a section's rows show the
 * date in the section label's place.
 */
export function HangPage({
  currentSection,
  description,
  empty,
  kind,
  name,
  navigation,
  stories,
}: {
  readonly currentSection?: string | undefined
  readonly description: string | null
  /** The sentence shown when nothing is published here yet. */
  readonly empty: string
  readonly kind: 'Section' | 'Topic'
  readonly name: string
  readonly navigation: ReaderNavigation
  readonly stories: readonly StoryCard[]
}) {
  const crossesSections = kind === 'Topic'
  const hang = stories.slice(0, hangCount)
  const earlier = stories.slice(hangCount)
  const first = hang[0]
  const lead = first ? platePicture(first.image, 'bay') : null
  return (
    <MonographShell
      currentSection={currentSection}
      leadImage={lead ? { image: lead.image, sizes: lead.sizes } : null}
      navigation={navigation}
    >
      <header className="qm-section-header">
        <p className="qm-label">{kind}</p>
        <h1>{name}</h1>
        {description ? <p className="qm-dek">{description}</p> : null}
        <p className="qm-meta">{storyCount(stories.length)}</p>
      </header>
      {hang.length > 0 ? (
        <StoryList className="qm-hang">
          {hang.map((story, index) => (
            <HangItem
              // Both first-row plates load at once; only the first gets the high-priority hint.
              eager={index === 1}
              key={story.slug}
              preload={index === 0}
              // Rows hold two stories: a second one always shares, a first one when a second follows.
              sharesRow={index % 2 === 1 || index + 1 < hang.length}
              showSection={crossesSections}
              story={story}
            />
          ))}
        </StoryList>
      ) : (
        <div className="qm-section-empty">
          <p>{empty}</p>
          <p className="qm-label">
            <Link href="/">Front page</Link>
          </p>
        </div>
      )}
      {earlier.length > 0 ? (
        <section className="qm-earlier">
          <h2 className="qm-label">Earlier in {name}</h2>
          <StoryList className="qm-rows">
            {earlier.map((story) => (
              <ChecklistRow dated={!crossesSections} key={story.slug} story={story} />
            ))}
          </StoryList>
        </section>
      ) : null}
    </MonographShell>
  )
}

export function MonographSection({ view }: SectionDirectionProps) {
  return (
    <HangPage
      currentSection={view.slug}
      description={view.description}
      empty="No stories have been published in this section yet."
      kind="Section"
      name={view.name}
      navigation={view.navigation}
      stories={view.stories}
    />
  )
}
