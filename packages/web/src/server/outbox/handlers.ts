import type { OutboxEvent } from '../content/domain'
import type { ContentRepository, SearchProjection } from '../content/ports'
import { loadPublishedStory } from '../content/reader'
import { searchDocumentFor, type SearchDocument } from '../discovery/reindex'
import { confirmationMessage, issueMessage } from '../email/messages'
import { emailDeliveryFor, type EmailDeliveryDependencies } from '../email/runtime'
import type { CacheRevalidator, OutboxHandler, OutboxHandlers } from './ports'

export interface OutboxHandlerDependencies {
  readonly cache: CacheRevalidator
  /** Where handlers read canonical content, in transactions of their own. */
  readonly content: ContentRepository
  /** Explicitly supply subscriptions when dispatching against a store outside the app runtime. */
  readonly email?: EmailDeliveryDependencies
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
 * drain does not dead-letter every publication as an unsupported type. Email is dispatched only
 * for an explicit email event, one per recipient. The feed and sitemap are expired by the same
 * publication's `cache.revalidate` event.
 */
const acknowledgePublication: OutboxHandler = async () => undefined

function emailHandler(
  dependencies: OutboxHandlerDependencies,
  kind: 'confirmation' | 'issue',
): OutboxHandler {
  return async (event, context) => {
    context.signal.throwIfAborted()
    const email = dependencies.email ?? emailDeliveryFor(dependencies.content)
    const message =
      kind === 'confirmation'
        ? await confirmationMessage(email, event)
        : await issueMessage(email, dependencies.content, event)
    context.signal.throwIfAborted()
    if (!message) return
    try {
      await email.sender.send(
        {
          ...message,
          ...(context.correlationId ? { correlationId: context.correlationId } : {}),
          signal: context.signal,
        },
        event.id,
      )
    } catch {
      // Adapter responses can contain addresses or signed links. Persist only a safe category.
      throw new Error('Email delivery failed; the dispatcher will retry within its attempt budget.')
    }
  }
}

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
    ['email.subscription-confirm', emailHandler(dependencies, 'confirmation')],
    ['email.issue', emailHandler(dependencies, 'issue')],
    [
      'cache.revalidate',
      async (event, { idempotencyKey }) =>
        dependencies.cache.revalidate({ idempotencyKey, slugs: [payloadSlug(event, 'slug')] }),
    ],
    ['search.upsert', syncSearch],
  ])
}
