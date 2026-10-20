import Link from 'next/link'
import { Fragment } from 'react'

import { ArticleBody } from '@/reader/components/article-body'
import { ReaderFigure } from '@/reader/components/reader-image'
import { formatPublishedDate, formatReadingTime } from '@/reader/format'

import type { ArticleDirectionProps } from '../contract'
import { storyColour } from './colours'
import { StoryMotif } from './motif'
import { ExpressiveShell } from './shell'
import { bodyImageSizes, coverSizes, heroSizes } from './sizes'
import { ExpressiveStoryList } from './story-list'

export function ExpressiveArticle({ view, imageSizes = bodyImageSizes }: ArticleDirectionProps) {
  const { hero } = view
  const cover = hero?.width && hero.height ? hero.width / hero.height < 1.2 : false
  const sizes = cover ? coverSizes : heroSizes
  const authors = view.authorLinks.length
    ? view.authorLinks
    : view.authors.map((name) => ({ name, href: null }))
  const figure = hero ? (
    <div
      className={`ec-hero ec-hero-${cover ? 'cover' : 'landscape'}`}
      style={{ objectPosition: `${hero.focalPoint.x * 100}% ${hero.focalPoint.y * 100}%` }}
    >
      <ReaderFigure image={hero} sizes={sizes} preload />
    </div>
  ) : null
  return (
    <ExpressiveShell
      navigation={view.navigation}
      currentSection={view.section?.slug}
      sectionContext
      leadImage={hero ? { image: hero, sizes } : null}
    >
      <article className="ec-article" data-story-colour={storyColour(view.slug).name}>
        <header className={`ec-article-band${cover || !hero ? ' ec-cover-layout' : ''}`}>
          <div className="ec-article-copy">
            <div className="ec-article-meta">
              {view.section ? (
                <Link className="ec-pill" href={view.section.href} aria-current="true">
                  {view.section.name}
                </Link>
              ) : (
                <span>Story</span>
              )}
              <span>{formatReadingTime(view.readingMinutes)}</span>
            </div>
            <h1 className={view.title.length > 80 ? 'ec-title-long' : undefined}>{view.title}</h1>
            {view.dek ? <p className="ec-dek">{view.dek}</p> : null}
            <p className="ec-credits">
              {authors.length ? (
                <>
                  By{' '}
                  {authors.map((author, index) => (
                    <Fragment key={author.href ?? author.name}>
                      {index > 0 ? (index === authors.length - 1 ? ' and ' : ', ') : null}
                      {author.href ? <Link href={author.href}>{author.name}</Link> : author.name}
                    </Fragment>
                  ))}
                  {' · '}
                </>
              ) : null}
              <time dateTime={view.publishedAt}>{formatPublishedDate(view.publishedAt)}</time>
            </p>
          </div>
          {cover ? figure : null}
          {!hero ? (
            <div className="ec-cover-motif" aria-hidden="true">
              <StoryMotif slug={view.slug} />
            </div>
          ) : null}
        </header>
        {!cover ? figure : null}
        <div className="ec-body">
          <ArticleBody blocks={view.body} imageSizes={imageSizes} />
        </div>
        <div className="ec-article-end">
          <span className="ec-end-mark" aria-hidden="true" />
          {view.topics.length ? (
            <nav className="ec-topics" aria-label="Topics">
              <p className="ec-label">Filed under</p>
              <ul>
                {view.topics.map((topic) => (
                  <li key={topic.href}>
                    <Link className="ec-pill" href={topic.href}>
                      {view.navigation.sections.some((section) => section.name === topic.name) ? (
                        <>
                          <span className="sr-only">Topic:</span>{' '}
                        </>
                      ) : null}
                      {topic.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </article>
      {view.related.length ? (
        <section className="ec-related" aria-labelledby="ec-read-next">
          <h2 id="ec-read-next">Read next</h2>
          <ExpressiveStoryList stories={view.related} label="Read next stories" layout="related" />
        </section>
      ) : null}
    </ExpressiveShell>
  )
}
