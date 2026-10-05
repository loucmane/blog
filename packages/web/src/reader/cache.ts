import { randomUUID } from 'node:crypto'

import { revalidateTag, unstable_cache } from 'next/cache'
import { cache } from 'react'

import {
  readArticleView,
  readHomeView,
  readPublicMediaIds,
  readSectionView,
  type ReaderSource,
} from './read-model'
import { resolveReaderStore } from './store'
import type { ArticleView, HomeView, ReaderResult, SectionView } from './views'

/*
 * Reader views are cached through `unstable_cache` under keys that include the publication
 * version: a counter the content store advances in the same commit as every change to what
 * readers may see. Each request reads the version fresh, with one query, never from a cache.
 *
 * Expiring tags is not enough on its own. Next stamps a cache entry when it is written, and a tag
 * expiry hides only entries stamped before it. So a read that starts before a publication change
 * and finishes after the expiry writes the old view back as a fresh entry. Under a versioned key,
 * that entry can reach only requests that read the old version, which began before the change
 * committed. Every publication change still expires the tags at once
 * (`revalidateTag(tag, { expire: 0 })`). Public pages render per request with `connection()`, so
 * builds never touch the content store.
 */

export const readerCacheTag = 'reader'
export const readerCacheSeconds = 3_600

export function storyCacheTag(slug: string): string {
  return `story:${slug}`
}

export function sectionCacheTag(slug: string): string {
  return `section:${slug}`
}

const cacheScopeKey = Symbol.for('magazine.reader-cache-scope')
type CacheScopeGlobal = typeof globalThis & { [cacheScopeKey]?: string }

/**
 * Cache entries are scoped to this server process. The in-memory test store starts empty, at
 * publication version 0, in every process, and the data cache outlives restarts, so a
 * process-scoped key keeps one run's views out of the next.
 */
function cacheScope(): string {
  const scopeGlobal = globalThis as CacheScopeGlobal
  scopeGlobal[cacheScopeKey] ??= randomUUID()
  return scopeGlobal[cacheScopeKey]
}

async function cachedRead<T>(
  key: readonly string[],
  tags: readonly string[],
  read: (source: ReaderSource) => Promise<T>,
): Promise<ReaderResult<T>> {
  const store = resolveReaderStore()
  if (!store) return { status: 'unavailable' }
  const publicationVersion = await store.repository.readPublicationVersion()
  return unstable_cache(
    async (): Promise<ReaderResult<T>> => ({
      cacheGeneration: randomUUID(),
      status: 'ready',
      view: await read(store),
    }),
    ['public-reader', cacheScope(), `publication-${publicationVersion}`, ...key],
    { revalidate: readerCacheSeconds, tags: [readerCacheTag, ...tags] },
  )()
}

export const loadHomeView = cache((): Promise<ReaderResult<HomeView>> =>
  cachedRead(['home'], [], readHomeView),
)

export const loadArticleView = cache((slug: string): Promise<ReaderResult<ArticleView | null>> =>
  cachedRead(['story', slug], [storyCacheTag(slug)], (source) => readArticleView(source, slug)),
)

export const loadSectionView = cache((slug: string): Promise<ReaderResult<SectionView | null>> =>
  cachedRead(['section', slug], [sectionCacheTag(slug)], (source) => readSectionView(source, slug)),
)

export const loadPublicMediaIds = cache((): Promise<ReaderResult<readonly string[]>> =>
  cachedRead(['public-media'], [], readPublicMediaIds),
)

/**
 * Expires every cached reader view. Call it after any change to what readers may see: publish,
 * schedule, unpublish, delete, restore, a completed scheduled publication, or a section change.
 */
export function expirePublicReader(slug?: string): void {
  if (slug) revalidateTag(storyCacheTag(slug), { expire: 0 })
  revalidateTag(readerCacheTag, { expire: 0 })
}
