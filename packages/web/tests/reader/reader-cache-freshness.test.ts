import { NextRequest } from 'next/server'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GET as getMedia } from '@/app/api/media/[id]/route'
import { POST as applyStoryAction } from '@/app/api/owner/stories/[id]/actions/route'
import { POST as revalidate } from '@/app/api/revalidate/route'
import HomePage from '@/app/page'
import SectionPage from '@/app/sections/[slug]/page'
import StoryPage from '@/app/stories/[slug]/page'
import { CURRENT_CONTENT_DOCUMENT_VERSION } from '@/server/content/document'
import type { ContentRepository, ContentTransaction } from '@/server/content/ports'
import { SectionService } from '@/server/content/sections'
import { createOwnerRuntime, type OwnerRuntime } from '@/server/owner/runtime'
import { createOwnerFixtureSession, ownerFixtureCookieName } from '@/server/owner/session'

import { dataCache } from '../support/data-cache'
import { requestScope } from '../support/request-scope'

vi.mock('next/cache', async () => {
  const { dataCache: standIn } = await import('../support/data-cache')
  return {
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn((tag: string) => standIn.expireTag(tag)),
    unstable_cache: standIn.cache,
  }
})

vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  connection: vi.fn(async () => undefined),
}))

// Reader pages read the Reader Lab cookie, so every render runs in a request: a visitor's, with no
// cookies, unless a test sets some.
vi.mock('next/headers', async () => (await import('../support/request-scope')).nextHeaders)

/* The real registry holds only baseline for now, so a second direction stands in for an override. */
vi.mock('@/reader-directions/registry', async () => {
  const { createElement } = await import('react')
  const { createReaderDirectionRegistry, defineReaderDirection } =
    await import('@/reader-directions/contract')
  const { baselineDirection } = await import('@/reader-directions/baseline')
  const view = (name: string) =>
    function NightEditionView() {
      return createElement('main', { 'data-night-edition': name }, `Night Edition ${name}`)
    }
  return {
    readerDirections: createReaderDirectionRegistry({
      defaultId: 'baseline',
      directions: [
        baselineDirection,
        defineReaderDirection({
          Article: view('article'),
          Home: view('home'),
          id: 'night-edition',
          name: 'Night Edition',
          Section: view('section'),
          thesis: 'A stand-in direction that only a signed-in owner may see.',
        }),
      ],
    }),
  }
})

const siteOrigin = 'http://127.0.0.1:3100'
const revalidationSecret = 'reader-revalidation-secret-with-more-than-32-bytes'
const runtimeKey = Symbol.for('magazine.owner-runtime')
const pngPixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=',
  'base64',
)
const notFound = { digest: 'NEXT_HTTP_ERROR_FALLBACK;404' }

const story = {
  dek: 'How a north-facing room learns to hold the low sun of December.',
  slug: 'quiet-architecture-of-winter-light',
  text: 'By three in the afternoon the light is already leaving, and the room changes its mind.',
  title: 'The quiet architecture of winter light',
}
const articleId = `article-${story.slug}`
const mediaId = 'media-winter-light'

/**
 * The content store as the reader sees it, with a hold between a finished read and its caller. A
 * held read has loaded its state but has not handed it back, so a cached read has not written it
 * to the cache yet. Writes through the content services go to the store directly.
 */
class HeldReads implements ContentRepository {
  transactions = 0
  versionReads = 0
  private hold: (() => Promise<void>) | null = null

  constructor(private readonly store: ContentRepository) {}

  /** Holds the next `count` reads that finish until `release()`; `arrived` waits for all of them. */
  holdNext(count: number) {
    let arrive!: () => void
    let release!: () => void
    const arrived = new Promise<void>((resolve) => {
      arrive = resolve
    })
    const released = new Promise<void>((resolve) => {
      release = resolve
    })
    let remaining = count
    this.hold = async () => {
      if (remaining === 0) return
      remaining -= 1
      if (remaining === 0) arrive()
      await released
    }
    return { arrived, release }
  }

  readPublicationVersion(): Promise<number> {
    this.versionReads += 1
    return this.store.readPublicationVersion()
  }

  async transaction<T>(work: (transaction: ContentTransaction) => Promise<T>): Promise<T> {
    this.transactions += 1
    const result = await this.store.transaction(work)
    await this.hold?.()
    return result
  }
}

