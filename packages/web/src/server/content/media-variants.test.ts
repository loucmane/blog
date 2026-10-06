import { crc32, deflateSync } from 'node:zlib'

import sharp from 'sharp'
import { describe, expect, it, vi } from 'vitest'

import type { MediaAsset } from './domain'
import { InvalidContentTransitionError } from './errors'
import { InMemoryOriginalObjectStore, originalObjectKey, sha256Bytes } from './media'
import { MAX_MEDIA_VARIANT_INPUT_PIXELS, type MediaVariant } from './media-variant-rules'
import {
  InMemoryMediaVariantStore,
  isMediaVariantUnavailable,
  measureMediaOriginal,
  MediaVariantService,
  MediaVariantUnavailableError,
  mediaVariantObjectKey,
  renderMediaVariant,
} from './media-variants'

/**
 * A 1 × 1 PNG that browsers show but libpng refuses: its image data fails both the chunk CRC and
 * the zlib check. Owner uploads are checked only against their declared type, so such files occur.
 */
const undecodablePng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=',
  'base64',
)

const svg = new TextEncoder().encode(
  '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>',
)

async function png(width: number, height: number): Promise<Uint8Array> {
  return new Uint8Array(
    await sharp({ create: { background: '#c87828', channels: 3, height, width } })
      .png()
      .toBuffer(),
  )
}

/** Two 64 × 48 frames, 100 ms each: an animated image in the given format. */
async function animated(format: 'gif' | 'webp'): Promise<Uint8Array> {
  const frames = await Promise.all(
    ['#c87828', '#2878c8'].map((background) =>
      sharp({ create: { background, channels: 3, height: 48, width: 64 } })
        .png()
        .toBuffer(),
    ),
  )
  const joined = sharp(frames, { join: { animated: true } })
  const encoded =
    format === 'gif'
      ? joined.gif({ delay: [100, 100] })
      : joined.webp({ delay: [100, 100], loop: 0 })
  return new Uint8Array(await encoded.toBuffer())
}

function pngChunk(type: string, data: Uint8Array): Buffer {
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const chunk = Buffer.alloc(typeAndData.length + 8)
  chunk.writeUInt32BE(data.length, 0)
  typeAndData.copy(chunk, 4)
  chunk.writeUInt32BE(crc32(typeAndData), typeAndData.length + 4)
  return chunk
}

/**
 * An animated PNG of two 16 × 12 frames. libpng reads it as a still image of its first frame, and
 * sharp reports no pages for it, so only its animation control chunk shows that it is animated.
 */
function animatedPng(): Uint8Array {
  const [width, height] = [16, 12]
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 2
  const frame = (rgb: readonly number[]) => {
    const row = Buffer.from([0, ...Array.from({ length: width }, () => rgb).flat()])
    return deflateSync(Buffer.concat(Array.from({ length: height }, () => row)))
  }
  const frameControl = (sequence: number) => {
    const control = Buffer.alloc(26)
    control.writeUInt32BE(sequence, 0)
    control.writeUInt32BE(width, 4)
    control.writeUInt32BE(height, 8)
    control.writeUInt16BE(1, 20)
    control.writeUInt16BE(10, 22)
    return pngChunk('fcTL', control)
  }
  const animationControl = Buffer.alloc(8)
  animationControl.writeUInt32BE(2, 0)
  const secondFrame = Buffer.alloc(4)
  secondFrame.writeUInt32BE(2, 0)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('acTL', animationControl),
    frameControl(0),
    pngChunk('IDAT', frame([200, 120, 40])),
    frameControl(1),
    pngChunk('fdAT', Buffer.concat([secondFrame, frame([40, 120, 200])])),
    pngChunk('IEND', new Uint8Array()),
  ])
}

/**
 * The file type box an animated AVIF starts with, which names it an image sequence (`avis`), as
 * its major brand or a compatible one. sharp cannot write one, and the brand alone shows that the
 * file is animated.
 */
function avifSequence(majorBrand: 'avif' | 'avis' = 'avis'): Uint8Array {
  const brands = Buffer.from(`${majorBrand}\0\0\0\0avifavismsf1miaf`, 'latin1')
  const size = Buffer.alloc(4)
  size.writeUInt32BE(8 + brands.length, 0)
  return Buffer.concat([size, Buffer.from('ftyp', 'latin1'), brands, new Uint8Array(32)])
}

