import { ArticleBody } from '@/reader/components/article-body'
import { ReaderFigure } from '@/reader/components/reader-image'
import { formatPublishedDate, formatReadingTime } from '@/reader/format'

import type { ArticleDirectionProps } from '../contract'
import { MonographShell, SectionLabel } from './shell'

export function MonographArticle({ view }: ArticleDirectionProps) {
  return (
    <MonographShell navigation={view.navigation}>
      <article className={`qm-article${view.hero ? '' : ' qm-article-text'}`}>
        {view.hero ? (
          <div className="qm-hero">
            <ReaderFigure
              image={view.hero}
              preload
              sizes="(min-width: 1044px) 60rem, (min-width: 500px) 92vw, calc(100vw - 2.5rem)"
            />
          </div>
        ) : null}
        <header className="qm-article-header">
          <SectionLabel section={view.section} />
          <h1>{view.title}</h1>
          {view.dek ? <p className="qm-dek">{view.dek}</p> : null}
          <div className="qm-byline">
            {view.authors.length > 0 ? <p>By {view.authors.join(', ')}</p> : null}
            <p>
              <time dateTime={view.publishedAt}>{formatPublishedDate(view.publishedAt)}</time>
              <span aria-hidden="true"> · </span>
              {formatReadingTime(view.readingMinutes)}
            </p>
          </div>
        </header>
        <div className="qm-body">
          <ArticleBody blocks={view.body} />
        </div>
      </article>
    </MonographShell>
  )
}
