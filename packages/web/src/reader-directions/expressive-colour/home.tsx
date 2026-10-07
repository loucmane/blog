import type { HomeDirectionProps } from '../contract'
import { ExpressiveShell } from './shell'
import { ExpressiveStoryCard, leadSizes } from './story-card'

export function ExpressiveHome({ view }: HomeDirectionProps) {
  const stories = view.lead ? [view.lead, ...view.recent] : view.recent
  return (
    <ExpressiveShell
      isHome
      navigation={view.navigation}
      leadImage={view.lead?.image ? { image: view.lead.image, sizes: leadSizes } : null}
    >
      {stories.length ? (
        <ol className="ec-grid" aria-label="Stories, newest first">
          {stories.map((story, index) => (
            <ExpressiveStoryCard
              key={story.slug}
              story={story}
              number={index + 1}
              lead={index === 0}
              preload={index === 0}
            />
          ))}
        </ol>
      ) : (
        <section className="ec-empty" aria-labelledby="ec-empty-title">
          <p className="ec-label">All stories</p>
          <h2 id="ec-empty-title">No stories yet</h2>
          <p>New stories will appear here when they are published.</p>
        </section>
      )}
    </ExpressiveShell>
  )
}
