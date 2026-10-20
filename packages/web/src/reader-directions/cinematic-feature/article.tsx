import Link from 'next/link'
import { Fragment } from 'react'

import { ArticleBody } from '@/reader/components/article-body'
import { ReaderFigure } from '@/reader/components/reader-image'
import { formatPublishedDate } from '@/reader/format'

import type { ArticleDirectionProps } from '../contract'
import { CinematicShell } from './shell'
import { CinematicStoryCard, relatedSizes, StoryMeta } from './story-card'

function authorSeparator(index: number, count: number) {
  return index === 0 ? '' : index === count - 1 ? ' and ' : ', '
}

export function CinematicArticle({ view, imageSizes }: ArticleDirectionProps) {
  const seen = new Set([view.href])
  const related = view.related
    .filter(({ href }) => {
      if (seen.has(href)) return false
      seen.add(href)
      return true
    })
    .slice(0, 3)
  return (
    <CinematicShell
      cover
      navigation={view.navigation}
      leadImage={
        view.hero ? { image: view.hero, sizes: '100vw', media: '(min-width: 1024px)' } : null
      }
    >
      <article>
        <div className={`cf-article-hero${view.hero ? '' : ' cf-hero-text'}`}>
          <header className="cf-article-heading">
            <div className="cf-article-panel">
              <StoryMeta story={view} />
              <h1 className="cf-title">{view.title}</h1>
              {view.dek ? <p className="cf-dek">{view.dek}</p> : null}
              <div className="cf-credits">
                {view.authorLinks.length ? (
                  <p className="cf-byline">
                    <span>Words by </span>
                    {view.authorLinks.map((author, index) => (
                      <Fragment key={author.href}>
                        {authorSeparator(index, view.authorLinks.length)}
                        <Link href={author.href}>{author.name}</Link>
                      </Fragment>
                    ))}
                  </p>
                ) : view.authors.length ? (
                  <p>
                    Words by{' '}
                    {view.authors
                      .map((author, index) => authorSeparator(index, view.authors.length) + author)
                      .join('')}
                  </p>
                ) : null}
                <time dateTime={view.publishedAt}>{formatPublishedDate(view.publishedAt)}</time>
              </div>
            </div>
          </header>
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
        </div>
        <div className="cf-reading-surface">
          <div className="cf-body">
            <ArticleBody blocks={view.body} imageSizes={imageSizes} />
          </div>
          <div className="cf-article-end">
            {view.topics.length ? (
              <section className="cf-topics" aria-labelledby="cf-topics-title">
                <h2 id="cf-topics-title" className="cf-module-title">
                  Topics
                </h2>
                <ul>
                  {view.topics.map((topic) => (
                    <li key={topic.href}>
                      <Link href={topic.href}>{topic.name}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {related.length ? (
              <section className="cf-related" aria-labelledby="cf-related-title">
                <h2 id="cf-related-title" className="cf-module-title">
                  Related stories
                </h2>
                <ul className="cf-grid cf-related-grid">
                  {related.map((story) => (
                    <CinematicStoryCard
                      key={story.href}
                      story={story}
                      headingLevel={3}
                      sizes={relatedSizes}
                    />
                  ))}
                </ul>
              </section>
            ) : null}
            <div className="cf-article-return">
              <Link className="cf-read" href={view.section?.href ?? '/'}>
                {view.section ? `More in ${view.section.name}` : 'All stories'}
              </Link>
            </div>
          </div>
        </div>
      </article>
    </CinematicShell>
  )
}
