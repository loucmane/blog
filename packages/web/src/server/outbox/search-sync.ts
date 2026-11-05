import type { ContentRepository, SearchProjection } from '../content/ports'
import { loadPublishedStory } from '../content/reader'
import { searchDocumentFor, type SearchDocument } from '../discovery/reindex'

/**
 * Search synchronisation, kept apart from handlers.ts so code that only needs search (the shared
 * exclusion suite, for one) need not import the module that can send email.
 */
export interface SearchSyncDependencies {
  readonly content: ContentRepository
  readonly search: SearchProjection
}

const maxSearchSyncPasses = 3

async function readSearchDocument(
  content: ContentRepository,
  articleId: string,
): Promise<{ readonly document: SearchDocument | null; readonly version: number | null }> {
  return content.transaction(async (transaction) => {
    const article = await transaction.getArticle(articleId)
    if (!article) return { document: null, version: null }
    const story = await loadPublishedStory(transaction, article.slug)
    if (story?.article.id !== articleId) return { document: null, version: article.version }
    return { document: searchDocumentFor(story), version: story.article.version }
  })
}

async function articleVersion(content: ContentRepository, articleId: string) {
  return content.transaction(
    async (transaction) => (await transaction.getArticle(articleId))?.version ?? null,
  )
}

/**
 * Brings one article's search document in line with what readers may see: its published copy
 * while the article is publicly visible, and no document otherwise. Every event that can change
 * that runs it, so a late, repeated or out-of-order event leaves the right document behind. A
 * dispatcher running another event of the same article may write after this one; so when the
 * article changed while its document was written, the document is written again.
 */
export async function syncSearchDocument(
  dependencies: SearchSyncDependencies,
  articleId: string,
): Promise<void> {
  for (let pass = 0; pass < maxSearchSyncPasses; pass += 1) {
    const read = await readSearchDocument(dependencies.content, articleId)
    if (read.document) await dependencies.search.upsertPublishedArticle(read.document)
    else await dependencies.search.removeArticle(articleId)
    if ((await articleVersion(dependencies.content, articleId)) === read.version) return
  }
  throw new Error(`Article ${articleId} kept changing while its search document was written.`)
}
