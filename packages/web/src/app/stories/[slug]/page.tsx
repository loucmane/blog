import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { loadArticleView } from '@/reader/cache'
import { normalizeReaderSlug } from '@/reader/slug'
import { resolveReaderPresentation } from '@/reader-lab/presentation'
import { ReaderPage } from '@/reader-lab/reader-page'
import { canonicalArticleUrl } from '@/server/distribution/canonical'
import { serializeJsonLd, storyStructuredData } from '@/server/distribution/structured-data'

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
    // The canonical path (canonical.ts, through the view); Next makes it absolute on metadataBase,
    // the same configured canonical origin canonicalArticleUrl uses.
    alternates: {
      canonical: view.href,
    },
    authors: view.authorLinks.map(({ href, name }) => ({ name, url: href })),
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
      url: canonicalArticleUrl(view.slug),
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
    <>
      <ReaderPage cacheGeneration={article.cacheGeneration} presentation={presentation}>
        <Article view={article.view} />
      </ReaderPage>
      {/* schema.org data for this published story, after the direction root so no reader style
          can match it. Previews and owner pages never render this route. */}
      <script type="application/ld+json">
        {serializeJsonLd(storyStructuredData(article.view))}
      </script>
    </>
  )
}
