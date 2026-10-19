import type { Pool } from 'pg'
import { describe, expect, it, vi } from 'vitest'

import { PostgresContentRepository } from '../database/postgres-content-repository'
import { CURRENT_CONTENT_DOCUMENT_VERSION } from './document'
import type { AuthorProfile } from './domain'
import { InMemoryContentRepository } from './in-memory-repository'
import type { Clock } from './ports'
import { ContentService } from './service'

const createdAt = '2026-10-19T08:00:00.000Z'
const clock: Clock = { now: () => new Date(createdAt) }

function author(id: string, displayName: string): AuthorProfile {
  return {
    bio: `${displayName} writes about rooms.`,
    createdAt,
    displayName,
    id,
    slug: id,
    updatedAt: createdAt,
  }
}

const alpha = author('author-alpha', 'Alpha')
const bravo = author('author-bravo', 'Bravo')
const charlie = author('author-charlie', 'Charlie')

/** Three articles, created out of id order, one of them published, and three authors. */
async function fixture() {
  const repository = new InMemoryContentRepository()
  const service = new ContentService(repository, clock)
  const create = (id: string) =>
    service.createArticle({
      dek: 'A summary',
      document: {
        articleId: id,
        document: { content: [{ type: 'paragraph' }], type: 'doc' },
        migrationProvenance: [],
        schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
        title: 'A story',
      },
      id,
      idempotencyKey: `create-${id}`,
      slug: id,
      title: 'A story',
    })
  const essay = await create('article-essay')
  await create('article-draft')
  await create('article-other')
  await service.publish({
    articleId: essay.article.id,
    expectedVersion: essay.article.version,
    idempotencyKey: 'publish-essay',
    revisionId: essay.revision.id,
  })
  await repository.transaction(async (transaction) => {
    for (const profile of [charlie, alpha, bravo]) await transaction.saveAuthor(profile)
  })
  return {
    credited: (articleId: string) =>
      repository.inspect((transaction) => transaction.listArticleAuthors(articleId)),
    creditedIn: (authorId: string) =>
      repository.inspect((transaction) => transaction.listAuthorArticles(authorId)),
    setCredits: (articleId: string, authorIds: readonly string[]) =>
      repository.transaction((transaction) => transaction.setArticleAuthors(articleId, authorIds)),
  }
}

/** A pool whose one connection records each query and answers the two byline reads. */
function recordingPool(rows: { articles?: readonly object[]; authors?: readonly object[] } = {}) {
  const query = vi.fn(async (text: string, _values?: readonly unknown[]) => {
    const result = text.startsWith('SELECT authors.*')
      ? (rows.authors ?? [])
      : text.startsWith('SELECT articles.*')
        ? (rows.articles ?? [])
        : []
    return { rowCount: result.length, rows: result }
  })
  const release = vi.fn()
  const pool = { connect: vi.fn(async () => ({ query, release })) } as unknown as Pool
  return { query, release, repository: new PostgresContentRepository(pool) }
}

