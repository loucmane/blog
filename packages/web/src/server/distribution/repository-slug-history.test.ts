import { describe, expect, it } from 'vitest'

import type { Article } from '@/server/content/domain'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'

import { RepositorySlugHistory } from './repository-slug-history'

const time = '2026-07-17T20:00:00.000Z'

function article(id: string, slug: string, changes: Partial<Article> = {}): Article {
  return {
    createdAt: time,
    currentDraftRevisionId: `${id}-revision`,
    deletedAt: null,
    dek: '',
    id,
    preDeleteStatus: null,
    publishedAt: null,
    publishedRevisionId: null,
    scheduledAt: null,
    scheduledRevisionId: null,
    slug,
    status: 'draft',
    title: slug,
    updatedAt: time,
    version: 1,
    ...changes,
  }
}

/** History reads article rows only, so the rows go in without revisions. */
async function storeWith(articles: readonly Article[]) {
  const repository = new InMemoryContentRepository()
  await repository.transaction(async (transaction) => {
    for (const saved of articles) await transaction.saveArticle(saved, null)
  })
  return repository
}

describe('repository slug history', () => {
  it('reads an article by id, deleted or not, with whether it was ever published', async () => {
    const history = new RepositorySlugHistory(
      await storeWith([
        article('article-draft', 'a-draft'),
        article('article-deleted', 'a-deleted', {
          deletedAt: time,
          preDeleteStatus: 'published',
          publishedAt: time,
          publishedRevisionId: 'article-deleted-revision',
          status: 'unpublished',
        }),
      ]),
    )

    expect(await history.article('article-draft')).toEqual({
      deleted: false,
      id: 'article-draft',
      published: false,
      slug: 'a-draft',
    })
    expect(await history.article('article-deleted')).toEqual({
      deleted: true,
      id: 'article-deleted',
      published: true,
      slug: 'a-deleted',
    })
    expect(await history.article('article-missing')).toBeNull()
  })

  it('lists the articles that have a slug now, deleted ones included', async () => {
    const history = new RepositorySlugHistory(
      await storeWith([
        article('article-draft', 'never-published'),
        article('article-withdrawn', 'withdrawn', {
          publishedAt: time,
          publishedRevisionId: 'article-withdrawn-revision',
          status: 'unpublished',
        }),
        article('article-deleted', 'deleted', {
          deletedAt: time,
          preDeleteStatus: 'published',
          publishedAt: time,
          publishedRevisionId: 'article-deleted-revision',
          status: 'unpublished',
        }),
      ]),
    )

    expect(await history.articlesAt('withdrawn')).toEqual([
      { deleted: false, id: 'article-withdrawn', published: true, slug: 'withdrawn' },
    ])
    expect(await history.articlesAt('deleted')).toEqual([
      { deleted: true, id: 'article-deleted', published: true, slug: 'deleted' },
    ])
    expect(await history.articlesAt('never-published')).toEqual([
      { deleted: false, id: 'article-draft', published: false, slug: 'never-published' },
    ])
    expect(await history.articlesAt('nothing-here')).toEqual([])
  })

  it('answers a slug with its newest redirect, the latest rename from it', async () => {
    const repository = await storeWith([article('article-moved', 'third')])
    await repository.transaction(async (transaction) => {
      // PostgreSQL keeps one redirect per slug; the in-memory store keeps both of these.
      for (const [id, fromSlug, toSlug] of [
        ['redirect-1', 'first', 'second'],
        ['redirect-2', 'second', 'first'],
        ['redirect-3', 'first', 'third'],
      ] as const) {
        await transaction.saveRedirect({
          articleId: 'article-moved',
          createdAt: time,
          fromSlug,
          id,
          toSlug,
        })
      }
    })
    const history = new RepositorySlugHistory(repository)

    expect(await history.redirectFrom('first')).toEqual({
      articleId: 'article-moved',
      toSlug: 'third',
    })
    expect(await history.redirectFrom('second')).toEqual({
      articleId: 'article-moved',
      toSlug: 'first',
    })
    expect(await history.redirectFrom('third')).toBeNull()
  })
})
