import type { Metadata } from 'next'
import Image from 'next/image'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { getFrameworkStory } from '@/lib/framework-content'

interface PreviewStoryPageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: 'Private story preview',
}

export default async function PreviewStoryPage({ params }: PreviewStoryPageProps) {
  const preview = await draftMode()
  const { slug } = await params
  const story = preview.isEnabled ? getFrameworkStory(slug) : null
  if (!story) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 rounded-lg border border-secondary bg-muted p-4" role="status">
          <p className="font-semibold">Private preview</p>
          <p className="text-sm text-muted-foreground">
            This page is not public and search engines are instructed not to index it.
          </p>
          <form action="/api/preview/disable" className="mt-3" method="post">
            <input name="slug" type="hidden" value={story.slug} />
            <button className="font-semibold text-primary underline" type="submit">
              Exit preview
            </button>
          </form>
        </div>

        <header className="pb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
            {story.status} · {story.section}
          </p>
          <h1 className="mb-5 text-4xl font-bold text-primary md:text-6xl">{story.title}</h1>
          <p className="text-xl text-muted-foreground">{story.dek}</p>
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
