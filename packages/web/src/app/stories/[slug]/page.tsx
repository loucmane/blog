import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { listPublishedFrameworkStories } from '@/lib/framework-content'
import { resolveSiteUrl } from '@/lib/site-url'
import { loadPublishedFrameworkStory } from '@/lib/story-cache'

interface StoryPageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 3_600
export const dynamicParams = false

export function generateStaticParams() {
  return listPublishedFrameworkStories().map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const story = await loadPublishedFrameworkStory(slug)
  if (!story) {
    return {}
  }

  const canonicalPath = `/stories/${story.slug}`
  return {
    alternates: {
      canonical: canonicalPath,
    },
    authors: [{ name: story.author }],
    description: story.dek,
    openGraph: {
      description: story.dek,
      publishedTime: story.publishedAt ?? undefined,
      title: story.title,
      type: 'article',
      url: new URL(canonicalPath, resolveSiteUrl()),
    },
    title: story.title,
  }
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params
  const story = await loadPublishedFrameworkStory(slug)
  if (!story || !story.publishedAt) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="container mx-auto max-w-4xl px-4 py-12">
        <Link className="text-sm font-semibold text-primary hover:underline" href="/">
          ← Magazine home
        </Link>
        <header className="py-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
            {story.section}
          </p>
          <h1 className="mb-5 text-4xl font-bold text-primary md:text-6xl">{story.title}</h1>
          <p className="mb-5 text-xl text-muted-foreground">{story.dek}</p>
          <p className="text-sm text-muted-foreground">
            By {story.author} ·{' '}
            <time dateTime={story.publishedAt}>
              {new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' }).format(
                new Date(story.publishedAt),
              )}
            </time>{' '}
            · {story.readingMinutes} min read
          </p>
        </header>

        <Image
          alt={story.cover.alt}
          className="h-auto w-full rounded-lg border border-border bg-muted"
          height={story.cover.height}
          priority
          sizes="(min-width: 896px) 864px, 100vw"
          src={story.cover.src}
          width={story.cover.width}
        />

        <div className="mx-auto max-w-2xl space-y-6 py-10 text-lg leading-8">
          {story.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </main>
  )
}
