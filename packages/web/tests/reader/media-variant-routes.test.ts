import { crc32, deflateSync } from 'node:zlib'

import { renderToStaticMarkup } from 'react-dom/server'
import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GET as getMedia } from '@/app/api/media/[id]/route'
import { POST as uploadMedia } from '@/app/api/owner/media/route'
import StoryPage from '@/app/stories/[slug]/page'
import { CURRENT_CONTENT_DOCUMENT_VERSION, type ContentNode } from '@/server/content/document'
import type { MediaAsset } from '@/server/content/domain'
import { sha256Bytes } from '@/server/content/media'
import { mediaVariantWidths, type MediaVariant } from '@/server/content/media-variant-rules'
import { InMemoryMediaVariantStore, mediaVariantObjectKey } from '@/server/content/media-variants'
import { getOwnerRuntime } from '@/server/owner/runtime'
import { createOwnerFixtureSession, ownerFixtureCookieName } from '@/server/owner/session'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: <T>(load: T) => load,
}))

vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  connection: vi.fn(async () => undefined),
}))

vi.mock('next/headers', async () => (await import('../support/request-scope')).nextHeaders)

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

function solid(width: number, height: number) {
  return sharp({ create: { background: '#5a7a96', channels: 3, height, width } })
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

function pngChunk(type: string, data: Uint8Array): Buffer {
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const chunk = Buffer.alloc(typeAndData.length + 8)
  chunk.writeUInt32BE(data.length, 0)
  typeAndData.copy(chunk, 4)
  chunk.writeUInt32BE(crc32(typeAndData), typeAndData.length + 4)
  return chunk
}

/** A PNG of about 50 KB that inflates to 20,000 × 20,000 pixels. */
function decompressionBomb(): Uint8Array {
  const side = 20_000
  const header = Buffer.alloc(13)
  header.writeUInt32BE(side, 0)
  header.writeUInt32BE(side, 4)
  header[8] = 1
  header[9] = 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(Buffer.alloc((side / 8 + 1) * side), { level: 9 })),
    pngChunk('IEND', new Uint8Array()),
  ])
}

/**
 * A 1 × 1 PNG that browsers show but libpng refuses: its image data fails both the chunk CRC and
 * the zlib check. The browser journey uploads it too.
 */
const undecodablePng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=',
  'base64',
)

interface Original {
  readonly animated?: boolean
  readonly body: Uint8Array
  readonly contentType: string
  readonly height?: number
  readonly id: string
  readonly width?: number
}

async function originals(): Promise<readonly Original[]> {
  return [
    {
      body: new Uint8Array(await solid(1440, 960).png().toBuffer()),
      contentType: 'image/png',
      height: 960,
      id: 'media-wide',
      width: 1440,
    },
    {
      body: new Uint8Array(await solid(800, 600).jpeg().toBuffer()),
      contentType: 'image/jpeg',
      id: 'media-photo',
    },
    {
      body: new Uint8Array(await solid(48, 32).gif().toBuffer()),
      contentType: 'image/gif',
      id: 'media-anim',
    },
    { body: decompressionBomb(), contentType: 'image/png', id: 'media-bomb' },
    {
      body: new TextEncoder().encode(
        '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="900" height="600"/></svg>',
      ),
      contentType: 'image/png',
      id: 'media-svg',
    },
    {
      body: new Uint8Array(await solid(1, 1).png().toBuffer()),
      contentType: 'image/png',
      id: 'media-pixel',
    },
    { body: new Uint8Array(undecodablePng), contentType: 'image/png', id: 'media-undecodable' },
    {
      body: new Uint8Array(await solid(640, 480).png().toBuffer()),
      contentType: 'image/png',
      id: 'media-private',
    },
    // Measured as animated when it was stored, as owner uploads are.
    {
      animated: true,
      body: await animatedWebp(),
      contentType: 'image/webp',
      height: 48,
      id: 'media-animated',
      width: 64,
    },
    // Stored without being measured: only its bytes show that it is animated.
    { body: await animatedWebp(), contentType: 'image/webp', id: 'media-animated-unmeasured' },
  ]
}

