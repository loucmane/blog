import sharp, { type Metadata, type Sharp } from 'sharp'

import type { MediaAsset } from './domain'
import { assertMediaKeyParts } from './media'
import {
  mediaVariantContentType,
  mediaVariantRevision,
  type MediaVariant,
  type MediaVariantFormat,
} from './media-variant-rules'
import type { MediaVariantStore, OriginalObjectStore } from './ports'

/*
 * Variants are derived data: resized copies of a media original, stored beside it under a key
 * built from the original's checksum and allowlisted values only. Each is made on its first
 * request and then kept. Deleting any of them is safe, because the next request makes it again.
 * The public media route checks that a visible story uses an image before it asks for a variant,
 * so a stored variant never outlives the right to show its image.
 */

/**
 * Originals with more pixels are refused before any decoding: 8192 × 8192, more than any common
 * camera short of medium format. With MEDIA_VARIANT_CONCURRENCY, this bounds the memory that
 * making variants can use, whatever the originals claim to be.
 */
export const MAX_MEDIA_VARIANT_INPUT_PIXELS = 8192 * 8192

/** How many variants one server process makes at once. Further requests wait their turn. */
export const MEDIA_VARIANT_CONCURRENCY = 2

/** How long making one variant may take before it is abandoned. */
const renderTimeoutSeconds = 20

export function mediaVariantObjectKey(
  asset: Pick<MediaAsset, 'id' | 'originalSha256'>,
  variant: MediaVariant,
): string {
  assertMediaKeyParts(asset.id, asset.originalSha256)
  return `variants/${asset.id}/${asset.originalSha256}/v${mediaVariantRevision}/${variant.width}.${variant.format}`
}

export type MediaVariantUnavailableReason = 'format-mismatch' | 'too-many-pixels' | 'unreadable'

/** An original that cannot be resized safely. Readers should get the original instead. */
export class MediaVariantUnavailableError extends Error {
  readonly code = 'media_variant_unavailable' as const
  readonly reason: MediaVariantUnavailableReason

  constructor(reason: MediaVariantUnavailableReason, cause?: unknown) {
    super(`This image cannot be resized safely (${reason}).`, { cause })
    this.name = 'MediaVariantUnavailableError'
    this.reason = reason
  }
}

/**
 * Whether an error says that an original cannot be resized safely. It reads the error's code, not
 * its class: production builds bundle this module once per route, and the runtime that makes
 * variants is shared between routes, so the error can come from another copy of the class.
 */
export function isMediaVariantUnavailable(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'media_variant_unavailable'
  )
}

function latin1(bytes: Uint8Array, start: number, end: number): string {
  return Buffer.from(bytes.subarray(start, end)).toString('latin1')
}

/**
 * Whether the bytes start the way the declared type does: the PNG, JPEG, or WebP signature, or an
 * ISO-BMFF `ftyp` box that names an AVIF brand. sharp picks its decoder from these same bytes, so
 * this runs before any decoding and decides that no decoder for another format sharp knows (SVG,
 * PDF, TIFF, HEIC, and more) ever sees an original.
 */
function hasSignature(contentType: string, bytes: Uint8Array): boolean {
  switch (contentType) {
    case 'image/avif': {
      if (bytes.byteLength < 12 || latin1(bytes, 4, 8) !== 'ftyp') return false
      const boxEnd = new DataView(bytes.buffer, bytes.byteOffset).getUint32(0)
      return /avif|avis/.test(latin1(bytes, 8, Math.min(boxEnd, 64)))
    }
    case 'image/jpeg':
      return latin1(bytes, 0, 3) === '\xff\xd8\xff'
    case 'image/png':
      return latin1(bytes, 0, 8) === '\x89PNG\r\n\x1a\n'
    case 'image/webp':
      return latin1(bytes, 0, 4) === 'RIFF' && latin1(bytes, 8, 12) === 'WEBP'
    default:
      return false
  }
}

/** The encoders, at the settings the Next image optimizer uses for its default quality of 75. */
function encode(image: Sharp, format: MediaVariantFormat): Sharp {
  switch (format) {
    case 'avif':
      return image.avif({ effort: 3, quality: 47 })
    case 'jpeg':
      return image.jpeg({ mozjpeg: true, quality: 75 })
    case 'png':
      return image.png()
    case 'webp':
      return image.webp({ quality: 75 })
  }
}

export interface RenderMediaVariantInput {
  /** The original's declared media type. Its bytes must be that type. */
  readonly contentType: string
  readonly maxInputPixels?: number
  readonly original: Uint8Array
  readonly variant: MediaVariant
}

/**
 * Makes one variant: the original, turned upright by its EXIF orientation, scaled down to the
 * variant's width (never up), and encoded in the variant's format with no metadata. It refuses,
 * with a MediaVariantUnavailableError, bytes that are not the declared type, originals above the
 * pixel limit (judged from the header alone), and anything that fails or takes too long.
 */
