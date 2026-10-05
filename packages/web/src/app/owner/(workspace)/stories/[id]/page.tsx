import { notFound } from 'next/navigation'

import { StoryEditor } from '@/components/owner/story-editor'
import { ContentNotFoundError } from '@/server/content/errors'
import { resolveOwnerTimeZone } from '@/server/owner/config'
import { getOwnerRuntime } from '@/server/owner/runtime'
import { requireOwnerPageSession } from '@/server/owner/session'

export const dynamic = 'force-dynamic'

async function loadStory(id: string) {
  const runtime = getOwnerRuntime()
  try {
    return await Promise.all([
      runtime.workspace.loadStory(id),
      runtime.workspace.listMedia(),
      runtime.workspace.publicationSettings(),
    ])
  } catch (error) {
    if (error instanceof ContentNotFoundError) notFound()
    throw error
  }
}

export default async function OwnerStoryPage({
  params,
}: {
  readonly params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireOwnerPageSession()
  const [workspace, media, settings] = await loadStory(id)
  return (
    <div className="mx-auto max-w-[100rem]">
      <h1 className="sr-only">Edit {workspace.article.title}</h1>
      <StoryEditor
        initialMedia={media}
        initialWorkspace={workspace}
        timeZone={settings?.ownerTimeZone ?? resolveOwnerTimeZone()}
      />
    </div>
  )
}
