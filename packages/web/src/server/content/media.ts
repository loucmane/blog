import { createHash } from 'node:crypto'

import type { MediaAsset } from './domain'
import { InvalidContentTransitionError } from './errors'
import type { Clock, ContentRepository, IdentifierSource, OriginalObjectStore } from './ports'
import { RandomIdentifierSource, SystemClock } from './service'

export const MAX_MEDIA_ORIGINAL_BYTES = 50 * 1024 * 1024

const allowedOriginalContentTypes = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
])

export function sha256Bytes(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

export function originalObjectKey(mediaId: string, sha256: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(mediaId)) {
    throw new InvalidContentTransitionError('Media identity contains unsupported characters.')
  }
  if (!/^[0-9a-f]{64}$/.test(sha256)) {
    throw new InvalidContentTransitionError('Media checksum must be lowercase SHA-256.')
  }
  return `originals/${mediaId}/${sha256}`
}

export interface StoreMediaOriginalInput {
  readonly alt: string
  readonly body: Uint8Array
  readonly caption?: string
  readonly contentType: string
  readonly creditName: string
  readonly creditUrl?: string | null
  readonly focalPoint?: { readonly x: number; readonly y: number }
  readonly height?: number | null
  readonly id?: string
  readonly width?: number | null
}

function validateMediaInput(input: StoreMediaOriginalInput) {
  if (input.body.byteLength === 0 || input.body.byteLength > MAX_MEDIA_ORIGINAL_BYTES) {
    throw new InvalidContentTransitionError(
      `Media originals must contain 1 to ${MAX_MEDIA_ORIGINAL_BYTES} bytes.`,
    )
  }
  if (!allowedOriginalContentTypes.has(input.contentType)) {
    throw new InvalidContentTransitionError(`Media type ${input.contentType} is not allowed.`)
  }
  if (input.alt.trim().length === 0 || input.creditName.trim().length === 0) {
    throw new InvalidContentTransitionError('Media alt text and credit are required.')
  }
  for (const dimension of [input.width, input.height]) {
    if (
      dimension !== undefined &&
      dimension !== null &&
      (!Number.isInteger(dimension) || dimension < 1)
    ) {
      throw new InvalidContentTransitionError('Media dimensions must be positive integers.')
    }
  }
  const focalPoint = input.focalPoint ?? { x: 0.5, y: 0.5 }
  if (
    !Number.isFinite(focalPoint.x) ||
    !Number.isFinite(focalPoint.y) ||
    focalPoint.x < 0 ||
    focalPoint.x > 1 ||
    focalPoint.y < 0 ||
    focalPoint.y > 1
  ) {
    throw new InvalidContentTransitionError('Media focal points must be between zero and one.')
  }
}

export class MediaOriginalService {
  constructor(
    private readonly repository: ContentRepository,
    private readonly objects: OriginalObjectStore,
    private readonly clock: Clock = new SystemClock(),
    private readonly identifiers: IdentifierSource = new RandomIdentifierSource(),
  ) {}

  async store(input: StoreMediaOriginalInput): Promise<MediaAsset> {
    validateMediaInput(input)
    const id = input.id ?? this.identifiers.next('media')
    const checksum = sha256Bytes(input.body)
    const key = originalObjectKey(id, checksum)
    const stored = await this.objects.putOriginal({
      body: input.body,
      contentType: input.contentType,
      key,
      sha256: checksum,
    })
    if (
      stored.bytes !== input.body.byteLength ||
      stored.contentType !== input.contentType ||
      stored.key !== key ||
      stored.sha256 !== checksum
    ) {
      await this.objects.deleteOriginal(key)
      throw new Error('Object store acknowledgement did not match the media original.')
    }
    if (!(await this.objects.verifyOriginal(key, checksum))) {
      await this.objects.deleteOriginal(key)
      throw new Error('Stored media original failed checksum verification.')
    }

    const now = this.clock.now().toISOString()
    const focalPoint = input.focalPoint ?? { x: 0.5, y: 0.5 }
    const asset: MediaAsset = {
      alt: input.alt.trim(),
      bytes: input.body.byteLength,
      caption: input.caption?.trim() ?? '',
      contentType: input.contentType,
      createdAt: now,
      creditName: input.creditName.trim(),
      creditUrl: input.creditUrl ?? null,
      focalX: focalPoint.x,
      focalY: focalPoint.y,
      height: input.height ?? null,
      id,
      originalKey: key,
      originalSha256: checksum,
      updatedAt: now,
      width: input.width ?? null,
    }
    try {
      await this.repository.transaction(async (transaction) => transaction.saveMediaAsset(asset))
    } catch (error) {
      await this.objects.deleteOriginal(key)
      throw error
    }
    return structuredClone(asset)
  }
}

export class InMemoryOriginalObjectStore implements OriginalObjectStore {
  private readonly objects = new Map<
    string,
    { body: Uint8Array; contentType: string; sha256: string }
  >()

  async deleteOriginal(key: string): Promise<void> {
    this.objects.delete(key)
  }

  async getOriginal(key: string): Promise<Uint8Array> {
    const object = this.objects.get(key)
    if (!object) throw new Error(`Original ${key} was not found.`)
    return new Uint8Array(object.body)
  }

  async putOriginal(input: { body: Uint8Array; contentType: string; key: string; sha256: string }) {
    const actual = sha256Bytes(input.body)
    if (actual !== input.sha256) throw new Error('Original checksum does not match its bytes.')
    const existing = this.objects.get(input.key)
    if (existing && existing.sha256 !== input.sha256) {
      throw new Error(`Original key ${input.key} is immutable.`)
    }
    this.objects.set(input.key, {
      body: new Uint8Array(input.body),
      contentType: input.contentType,
      sha256: input.sha256,
    })
    return {
      bytes: input.body.byteLength,
      contentType: input.contentType,
      key: input.key,
      sha256: input.sha256,
    }
  }

  async verifyOriginal(key: string, expectedSha256: string): Promise<boolean> {
    const object = this.objects.get(key)
    return object !== undefined && sha256Bytes(object.body) === expectedSha256
  }
}
