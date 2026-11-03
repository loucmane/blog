import { describe, expect, it, vi } from 'vitest'

import {
  CURRENT_CONTENT_DOCUMENT_VERSION,
  extractContentText,
  type ContentDocument,
} from '../content/document'
import type { Article, ArticleRevision } from '../content/domain'
import { InMemoryContentRepository } from '../content/in-memory-repository'
import type { Clock, IdentifierSource } from '../content/ports'
import { ContentService } from '../content/service'
import {
  defaultReindexPageSize,
  reindexSearchDocuments,
  searchDocumentFor,
  type ReindexConnection,
} from './reindex'

class TestClock implements Clock {
  constructor(private value: Date) {}

  set(iso: string) {
    this.value = new Date(iso)
  }

  now(): Date {
    return new Date(this.value)
  }
}

class TestIdentifiers implements IdentifierSource {
  private sequence = 0

  next(kind: string): string {
    this.sequence += 1
    return `${kind}-${this.sequence}`
  }
}

function document(articleId: string, title: string, text: string): ContentDocument {
  return {
    articleId,
    document: { content: [{ content: [{ text, type: 'text' }], type: 'paragraph' }], type: 'doc' },
    migrationProvenance: [],
    schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
    title,
  }
}

function recordingPool(refuse?: string) {
  const statements: string[] = []
  const staged: unknown[][] = []
  const release = vi.fn()
  const connection: ReindexConnection = {
    query: async (text: string, values?: unknown[]) => {
      statements.push(text.split('\n', 1)[0] ?? '')
      if (refuse && text.startsWith(refuse)) throw new Error(`refused: ${refuse}`)
      if (text.startsWith('INSERT INTO article_search_documents_rebuild')) staged.push(values ?? [])
      return {
        command: '',
        fields: [],
        oid: 0,
        rowCount: text.startsWith('INSERT INTO article_search_documents\n') ? 3 : 0,
        rows: text.includes('AS changed') ? [{ changed: 1 }] : [],
      } as never
    },
    release,
  }
  return { connect: vi.fn(async () => connection), release, staged, statements }
}

/** Five articles: three that readers see and two they do not. */
async function canonicalContent() {
  const clock = new TestClock(new Date('2026-11-03T09:00:00.000Z'))
  const repository = new InMemoryContentRepository()
  const content = new ContentService(repository, clock, new TestIdentifiers())
  const create = (slug: string) =>
    content.createArticle({
      dek: `About ${slug}`,
      document: document(`article-${slug}`, `${slug} title`, `Published words about ${slug}.`),
      id: `article-${slug}`,
      idempotencyKey: `create-${slug}`,
      slug,
      title: `${slug} title`,
    })
  const publish = async (slug: string, at: string) => {
    clock.set(at)
    const created = await create(slug)
    return content.publish({
      articleId: created.article.id,
      expectedVersion: created.article.version,
      idempotencyKey: `publish-${slug}`,
      revisionId: created.revision.id,
    })
  }
  const draft = (published: { article: Article }, title: string) =>
    content.saveDraft({
      articleId: published.article.id,
      document: document(published.article.id, title, 'secretmarker draft words'),
      expectedVersion: published.article.version,
      idempotencyKey: `draft-${published.article.id}`,
      title,
    })

  const alpha = await publish('alpha', '2026-11-03T09:00:00.000Z')
  await draft(alpha, 'Alpha draft title')
  await create('bravo')
  const charlie = await publish('charlie', '2026-11-03T09:01:00.000Z')
  await content.unpublish({
    articleId: charlie.article.id,
    expectedVersion: charlie.article.version,
    idempotencyKey: 'unpublish-charlie',
    reason: 'Reindex proof',
  })
  // A published story with a newer revision scheduled stays visible with its published copy.
  const delta = await publish('delta', '2026-11-03T09:02:00.000Z')
  const deltaDraft = await draft(delta, 'Delta draft title')
  await content.schedulePublication({
    articleId: delta.article.id,
    expectedVersion: deltaDraft.article.version,
    idempotencyKey: 'schedule-delta',
    revisionId: deltaDraft.revision.id,
    runAt: '2026-12-01T09:00:00.000Z',
    timeZone: 'Europe/Stockholm',
  })
  await publish('echo', '2026-11-03T09:03:00.000Z')
  return repository
}

