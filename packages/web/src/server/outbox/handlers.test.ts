import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET as getFeed } from '@/app/feed.xml/route'
import { GET as getSitemapPage } from '@/app/sitemaps/[page]/route'
import { expirePublicReader } from '@/reader/cache'
import { resolveReaderStore } from '@/reader/store'

import { dataCache } from '../../../tests/support/data-cache'
import { CURRENT_CONTENT_DOCUMENT_VERSION, type ContentDocument } from '../content/document'
import type { OutboxEvent } from '../content/domain'
import { InMemoryContentRepository } from '../content/in-memory-repository'
import type { Clock, ContentRepository, IdentifierSource, SearchProjection } from '../content/ports'
import { ContentService } from '../content/service'
import { InMemorySearch } from '../discovery/in-memory-search'
import { createOutboxHandlers, syncSearchDocument } from './handlers'
import type { CacheRevalidator } from './ports'

vi.mock('next/cache', async () => {
  const { dataCache: standIn } = await import('../../../tests/support/data-cache')
  return {
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn((tag: string) => standIn.expireTag(tag)),
    unstable_cache: standIn.cache,
  }
})

vi.mock('@/reader/store', () => ({ resolveReaderStore: vi.fn() }))

class TestClock implements Clock {
  constructor(private value: Date) {}

  advance(milliseconds: number) {
    this.value = new Date(this.value.valueOf() + milliseconds)
  }

  now(): Date {
    return new Date(this.value)
  }
}

class TestIdentifiers implements IdentifierSource {
  private sequence = 0

  next(kind: string): string {
    this.sequence += 1
    return `${kind}-${this.sequence}`
  }
}

function document(articleId: string, title: string, text: string): ContentDocument {
  return {
    articleId,
    document: { content: [{ content: [{ text, type: 'text' }], type: 'paragraph' }], type: 'doc' },
    migrationProvenance: [],
    schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
    title,
  }
}

function setup() {
  const clock = new TestClock(new Date('2026-11-03T09:00:00.000Z'))
  const repository = new InMemoryContentRepository()
  const content = new ContentService(repository, clock, new TestIdentifiers())
  const search = new InMemorySearch()
  const revalidate = vi.fn<CacheRevalidator['revalidate']>(async () => undefined)
  const handlers = createOutboxHandlers({ cache: { revalidate }, content: repository, search })
  return { clock, content, handlers, repository, revalidate, search }
}

async function publishStory(content: ContentService) {
  const created = await content.createArticle({
    dek: 'Published dek',
    document: document('article-lantern', 'Lantern glass', 'Published notes on lantern glass.'),
    id: 'article-lantern',
    idempotencyKey: 'create-lantern',
    slug: 'lantern-glass',
    title: 'Lantern glass',
  })
  return content.publish({
    articleId: 'article-lantern',
    expectedVersion: created.article.version,
    idempotencyKey: 'publish-lantern',
    revisionId: created.revision.id,
  })
}

async function documents(search: InMemorySearch, query: string) {
  return (await search.search({ limit: 10, offset: 0, query })).items
}

function event(type: string, payload: OutboxEvent['payload'] = {}): OutboxEvent {
  return {
    aggregateId: 'article-lantern',
    attempts: 0,
    createdAt: '2026-11-03T09:00:00.000Z',
    id: `outbox-${type}`,
    lastError: null,
    payload,
    status: 'pending',
    type,
    updatedAt: '2026-11-03T09:00:00.000Z',
  }
}

function run(handlers: ReturnType<typeof createOutboxHandlers>, outboxEvent: OutboxEvent) {
  const handler = handlers.get(outboxEvent.type)
  if (!handler) throw new Error(`No handler for ${outboxEvent.type}`)
  return handler(outboxEvent, {
    idempotencyKey: outboxEvent.id,
    signal: new AbortController().signal,
  })
}