/**
 * A real decompression bomb: a PNG of about 50 KB whose 1-bit pixels inflate to 400 million
 * (20,000 × 20,000), several gigabytes once decoded to RGB.
 */
function decompressionBomb(): Uint8Array {
  const side = 20_000
  const header = Buffer.alloc(13)
  header.writeUInt32BE(side, 0)
  header.writeUInt32BE(side, 4)
  header[8] = 1
  header[9] = 0
  const rows = deflateSync(Buffer.alloc((side / 8 + 1) * side), { level: 9 })
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', rows),
    pngChunk('IEND', new Uint8Array()),
  ])
}

async function storedAsset(
  objects: InMemoryOriginalObjectStore,
  body: Uint8Array,
  contentType = 'image/png',
): Promise<MediaAsset> {
  const sha256 = sha256Bytes(body)
  const key = originalObjectKey('media-variant', sha256)
  await objects.putOriginal({ body, contentType, key, sha256 })
  return {
    alt: 'A test image',
    animated: null,
    bytes: body.byteLength,
    caption: '',
    contentType,
    createdAt: '2026-10-06T00:00:00.000Z',
    creditName: 'Studio',
    creditUrl: null,
    focalX: 0.5,
    focalY: 0.5,
    height: null,
    id: 'media-variant',
    originalKey: key,
    originalSha256: sha256,
    updatedAt: '2026-10-06T00:00:00.000Z',
    width: null,
  }
}

async function unavailableReason(promise: Promise<unknown>): Promise<string> {
  const error = await promise.then(
    () => null,
    (reason: unknown) => reason,
  )
  expect(error).toBeInstanceOf(MediaVariantUnavailableError)
  return (error as MediaVariantUnavailableError).reason
}