const publicIds = [
  'media-wide',
  'media-photo',
  'media-anim',
  'media-bomb',
  'media-svg',
  'media-pixel',
  'media-undecodable',
  'media-animated',
  'media-animated-unmeasured',
]

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

function paragraph(text: string): ContentNode {
  return { content: [{ text, type: 'text' }], type: 'paragraph' }
}

function storyDocument(articleId: string, content: ContentNode[]) {
  return {
    articleId,
    document: { content, type: 'doc' },
    migrationProvenance: [],
    schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
    title: 'Variants of winter light',
  }
}

/** Stores every original and publishes a story that shows all of them except `media-private`. */
async function publishStoryWithImages() {
  const runtime = getOwnerRuntime()
  if (!runtime.media) throw new Error('The test runtime should store media in memory.')
  const assets = new Map<string, MediaAsset>()
  for (const original of await originals()) {
    assets.set(
      original.id,
      await runtime.media.store({
        alt: `Image ${original.id}`,
        animated: original.animated ?? null,
        body: original.body,
        contentType: original.contentType,
        creditName: 'Studio',
        height: original.height ?? null,
        id: original.id,
        width: original.width ?? null,
      }),
    )
  }
  const articleId = 'article-variants'
  const created = await runtime.content.createArticle({
    dek: 'How a north-facing room learns to hold the low sun of December.',
    document: storyDocument(articleId, [
      ...publicIds.map(imageNode),
      paragraph('By three in the afternoon the light is already leaving.'),
    ]),
    id: articleId,
    idempotencyKey: 'create-variants',
    slug: 'variants-of-winter-light',
    title: 'Variants of winter light',
  })
  const published = await runtime.content.publish({
    articleId,
    expectedVersion: created.article.version,
    idempotencyKey: 'publish-variants',
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
      idempotencyKey: 'unpublish-variants',
      reason: 'Image rights expired',
    })
  return { asset, published, unpublish }
}

function requestMedia(id: string, search = '', headers?: Record<string, string>) {
  return getMedia(
    new Request(`${siteOrigin}/api/media/${id}${search ? `?${search}` : ''}`, { headers }),
    { params: Promise.resolve({ id }) },
  )
}

function variantStore() {
  const variants = getOwnerRuntime().variants
  if (!variants) throw new Error('The test runtime should store variants in memory.')
  return variants.store
}

function storedVariantKeys(): readonly string[] {
  const store = variantStore()
  if (!(store instanceof InMemoryMediaVariantStore)) {
    throw new Error('The test runtime should keep variants in memory.')
  }
  return store.keys()
}

async function decoded(response: Response) {
  const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
  return { format: metadata.format, height: metadata.height, width: metadata.width }
}

async function expectNotFound(response: Response, label: string) {
  expect(response.status, label).toBe(404)
  expect(response.headers.get('cache-control'), label).toBe('no-store')
  expect(response.headers.get('etag'), label).toBeNull()
  await expect(response.json(), label).resolves.toEqual({
    error: 'That image could not be found.',
  })
}

async function renderStory(slug: string): Promise<string> {
  return renderToStaticMarkup(await StoryPage({ params: Promise.resolve({ slug }) }))
}

/** The `<img>` tag that loads the given media, from rendered markup. */
function imageTag(markup: string, mediaId: string): string {
  return markup.match(new RegExp(`<img[^>]*src="/api/media/${mediaId}[?"][^>]*>`))?.[0] ?? ''
}

/** Uploads an image the way the owner workspace does, which never sends its dimensions. */
async function upload(file: {
  readonly alt: string
  readonly body: Uint8Array
  readonly contentType: string
  readonly name: string
}): Promise<MediaAsset> {
  const form = new FormData()
  form.set('alt', file.alt)
  form.set('creditName', 'Studio')
  form.set('file', new File([Buffer.from(file.body)], file.name, { type: file.contentType }))
  const encoded = new Response(form)
  const body = new Uint8Array(await encoded.arrayBuffer())
  const response = await uploadMedia(
    new Request(`${siteOrigin}/api/owner/media`, {
      body,
      headers: {
        'content-length': String(body.byteLength),
        'content-type': encoded.headers.get('content-type') ?? '',
        cookie: `${ownerFixtureCookieName}=${createOwnerFixtureSession()}`,
        origin: siteOrigin,
      },
      method: 'POST',
    }),
  )
  expect(response.status).toBe(200)
  return ((await response.json()) as { readonly asset: MediaAsset }).asset
}

