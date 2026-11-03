import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server'
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { config, proxy } from '@/proxy'
import { CURRENT_CONTENT_DOCUMENT_VERSION } from '@/server/content/document'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { PostgresSlugHistory } from '@/server/database/postgres-slug-resolution'
import { getOwnerRuntime } from '@/server/owner/runtime'

import { RepositorySlugHistory } from './repository-slug-history'
import type { SlugResolution } from './slug-resolution'
import {
  handleStoryRequest,
  requestedStorySlug,
  resolveStoryRequest,
  slugResolutionStore,
} from './story-requests'

const origin = 'http://127.0.0.1:3100'

const request = (path: string, method = 'GET') => new NextRequest(`${origin}${path}`, { method })
const answering = (resolution: SlugResolution | null) => vi.fn(async (_slug: string) => resolution)
/** NextResponse.next() marks a response that lets the request go on to the page. */
const passesThrough = (response: Response) => response.headers.get('x-middleware-next') === '1'

describe('story request paths', () => {
  it('reads one valid story slug from a story path', () => {
    expect(requestedStorySlug('/stories/winter-light')).toBe('winter-light')
    // Next decodes route params, so the proxy reads the slug the page would.
    expect(requestedStorySlug('/stories/%77inter-light')).toBe('winter-light')
  })

  it.each([
    '/stories/',
    '/stories/a',
    `/stories/${'a'.repeat(181)}`,
    '/stories/Winter-Light',
    '/stories/winter-light/comments',
    '/stories/winter%2Flight',
    '/stories/%E0%A4%A',
    '/preview/stories/winter-light',
    '/sections/winter-light',
    '/',
  ])('names no story for %s', (path) => {
    expect(requestedStorySlug(path)).toBeNull()
  })

  it('runs the proxy on story paths only', () => {
    const matches = (url: string) => unstable_doesMiddlewareMatch({ config, url })

    expect(matches('/stories/winter-light')).toBe(true)
    expect(matches('/stories/winter-light?utm_source=feed')).toBe(true)
    for (const url of [
      '/',
      '/stories',
      '/stories/winter-light/comments',
      '/preview/stories/winter-light',
      '/owner/stories/article-1',
      '/api/owner/stories/article-1',
      '/sections/interiors',
      '/api/media/media-1',
    ]) {
      expect(matches(url), url).toBe(false)
    }
  })
})

describe('story request handling', () => {
  it('redirects an old slug permanently to the story, keeping the query, with nothing cached', async () => {
    const resolve = answering({ kind: 'redirect', slug: 'new-slug' })

    const response = await handleStoryRequest(
      request('/stories/old-slug?utm_source=newsletter'),
      resolve,
    )

    expect(resolve).toHaveBeenCalledWith('old-slug')
    expect(response.status).toBe(308)
    // A path, never the server's own host: the reader stays on the origin they asked.
    expect(response.headers.get('location')).toBe('/stories/new-slug?utm_source=newsletter')
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('answers 410 with a small accessible page for a story readers can no longer see', async () => {
    const response = await handleStoryRequest(
      request('/stories/withdrawn-story'),
      answering({ kind: 'gone' }),
    )

    expect(response.status).toBe(410)
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(response.headers.get('cache-control')).toBe('no-store')
    const body = await response.text()
    expect(body).toMatch(/^<!doctype html>\n<html lang="en">/)
    expect(body).toContain('<title>Story removed | Magazine Foundation</title>')
    expect(body).toContain('<main>\n<h1>Story removed</h1>')
    expect(body).toContain('<a href="/">Go to the front page</a>')
    expect(body).not.toContain('withdrawn-story')
  })

  it.each([
    ['current', { kind: 'current' } as const],
    ['unknown', { kind: 'unknown' } as const],
    ['unconfigured', null],
  ])('sends a %s slug on to the story page', async (_label, resolution) => {
    const response = await handleStoryRequest(request('/stories/a-story'), answering(resolution))

    expect(passesThrough(response)).toBe(true)
    expect(response.status).toBe(200)
  })

  it('answers HEAD like GET, and lets every other method through without resolving', async () => {
    const resolve = answering({ kind: 'gone' })

    expect((await handleStoryRequest(request('/stories/a-story', 'HEAD'), resolve)).status).toBe(
      410,
    )
    for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS']) {
      const response = await handleStoryRequest(request('/stories/a-story', method), resolve)
      expect(passesThrough(response), method).toBe(true)
    }
    expect(resolve).toHaveBeenCalledTimes(1)
  })

  it('leaves a path that names no valid story to the page, unresolved', async () => {
    const resolve = answering({ kind: 'gone' })

    for (const path of ['/stories/Not-A-Slug', `/stories/${'a'.repeat(181)}`]) {
      expect(passesThrough(await handleStoryRequest(request(path), resolve)), path).toBe(true)
    }
    expect(resolve).not.toHaveBeenCalled()
  })

  it('fails open: when resolution fails, the page answers and the failure is logged', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const failure = new Error('connection refused')

    const response = await handleStoryRequest(request('/stories/a-story'), async () => {
      throw failure
    })

    expect(passesThrough(response)).toBe(true)
    expect(logged).toHaveBeenCalledWith(
      'Slug resolution failed for /stories/a-story; the story page answers it.',
      failure,
    )
  })

  it('reads the slug history through the pool when there is one', () => {
    const repository = new InMemoryContentRepository()
    const pool = { query: vi.fn() }

    expect(slugResolutionStore(repository, pool).history).toBeInstanceOf(PostgresSlugHistory)
    expect(slugResolutionStore(repository, null).history).toBeInstanceOf(RepositorySlugHistory)
  })
})

