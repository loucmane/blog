import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { resolveCanonicalSiteUrl } from '@/lib/site-url'
import { loadSectionView } from '@/reader/cache'
import { normalizeReaderSlug } from '@/reader/slug'
import { resolveReaderPresentation } from '@/reader-lab/presentation'
import { ReaderPage } from '@/reader-lab/reader-page'

interface SectionPageProps {
  params: Promise<{ slug: string }>
}

async function loadSection(params: SectionPageProps['params']) {
  await connection()
  const slug = normalizeReaderSlug((await params).slug)
  if (!slug) return null
  const result = await loadSectionView(slug)
  return result.status === 'ready' && result.view ? { ...result, view: result.view } : null
}

export async function generateMetadata({ params }: SectionPageProps): Promise<Metadata> {
  const loaded = await loadSection(params)
  if (!loaded) return {}
  const section = loaded.view
  const description = section.description ?? `Stories filed under ${section.name}.`
  return {
    alternates: {
      canonical: section.href,
    },
    description,
    openGraph: {
      description,
      title: section.name,
      type: 'website',
      url: new URL(section.href, resolveCanonicalSiteUrl()),
    },
    title: section.name,
  }
}

export default async function SectionPage({ params }: SectionPageProps) {
  const section = await loadSection(params)
  if (!section) notFound()
  const presentation = await resolveReaderPresentation()
  const { Section } = presentation.direction

  return (
    <ReaderPage cacheGeneration={section.cacheGeneration} presentation={presentation}>
      <Section view={section.view} />
    </ReaderPage>
  )
}
