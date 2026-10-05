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
 * Reader caching follows the project's existing convention: data is cached with tags through
 * `unstable_cache`, and every publication-state change expires the tags immediately
 * (`revalidateTag(tag, { expire: 0 })`), so the next request reads fresh content. Public pages
 * render per request with `connection()`, so builds never touch the content store.
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
 * Cache entries are scoped to this server process. The in-memory test store starts empty in every
 * process and the data cache outlives restarts, so a process-scoped key keeps one run's stories
 * out of the next. A restart also picks up writes made by other processes.
 */
function cacheScope(): string {
  const scopeGlobal = globalThis as CacheScopeGlobal
  scopeGlobal[cacheScopeKey] ??= randomUUID()
  return scopeGlobal[cacheScopeKey]
}

function cachedRead<T>(
  key: readonly string[],
  tags: readonly string[],
  read: (source: ReaderSource) => Promise<T>,
): Promise<ReaderResult<T>> {
  return unstable_cache(
    async (): Promise<ReaderResult<T>> => {
      const store = resolveReaderStore()
      if (!store) return { status: 'unavailable' }
      return { cacheGeneration: randomUUID(), status: 'ready', view: await read(store) }
    },
    ['public-reader', cacheScope(), ...key],
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
