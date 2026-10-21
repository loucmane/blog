import { EventEmitter } from 'node:events'

import { Client, type Pool, type QueryResult } from 'pg'
import type * as Pg from 'pg'
import { describe, expect, it, vi } from 'vitest'

import type { MediaAsset } from '@/server/content/domain'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import {
  InMemoryOriginalObjectStore,
  MediaOriginalService,
  originalObjectKey,
  sha256Bytes,
} from '@/server/content/media'
import type { ContentRepository, OriginalObjectStore } from '@/server/content/ports'
import { PostgresContentRepository } from '@/server/database/postgres-content-repository'

import { renderIllustration } from './illustrations'
import { LabSeedLimits } from './limits'
import { createLabMediaIfAbsent } from './media'
import { labImages } from './north-house'

vi.mock('pg', async (importOriginal) => {
  const actual = await importOriginal<typeof Pg>()
  return { ...actual, Client: vi.fn() }
})

const image = labImages[0]!

/** A tiny real PNG: these tests prove ordering and ownership, not image rendering. */
function png(size: number) {
  return new Uint8Array(renderIllustration({ ...image.illustration, height: size, width: size }))
}

const body = png(4)
const checksum = sha256Bytes(body)
const key = originalObjectKey(image.id, checksum)

function createMedia(
  repository: ContentRepository,
  objects: OriginalObjectStore,
  limits = new LabSeedLimits({}),
) {
  return createLabMediaIfAbsent({ body: () => body, image, limits, objects, repository })
}

describe('seed media originals', () => {
  it('stores and verifies the original while the seed session has no transaction open', async () => {
    const log: string[] = []
    vi.mocked(Client).mockImplementation(function () {
      return Object.assign(new EventEmitter(), {
        connect: vi.fn(async () => {}),
        connection: { stream: { destroy: vi.fn() } },
        end: vi.fn(async () => {}),
        query: vi.fn(async (text: string): Promise<QueryResult> => {
          if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(text)) log.push(text)
          else if (text.startsWith('SELECT * FROM media_assets')) log.push('read row')
          else if (text.startsWith('INSERT INTO media_assets')) log.push('insert row')
          return {
            command: text,
            fields: [],
            oid: 0,
            rowCount: 1,
            rows: text.includes('pg_try_advisory_lock') ? [{ acquired: true }] : [],
          }
        }),
      }) as unknown as Client
    })
    const objects = new InMemoryOriginalObjectStore()
    const put = objects.putOriginal.bind(objects)
    const verify = objects.verifyOriginal.bind(objects)
    vi.spyOn(objects, 'putOriginal').mockImplementation((input, signal) => {
      log.push('PUT')
      return put(input, signal)
    })
    vi.spyOn(objects, 'verifyOriginal').mockImplementation((original, sha256, signal) => {
      log.push('verify')
      return verify(original, sha256, signal)
    })
    const limits = new LabSeedLimits({})
    const repository = new PostgresContentRepository({ options: {} } as unknown as Pool)

    await expect(
      repository.tryExclusive(
        'fixture-lock',
        (locked) => createMedia(locked, objects, limits),
        limits.database,
      ),
    ).resolves.toEqual({ acquired: true, value: true })

    // PostgreSQL ends a session that stays idle in a transaction past its limit, and a PUT plus
    // a verification can together take longer. The row is written only after verification.
    expect(log).toEqual([
      'BEGIN',
      'read row',
      'COMMIT',
      'BEGIN',
      'read row',
      'COMMIT',
      'PUT',
      'verify',
      'BEGIN',
      'insert row',
      'COMMIT',
    ])
  })

  const failures: readonly (readonly [
    string,
    (objects: InMemoryOriginalObjectStore) => unknown,
  ])[] = [
    [
      'the upload fails',
      (objects) =>
        vi.spyOn(objects, 'putOriginal').mockRejectedValueOnce(new Error('Fixture upload failure')),
    ],
    [
      'the store acknowledges other bytes',
      (objects) =>
        vi
          .spyOn(objects, 'putOriginal')
          .mockResolvedValueOnce({ bytes: 1, contentType: 'image/png', key, sha256: checksum }),
    ],
    [
      'verification fails',
      (objects) => vi.spyOn(objects, 'verifyOriginal').mockResolvedValueOnce(false),
    ],
  ]

  it.each(failures)(
    'writes no row when %s, deletes nothing, and the retry stores the same original',
    async (_failure, fail) => {
      const repository = new InMemoryContentRepository()
      const objects = new InMemoryOriginalObjectStore()
      const remove = vi.spyOn(objects, 'deleteOriginal')
      fail(objects)

      await expect(createMedia(repository, objects)).rejects.toThrow()
      expect(await repository.inspect((transaction) => transaction.listMediaAssets())).toEqual([])

      await expect(createMedia(repository, objects)).resolves.toBe(true)
      expect(
        await repository.inspect((transaction) => transaction.getMediaAsset(image.id)),
      ).toMatchObject({ bytes: body.byteLength, originalKey: key, originalSha256: checksum })
      expect(await objects.getOriginal(key)).toEqual(body)
      expect(remove).not.toHaveBeenCalled()
    },
  )

  it.each([
    ['the same original', body],
    ['another original', png(5)],
  ])(
    'keeps an identity the owner creates while the original is stored, with %s',
    async (_original, ownerBody) => {
      const repository = new InMemoryContentRepository()
      const objects = new InMemoryOriginalObjectStore()
      const remove = vi.spyOn(objects, 'deleteOriginal')
      const verify = objects.verifyOriginal.bind(objects)
      let owner: MediaAsset | undefined
      vi.spyOn(objects, 'verifyOriginal').mockImplementationOnce(
        async (original, sha256, signal) => {
          // No seed transaction is open, so the owner's write does not wait for the seed.
          owner = await new MediaOriginalService(repository, objects).store({
            ...image,
            body: ownerBody,
            caption: 'Owner caption',
            contentType: 'image/png',
          })
          return verify(original, sha256, signal)
        },
      )

      await expect(createMedia(repository, objects)).resolves.toBe(false)

      expect(await repository.inspect((transaction) => transaction.listMediaAssets())).toEqual([
        owner,
      ])
      expect(await objects.getOriginal(owner!.originalKey)).toEqual(ownerBody)
      expect(remove).not.toHaveBeenCalled()
    },
  )
})