describe('article authors', () => {
  it('lists the authors of an article in the byline order they were set in', async () => {
    const { credited, setCredits } = await fixture()
    expect(await credited('article-essay')).toEqual([])

    await setCredits('article-essay', [charlie.id, alpha.id, bravo.id])

    expect(await credited('article-essay')).toEqual([charlie, alpha, bravo])
    expect(await credited('article-other')).toEqual([])
  })

  it('replaces the whole byline, and an empty list removes every credit', async () => {
    const { credited, creditedIn, setCredits } = await fixture()
    await setCredits('article-essay', [alpha.id, bravo.id])

    await setCredits('article-essay', [bravo.id, charlie.id])
    expect(await credited('article-essay')).toEqual([bravo, charlie])
    expect(await creditedIn(alpha.id)).toEqual([])

    await setCredits('article-essay', [])
    expect(await credited('article-essay')).toEqual([])
    expect(await creditedIn(bravo.id)).toEqual([])
  })

  it('lists every article that credits an author, whatever its status, in id order', async () => {
    const { creditedIn, setCredits } = await fixture()
    await setCredits('article-essay', [alpha.id, bravo.id])
    await setCredits('article-draft', [alpha.id])
    await setCredits('article-other', [charlie.id])

    expect((await creditedIn(alpha.id)).map(({ id, status }) => ({ id, status }))).toEqual([
      { id: 'article-draft', status: 'draft' },
      { id: 'article-essay', status: 'published' },
    ])
    expect((await creditedIn(bravo.id)).map(({ id }) => id)).toEqual(['article-essay'])
    expect(await creditedIn('author-unknown')).toEqual([])
  })

  it('refuses what the database keys refuse and keeps the byline it had', async () => {
    const { credited, setCredits } = await fixture()
    await setCredits('article-essay', [alpha.id])

    await expect(setCredits('article-essay', [bravo.id, bravo.id])).rejects.toThrow(
      'more than once',
    )
    await expect(setCredits('article-essay', [bravo.id, 'author-missing'])).rejects.toThrow(
      'author-missing',
    )
    await expect(setCredits('article-missing', [alpha.id])).rejects.toThrow('article-missing')
    expect(await credited('article-essay')).toEqual([alpha])
  })

  it('replaces a PostgreSQL byline with one delete and an insert per author, in order', async () => {
    const { query, release, repository } = recordingPool()

    await repository.transaction((transaction) =>
      transaction.setArticleAuthors('article-essay', [charlie.id, alpha.id]),
    )

    const insert =
      'INSERT INTO article_authors (article_id, author_id, position) VALUES ($1, $2, $3)'
    expect(query.mock.calls.filter(([text]) => text.includes('article_authors'))).toEqual([
      ['DELETE FROM article_authors WHERE article_id = $1', ['article-essay']],
      [insert, ['article-essay', charlie.id, 0]],
      [insert, ['article-essay', alpha.id, 1]],
    ])
    expect(query.mock.calls.at(-1)).toEqual(['COMMIT'])
    expect(release).toHaveBeenCalledOnce()
  })

  it('reads PostgreSQL bylines by position and the articles of an author by id', async () => {
    const authorRow = (profile: AuthorProfile) => ({
      bio: profile.bio,
      created_at: new Date(profile.createdAt),
      display_name: profile.displayName,
      id: profile.id,
      slug: profile.slug,
      updated_at: new Date(profile.updatedAt),
    })
    const { query, repository } = recordingPool({
      articles: [
        {
          created_at: new Date(createdAt),
          current_draft_revision_id: 'revision-essay',
          dek: 'A summary',
          deleted_at: null,
          id: 'article-essay',
          pre_delete_status: null,
          published_at: new Date(createdAt),
          published_revision_id: 'revision-essay',
          scheduled_at: null,
          scheduled_revision_id: null,
          slug: 'article-essay',
          status: 'published',
          title: 'A story',
          updated_at: new Date(createdAt),
          version: 2,
        },
      ],
      authors: [authorRow(charlie), authorRow(alpha)],
    })

    const [byline, articles] = await repository.transaction(
      async (transaction) =>
        [
          await transaction.listArticleAuthors('article-essay'),
          await transaction.listAuthorArticles(alpha.id),
        ] as const,
    )

    expect(byline).toEqual([charlie, alpha])
    expect(articles).toEqual([
      {
        createdAt,
        currentDraftRevisionId: 'revision-essay',
        deletedAt: null,
        dek: 'A summary',
        id: 'article-essay',
        preDeleteStatus: null,
        publishedAt: createdAt,
        publishedRevisionId: 'revision-essay',
        scheduledAt: null,
        scheduledRevisionId: null,
        slug: 'article-essay',
        status: 'published',
        title: 'A story',
        updatedAt: createdAt,
        version: 2,
      },
    ])
    expect(query).toHaveBeenCalledWith(
      expect.stringMatching(
        /^SELECT authors\.\* FROM article_authors\s+INNER JOIN authors ON authors\.id = article_authors\.author_id\s+WHERE article_authors\.article_id = \$1\s+ORDER BY article_authors\.position$/,
      ),
      ['article-essay'],
    )
    expect(query).toHaveBeenCalledWith(
      expect.stringMatching(
        /^SELECT articles\.\* FROM article_authors\s+INNER JOIN articles ON articles\.id = article_authors\.article_id\s+WHERE article_authors\.author_id = \$1\s+ORDER BY articles\.id$/,
      ),
      [alpha.id],
    )
  })
})
