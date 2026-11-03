import { NextResponse, type NextRequest } from 'next/server'

import { siteName } from '@/reader/components/failure-view'
import { normalizeReaderSlug } from '@/reader/slug'
import { resolveReaderStore } from '@/reader/store'
import type { ContentRepository } from '@/server/content/ports'
import {
  PostgresSlugHistory,
  type SlugHistoryClient,
} from '@/server/database/postgres-slug-resolution'
import { getOwnerRuntime } from '@/server/owner/runtime'

import { storyPath } from './canonical'
import { RepositorySlugHistory } from './repository-slug-history'
import { SlugResolutionCache, type SlugResolutionStore } from './slug-resolution-cache'
import { readVisibleSlugs, type SlugResolution } from './slug-resolution'

/*
 * Delivery of slug resolution (blog-0045.3). `src/proxy.ts` hands every `/stories/<slug>` request
 * here before the page renders. Next 16 runs Proxy on the Node.js runtime, in the server process,
 * so resolution reads PostgreSQL through the owner runtime's existing pool. Only a redirect or a
 * gone story is answered here; a current or unknown slug goes on to the story page, which renders
 * the story or its not-found page as before, so removing the proxy restores that behavior exactly.
 */

/** The story slug a request path names, or null when the path is not exactly one story's path. */
export function requestedStorySlug(pathname: string): string | null {
  const segment = /^\/stories\/([^/]+)$/.exec(pathname)?.[1]
  if (segment === undefined) return null
  try {
    return normalizeReaderSlug(decodeURIComponent(segment))
  } catch {
    return null
  }
}

/**
 * A content store as slug resolution reads it: the slug history through the PostgreSQL pool when
 * the runtime has one, else through the repository, which is the in-memory store's case.
 */
export function slugResolutionStore(
  repository: ContentRepository,
  pool: SlugHistoryClient | null,
): SlugResolutionStore {
  return {
    history: pool ? new PostgresSlugHistory(pool) : new RepositorySlugHistory(repository),
    readPublicationVersion: () => repository.readPublicationVersion(),
    readVisibleSlugs: () => readVisibleSlugs(repository),
  }
}

/**
 * One cache per content store. The runtime keeps one store per process, but a new in-memory store
 * starts again at publication version 0, so it must never meet another store's answers.
 */
const caches = new WeakMap<ContentRepository, SlugResolutionCache>()

/** Resolves a story slug against the runtime's content store; null when no store is configured. */
export async function resolveStoryRequest(slug: string): Promise<SlugResolution | null> {
  const reader = resolveReaderStore()
  if (!reader) return null
  const { repository } = reader
  let cache = caches.get(repository)
  if (!cache) {
    cache = new SlugResolutionCache()
    caches.set(repository, cache)
  }
  return cache.resolve(slug, slugResolutionStore(repository, getOwnerRuntime().pool))
}

/**
 * The 410 page. Proxy cannot render the reader's React views, so this is a small static document in
 * the same words as the reader's failure pages, under the site's security headers.
 */
const goneDocument = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Story removed | ${siteName}</title>
<style>body{margin:0;font-family:system-ui,sans-serif;line-height:1.5}main{max-width:36rem;margin:0 auto;padding:4rem 1.5rem}</style>
</head>
<body>
<main>
<h1>Story removed</h1>
<p>This story is no longer available.</p>
<p><a href="/">Go to the front page</a></p>
</main>
</body>
</html>
`

/**
 * One permanent redirect to the story's slug now. The location is a path, so the reader stays on
 * the origin they asked, as a preview or local origin must: `request.nextUrl` names the server's
 * own host (127.0.0.1 even becomes localhost), which a reader behind a reverse proxy cannot reach.
 * The query string is kept. Nothing may store the redirect: a slug a story left can later become
 * another story's slug.
 */
function redirectResponse(request: NextRequest, slug: string): NextResponse {
  return new NextResponse(null, {
    headers: {
      'cache-control': 'no-store',
      location: `${storyPath(slug)}${request.nextUrl.search}`,
    },
    status: 308,
  })
}

function goneResponse(): NextResponse {
  return new NextResponse(goneDocument, {
    headers: { 'cache-control': 'no-store', 'content-type': 'text/html; charset=utf-8' },
    status: 410,
  })
}

/**
 * Answers a story request with a 308 to the story's slug now, or a 410 for a story readers can no
 * longer see; anything else goes on to the page. Only reads are answered: other methods, such as a
 * server action posted to the page, pass through untouched. Resolution fails open: when the
 * content store cannot answer, the page handles the request as it would without the proxy.
 */
export async function handleStoryRequest(
  request: NextRequest,
  resolve: (slug: string) => Promise<SlugResolution | null> = resolveStoryRequest,
): Promise<NextResponse> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return NextResponse.next()
  const slug = requestedStorySlug(request.nextUrl.pathname)
  if (slug === null) return NextResponse.next()
  let resolution: SlugResolution | null
  try {
    resolution = await resolve(slug)
  } catch (error) {
    console.error(
      `Slug resolution failed for ${storyPath(slug)}; the story page answers it.`,
      error,
    )
    return NextResponse.next()
  }
  if (resolution?.kind === 'redirect') return redirectResponse(request, resolution.slug)
  if (resolution?.kind === 'gone') return goneResponse()
  return NextResponse.next()
}
