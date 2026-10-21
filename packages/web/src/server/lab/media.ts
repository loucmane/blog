import { originalObjectKey, sha256Bytes } from '@/server/content/media'
import type { ContentRepository, OriginalObjectStore } from '@/server/content/ports'

import { labPreparedAt, type LabImage } from './north-house'
import type { LabSeedLimits } from './limits'

/**
 * Seed-only creation. Normal owner uploads retain MediaOriginalService.store semantics.
 *
 * Storage work runs between transactions: a PUT and a verification may each use the whole storage
 * limit, longer together than the seed session's idle-in-transaction limit, after which PostgreSQL
 * ends the session.
 */
export async function createLabMediaIfAbsent({
  repository,
  objects,
  image,
  body,
  afterCheck,
  limits,
}: {
  repository: ContentRepository
  objects: OriginalObjectStore
  image: LabImage
  body: () => Uint8Array
  afterCheck?: (id: string) => Promise<void>
  limits: LabSeedLimits
}): Promise<boolean> {
  const exists = () =>
    repository.transaction(
      async (transaction) => (await transaction.getMediaAsset(image.id)) !== null,
    )
  const existing = await exists()
  if (afterCheck) await limits.wait(() => afterCheck(image.id))
  limits.check()
  if (existing) return false

  const bytes = body()
  const checksum = sha256Bytes(bytes)
  const key = originalObjectKey(image.id, checksum)
  // An owner can create the identity after the read above, while the seed waits or renders.
  // Read again just before the PUT, so the seed does not store an original for it.
  if (await exists()) return false

  const stored = await limits.storage((signal) =>
    objects.putOriginal(
      {
        body: bytes,
        contentType: 'image/png',
        key,
        sha256: checksum,
      },
      signal,
    ),
  )
  if (
    stored.bytes !== bytes.byteLength ||
    stored.contentType !== 'image/png' ||
    stored.key !== key ||
    stored.sha256 !== checksum ||
    !(await limits.storage((signal) => objects.verifyOriginal(key, checksum, signal)))
  ) {
    throw new Error('Stored lab media original failed verification.')
  }
  // Publish the row only after verification. An owner can still create the identity during
  // storage, so use INSERT ... DO NOTHING rather than the owner's metadata upsert. The key holds
  // the checksum: a PUT cannot change the bytes of an original another row uses. Never delete the
  // original after a failure, even an uncertain commit; a retry stores the same key again.
  return repository.transaction((transaction) =>
    transaction.createMediaAssetIfAbsent({
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
    }),
  )
}
