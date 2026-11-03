import type { OutboxEvent } from '../content/domain'
import type { ContentRepository, SearchProjection } from '../content/ports'
import { loadPublishedStory } from '../content/reader'
import { searchDocumentFor, type SearchDocument } from '../discovery/reindex'
import type { CacheRevalidator, OutboxHandler, OutboxHandlers } from './ports'

export interface OutboxHandlerDependencies {
  readonly cache: CacheRevalidator
  /** Where handlers read canonical content, in transactions of their own. */
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
  dependencies: Pick<OutboxHandlerDependencies, 'content' | 'search'>,
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

function payloadSlug(event: OutboxEvent, field: string): string {
  const value = event.payload[field]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`The ${event.type} event carries no ${field}.`)
  }
  return value
}

/**
 * Acknowledge-only: it records the publication's event as completed and does nothing else, so a
 * drain does not dead-letter every publication as an unsupported type. The email slice
 * (blog-0045.10) replaces it with the publication's email. The feed and the sitemap need no effect
 * here: the same publication's `cache.revalidate` event expires them.
 */
const acknowledgePublication: OutboxHandler = async () => undefined

/**
 * The handlers this phase registers. Search events and removals all bring the article's search
 * document in line with what readers see; cache events expire the cached views of the event's story
 * and every cached listing that may show it, the feed and the sitemap among them; a slug change
 * does both, for the old slug and the new one; a publication is only acknowledged.
 */
export function createOutboxHandlers(dependencies: OutboxHandlerDependencies): OutboxHandlers {
  const syncSearch: OutboxHandler = (event) => syncSearchDocument(dependencies, event.aggregateId)
  return new Map<string, OutboxHandler>([
    ['article.deleted', syncSearch],
    ['article.published', acknowledgePublication],
    [
      'article.slug-changed',
      async (event, context) => {
        const slugs = [payloadSlug(event, 'fromSlug'), payloadSlug(event, 'toSlug')]
        await syncSearch(event, context)
        await dependencies.cache.revalidate({ idempotencyKey: context.idempotencyKey, slugs })
      },
    ],
    ['article.unpublished', syncSearch],
    [
      'cache.revalidate',
      async (event, { idempotencyKey }) =>
        dependencies.cache.revalidate({ idempotencyKey, slugs: [payloadSlug(event, 'slug')] }),
    ],
    ['search.upsert', syncSearch],
  ])
}
