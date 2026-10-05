import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { resolveCanonicalSiteUrl } from '@/lib/site-url'
import { loadArticleView } from '@/reader/cache'
import { normalizeReaderSlug } from '@/reader/slug'
import { resolveReaderPresentation } from '@/reader-lab/presentation'
import { ReaderPage } from '@/reader-lab/reader-page'

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
  const presentation = await resolveReaderPresentation()
  const { Article } = presentation.direction

  return (
    <ReaderPage cacheGeneration={article.cacheGeneration} presentation={presentation}>
      <Article view={article.view} />
    </ReaderPage>
  )
}
