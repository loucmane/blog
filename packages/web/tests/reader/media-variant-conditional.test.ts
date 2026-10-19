import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GET as getMedia } from '@/app/api/media/[id]/route'
import { CURRENT_CONTENT_DOCUMENT_VERSION, type ContentNode } from '@/server/content/document'
import type { MediaAsset } from '@/server/content/domain'
import type { MediaOriginalFacts, MediaVariant } from '@/server/content/media-variant-rules'
import {
  InMemoryMediaVariantStore,
  measureMediaOriginal,
  MediaVariantService,
  mediaVariantObjectKey,
} from '@/server/content/media-variants'
import { getOwnerRuntime } from '@/server/owner/runtime'

/*
 * A 304 tells a cache that its copy of a variant is still what the route serves. An original that
 * was never measured, such as one stored before migration 0004 added the `animated` flag, may be
 * animated and so have no variants at all. These tests check that a conditional request can never
 * confirm such a variant. The setup follows media-variant-routes.test.ts.
 */

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: <T>(load: T) => load,
}))

const siteOrigin = 'http://127.0.0.1:3100'
const runtimeKey = Symbol.for('magazine.owner-runtime')

function resetOwnerRuntime() {
  delete (globalThis as { [runtimeKey]?: unknown })[runtimeKey]
}

beforeEach(() => {
  vi.stubEnv('BETTER_AUTH_URL', siteOrigin)
  vi.stubEnv('MAGAZINE_OWNER_EMAIL', 'owner@example.test')
  vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '1')
  vi.stubEnv('MAGAZINE_OWNER_TEST_TOKEN', 'reader-route-test-token-with-more-than-32-bytes')
  vi.stubEnv('MAGAZINE_RUNTIME_SITE_URL', siteOrigin)
  resetOwnerRuntime()
})

afterEach(() => {
  resetOwnerRuntime()
  vi.unstubAllEnvs()
})

async function stillPng(width: number, height: number): Promise<Uint8Array> {
  return new Uint8Array(
    await sharp({ create: { background: '#5a7a96', channels: 3, height, width } })
      .png()
      .toBuffer(),
  )
}

/** An animated WebP: two 64 × 48 frames, 100 ms each. */
async function animatedWebp(): Promise<Uint8Array> {
  const frames = await Promise.all(
    ['#5a7a96', '#96785a'].map((background) =>
      sharp({ create: { background, channels: 3, height: 48, width: 64 } })
        .png()
        .toBuffer(),
    ),
  )
  return new Uint8Array(
    await sharp(frames, { join: { animated: true } })
      .webp({ delay: [100, 100], loop: 0 })
      .toBuffer(),
  )
}

/** A 1 × 1 PNG that browsers show but libpng refuses, so it can have no variants. */
const undecodablePng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=',
  'base64',
)

const unmeasured: MediaOriginalFacts = { animated: null, height: null, width: null }

interface Original {
  readonly body: Uint8Array
  readonly contentType: string
  /** What was recorded about the original when it was stored. */
  readonly facts: MediaOriginalFacts
  readonly id: string
}

async function originals(): Promise<readonly Original[]> {
  const still = await stillPng(800, 600)
  return [
    // Stored without being measured: only its bytes show that it is animated.
    { body: await animatedWebp(), contentType: 'image/webp', facts: unmeasured, id: 'media-loop' },
    // Stored before migration 0004: its size was recorded, but not whether it is animated.
    {
      body: await animatedWebp(),
      contentType: 'image/webp',
      facts: { animated: null, height: 48, width: 64 },
      id: 'media-legacy-loop',
    },
    {
      body: new Uint8Array(undecodablePng),
      contentType: 'image/png',
      facts: unmeasured,
      id: 'media-undecodable',
    },
    // Measured when it was stored, as owner uploads are.
    {
      body: still,
      contentType: 'image/png',
      facts: await measureMediaOriginal('image/png', still),
      id: 'media-still',
    },
    // A still image stored before migration 0004.
    {
      body: still,
      contentType: 'image/png',
      facts: { animated: null, height: 600, width: 800 },
      id: 'media-legacy-still',
    },
  ]
}

function imageNode(mediaId: string): ContentNode {
  return {
    attrs: {
      alt: `Image ${mediaId}`,
      caption: '',
      credit: { name: 'Studio', url: null },
      focalPoint: { x: 0.5, y: 0.5 },
      mediaId,
    },
    type: 'mediaImage',
  }
}