describe('story requests against the runtime content store', () => {
  const runtimeKey = Symbol.for('magazine.owner-runtime')
  const resetRuntime = () => {
    delete (globalThis as { [runtimeKey]?: unknown })[runtimeKey]
  }

  beforeEach(() => {
    vi.stubEnv('MAGAZINE_RUNTIME_SITE_URL', origin)
    vi.stubEnv('MAGAZINE_OWNER_EMAIL', 'owner@example.test')
    vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '1')
    vi.stubEnv('MAGAZINE_OWNER_TEST_TOKEN', 'story-requests-fixture-token-with-more-than-32-bytes')
    resetRuntime()
  })

  afterEach(() => {
    resetRuntime()
    vi.unstubAllEnvs()
  })

  async function publishStory(slug: string) {
    const { content } = getOwnerRuntime()
    const created = await content.createArticle({
      dek: 'A story the proxy resolves.',
      document: {
        articleId: `article-${slug}`,
        document: {
          content: [
            { content: [{ text: 'Resolved by the proxy.', type: 'text' }], type: 'paragraph' },
          ],
          type: 'doc',
        },
        migrationProvenance: [],
        schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
        title: `Title of ${slug}`,
      },
      id: `article-${slug}`,
      idempotencyKey: `create-${slug}`,
      slug,
      title: `Title of ${slug}`,
    })
    const published = await content.publish({
      articleId: created.article.id,
      expectedVersion: created.article.version,
      idempotencyKey: `publish-${slug}`,
      revisionId: created.revision.id,
    })
    return published.article
  }

  it('redirects a renamed story and answers 410 the moment it is unpublished', async () => {
    const { content } = getOwnerRuntime()
    const published = await publishStory('proxy-first')
    const renamed = await content.changeSlug({
      articleId: published.id,
      expectedVersion: published.version,
      idempotencyKey: 'rename-proxy-first',
      slug: 'proxy-second',
    })
    const renamedAgain = await content.changeSlug({
      articleId: published.id,
      expectedVersion: renamed.article.version,
      idempotencyKey: 'rename-proxy-second',
      slug: 'proxy-third',
    })

    const moved = await proxy(request('/stories/proxy-first'))
    expect(moved.status).toBe(308)
    expect(moved.headers.get('location')).toBe('/stories/proxy-third')
    expect(passesThrough(await proxy(request('/stories/proxy-third')))).toBe(true)
    expect(passesThrough(await proxy(request('/stories/never-written')))).toBe(true)

    // The unpublish advances the publication version, so the cached answers are not reused.
    const withdrawn = await content.unpublish({
      articleId: published.id,
      expectedVersion: renamedAgain.article.version,
      idempotencyKey: 'unpublish-proxy-third',
      reason: 'Holding the story for corrections.',
    })
    expect((await proxy(request('/stories/proxy-third'))).status).toBe(410)
    expect((await proxy(request('/stories/proxy-first'))).status).toBe(410)

    await content.publish({
      articleId: published.id,
      expectedVersion: withdrawn.version,
      idempotencyKey: 'republish-proxy-third',
      revisionId: withdrawn.currentDraftRevisionId,
    })
    expect(passesThrough(await proxy(request('/stories/proxy-third')))).toBe(true)
    expect((await proxy(request('/stories/proxy-second'))).status).toBe(308)
  })

  it('never answers one store with another store’s cached resolutions', async () => {
    await publishStory('proxy-shared-slug')
    const version = await getOwnerRuntime().repository.readPublicationVersion()
    expect(await resolveStoryRequest('proxy-shared-slug')).toEqual({ kind: 'current' })

    // A new in-memory store starts again at version 0 and reaches the same version.
    resetRuntime()
    await publishStory('proxy-other-slug')
    expect(await getOwnerRuntime().repository.readPublicationVersion()).toBe(version)
    expect(await resolveStoryRequest('proxy-shared-slug')).toEqual({ kind: 'unknown' })
    expect(await resolveStoryRequest('proxy-other-slug')).toEqual({ kind: 'current' })
  })

  it('lets every story request through when no content store is configured', async () => {
    vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '')
    vi.stubEnv('DATABASE_URL', '')

    expect(await resolveStoryRequest('any-story')).toBeNull()
    expect(passesThrough(await proxy(request('/stories/any-story')))).toBe(true)
  })
})
