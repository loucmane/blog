import { revalidateTag } from 'next/cache'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveReaderStore } from '@/reader/store'
import { CURRENT_CONTENT_DOCUMENT_VERSION } from '@/server/content/document'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { ContentService } from '@/server/content/service'
import { canonicalArticleUrl, canonicalFeedUrl } from '@/server/distribution/canonical'
import { feedCacheTag } from '@/server/distribution/feed'
import { distributionCacheControl, feedPageSize } from '@/server/distribution/limits'

import { dataCache } from '../../../tests/support/data-cache'
import { GET } from './route'

vi.mock('next/cache', async () => {
  const { dataCache: standIn } = await import('../../../tests/support/data-cache')
  return {
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn((tag: string) => standIn.expireTag(tag)),
    unstable_cache: standIn.cache,
  }
})

vi.mock('@/reader/store', () => ({ resolveReaderStore: vi.fn() }))

const origin = 'https://magazine.example'
let repository: InMemoryContentRepository

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', origin)
  dataCache.reset()
  repository = new InMemoryContentRepository()
  vi.mocked(resolveReaderStore).mockReturnValue({
    mediaAvailable: false,
    objects: null,
    repository,
    variants: null,
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

/** Publishes story `index` at `index` minutes after 09:00 on 1 October 2026. */
async function publish(index: number) {
  const content = new ContentService(repository, {
    now: () => new Date(Date.UTC(2026, 9, 1, 9, index)),
  })
  const articleId = `article-${String(index).padStart(3, '0')}`
  const created = await content.createArticle({
    dek: `Summary of story ${index}.`,
    document: {
      articleId,
      document: {
        content: [
          { content: [{ text: `Body of story ${index}.`, type: 'text' }], type: 'paragraph' },
        ],
        type: 'doc',
      },
      migrationProvenance: [],
      schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
      title: `Story ${index}`,
    },
    id: articleId,
    idempotencyKey: `create-${index}`,
    slug: `story-${index}`,
    title: `Story ${index}`,
  })
  await content.publish({
    articleId,
    expectedVersion: created.article.version,
    idempotencyKey: `publish-${index}`,
    revisionId: created.revision.id,
  })
}

function request(path: string): Request {
  return new Request(new URL(path, 'http://127.0.0.1:3000'))
}

function nextHref(feed: string): string | null {
  const href = /<atom:link rel="next" type="application\/rss\+xml" href="([^"]+)"\/>/.exec(
    feed,
  )?.[1]
  return href === undefined ? null : href.replace(/&amp;/g, '&')
}

describe('GET /feed.xml', () => {
  it('serves the feed as RSS under the shared cache policy', async () => {
    await publish(1)
    await publish(2)

    const response = await GET(request('/feed.xml'))
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8')
    expect(response.headers.get('cache-control')).toBe(distributionCacheControl)
    expect(body.indexOf(canonicalArticleUrl('story-2'))).toBeLessThan(
      body.indexOf(canonicalArticleUrl('story-1')),
    )
    expect(body).toContain(`href="${canonicalFeedUrl()}"`)
  })

  it('caches the feed under the publication version and expires it by tag', async () => {
    await publish(1)
    const reads = vi.spyOn(repository, 'transaction')

    const first = await (await GET(request('/feed.xml'))).text()
    expect(reads).toHaveBeenCalledTimes(1)
    expect(await (await GET(request('/feed.xml'))).text()).toBe(first)
    expect(reads).toHaveBeenCalledTimes(1)

    revalidateTag(feedCacheTag, { expire: 0 })
    expect(await (await GET(request('/feed.xml'))).text()).toBe(first)
    expect(reads).toHaveBeenCalledTimes(2)

    // A publication advances the version, so the next request reads the store again.
    await publish(2)
    const reads2 = reads.mock.calls.length
    expect(await (await GET(request('/feed.xml'))).text()).toContain(canonicalArticleUrl('story-2'))
    expect(reads.mock.calls.length).toBeGreaterThan(reads2)
  })

  it('pages past feedPageSize stories into its dated archive and back', async () => {
    for (let index = 1; index <= feedPageSize + 1; index += 1) await publish(index)

    const feed = await (await GET(request('/feed.xml'))).text()
    const archiveUrl = nextHref(feed)
    if (!archiveUrl) throw new Error('The feed has no next page.')
    expect(archiveUrl).toBe(canonicalFeedUrl('2026-10-01T09:02:00.000Z_article-002'))

    const response = await GET(request(archiveUrl))
    const archive = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe(distributionCacheControl)
    expect(archive.match(/<item>/g)).toHaveLength(1)
    expect(archive).toContain(canonicalArticleUrl('story-1'))
    expect(archive).toContain(
      `<atom:link rel="previous" type="application/rss+xml" href="${canonicalFeedUrl()}"/>`,
    )
    expect(nextHref(archive)).toBeNull()
    expect(feed.match(/<item>/g)).toHaveLength(feedPageSize)
  })

  it.each([
    ['a key no story has', '/feed.xml?before=2026-10-01T09%3A01%3A00.000Z_article-999'],
    ['an empty key', '/feed.xml?before='],
    ['a key longer than any archive key', `/feed.xml?before=${'k'.repeat(257)}`],
  ])('has no archive page for %s', async (_label, path) => {
    await publish(1)

    const response = await GET(request(path))

    expect(response.status).toBe(404)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('says the magazine is unavailable when no content store is configured', async () => {
    vi.mocked(resolveReaderStore).mockReturnValue(null)

    const response = await GET(request('/feed.xml'))

    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
})
