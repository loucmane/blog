import type { QueryResultRow } from 'pg'
import { describe, expect, it } from 'vitest'

import { PostgresSearchQuery } from './postgres-search-query'

function fakeClient(...pages: readonly (readonly Record<string, unknown>[])[]) {
  const calls: { text: string; values: readonly unknown[] }[] = []
  const queue = [...pages]
  return {
    calls,
    client: {
      async query<Row extends QueryResultRow>(text: string, values: readonly unknown[]) {
        calls.push({ text, values })
        return { rows: (queue.shift() ?? []) as unknown as Row[] }
      },
    },
  }
}

const winterRow = {
  article_id: 'article-winter',
  rank: 0.6,
  slug: 'architecture-of-winter-light',
  snippet: 'The architecture of winter light Low winter light crosses the floor',
  title: 'The architecture of winter light',
  total: 2,
}
const kitchenRow = {
  article_id: 'article-kitchen',
  rank: 0.2,
  slug: 'kitchens-after-dark',
  snippet: 'One lamp and the last of the winter light.',
  title: 'Kitchens after dark',
  total: 2,
}

function hit(row: typeof winterRow) {
  return {
    articleId: row.article_id,
    rank: row.rank,
    slug: row.slug,
    snippet: row.snippet,
    title: row.title,
  }
}

describe('PostgreSQL search query boundary', () => {
  it('ranks full-text matches and excerpts only the published search text', async () => {
    const { calls, client } = fakeClient([winterRow, kitchenRow])

    await expect(
      new PostgresSearchQuery(client).search({ limit: 10, offset: 0, query: 'winter light' }),
    ).resolves.toEqual({ items: [hit(winterRow), hit(kitchenRow)], total: 2 })

    expect(calls).toHaveLength(1)
    expect(calls[0]?.values).toEqual(['winter light', 10, 0])
    const text = calls[0]?.text
    expect(text).toContain("ts_rank_cd(document, websearch_to_tsquery('english', $1)) AS rank")
    expect(text).toContain("WHERE document @@ websearch_to_tsquery('english', $1)")
    expect(text).toContain('ORDER BY rank DESC, published_at DESC, article_id')
    expect(text).toContain('LIMIT $2 OFFSET $3')
    expect(text).toContain(
      "ts_headline('english', published.search_text, websearch_to_tsquery('english', $1),",
    )
    // No StartSel or StopSel markup: a snippet is plain text.
    expect(text).toContain(`'StartSel="", StopSel=""'`)
    expect(text).toContain('LEFT JOIN article_search_documents AS published')
    // Snippets and titles come from the search documents, never from revisions or articles.
    expect(text).not.toMatch(/article_revisions|\barticles\b/)
  })

  it('falls back to title similarity only when the words match nothing', async () => {
    const typo = { ...winterRow, rank: 0.4, total: 1 }
    const { calls, client } = fakeClient([{ article_id: null, total: 0 }], [typo])

    await expect(
      new PostgresSearchQuery(client).search({ limit: 10, offset: 0, query: 'wimter' }),
    ).resolves.toEqual({ items: [hit(typo)], total: 1 })

    expect(calls).toHaveLength(2)
    expect(calls[1]?.values).toEqual(['wimter', 10, 0])
    const text = calls[1]?.text
    expect(text).toContain('public.strict_word_similarity($1, title) AS rank')
    expect(text).toContain('WHERE public.strict_word_similarity($1, title) > 0.3')
    expect(text).toContain("ts_headline('english', published.search_text")
    expect(text).not.toContain('@@')
  })

  it('keeps the total for a page past the last hit, without falling back', async () => {
    const { calls, client } = fakeClient([{ article_id: null, total: 7 }])

    await expect(
      new PostgresSearchQuery(client).search({ limit: 10, offset: 20, query: 'light' }),
    ).resolves.toEqual({ items: [], total: 7 })
    expect(calls).toHaveLength(1)
    expect(calls[0]?.values).toEqual(['light', 10, 20])
  })

  it('reports no hits when neither search finds anything', async () => {
    const nothing = fakeClient([{ article_id: null, total: 0 }], [{ article_id: null, total: 0 }])
    await expect(
      new PostgresSearchQuery(nothing.client).search({ limit: 10, offset: 0, query: 'qzxv' }),
    ).resolves.toEqual({ items: [], total: 0 })
    expect(nothing.calls).toHaveLength(2)

    // Even a driver that returned no row at all reads as no hits.
    const noRows = fakeClient([], [])
    await expect(
      new PostgresSearchQuery(noRows.client).search({ limit: 10, offset: 0, query: 'qzxv' }),
    ).resolves.toEqual({ items: [], total: 0 })
  })
})
