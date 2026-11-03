import { describe, expect, it, vi } from 'vitest'

import { InMemorySearch } from './in-memory-search'
import {
  defaultSearchPageSize,
  maxSearchPageSize,
  maxSearchQueryLength,
  normalizeSearchQuery,
  SearchService,
} from './search-service'

const lantern = {
  articleId: 'article-lantern',
  publishedAt: '2026-06-01T07:00:00.000Z',
  searchText: 'Lantern light Notes on lantern glass and winter light.',
  slug: 'lantern-light',
  title: 'Lantern light',
}
const terrace = {
  articleId: 'article-terrace',
  publishedAt: '2026-06-02T07:00:00.000Z',
  searchText: 'Summer terraces Bright light on warm stone.',
  slug: 'summer-terraces',
  title: 'Summer terraces',
}

async function searchService() {
  const store = new InMemorySearch()
  await store.upsertPublishedArticle(lantern)
  await store.upsertPublishedArticle(terrace)
  return { search: vi.spyOn(store, 'search'), service: new SearchService(store), store }
}

describe('reader search service', () => {
  it('normalizes compatibility forms and every kind of whitespace before searching', async () => {
    const { search, service } = await searchService()

    expect(normalizeSearchQuery('  ｗｉｎｔｅｒ\t\tlight\r\n ﬁre  ')).toEqual({
      query: 'winter light fire',
      status: 'ready',
    })
    expect(normalizeSearchQuery('winter light and　glass')).toEqual({
      query: 'winter light and glass',
      status: 'ready',
    })
    await service.search({ query: '\tＬａｎｔｅｒｎ\n\nGLASS ' })
    expect(search).toHaveBeenCalledExactlyOnceWith({
      limit: defaultSearchPageSize,
      offset: 0,
      query: 'Lantern GLASS',
    })
  })

  it('cuts a long query to the length cap without splitting a character', async () => {
    const { search, service } = await searchService()
    const capped = (raw: string) => {
      const normalized = normalizeSearchQuery(raw)
      return normalized.status === 'ready' ? normalized.query : null
    }

    expect(capped('a'.repeat(maxSearchQueryLength + 50))).toBe('a'.repeat(maxSearchQueryLength))
    // Each of these emoji is two UTF-16 code units; the cap counts characters.
    expect(capped('🌲'.repeat(maxSearchQueryLength + 1))).toBe('🌲'.repeat(maxSearchQueryLength))
    // Whitespace is collapsed and trimmed before the cut, and a cut ending on a space is trimmed.
    expect(capped(`   ${'b'.repeat(maxSearchQueryLength)}`)).toBe('b'.repeat(maxSearchQueryLength))
    expect(capped(`${'c'.repeat(maxSearchQueryLength - 1)}\t\td`)).toBe(
      'c'.repeat(maxSearchQueryLength - 1),
    )

    await service.search({ query: `lantern ${'x'.repeat(maxSearchQueryLength)}` })
    expect(search.mock.calls[0]?.[0].query).toHaveLength(maxSearchQueryLength)
  })

  it('rejects a control character anywhere in the query without searching', async () => {
    const { search, service } = await searchService()

    for (const query of [
      'winter\u0000light',
      '\u001b[31mwinter',
      'winter\u007f',
      'winter\u0085light',
      `${'a'.repeat(maxSearchQueryLength + 10)}\u0007`,
    ]) {
      expect(normalizeSearchQuery(query)).toEqual({
        reason: 'control-character',
        status: 'rejected',
      })
      expect(await service.search({ query })).toEqual({
        reason: 'control-character',
        status: 'rejected',
      })
    }
    expect(search).not.toHaveBeenCalled()
  })

  it('answers a blank query without searching', async () => {
    const { search, service } = await searchService()

    for (const query of ['', '   ', '\t\r\n', '　']) {
      expect(await service.search({ query })).toEqual({ status: 'blank' })
    }
    expect(search).not.toHaveBeenCalled()
  })

  it('answers with the documented empty state when no published story matches', async () => {
    const { service, store } = await searchService()

    expect(await service.search({ query: '  qzxv  ' })).toEqual({
      items: [],
      limit: defaultSearchPageSize,
      offset: 0,
      query: 'qzxv',
      status: 'empty',
      total: 0,
    })
    // A story taken out of the search documents is no longer found.
    await store.removeArticle(lantern.articleId)
    expect(await service.search({ query: 'lantern' })).toMatchObject({
      items: [],
      status: 'empty',
      total: 0,
    })
  })

  it('returns ranked results with the page that was asked for and the total', async () => {
    const { service } = await searchService()

    expect(await service.search({ query: 'light' })).toMatchObject({
      items: [{ slug: lantern.slug }, { slug: terrace.slug }],
      limit: defaultSearchPageSize,
      offset: 0,
      query: 'light',
      status: 'results',
      total: 2,
    })
    expect(await service.search({ limit: 1, offset: 1, query: 'light' })).toMatchObject({
      items: [{ slug: terrace.slug }],
      limit: 1,
      offset: 1,
      status: 'results',
      total: 2,
    })
    // A page past the last hit is still a result: there are hits, just not on this page.
    expect(await service.search({ limit: maxSearchPageSize, offset: 2, query: 'light' })).toEqual({
      items: [],
      limit: maxSearchPageSize,
      offset: 2,
      query: 'light',
      status: 'results',
      total: 2,
    })
  })

  it('refuses a page it cannot serve before searching', async () => {
    const { search, service } = await searchService()

    for (const limit of [0, maxSearchPageSize + 1, 1.5, Number.NaN]) {
      await expect(service.search({ limit, query: 'light' })).rejects.toThrow(RangeError)
    }
    for (const offset of [-1, 0.5, Number.POSITIVE_INFINITY]) {
      await expect(service.search({ offset, query: 'light' })).rejects.toThrow(RangeError)
    }
    expect(search).not.toHaveBeenCalled()
  })
})
