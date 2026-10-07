import Link from 'next/link'

import { ArticleBody } from '@/reader/components/article-body'
import { ReaderFigure } from '@/reader/components/reader-image'
import { formatPublishedDate, formatReadingTime } from '@/reader/format'

import type { ArticleDirectionProps } from '../contract'
import { storyColour } from './colours'
import { ExpressiveShell } from './shell'

const heroSizes = '(min-width: 1408px) 1312px, 94vw'

export function ExpressiveArticle({ view }: ArticleDirectionProps) {
  return (
    <ExpressiveShell
      navigation={view.navigation}
      currentSection={view.section?.slug}
      leadImage={view.hero ? { image: view.hero, sizes: heroSizes } : null}
    >
      <article className="ec-article" data-story-colour={storyColour(view.slug).name}>
        <header className="ec-article-band">
          <div className="ec-article-meta">
            {view.section ? (
              <Link className="ec-pill" href={view.section.href}>
                {view.section.name}
              </Link>
            ) : (
              <span>Story</span>
            )}
            <span>{formatReadingTime(view.readingMinutes)}</span>
          </div>
          <h1>{view.title}</h1>
        </header>
        <div className="ec-article-intro">
          {view.dek ? <p className="ec-dek">{view.dek}</p> : null}
          <div className="ec-credits">
            {view.authors.length ? <p>Words by {view.authors.join(', ')}</p> : null}
            <time dateTime={view.publishedAt}>{formatPublishedDate(view.publishedAt)}</time>
          </div>
        </div>
        {view.hero ? (
          <div className="ec-hero">
            <ReaderFigure image={view.hero} sizes={heroSizes} preload />
          </div>
        ) : null}
        <div className="ec-body">
          <ArticleBody blocks={view.body} />
        </div>
      </article>
    </ExpressiveShell>
  )
}