function install(): { readonly reads: HeldReads; readonly runtime: OwnerRuntime } {
  const runtime = createOwnerRuntime()
  const reads = new HeldReads(runtime.repository)
  ;(globalThis as { [runtimeKey]?: OwnerRuntime })[runtimeKey] = { ...runtime, repository: reads }
  return { reads, runtime }
}

beforeEach(() => {
  vi.stubEnv('BETTER_AUTH_URL', siteOrigin)
  vi.stubEnv('MAGAZINE_OWNER_EMAIL', 'owner@example.test')
  vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '1')
  vi.stubEnv('MAGAZINE_OWNER_TEST_TOKEN', 'reader-route-test-token-with-more-than-32-bytes')
  vi.stubEnv('MAGAZINE_RUNTIME_SITE_URL', siteOrigin)
  dataCache.reset()
  requestScope.reset()
})

afterEach(() => {
  delete (globalThis as { [runtimeKey]?: unknown })[runtimeKey]
  requestScope.reset()
  vi.unstubAllEnvs()
})

async function draftStoryWithImage(runtime: OwnerRuntime) {
  if (!runtime.media) throw new Error('The test runtime should store media in memory.')
  await runtime.media.store({
    alt: 'A pixel',
    body: pngPixel,
    contentType: 'image/png',
    creditName: 'Studio',
    height: 1,
    id: mediaId,
    width: 1,
  })
  return runtime.content.createArticle({
    dek: story.dek,
    document: {
      articleId,
      document: {
        content: [
          {
            attrs: {
              alt: 'A pixel of winter light',
              caption: 'Lead image',
              credit: { name: 'Studio', url: null },
              focalPoint: { x: 0.5, y: 0.5 },
              mediaId,
            },
            type: 'mediaImage',
          },
          { content: [{ text: story.text, type: 'text' }], type: 'paragraph' },
        ],
        type: 'doc',
      },
      migrationProvenance: [],
      schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
      title: story.title,
    },
    id: articleId,
    idempotencyKey: 'create-winter-light',
    slug: story.slug,
    title: story.title,
  })
}

async function publishedStoryWithImage(runtime: OwnerRuntime) {
  const draft = await draftStoryWithImage(runtime)
  return runtime.content.publish({
    articleId,
    expectedVersion: draft.article.version,
    idempotencyKey: 'publish-winter-light',
    revisionId: draft.revision.id,
  })
}

/** The owner's publish or unpublish, through the same route the workspace uses. */
function ownerAction(body: Readonly<Record<string, unknown>>) {
  return applyStoryAction(
    new Request(`${siteOrigin}/api/owner/stories/${articleId}/actions`, {
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
        cookie: `${ownerFixtureCookieName}=${createOwnerFixtureSession()}`,
        origin: siteOrigin,
      },
      method: 'POST',
    }),
    { params: Promise.resolve({ id: articleId }) },
  )
}

function requestImage() {
  return getMedia(new Request(`${siteOrigin}/api/media/${mediaId}`), {
    params: Promise.resolve({ id: mediaId }),
  })
}

function storyPage(): Promise<ReactElement> {
  return StoryPage({ params: Promise.resolve({ slug: story.slug }) })
}

/** Renders a page to markup, or returns the error it throws, such as the not-found signal. */
async function renderPage(page: Promise<ReactElement>): Promise<string | unknown> {
  try {
    return renderToStaticMarkup(await page)
  } catch (error) {
    return error
  }
}

describe('the data cache stand-in', () => {
  it('keeps a value read before a tag expiry when it is written after the expiry, as Next does', async () => {
    let state = 'before the change'
    let finishRead!: () => void
    const reading = new Promise<void>((resolve) => {
      finishRead = resolve
    })
    const load = dataCache.cache(
      async () => {
        const seen = state
        await reading
        return seen
      },
      ['stand-in'],
      { tags: ['stand-in-tag'] },
    )

    const inFlight = load()
    state = 'after the change'
    dataCache.expireTag('stand-in-tag')
    finishRead()

    expect(await inFlight).toBe('before the change')
    expect(await load()).toBe('before the change')
    dataCache.expireTag('stand-in-tag')
    expect(await load()).toBe('after the change')
  })
})

