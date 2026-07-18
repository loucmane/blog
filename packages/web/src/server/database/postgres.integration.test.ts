import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3'
import { Pool } from 'pg'
import { describe, expect, it } from 'vitest'

import { verifyRestoredContent } from '../content/backup'
import {
  CURRENT_CONTENT_DOCUMENT_VERSION,
  extractContentText,
  type ContentDocument,
} from '../content/document'
import { MediaOriginalService } from '../content/media'
import { ContentConflictError } from '../content/errors'
import { createPortableContentBundle, verifyPortableMedia } from '../content/portability'
import type { Clock, IdentifierSource } from '../content/ports'
import { ContentService } from '../content/service'
import { applyContentMigrations, readContentMigrations } from './migrations'
import { PostgresContentRepository } from './postgres-content-repository'
import { PostgresSearchProjection } from './postgres-search-projection'
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
      applied: ['0001_content_foundation', '0002_owner_auth'],
      skipped: [],
    })
    expect(await applyContentMigrations(pool, migrations)).toEqual({
      applied: [],
      skipped: ['0001_content_foundation', '0002_owner_auth'],
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
      skipped: ['0001_content_foundation'],
    })

    await restoredPool.end()
    await pool.end()
    primaryClient.destroy()
    restoreClient.destroy()
  }, 120_000)
})
