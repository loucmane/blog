import { randomUUID } from 'node:crypto'

import { unstable_cache } from 'next/cache'

import { readerCacheSeconds, readerCacheTag } from '@/reader/cache'
import { resolveReaderStore } from '@/reader/store'
import { distributionCacheControl } from '@/server/distribution/limits'
import { readSitemapUrls, renderSitemapPage, sitemapCacheTag } from '@/server/distribution/sitemap'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface RouteContext {
  readonly params: Promise<{ page: string }>
}

/** Cache entries belong to this server process, as the reader's do (reader/cache.ts). */
const cacheScope = randomUUID()

function textResponse(status: 404 | 503, text: string): Response {
  return new Response(text, {
    headers: { 'cache-control': 'no-store', 'content-type': 'text/plain; charset=utf-8' },
    status,
  })
}

/**
 * One sitemap page, `/sitemaps/<n>.xml` (server/distribution/sitemap.ts), rendered from the URLs
 * the index counts, cached as the index caches them. A page the index does not link is not found.
 */
export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { page } = await context.params
  if (!/^[1-9]\d{0,8}\.xml$/.test(page)) {
    return textResponse(404, 'This sitemap page does not exist.')
  }
  const store = resolveReaderStore()
  if (!store) return textResponse(503, 'The magazine is unavailable.')
  const { repository } = store
  const urls = await unstable_cache(
    () => readSitemapUrls(repository),
    ['sitemap', cacheScope, `publication-${await repository.readPublicationVersion()}`],
    { revalidate: readerCacheSeconds, tags: [readerCacheTag, sitemapCacheTag] },
  )()
  const document = renderSitemapPage(urls, Number.parseInt(page, 10))
  if (document === null) return textResponse(404, 'This sitemap page does not exist.')
  return new Response(document, {
    headers: {
      'cache-control': distributionCacheControl,
      'content-type': 'application/xml; charset=utf-8',
    },
  })
}
