import type { QueryResult, QueryResultRow } from 'pg'

import { extractContentText } from '../content/document'
import type { ContentRepository, SearchProjection } from '../content/ports'
import { listVisibleArticles, loadVisibleRevision, type ReaderStory } from '../content/reader'

/** One search document, as the search projection stores it. */
export type SearchDocument = Parameters<SearchProjection['upsertPublishedArticle']>[0]

/**
 * The search document of a story readers can see: the published revision's own title and text,
 * never the article's newer draft fields, under the article's current slug.
 */
export function searchDocumentFor({ article, revision }: ReaderStory): SearchDocument {
  if (article.publishedAt === null) {
    throw new Error(`The visible article ${article.id} has no publication time.`)
  }
  return {
    articleId: article.id,
    publishedAt: article.publishedAt,
    searchText: extractContentText(revision.document),
    slug: article.slug,
    title: revision.title?.trim() || revision.document.title,
  }
}

/** The calls a rebuild makes on its one connection; a pg `PoolClient` provides them. */
export interface ReindexConnection {
  query<Row extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<Row>>
  /** Returns the connection to its pool, or closes it when `destroy` is true. */
  release(destroy?: boolean): void
}

export interface ReindexPool {
  connect(): Promise<ReindexConnection>
}

export interface SearchReindexReport {
  /** The articles the rebuild read, visible to readers or not. */
  readonly articles: number
  /**
   * The articles that changed after the rebuild read them. Each change queued an outbox event, so
   * their documents stay as the dispatcher keeps them.
   */
  readonly changed: number
  /** The search documents the swap put in place. */
  readonly documents: number
}

export const defaultReindexPageSize = 50
const maxReindexPageSize = 1_000

/** One article as the rebuild read it: its version, and its document while readers can see it. */
interface RebuiltArticle {
  readonly articleId: string
  readonly document: SearchDocument | null
  readonly version: number
}

// A temporary table belongs to the rebuild's own session: nothing else sees it, and it is gone
// when the session ends, even when the rebuild does not finish.
const createShadow = `CREATE TEMP TABLE article_search_documents_rebuild (
  article_id text PRIMARY KEY,
  article_version integer NOT NULL,
  slug text,
  title text,
  search_text text,
  published_at timestamptz
)`

const stagePage = `INSERT INTO article_search_documents_rebuild
  (article_id, article_version, slug, title, search_text, published_at)
SELECT * FROM unnest(
  $1::text[], $2::integer[], $3::text[], $4::text[], $5::text[], $6::timestamptz[]
)`

const countChanged = `SELECT count(*)::int AS changed
FROM article_search_documents_rebuild AS rebuilt
LEFT JOIN articles ON articles.id = rebuilt.article_id
WHERE articles.version IS DISTINCT FROM rebuilt.article_version`

const removeReplaced = `DELETE FROM article_search_documents AS live
USING article_search_documents_rebuild AS rebuilt, articles
WHERE live.article_id = rebuilt.article_id
  AND articles.id = rebuilt.article_id
  AND articles.version = rebuilt.article_version`

// updated_at takes the publication time, as the search projection writes it.
const insertRebuilt = `INSERT INTO article_search_documents
  (article_id, slug, title, search_text, published_at, updated_at)
SELECT rebuilt.article_id, rebuilt.slug, rebuilt.title, rebuilt.search_text,
  rebuilt.published_at, rebuilt.published_at
FROM article_search_documents_rebuild AS rebuilt
JOIN articles
  ON articles.id = rebuilt.article_id AND articles.version = rebuilt.article_version
WHERE rebuilt.search_text IS NOT NULL`

function pages<T>(items: readonly T[], size: number): T[][] {
  const result: T[][] = []
  for (let start = 0; start < items.length; start += size) {
    result.push(items.slice(start, start + size))
  }
  return result
}

async function readArticles(
  content: ContentRepository,
  pageSize: number,
): Promise<{ readonly articles: number; readonly pages: readonly RebuiltArticle[][] }> {
  // Every version is read before visibility is decided, so an article that changes between the
  // two reads is recorded at its older version, which the swap then finds out of date.
  const { versions, visible } = await content.transaction(async (transaction) => {
    const versions = new Map(
      (await transaction.listArticles()).map(({ id, version }) => [id, version]),
    )
    return { versions, visible: await listVisibleArticles(transaction) }
  })
  const rebuilt: RebuiltArticle[][] = []
  for (const page of pages(visible, pageSize)) {
    rebuilt.push(
      await content.transaction(async (transaction) => {
        const documents: RebuiltArticle[] = []
        for (const article of page) {
          const story = await loadVisibleRevision(transaction, article)
          documents.push({
            articleId: story.article.id,
            document: searchDocumentFor(story),
            version: story.article.version,
          })
        }
        return documents
      }),
    )
  }
  const visibleIds = new Set(visible.map(({ article }) => article.id))
  const hidden = [...versions]
    .filter(([id]) => !visibleIds.has(id))
    .map(([articleId, version]): RebuiltArticle => ({ articleId, document: null, version }))
  rebuilt.push(...pages(hidden, pageSize))
  return { articles: new Set([...versions.keys(), ...visibleIds]).size, pages: rebuilt }
}

async function stage(connection: ReindexConnection, page: readonly RebuiltArticle[]) {
  await connection.query(stagePage, [
    page.map(({ articleId }) => articleId),
    page.map(({ version }) => version),
    page.map(({ document }) => document?.slug ?? null),
    page.map(({ document }) => document?.title ?? null),
    page.map(({ document }) => document?.searchText ?? null),
    page.map(({ document }) => document?.publishedAt ?? null),
  ])
}

async function dropShadow(connection: ReindexConnection): Promise<boolean> {
  try {
    await connection.query('DROP TABLE IF EXISTS article_search_documents_rebuild')
    return true
  } catch {
    return false
  }
}

/**
 * Rebuilds every search document from canonical content. The documents of what readers can see
 * are staged, a page at a time, in the shadow table `article_search_documents_rebuild`, and one
 * transaction swaps them in. That transaction holds the search table's EXCLUSIVE lock, which
 * lets searches go on reading the old documents until it commits and makes projection writes
 * wait for it, so no search ever sees part of a corpus. Only articles unchanged since they were
 * read are swapped; one changed since then has an outbox event that brings its document up to
 * date, and the rebuild leaves that document alone.
 */
export async function reindexSearchDocuments(input: {
  readonly content: ContentRepository
  readonly pageSize?: number
  readonly pool: ReindexPool
}): Promise<SearchReindexReport> {
  const pageSize = input.pageSize ?? defaultReindexPageSize
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > maxReindexPageSize) {
    throw new RangeError(`A reindex page holds between 1 and ${maxReindexPageSize} articles.`)
  }
  const connection = await input.pool.connect()
  try {
    await connection.query(createShadow)
    const read = await readArticles(input.content, pageSize)
    for (const page of read.pages) await stage(connection, page)
    await connection.query('BEGIN')
    try {
      await connection.query('LOCK TABLE article_search_documents IN EXCLUSIVE MODE')
      const changed = await connection.query<{ changed: number }>(countChanged)
      await connection.query(removeReplaced)
      const inserted = await connection.query(insertRebuilt)
      await connection.query('COMMIT')
      return {
        articles: read.articles,
        changed: changed.rows[0]?.changed ?? 0,
        documents: inserted.rowCount ?? 0,
      }
    } catch (error) {
      await connection.query('ROLLBACK')
      throw error
    }
  } finally {
    // A connection that still holds the shadow table is closed, not handed back to the pool.
    connection.release(!(await dropShadow(connection)))
  }
}
