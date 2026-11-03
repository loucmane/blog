import { randomUUID } from 'node:crypto'

import { unstable_cache } from 'next/cache'

import { readerCacheSeconds, readerCacheTag } from '@/reader/cache'
import { resolveReaderStore } from '@/reader/store'
import { feedCacheTag, readFeedDocument } from '@/server/distribution/feed'
import { distributionCacheControl } from '@/server/distribution/limits'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cache entries belong to this server process, as the reader's do (reader/cache.ts): the in-memory
 * test store starts again at publication version 0 in every process.
 */
const cacheScope = randomUUID()

/** No archive key is longer: an ISO 8601 instant, a separator and an article id. */
const maxArchiveKeyLength = 256

function textResponse(status: 404 | 503, text: string): Response {
  return new Response(text, {
    headers: { 'cache-control': 'no-store', 'content-type': 'text/plain; charset=utf-8' },
    status,
  })
}

/**
 * The RSS feed and its dated archive (server/distribution/feed.ts). The feed itself is cached under
 * the publication version, read fresh on every request, and under the reader and feed tags, which
 * every reader expiry and the outbox cache events expire. An archive page is named by request input,
 * so it is read from the store each time and left to shared caches.
 */
export async function GET(request: Request): Promise<Response> {
  const before = new URL(request.url).searchParams.get('before')
  if (before !== null && (before.length === 0 || before.length > maxArchiveKeyLength)) {
    return textResponse(404, 'This feed page does not exist.')
  }
  const store = resolveReaderStore()
  if (!store) return textResponse(503, 'The magazine is unavailable.')
  const { repository } = store
  const document =
    before === null
      ? await unstable_cache(
          () => readFeedDocument(repository, null),
          ['feed', cacheScope, `publication-${await repository.readPublicationVersion()}`],
          { revalidate: readerCacheSeconds, tags: [readerCacheTag, feedCacheTag] },
        )()
      : await readFeedDocument(repository, before)
  if (document === null) return textResponse(404, 'This feed page does not exist.')
  return new Response(document, {
    headers: {
      'cache-control': distributionCacheControl,
      'content-type': 'application/rss+xml; charset=utf-8',
    },
  })
}
