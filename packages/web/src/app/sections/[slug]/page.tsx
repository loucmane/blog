import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { resolveCanonicalSiteUrl } from '@/lib/site-url'
import { loadSectionView } from '@/reader/cache'
import { SiteHeader } from '@/reader/components/site-header'
import { StoryCardView } from '@/reader/components/story-card'
import { normalizeReaderSlug } from '@/reader/slug'

interface SectionPageProps {
  params: Promise<{ slug: string }>
}

const storyImageSizes = '(min-width: 1024px) 30rem, (min-width: 768px) 45vw, 100vw'

async function loadSection(params: SectionPageProps['params']) {
  await connection()
  const slug = normalizeReaderSlug((await params).slug)
  if (!slug) return null
  const result = await loadSectionView(slug)
  return result.status === 'ready' ? result.view : null
}

export async function generateMetadata({ params }: SectionPageProps): Promise<Metadata> {
  const section = await loadSection(params)
  if (!section) return {}
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader navigation={section.navigation} />
      <main className="container mx-auto px-4 py-10">
        <header className="mb-12 flex max-w-3xl flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">Section</p>
          <h1 className="text-4xl font-semibold md:text-6xl">{section.name}</h1>
          {section.description ? (
            <p className="text-xl text-muted-foreground">{section.description}</p>
          ) : null}
        </header>
        {section.stories.length > 0 ? (
          <ul className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {section.stories.map((card) => (
              <li key={card.slug}>
                <StoryCardView card={card} headingLevel={2} imageSizes={storyImageSizes} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-lg text-muted-foreground">
            No stories have been published in this section yet.
          </p>
        )}
      </main>
    </div>
  )
}
