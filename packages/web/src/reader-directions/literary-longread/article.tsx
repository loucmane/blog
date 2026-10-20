import Link from 'next/link'
import { Fragment } from 'react'

import { ArticleBody } from '@/reader/components/article-body'
import { withContentKeys } from '@/reader/components/keys'
import { ReaderFigure } from '@/reader/components/reader-image'
import { formatPublishedDate, formatReadingTime } from '@/reader/format'

import type { ArticleDirectionProps } from '../contract'
import { LiteraryShell, SectionLabel } from './shell'
import { LiteraryStoryCard } from './story-card'

const heroSizes =
  '(min-width: 1056px) 60rem, (min-width: 1024px) calc(100vw - 6rem), (min-width: 768px) calc(100vw - 3rem), calc(100vw - 2.5rem)'

export function LiteraryArticle({ view, imageSizes }: ArticleDirectionProps) {
  // The shared model supplies parallel names/links, but legacy plain names can still render.
  const authors =
    view.authors.length > 0
      ? view.authors.map((name, index) => ({
          name,
          href:
            (view.authorLinks[index]?.name === name
              ? view.authorLinks[index]
              : view.authorLinks.find((author) => author.name === name)
            )?.href ?? null,
        }))
      : view.authorLinks
  const authorNames = withContentKeys(authors).map(({ item: author, key }, index) => (
    <Fragment key={key}>
      {index > 0 ? ', ' : null}
      {author.href ? <Link href={author.href}>{author.name}</Link> : author.name}
    </Fragment>
  ))
  return (
    <LiteraryShell
      navigation={view.navigation}
      skipLabel="Skip to article"
      leadImage={view.hero ? { image: view.hero, sizes: heroSizes } : null}
    >
      <article className="ll-article">
        <header className="ll-article-header">
          <SectionLabel section={view.section} />
          <h1>{view.title}</h1>
          {view.dek ? <p className="ll-dek">{view.dek}</p> : null}
          <div className="ll-byline">
            {authors.length > 0 ? <p>By {authorNames}</p> : null}
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
          <ArticleBody blocks={view.body} imageSizes={imageSizes} />
        </div>
        <div className="ll-end-matter">
          <div className="ll-closing-rule" aria-hidden="true" />
          {authors.length > 0 ? (
            <section className="ll-authors" aria-labelledby="ll-authors">
              <h2 id="ll-authors">{authors.length === 1 ? 'Author' : 'Authors'}</h2>
              <p>{authorNames}</p>
            </section>
          ) : null}
          {view.topics.length > 0 ? (
            <section className="ll-topics" aria-labelledby="ll-topics">
              <h2 id="ll-topics">Topics</h2>
              {/* eslint-disable-next-line jsx-a11y-x/no-redundant-roles -- Removed list styles drop list semantics in Safari. */}
              <ul role="list">
                {view.topics.map((topic) => (
                  <li key={topic.href}>
                    <Link href={topic.href}>{topic.name}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {view.related.length > 0 ? (
            <section className="ll-related" aria-labelledby="ll-related">
              <h2 id="ll-related">Related stories</h2>
              {/* eslint-disable-next-line jsx-a11y-x/no-redundant-roles -- Removed list styles drop list semantics in Safari. */}
              <ul className="ll-related-grid" role="list">
                {view.related.slice(0, 3).map((story) => (
                  <li key={story.slug}>
                    <LiteraryStoryCard story={story} related />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <p className="ll-article-exit">
            <Link href="/">All stories</Link>
          </p>
        </div>
      </article>
    </LiteraryShell>
  )
}
