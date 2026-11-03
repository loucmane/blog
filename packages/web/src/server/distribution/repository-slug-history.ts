import type { Article } from '@/server/content/domain'
import type { ContentRepository } from '@/server/content/ports'

import type { SlugArticle, SlugHistory, SlugRedirectEdge } from './slug-resolution'

function slugArticle(article: Article): SlugArticle {
  return {
    deleted: article.deletedAt !== null,
    id: article.id,
    published: article.publishedAt !== null,
    slug: article.slug,
  }
}

/**
 * The slug history of any content repository, read through its transactions. The in-memory store
 * uses it; PostgreSQL has `PostgresSlugHistory`, which answers each question with one query
 * instead of listing articles and redirects.
 */
export class RepositorySlugHistory implements SlugHistory {
  constructor(private readonly repository: ContentRepository) {}

  article(id: string): Promise<SlugArticle | null> {
    return this.repository.transaction(async (transaction) => {
      const article = await transaction.getArticle(id)
      return article && slugArticle(article)
    })
  }

  articlesAt(slug: string): Promise<readonly SlugArticle[]> {
    return this.repository.transaction(async (transaction) =>
      (await transaction.listArticles())
        .filter((article) => article.slug === slug)
        .map(slugArticle),
    )
  }

  /**
   * PostgreSQL keeps one redirect per slug left (slug_redirects.from_slug is unique). The in-memory
   * store does not enforce that, so its newest redirect from the slug, the latest rename, answers.
   */
  redirectFrom(slug: string): Promise<SlugRedirectEdge | null> {
    return this.repository.transaction(async (transaction) => {
      const redirect = (await transaction.listRedirects())
        .filter(({ fromSlug }) => fromSlug === slug)
        .at(-1)
      return redirect ? { articleId: redirect.articleId, toSlug: redirect.toSlug } : null
    })
  }
}
