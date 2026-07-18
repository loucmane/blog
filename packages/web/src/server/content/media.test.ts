import { describe, expect, it } from 'vitest'

import { InMemoryContentRepository } from './in-memory-repository'
import {
  InMemoryOriginalObjectStore,
  MediaOriginalService,
  originalObjectKey,
  sha256Bytes,
} from './media'
import type { Clock, IdentifierSource } from './ports'

const clock: Clock = { now: () => new Date('2026-07-17T21:00:00.000Z') }
const identifiers: IdentifierSource = { next: () => 'media-owner-original' }

describe('media original ownership', () => {
  it('stores immutable owner-controlled bytes with application SHA-256 metadata', async () => {
    const repository = new InMemoryContentRepository()
    const objects = new InMemoryOriginalObjectStore()
    const service = new MediaOriginalService(repository, objects, clock, identifiers)
    const body = new TextEncoder().encode('synthetic image bytes')

    const asset = await service.store({
      alt: 'A synthetic editorial image',
      body,
      caption: 'Portable media fixture',
      contentType: 'image/png',
      creditName: 'Magazine owner',
      focalPoint: { x: 0.4, y: 0.6 },
      height: 800,
      width: 1200,
    })

    expect(asset.originalSha256).toBe(sha256Bytes(body))
    expect(asset.originalKey).toBe(originalObjectKey(asset.id, asset.originalSha256))
    expect(await objects.getOriginal(asset.originalKey)).toEqual(body)
    await repository.inspect(async (transaction) => {
      expect(await transaction.getMediaAsset(asset.id)).toEqual(asset)
    })
  })

  it('rejects active or unsupported media and invalid integrity metadata', async () => {
    const service = new MediaOriginalService(
      new InMemoryContentRepository(),
      new InMemoryOriginalObjectStore(),
      clock,
      identifiers,
    )

    await expect(
      service.store({
        alt: 'Potential active content',
        body: new TextEncoder().encode('<svg onload="alert(1)"/>'),
        contentType: 'image/svg+xml',
        creditName: 'Untrusted upload',
      }),
    ).rejects.toThrow(/not allowed/)
    expect(() => originalObjectKey('../escape', '0'.repeat(64))).toThrow(/unsupported characters/)
    expect(() => originalObjectKey('media-safe', 'not-a-checksum')).toThrow(/lowercase SHA-256/)
    await expect(
      service.store({
        alt: '',
        body: new Uint8Array(),
        contentType: 'image/png',
        creditName: '',
      }),
    ).rejects.toThrow(/must contain/)
    await expect(
      service.store({
        alt: 'Invalid focal point',
        body: new Uint8Array([1]),
        contentType: 'image/png',
        creditName: 'Magazine owner',
        focalPoint: { x: 2, y: 0.5 },
      }),
    ).rejects.toThrow(/between zero and one/)
    await expect(
      service.store({
        alt: 'Invalid dimensions',
        body: new Uint8Array([1]),
        contentType: 'image/png',
        creditName: 'Magazine owner',
        width: 0,
      }),
    ).rejects.toThrow(/positive integers/)

    const store = new InMemoryOriginalObjectStore()
    await expect(
      store.putOriginal({
        body: new Uint8Array([1]),
        contentType: 'image/png',
        key: 'originals/media-safe/bad',
        sha256: '0'.repeat(64),
      }),
    ).rejects.toThrow(/does not match/)
  })
})