/** Stores every original and publishes a story that shows all of them. */
async function publishStoryWithImages() {
  const runtime = getOwnerRuntime()
  if (!runtime.media) throw new Error('The test runtime should store media in memory.')
  const assets = new Map<string, MediaAsset>()
  for (const original of await originals()) {
    assets.set(
      original.id,
      await runtime.media.store({
        ...original.facts,
        alt: `Image ${original.id}`,
        body: original.body,
        contentType: original.contentType,
        creditName: 'Studio',
        id: original.id,
      }),
    )
  }
  const articleId = 'article-conditional-variants'
  const created = await runtime.content.createArticle({
    dek: 'How a north-facing room learns to hold the low sun of December.',
    document: {
      articleId,
      document: {
        content: [
          ...[...assets.keys()].map(imageNode),
          {
            content: [
              { text: 'By three in the afternoon the light is already leaving.', type: 'text' },
            ],
            type: 'paragraph',
          },
        ],
        type: 'doc',
      },
      migrationProvenance: [],
      schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
      title: 'Variants of winter light',
    },
    id: articleId,
    idempotencyKey: 'create-conditional-variants',
    slug: 'conditional-variants-of-winter-light',
    title: 'Variants of winter light',
  })
  const published = await runtime.content.publish({
    articleId,
    expectedVersion: created.article.version,
    idempotencyKey: 'publish-conditional-variants',
    revisionId: created.revision.id,
  })
  const asset = (id: string) => {
    const stored = assets.get(id)
    if (!stored) throw new Error(`No asset ${id}`)
    return stored
  }
  const unpublish = () =>
    runtime.content.unpublish({
      articleId,
      expectedVersion: published.article.version,
      idempotencyKey: 'unpublish-conditional-variants',
      reason: 'Image rights expired',
    })
  return { asset, unpublish }
}

function requestMedia(id: string, search: string, headers?: Record<string, string>) {
  return getMedia(new Request(`${siteOrigin}/api/media/${id}?${search}`, { headers }), {
    params: Promise.resolve({ id }),
  })
}

function originalStore() {
  const objects = getOwnerRuntime().objects
  if (!objects) throw new Error('The test runtime should store media in memory.')
  return objects
}

function variantService() {
  const variants = getOwnerRuntime().variants
  if (!variants) throw new Error('The test runtime should make variants.')
  return variants
}

function storedVariantKeys(): readonly string[] {
  const store = variantService().store
  if (!(store instanceof InMemoryMediaVariantStore)) {
    throw new Error('The test runtime should keep variants in memory.')
  }
  return store.keys()
}

/**
 * Swaps in a variant service that has loaded nothing yet, as in another server process or one
 * that has restarted, over the same storage.
 */
function useFreshVariantService(options?: { readonly maxRemembered?: number }) {
  const runtime = getOwnerRuntime()
  const variants = new MediaVariantService(originalStore(), variantService().store, options)
  ;(globalThis as { [runtimeKey]?: unknown })[runtimeKey] = { ...runtime, variants }
}

/** The strong entity tag the route gives the variant, for a cache to send back. */
function variantTag(asset: MediaAsset, variant: MediaVariant): string {
  return `"${asset.originalSha256}-v2-${variant.width}.${variant.format}"`
}

