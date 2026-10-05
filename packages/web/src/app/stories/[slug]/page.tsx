import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { resolveCanonicalSiteUrl } from '@/lib/site-url'
import { loadArticleView } from '@/reader/cache'
import { ArticleBody } from '@/reader/components/article-body'
import { ReaderFigure } from '@/reader/components/reader-image'
import { SiteHeader } from '@/reader/components/site-header'
import { formatPublishedDate, formatReadingTime } from '@/reader/format'
import { normalizeReaderSlug } from '@/reader/slug'

interface StoryPageProps {
  params: Promise<{ slug: string }>
}

async function loadPublishedArticle(params: StoryPageProps['params']) {
  await connection()
  const slug = normalizeReaderSlug((await params).slug)
  if (!slug) return null
  const result = await loadArticleView(slug)
  return result.status === 'ready' && result.view ? { ...result, view: result.view } : null
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const article = await loadPublishedArticle(params)
  if (!article) return {}
  const { view } = article
  return {
    alternates: {
      canonical: view.href,
    },
    authors: view.authors.map((name) => ({ name })),
    description: view.dek,
    openGraph: {
      description: view.dek,
      ...(view.hero
        ? {
            images: [
              {
                alt: view.hero.alt,
                url: view.hero.src,
                ...(view.hero.width !== null && view.hero.height !== null
                  ? { height: view.hero.height, width: view.hero.width }
                  : {}),
              },
            ],
          }
        : {}),
      publishedTime: view.publishedAt,
      title: view.title,
      type: 'article',
      url: new URL(view.href, resolveCanonicalSiteUrl()),
    },
    title: view.title,
  }
}

export default async function StoryPage({ params }: StoryPageProps) {
  const article = await loadPublishedArticle(params)
  if (!article) notFound()
  const { cacheGeneration, view } = article

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader navigation={view.navigation} />
      <main className="container mx-auto px-4 py-10">
        <article className="mx-auto max-w-4xl" data-reader-cache-generation={cacheGeneration}>
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
