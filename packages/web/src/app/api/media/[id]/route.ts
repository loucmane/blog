import { NextResponse } from 'next/server'

import { loadPublicMediaIds } from '@/reader/cache'
import {
  ifNoneMatchIncludes,
  mediaEntityTag,
  mediaVariantEntityTag,
  publicMediaCacheControl,
} from '@/reader/media'
import { parseMediaRequest } from '@/reader/media-variants'
import { publicMediaPath } from '@/reader/paths'
import { resolveReaderStore } from '@/reader/store'
import type { MediaAsset } from '@/server/content/domain'
import {
  mediaVariantContentType,
  mediaVariantFormatsFor,
  mediaVariantsRuledOut,
  type MediaVariant,
} from '@/server/content/media-variant-rules'
import {
  isMediaVariantUnavailable,
  type MediaVariantService,
} from '@/server/content/media-variants'
import type { OriginalObjectStore } from '@/server/content/ports'

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

function badRequestResponse() {
  return NextResponse.json(
    { error: 'Choose an allowed image width and format.' },
    { headers: { 'cache-control': 'no-store' }, status: 400 },
  )
}

/**
 * A visible image that could not be served, for example because storage failed. It is logged and
 * answered as a server error, never as a not-found, which would look like a revoked image.
 */
function serverErrorResponse(mediaId: string, error: unknown) {
  console.error(`Public media ${mediaId} could not be served.`, error)
  return NextResponse.json(
    { error: 'That image could not be loaded.' },
    { headers: { 'cache-control': 'no-store' }, status: 500 },
  )
}

/**
 * Sends a reader from a variant to the original, for a visible image that has no variants. The
 * original route checks visibility again, and nothing is cached.
 */
function originalRedirectResponse(mediaId: string) {
  return new Response(null, {
    headers: { 'cache-control': 'no-store', location: publicMediaPath(mediaId) },
    status: 307,
  })
}

/** Headers for a served image: any cache may keep it, but must revalidate it before each use. */
function revalidatedHeaders(entityTag: string | null) {
  return {
    'cache-control': publicMediaCacheControl,
    ...(entityTag ? { etag: entityTag } : {}),
    'x-content-type-options': 'nosniff',
  }
}

function isNotModified(request: Request, entityTag: string | null): boolean {
  return entityTag !== null && ifNoneMatchIncludes(request.headers.get('if-none-match'), entityTag)
}

async function serveOriginal(
  request: Request,
  objects: OriginalObjectStore,
  asset: MediaAsset,
): Promise<Response> {
  const entityTag = mediaEntityTag(asset)
  const headers = revalidatedHeaders(entityTag)
  if (isNotModified(request, entityTag)) return new Response(null, { headers, status: 304 })
  let body: Uint8Array
  try {
    body = await objects.getOriginal(asset.originalKey)
  } catch (error) {
    return serverErrorResponse(asset.id, error)
  }
  return new Response(Uint8Array.from(body).buffer, {
    headers: { ...headers, 'content-type': asset.contentType },
  })
}

async function serveVariant(
  request: Request,
  variants: MediaVariantService,
  asset: MediaAsset,
  variant: MediaVariant,
): Promise<Response> {
  if (!mediaVariantFormatsFor(asset.contentType).includes(variant.format)) {
    return badRequestResponse()
  }
  // What was measured when the original was stored can rule variants out without reading it: an
  // animated original would keep only its first frame.
  if (mediaVariantsRuledOut(asset)) return originalRedirectResponse(asset.id)
  const entityTag = mediaVariantEntityTag(asset, variant)
  const headers = revalidatedHeaders(entityTag)
  if (isNotModified(request, entityTag)) return new Response(null, { headers, status: 304 })
  let body: Uint8Array
  try {
    body = await variants.load(asset, variant)
  } catch (error) {
    if (!isMediaVariantUnavailable(error)) return serverErrorResponse(asset.id, error)
    // An original that cannot be resized safely is still public: send the reader to it, as
    // before variants existed.
    return originalRedirectResponse(asset.id)
  }
  return new Response(Uint8Array.from(body).buffer, {
    headers: { ...headers, 'content-type': mediaVariantContentType(variant.format) },
  })
}

/**
 * Serves a media original, or a resized variant of it (`?w=<width>&fm=<format>`), to readers only
 * while a publicly visible revision references it, so images in drafts, unpublished stories, and
 * deleted stories stay private. The check uses the media set of the current publication version,
 * read fresh for each request, and runs before anything else about the request is considered.
 * Caches must revalidate every use, so an unpublished image is gone on the next request, even when
 * variants of it are stored. A conditional request gets its 304 only after the same visibility
 * check as a full response. A visible image that has no variants, such as an animated one, or that
 * cannot be resized is redirected to its original, and one whose bytes cannot be read is a logged
 * server error, never a not-found.
 */
export async function GET(request: Request, context: RouteContext): Promise<Response> {
  const { id } = await context.params
  if (!mediaIdPattern.test(id)) return notFoundResponse()
  const publicMedia = await loadPublicMediaIds()
  if (publicMedia.status !== 'ready' || !publicMedia.view.includes(id)) return notFoundResponse()
  const store = resolveReaderStore()
  if (!store?.objects || !store.variants) return notFoundResponse()
  const asset = await store.repository.transaction((transaction) => transaction.getMediaAsset(id))
  if (!asset) return notFoundResponse()
  const query = parseMediaRequest(new URL(request.url).searchParams)
  if (query.kind === 'invalid') return badRequestResponse()
  return query.kind === 'original'
    ? serveOriginal(request, store.objects, asset)
    : serveVariant(request, store.variants, asset, query.variant)
}
