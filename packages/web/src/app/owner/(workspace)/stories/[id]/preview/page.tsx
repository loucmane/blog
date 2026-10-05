import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ContentRenderer } from '@/components/owner/content-renderer'
import { ContentNotFoundError } from '@/server/content/errors'
import { getOwnerRuntime } from '@/server/owner/runtime'
import { requireOwnerPageSession } from '@/server/owner/session'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { follow: false, index: false, nocache: true },
  title: 'Private story preview',
}

async function loadStory(id: string) {
  try {
    return await getOwnerRuntime().workspace.loadStory(id)
  } catch (error) {
    if (error instanceof ContentNotFoundError) notFound()
    throw error
  }
}

export default async function OwnerStoryPreviewPage({
  params,
}: {
  readonly params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireOwnerPageSession()
  const workspace = await loadStory(id)
  if (workspace.article.deletedAt) notFound()
  return (
    <article className="mx-auto max-w-3xl rounded-xl border border-border bg-card p-6 shadow-sm md:p-10">
      <p className="mb-4 rounded-md bg-accent p-3 text-sm font-semibold" role="status">
        Private preview · only signed-in owners can see this page
      </p>
      <h1 className="text-5xl font-semibold">{workspace.article.title}</h1>
      <p className="my-5 text-xl text-muted-foreground">{workspace.article.dek}</p>
      <ContentRenderer document={workspace.currentRevision.document.document} />
    </article>
  )
}