export async function renderMediaVariant({
  contentType,
  maxInputPixels = MAX_MEDIA_VARIANT_INPUT_PIXELS,
  original,
  variant,
}: RenderMediaVariantInput): Promise<Uint8Array> {
  if (!hasSignature(contentType, original)) {
    throw new MediaVariantUnavailableError('format-mismatch')
  }
  let metadata: Metadata
  try {
    metadata = await sharp(original, { limitInputPixels: false }).metadata()
  } catch (error) {
    throw new MediaVariantUnavailableError('unreadable', error)
  }
  if (metadata.width * metadata.height > maxInputPixels) {
    throw new MediaVariantUnavailableError('too-many-pixels')
  }
  try {
    const resized = sharp(original, {
      autoOrient: true,
      failOn: 'warning',
      limitInputPixels: maxInputPixels,
    }).resize({ width: variant.width, withoutEnlargement: true })
    return new Uint8Array(
      await encode(resized, variant.format).timeout({ seconds: renderTimeoutSeconds }).toBuffer(),
    )
  } catch (error) {
    throw new MediaVariantUnavailableError('unreadable', error)
  }
}

/** Runs at most `limit` tasks at once and starts the others in order as slots free up. */
class ConcurrencyLimit {
  private running = 0
  private readonly waiting: (() => void)[] = []

  constructor(private readonly limit: number) {}

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.running < this.limit) this.running += 1
    else await new Promise<void>((start) => this.waiting.push(start))
    try {
      return await task()
    } finally {
      // Hand the slot straight to the next task, so no newcomer can take it in between.
      const next = this.waiting.shift()
      if (next) next()
      else this.running -= 1
    }
  }
}

export interface MediaVariantServiceOptions {
  readonly concurrency?: number
  readonly maxInputPixels?: number
  readonly render?: (input: RenderMediaVariantInput) => Promise<Uint8Array>
}

/**
 * Serves variants from storage and makes each missing one once. Requests for a variant that is
 * being made share that work, and at most `concurrency` variants are made at a time, so a burst of
 * requests holds only a few originals in memory. Storage is treated as a cache: a failed read
 * makes the variant again, and a failed write still serves it.
 */
export class MediaVariantService {
  private readonly limit: ConcurrencyLimit
  private readonly making = new Map<string, Promise<Uint8Array>>()
  private readonly maxInputPixels: number
  private readonly render: (input: RenderMediaVariantInput) => Promise<Uint8Array>

  constructor(
    private readonly originals: OriginalObjectStore,
    readonly store: MediaVariantStore,
    {
      concurrency = MEDIA_VARIANT_CONCURRENCY,
      maxInputPixels = MAX_MEDIA_VARIANT_INPUT_PIXELS,
      render = renderMediaVariant,
    }: MediaVariantServiceOptions = {},
  ) {
    this.limit = new ConcurrencyLimit(concurrency)
    this.maxInputPixels = maxInputPixels
    this.render = render
  }

  /**
   * The variant's bytes. Throws a MediaVariantUnavailableError when the original cannot be resized
   * safely, and the storage error when the original cannot be read.
   */
  async load(asset: MediaAsset, variant: MediaVariant): Promise<Uint8Array> {
    const key = mediaVariantObjectKey(asset, variant)
    const stored = await this.store.getVariant(key).catch(() => null)
    if (stored) return stored
    const inProgress = this.making.get(key)
    if (inProgress) return inProgress
    const made = this.make(asset, variant, key).finally(() => this.making.delete(key))
    this.making.set(key, made)
    return made
  }

  private async make(asset: MediaAsset, variant: MediaVariant, key: string): Promise<Uint8Array> {
    const body = await this.limit.run(async () =>
      this.render({
        contentType: asset.contentType,
        maxInputPixels: this.maxInputPixels,
        original: await this.originals.getOriginal(asset.originalKey),
        variant,
      }),
    )
    await this.store
      .putVariant({ body, contentType: mediaVariantContentType(variant.format), key })
      .catch(() => undefined)
    return body
  }
}

export class InMemoryMediaVariantStore implements MediaVariantStore {
  private readonly variants = new Map<string, Uint8Array>()

  async getVariant(key: string): Promise<Uint8Array | null> {
    const variant = this.variants.get(key)
    return variant ? new Uint8Array(variant) : null
  }

  async putVariant(input: { body: Uint8Array; contentType: string; key: string }): Promise<void> {
    this.variants.set(input.key, new Uint8Array(input.body))
  }

  /** The keys of every stored variant. */
  keys(): readonly string[] {
    return [...this.variants.keys()]
  }

  /** Deletes every variant, which is always safe. */
  clear(): void {
    this.variants.clear()
  }
}
