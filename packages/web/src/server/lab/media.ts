import { originalObjectKey, sha256Bytes } from '@/server/content/media'
import type { ContentRepository, OriginalObjectStore } from '@/server/content/ports'

import { labPreparedAt, type LabImage } from './north-house'

/** Seed-only creation. Normal owner uploads retain MediaOriginalService.store semantics. */
export async function createLabMediaIfAbsent({
  repository,
  objects,
  image,
  body,
  afterCheck,
}: {
  repository: ContentRepository
  objects: OriginalObjectStore
  image: LabImage
  body: () => Uint8Array
  afterCheck?: (id: string) => Promise<void>
}): Promise<boolean> {
  const existing = await repository.transaction((transaction) =>
    transaction.getMediaAsset(image.id),
  )
  await afterCheck?.(image.id)
  if (existing) return false

  const bytes = body()
  const checksum = sha256Bytes(bytes)
  const key = originalObjectKey(image.id, checksum)
  return repository.transaction(async (transaction) => {
    // An owner can create the identity after the read above. Reserve it before any
    // PUT, using INSERT ... DO NOTHING rather than the owner's metadata upsert.
    const created = await transaction.createMediaAssetIfAbsent({
      alt: image.alt,
      animated: false,
      bytes: bytes.byteLength,
      caption: image.caption,
      contentType: 'image/png',
      createdAt: labPreparedAt,
      creditName: image.creditName,
      creditUrl: null,
      focalX: image.focalPoint.x,
      focalY: image.focalPoint.y,
      height: image.illustration.height,
      id: image.id,
      originalKey: key,
      originalSha256: checksum,
      updatedAt: labPreparedAt,
      width: image.illustration.width,
    })
    if (!created) return false

    const stored = await objects.putOriginal({
      body: bytes,
      contentType: 'image/png',
      key,
      sha256: checksum,
    })
    if (
      stored.bytes !== bytes.byteLength ||
      stored.contentType !== 'image/png' ||
      stored.key !== key ||
      stored.sha256 !== checksum ||
      !(await objects.verifyOriginal(key, checksum))
    ) {
      throw new Error('Stored lab media original failed verification.')
    }
    // Publish the row only after verification. On failure it rolls back. Do not
    // delete an original after an uncertain commit; retry can reuse its identity.
    return true
  })
}
