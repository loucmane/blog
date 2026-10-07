import { ArticleBody } from '@/reader/components/article-body'
import { ReaderFigure } from '@/reader/components/reader-image'
import { formatPublishedDate, formatReadingTime } from '@/reader/format'

import type { ArticleDirectionProps } from '../contract'
import { LiteraryShell, SectionLabel } from './shell'

const heroSizes = '(min-width: 1044px) 60rem, (min-width: 500px) 92vw, calc(100vw - 2.5rem)'

export function LiteraryArticle({ view }: ArticleDirectionProps) {
  return (
    <LiteraryShell
      navigation={view.navigation}
      leadImage={view.hero ? { image: view.hero, sizes: heroSizes } : null}
    >
      <article className="ll-article">
        <header className="ll-article-header">
          <SectionLabel section={view.section} />
          <h1>{view.title}</h1>
          {view.dek ? <p className="ll-dek">{view.dek}</p> : null}
          <div className="ll-byline">
            {view.authors.length > 0 ? <p>By {view.authors.join(', ')}</p> : null}
            <p>
              <time dateTime={view.publishedAt}>{formatPublishedDate(view.publishedAt)}</time>
              <span aria-hidden="true"> · </span>
              {formatReadingTime(view.readingMinutes)}
            </p>
          </div>
        </header>
        {view.hero ? (
          <div className="ll-hero">
            <ReaderFigure image={view.hero} preload sizes={heroSizes} />
          </div>
        ) : null}
        <div className="ll-body">
          <ArticleBody blocks={view.body} />
        </div>
      </article>
    </LiteraryShell>
  )
}
