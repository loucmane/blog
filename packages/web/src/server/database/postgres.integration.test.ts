import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { CreateBucketCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Pool } from 'pg'
import sharp from 'sharp'
import { describe, expect, it, vi } from 'vitest'

import {
  readArticleView,
  readHomeView,
  readPublicMediaIds,
  readSectionView,
} from '../../reader/read-model'
import { verifyRestoredContent } from '../content/backup'
import {
  CURRENT_CONTENT_DOCUMENT_VERSION,
  extractContentText,
  type ContentDocument,
} from '../content/document'
import type { MediaAsset } from '../content/domain'
import { MediaOriginalService, originalObjectKey, sha256Bytes } from '../content/media'
import { MediaVariantService, mediaVariantObjectKey } from '../content/media-variants'
import { ContentConflictError } from '../content/errors'
import { createPortableContentBundle, verifyPortableMedia } from '../content/portability'
import type { Clock, IdentifierSource } from '../content/ports'
import { SectionService } from '../content/sections'
import { ContentService } from '../content/service'
import { renderIllustration } from '../lab/illustrations'
import { labImages } from '../lab/north-house'
import { seedLabContent } from '../lab/seed'
import { applyContentMigrations, readContentMigrations } from './migrations'
import { PostgresContentRepository } from './postgres-content-repository'
import { PostgresSearchProjection } from './postgres-search-projection'
import { S3MediaVariantStore } from './s3-media-variant-store'
import { S3OriginalObjectStore } from './s3-original-object-store'

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required for the Task 42 integration suite`)
  return value
}

const databaseUrl = requiredEnvironment('TASK42_DATABASE_URL')
const restoreDatabaseUrl = requiredEnvironment('TASK42_RESTORE_DATABASE_URL')
const primaryS3Endpoint = requiredEnvironment('TASK42_S3_PRIMARY')
const restoreS3Endpoint = requiredEnvironment('TASK42_S3_RESTORE')
const composeFile = requiredEnvironment('TASK42_COMPOSE_FILE')

class Identifiers implements IdentifierSource {
  private index = 0

  next(kind: string): string {
    this.index += 1
    return `${kind}-integration-${this.index}`
  }
}

const clock: Clock = { now: () => new Date('2026-07-17T23:00:00.000Z') }

function document(articleId: string): ContentDocument {
  return {
    articleId,
    document: {
      content: [
        {
          content: [{ text: 'PostgreSQL restore and owner-controlled media proof', type: 'text' }],
          type: 'paragraph',
        },
      ],
      type: 'doc',
    },
    migrationProvenance: [],
    schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
    title: 'Content persistence integration',
  }
}

function s3(endpoint: string) {
  return new S3Client({
    credentials: { accessKeyId: 'task42-access', secretAccessKey: 'task42-local-secret' },
    endpoint,
    forcePathStyle: true,
    region: 'us-east-1',
  })
}

function compose(args: readonly string[], options: { binary?: boolean; input?: Buffer } = {}) {
  const result = spawnSync('docker', ['compose', '--file', composeFile, ...args], {
    cwd: path.resolve(process.cwd()),
    encoding: options.binary ? 'buffer' : 'utf8',
    input: options.input,
    maxBuffer: 25 * 1024 * 1024,
  })
  if (result.status !== 0) throw new Error(Buffer.from(result.stderr ?? '').toString())
  return result.stdout
}

describe('PostgreSQL and media persistence integration', () => {
  it('migrates, rolls back failures, projects search, and restores database plus media', async () => {
    const pool = new Pool({ connectionString: databaseUrl, max: 4 })
    const migrations = await readContentMigrations()
    expect(await applyContentMigrations(pool, migrations)).toEqual({
      applied: ['0001_content_foundation', '0002_owner_auth', '0003_publication_version'],
      skipped: [],
    })
    expect(await applyContentMigrations(pool, migrations)).toEqual({
      applied: [],
      skipped: ['0001_content_foundation', '0002_owner_auth', '0003_publication_version'],
    })

    const repository = new PostgresContentRepository(pool)
    const service = new ContentService(repository, clock, new Identifiers())
    const primaryClient = s3(primaryS3Endpoint)
    const restoreClient = s3(restoreS3Endpoint)
    const bucket = 'task42-media'
    await primaryClient.send(new CreateBucketCommand({ Bucket: bucket }))
    await restoreClient.send(new CreateBucketCommand({ Bucket: bucket }))
    const primaryObjects = new S3OriginalObjectStore(primaryClient, bucket)
    const restoredObjects = new S3OriginalObjectStore(restoreClient, bucket)
    const mediaService = new MediaOriginalService(
      repository,
      primaryObjects,
      clock,
      new Identifiers(),
    )

    const created = await service.createArticle({
      dek: 'Integration proof',
      document: document('article-integration'),
      id: 'article-integration',
      idempotencyKey: 'create-integration',
      slug: 'content-persistence-integration',
      title: 'Content persistence integration',
    })
    await pool.query(
      `UPDATE article_revisions
       SET document = jsonb_set(document, '{schemaVersion}', '3'::jsonb),
           document_schema_version = 3
       WHERE id = $1`,
      [created.revision.id],
    )
    await expect(
      repository.transaction((transaction) => transaction.getRevision(created.revision.id)),
    ).resolves.toMatchObject({
      document: {
        migrationProvenance: [{ from: 3, migration: 'content-v3-to-v4', to: 4 }],
        schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
      },
    })
    const published = await service.publish({
      articleId: created.article.id,
      expectedVersion: 1,
      idempotencyKey: 'publish-integration',
      revisionId: created.revision.id,
    })
    const concurrent = await Promise.allSettled([
      service.saveDraft({
        articleId: created.article.id,
        document: document(created.article.id),
        expectedVersion: published.article.version,
        idempotencyKey: 'concurrent-postgres-save-a',
        title: 'Concurrent PostgreSQL draft A',
      }),
      service.saveDraft({
        articleId: created.article.id,
        document: document(created.article.id),
        expectedVersion: published.article.version,
        idempotencyKey: 'concurrent-postgres-save-b',
        title: 'Concurrent PostgreSQL draft B',
      }),
    ])
    expect(concurrent.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
    expect(concurrent.find(({ status }) => status === 'rejected')).toMatchObject({
      reason: expect.any(ContentConflictError),
      status: 'rejected',
    })
    expect(
      (
        await pool.query(
          'SELECT array_agg(revision_number ORDER BY revision_number) AS revisions FROM article_revisions WHERE article_id = $1',
          [created.article.id],
        )
      ).rows[0]?.revisions,
    ).toEqual([1, 2])
    const afterConflict = await repository.transaction((transaction) =>
      transaction.getArticle(created.article.id),
    )
    if (!afterConflict) throw new Error('The concurrent-save article disappeared.')
    const retryInput = {
      articleId: created.article.id,
      document: document(created.article.id),
      expectedVersion: afterConflict.version,
      idempotencyKey: 'concurrent-postgres-same-key',
      title: 'Idempotent PostgreSQL retry',
    }
    const retries = await Promise.all([
      service.saveDraft(retryInput),
      service.saveDraft(retryInput),
    ])
    expect(retries[1]).toEqual(retries[0])
    expect(
      (
        await pool.query(
          'SELECT array_agg(revision_number ORDER BY revision_number) AS revisions FROM article_revisions WHERE article_id = $1',
          [created.article.id],
        )
      ).rows[0]?.revisions,
    ).toEqual([1, 2, 3])
    expect(
      (
        await pool.query(
          'SELECT count(*)::int AS count FROM article_autosaves WHERE idempotency_key = $1',
          [retryInput.idempotencyKey],
        )
      ).rows[0]?.count,
    ).toBe(1)

    const scheduledArticle = await service.createArticle({
      dek: 'Publication lease race proof',
      document: document('article-publication-lease'),
      id: 'article-publication-lease',
      idempotencyKey: 'create-publication-lease',
      slug: 'publication-lease-race-proof',
      title: 'Publication lease race proof',
    })
    const scheduled = await service.schedulePublication({
      articleId: scheduledArticle.article.id,
      expectedVersion: scheduledArticle.article.version,
      idempotencyKey: 'schedule-publication-lease',
      revisionId: scheduledArticle.revision.id,
      runAt: '2026-07-17T23:01:00.000Z',
      timeZone: 'Europe/Stockholm',
    })
    await service.claimDuePublication({
      leaseMilliseconds: 1_000,
      now: '2026-07-17T23:01:00.000Z',
      workerId: 'worker-stale',
    })
    let releaseJobLock!: () => void
    let reportJobLocked!: () => void
    const jobLocked = new Promise<void>((resolve) => {
      reportJobLocked = resolve
    })
    const holdJobLock = new Promise<void>((resolve) => {
      releaseJobLock = resolve
    })
    const lockedJob = repository.transaction(async (transaction) => {
      const job = await transaction.getPublicationJobForUpdate(scheduled.job.id)
      reportJobLocked()
      await holdJobLock
      return job
    })
    await jobLocked
    await expect(
      service.claimDuePublication({
        leaseMilliseconds: 1_000,
        now: '2026-07-17T23:01:02.000Z',
        workerId: 'worker-current',
      }),
    ).resolves.toBeNull()
    releaseJobLock()
    await expect(lockedJob).resolves.toMatchObject({ claimedBy: 'worker-stale' })
    await expect(
      service.claimDuePublication({
        leaseMilliseconds: 1_000,
        now: '2026-07-17T23:01:02.000Z',
        workerId: 'worker-current',
      }),
    ).resolves.toMatchObject({ claimedBy: 'worker-current' })

    const completions = await Promise.allSettled([
      service.completeScheduledPublication({
        completedAt: '2026-07-17T23:01:02.500Z',
        jobId: scheduled.job.id,
        workerId: 'worker-stale',
      }),
      service.completeScheduledPublication({
        completedAt: '2026-07-17T23:01:02.500Z',
        jobId: scheduled.job.id,
        workerId: 'worker-current',
      }),
    ])
    expect(
      completions.some(
        (result) => result.status === 'fulfilled' && result.value.duplicate === false,
      ),
    ).toBe(true)
    await expect(
      repository.transaction((transaction) => transaction.getPublicationJob(scheduled.job.id)),
    ).resolves.toMatchObject({ claimedBy: null, status: 'completed' })
    await expect(
      repository.transaction((transaction) => transaction.getArticle(scheduledArticle.article.id)),
    ).resolves.toMatchObject({ status: 'published' })

    const media = await mediaService.store({
      alt: 'Synthetic local persistence fixture',
      body: new TextEncoder().encode('task42 synthetic media original'),
      contentType: 'image/png',
      creditName: 'Task 42 integration',
      id: 'media-integration',
    })

    const projection = new PostgresSearchProjection(pool)
    await projection.upsertPublishedArticle({
      articleId: created.article.id,
      publishedAt: '2026-07-17T23:00:00.000Z',
      searchText: extractContentText(created.revision.document),
      slug: created.article.slug,
      title: created.article.title,
    })
    expect(
      (
        await pool.query(
          "SELECT count(*)::int AS count FROM article_search_documents WHERE document @@ websearch_to_tsquery('english', $1)",
          ['PostgreSQL media'],
        )
      ).rows[0]?.count,
    ).toBe(1)

    await expect(
      repository.transaction(async (transaction) => {
        await transaction.saveAuditEvent({
          action: 'synthetic.rollback',
          actorId: null,
          articleId: created.article.id,
          createdAt: '2026-07-17T23:00:00.000Z',
          id: 'audit-rolled-back',
          metadata: {},
        })
        throw new Error('synthetic transaction interruption')
      }),
    ).rejects.toThrow(/synthetic transaction interruption/)
    expect(
      (
        await pool.query(
          "SELECT count(*)::int AS count FROM audit_events WHERE id = 'audit-rolled-back'",
        )
      ).rows[0]?.count,
    ).toBe(0)

    const exportedAt = '2026-07-17T23:05:00.000Z'
    const expected = await createPortableContentBundle(repository, exportedAt)
    expect(await verifyPortableMedia(expected, primaryObjects)).toEqual({ failed: [], verified: 1 })

    const dump = compose(
      ['exec', '-T', 'postgres', 'pg_dump', '-U', 'task42', '-d', 'magazine', '--format=custom'],
      { binary: true },
    ) as Buffer
    expect(dump.byteLength).toBeGreaterThan(0)
    compose([
      'exec',
      '-T',
      'postgres',
      'dropdb',
      '-U',
      'task42',
      '--if-exists',
      '--force',
      'magazine_restore',
    ])
    compose(['exec', '-T', 'postgres', 'createdb', '-U', 'task42', 'magazine_restore'])
    compose(
      [
        'exec',
        '-T',
        'postgres',
        'pg_restore',
        '-U',
        'task42',
        '-d',
        'magazine_restore',
        '--exit-on-error',
      ],
      { binary: true, input: dump },
    )

    const restoredBody = await primaryObjects.getOriginal(media.originalKey)
    await restoredObjects.putOriginal({
      body: restoredBody,
      contentType: media.contentType,
      key: media.originalKey,
      sha256: media.originalSha256,
    })
    const restoredPool = new Pool({
      connectionString: restoreDatabaseUrl,
      max: 2,
    })
    const restoredRepository = new PostgresContentRepository(restoredPool)
    const restored = await createPortableContentBundle(restoredRepository, exportedAt)
    const mediaReport = await verifyPortableMedia(restored, restoredObjects)
    expect(
      verifyRestoredContent({ expected, failedMedia: mediaReport.failed, restored }),
    ).toMatchObject({
      status: 'passed',
    })

    const downSql = await readFile(
      path.join(process.cwd(), 'packages/web/migrations/0002_owner_auth.down.sql'),
      'utf8',
    )
    await restoredPool.query('BEGIN')
    await restoredPool.query(downSql)
    await restoredPool.query('COMMIT')
    await expect(applyContentMigrations(restoredPool, migrations)).resolves.toEqual({
      applied: ['0002_owner_auth'],
      skipped: ['0001_content_foundation', '0003_publication_version'],
    })

    await restoredPool.end()
    await pool.end()
    primaryClient.destroy()
    restoreClient.destroy()
  }, 120_000)

  it('serves public reader views and the Reader Lab seed from PostgreSQL and S3', async () => {
    const pool = new Pool({ connectionString: databaseUrl, max: 2 })
    const repository = new PostgresContentRepository(pool)
    const source = { mediaAvailable: true, repository }
    const clockAt = (isoTimestamp: string): Clock => ({ now: () => new Date(isoTimestamp) })
    const sections = new SectionService(repository, clock)
    const interiors = await sections.ensureSection({ name: 'Interiors', slug: 'reader-interiors' })
    const publishStory = async (slug: string, publishedAt: string) => {
      const service = new ContentService(repository, clockAt(publishedAt))
      const articleId = `article-${slug}`
      const created = await service.createArticle({
        dek: `Summary of ${slug}`,
        document: { ...document(articleId), title: `Title of ${slug}` },
        id: articleId,
        idempotencyKey: `create-${slug}`,
        slug,
        title: `Title of ${slug}`,
      })
      await sections.assignSection({ articleId, sectionId: interiors.id })
      const published = await service.publish({
        articleId,
        expectedVersion: created.article.version,
        idempotencyKey: `publish-${slug}`,
        revisionId: created.revision.id,
      })
      return { published, service }
    }
    await publishStory('reader-older-story', '2026-08-01T07:00:00.000Z')
    const newer = await publishStory('reader-newer-story', '2026-08-02T07:00:00.000Z')

    const home = await readHomeView(source)
    const homeSlugs = [home.lead, ...home.recent].flatMap((card) => (card ? [card.slug] : []))
    expect(homeSlugs.indexOf('reader-newer-story')).toBeGreaterThanOrEqual(0)
    expect(homeSlugs.indexOf('reader-newer-story')).toBeLessThan(
      homeSlugs.indexOf('reader-older-story'),
    )
    expect(await readArticleView(source, 'reader-newer-story')).toMatchObject({
      publishedAt: '2026-08-02T07:00:00.000Z',
      section: { name: 'Interiors', slug: 'reader-interiors' },
      title: 'Title of reader-newer-story',
    })
    expect(
      (await readSectionView(source, 'reader-interiors'))?.stories.map(({ slug }) => slug),
    ).toEqual(['reader-newer-story', 'reader-older-story'])

    await newer.service.unpublish({
      articleId: newer.published.article.id,
      expectedVersion: newer.published.article.version,
      idempotencyKey: 'unpublish-reader-newer-story',
      reason: 'Integration check',
    })
    expect(await readArticleView(source, 'reader-newer-story')).toBeNull()
    expect(
      (await readSectionView(source, 'reader-interiors'))?.stories.map(({ slug }) => slug),
    ).toEqual(['reader-older-story'])

    const mediaClient = s3(primaryS3Endpoint)
    const labBucket = 'reader-lab-media'
    await mediaClient.send(new CreateBucketCommand({ Bucket: labBucket }))
    const target = { objects: new S3OriginalObjectStore(mediaClient, labBucket), repository }
    const seeded = await seedLabContent(target)
    expect(seeded.stories.created).toHaveLength(8)
    expect(seeded.images.created).toEqual(labImages.map(({ id }) => id))
    expect((await readHomeView(source)).lead?.title).toBe('The quiet architecture of winter light')
    expect(await readPublicMediaIds(source)).toEqual(
      expect.arrayContaining(labImages.map(({ id }) => id)),
    )
    const reseeded = await seedLabContent(target)
    expect(reseeded.stories.created).toEqual([])
    expect(reseeded.images.created).toEqual([])

    mediaClient.destroy()
    await pool.end()
  }, 120_000)

  it('advances the publication version in the commit of each publication change', async () => {
    const pool = new Pool({ connectionString: databaseUrl, max: 2 })
    const repository = new PostgresContentRepository(pool)
    const service = new ContentService(repository, clock)
    const before = await repository.readPublicationVersion()

    const created = await service.createArticle({
      dek: 'Publication version proof',
      document: document('article-publication-version'),
      id: 'article-publication-version',
      idempotencyKey: 'create-publication-version',
      slug: 'publication-version-proof',
      title: 'Publication version proof',
    })
    expect(await repository.readPublicationVersion()).toBe(before)
    const published = await service.publish({
      articleId: created.article.id,
      expectedVersion: created.article.version,
      idempotencyKey: 'publish-publication-version',
      revisionId: created.revision.id,
    })
    expect(await repository.readPublicationVersion()).toBe(before + 1)
    await expect(
      repository.transaction(async (transaction) => {
        transaction.recordPublicationChange()
        throw new Error('synthetic publication rollback')
      }),
    ).rejects.toThrow(/synthetic publication rollback/)
    expect(await repository.readPublicationVersion()).toBe(before + 1)
    await service.unpublish({
      articleId: created.article.id,
      expectedVersion: published.article.version,
      idempotencyKey: 'unpublish-publication-version',
      reason: 'Integration check',
    })
    expect(await repository.readPublicationVersion()).toBe(before + 2)

    // A version read is one statement on the pool, outside any transaction.
    const query = vi.spyOn(pool, 'query')
    await repository.readPublicationVersion()
    expect(query.mock.calls).toEqual([
      ['SELECT version FROM content_publication_state WHERE id = 1'],
    ])

    await pool.end()
  }, 120_000)

  it('keeps derived media variants beside the originals in S3 and rebuilds deleted ones', async () => {
    const client = s3(primaryS3Endpoint)
    const bucket = 'media-variants'
    await client.send(new CreateBucketCommand({ Bucket: bucket }))
    const originals = new S3OriginalObjectStore(client, bucket)
    const variants = new S3MediaVariantStore(client, bucket)
    const winterLight = labImages.find(({ id }) => id === 'media-lab-winter-light')
    if (!winterLight) throw new Error('The lab seed should include the winter light image.')
    const body = renderIllustration(winterLight.illustration)
    const checksum = sha256Bytes(body)
    const originalKey = originalObjectKey(winterLight.id, checksum)
    await originals.putOriginal({
      body,
      contentType: 'image/png',
      key: originalKey,
      sha256: checksum,
    })
    const asset: MediaAsset = {
      alt: winterLight.alt,
      bytes: body.byteLength,
      caption: winterLight.caption,
      contentType: 'image/png',
      createdAt: clock.now().toISOString(),
      creditName: winterLight.creditName,
      creditUrl: null,
      focalX: winterLight.focalPoint.x,
      focalY: winterLight.focalPoint.y,
      height: winterLight.illustration.height,
      id: winterLight.id,
      originalKey,
      originalSha256: checksum,
      updatedAt: clock.now().toISOString(),
      width: winterLight.illustration.width,
    }
    const variant = { format: 'avif', width: 960 } as const
    const key = mediaVariantObjectKey(asset, variant)
    expect(await variants.getVariant(key)).toBeNull()

    const generated = await new MediaVariantService(originals, variants).load(asset, variant)

    expect(await variants.getVariant(key)).toEqual(generated)
    expect(await sharp(generated).metadata()).toMatchObject({
      format: 'heif',
      height: 640,
      width: 960,
    })

    // Variants are derived copies: deleting one is safe, and the next request rebuilds it.
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    expect(await variants.getVariant(key)).toBeNull()
    const rebuilt = await new MediaVariantService(originals, variants).load(asset, variant)
    expect(await sharp(rebuilt).metadata()).toMatchObject({
      format: 'heif',
      height: 640,
      width: 960,
    })
    expect(await variants.getVariant(key)).toEqual(rebuilt)
    expect(await originals.verifyOriginal(originalKey, checksum)).toBe(true)

    client.destroy()
  }, 120_000)
})
