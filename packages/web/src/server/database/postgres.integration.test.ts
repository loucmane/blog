import { spawnSync } from 'node:child_process'
import path from 'node:path'

import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3'
import { Pool } from 'pg'
import { describe, expect, it } from 'vitest'

import { verifyRestoredContent } from '../content/backup'
import type { ContentDocument } from '../content/document'
import { extractContentText } from '../content/document'
import { MediaOriginalService } from '../content/media'
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
    schemaVersion: 3,
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
      applied: ['0001_content_foundation'],
      skipped: [],
    })
    expect(await applyContentMigrations(pool, migrations)).toEqual({
      applied: [],
      skipped: ['0001_content_foundation'],
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
    await service.publish({
      articleId: created.article.id,
      expectedVersion: 1,
      idempotencyKey: 'publish-integration',
      revisionId: created.revision.id,
    })
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

    await restoredPool.end()
    await pool.end()
    primaryClient.destroy()
    restoreClient.destroy()
  }, 120_000)
})