describe('media variant rendering', () => {
  it('resizes to the requested width in each format, keeping the aspect ratio', async () => {
    const original = await png(1440, 960)

    for (const [format, decodedFormat] of [
      ['avif', 'heif'],
      ['webp', 'webp'],
      ['jpeg', 'jpeg'],
      ['png', 'png'],
    ] as const) {
      const variant = await renderMediaVariant({
        contentType: 'image/png',
        original,
        variant: { format, width: 640 },
      })
      const metadata = await sharp(variant).metadata()

      expect(metadata.format, format).toBe(decodedFormat)
      expect([metadata.width, metadata.height], format).toEqual([640, 427])
    }
  })

  it('resizes WebP and AVIF originals as well as PNG and JPEG ones', async () => {
    const source = sharp({
      create: { background: '#c87828', channels: 3, height: 600, width: 900 },
    })

    for (const [contentType, original] of [
      ['image/webp', await source.clone().webp().toBuffer()],
      ['image/avif', await source.clone().avif().toBuffer()],
    ] as const) {
      const variant = await renderMediaVariant({
        contentType,
        original: new Uint8Array(original),
        variant: { format: 'png', width: 320 },
      })

      expect((await sharp(variant).metadata()).width, contentType).toBe(320)
    }
  })

  it('never upscales beyond the original width', async () => {
    const variant = await renderMediaVariant({
      contentType: 'image/png',
      original: await png(1440, 960),
      variant: { format: 'webp', width: 1920 },
    })

    const { height, width } = await sharp(variant).metadata()
    expect([width, height]).toEqual([1440, 960])
  })

  it('applies the EXIF orientation and drops metadata such as EXIF and GPS', async () => {
    const original = new Uint8Array(
      await sharp({ create: { background: '#336699', channels: 3, height: 200, width: 300 } })
        .jpeg()
        .withMetadata({ orientation: 6 })
        .withExif({ IFD0: { Copyright: 'Studio', Make: 'Camera' } })
        .toBuffer(),
    )
    expect((await sharp(original).metadata()).exif).toBeDefined()

    const variant = await renderMediaVariant({
      contentType: 'image/jpeg',
      original,
      variant: { format: 'jpeg', width: 320 },
    })

    const metadata = await sharp(variant).metadata()
    expect([metadata.width, metadata.height]).toEqual([200, 300])
    expect(metadata.exif).toBeUndefined()
    expect(metadata.orientation).toBeUndefined()
  })

  it('rejects a decompression bomb from its header, before decoding any pixels', async () => {
    const bomb = decompressionBomb()
    expect(bomb.byteLength).toBeLessThan(100_000)
    expect(MAX_MEDIA_VARIANT_INPUT_PIXELS).toBeLessThan(20_000 * 20_000)

    expect(
      await unavailableReason(
        renderMediaVariant({
          contentType: 'image/png',
          original: bomb,
          variant: { format: 'webp', width: 320 },
        }),
      ),
    ).toBe('too-many-pixels')
  })

  it('rejects an original above the pixel limit', async () => {
    expect(
      await unavailableReason(
        renderMediaVariant({
          contentType: 'image/png',
          maxInputPixels: 1_000_000,
          original: await png(1500, 1000),
          variant: { format: 'avif', width: 320 },
        }),
      ),
    ).toBe('too-many-pixels')
  })

  it('rejects bytes that are not the image type the asset claims', async () => {
    const jpeg = new Uint8Array(
      await sharp({ create: { background: '#000', channels: 3, height: 10, width: 10 } })
        .jpeg()
        .toBuffer(),
    )
    // An ISO-BMFF file type box for HEIC: the same container as AVIF, with other brands.
    const heic = Buffer.concat([
      Uint8Array.of(0, 0, 0, 24),
      Buffer.from('ftypheic', 'latin1'),
      new Uint8Array(4),
      Buffer.from('mif1heic', 'latin1'),
      new Uint8Array(16),
    ])

    for (const [label, original, contentType] of [
      ['SVG declared as PNG', svg, 'image/png'],
      ['JPEG declared as PNG', jpeg, 'image/png'],
      ['PNG declared as AVIF', await png(10, 10), 'image/avif'],
      ['HEIC declared as AVIF', heic, 'image/avif'],
      ['a few bytes declared as AVIF', Uint8Array.of(0, 0, 0, 8), 'image/avif'],
      ['PNG declared as WebP', await png(10, 10), 'image/webp'],
      ['PNG declared as GIF', await png(10, 10), 'image/gif'],
    ] as const) {
      expect(
        await unavailableReason(
          renderMediaVariant({ contentType, original, variant: { format: 'webp', width: 320 } }),
        ),
        label,
      ).toBe('format-mismatch')
    }
  })

  it('rejects unreadable and truncated originals', async () => {
    const complete = await png(400, 300)
    const truncated = complete.slice(0, Math.floor(complete.byteLength / 2))

    const garbled = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3)

    for (const original of [garbled, truncated, new Uint8Array(undecodablePng)]) {
      expect(
        await unavailableReason(
          renderMediaVariant({
            contentType: 'image/png',
            original,
            variant: { format: 'webp', width: 320 },
          }),
        ),
      ).toBe('unreadable')
    }
    // An AVIF cut off right after the start of its file type box.
    const truncatedAvif = Buffer.concat([Uint8Array.of(0, 0, 0, 12), Buffer.from('ftypavif')])
    expect(
      await unavailableReason(
        renderMediaVariant({
          contentType: 'image/avif',
          original: truncatedAvif,
          variant: { format: 'webp', width: 320 },
        }),
      ),
    ).toBe('unreadable')
  })

  it('refuses an animated original before decoding it, since a variant would keep only its first frame', async () => {
    for (const [label, contentType, original] of [
      ['animated WebP', 'image/webp', await animated('webp')],
      ['animated GIF', 'image/gif', await animated('gif')],
      ['animated PNG', 'image/png', animatedPng()],
      ['AVIF image sequence', 'image/avif', avifSequence()],
      ['AVIF image sequence by a compatible brand', 'image/avif', avifSequence('avif')],
    ] as const) {
      expect(
        await unavailableReason(
          renderMediaVariant({ contentType, original, variant: { format: 'webp', width: 320 } }),
        ),
        label,
      ).toBe('animated')
    }
  })

  it('recognizes an original that cannot be resized by its error code, whichever copy of this module said so', async () => {
    // Production builds bundle this module once per route, and the runtime that makes variants is
    // shared between routes, so a route can receive this error from a class it does not share.
    vi.resetModules()
    const otherCopy = await import('./media-variants')
    const fromOtherCopy = new otherCopy.MediaVariantUnavailableError('unreadable')

    expect(fromOtherCopy).not.toBeInstanceOf(MediaVariantUnavailableError)
    expect(isMediaVariantUnavailable(fromOtherCopy)).toBe(true)
    expect(isMediaVariantUnavailable(new MediaVariantUnavailableError('format-mismatch'))).toBe(
      true,
    )
    for (const other of [
      new Error('The media bucket is unreachable.'),
      new InvalidContentTransitionError('Media checksum must be lowercase SHA-256.'),
      null,
      'unreadable',
    ]) {
      expect(isMediaVariantUnavailable(other)).toBe(false)
    }
  })
})

