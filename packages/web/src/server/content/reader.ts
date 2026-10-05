import type { Article, ArticleRevision } from './domain'
import { ContentNotFoundError } from './errors'
import type { ContentRepository, ContentTransaction } from './ports'

export interface ReaderStory {
  readonly article: Article
  readonly revision: ArticleRevision
}

/** A publicly visible article and the id of the revision readers may see. */
export interface VisibleArticle {
  readonly article: Article
  readonly revisionId: string
}

/** The revision readers may see for this article, or null while it is not publicly visible. */
async function visibleRevisionId(
  transaction: ContentTransaction,
  article: Article,
): Promise<string | null> {
  if (
    article.deletedAt !== null ||
    !['published', 'scheduled'].includes(article.status) ||
    article.publishedAt === null ||
    article.publishedRevisionId === null
  ) {
    return null
  }
  if (article.status === 'scheduled') {
    const activeJobs = (await transaction.listPublicationJobs(article.id)).filter(
      ({ status }) => status === 'pending' || status === 'claimed',
    )
    const activeJob = activeJobs[0]
    if (
      activeJobs.length !== 1 ||
      !activeJob ||
      activeJob.previousStatus !== 'published' ||
      activeJob.revisionId !== article.scheduledRevisionId ||
      activeJob.runAt !== article.scheduledAt
    ) {
      return null
    }
  }
  return article.publishedRevisionId
}

function newestFirst(left: VisibleArticle, right: VisibleArticle): number {
  const leftTime = Date.parse(left.article.publishedAt ?? '')
  const rightTime = Date.parse(right.article.publishedAt ?? '')
  return rightTime - leftTime || left.article.id.localeCompare(right.article.id)
}

/** Every publicly visible article, newest publication first, without loading revisions. */
export async function listVisibleArticles(
  transaction: ContentTransaction,
): Promise<readonly VisibleArticle[]> {
  const visible: VisibleArticle[] = []
  for (const article of await transaction.listArticles()) {
    const revisionId = await visibleRevisionId(transaction, article)
    if (revisionId !== null) visible.push({ article, revisionId })
  }
  return visible.sort(newestFirst)
}

export async function loadVisibleRevision(
  transaction: ContentTransaction,
  visible: VisibleArticle,
): Promise<ReaderStory> {
  const revision = await transaction.getRevision(visible.revisionId)
  if (!revision || revision.articleId !== visible.article.id) {
    throw new ContentNotFoundError('Published revision', visible.revisionId)
  }
  return { article: visible.article, revision }
}

/** The published revision of one publicly visible story, or null when readers may not see it. */
export async function loadPublishedStory(
  transaction: ContentTransaction,
  slug: string,
): Promise<ReaderStory | null> {
  const article = await transaction.getArticleBySlug(slug)
  if (!article) return null
  const revisionId = await visibleRevisionId(transaction, article)
  return revisionId === null ? null : loadVisibleRevision(transaction, { article, revisionId })
}

/** Every publicly visible story with its published revision, newest publication first. */
export async function listPublishedStories(
  transaction: ContentTransaction,
): Promise<readonly ReaderStory[]> {
  const stories: ReaderStory[] = []
  for (const visible of await listVisibleArticles(transaction)) {
    stories.push(await loadVisibleRevision(transaction, visible))
  }
  return stories
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
    return this.repository.transaction((transaction) => loadPublishedStory(transaction, slug))
  }

  async listPublished(): Promise<readonly ReaderStory[]> {
    return this.repository.transaction((transaction) => listPublishedStories(transaction))
  }
}
