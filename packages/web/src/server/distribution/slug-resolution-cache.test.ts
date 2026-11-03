import { describe, expect, it, vi } from 'vitest'

import {
  SlugResolutionCache,
  slugResolutionMaxEntries,
  slugResolutionTtlMs,
  type SlugResolutionStore,
} from './slug-resolution-cache'
import type { SlugArticle, SlugRedirectEdge } from './slug-resolution'

/** A store whose visible slugs and redirects the test changes, counting what the cache reads. */
function fakeStore() {
  const state = {
    articles: new Map<string, SlugArticle>([
      ['article-live', { deleted: false, id: 'article-live', published: true, slug: 'live-story' }],
    ]),
    redirects: new Map<string, SlugRedirectEdge>(),
    version: 1,
    visible: new Map([['live-story', 'article-live']]),
  }
  const readVisibleSlugs = vi.fn(async () => new Map(state.visible))
  const redirectFrom = vi.fn(async (slug: string) => state.redirects.get(slug) ?? null)
  const readPublicationVersion = vi.fn(async () => state.version)
  const store: SlugResolutionStore = {
    history: {
      article: async (id) => state.articles.get(id) ?? null,
      articlesAt: async (slug) =>
        [...state.articles.values()].filter((article) => article.slug === slug),
      redirectFrom,
    },
    readPublicationVersion,
    readVisibleSlugs,
  }
  return { readPublicationVersion, readVisibleSlugs, redirectFrom, state, store }
}

describe('slug resolution cache', () => {
  it('reads the version on every request, the visible slugs once, and each slug once', async () => {
    const { readPublicationVersion, readVisibleSlugs, redirectFrom, state, store } = fakeStore()
    state.redirects.set('old-story', { articleId: 'article-live', toSlug: 'live-story' })
    const cache = new SlugResolutionCache()

    for (let request = 0; request < 3; request += 1) {
      expect(await cache.resolve('old-story', store)).toEqual({
        kind: 'redirect',
        slug: 'live-story',
      })
      expect(await cache.resolve('live-story', store)).toEqual({ kind: 'current' })
    }

    expect(readPublicationVersion).toHaveBeenCalledTimes(6)
    expect(readVisibleSlugs).toHaveBeenCalledTimes(1)
    expect(redirectFrom).toHaveBeenCalledTimes(1)
  })

  it('answers from the new state as soon as the publication version moves', async () => {
    const { readVisibleSlugs, state, store } = fakeStore()
    const cache = new SlugResolutionCache()
    expect(await cache.resolve('live-story', store)).toEqual({ kind: 'current' })

    // The story is renamed: the same commit advances the version.
    state.articles.set('article-live', {
      deleted: false,
      id: 'article-live',
      published: true,
      slug: 'renamed-story',
    })
    state.visible = new Map([['renamed-story', 'article-live']])
    state.redirects.set('live-story', { articleId: 'article-live', toSlug: 'renamed-story' })
    state.version = 2

    expect(await cache.resolve('live-story', store)).toEqual({
      kind: 'redirect',
      slug: 'renamed-story',
    })
    expect(readVisibleSlugs).toHaveBeenCalledTimes(2)
  })

  it('reads again once a generation is older than its TTL, even at the same version', async () => {
    const { readVisibleSlugs, store } = fakeStore()
    let now = 0
    const cache = new SlugResolutionCache({ now: () => now, ttlMs: 1_000 })

    await cache.resolve('live-story', store)
    now = 999
    await cache.resolve('live-story', store)
    expect(readVisibleSlugs).toHaveBeenCalledTimes(1)
    now = 1_000
    await cache.resolve('live-story', store)
    expect(readVisibleSlugs).toHaveBeenCalledTimes(2)
    expect(slugResolutionTtlMs).toBe(60_000)
  })

  it('remembers at most maxEntries slugs, forgetting the oldest first', async () => {
    const { redirectFrom, store } = fakeStore()
    const cache = new SlugResolutionCache({ maxEntries: 2 })

    for (const slug of ['first-miss', 'second-miss', 'third-miss']) {
      expect(await cache.resolve(slug, store)).toEqual({ kind: 'unknown' })
    }
    expect(redirectFrom).toHaveBeenCalledTimes(3)
    await cache.resolve('third-miss', store)
    await cache.resolve('second-miss', store)
    expect(redirectFrom).toHaveBeenCalledTimes(3)
    // The first was forgotten to make room for the third.
    await cache.resolve('first-miss', store)
    expect(redirectFrom).toHaveBeenCalledTimes(4)
    expect(slugResolutionMaxEntries).toBe(1_000)
  })

  it('shares one resolution between concurrent requests for a slug', async () => {
    const { redirectFrom, store } = fakeStore()
    const cache = new SlugResolutionCache()

    const answers = await Promise.all([
      cache.resolve('missing-story', store),
      cache.resolve('missing-story', store),
      cache.resolve('missing-story', store),
    ])

    expect(answers).toEqual([{ kind: 'unknown' }, { kind: 'unknown' }, { kind: 'unknown' }])
    expect(redirectFrom).toHaveBeenCalledTimes(1)
  })

  it('forgets a failed resolution, so the next request reads again', async () => {
    const { redirectFrom, store } = fakeStore()
    redirectFrom.mockRejectedValueOnce(new Error('connection reset'))
    const cache = new SlugResolutionCache()

    await expect(cache.resolve('missing-story', store)).rejects.toThrow('connection reset')
    expect(await cache.resolve('missing-story', store)).toEqual({ kind: 'unknown' })
    expect(redirectFrom).toHaveBeenCalledTimes(2)
  })

  it('forgets visible slugs that failed to load, and a version that failed to read', async () => {
    const { readPublicationVersion, readVisibleSlugs, store } = fakeStore()
    readVisibleSlugs.mockRejectedValueOnce(new Error('statement timeout'))
    const cache = new SlugResolutionCache()

    await expect(cache.resolve('live-story', store)).rejects.toThrow('statement timeout')
    expect(await cache.resolve('live-story', store)).toEqual({ kind: 'current' })
    expect(readVisibleSlugs).toHaveBeenCalledTimes(2)

    readPublicationVersion.mockRejectedValueOnce(new Error('database unavailable'))
    await expect(cache.resolve('live-story', store)).rejects.toThrow('database unavailable')
    expect(await cache.resolve('live-story', store)).toEqual({ kind: 'current' })
  })
})