describe('outbox handlers', () => {
  it('registers the handlers of this phase and no others', () => {
    expect([...setup().handlers.keys()].sort()).toEqual([
      'article.deleted',
      'article.published',
      'article.slug-changed',
      'article.unpublished',
      'cache.revalidate',
      'email.issue',
      'email.subscription-confirm',
      'search.upsert',
    ])
  })

  it('indexes only the published copy of what readers can see, and removes the rest', async () => {
    const { content, handlers, search } = setup()
    const published = await publishStory(content)
    await run(handlers, event('search.upsert'))

    expect(await documents(search, 'lantern')).toEqual([
      expect.objectContaining({
        articleId: 'article-lantern',
        slug: 'lantern-glass',
        title: 'Lantern glass',
      }),
    ])

    // A newer draft changes neither the indexed title nor the indexed words.
    const draft = await content.saveDraft({
      articleId: 'article-lantern',
      document: document('article-lantern', 'Quarantined headline', 'secretmarker draft notes'),
      expectedVersion: published.article.version,
      idempotencyKey: 'draft-lantern',
      title: 'Quarantined headline',
    })
    await run(handlers, event('search.upsert'))
    expect(await documents(search, 'lantern')).toEqual([
      expect.objectContaining({ title: 'Lantern glass' }),
    ])
    expect(await documents(search, 'secretmarker')).toEqual([])

    const unpublished = await content.unpublish({
      articleId: 'article-lantern',
      expectedVersion: draft.article.version,
      idempotencyKey: 'unpublish-lantern',
      reason: 'Handler proof',
    })
    await run(handlers, event('article.unpublished'))
    expect(await documents(search, 'lantern')).toEqual([])

    // A late upsert of the unpublished article cannot bring its document back.
    await run(handlers, event('search.upsert'))
    expect(await documents(search, 'lantern')).toEqual([])

    await content.softDelete({
      articleId: 'article-lantern',
      expectedVersion: unpublished.version,
      idempotencyKey: 'delete-lantern',
    })
    await run(handlers, event('article.deleted'))
    expect(await documents(search, 'lantern')).toEqual([])
  })

  it('removes the document of an article that no longer exists', async () => {
    const { handlers, search } = setup()
    await search.upsertPublishedArticle({
      articleId: 'article-lantern',
      publishedAt: '2026-11-01T09:00:00.000Z',
      searchText: 'Orphaned lantern notes',
      slug: 'lantern-glass',
      title: 'Lantern glass',
    })

    await run(handlers, event('search.upsert'))

    expect(await documents(search, 'lantern')).toEqual([])
  })

  it('writes the document again when the article changes while it is written', async () => {
    const { content, repository, search } = setup()
    const published = await publishStory(content)
    let unpublishing: Promise<unknown> | null = null
    // Another dispatcher unpublishes the article and removes its document before this write lands.
    const racing: SearchProjection = {
      removeArticle: vi.fn((articleId: string) => search.removeArticle(articleId)),
      upsertPublishedArticle: vi.fn(async (input) => {
        unpublishing ??= content.unpublish({
          articleId: 'article-lantern',
          expectedVersion: published.article.version,
          idempotencyKey: 'unpublish-racing',
          reason: 'Race proof',
        })
        await unpublishing
        await search.removeArticle(input.articleId)
        await search.upsertPublishedArticle(input)
      }),
    }

    await syncSearchDocument({ content: repository, search: racing }, 'article-lantern')

    expect(racing.upsertPublishedArticle).toHaveBeenCalledOnce()
    expect(racing.removeArticle).toHaveBeenCalledOnce()
    expect(await documents(search, 'lantern')).toEqual([])
  })

  it('gives up for a retry when the article keeps changing while its document is written', async () => {
    const { clock, content, repository, search } = setup()
    const published = await publishStory(content)
    let version = published.article.version
    const churning: SearchProjection = {
      removeArticle: (articleId) => search.removeArticle(articleId),
      upsertPublishedArticle: async (input) => {
        clock.advance(1_000)
        version = (
          await content.saveDraft({
            articleId: 'article-lantern',
            document: document('article-lantern', 'Lantern glass', `Revision ${version}`),
            expectedVersion: version,
            idempotencyKey: `churn-${version}`,
          })
        ).article.version
        await search.upsertPublishedArticle(input)
      },
    }

    await expect(
      syncSearchDocument({ content: repository, search: churning }, 'article-lantern'),
    ).rejects.toThrow(
      'Article article-lantern kept changing while its search document was written.',
    )
  })

  it('expires both slugs and refreshes the indexed slug after a slug change', async () => {
    const { content, handlers, revalidate, search } = setup()
    const published = await publishStory(content)
    await content.changeSlug({
      articleId: 'article-lantern',
      expectedVersion: published.article.version,
      idempotencyKey: 'rename-lantern',
      slug: 'lantern-glass-notes',
    })

    await run(
      handlers,
      event('article.slug-changed', { fromSlug: 'lantern-glass', toSlug: 'lantern-glass-notes' }),
    )

    expect(revalidate).toHaveBeenCalledWith({
      idempotencyKey: 'outbox-article.slug-changed',
      slugs: ['lantern-glass', 'lantern-glass-notes'],
    })
    expect(await documents(search, 'lantern')).toEqual([
      expect.objectContaining({ slug: 'lantern-glass-notes' }),
    ])
  })

  it('acknowledges a publication without indexing it or expiring a cached view', async () => {
    const { content, handlers, revalidate, search } = setup()
    const published = await publishStory(content)

    await expect(
      run(
        handlers,
        event('article.published', {
          revisionId: published.revision.id,
          slug: 'lantern-glass',
        }),
      ),
    ).resolves.toBeUndefined()

    expect(revalidate).not.toHaveBeenCalled()
    expect(await documents(search, 'lantern')).toEqual([])
  })

  it('expires the story of a cache event under the key derived from the event', async () => {
    const { handlers, revalidate } = setup()

    await run(handlers, event('cache.revalidate', { slug: 'lantern-glass' }))

    expect(revalidate).toHaveBeenCalledWith({
      idempotencyKey: 'outbox-cache.revalidate',
      slugs: ['lantern-glass'],
    })
  })

  it('refuses an event without the slugs it must carry, so it is retried rather than dropped', async () => {
    const { handlers, revalidate } = setup()

    await expect(run(handlers, event('cache.revalidate', { slug: '' }))).rejects.toThrow(
      'The cache.revalidate event carries no slug.',
    )
    await expect(
      run(handlers, event('article.slug-changed', { fromSlug: 'lantern-glass' })),
    ).rejects.toThrow('The article.slug-changed event carries no toSlug.')
    expect(revalidate).not.toHaveBeenCalled()
  })
})

