import { InvalidContentTransitionError } from '@/server/content/errors'
import { assertOwnerMutationRequest, readOwnerJson, withOwner } from '@/server/owner/api'
import { ownerStoryActionSchema } from '@/server/owner/contracts'
import { publicationReadiness } from '@/server/owner/document'
import { getOwnerRuntime } from '@/server/owner/runtime'
import { resolveScheduledPublication, validateTimeZone } from '@/server/owner/schedule'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface RouteContext {
  readonly params: Promise<{ id: string }>
}

async function requireReady(articleId: string, revisionId: string) {
  const workspace = await getOwnerRuntime().workspace.loadStory(articleId)
  if (workspace.currentRevision.id !== revisionId) {
    throw new InvalidContentTransitionError(
      'Save and validate the latest draft before changing publication status.',
    )
  }
  const issues = publicationReadiness({
    dek: workspace.article.dek,
    document: workspace.currentRevision.document,
    title: workspace.article.title,
  })
  if (issues.length > 0) {
    throw new InvalidContentTransitionError(issues.map(({ message }) => message).join(' '))
  }
  return workspace
}

export async function POST(request: Request, context: RouteContext) {
  return withOwner(request, async (owner) => {
    assertOwnerMutationRequest(request)
    const { id } = await context.params
    const input = await readOwnerJson(request, ownerStoryActionSchema)
    const runtime = getOwnerRuntime()
    switch (input.action) {
      case 'publish':
        await requireReady(id, input.revisionId)
        return runtime.content.publish({
          actorId: owner.id,
          articleId: id,
          expectedVersion: input.expectedVersion,
          idempotencyKey: input.idempotencyKey,
          revisionId: input.revisionId,
        })
      case 'schedule': {
        await requireReady(id, input.revisionId)
        const timeZone = validateTimeZone(input.timeZone)
        return runtime.content.schedulePublication({
          actorId: owner.id,
          articleId: id,
          expectedVersion: input.expectedVersion,
          idempotencyKey: input.idempotencyKey,
          revisionId: input.revisionId,
          runAt: resolveScheduledPublication({
            localDateTime: input.localDateTime,
            timeZone,
          }),
          timeZone,
        })
      }
      case 'cancel-schedule':
        return runtime.content.cancelScheduledPublication({
          actorId: owner.id,
          articleId: id,
          expectedVersion: input.expectedVersion,
          idempotencyKey: input.idempotencyKey,
        })
      case 'unpublish':
        return runtime.content.unpublish({
          actorId: owner.id,
          articleId: id,
          expectedVersion: input.expectedVersion,
          idempotencyKey: input.idempotencyKey,
          reason: input.reason,
        })
      case 'delete':
        return runtime.content.softDelete({
          actorId: owner.id,
          articleId: id,
          expectedVersion: input.expectedVersion,
          idempotencyKey: input.idempotencyKey,
        })
      case 'restore':
        return runtime.content.restore({
          actorId: owner.id,
          articleId: id,
          expectedVersion: input.expectedVersion,
          idempotencyKey: input.idempotencyKey,
        })
      case 'restore-revision': {
        const workspace = await runtime.workspace.loadStory(id)
        const revision = workspace.revisions.find(
          ({ id: revisionId }) => revisionId === input.revisionId,
        )
        if (!revision)
          throw new InvalidContentTransitionError('That revision is no longer available.')
        return runtime.content.saveDraft({
          actorId: owner.id,
          articleId: id,
          dek: revision.dek ?? workspace.article.dek,
          document: revision.document,
          expectedVersion: input.expectedVersion,
          idempotencyKey: input.idempotencyKey,
          title: revision.title ?? revision.document.title ?? workspace.article.title,
        })
      }
    }
  })
}
