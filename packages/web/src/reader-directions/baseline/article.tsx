import Link from 'next/link'

import { ArticleBody } from '@/reader/components/article-body'
import { ReaderFigure } from '@/reader/components/reader-image'
import { SiteHeader } from '@/reader/components/site-header'
import { formatPublishedDate, formatReadingTime } from '@/reader/format'

import type { ArticleDirectionProps } from '../contract'

export function BaselineArticle({ view }: ArticleDirectionProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader navigation={view.navigation} />
      <main className="container mx-auto px-4 py-10">
        <article className="mx-auto max-w-4xl">
          <header className="mb-10 flex max-w-3xl flex-col gap-4">
            {view.section ? (
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
                <Link className="underline-offset-4 hover:underline" href={view.section.href}>
                  {view.section.name}
                </Link>
              </p>
            ) : null}
            <h1 className="text-4xl font-semibold break-words md:text-6xl">{view.title}</h1>
            {view.dek ? <p className="text-xl text-muted-foreground">{view.dek}</p> : null}
            <p className="text-sm text-muted-foreground">
              {view.authors.length > 0 ? <>By {view.authors.join(', ')} · </> : null}
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
            <ArticleBody blocks={view.body} />
          </div>
        </article>
      </main>
    </div>
  )
}
