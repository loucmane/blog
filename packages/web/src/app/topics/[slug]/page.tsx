import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { resolveCanonicalSiteUrl } from '@/lib/site-url'
import { loadTopicView } from '@/reader/cache'
import { normalizeAuthorOrTopicSlug } from '@/reader/paths'
import { resolveReaderPresentation } from '@/reader-lab/presentation'
import { ReaderPage } from '@/reader-lab/reader-page'

interface TopicPageProps {
  params: Promise<{ slug: string }>
}

async function loadTopic(params: TopicPageProps['params']) {
  await connection()
  const slug = normalizeAuthorOrTopicSlug((await params).slug)
  if (!slug) return null
  const result = await loadTopicView(slug)
  return result.status === 'ready' && result.view ? { ...result, view: result.view } : null
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const loaded = await loadTopic(params)
  if (!loaded) return {}
  const topic = loaded.view
  const description = topic.description ?? `Stories about ${topic.name}.`
  return {
    alternates: {
      canonical: topic.href,
    },
    description,
    openGraph: {
      description,
      title: topic.name,
      type: 'website',
      url: new URL(topic.href, resolveCanonicalSiteUrl()),
    },
    title: topic.name,
  }
}

export default async function TopicPage({ params }: TopicPageProps) {
  const topic = await loadTopic(params)
  if (!topic) notFound()
  const presentation = await resolveReaderPresentation()
  const { Topic } = presentation.direction

  return (
    <ReaderPage cacheGeneration={topic.cacheGeneration} presentation={presentation}>
      <Topic view={topic.view} />
    </ReaderPage>
  )
}
