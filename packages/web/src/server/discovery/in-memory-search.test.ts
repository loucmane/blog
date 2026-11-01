import { describe, expect, it } from 'vitest'

import { InMemorySearch } from './in-memory-search'

const winter = {
  articleId: 'article-winter',
  publishedAt: '2026-06-01T07:00:00.000Z',
  searchText:
    'The architecture of winter light Low winter light crosses the floor of each small room.',
  slug: 'architecture-of-winter-light',
  title: 'The architecture of winter light',
}
const kitchen = {
  articleId: 'article-kitchen',
  publishedAt: '2026-06-02T07:00:00.000Z',
  searchText: 'Kitchens after dark One lamp and the last of the winter light.',
  slug: 'kitchens-after-dark',
  title: 'Kitchens after dark',
}
const terrace = {
  articleId: 'article-terrace',
  publishedAt: '2026-06-03T07:00:00.000Z',
  searchText: 'Summer terraces Bright light on warm stone.',
  slug: 'summer-terraces',
  title: 'Summer terraces',
}

async function searchOver(...documents: (typeof winter)[]) {
  const search = new InMemorySearch()
  for (const document of documents) await search.upsertPublishedArticle(document)
  return search
}

describe('in-memory search double', () => {
  it('finds documents with every query word, ranking title words above text words', async () => {
    const search = await searchOver(winter, kitchen, terrace)

    const page = await search.search({ limit: 10, offset: 0, query: 'Winter LIGHT' })

    expect(page.total).toBe(2)
    expect(page.items.map(({ slug }) => slug)).toEqual([winter.slug, kitchen.slug])
    expect(page.items[0]).toMatchObject({ articleId: winter.articleId, title: winter.title })
    expect(page.items[0]!.rank).toBeGreaterThan(page.items[1]!.rank)
  })

  it('breaks rank ties by the newer article, then by the lower article id', async () => {
    const twin = (articleId: string, publishedAt: string) => ({
      ...terrace,
      articleId,
      publishedAt,
      slug: articleId,
    })
    // Written out of order, so the sort meets ids in both orders.
    const search = await searchOver(
      twin('article-b', '2026-06-01T07:00:00.000Z'),
      twin('article-a', '2026-06-01T07:00:00.000Z'),
      twin('article-d', '2026-06-01T07:00:00.000Z'),
      twin('article-c', '2026-06-02T07:00:00.000Z'),
    )

    const page = await search.search({ limit: 10, offset: 0, query: 'terraces' })

    expect(page.items.map(({ articleId }) => articleId)).toEqual([
      'article-c',
      'article-a',
      'article-b',
      'article-d',
    ])
  })

  it('pages the hits and keeps the total, even past the last page', async () => {
    const search = await searchOver(winter, kitchen, terrace)
    const light = (limit: number, offset: number) =>
      search.search({ limit, offset, query: 'light' })

    // Terrace and kitchen tie on one text word each, and the newer terrace comes first.
    expect((await light(10, 0)).items.map(({ slug }) => slug)).toEqual([
      winter.slug,
      terrace.slug,
      kitchen.slug,
    ])
    expect((await light(2, 0)).items.map(({ slug }) => slug)).toEqual([winter.slug, terrace.slug])
    expect(await light(2, 2)).toMatchObject({ items: [{ slug: kitchen.slug }], total: 3 })
    expect(await light(2, 5)).toEqual({ items: [], total: 3 })
  })

  it('falls back to titles a typo or a partial word away when no document has every word', async () => {
    const search = await searchOver(winter, kitchen, terrace)
    const find = (query: string) => search.search({ limit: 10, offset: 0, query })

    // pg_trgm's strict word similarity: 4 shared trigrams of 10 between 'wimter' and 'winter'.
    const typo = await find('wimter')
    expect(typo).toMatchObject({ items: [{ slug: winter.slug }], total: 1 })
    expect(typo.items[0]!.rank).toBeCloseTo(0.4)
    // 6 shared of 14 between 'archit' and 'architecture'.
    const partial = await find('archit')
    expect(partial).toMatchObject({ items: [{ slug: winter.slug }], total: 1 })
    expect(partial.items[0]!.rank).toBeCloseTo(6 / 14)
    expect(await find('wimter light')).toMatchObject({ items: [{ slug: winter.slug }], total: 1 })
    expect(await find('qzxv')).toEqual({ items: [], total: 0 })
    expect(await find('!!!')).toEqual({ items: [], total: 0 })
  })

  it('builds snippets from the published text, starting at the first word the query names', async () => {
    const filler = Array.from({ length: 50 }, (_, index) => `word${index}`).join(' ')
    const long = {
      ...winter,
      searchText: `${filler} lantern glass and a long tail ${filler}`,
      title: 'Lantern glass',
    }
    const search = await searchOver(long)

    const [hit] = (await search.search({ limit: 10, offset: 0, query: 'lantern' })).items
    expect(hit?.snippet.startsWith('lantern glass and a long tail word0')).toBe(true)
    expect(hit?.snippet.split(' ')).toHaveLength(35)
    expect(long.searchText).toContain(hit?.snippet)

    // A title found by similarity has no word in the text to start from.
    const [typo] = (await search.search({ limit: 10, offset: 0, query: 'lanturn' })).items
    expect(typo?.snippet.startsWith('word0 word1')).toBe(true)
    expect(long.searchText).toContain(typo?.snippet)
  })

  it('keeps one document per article and forgets removed ones', async () => {
    const search = await searchOver(winter)
    const find = (query: string) => search.search({ limit: 10, offset: 0, query })

    await search.upsertPublishedArticle({
      ...winter,
      searchText: 'Snowfield notes',
      title: 'Snowfield',
    })
    expect(await find('architecture')).toEqual({ items: [], total: 0 })
    expect(await find('snowfield')).toMatchObject({
      items: [{ articleId: winter.articleId, title: 'Snowfield' }],
      total: 1,
    })

    await search.removeArticle(winter.articleId)
    await search.removeArticle('article-unknown')
    expect(await find('snowfield')).toEqual({ items: [], total: 0 })
  })
})
