import Link from 'next/link'

import type { AuthorDirectionProps } from '../contract'
import { ChecklistRow, platePicture, Room, StoryList, storyCount } from './plate'
import { MonographShell } from './shell'

/**
 * An author page: the name and bio, the latest story as a room whose picture leads the page, then
 * the rest as checklist rows. Authors have no portrait, and the bio is shown only when stored.
 */
export function MonographAuthor({ view }: AuthorDirectionProps) {
  const [latest, ...more] = view.stories
  const lead = latest ? platePicture(latest.image, 'room') : null
  return (
    <MonographShell
      leadImage={lead ? { image: lead.image, sizes: lead.sizes } : null}
      navigation={view.navigation}
    >
      <header className="qm-section-header qm-author-header">
        <p className="qm-label">Author</p>
        <h1>{view.name}</h1>
        {view.bio ? <p className="qm-dek qm-bio">{view.bio}</p> : null}
        <p className="qm-meta">{storyCount(view.stories.length)}</p>
      </header>
      {latest ? (
        <StoryList className="qm-room-list">
          <Room heading="h2" preload story={latest} />
        </StoryList>
      ) : (
        <div className="qm-section-empty">
          <p>{`No published stories by ${view.name} yet.`}</p>
          <p className="qm-label">
            <Link href="/">Front page</Link>
          </p>
        </div>
      )}
      {more.length > 0 ? (
        <section className="qm-earlier">
          <h2 className="qm-label">{`More by ${view.name}`}</h2>
          <StoryList className="qm-rows">
            {more.map((story) => (
              <ChecklistRow key={story.slug} story={story} />
            ))}
          </StoryList>
        </section>
      ) : null}
    </MonographShell>
  )
}
