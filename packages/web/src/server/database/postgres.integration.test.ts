import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { CreateBucketCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Pool } from 'pg'
import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  readArticleView,
  readAuthorView,
  readHomeView,
  readPublicMediaIds,
  readSectionView,
  readTopicView,
  relatedStoryLimit,
  type ReaderSource,
} from '../../reader/read-model'
import { verifyRestoredContent } from '../content/backup'
import {
  CURRENT_CONTENT_DOCUMENT_VERSION,
  extractContentText,
  type ContentDocument,
} from '../content/document'
import type { AuthorProfile, MediaAsset, TaxonomyTerm } from '../content/domain'
import { InMemoryContentRepository } from '../content/in-memory-repository'
import { MediaOriginalService, originalObjectKey, sha256Bytes } from '../content/media'
import { MediaVariantService, mediaVariantObjectKey } from '../content/media-variants'
import { ContentConflictError } from '../content/errors'
import { createPortableContentBundle, verifyPortableMedia } from '../content/portability'
import type { Clock, ContentRepository, IdentifierSource } from '../content/ports'
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
import { ownerSetupIntegrationTests } from './owner-setup-integration'
import { migrateCommandIntegrationTests } from './migrate-command-integration'
import { labSeedIntegrationTests } from './lab-seed-integration'
import { labSeedConcurrencyIntegrationTests } from './lab-seed-concurrency-integration'
import { labSeedDatabaseIntegrationTests } from './lab-seed-database-integration'

labSeedDatabaseIntegrationTests({
  databaseUrl: requiredEnvironment('TASK42_DATABASE_URL'),
})

labSeedConcurrencyIntegrationTests({
  databaseUrl: requiredEnvironment('TASK42_DATABASE_URL'),
  s3Endpoint: requiredEnvironment('TASK42_S3_PRIMARY'),
})

ownerSetupIntegrationTests({
  databaseUrl: requiredEnvironment('TASK42_DATABASE_URL'),
  schema: `owner_setup_${randomUUID().replaceAll('-', '')}`,
})

migrateCommandIntegrationTests({
  databaseUrl: requiredEnvironment('TASK42_DATABASE_URL'),
  schema: `migrate_command_${randomUUID().replaceAll('-', '')}`,
})

