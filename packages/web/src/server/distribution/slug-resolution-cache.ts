import { resolveSlug, type SlugHistory, type SlugResolution } from './slug-resolution'

/** What a cached resolution reads from the content store. */
export interface SlugResolutionStore {
  readonly history: SlugHistory
  /** `ContentRepository.readPublicationVersion`: advances in the commit of every visible change. */
  readPublicationVersion(): Promise<number>
  /** Every slug readers can see, with its article's id (`readVisibleSlugs`). */
  readVisibleSlugs(): Promise<ReadonlyMap<string, string>>
}

export interface SlugResolutionCacheOptions {
  /** The most slugs one generation remembers; the oldest is forgotten first. */
  readonly maxEntries?: number
  readonly now?: () => number
  /** How long one generation of answers may be used, in milliseconds. */
  readonly ttlMs?: number
}

/** The answers for one publication version, and the visible slugs they were resolved against. */
interface Generation {
  readonly expiresAt: number
  readonly resolutions: Map<string, Promise<SlugResolution>>
  readonly version: number
  readonly visible: Promise<ReadonlyMap<string, string>>
}

export const slugResolutionTtlMs = 60_000
export const slugResolutionMaxEntries = 1_000

/**
 * Resolutions cached in-process, keyed by slug, for one publication version at a time. Each call
 * reads the version fresh, with one query, as the reader cache does (reader/cache.ts). Every change
 * that can move a slug (publish, unpublish, a slug change, delete, restore, import) advances it in
 * the same commit, so a renamed, withdrawn or republished story is answered correctly on the next
 * request, never a short TTL later. The visible slugs are read once per generation, and each
 * answer at most once per slug. A generation also ends after `ttlMs`, as a bound for changes made
 * outside the content service, and holds at most `maxEntries` slugs, so requests for random slugs
 * cannot grow it without limit. Concurrent requests for one slug share one resolution, and a
 * failed read is forgotten at once, so the next request reads again.
 */
export class SlugResolutionCache {
  private generation: Generation | null = null
  private readonly maxEntries: number
  private readonly now: () => number
  private readonly ttlMs: number

  constructor({
    maxEntries = slugResolutionMaxEntries,
    now = Date.now,
    ttlMs = slugResolutionTtlMs,
  }: SlugResolutionCacheOptions = {}) {
    this.maxEntries = maxEntries
    this.now = now
    this.ttlMs = ttlMs
  }

  async resolve(slug: string, store: SlugResolutionStore): Promise<SlugResolution> {
    const generation = this.generationFor(await store.readPublicationVersion(), store)
    const cached = generation.resolutions.get(slug)
    if (cached) return cached
    const resolution = resolveSlug(slug, {
      history: store.history,
      visibleArticleAt: async (candidate) => (await generation.visible).get(candidate) ?? null,
    })
    this.remember(generation, slug, resolution)
    return resolution
  }

  private generationFor(version: number, store: SlugResolutionStore): Generation {
    const now = this.now()
    const existing = this.generation
    if (existing && existing.version === version && existing.expiresAt > now) return existing
    const generation: Generation = {
      expiresAt: now + this.ttlMs,
      resolutions: new Map(),
      version,
      visible: store.readVisibleSlugs(),
    }
    generation.visible.catch(() => {
      if (this.generation === generation) this.generation = null
    })
    this.generation = generation
    return generation
  }

  private remember(generation: Generation, slug: string, resolution: Promise<SlugResolution>) {
    if (generation.resolutions.size >= this.maxEntries) {
      const oldest = generation.resolutions.keys().next()
      if (!oldest.done) generation.resolutions.delete(oldest.value)
    }
    generation.resolutions.set(slug, resolution)
    resolution.catch(() => {
      if (generation.resolutions.get(slug) === resolution) generation.resolutions.delete(slug)
    })
  }
}
