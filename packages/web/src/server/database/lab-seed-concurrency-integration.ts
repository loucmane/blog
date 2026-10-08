// Registered in the coordinator-owned Docker PostgreSQL/S3 suite.
import { randomUUID } from 'node:crypto'

import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3'
import { Pool } from 'pg'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from '../../app/api/internal/lab-seed/route'
import { sha256Bytes } from '../content/media'
import { renderIllustration } from '../lab/illustrations'
import { labImages } from '../lab/north-house'
import { seedLabContent } from '../lab/seed'
import { createOwnerRuntime, type OwnerRuntime } from '../owner/runtime'
import { applyContentMigrations, readContentMigrations } from './migrations'
import { labSeedBarrier } from '../../../tests/support/lab-seed-barrier'

export function labSeedConcurrencyIntegrationTests({
  databaseUrl,
  s3Endpoint,
}: {
  databaseUrl: string
  s3Endpoint: string
}) {
  describe('concurrent hosted seeds across independent PostgreSQL sessions', () => {
    const runtimeKey = Symbol.for('magazine.owner-runtime')
    const runtimeGlobal = globalThis as typeof globalThis & { [runtimeKey]?: OwnerRuntime }
    const token = 'fixture-concurrent-lab-seed-'.padEnd(48, 'x')
    let schema: string
    let admin: Pool
    let client: S3Client
    let first: OwnerRuntime
    let second: OwnerRuntime

    function request() {
      return new Request('https://preview.example.invalid/api/internal/lab-seed', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
      })
    }

    beforeEach(async () => {
      schema = `lab_seed_concurrent_${randomUUID().replaceAll('-', '')}`
      const target = new URL(databaseUrl)
      target.searchParams.set('options', `-c search_path=${schema}`)
      admin = new Pool({ connectionString: databaseUrl, max: 1 })
      await admin.query(`CREATE SCHEMA "${schema}"`)
      const bucket = schema.replaceAll('_', '-')
      // Existing Docker S3 fixture credentials, never hosted credentials.
      const credentials = { accessKeyId: 'task42-access', secretAccessKey: 'task42-local-secret' }
      client = new S3Client({
        endpoint: s3Endpoint,
        forcePathStyle: true,
        region: 'us-east-1',
        credentials,
      })
      await client.send(new CreateBucketCommand({ Bucket: bucket }))
      const environment = {
        NODE_ENV: 'production',
        MAGAZINE_DEPLOYMENT_ENVIRONMENT: 'preview',
        VERCEL: '1',
        VERCEL_ENV: 'preview',
        VERCEL_TARGET_ENV: 'preview',
        MAGAZINE_LAB_SEED_TOKEN: token,
        MAGAZINE_OWNER_TEST_MODE: undefined,
        DATABASE_URL: target.href,
        MAGAZINE_MEDIA_BUCKET: bucket,
        MAGAZINE_MEDIA_REGION: 'us-east-1',
        MAGAZINE_MEDIA_ENDPOINT: s3Endpoint,
        MAGAZINE_MEDIA_ACCESS_KEY_ID: credentials.accessKeyId,
        MAGAZINE_MEDIA_SECRET_ACCESS_KEY: credentials.secretAccessKey,
      }
      for (const [key, value] of Object.entries(environment)) vi.stubEnv(key, value)
      first = createOwnerRuntime(environment)
      second = createOwnerRuntime(environment)
      runtimeGlobal[runtimeKey] = second
      await applyContentMigrations(first.pool!, await readContentMigrations())
    })
    afterEach(async () => {
      delete runtimeGlobal[runtimeKey]
      vi.unstubAllEnvs()
      await first?.pool?.end()
      await second?.pool?.end()
      client?.destroy()
      await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
      await admin.end()
    })

    it.each([false, true])(
      'refuses B while A is paused, preserves owner edits and never repeats a PUT (initially present: %s)',
      { timeout: 30_000 },
      async (present) => {
        expect(first.pool).not.toBe(second.pool)
        const image = labImages[0]!
        expect(image.id).toBe('media-lab-boathouse')
        const putA = vi.spyOn(first.objects!, 'putOriginal')
        const putB = vi.spyOn(second.objects!, 'putOriginal')
        const createOwnerMedia = () =>
          first.media!.store({
            ...image,
            body: renderIllustration(image.illustration),
            contentType: 'image/png',
          })
        if (present) await createOwnerMedia()
        const checked = labSeedBarrier()
        const resume = labSeedBarrier()
        const run = seedLabContent(first, {
          afterMediaCheck: async (id) => {
            if (id !== image.id) return
            checked.resolve()
            await resume.promise
          },
        })
        try {
          await checked.promise
          const beforeB = await second.repository.transaction(async (transaction) => ({
            media: await transaction.listMediaAssets(),
            articles: await transaction.listArticles(),
            sections: await transaction.listTaxonomyTerms(),
          }))
          const refused = await POST(request())
          expect(refused.status).toBe(409)
          expect(refused.headers.get('cache-control')).toBe('private, no-store')
          expect(await refused.json()).toEqual({
            error: 'The lab seed is already running. Try again shortly.',
          })
          expect(putB).not.toHaveBeenCalled()
          expect(putA).toHaveBeenCalledTimes(present ? 1 : 0)
          expect(
            await second.repository.transaction(async (transaction) => ({
              media: await transaction.listMediaAssets(),
              articles: await transaction.listArticles(),
              sections: await transaction.listTaxonomyTerms(),
            })),
          ).toEqual(beforeB)
          // Also exercise an owner creation winning the initial read/insert race.
          if (!present) await createOwnerMedia()
          await second.repository.transaction(async (transaction) => {
            const asset = await transaction.getMediaAsset(image.id)
            await transaction.saveMediaAsset({
              ...asset!,
              alt: 'Owner alt text',
              caption: 'Owner caption',
            })
          })
        } finally {
          resume.resolve()
          await run
        }
        expect((await run).images.created).toHaveLength(labImages.length - 1)
        expect((await run).images.existing).toEqual([image.id])
        expect(putA).toHaveBeenCalledTimes(labImages.length)
        const assets = await second.repository.transaction((transaction) =>
          transaction.listMediaAssets(),
        )
        expect(assets.find(({ id }) => id === image.id)).toMatchObject({
          alt: 'Owner alt text',
          caption: 'Owner caption',
        })
        const originals = new Map<string, Uint8Array>()
        for (const asset of assets) {
          const bytes = await second.objects!.getOriginal(asset.originalKey)
          expect(sha256Bytes(bytes)).toBe(asset.originalSha256)
          originals.set(asset.id, bytes)
        }
        const replay = await POST(request())
        expect(replay.status).toBe(200)
        expect((await replay.json()).images.created).toEqual([])
        expect(putB).not.toHaveBeenCalled()
        expect(putA).toHaveBeenCalledTimes(labImages.length)
        expect(
          await second.repository.transaction((transaction) => transaction.listMediaAssets()),
        ).toEqual(assets)
        for (const asset of assets) {
          expect(await second.objects!.getOriginal(asset.originalKey)).toEqual(
            originals.get(asset.id),
          )
        }
      },
    )

    it(
      'rolls back a failed media creation and releases the session lock for another instance',
      { timeout: 30_000 },
      async () => {
        vi.spyOn(first.objects!, 'putOriginal').mockRejectedValueOnce(
          new Error('Fixture upload failure'),
        )
        await expect(seedLabContent(first)).rejects.toThrow('Fixture upload failure')
        expect(
          await second.repository.transaction((transaction) => transaction.listMediaAssets()),
        ).toEqual([])
        const response = await POST(request())
        expect(response.status).toBe(200)
        expect((await response.json()).images.created).toHaveLength(labImages.length)
      },
    )

    it(
      'times out verification after a real S3 PUT, rolls back and releases the PostgreSQL lock for retry',
      { timeout: 30_000 },
      async () => {
        let signal: AbortSignal | undefined
        let originalKey: string | undefined
        // Keep the real PUT and database transaction; simulate a verification service
        // that never responds, even to cancellation. The unit suite covers stalled
        // HEAD/GET/body transport independently with a fake clock.
        vi.spyOn(first.objects!, 'verifyOriginal').mockImplementationOnce((key, _sha, ioSignal) => {
          originalKey = key
          signal = ioSignal
          return new Promise(() => {})
        })
        await expect(seedLabContent(first, { storageTimeoutMs: 1_000 })).rejects.toThrow(
          'Lab seed storage timed out',
        )
        expect(signal?.aborted).toBe(true)
        expect(originalKey).toBeDefined()
        // The uploaded original is retained; only the unverified row rolls back.
        const original = await second.objects!.getOriginal(originalKey!)
        expect(original.byteLength).toBeGreaterThan(0)
        expect(
          await second.repository.transaction((transaction) => transaction.listMediaAssets()),
        ).toEqual([])
        const response = await POST(request())
        expect(response.status).toBe(200)
        expect((await response.json()).images.created).toHaveLength(labImages.length)
        expect(await second.objects!.getOriginal(originalKey!)).toEqual(original)
        const put = vi.spyOn(second.objects!, 'putOriginal')
        expect((await POST(request())).status).toBe(200)
        expect(put).not.toHaveBeenCalled()
      },
    )
  })
}