labSeedIntegrationTests({
  databaseUrl: requiredEnvironment('TASK42_DATABASE_URL'),
  schema: `lab_seed_${randomUUID().replaceAll('-', '')}`,
  s3Endpoint: requiredEnvironment('TASK42_S3_PRIMARY'),
})

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
    const migrationIds = [
      '0001_content_foundation',
      '0002_owner_auth',
      '0003_publication_version',
      '0004_media_asset_animation',
      '0005_article_authors',
    ]
    expect(await applyContentMigrations(pool, migrations)).toEqual({
      applied: migrationIds,
      skipped: [],
    })
    expect(await applyContentMigrations(pool, migrations)).toEqual({
      applied: [],
      skipped: migrationIds,
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
      animated: true,
      body: new TextEncoder().encode('task42 synthetic media original'),
      contentType: 'image/png',
      creditName: 'Task 42 integration',
      focalPoint: { x: 0.2, y: 0.8 },
      height: 48,
      id: 'media-integration',
      width: 64,
    })
    // What was measured about the original when it was stored, and its focal point, come back
    // from PostgreSQL.
    await expect(
      repository.transaction((transaction) => transaction.getMediaAsset('media-integration')),
    ).resolves.toMatchObject({ animated: true, focalX: 0.2, focalY: 0.8, height: 48, width: 64 })

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
      skipped: [
        '0001_content_foundation',
        '0003_publication_version',
        '0004_media_asset_animation',
        '0005_article_authors',
      ],
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
      animated: false,
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

  it('credits authors in byline order under the keys of migration 0005, which reverses', async () => {
    const pool = new Pool({ connectionString: databaseUrl, max: 2 })
    const repository = new PostgresContentRepository(pool)
    const service = new ContentService(repository, clock)
    const migrations = await readContentMigrations()
    const downSql = await readFile(
      path.join(process.cwd(), 'packages/web/migrations/0005_article_authors.down.sql'),
      'utf8',
    )
    const table = async () =>
      (await pool.query("SELECT to_regclass('article_authors')::text AS name")).rows[0]?.name
    const reapply = async () =>
      expect(await applyContentMigrations(pool, migrations)).toEqual({
        applied: ['0005_article_authors'],
        skipped: migrations.map(({ id }) => id).filter((id) => id !== '0005_article_authors'),
      })
    const credited = (articleId: string) =>
      repository.transaction((transaction) => transaction.listArticleAuthors(articleId))
    const creditedIn = (authorId: string) =>
      repository.transaction((transaction) => transaction.listAuthorArticles(authorId))
    const setCredits = (articleId: string, authorIds: readonly string[]) =>
      repository.transaction((transaction) => transaction.setArticleAuthors(articleId, authorIds))

    // Up (the first test applied it), down on an empty table, and up again.
    expect(await table()).toBe('article_authors')
    await pool.query(downSql)
    expect(await table()).toBeNull()
    await reapply()

    const now = clock.now().toISOString()
    const author = (id: string, displayName: string): AuthorProfile => ({
      bio: `${displayName} writes about rooms.`,
      createdAt: now,
      displayName,
      id,
      slug: id,
      updatedAt: now,
    })
    const first = author('author-byline-first', 'First Byline')
    const second = author('author-byline-second', 'Second Byline')
    await repository.transaction(async (transaction) => {
      await transaction.saveAuthor(first)
      await transaction.saveAuthor(second)
    })
    const create = (id: string) =>
      service.createArticle({
        dek: 'Byline proof',
        document: document(id),
        id,
        idempotencyKey: `create-${id}`,
        slug: id.replace('article-', ''),
        title: 'Byline proof',
      })
    // Created out of id order, so id order and creation order differ.
    const zeta = await create('article-byline-zeta')
    const alpha = await create('article-byline-alpha')
    await service.publish({
      articleId: zeta.article.id,
      expectedVersion: zeta.article.version,
      idempotencyKey: 'publish-article-byline-zeta',
      revisionId: zeta.revision.id,
    })

    // A byline keeps the order it was set in; an author's articles come in id order, any status.
    expect(await credited(zeta.article.id)).toEqual([])
    await setCredits(zeta.article.id, [second.id, first.id])
    await setCredits(alpha.article.id, [first.id])
    expect(await credited(zeta.article.id)).toEqual([second, first])
    expect((await creditedIn(first.id)).map(({ id, status }) => ({ id, status }))).toEqual([
      { id: alpha.article.id, status: 'draft' },
      { id: zeta.article.id, status: 'published' },
    ])

    // Setting replaces the whole byline.
    await setCredits(zeta.article.id, [first.id])
    expect(await credited(zeta.article.id)).toEqual([first])
    expect(await creditedIn(second.id)).toEqual([])

    // The keys refuse a repeated or unknown author, an unknown article and a shared position.
    await expect(setCredits(zeta.article.id, [second.id, second.id])).rejects.toMatchObject({
      code: '23505',
    })
    await expect(
      setCredits(zeta.article.id, [second.id, 'author-byline-missing']),
    ).rejects.toMatchObject({ code: '23503' })
    await expect(setCredits('article-byline-missing', [first.id])).rejects.toMatchObject({
      code: '23503',
    })
    await expect(
      pool.query(
        'INSERT INTO article_authors (article_id, author_id, position) VALUES ($1, $2, 0)',
        [zeta.article.id, second.id],
      ),
    ).rejects.toMatchObject({ code: '23505' })
    expect(await credited(zeta.article.id)).toEqual([first])

    // A credited author cannot be deleted; deleting an article deletes its credits.
    await expect(pool.query('DELETE FROM authors WHERE id = $1', [first.id])).rejects.toMatchObject(
      { code: '23001' }, // restrict_violation: ON DELETE RESTRICT, not NO ACTION (23503)
    )
    const bare = 'article-byline-bare'
    await repository.transaction(async (transaction) => {
      await transaction.saveRevision({
        articleId: bare,
        createdAt: now,
        document: document(bare),
        id: `${bare}-revision`,
        revisionNumber: 1,
      })
      await transaction.saveArticle(
        {
          createdAt: now,
          currentDraftRevisionId: `${bare}-revision`,
          deletedAt: null,
          dek: '',
          id: bare,
          preDeleteStatus: null,
          publishedAt: null,
          publishedRevisionId: null,
          scheduledAt: null,
          scheduledRevisionId: null,
          slug: 'byline-bare',
          status: 'draft',
          title: 'Byline bare',
          updatedAt: now,
          version: 1,
        },
        null,
      )
      await transaction.setArticleAuthors(bare, [second.id])
    })
    expect((await creditedIn(second.id)).map(({ id }) => id)).toEqual([bare])
    // One simple query runs as one transaction, so the deferred revision keys hold at its commit.
    await pool.query(`
      DELETE FROM article_revisions WHERE article_id = '${bare}';
      DELETE FROM articles WHERE id = '${bare}';
    `)
    // Count the rows themselves: the reads join articles, so they would hide a dangling credit.
    expect(
      (
        await pool.query(
          'SELECT count(*)::int AS count FROM article_authors WHERE article_id = $1',
          [bare],
        )
      ).rows[0]?.count,
    ).toBe(0)
    expect(await creditedIn(second.id)).toEqual([])

    // Down with credits present drops only the credits; up again starts with none.
    const counts = async () =>
      (
        await pool.query(
          'SELECT (SELECT count(*) FROM articles)::int AS articles, (SELECT count(*) FROM authors)::int AS authors',
        )
      ).rows[0]
    const before = await counts()
    await pool.query(downSql)
    expect(await table()).toBeNull()
    expect(await counts()).toEqual(before)
    await reapply()
    expect(await credited(zeta.article.id)).toEqual([])
    expect(await creditedIn(first.id)).toEqual([])

    await pool.end()
  }, 120_000)
})

