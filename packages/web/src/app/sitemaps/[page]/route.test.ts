import { revalidateTag } from 'next/cache'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveReaderStore } from '@/reader/store'
import { CURRENT_CONTENT_DOCUMENT_VERSION } from '@/server/content/document'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { ContentService } from '@/server/content/service'
import { canonicalArticleUrl, canonicalHomeUrl } from '@/server/distribution/canonical'
import { distributionCacheControl } from '@/server/distribution/limits'
import { sitemapCacheTag } from '@/server/distribution/sitemap'

import { dataCache } from '../../../../tests/support/data-cache'
import { GET } from './route'

vi.mock('next/cache', async () => {
  const { dataCache: standIn } = await import('../../../../tests/support/data-cache')
  return {
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn((tag: string) => standIn.expireTag(tag)),
    unstable_cache: standIn.cache,
  }
})

vi.mock('@/reader/store', () => ({ resolveReaderStore: vi.fn() }))

let repository: InMemoryContentRepository

beforeEach(async () => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://magazine.example')
  dataCache.reset()
  repository = new InMemoryContentRepository()
  vi.mocked(resolveReaderStore).mockReturnValue({
    mediaAvailable: false,
    objects: null,
    repository,
    variants: null,
  })
  const content = new ContentService(repository, {
    now: () => new Date('2026-10-01T09:00:00.000Z'),
  })
  const created = await content.createArticle({
    dek: '',
    document: {
      articleId: 'article-winter-light',
      document: {
        content: [{ content: [{ text: 'Winter light.', type: 'text' }], type: 'paragraph' }],
        type: 'doc',
      },
      migrationProvenance: [],
      schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
      title: 'Winter light',
    },
    id: 'article-winter-light',
    idempotencyKey: 'create-winter-light',
    slug: 'winter-light',
    title: 'Winter light',
  })
  await content.publish({
    articleId: 'article-winter-light',
    expectedVersion: created.article.version,
    idempotencyKey: 'publish-winter-light',
    revisionId: created.revision.id,
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

function get(page: string) {
  return GET(new Request(`http://127.0.0.1:3000/sitemaps/${page}`), {
    params: Promise.resolve({ page }),
  })
}

describe('GET /sitemaps/<n>.xml', () => {
  it('serves a page the index links, as XML under the shared cache policy', async () => {
    const response = await get('1.xml')
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/xml; charset=utf-8')
    expect(response.headers.get('cache-control')).toBe(distributionCacheControl)
    expect(body).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(body.indexOf(`<loc>${canonicalHomeUrl()}</loc>`)).toBeLessThan(
      body.indexOf(`<loc>${canonicalArticleUrl('winter-light')}</loc>`),
    )
  })

  it('caches the URLs under the publication version and expires them by tag', async () => {
    const reads = vi.spyOn(repository, 'transaction')

    await get('1.xml')
    await get('1.xml')
    expect(reads).toHaveBeenCalledTimes(1)

    revalidateTag(sitemapCacheTag, { expire: 0 })
    await get('1.xml')
    expect(reads).toHaveBeenCalledTimes(2)
  })

  it.each(['2.xml', '0.xml', '01.xml', '1', '1.XML', 'one.xml', '1.xml.gz', '1234567890.xml'])(
    'has no page %s',
    async (page) => {
      const response = await get(page)

      expect(response.status).toBe(404)
      expect(response.headers.get('cache-control')).toBe('no-store')
    },
  )

  it('says the magazine is unavailable when no content store is configured', async () => {
    vi.mocked(resolveReaderStore).mockReturnValue(null)

    const response = await get('1.xml')

    expect(response.status).toBe(503)
  })
})
