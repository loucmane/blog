import Link from 'next/link'

import { ArticleBody } from '@/reader/components/article-body'
import { ReaderFigure } from '@/reader/components/reader-image'
import { formatPublishedDate, formatReadingTime } from '@/reader/format'

import type { ArticleDirectionProps } from '../contract'
import { SwissShell } from './shell'

const heroSizes =
  '(min-width: 1440px) 62.625rem, (min-width: 1024px) calc(70.5vw - 0.375rem), (min-width: 667px) 94vw, calc(100vw - 2.5rem)'

export function SwissArticle({ view }: ArticleDirectionProps) {
  const credit = view.hero?.credit
  return (
    <SwissShell
      navigation={view.navigation}
      leadImage={view.hero ? { image: view.hero, sizes: heroSizes } : null}
    >
      <article className="si-article">
        <dl className="si-rail">
          {view.section ? (
            <div>
              <dt>Section</dt>
              <dd>
                <Link href={view.section.href}>{view.section.name}</Link>
              </dd>
            </div>
          ) : null}
          <div>
            <dt>Published</dt>
            <dd>
              <time dateTime={view.publishedAt}>{formatPublishedDate(view.publishedAt)}</time>
            </dd>
          </div>
          <div>
            <dt>Reading time</dt>
            <dd>{formatReadingTime(view.readingMinutes)}</dd>
          </div>
          {view.authors.length ? (
            <div>
              <dt>Words</dt>
              <dd>{view.authors.join(', ')}</dd>
            </div>
          ) : null}
          {credit ? (
            <div>
              <dt>Lead photo</dt>
              <dd>
                {credit.url ? (
                  <a href={credit.url} rel="noreferrer">
                    {credit.name}
                  </a>
                ) : (
                  credit.name
                )}
              </dd>
            </div>
          ) : null}
        </dl>
        <div className="si-article-main">
          <header className="si-article-header">
            <h1>{view.title}</h1>
            {view.dek ? <p className="si-dek">{view.dek}</p> : null}
          </header>
          {view.hero ? (
            <div className="si-hero">
              <ReaderFigure image={view.hero} preload sizes={heroSizes} />
            </div>
          ) : null}
          <div className="si-body">
            <ArticleBody blocks={view.body} />
          </div>
        </div>
      </article>
    </SwissShell>
  )
}