/** Publishes a story that shows the given images, in order. */
async function publishStoryWith(slug: string, mediaIds: readonly string[]) {
  const runtime = getOwnerRuntime()
  const articleId = `article-${slug}`
  const created = await runtime.content.createArticle({
    dek: 'How a north-facing room learns to hold the low sun of December.',
    document: storyDocument(articleId, [
      ...mediaIds.map(imageNode),
      paragraph('By three in the afternoon the light is already leaving.'),
    ]),
    id: articleId,
    idempotencyKey: `create-${slug}`,
    slug,
    title: 'Variants of winter light',
  })
  await runtime.content.publish({
    articleId,
    expectedVersion: created.article.version,
    idempotencyKey: `publish-${slug}`,
    revisionId: created.revision.id,
  })
}

describe('public media variants', () => {
  it('serves an allowed width and format as a resized image of that type', async () => {
    const { asset } = await publishStoryWithImages()
    const wide = asset('media-wide')

    for (const [format, contentType, decodedFormat] of [
      ['avif', 'image/avif', 'heif'],
      ['webp', 'image/webp', 'webp'],
      ['png', 'image/png', 'png'],
    ] as const) {
      const response = await requestMedia('media-wide', `w=640&fm=${format}`)

      expect(response.status, format).toBe(200)
      expect(response.headers.get('content-type'), format).toBe(contentType)
      expect(response.headers.get('cache-control'), format).toBe('public, no-cache')
      expect(response.headers.get('etag'), format).toBe(`"${wide.originalSha256}-v2-640.${format}"`)
      expect(response.headers.get('x-content-type-options'), format).toBe('nosniff')
      expect(await decoded(response), format).toEqual({
        format: decodedFormat,
        height: 427,
        width: 640,
      })
    }

    const photo = await requestMedia('media-photo', 'w=320&fm=jpeg')
    expect(photo.status).toBe(200)
    expect(photo.headers.get('content-type')).toBe('image/jpeg')
    expect(await decoded(photo)).toEqual({ format: 'jpeg', height: 240, width: 320 })
  })

  it('never upscales a variant beyond the original width', async () => {
    await publishStoryWithImages()

    expect(await decoded(await requestMedia('media-wide', 'w=1920&fm=webp'))).toEqual({
      format: 'webp',
      height: 960,
      width: 1440,
    })
    expect(await decoded(await requestMedia('media-photo', 'w=1280&fm=avif'))).toEqual({
      format: 'heif',
      height: 600,
      width: 800,
    })
  })

  it('serves a 1 × 1 original saved without dimensions at its own size, for every width and format', async () => {
    const { asset, unpublish } = await publishStoryWithImages()
    const pixel = asset('media-pixel')
    expect([pixel.width, pixel.height]).toEqual([null, null])
    const entityTags = new Map<string, string>()

    for (const width of mediaVariantWidths) {
      for (const [format, contentType, decodedFormat] of [
        ['avif', 'image/avif', 'heif'],
        ['webp', 'image/webp', 'webp'],
        ['png', 'image/png', 'png'],
      ] as const) {
        const search = `w=${width}&fm=${format}`
        const response = await requestMedia('media-pixel', search)

        expect(response.status, search).toBe(200)
        expect(response.headers.get('content-type'), search).toBe(contentType)
        expect(response.headers.get('cache-control'), search).toBe('public, no-cache')
        expect(response.headers.get('etag'), search).toBe(
          `"${pixel.originalSha256}-v2-${width}.${format}"`,
        )
        expect(await decoded(response), search).toEqual({
          format: decodedFormat,
          height: 1,
          width: 1,
        })
        entityTags.set(search, response.headers.get('etag') ?? '')
      }
    }
    const notModified = await requestMedia('media-pixel', 'w=320&fm=webp', {
      'if-none-match': entityTags.get('w=320&fm=webp') ?? '',
    })
    expect(notModified.status).toBe(304)

    await unpublish()

    for (const [search, entityTag] of entityTags) {
      await expectNotFound(
        await requestMedia('media-pixel', search, { 'if-none-match': entityTag }),
        search,
      )
    }
  })

  it('answers a disallowed width, format, or parameter for a visible image with an uncacheable 400', async () => {
    await publishStoryWithImages()

    for (const [id, search] of [
      ['media-wide', 'w=500&fm=avif'],
      ['media-wide', 'w=0&fm=avif'],
      ['media-wide', 'w=-320&fm=webp'],
      ['media-wide', 'w=640.5&fm=webp'],
      ['media-wide', 'w=99999999999999999999&fm=webp'],
      ['media-wide', 'w=abc&fm=webp'],
      ['media-wide', 'w=640&fm=gif'],
      ['media-wide', 'w=640&fm=svg'],
      ['media-wide', 'w=640&fm=AVIF'],
      ['media-wide', 'w=640'],
      ['media-wide', 'fm=avif'],
      ['media-wide', 'w=640&w=960&fm=avif'],
      ['media-wide', 'w=640&fm=avif&q=100'],
      ['media-wide', 'w=640&fm=jpeg'],
      ['media-photo', 'w=640&fm=png'],
      ['media-anim', 'w=320&fm=webp'],
      ['media-anim', 'w=320&fm=png'],
    ] as const) {
      const label = `${id}?${search}`
      const response = await requestMedia(id, search)

      expect(response.status, label).toBe(400)
      expect(response.headers.get('cache-control'), label).toBe('no-store')
      expect(response.headers.get('etag'), label).toBeNull()
      await expect(response.json(), label).resolves.toEqual({
        error: 'Choose an allowed image width and format.',
      })
    }
    expect(storedVariantKeys()).toEqual([])
  })

  it('answers hidden, unknown, and malformed ids with the same uncacheable not-found, whatever the query', async () => {
    const { asset } = await publishStoryWithImages()
    const privateTag = `"${asset('media-private').originalSha256}-v2-640.avif"`

    for (const id of ['media-private', 'media-unknown', '..%2Fmedia-wide']) {
      for (const search of ['', 'w=640&fm=avif', 'w=500&fm=avif', 'w=640&fm=gif', 'q=1']) {
        for (const condition of [null, privateTag, '*']) {
          await expectNotFound(
            await requestMedia(
              id,
              search,
              condition === null ? undefined : { 'if-none-match': condition },
            ),
            `${id}?${search} with ${condition ?? 'no condition'}`,
          )
        }
      }
    }
    expect(storedVariantKeys()).toEqual([])
  })

  it('confirms a cached variant with 304 only while a visible revision references it', async () => {
    const { unpublish } = await publishStoryWithImages()
    const first = await requestMedia('media-wide', 'w=960&fm=avif')
    const entityTag = first.headers.get('etag') ?? ''
    expect(entityTag).toMatch(/^"[0-9a-f]{64}-v2-960\.avif"$/)
    const objects = getOwnerRuntime().objects
    if (!objects) throw new Error('The test runtime should store media in memory.')
    const readOriginal = vi.spyOn(objects, 'getOriginal')
    const readVariant = vi.spyOn(variantStore(), 'getVariant')

    for (const condition of [entityTag, `W/${entityTag}`, `"an-older-image", ${entityTag}`, '*']) {
      const notModified = await requestMedia('media-wide', 'w=960&fm=avif', {
        'if-none-match': condition,
      })

      expect(notModified.status, condition).toBe(304)
      expect(await notModified.text(), condition).toBe('')
      expect(notModified.headers.get('cache-control'), condition).toBe('public, no-cache')
      expect(notModified.headers.get('etag'), condition).toBe(entityTag)
      expect(notModified.headers.get('x-content-type-options'), condition).toBe('nosniff')
    }
    expect(readOriginal).not.toHaveBeenCalled()
    expect(readVariant).not.toHaveBeenCalled()

    const otherWidth = await requestMedia('media-wide', 'w=640&fm=avif', {
      'if-none-match': entityTag,
    })
    expect(otherWidth.status).toBe(200)

    await unpublish()

    for (const condition of [entityTag, '*']) {
      await expectNotFound(
        await requestMedia('media-wide', 'w=960&fm=avif', { 'if-none-match': condition }),
        condition,
      )
    }
  })

  it('stops serving a stored variant on the next request after an unpublish', async () => {
    const { asset, unpublish } = await publishStoryWithImages()
    const variants: MediaVariant[] = [
      { format: 'avif', width: 640 },
      { format: 'webp', width: 640 },
      { format: 'png', width: 320 },
    ]
    for (const variant of variants) {
      expect(
        (await requestMedia('media-wide', `w=${variant.width}&fm=${variant.format}`)).status,
      ).toBe(200)
    }
    const keys = variants.map((variant) => mediaVariantObjectKey(asset('media-wide'), variant))
    expect([...storedVariantKeys()].sort()).toEqual([...keys].sort())

    await unpublish()
    const readVariant = vi.spyOn(variantStore(), 'getVariant')

    for (const variant of variants) {
      await expectNotFound(
        await requestMedia('media-wide', `w=${variant.width}&fm=${variant.format}`),
        `${variant.width} ${variant.format}`,
      )
    }
    expect(readVariant).not.toHaveBeenCalled()
    expect([...storedVariantKeys()].sort()).toEqual([...keys].sort())
  })

  it('never serves a variant placed in storage for an image no visible story uses', async () => {
    const { asset } = await publishStoryWithImages()
    const variant: MediaVariant = { format: 'webp', width: 320 }
    const body = new Uint8Array(await solid(320, 240).webp().toBuffer())
    await variantStore().putVariant({
      body,
      contentType: 'image/webp',
      key: mediaVariantObjectKey(asset('media-private'), variant),
    })

    await expectNotFound(await requestMedia('media-private', 'w=320&fm=webp'), 'media-private')
  })

  it('serves later requests for a variant from storage without reading the original again', async () => {
    await publishStoryWithImages()
    const first = await requestMedia('media-photo', 'w=640&fm=webp')
    const firstBody = Buffer.from(await first.arrayBuffer())
    const objects = getOwnerRuntime().objects
    if (!objects) throw new Error('The test runtime should store media in memory.')
    const readOriginal = vi.spyOn(objects, 'getOriginal')

    const second = await requestMedia('media-photo', 'w=640&fm=webp')

    expect(second.status).toBe(200)
    expect(Buffer.from(await second.arrayBuffer())).toEqual(firstBody)
    expect(readOriginal).not.toHaveBeenCalled()
  })

  it('sends readers to the original when an original cannot be resized safely', async () => {
    await publishStoryWithImages()

    for (const id of ['media-bomb', 'media-svg', 'media-undecodable']) {
      const response = await requestMedia(id, 'w=640&fm=webp')

      expect(response.status, id).toBe(307)
      expect(response.headers.get('location'), id).toBe(`/api/media/${id}`)
      expect(response.headers.get('cache-control'), id).toBe('no-store')
      expect(response.headers.get('etag'), id).toBeNull()
    }
    expect(storedVariantKeys()).toEqual([])
    expect((await requestMedia('media-bomb')).status).toBe(200)
    const undecodable = await requestMedia('media-undecodable')
    expect(undecodable.status).toBe(200)
    expect(undecodable.headers.get('content-type')).toBe('image/png')
  })

  it('sends readers to the original even when another copy of the variant module made the runtime', async () => {
    // Production builds bundle these modules once per route, and the runtime is shared between
    // routes through globalThis, so this route can receive errors from another copy's classes.
    vi.resetModules()
    const otherCopy = await import('@/server/owner/runtime')
    ;(globalThis as { [runtimeKey]?: unknown })[runtimeKey] = otherCopy.createOwnerRuntime()
    await publishStoryWithImages()

    for (const id of ['media-undecodable', 'media-svg']) {
      const response = await requestMedia(id, 'w=320&fm=webp')

      expect(response.status, id).toBe(307)
      expect(response.headers.get('location'), id).toBe(`/api/media/${id}`)
      expect(response.headers.get('cache-control'), id).toBe('no-store')
    }
    expect((await requestMedia('media-pixel', 'w=320&fm=webp')).status).toBe(200)
  })

  it('answers a visible image whose bytes cannot be read with a logged, uncacheable server error', async () => {
    await publishStoryWithImages()
    const objects = getOwnerRuntime().objects
    if (!objects) throw new Error('The test runtime should store media in memory.')
    const failure = new Error('The media bucket is unreachable.')
    vi.spyOn(objects, 'getOriginal').mockRejectedValue(failure)
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    for (const search of ['', 'w=640&fm=webp']) {
      const response = await requestMedia('media-photo', search)

      expect(response.status, search).toBe(500)
      expect(response.headers.get('cache-control'), search).toBe('no-store')
      expect(response.headers.get('etag'), search).toBeNull()
      await expect(response.json(), search).resolves.toEqual({
        error: 'That image could not be loaded.',
      })
    }
    expect(logged).toHaveBeenCalledTimes(2)
    expect(logged).toHaveBeenCalledWith('Public media media-photo could not be served.', failure)
    expect(storedVariantKeys()).toEqual([])
  })

  it('sends readers to an animated original instead of a variant that would keep one frame', async () => {
    const { asset, unpublish } = await publishStoryWithImages()
    const objects = getOwnerRuntime().objects
    if (!objects) throw new Error('The test runtime should store media in memory.')
    const readOriginal = vi.spyOn(objects, 'getOriginal')

    for (const search of ['w=320&fm=avif', 'w=640&fm=webp', 'w=1920&fm=png']) {
      const response = await requestMedia('media-animated', search)

      expect(response.status, search).toBe(307)
      expect(response.headers.get('location'), search).toBe('/api/media/media-animated')
      expect(response.headers.get('cache-control'), search).toBe('no-store')
      expect(response.headers.get('etag'), search).toBeNull()
    }
    // What was recorded when the original was stored decides, without reading the original.
    expect(readOriginal).not.toHaveBeenCalled()

    // An original stored without being measured is checked by its own bytes.
    const unmeasured = await requestMedia('media-animated-unmeasured', 'w=320&fm=webp')
    expect(unmeasured.status).toBe(307)
    expect(unmeasured.headers.get('location')).toBe('/api/media/media-animated-unmeasured')
    expect(unmeasured.headers.get('cache-control')).toBe('no-store')
    expect(storedVariantKeys()).toEqual([])

    // Readers get the original itself, with every frame.
    const original = await requestMedia('media-animated')
    expect(original.status).toBe(200)
    expect(original.headers.get('content-type')).toBe('image/webp')
    const bytes = new Uint8Array(await original.arrayBuffer())
    expect(sha256Bytes(bytes)).toBe(asset('media-animated').originalSha256)
    expect((await sharp(bytes).metadata()).pages).toBe(2)

    await unpublish()

    for (const id of ['media-animated', 'media-animated-unmeasured']) {
      await expectNotFound(await requestMedia(id, 'w=320&fm=webp'), `${id} variant`)
      await expectNotFound(await requestMedia(id), `${id} original`)
    }
  })

  it('never serves or confirms a variant from the earlier revision, which flattened animations', async () => {
    const { asset } = await publishStoryWithImages()
    const animated = asset('media-animated-unmeasured')
    // Revision 1 stored the first frame of an animated original under its own keys.
    await variantStore().putVariant({
      body: new Uint8Array(await solid(64, 48).webp().toBuffer()),
      contentType: 'image/webp',
      key: `variants/${animated.id}/${animated.originalSha256}/v1/320.webp`,
    })

    const flattened = await requestMedia('media-animated-unmeasured', 'w=320&fm=webp')
    expect(flattened.status).toBe(307)
    expect(flattened.headers.get('location')).toBe('/api/media/media-animated-unmeasured')

    // A cache holding a revision 1 variant gets the current bytes, not a confirmation.
    const wide = asset('media-wide')
    const revalidated = await requestMedia('media-wide', 'w=640&fm=avif', {
      'if-none-match': `"${wide.originalSha256}-v1-640.avif"`,
    })
    expect(revalidated.status).toBe(200)
    expect(revalidated.headers.get('etag')).toBe(`"${wide.originalSha256}-v2-640.avif"`)
  })

  it('renders animated originals and originals of unknown size as themselves on the story page', async () => {
    await publishStoryWithImages()

    const markup = await renderStory('variants-of-winter-light')

    for (const id of [
      'media-animated',
      'media-animated-unmeasured',
      'media-anim',
      'media-photo',
      'media-pixel',
    ]) {
      expect(markup, id).toContain(`src="/api/media/${id}"`)
      expect(markup, id).not.toContain(`/api/media/${id}?`)
    }
    // A still image whose size was recorded keeps its variants, described at their real widths.
    expect(markup).toContain('/api/media/media-wide?w=1920&amp;fm=avif 1440w')
    expect(markup).not.toContain('/api/media/media-wide?w=1920&amp;fm=avif 1920w')
  })
})

