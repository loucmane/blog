import type { Pool } from 'pg'
import { describe, expect, it, vi } from 'vitest'

import { PostgresContentRepository } from './postgres-content-repository'

const createdAt = '2026-10-19T08:00:00.000Z'

/** A pool whose one connection records each query and answers author reads with `authors`. */
function recordingPool(authors: readonly object[]) {
  const query = vi.fn(async (text: string, _values?: readonly unknown[]) => {
    const rows = text.startsWith('SELECT * FROM authors') ? authors : []
    return { rowCount: rows.length, rows }
  })
  const release = vi.fn()
  const pool = { connect: vi.fn(async () => ({ query, release })) } as unknown as Pool
  return { query, release, repository: new PostgresContentRepository(pool) }
}

describe('PostgreSQL content repository', () => {
  it('finds an author by slug with one query on the unique slug index', async () => {
    const { query, release, repository } = recordingPool([
      {
        bio: 'Alpha writes about rooms.',
        created_at: new Date(createdAt),
        display_name: 'Alpha',
        id: 'author-alpha',
        slug: 'alpha',
        updated_at: new Date(createdAt),
      },
    ])

    const author = await repository.transaction((transaction) =>
      transaction.getAuthorBySlug('alpha'),
    )

    expect(author).toEqual({
      bio: 'Alpha writes about rooms.',
      createdAt,
      displayName: 'Alpha',
      id: 'author-alpha',
      slug: 'alpha',
      updatedAt: createdAt,
    })
    expect(query.mock.calls.filter(([text]) => text.includes('authors'))).toEqual([
      ['SELECT * FROM authors WHERE slug = $1', ['alpha']],
    ])
    expect(query.mock.calls.at(-1)).toEqual(['COMMIT'])
    expect(release).toHaveBeenCalledOnce()
  })

  it('finds no author for an unknown slug', async () => {
    const { repository } = recordingPool([])

    expect(
      await repository.transaction((transaction) => transaction.getAuthorBySlug('unknown')),
    ).toBeNull()
  })
})
