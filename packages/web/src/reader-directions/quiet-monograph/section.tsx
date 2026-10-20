import Link from 'next/link'

import type { SectionDirectionProps } from '../contract'
import { ChecklistRow, HangItem, platePicture, StoryList } from './plate'
import { MonographShell } from './shell'

/** The hang holds the first six stories; later ones are rows. */
const hangCount = 6

function storyCount(count: number): string {
  if (count === 0) return 'No stories'
  return count === 1 ? '1 story' : `${count} stories`
}

export function MonographSection({ view }: SectionDirectionProps) {
  const hang = view.stories.slice(0, hangCount)
  const earlier = view.stories.slice(hangCount)
  const first = hang[0]
  const lead = first ? platePicture(first.image, 'bay') : null
  return (
    <MonographShell
      currentSection={view.slug}
      leadImage={lead ? { image: lead.image, sizes: lead.sizes } : null}
      navigation={view.navigation}
    >
      <header className="qm-section-header">
        <p className="qm-label">Section</p>
        <h1>{view.name}</h1>
        {view.description ? <p className="qm-dek">{view.description}</p> : null}
        <p className="qm-meta">{storyCount(view.stories.length)}</p>
      </header>
      {hang.length > 0 ? (
        <StoryList className="qm-hang">
          {hang.map((story, index) => (
            <HangItem
              key={story.slug}
              preload={index === 0}
              // Rows hold two stories: a second one always shares, a first one when a second follows.
              sharesRow={index % 2 === 1 || index + 1 < hang.length}
              story={story}
            />
          ))}
        </StoryList>
      ) : (
        <div className="qm-section-empty">
          <p>No stories have been published in this section yet.</p>
          <p className="qm-label">
            <Link href="/">Front page</Link>
          </p>
        </div>
      )}
      {earlier.length > 0 ? (
        <section className="qm-earlier">
          <h2 className="qm-label">Earlier in {view.name}</h2>
          <StoryList className="qm-rows">
            {earlier.map((story) => (
              <ChecklistRow dated key={story.slug} story={story} />
            ))}
          </StoryList>
        </section>
      ) : null}
    </MonographShell>
  )
}
