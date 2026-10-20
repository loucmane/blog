import Link from 'next/link'

import type { ReaderNavigation, StoryCard } from '@/reader/views'

import { CinematicShell } from './shell'
import { CinematicStoryCard, featureSizes } from './story-card'

/** Author/topic collections use supplied identities and links, never profile queries. */
export function CinematicCollection({
  kind,
  name,
  description,
  navigation,
  stories,
}: {
  readonly kind: 'author' | 'topic'
  readonly name: string
  readonly description: string | null
  readonly navigation: ReaderNavigation
  readonly stories: readonly StoryCard[]
}) {
  const firstImage = stories[0]?.image
  return (
    <CinematicShell
      navigation={navigation}
      leadImage={firstImage ? { image: firstImage, sizes: featureSizes } : null}
    >
      <div className="cf-section-header">
        <p className="cf-label">{kind === 'author' ? 'Author' : 'Topic'}</p>
        <h1 className="cf-collection-title">{name}</h1>
        {description ? (
          kind === 'author' ? (
            <div className="cf-author-bio">
              <p>{description}</p>
            </div>
          ) : (
            <p className="cf-dek">{description}</p>
          )
        ) : null}
      </div>
      {stories.length ? (
        <section className="cf-interior" aria-labelledby="cf-collection-heading">
          <h2 id="cf-collection-heading" className="cf-module-title">
            {kind === 'author' ? `Stories by ${name}` : `Stories about ${name}`}
          </h2>
          <ul className="cf-grid cf-collection">
            {stories.map((story, index) => (
              <CinematicStoryCard
                key={story.href}
                story={story}
                feature={index === 0}
                preload={index === 0}
                headingLevel={3}
              />
            ))}
          </ul>
        </section>
      ) : (
        <div className="cf-section-empty">
          <p>
            {kind === 'author'
              ? 'No published stories by this author yet.'
              : 'No stories have been published about this topic yet.'}
          </p>
          <Link className="cf-read" href="/">
            All stories
          </Link>
        </div>
      )}
    </CinematicShell>
  )
}
