import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { expirePublicReader } from '@/reader/cache'
import { resolveReaderStore } from '@/reader/store'
import { CURRENT_CONTENT_DOCUMENT_VERSION } from '@/server/content/document'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { ContentService } from '@/server/content/service'
import { canonicalSitemapPageUrl } from '@/server/distribution/canonical'
import { distributionCacheControl } from '@/server/distribution/limits'

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

let repository: InMemoryContentRepository

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://magazine.example')
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

async function publish(slug: string) {
  const content = new ContentService(repository, {
    now: () => new Date('2026-10-01T09:00:00.000Z'),
  })
  const created = await content.createArticle({
    dek: '',
    document: {
      articleId: `article-${slug}`,
      document: {
        content: [{ content: [{ text: `Body of ${slug}.`, type: 'text' }], type: 'paragraph' }],
        type: 'doc',
      },
      migrationProvenance: [],
      schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
      title: slug,
    },
    id: `article-${slug}`,
    idempotencyKey: `create-${slug}`,
    slug,
    title: slug,
  })
  await content.publish({
    articleId: `article-${slug}`,
    expectedVersion: created.article.version,
    idempotencyKey: `publish-${slug}`,
    revisionId: created.revision.id,
  })
}

describe('GET /sitemap.xml', () => {
  it('serves the sitemap index as XML under the shared cache policy', async () => {
    await publish('winter-light')

    const response = await GET()
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/xml; charset=utf-8')
    expect(response.headers.get('cache-control')).toBe(distributionCacheControl)
    expect(body).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(body).toContain(`<loc>${canonicalSitemapPageUrl(1)}</loc>`)
    expect(body).toContain('<lastmod>2026-10-01T09:00:00.000Z</lastmod>')
  })

  it('caches the URLs it counts until the reader expires', async () => {
    await publish('winter-light')
    const reads = vi.spyOn(repository, 'transaction')

    const first = await (await GET()).text()
    expect(await (await GET()).text()).toBe(first)
    expect(reads).toHaveBeenCalledTimes(1)

    expirePublicReader()
    await GET()
    expect(reads).toHaveBeenCalledTimes(2)
  })

  it('says the magazine is unavailable when no content store is configured', async () => {
    vi.mocked(resolveReaderStore).mockReturnValue(null)

    const response = await GET()

    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
})
