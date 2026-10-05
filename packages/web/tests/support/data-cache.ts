/*
 * A stand-in for the Next data cache behind `unstable_cache` and `revalidateTag`. It keeps the
 * rules of Next 16.3.8 that decide whether a cached value counts as fresh:
 *
 * - A miss runs the cached function, then writes its result
 *   (`server/web/spec-extension/unstable-cache.js`, `cacheNewResult`).
 * - An entry is stamped when it is written, not when its value was read
 *   (`server/lib/incremental-cache/file-system-cache.js`, `set`: `lastModified: Date.now()`).
 * - Expiring a tag hides only the entries stamped before the expiry
 *   (`server/lib/incremental-cache/tags-manifest.external.js`, `areTagsExpired`).
 *
 * So a read that starts before a publication change and finishes after the tag expiry writes the
 * old value back as a fresh entry. A logical clock orders writes and expiries exactly, so tests
 * reproduce that interleaving without timing luck. Time-based revalidation is left out: entries
 * here never age.
 */

interface Entry {
  readonly json: string | undefined
  readonly tags: readonly string[]
  readonly writtenAt: number
}

export class DataCacheStandIn {
  private clock = 0
  private readonly entries = new Map<string, Entry>()
  private readonly expiries = new Map<string, number>()

  /** Stands in for `unstable_cache(load, keyParts, { tags })`. */
  readonly cache = <Args extends unknown[], T>(
    load: (...args: Args) => Promise<T>,
    keyParts: readonly string[] = [],
    options: { readonly tags?: readonly string[] } = {},
  ) => {
    const tags = options.tags ?? []
    return async (...args: Args): Promise<T> => {
      const key = JSON.stringify([load.toString(), keyParts, args])
      const entry = this.entries.get(key)
      if (entry && !this.expired(entry)) {
        return (entry.json === undefined ? undefined : JSON.parse(entry.json)) as T
      }
      const value = await load(...args)
      this.entries.set(key, { json: JSON.stringify(value), tags, writtenAt: this.tick() })
      return value
    }
  }

  /** Stands in for `revalidateTag(tag, { expire: 0 })`. */
  readonly expireTag = (tag: string): void => {
    this.expiries.set(tag, this.tick())
  }

  reset(): void {
    this.clock = 0
    this.entries.clear()
    this.expiries.clear()
  }

  private expired(entry: Entry): boolean {
    return entry.tags.some((tag) => (this.expiries.get(tag) ?? 0) > entry.writtenAt)
  }

  private tick(): number {
    this.clock += 1
    return this.clock
  }
}

/** One data cache per test file, shared by the `next/cache` mock and the test. */
export const dataCache = new DataCacheStandIn()
