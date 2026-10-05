import { NextResponse } from 'next/server'

import { loadPublicMediaIds } from '@/reader/cache'
import { resolveReaderStore } from '@/reader/store'

export const runtime = 'nodejs'

const mediaIdPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,199}$/

interface RouteContext {
  readonly params: Promise<{ id: string }>
}

function notFoundResponse() {
  return NextResponse.json(
    { error: 'That image could not be found.' },
    { headers: { 'cache-control': 'no-store' }, status: 404 },
  )
}

/**
 * Serves a media original to readers only while a publicly visible revision references it, so
 * images in drafts, unpublished stories, and deleted stories stay private.
 */
export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { id } = await context.params
  if (!mediaIdPattern.test(id)) return notFoundResponse()
  const publicMedia = await loadPublicMediaIds()
  if (publicMedia.status !== 'ready' || !publicMedia.view.includes(id)) return notFoundResponse()
  const store = resolveReaderStore()
  if (!store?.objects) return notFoundResponse()
  const asset = await store.repository.transaction((transaction) => transaction.getMediaAsset(id))
  if (!asset) return notFoundResponse()
  const { objects } = store
  const body = await objects.getOriginal(asset.originalKey).catch(() => null)
  if (!body) return notFoundResponse()
  return new Response(Uint8Array.from(body).buffer, {
    headers: {
      'cache-control': 'public, max-age=300',
      'content-type': asset.contentType,
      'x-content-type-options': 'nosniff',
    },
  })
}