describe('media original measurement', () => {
  it('records the size readers see and a single frame for a still image', async () => {
    expect(await measureMediaOriginal('image/png', await png(800, 600))).toEqual({
      animated: false,
      height: 600,
      width: 800,
    })
    const rotated = new Uint8Array(
      await sharp({ create: { background: '#336699', channels: 3, height: 200, width: 300 } })
        .jpeg()
        .withMetadata({ orientation: 6 })
        .toBuffer(),
    )
    expect(await measureMediaOriginal('image/jpeg', rotated)).toEqual({
      animated: false,
      height: 300,
      width: 200,
    })
    // Only the header is read, so an original whose pixels cannot be decoded is measured too.
    expect(await measureMediaOriginal('image/png', new Uint8Array(undecodablePng))).toEqual({
      animated: false,
      height: 1,
      width: 1,
    })
  })

  it('records an animated original as animated, with the size of one frame', async () => {
    const webp = await animated('webp')
    expect((await sharp(webp).metadata()).pages).toBe(2)

    expect(await measureMediaOriginal('image/webp', webp)).toEqual({
      animated: true,
      height: 48,
      width: 64,
    })
    expect(await measureMediaOriginal('image/gif', await animated('gif'))).toEqual({
      animated: true,
      height: 48,
      width: 64,
    })
    expect(await measureMediaOriginal('image/png', animatedPng())).toEqual({
      animated: true,
      height: 12,
      width: 16,
    })
    // sharp cannot read a bare file type box, but its brand already says that it is a sequence.
    expect(await measureMediaOriginal('image/avif', avifSequence())).toEqual({
      animated: true,
      height: null,
      width: null,
    })
  })

  it('records nothing about bytes that are not the declared type or have no readable header', async () => {
    for (const [label, contentType, original] of [
      ['SVG declared as PNG', 'image/png', svg],
      ['SVG, which uploads refuse and nothing decodes', 'image/svg+xml', svg],
      ['PNG declared as WebP', 'image/webp', await png(10, 10)],
      ['PNG declared as GIF', 'image/gif', await png(10, 10)],
      [
        'a PNG signature and nothing else',
        'image/png',
        Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10),
      ],
    ] as const) {
      expect(await measureMediaOriginal(contentType, original), label).toEqual({
        animated: null,
        height: null,
        width: null,
      })
    }
  })

  it('measures a decompression bomb from its header, without decoding it', async () => {
    expect(await measureMediaOriginal('image/png', decompressionBomb())).toEqual({
      animated: false,
      height: 20_000,
      width: 20_000,
    })
  })
})