const words = (slug: string) =>
  extractContentText(document(`article-${slug}`, `${slug} title`, `Published words about ${slug}.`))

describe('full search reindex', () => {
  it('stages what readers see in pages and swaps it in one transaction', async () => {
    const pool = recordingPool()

    const report = await reindexSearchDocuments({
      content: await canonicalContent(),
      pageSize: 2,
      pool,
    })

    expect(report).toEqual({ articles: 5, changed: 1, documents: 3 })
    expect(pool.statements).toEqual([
      'CREATE TEMP TABLE article_search_documents_rebuild (',
      'INSERT INTO article_search_documents_rebuild',
      'INSERT INTO article_search_documents_rebuild',
      'INSERT INTO article_search_documents_rebuild',
      'BEGIN',
      'LOCK TABLE article_search_documents IN EXCLUSIVE MODE',
      'SELECT count(*)::int AS changed',
      'DELETE FROM article_search_documents AS live',
      'INSERT INTO article_search_documents',
      'COMMIT',
      'DROP TABLE IF EXISTS article_search_documents_rebuild',
    ])
    // Newest publication first; each article at the version that was read.
    expect(pool.staged).toEqual([
      [
        ['article-echo', 'article-delta'],
        [2, 4],
        ['echo', 'delta'],
        ['echo title', 'delta title'],
        [words('echo'), words('delta')],
        ['2026-11-03T09:03:00.000Z', '2026-11-03T09:02:00.000Z'],
      ],
      [
        ['article-alpha'],
        [3],
        ['alpha'],
        ['alpha title'],
        [words('alpha')],
        ['2026-11-03T09:00:00.000Z'],
      ],
      [
        ['article-bravo', 'article-charlie'],
        [1, 3],
        [null, null],
        [null, null],
        [null, null],
        [null, null],
      ],
    ])
    expect(JSON.stringify(pool.staged)).not.toMatch(/secretmarker|draft title/)
    expect(pool.release).toHaveBeenCalledWith(false)
  })

  it('rolls the swap back, drops the shadow table and returns the connection when the swap fails', async () => {
    const pool = recordingPool('LOCK TABLE')

    await expect(
      reindexSearchDocuments({ content: await canonicalContent(), pool }),
    ).rejects.toThrow('refused: LOCK TABLE')

    expect(pool.statements.slice(-3)).toEqual([
      'LOCK TABLE article_search_documents IN EXCLUSIVE MODE',
      'ROLLBACK',
      'DROP TABLE IF EXISTS article_search_documents_rebuild',
    ])
    expect(pool.release).toHaveBeenCalledWith(false)
  })

  it('closes a connection that may still hold the shadow table instead of returning it', async () => {
    const pool = recordingPool('DROP TABLE')

    await expect(
      reindexSearchDocuments({ content: new InMemoryContentRepository(), pool }),
    ).resolves.toEqual({ articles: 0, changed: 1, documents: 3 })

    expect(pool.release).toHaveBeenCalledWith(true)
  })

  it('refuses an unusable page size before touching the database', async () => {
    const pool = recordingPool()

    for (const pageSize of [0, 2.5, 1_001]) {
      await expect(
        reindexSearchDocuments({ content: new InMemoryContentRepository(), pageSize, pool }),
      ).rejects.toThrow(RangeError)
    }
    expect(pool.connect).not.toHaveBeenCalled()
    expect(defaultReindexPageSize).toBe(50)
  })

  it('takes the published revision title, or its document title when that is blank', () => {
    const article = { id: 'article-copy', publishedAt: '2026-11-03T09:00:00.000Z', slug: 'copy' }
    const revision = {
      document: document('article-copy', 'Document title', 'Body words.'),
      title: '  ',
    }

    expect(
      searchDocumentFor({
        article: article as Article,
        revision: revision as ArticleRevision,
      }),
    ).toEqual({
      articleId: 'article-copy',
      publishedAt: '2026-11-03T09:00:00.000Z',
      searchText: 'Document title Body words.',
      slug: 'copy',
      title: 'Document title',
    })
    expect(() =>
      searchDocumentFor({
        article: { ...article, publishedAt: null } as Article,
        revision: revision as ArticleRevision,
      }),
    ).toThrow('The visible article article-copy has no publication time.')
  })
})
