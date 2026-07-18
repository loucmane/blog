import type { Article, ArticleRevision } from './domain'
import { ContentNotFoundError } from './errors'
import type { ContentRepository } from './ports'

export interface ReaderStory {
  readonly article: Article
  readonly revision: ArticleRevision
}

export class ContentReader {
  constructor(private readonly repository: ContentRepository) {}

  async loadPreview(articleId: string): Promise<ReaderStory | null> {
    return this.repository.transaction(async (transaction) => {
      const article = await transaction.getArticle(articleId)
      if (!article || article.deletedAt !== null) return null
      const revision = await transaction.getRevision(article.currentDraftRevisionId)
      if (!revision || revision.articleId !== article.id) {
        throw new ContentNotFoundError('Current draft revision', article.currentDraftRevisionId)
      }
      return { article, revision }
    })
  }

  async loadPublished(slug: string): Promise<ReaderStory | null> {
    return this.repository.transaction(async (transaction) => {
      const article = await transaction.getArticleBySlug(slug)
      if (
        !article ||
        article.deletedAt !== null ||
        article.status !== 'published' ||
        article.publishedAt === null ||
        article.publishedRevisionId === null
      ) {
        return null
      }
      const revision = await transaction.getRevision(article.publishedRevisionId)
      if (!revision || revision.articleId !== article.id) {
        throw new ContentNotFoundError('Published revision', article.publishedRevisionId)
      }
      return { article, revision }
    })
  }
}