describe('media variant storage', () => {
  it('keys a variant by the media id, the original checksum, the revision, the width, and the format', () => {
    const checksum = 'a'.repeat(64)

    expect(
      mediaVariantObjectKey(
        { id: 'media-a', originalSha256: checksum },
        { format: 'avif', width: 640 },
      ),
    ).toBe(`variants/media-a/${checksum}/v2/640.avif`)
    for (const [id, originalSha256] of [
      ['../media-a', checksum],
      ['media-a', 'A'.repeat(64)],
      ['media-a', '../'],
    ]) {
      expect(() =>
        mediaVariantObjectKey(
          { id: id ?? '', originalSha256: originalSha256 ?? '' },
          { format: 'avif', width: 640 },
        ),
      ).toThrow(InvalidContentTransitionError)
    }
  })

  it('generates a variant once, stores it, and serves later requests from storage', async () => {
    const objects = new InMemoryOriginalObjectStore()
    const variants = new InMemoryMediaVariantStore()
    const asset = await storedAsset(objects, await png(1440, 960))
    const readOriginal = vi.spyOn(objects, 'getOriginal')
    const render = vi.fn(renderMediaVariant)
    const service = new MediaVariantService(objects, variants, { render })
    const variant: MediaVariant = { format: 'webp', width: 640 }

    const first = await service.load(asset, variant)
    const second = await service.load(asset, variant)

    expect(second).toEqual(first)
    expect(render).toHaveBeenCalledOnce()
    expect(readOriginal).toHaveBeenCalledOnce()
    expect(await variants.getVariant(mediaVariantObjectKey(asset, variant))).toEqual(first)
    expect(variants.keys()).toEqual([mediaVariantObjectKey(asset, variant)])
  })

  it('rebuilds deleted variants on demand, because they are derived copies', async () => {
    const objects = new InMemoryOriginalObjectStore()
    const variants = new InMemoryMediaVariantStore()
    const asset = await storedAsset(objects, await png(800, 600))
    const service = new MediaVariantService(objects, variants)
    const variant: MediaVariant = { format: 'png', width: 320 }
    const first = await service.load(asset, variant)

    variants.clear()
    const rebuilt = await service.load(asset, variant)

    expect(rebuilt).toEqual(first)
    expect(variants.keys()).toEqual([mediaVariantObjectKey(asset, variant)])
  })

  it('shares one generation between concurrent requests for the same variant', async () => {
    const objects = new InMemoryOriginalObjectStore()
    const asset = await storedAsset(objects, await png(800, 600))
    const render = vi.fn(renderMediaVariant)
    const service = new MediaVariantService(objects, new InMemoryMediaVariantStore(), { render })
    const variant: MediaVariant = { format: 'avif', width: 320 }

    const [first, second, third] = await Promise.all([
      service.load(asset, variant),
      service.load(asset, variant),
      service.load(asset, variant),
    ])

    expect(render).toHaveBeenCalledOnce()
    expect(second).toEqual(first)
    expect(third).toEqual(first)
  })

  it('runs at most the configured number of generations at once', async () => {
    const objects = new InMemoryOriginalObjectStore()
    const asset = await storedAsset(objects, await png(64, 64))
    const releases: (() => void)[] = []
    let running = 0
    let peak = 0
    const render = vi.fn(async () => {
      running += 1
      peak = Math.max(peak, running)
      await new Promise<void>((release) => releases.push(release))
      running -= 1
      return Uint8Array.of(1)
    })
    const service = new MediaVariantService(objects, new InMemoryMediaVariantStore(), {
      concurrency: 2,
      render,
    })

    const loads = ([320, 640, 960, 1280, 1920] as const).map((width) =>
      service.load(asset, { format: 'webp', width }),
    )
    await vi.waitFor(() => expect(releases).toHaveLength(2))
    for (let released = 0; released < 5; released += 1) {
      await vi.waitFor(() => expect(releases.length).toBeGreaterThan(0))
      releases.shift()?.()
    }
    await Promise.all(loads)

    expect(render).toHaveBeenCalledTimes(5)
    expect(peak).toBe(2)
  })

  it('stores nothing when an original cannot be resized, and tries again on the next request', async () => {
    const objects = new InMemoryOriginalObjectStore()
    const variants = new InMemoryMediaVariantStore()
    const asset = await storedAsset(objects, decompressionBomb())
    const render = vi.fn(renderMediaVariant)
    const service = new MediaVariantService(objects, variants, { render })

    for (let attempt = 0; attempt < 2; attempt += 1) {
      expect(await unavailableReason(service.load(asset, { format: 'webp', width: 320 }))).toBe(
        'too-many-pixels',
      )
    }
    expect(render).toHaveBeenCalledTimes(2)
    expect(variants.keys()).toEqual([])
  })

  it('treats variant storage as a cache: a failed read regenerates and a failed write still serves', async () => {
    const objects = new InMemoryOriginalObjectStore()
    const variants = new InMemoryMediaVariantStore()
    const asset = await storedAsset(objects, await png(800, 600))
    vi.spyOn(variants, 'getVariant').mockRejectedValue(new Error('storage read failed'))
    vi.spyOn(variants, 'putVariant').mockRejectedValue(new Error('storage write failed'))
    const service = new MediaVariantService(objects, variants)

    const body = await service.load(asset, { format: 'jpeg', width: 320 })

    expect((await sharp(body).metadata()).width).toBe(320)
  })

  it('fails when the original itself cannot be read', async () => {
    const objects = new InMemoryOriginalObjectStore()
    const asset = await storedAsset(objects, await png(10, 10))
    await objects.deleteOriginal(asset.originalKey)
    const service = new MediaVariantService(objects, new InMemoryMediaVariantStore())

    await expect(service.load(asset, { format: 'webp', width: 320 })).rejects.toThrow(
      /was not found/,
    )
  })
})