describe('conditional requests for media variants', () => {
  it('sends every request for a variant an unmeasured original cannot have to the original, never answering 304', async () => {
    const { asset } = await publishStoryWithImages()
    const answers: Record<string, unknown> = {}
    const redirects: Record<string, unknown> = {}

    for (const id of ['media-loop', 'media-legacy-loop', 'media-undecodable']) {
      const tag = variantTag(asset(id), { format: 'webp', width: 320 })
      for (const condition of [
        null,
        `"${asset(id).originalSha256}-v1-320.webp"`,
        '*',
        tag,
        `W/${tag}`,
        `"an-older-image", ${tag}`,
      ]) {
        const label = `${id} with ${condition ?? 'no condition'}`
        const response = await requestMedia(
          id,
          'w=320&fm=webp',
          condition === null ? undefined : { 'if-none-match': condition },
        )
        answers[label] = {
          cacheControl: response.headers.get('cache-control'),
          entityTag: response.headers.get('etag'),
          location: response.headers.get('location'),
          status: response.status,
        }
        redirects[label] = {
          cacheControl: 'no-store',
          entityTag: null,
          location: `/api/media/${id}`,
          status: 307,
        }
      }
    }

    // Every condition gets the same answer, so all of them are compared at once.
    expect(answers).toEqual(redirects)
    expect(storedVariantKeys()).toEqual([])
  })

  it('keeps confirming a variant of an image measured as a still with 304, without reading anything', async () => {
    const { asset } = await publishStoryWithImages()
    const variant: MediaVariant = { format: 'webp', width: 640 }
    const tag = variantTag(asset('media-still'), variant)
    const readOriginal = vi.spyOn(originalStore(), 'getOriginal')
    const readVariant = vi.spyOn(variantService().store, 'getVariant')

    for (const condition of [tag, '*']) {
      const response = await requestMedia('media-still', 'w=640&fm=webp', {
        'if-none-match': condition,
      })

      expect(response.status, condition).toBe(304)
      expect(await response.text(), condition).toBe('')
      expect(response.headers.get('cache-control'), condition).toBe('public, no-cache')
      expect(response.headers.get('etag'), condition).toBe(tag)
    }
    expect(readOriginal).not.toHaveBeenCalled()
    expect(readVariant).not.toHaveBeenCalled()

    // The tag a cache sent back is the one a full response carries.
    const full = await requestMedia('media-still', 'w=640&fm=webp')
    expect(full.status).toBe(200)
    expect(full.headers.get('etag')).toBe(tag)
  })

  it('confirms a variant of an unmeasured still image only once it exists, and then without reading it again', async () => {
    const { asset, unpublish } = await publishStoryWithImages()
    const legacy = asset('media-legacy-still')
    const variant: MediaVariant = { format: 'webp', width: 640 }
    const tag = variantTag(legacy, variant)
    const readOriginal = vi.spyOn(originalStore(), 'getOriginal')
    const readVariant = vi.spyOn(variantService().store, 'getVariant')

    // Nothing has made the variant yet, so it is made before the condition is answered.
    const first = await requestMedia('media-legacy-still', 'w=640&fm=webp', {
      'if-none-match': tag,
    })
    expect(first.status).toBe(304)
    expect(await first.text()).toBe('')
    expect(first.headers.get('cache-control')).toBe('public, no-cache')
    expect(first.headers.get('etag')).toBe(tag)
    expect(storedVariantKeys()).toEqual([mediaVariantObjectKey(legacy, variant)])
    expect(readOriginal).toHaveBeenCalledOnce()
    readVariant.mockClear()

    // This process has loaded it, so later conditions are answered without reading anything.
    for (const condition of [tag, '*']) {
      const response = await requestMedia('media-legacy-still', 'w=640&fm=webp', {
        'if-none-match': condition,
      })
      expect(response.status, condition).toBe(304)
    }
    expect(readVariant).not.toHaveBeenCalled()
    expect(readOriginal).toHaveBeenCalledOnce()

    // A process that has not loaded it finds it in storage before answering.
    useFreshVariantService()
    const elsewhere = await requestMedia('media-legacy-still', 'w=640&fm=webp', {
      'if-none-match': tag,
    })
    expect(elsewhere.status).toBe(304)
    expect(readVariant).toHaveBeenCalledOnce()
    expect(readOriginal).toHaveBeenCalledOnce()

    // Remembering a variant never outlives the right to show its image.
    await unpublish()
    for (const condition of [tag, '*']) {
      const hidden = await requestMedia('media-legacy-still', 'w=640&fm=webp', {
        'if-none-match': condition,
      })
      expect(hidden.status, condition).toBe(404)
      expect(hidden.headers.get('etag'), condition).toBeNull()
    }
  })

  it('forgets the variants it loaded longest ago, and reads storage again before confirming one', async () => {
    const { asset } = await publishStoryWithImages()
    useFreshVariantService({ maxRemembered: 1 })
    const tag = variantTag(asset('media-legacy-still'), { format: 'webp', width: 320 })
    expect((await requestMedia('media-legacy-still', 'w=320&fm=webp')).status).toBe(200)
    expect((await requestMedia('media-legacy-still', 'w=640&fm=webp')).status).toBe(200)
    const readVariant = vi.spyOn(variantService().store, 'getVariant')

    const forgotten = await requestMedia('media-legacy-still', 'w=320&fm=webp', {
      'if-none-match': tag,
    })
    const remembered = await requestMedia('media-legacy-still', 'w=320&fm=webp', {
      'if-none-match': tag,
    })

    expect(forgotten.status).toBe(304)
    expect(remembered.status).toBe(304)
    expect(readVariant).toHaveBeenCalledOnce()
  })
})