describe('author, topic and related-story reads on real PostgreSQL', () => {
  // Each case gets a new schema with every content migration applied, so it sees only its own
  // stories. The same stories also go into an in-memory repository, and each PostgreSQL view must
  // equal the in-memory one field for field.
  type StoryState = 'deleted' | 'draft' | 'published' | 'rescheduled' | 'scheduled' | 'withdrawn'

  interface Topic {
    readonly kind: Exclude<TaxonomyTerm['kind'], 'section'>
    readonly name: string
    readonly slug: string
  }

  interface Story {
    /** The byline, in order. */
    readonly authors?: readonly AuthorProfile[]
    /** The day in June 2026 the story is written, and published if it is. */
    readonly day: number
    /** Section slugs, primary section first. */
    readonly sections?: readonly string[]
    readonly slug: string
    /**
     * Readers see `published` stories and `rescheduled` ones: published, with a newer revision
     * scheduled. A `scheduled` story waits for its first publication, so readers cannot see it.
     */
    readonly state?: StoryState
    /** Categories and tags, filed after the sections, in this order. */
    readonly topics?: readonly Topic[]
  }

  const termTime = '2026-06-01T00:00:00.000Z'
  const scheduledRunAt = '2026-12-01T09:00:00.000Z'
  // Stories readers never see: withdrawn, deleted, never published, and waiting for a first
  // scheduled publication.
  const hiddenStates = ['withdrawn', 'deleted', 'draft', 'scheduled'] as const
  const profile = (slug: string, displayName: string, bio: string): AuthorProfile => ({
    bio,
    createdAt: termTime,
    displayName,
    id: `author-${slug}`,
    slug,
    updatedAt: termTime,
  })
  const alpha = profile('alpha', 'Alpha Writer', 'Alpha Writer writes about rooms.')
  const bravo = profile('bravo', 'Bravo Writer', '   ')
  const lightCategory: Topic = { kind: 'category', name: 'Light', slug: 'light' }
  const lightTag: Topic = { kind: 'tag', name: 'light', slug: 'light' }
  const winterTag: Topic = { kind: 'tag', name: 'Winter', slug: 'winter' }
  const interiors = { href: '/sections/interiors', name: 'interiors', slug: 'interiors' }

  let schema: string
  let admin: Pool
  let pool: Pool
  let memory: ReaderSource
  let postgres: ReaderSource

  beforeEach(async () => {
    schema = `reader_pages_${randomUUID().replaceAll('-', '')}`
    admin = new Pool({ connectionString: databaseUrl, max: 1 })
    await admin.query(`CREATE SCHEMA "${schema}"`)
    pool = new Pool({ connectionString: databaseUrl, max: 2, options: `-c search_path=${schema}` })
    await applyContentMigrations(pool, await readContentMigrations())
    memory = { mediaAvailable: true, repository: new InMemoryContentRepository() }
    postgres = { mediaAvailable: true, repository: new PostgresContentRepository(pool) }
  })

  afterEach(async () => {
    await pool.end()
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
    await admin.end()
  })

  /** Makes the same writes in the in-memory repository, then in PostgreSQL. */
  async function inBothStores(write: (store: ContentRepository) => Promise<void>) {
    await write(memory.repository)
    await write(postgres.repository)
  }

  async function saveAuthors(store: ContentRepository, ...authors: AuthorProfile[]) {
    await store.transaction(async (transaction) => {
      for (const author of authors) await transaction.saveAuthor(author)
    })
  }

  /** Files an article under a category or tag, after its existing taxonomy links. */
  async function fileUnder(store: ContentRepository, articleId: string, topic: Topic) {
    await store.transaction(async (transaction) => {
      const id = `${topic.kind}-${topic.slug}`
      if (!(await transaction.listTaxonomyTerms()).some((term) => term.id === id)) {
        await transaction.saveTaxonomyTerm({
          ...topic,
          createdAt: termTime,
          id,
          updatedAt: termTime,
        })
      }
      const positions = (await transaction.listArticleTaxonomies())
        .filter((link) => link.articleId === articleId)
        .map(({ position }) => position)
      await transaction.saveArticleTaxonomy({
        articleId,
        position: Math.max(-1, ...positions) + 1,
        taxonomyId: id,
      })
      transaction.recordPublicationChange()
    })
  }

  /** Adds a story with its byline, sections and topics, then takes it to its state. */
  async function addStory(store: ContentRepository, story: Story) {
    const { day, slug, state = 'published' } = story
    const clock: Clock = { now: () => new Date(Date.UTC(2026, 5, day, 7)) }
    const service = new ContentService(store, clock)
    const sections = new SectionService(store, clock)
    const articleId = `article-${slug}`
    const created = await service.createArticle({
      dek: `Summary of ${slug}`,
      document: { ...document(articleId), title: `Title of ${slug}` },
      id: articleId,
      idempotencyKey: `create-${slug}`,
      slug,
      title: `Title of ${slug}`,
    })
    const authorIds = (story.authors ?? []).map(({ id }) => id)
    if (authorIds.length > 0) {
      await store.transaction(async (transaction) => {
        await transaction.setArticleAuthors(articleId, authorIds)
        transaction.recordPublicationChange()
      })
    }
    for (const sectionSlug of story.sections ?? []) {
      const section = await sections.ensureSection({
        id: `section-${sectionSlug}`,
        name: sectionSlug,
        slug: sectionSlug,
      })
      await sections.assignSection({ articleId, sectionId: section.id })
    }
    for (const topic of story.topics ?? []) await fileUnder(store, articleId, topic)

    if (state === 'draft') return
    const schedule = (expectedVersion: number, revisionId: string) =>
      service.schedulePublication({
        articleId,
        expectedVersion,
        idempotencyKey: `schedule-${slug}`,
        revisionId,
        runAt: scheduledRunAt,
        timeZone: 'Europe/Stockholm',
      })
    if (state === 'scheduled') {
      await schedule(created.article.version, created.revision.id)
      return
    }
    const { article } = await service.publish({
      articleId,
      expectedVersion: created.article.version,
      idempotencyKey: `publish-${slug}`,
      revisionId: created.revision.id,
    })
    if (state === 'withdrawn') {
      await service.unpublish({
        articleId,
        expectedVersion: article.version,
        idempotencyKey: `unpublish-${slug}`,
        reason: 'Integration check',
      })
    } else if (state === 'deleted') {
      await service.softDelete({
        articleId,
        expectedVersion: article.version,
        idempotencyKey: `delete-${slug}`,
      })
    } else if (state === 'rescheduled') {
      const update = await service.saveDraft({
        articleId,
        document: { ...document(articleId), title: `Next title of ${slug}` },
        expectedVersion: article.version,
        idempotencyKey: `save-${slug}`,
        title: `Next title of ${slug}`,
      })
      await schedule(update.article.version, update.revision.id)
    }
  }

  it('finds an author by slug, and nobody by an unknown slug or an author id', async () => {
    await inBothStores((store) => saveAuthors(store, alpha, bravo))
    const bySlug = (source: ReaderSource, slug: string) =>
      source.repository.transaction((transaction) => transaction.getAuthorBySlug(slug))

    expect(await bySlug(postgres, 'alpha')).toEqual(alpha)
    expect(await bySlug(postgres, 'bravo')).toEqual(bravo)
    expect(await bySlug(postgres, 'unknown')).toBeNull()
    expect(await bySlug(postgres, alpha.id)).toBeNull()
    for (const slug of ['alpha', 'bravo', 'unknown', alpha.id]) {
      expect(await bySlug(postgres, slug)).toEqual(await bySlug(memory, slug))
    }
  }, 30_000)

  it('lists only the visible stories that credit an author, newest first', async () => {
    await inBothStores(async (store) => {
      await saveAuthors(store, alpha, bravo)
      await addStory(store, { authors: [alpha], day: 1, sections: ['interiors'], slug: 'first' })
      await addStory(store, { authors: [bravo, alpha], day: 2, slug: 'second' })
      await addStory(store, { authors: [bravo], day: 3, slug: 'theirs' })
      await addStory(store, { authors: [alpha], day: 4, slug: 'rescheduled', state: 'rescheduled' })
      for (const state of hiddenStates) {
        await addStory(store, { authors: [alpha], day: 5, slug: state, state })
      }
    })

    const page = await readAuthorView(postgres, 'alpha')

    expect(page).toMatchObject({
      bio: 'Alpha Writer writes about rooms.',
      href: '/authors/alpha',
      name: 'Alpha Writer',
      navigation: { sections: [interiors] },
      slug: 'alpha',
    })
    expect(page?.stories.map(({ slug }) => slug)).toEqual(['rescheduled', 'second', 'first'])
    // A story with a newer revision scheduled shows the revision readers see now.
    expect(page?.stories[0]).toMatchObject({
      publishedAt: '2026-06-04T07:00:00.000Z',
      title: 'Title of rescheduled',
    })
    expect(page?.stories[2]?.section).toEqual(interiors)
    expect(page).toEqual(await readAuthorView(memory, 'alpha'))
  }, 30_000)

  it('lists only the visible stories filed under a topic, newest first, and no topic for other slugs', async () => {
    await inBothStores(async (store) => {
      await addStory(store, { day: 1, sections: ['interiors'], slug: 'lamp', topics: [lightTag] })
      await addStory(store, { day: 2, sections: ['craft'], slug: 'window', topics: [lightTag] })
      await addStory(store, { day: 3, slug: 'candle', topics: [lightCategory] })
      await addStory(store, {
        day: 4,
        slug: 'rescheduled',
        state: 'rescheduled',
        topics: [lightTag],
      })
      for (const state of hiddenStates) {
        await addStory(store, { day: 5, slug: state, state, topics: [lightTag, lightCategory] })
      }
      // A section is never part of a topic, even one with the same slug.
      await addStory(store, { day: 6, sections: ['light'], slug: 'only-in-a-section' })
    })

    const topic = await readTopicView(postgres, 'light')

    expect(topic).toMatchObject({
      description: null,
      href: '/topics/light',
      // The category names the topic before the tag that shares its slug.
      name: 'Light',
      slug: 'light',
    })
    expect(topic?.stories.map(({ slug }) => slug)).toEqual([
      'rescheduled',
      'candle',
      'window',
      'lamp',
    ])
    expect(topic?.stories.map(({ section }) => section?.slug ?? null)).toEqual([
      null,
      null,
      'craft',
      'interiors',
    ])
    expect(topic?.navigation.sections.map(({ slug }) => slug)).toEqual([
      'craft',
      'interiors',
      'light',
    ])
    expect(topic).toEqual(await readTopicView(memory, 'light'))
    expect(await readTopicView(postgres, 'unknown')).toBeNull()
    expect(await readTopicView(postgres, 'interiors')).toBeNull()
  }, 30_000)

  it('gives an unknown author or topic no page, and one without a visible story an empty page', async () => {
    const unseen: Topic = { kind: 'tag', name: 'Unseen', slug: 'unseen' }
    await inBothStores(async (store) => {
      await saveAuthors(store, alpha, bravo)
      await addStory(store, { authors: [alpha], day: 1, sections: ['interiors'], slug: 'room' })
      for (const state of hiddenStates) {
        await addStory(store, { authors: [bravo], day: 2, slug: state, state, topics: [unseen] })
      }
    })

    // The routes answer an unknown slug with 404 and these with an empty page.
    expect(await readAuthorView(postgres, 'unknown')).toBeNull()
    expect(await readTopicView(postgres, 'unknown')).toBeNull()
    expect(await readAuthorView(postgres, 'bravo')).toEqual({
      bio: null,
      href: '/authors/bravo',
      name: 'Bravo Writer',
      navigation: { sections: [interiors] },
      slug: 'bravo',
      stories: [],
    })
    expect(await readTopicView(postgres, 'unseen')).toEqual({
      description: null,
      href: '/topics/unseen',
      name: 'Unseen',
      navigation: { sections: [interiors] },
      slug: 'unseen',
      stories: [],
    })
    expect(await readAuthorView(postgres, 'bravo')).toEqual(await readAuthorView(memory, 'bravo'))
    expect(await readTopicView(postgres, 'unseen')).toEqual(await readTopicView(memory, 'unseen'))
  }, 30_000)

  it('credits, files and relates an article as the in-memory repository does', async () => {
    const rooms = Array.from({ length: relatedStoryLimit + 1 }, (_, index) => `room-${index + 1}`)
    // Every other story is newer than the rooms.
    const after = (days: number) => rooms.length + days
    await inBothStores(async (store) => {
      await saveAuthors(store, alpha, bravo)
      for (const [index, slug] of rooms.entries()) {
        await addStory(store, { day: index + 1, sections: ['interiors'], slug })
      }
      await addStory(store, { day: after(1), sections: ['craft'], slug: 'chair' })
      for (const state of hiddenStates) {
        await addStory(store, { day: after(2), sections: ['interiors'], slug: state, state })
      }
      // Filed under interiors as its second section, so it is related too.
      await addStory(store, { day: after(3), sections: ['craft', 'interiors'], slug: 'stool' })
      await addStory(store, {
        authors: [bravo, alpha],
        day: after(4),
        sections: ['interiors'],
        slug: 'feature',
        topics: [winterTag, lightCategory, lightTag],
      })
      await addStory(store, { day: after(5), slug: 'loose' })
    })

    const article = await readArticleView(postgres, 'feature')

    expect(article).toMatchObject({
      authorLinks: [
        { href: '/authors/bravo', name: 'Bravo Writer' },
        { href: '/authors/alpha', name: 'Alpha Writer' },
      ],
      authors: ['Bravo Writer', 'Alpha Writer'],
      section: interiors,
      // Each topic once, at its first link; the section is not a topic.
      topics: [
        { href: '/topics/winter', name: 'Winter' },
        { href: '/topics/light', name: 'Light' },
      ],
    })
    // The newest other visible stories under its primary section, at most the limit.
    expect(article?.related.map(({ slug }) => slug)).toEqual(
      ['stool', ...[...rooms].reverse()].slice(0, relatedStoryLimit),
    )
    expect(article?.related[0]).toMatchObject({
      href: '/stories/stool',
      section: { slug: 'craft' },
      title: 'Title of stool',
    })
    expect(article).toEqual(await readArticleView(memory, 'feature'))
    expect(await readArticleView(postgres, 'loose')).toMatchObject({
      authorLinks: [],
      related: [],
      topics: [],
    })
    for (const state of hiddenStates) expect(await readArticleView(postgres, state)).toBeNull()
  }, 30_000)
})
