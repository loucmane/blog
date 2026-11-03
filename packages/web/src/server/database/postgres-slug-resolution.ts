import type { QueryResultRow } from 'pg'

import type { SlugArticle, SlugHistory, SlugRedirectEdge } from '../distribution/slug-resolution'

/** The one call this adapter makes; a pg `Pool` provides it. */
export interface SlugHistoryClient {
  query<Row extends QueryResultRow = QueryResultRow>(
    text: string,
    values: readonly unknown[],
  ): Promise<{ readonly rows: readonly Row[] }>
}

interface ArticleRow extends QueryResultRow {
  readonly deleted: boolean
  readonly id: string
  readonly published: boolean
  readonly slug: string
}

interface RedirectRow extends QueryResultRow {
  readonly article_id: string
  readonly to_slug: string
}

const articleColumns =
  'id, slug, deleted_at IS NOT NULL AS deleted, published_at IS NOT NULL AS published'

function slugArticle(row: ArticleRow): SlugArticle {
  return { deleted: row.deleted, id: row.id, published: row.published, slug: row.slug }
}

/**
 * The slug history in PostgreSQL, one query per question. A redirect is found by its unique
 * `from_slug` and an article by its primary key. The articles at a slug include deleted ones,
 * which the active-slug index (`articles_active_slug_key`, partial on `deleted_at IS NULL`) does
 * not cover, so that query scans `articles`. It runs only for a slug no reader can see, and its
 * answer is cached with the rest (slug-resolution-cache.ts).
 */
export class PostgresSlugHistory implements SlugHistory {
  constructor(private readonly client: SlugHistoryClient) {}

  async article(id: string): Promise<SlugArticle | null> {
    const { rows } = await this.client.query<ArticleRow>(
      `SELECT ${articleColumns} FROM articles WHERE id = $1`,
      [id],
    )
    const row = rows[0]
    return row ? slugArticle(row) : null
  }

  async articlesAt(slug: string): Promise<readonly SlugArticle[]> {
    const { rows } = await this.client.query<ArticleRow>(
      `SELECT ${articleColumns} FROM articles WHERE slug = $1 ORDER BY id`,
      [slug],
    )
    return rows.map(slugArticle)
  }

  async redirectFrom(slug: string): Promise<SlugRedirectEdge | null> {
    const { rows } = await this.client.query<RedirectRow>(
      'SELECT article_id, to_slug FROM slug_redirects WHERE from_slug = $1',
      [slug],
    )
    const row = rows[0]
    return row ? { articleId: row.article_id, toSlug: row.to_slug } : null
  }
}
