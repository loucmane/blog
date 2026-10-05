import { ContentNotFoundError } from '@/server/content/errors'
import { ownerErrorResponse } from '@/server/owner/api'
import { getOwnerRuntime } from '@/server/owner/runtime'
import { requireOwnerSession } from '@/server/owner/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface RouteContext {
  readonly params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  try {
    await requireOwnerSession(request.headers)
    const { id } = await context.params
    const runtime = getOwnerRuntime()
    const asset = await runtime.repository.transaction((transaction) =>
      transaction.getMediaAsset(id),
    )
    if (!asset || !runtime.objects) throw new ContentNotFoundError('Media', id)
    const body = await runtime.objects.getOriginal(asset.originalKey)
    return new Response(Uint8Array.from(body).buffer, {
      headers: {
        'cache-control': 'private, no-store',
        'content-type': asset.contentType,
        'x-content-type-options': 'nosniff',
      },
    })
  } catch (error) {
    return ownerErrorResponse(error)
  }
}