describe('owner uploads', () => {
  it('records the size of an uploaded image, so that its widths are described truthfully', async () => {
    const photo = await upload({
      alt: 'An 800 by 600 photograph',
      body: new Uint8Array(await solid(800, 600).png().toBuffer()),
      contentType: 'image/png',
      name: 'photograph.png',
    })
    expect(photo).toMatchObject({ animated: false, height: 600, width: 800 })
    await publishStoryWith('an-uploaded-photograph', [photo.id])

    const markup = await renderStory('an-uploaded-photograph')

    for (const format of ['avif', 'webp', 'png']) {
      expect(markup, format).toContain(
        [
          `/api/media/${photo.id}?w=320&amp;fm=${format} 320w`,
          `/api/media/${photo.id}?w=640&amp;fm=${format} 640w`,
          `/api/media/${photo.id}?w=960&amp;fm=${format} 800w`,
        ].join(', '),
      )
      expect(markup, format).not.toContain(`/api/media/${photo.id}?w=1280`)
      expect(markup, format).not.toContain(`/api/media/${photo.id}?w=1920`)
    }
    const img = imageTag(markup, photo.id)
    expect(img).toContain(`src="/api/media/${photo.id}?w=960&amp;fm=png"`)
    expect(img).toContain('width="800"')
    expect(img).toContain('height="600"')
    const largest = await requestMedia(photo.id, 'w=960&fm=webp')
    expect(await decoded(largest)).toEqual({ format: 'webp', height: 600, width: 800 })
  })

  it('records an uploaded animation as animated, so that readers get its original', async () => {
    const loop = await upload({
      alt: 'A two-frame loop',
      body: await animatedWebp(),
      contentType: 'image/webp',
      name: 'loop.webp',
    })
    expect(loop).toMatchObject({ animated: true, height: 48, width: 64 })
    await publishStoryWith('an-uploaded-loop', [loop.id])

    const markup = await renderStory('an-uploaded-loop')

    const img = imageTag(markup, loop.id)
    expect(img).toContain(`src="/api/media/${loop.id}"`)
    expect(img).toContain('width="64"')
    expect(img).toContain('height="48"')
    expect(img.toLowerCase()).not.toContain('srcset')
    expect(markup).not.toContain(`/api/media/${loop.id}?`)
    expect(markup).not.toContain('<source')
    const variant = await requestMedia(loop.id, 'w=320&fm=webp')
    expect(variant.status).toBe(307)
    expect(variant.headers.get('location')).toBe(`/api/media/${loop.id}`)
  })
})