describe('reader freshness after a publication change', () => {
  it('serves a revoked image and an unpublished story to no later request, even when an earlier read caches them', async () => {
    const { reads, runtime } = install()
    const published = await publishedStoryWithImage(runtime)

    const held = reads.holdNext(2)
    const imageBefore = requestImage()
    const pageBefore = renderPage(storyPage())
    await held.arrived
    const unpublished = await ownerAction({
      action: 'unpublish',
      expectedVersion: published.article.version,
      idempotencyKey: 'unpublish-winter-light',
      reason: 'Image rights expired',
    })
    expect(unpublished.status).toBe(200)
    held.release()

    // Both requests began before the unpublish, so they still answer with the story.
    expect((await imageBefore).status).toBe(200)
    expect(await pageBefore).toEqual(expect.stringContaining(story.title))

    expect.soft((await requestImage()).status, 'image after the unpublish').toBe(404)
    expect.soft(await renderPage(storyPage()), 'story after the unpublish').toMatchObject(notFound)
  })

  it('serves a newly published image and story to every later request, even when an earlier read caches their absence', async () => {
    const { reads, runtime } = install()
    const draft = await draftStoryWithImage(runtime)

    const held = reads.holdNext(2)
    const imageBefore = requestImage()
    const pageBefore = renderPage(storyPage())
    await held.arrived
    const published = await ownerAction({
      action: 'publish',
      expectedVersion: draft.article.version,
      idempotencyKey: 'publish-winter-light',
      revisionId: draft.revision.id,
    })
    expect(published.status).toBe(200)
    held.release()

    // Both requests began before the publish, so they still answer that nothing is there.
    expect((await imageBefore).status).toBe(404)
    expect(await pageBefore).toMatchObject(notFound)

    expect.soft((await requestImage()).status, 'image after the publish').toBe(200)
    expect
      .soft(await renderPage(storyPage()), 'story after the publish')
      .toEqual(expect.stringContaining(story.title))
  })

  it('makes the revalidation route expire a change made outside the content services, even when an earlier read caches the old state', async () => {
    vi.stubEnv('MAGAZINE_REVALIDATION_SECRET', revalidationSecret)
    const { reads, runtime } = install()
    const published = await publishedStoryWithImage(runtime)

    const held = reads.holdNext(2)
    const imageBefore = requestImage()
    const pageBefore = renderPage(storyPage())
    await held.arrived
    // An operator unpublishes the story in the database directly, then asks the site to revalidate.
    await runtime.repository.transaction((transaction) =>
      transaction.saveArticle(
        {
          ...published.article,
          status: 'unpublished',
          version: published.article.version + 1,
        },
        published.article.version,
      ),
    )
    const revalidated = await revalidate(
      new NextRequest(`${siteOrigin}/api/revalidate`, {
        body: JSON.stringify({ slug: story.slug }),
        headers: {
          authorization: `Bearer ${revalidationSecret}`,
          'content-type': 'application/json',
        },
        method: 'POST',
      }),
    )
    expect(revalidated.status).toBe(200)
    held.release()

    expect((await imageBefore).status).toBe(200)
    expect(await pageBefore).toEqual(expect.stringContaining(story.title))

    expect.soft((await requestImage()).status, 'image after revalidation').toBe(404)
    expect.soft(await renderPage(storyPage()), 'story after revalidation').toMatchObject(notFound)
  })

  it('serves cached views between publication changes after one publication version read per request', async () => {
    const { reads, runtime } = install()
    const published = await publishedStoryWithImage(runtime)
    await renderPage(HomePage())
    await renderPage(storyPage())
    await requestImage()
    // A draft edit changes nothing readers see, so the cached views stay in use.
    await runtime.content.saveDraft({
      articleId,
      document: {
        articleId,
        document: {
          content: [
            { content: [{ text: 'An unpublished rewrite.', type: 'text' }], type: 'paragraph' },
          ],
          type: 'doc',
        },
        migrationProvenance: [],
        schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
        title: story.title,
      },
      expectedVersion: published.article.version,
      idempotencyKey: 'edit-winter-light',
    })
    reads.transactions = 0
    reads.versionReads = 0

    expect(await renderPage(HomePage())).toEqual(expect.stringContaining(story.title))
    expect(await renderPage(storyPage())).toEqual(expect.stringContaining(story.text))
    expect((await requestImage()).status).toBe(200)

    // Three requests, one version read each. The media route still loads the asset it serves.
    expect({ transactions: reads.transactions, versionReads: reads.versionReads }).toEqual({
      transactions: 1,
      versionReads: 3,
    })
  })
})

