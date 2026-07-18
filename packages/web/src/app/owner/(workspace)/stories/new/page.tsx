import { StoryEditor } from '@/components/owner/story-editor'
import { getOwnerRuntime } from '@/server/owner/runtime'
import { resolveOwnerTimeZone } from '@/server/owner/config'
import { requireOwnerPageSession } from '@/server/owner/session'

export const dynamic = 'force-dynamic'

export default async function NewOwnerStoryPage() {
  await requireOwnerPageSession()
  const runtime = getOwnerRuntime()
  const [media, settings] = await Promise.all([
    runtime.workspace.listMedia(),
    runtime.workspace.publicationSettings(),
  ])
  return (
    <div className="mx-auto max-w-[100rem]">
      <h1 className="mb-6 text-4xl font-semibold">New story</h1>
      <StoryEditor
        initialMedia={media}
        initialWorkspace={null}
        timeZone={settings?.ownerTimeZone ?? resolveOwnerTimeZone()}
      />
    </div>
  )
}
