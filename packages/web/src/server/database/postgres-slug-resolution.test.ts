import type { QueryResultRow } from 'pg'
import { describe, expect, it } from 'vitest'

import { PostgresSlugHistory } from './postgres-slug-resolution'

function fakeClient(...results: readonly (readonly Record<string, unknown>[])[]) {
  const calls: { text: string; values: readonly unknown[] }[] = []
  const queue = [...results]
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

const articleColumns =
  'id, slug, deleted_at IS NOT NULL AS deleted, published_at IS NOT NULL AS published'

describe('PostgreSQL slug history boundary', () => {
  it('reads an article by its primary key, deleted or not', async () => {
    const { calls, client } = fakeClient(
      [{ deleted: true, id: 'article-one', published: true, slug: 'winter-light' }],
      [],
    )
    const history = new PostgresSlugHistory(client)

    expect(await history.article('article-one')).toEqual({
      deleted: true,
      id: 'article-one',
      published: true,
      slug: 'winter-light',
    })
    expect(await history.article('article-missing')).toBeNull()
    expect(calls).toEqual([
      { text: `SELECT ${articleColumns} FROM articles WHERE id = $1`, values: ['article-one'] },
      { text: `SELECT ${articleColumns} FROM articles WHERE id = $1`, values: ['article-missing'] },
    ])
  })

  it('lists every article that has a slug now, deleted ones included', async () => {
    const deleted = { deleted: true, id: 'article-old', published: true, slug: 'shared' }
    const current = { deleted: false, id: 'article-new', published: false, slug: 'shared' }
    const { calls, client } = fakeClient([current, deleted], [])
    const history = new PostgresSlugHistory(client)

    expect(await history.articlesAt('shared')).toEqual([current, deleted])
    expect(await history.articlesAt('nothing-here')).toEqual([])
    expect(calls[0]).toEqual({
      text: `SELECT ${articleColumns} FROM articles WHERE slug = $1 ORDER BY id`,
      values: ['shared'],
    })
    // Deleted articles keep their slugs: nothing filters on deleted_at.
    expect(calls[0]?.text).not.toMatch(/WHERE[\s\S]*deleted_at/)
  })

  it('finds the redirect leaving a slug by its unique from_slug', async () => {
    const { calls, client } = fakeClient([{ article_id: 'article-one', to_slug: 'new-slug' }], [])
    const history = new PostgresSlugHistory(client)

    expect(await history.redirectFrom('old-slug')).toEqual({
      articleId: 'article-one',
      toSlug: 'new-slug',
    })
    expect(await history.redirectFrom('never-left')).toBeNull()
    expect(calls).toEqual([
      {
        text: 'SELECT article_id, to_slug FROM slug_redirects WHERE from_slug = $1',
        values: ['old-slug'],
      },
      {
        text: 'SELECT article_id, to_slug FROM slug_redirects WHERE from_slug = $1',
        values: ['never-left'],
      },
    ])
  })
})
