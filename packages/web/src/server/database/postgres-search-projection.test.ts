import { describe, expect, it } from 'vitest'

import { PostgresSearchProjection } from './postgres-search-projection'

describe('PostgreSQL search projection boundary', () => {
  it('uses parameterized upserts and explicit removal for public content only', async () => {
    const calls: { text: string; values?: readonly unknown[] }[] = []
    const projection = new PostgresSearchProjection({
      query: async (text: string, values?: readonly unknown[]) => {
        calls.push({ text, values })
        return { command: '', fields: [], oid: 0, rowCount: 0, rows: [] }
      },
    })
    await projection.upsertPublishedArticle({
      articleId: 'article-search',
      publishedAt: '2026-07-17T21:00:00.000Z',
      searchText: 'Owner-controlled public text',
      slug: 'owner-controlled-search',
      title: 'Owner-controlled search',
    })
    await projection.removeArticle('article-search')

    expect(calls[0]?.text).toContain('ON CONFLICT (article_id) DO UPDATE')
    expect(calls[0]?.values).toEqual([
      'article-search',
      'owner-controlled-search',
      'Owner-controlled search',
      'Owner-controlled public text',
      '2026-07-17T21:00:00.000Z',
    ])
    expect(calls[1]).toEqual({
      text: 'DELETE FROM article_search_documents WHERE article_id = $1',
      values: ['article-search'],
    })
  })
})
