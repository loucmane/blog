import { NextResponse } from 'next/server'

import { loadPublicMediaIds } from '@/reader/cache'
import { ifNoneMatchIncludes, mediaEntityTag, publicMediaCacheControl } from '@/reader/media'
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
 * images in drafts, unpublished stories, and deleted stories stay private. The check uses the
 * media set of the current publication version, read fresh for each request, and caches must
 * revalidate every use, so an unpublished image is gone on the next request. A conditional request
 * gets its 304 only after the same visibility check as a full response.
 */
export async function GET(request: Request, context: RouteContext): Promise<Response> {
  const { id } = await context.params
  if (!mediaIdPattern.test(id)) return notFoundResponse()
  const publicMedia = await loadPublicMediaIds()
  if (publicMedia.status !== 'ready' || !publicMedia.view.includes(id)) return notFoundResponse()
  const store = resolveReaderStore()
  if (!store?.objects) return notFoundResponse()
  const asset = await store.repository.transaction((transaction) => transaction.getMediaAsset(id))
  if (!asset) return notFoundResponse()
  const entityTag = mediaEntityTag(asset)
  const headers = {
    'cache-control': publicMediaCacheControl,
    ...(entityTag ? { etag: entityTag } : {}),
    'x-content-type-options': 'nosniff',
  }
  if (entityTag && ifNoneMatchIncludes(request.headers.get('if-none-match'), entityTag)) {
    return new Response(null, { headers, status: 304 })
  }
  const { objects } = store
  const body = await objects.getOriginal(asset.originalKey).catch(() => null)
  if (!body) return notFoundResponse()
  return new Response(Uint8Array.from(body).buffer, {
    headers: { ...headers, 'content-type': asset.contentType },
  })
}