describe('outbox cache events and the cached feed and sitemap', () => {
  /** The cache port as `/api/revalidate` expires a story: its own views and every reader listing. */
  const readerExpiry: CacheRevalidator = {
    revalidate: async ({ slugs }) => {
      for (const slug of slugs) expirePublicReader(slug)
    },
  }

  beforeEach(() => {
    dataCache.reset()
  })

  async function published() {
    const { content, repository, search } = setup()
    vi.mocked(resolveReaderStore).mockReturnValue({
      mediaAvailable: false,
      objects: null,
      repository,
      variants: null,
    })
    await publishStory(content)
    const handlers = createOutboxHandlers({ cache: readerExpiry, content: repository, search })
    return { handlers, repository }
  }

  async function documents() {
    const feed = await getFeed(new Request('http://localhost/feed.xml'))
    const sitemap = await getSitemapPage(new Request('http://localhost/sitemaps/1.xml'), {
      params: Promise.resolve({ page: '1.xml' }),
    })
    return { feed: await feed.text(), sitemap: await sitemap.text() }
  }

  /**
   * Renames the story without recording a publication change, as a change made outside the content
   * services would: the cache key stays, so only an expiry can bring the documents up to date.
   */
  async function renameUnrecorded(repository: ContentRepository, slug: string) {
    await repository.transaction(async (transaction) => {
      const article = await transaction.getArticle('article-lantern')
      if (!article) throw new Error('The lantern story is missing.')
      await transaction.saveArticle(
        { ...article, slug, version: article.version + 1 },
        article.version,
      )
    })
  }

  it('expires the cached feed and sitemap when a slug change is dispatched', async () => {
    const { handlers, repository } = await published()
    const cached = await documents()
    expect(cached.feed).toContain('/stories/lantern-glass</link>')
    expect(cached.sitemap).toContain('/stories/lantern-glass</loc>')

    await renameUnrecorded(repository, 'lantern-glass-notes')
    expect(await documents()).toEqual(cached)

    await run(
      handlers,
      event('article.slug-changed', { fromSlug: 'lantern-glass', toSlug: 'lantern-glass-notes' }),
    )

    const refreshed = await documents()
    expect(refreshed.feed).toContain('/stories/lantern-glass-notes</link>')
    expect(refreshed.feed).not.toContain('/stories/lantern-glass</link>')
    expect(refreshed.sitemap).toContain('/stories/lantern-glass-notes</loc>')
    expect(refreshed.sitemap).not.toContain('/stories/lantern-glass</loc>')
  })

  it('expires the cached feed and sitemap when a cache event is dispatched', async () => {
    const { handlers, repository } = await published()
    const cached = await documents()

    await renameUnrecorded(repository, 'lantern-glass-notes')
    expect(await documents()).toEqual(cached)

    await run(handlers, event('cache.revalidate', { slug: 'lantern-glass-notes' }))

    const refreshed = await documents()
    expect(refreshed.feed).toContain('/stories/lantern-glass-notes</link>')
    expect(refreshed.sitemap).toContain('/stories/lantern-glass-notes</loc>')
  })
})
