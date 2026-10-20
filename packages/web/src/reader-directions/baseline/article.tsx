import Link from 'next/link'
import { Fragment } from 'react'

import { ArticleBody } from '@/reader/components/article-body'
import { ReaderFigure } from '@/reader/components/reader-image'
import { SiteHeader } from '@/reader/components/site-header'
import { StoryCardView } from '@/reader/components/story-card'
import { formatPublishedDate, formatReadingTime } from '@/reader/format'
import type { AuthorLink } from '@/reader/views'

import type { ArticleDirectionProps } from '../contract'

const relatedImageSizes = '(min-width: 928px) 26rem, (min-width: 640px) 45vw, 100vw'
const linkClassName = 'underline-offset-4 hover:underline'

function Byline({ authors }: { readonly authors: readonly AuthorLink[] }) {
  return (
    <>
      By{' '}
      {authors.map((author, index) => (
        <Fragment key={author.href}>
          {index > 0 ? ', ' : null}
          <Link className={linkClassName} href={author.href}>
            {author.name}
          </Link>
        </Fragment>
      ))}{' '}
      ·{' '}
    </>
  )
}

export function BaselineArticle({ imageSizes, view }: ArticleDirectionProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader navigation={view.navigation} />
      <main className="container mx-auto px-4 py-10">
        <article className="mx-auto max-w-4xl">
          <header className="mb-10 flex max-w-3xl flex-col gap-4">
            {view.section ? (
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
                <Link className={linkClassName} href={view.section.href}>
                  {view.section.name}
                </Link>
              </p>
            ) : null}
            <h1 className="text-4xl font-semibold break-words md:text-6xl">{view.title}</h1>
            {view.dek ? <p className="text-xl text-muted-foreground">{view.dek}</p> : null}
            <p className="text-sm text-muted-foreground">
              {view.authorLinks.length > 0 ? <Byline authors={view.authorLinks} /> : null}
              <time dateTime={view.publishedAt}>
                {formatPublishedDate(view.publishedAt)}
              </time> · {formatReadingTime(view.readingMinutes)}
            </p>
          </header>

          {view.hero ? (
            <div className="mb-10">
              <ReaderFigure
                captionClassName="mt-3 text-sm text-muted-foreground"
                className="rounded-lg"
                image={view.hero}
                preload
                sizes="(min-width: 896px) 56rem, 100vw"
              />
            </div>
          ) : null}

          <div className="prose prose-lg max-w-2xl dark:prose-invert prose-figcaption:text-muted-foreground prose-pre:break-words prose-pre:whitespace-pre-wrap">
            <ArticleBody blocks={view.body} imageSizes={imageSizes} />
          </div>

          {view.topics.length > 0 ? (
            <footer className="mt-12 max-w-2xl border-t border-border pt-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Topics
              </h2>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
                {view.topics.map((topic) => (
                  <li key={topic.href}>
                    <Link className={linkClassName} href={topic.href}>
                      {topic.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </footer>
          ) : null}
        </article>

        {view.related.length > 0 ? (
          <section aria-labelledby="related-stories" className="mx-auto mt-16 max-w-4xl">
            <h2 className="mb-8 text-2xl font-semibold" id="related-stories">
              Related stories
            </h2>
            <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2">
              {view.related.map((card) => (
                <li key={card.slug}>
                  <StoryCardView card={card} headingLevel={3} imageSizes={relatedImageSizes} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  )
}
