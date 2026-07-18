import type { SearchProjection } from '../content/ports'

export interface ParameterizedQuery {
  query(text: string, values: readonly unknown[]): Promise<unknown>
}

export class PostgresSearchProjection implements SearchProjection {
  constructor(private readonly pool: ParameterizedQuery) {}

  async removeArticle(articleId: string): Promise<void> {
    await this.pool.query('DELETE FROM article_search_documents WHERE article_id = $1', [articleId])
  }

  async upsertPublishedArticle(input: {
    articleId: string
    publishedAt: string
    searchText: string
    slug: string
    title: string
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO article_search_documents
        (article_id, slug, title, search_text, published_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $5)
       ON CONFLICT (article_id) DO UPDATE SET
         slug = EXCLUDED.slug,
         title = EXCLUDED.title,
         search_text = EXCLUDED.search_text,
         published_at = EXCLUDED.published_at,
         updated_at = EXCLUDED.updated_at`,
      [input.articleId, input.slug, input.title, input.searchText, input.publishedAt],
    )
  }
}
