import { assertOwnerMutationRequest, readOwnerJson, withOwner } from '@/server/owner/api'
import { saveOwnerStorySchema } from '@/server/owner/contracts'
import { createOwnerContentDocument } from '@/server/owner/document'
import { getOwnerRuntime } from '@/server/owner/runtime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface RouteContext {
  readonly params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
  return withOwner(request, async () => {
    const { id } = await context.params
    return getOwnerRuntime().workspace.loadStory(id)
  })
}

export async function PATCH(request: Request, context: RouteContext) {
  return withOwner(request, async (owner) => {
    assertOwnerMutationRequest(request)
    const { id } = await context.params
    const input = await readOwnerJson(request, saveOwnerStorySchema)
    return getOwnerRuntime().content.saveDraft({
      actorId: owner.id,
      articleId: id,
      dek: input.dek,
      document: createOwnerContentDocument({
        articleId: id,
        document: input.document,
        title: input.title,
      }),
      expectedVersion: input.expectedVersion,
      idempotencyKey: input.idempotencyKey,
      title: input.title,
    })
  })
}
