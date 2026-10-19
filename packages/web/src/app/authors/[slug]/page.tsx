import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { resolveCanonicalSiteUrl } from '@/lib/site-url'
import { loadAuthorView } from '@/reader/cache'
import { normalizeAuthorOrTopicSlug } from '@/reader/paths'
import { resolveReaderPresentation } from '@/reader-lab/presentation'
import { ReaderPage } from '@/reader-lab/reader-page'

interface AuthorPageProps {
  params: Promise<{ slug: string }>
}

async function loadAuthor(params: AuthorPageProps['params']) {
  await connection()
  const slug = normalizeAuthorOrTopicSlug((await params).slug)
  if (!slug) return null
  const result = await loadAuthorView(slug)
  return result.status === 'ready' && result.view ? { ...result, view: result.view } : null
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const loaded = await loadAuthor(params)
  if (!loaded) return {}
  const author = loaded.view
  const description = author.bio ?? `Stories by ${author.name}.`
  return {
    alternates: {
      canonical: author.href,
    },
    description,
    openGraph: {
      description,
      title: author.name,
      type: 'profile',
      url: new URL(author.href, resolveCanonicalSiteUrl()),
    },
    title: author.name,
  }
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const author = await loadAuthor(params)
  if (!author) notFound()
  const presentation = await resolveReaderPresentation()
  const { Author } = presentation.direction

  return (
    <ReaderPage cacheGeneration={author.cacheGeneration} presentation={presentation}>
      <Author view={author.view} />
    </ReaderPage>
  )
}
