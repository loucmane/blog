import { randomUUID } from 'node:crypto'

import { unstable_cache } from 'next/cache'

import { readerCacheSeconds, readerCacheTag } from '@/reader/cache'
import { resolveReaderStore } from '@/reader/store'
import { distributionCacheControl } from '@/server/distribution/limits'
import { readSitemapUrls, renderSitemapIndex, sitemapCacheTag } from '@/server/distribution/sitemap'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Cache entries belong to this server process, as the reader's do (reader/cache.ts). */
const cacheScope = randomUUID()

/**
 * The sitemap index (server/distribution/sitemap.ts). The URLs it counts are cached under the
 * publication version, read fresh on every request, and under the reader and sitemap tags, which
 * every reader expiry and the outbox cache events expire.
 */
export async function GET(): Promise<Response> {
  const store = resolveReaderStore()
  if (!store) {
    return new Response('The magazine is unavailable.', {
      headers: { 'cache-control': 'no-store', 'content-type': 'text/plain; charset=utf-8' },
      status: 503,
    })
  }
  const { repository } = store
  const urls = await unstable_cache(
    () => readSitemapUrls(repository),
    ['sitemap', cacheScope, `publication-${await repository.readPublicationVersion()}`],
    { revalidate: readerCacheSeconds, tags: [readerCacheTag, sitemapCacheTag] },
  )()
  return new Response(renderSitemapIndex(urls), {
    headers: {
      'cache-control': distributionCacheControl,
      'content-type': 'application/xml; charset=utf-8',
    },
  })
}
