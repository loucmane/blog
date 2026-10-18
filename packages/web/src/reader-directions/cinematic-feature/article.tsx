import { ArticleBody } from '@/reader/components/article-body'
import { ReaderFigure } from '@/reader/components/reader-image'
import { formatPublishedDate } from '@/reader/format'

import type { ArticleDirectionProps } from '../contract'
import { CinematicShell } from './shell'
import { StoryMeta } from './story-card'

export function CinematicArticle({ view }: ArticleDirectionProps) {
  return (
    <CinematicShell
      cover
      navigation={view.navigation}
      leadImage={view.hero ? { image: view.hero, sizes: '100vw' } : null}
    >
      <article>
        <header className={`cf-article-hero${view.hero ? '' : ' cf-hero-text'}`}>
          {view.hero ? (
            <div
              className="cf-hero"
              style={{
                objectPosition: `${view.hero.focalPoint.x * 100}% ${view.hero.focalPoint.y * 100}%`,
              }}
            >
              <ReaderFigure image={view.hero} sizes="100vw" preload />
            </div>
          ) : null}
          <div className="cf-article-heading">
            <StoryMeta story={view} />
            <h1 className="cf-title">{view.title}</h1>
            {view.dek ? <p className="cf-dek">{view.dek}</p> : null}
            <div className="cf-credits">
              {view.authors.length ? <p>Words by {view.authors.join(', ')}</p> : null}
              <time dateTime={view.publishedAt}>{formatPublishedDate(view.publishedAt)}</time>
            </div>
          </div>
        </header>
        <div className="cf-reading-surface">
          <div className="cf-body">
            <ArticleBody blocks={view.body} />
          </div>
        </div>
      </article>
    </CinematicShell>
  )
}