const labCookie = 'reader_lab_direction'

async function publishedStoryInSection(runtime: OwnerRuntime) {
  const draft = await draftStoryWithImage(runtime)
  const sections = new SectionService(runtime.repository)
  const section = await sections.ensureSection({ name: 'Interiors', slug: 'interiors' })
  await sections.assignSection({ articleId, sectionId: section.id })
  await runtime.content.publish({
    articleId,
    expectedVersion: draft.article.version,
    idempotencyKey: 'publish-winter-light',
    revisionId: draft.revision.id,
  })
}

/** Renders the home, story, and section pages for the request `requestScope` describes. */
async function renderReaderPages(): Promise<Record<'article' | 'home' | 'section', string>> {
  const render = async (page: Promise<ReactElement>) => renderToStaticMarkup(await page)
  return {
    article: await render(storyPage()),
    home: await render(HomePage()),
    section: await render(SectionPage({ params: Promise.resolve({ slug: 'interiors' }) })),
  }
}

/** Each cache write stamps its view with a new generation, so equal generations mean one entry. */
function cacheGenerations(pages: Readonly<Record<string, string>>) {
  return Object.fromEntries(
    Object.entries(pages).map(([page, markup]) => [
      page,
      /data-reader-cache-generation="([^"]+)"/.exec(markup)?.[1],
    ]),
  )
}

function expectLabDirection(pages: Readonly<Record<string, string>>) {
  for (const [page, markup] of Object.entries(pages)) {
    expect(markup, page).toContain('data-reader-direction="night-edition"')
    expect(markup, page).toContain(`data-night-edition="${page}"`)
    expect(markup, page).toContain('data-reader-lab-bar')
  }
}

function expectDefaultWithoutLabBar(pages: Readonly<Record<string, string>>, label: string) {
  for (const [page, markup] of Object.entries(pages)) {
    const context = `${page} page, ${label}`
    expect(markup, context).toContain('data-reader-direction="baseline"')
    expect(markup, context).toContain(story.title)
    expect(markup, context).not.toContain('night-edition')
    expect(markup, context).not.toContain('Night Edition')
    expect(markup, context).not.toContain('data-reader-lab')
  }
}

function enterTheLabAsOwner() {
  requestScope.setCookies({
    [labCookie]: 'night-edition',
    [ownerFixtureCookieName]: createOwnerFixtureSession(),
  })
}

describe('Reader Lab overrides and the shared reader cache', () => {
  it('serves visitors the default direction from the views an owner in the lab cached', async () => {
    const { reads, runtime } = install()
    await publishedStoryInSection(runtime)

    enterTheLabAsOwner()
    const owner = await renderReaderPages()
    expectLabDirection(owner)
    const generations = cacheGenerations(owner)
    for (const generation of Object.values(generations)) {
      expect(generation).toMatch(/^[0-9a-f-]{36}$/)
    }
    reads.transactions = 0

    for (const [label, cookies] of [
      ['a visitor', {}],
      ['a visitor who sends the lab cookie', { [labCookie]: 'night-edition' }],
    ] as const) {
      requestScope.reset()
      requestScope.setCookies(cookies)
      const visitor = await renderReaderPages()
      // The visitor gets the very entries the owner's request cached, and they hold no direction.
      expect(cacheGenerations(visitor), label).toEqual(generations)
      expectDefaultWithoutLabBar(visitor, label)
    }
    expect(reads.transactions, 'store reads after the owner filled the cache').toBe(0)
  })

  it('shows the owner the lab direction from the views a visitor cached', async () => {
    const { reads, runtime } = install()
    await publishedStoryInSection(runtime)

    const visitor = await renderReaderPages()
    expectDefaultWithoutLabBar(visitor, 'a visitor')
    reads.transactions = 0

    enterTheLabAsOwner()
    const owner = await renderReaderPages()
    expect(cacheGenerations(owner)).toEqual(cacheGenerations(visitor))
    expectLabDirection(owner)
    expect(reads.transactions, 'store reads after the visitor filled the cache').toBe(0)
  })
})
