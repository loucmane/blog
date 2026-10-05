import type {
  Article,
  ArticleRevision,
  AuditEvent,
  DraftAutosave,
  MediaAsset,
  PublicationSettings,
} from '@/server/content/domain'
import { ContentNotFoundError } from '@/server/content/errors'
import type { ContentRepository } from '@/server/content/ports'

export interface OwnerStoryWorkspace {
  readonly article: Article
  readonly autosaves: readonly DraftAutosave[]
  readonly auditEvents: readonly AuditEvent[]
  readonly currentRevision: ArticleRevision
  readonly revisions: readonly ArticleRevision[]
}

export class OwnerWorkspaceService {
  constructor(private readonly repository: ContentRepository) {}

  async listStories(): Promise<readonly Article[]> {
    return this.repository.transaction(async (transaction) => {
      const articles = await transaction.listArticles()
      return [...articles].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    })
  }

  async loadStory(articleId: string): Promise<OwnerStoryWorkspace> {
    return this.repository.transaction(async (transaction) => {
      const article = await transaction.getArticle(articleId)
      if (!article) throw new ContentNotFoundError('Article', articleId)
      const currentRevision = await transaction.getRevision(article.currentDraftRevisionId)
      if (!currentRevision || currentRevision.articleId !== article.id) {
        throw new ContentNotFoundError('Current draft revision', article.currentDraftRevisionId)
      }
      const [autosaves, auditEvents, revisions] = await Promise.all([
        transaction.listAutosaves(article.id),
        transaction.listAuditEvents(article.id),
        transaction.listRevisions(article.id),
      ])
      return {
        article,
        autosaves: [...autosaves].sort((left, right) =>
          right.createdAt.localeCompare(left.createdAt),
        ),
        auditEvents: [...auditEvents].sort((left, right) =>
          right.createdAt.localeCompare(left.createdAt),
        ),
        currentRevision,
        revisions: [...revisions].sort((left, right) => right.revisionNumber - left.revisionNumber),
      }
    })
  }

  async listMedia(): Promise<readonly MediaAsset[]> {
    return this.repository.transaction(async (transaction) =>
      [...(await transaction.listMediaAssets())].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      ),
    )
  }

  async publicationSettings(): Promise<PublicationSettings | null> {
    return this.repository.transaction((transaction) => transaction.getPublicationSettings())
  }
}
