import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import path from 'node:path'

import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3'
import { Pool } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { runRestoreDrillCommand } from '../../../scripts/restore-drill.mjs'
import { CURRENT_CONTENT_DOCUMENT_VERSION } from '../content/document'
import type { MediaAsset } from '../content/domain'
import { MediaOriginalService } from '../content/media'
import { ContentService } from '../content/service'
import {
  hash,
  type RestoreDrillConfig,
  type RestoreDrillEvidence,
} from '../operations/restore-drill-contract'
import { listObjectKeys, s3DrillClient } from '../operations/restore-drill-media'
import { quotedIdentifier, type PostgresToolRunner } from '../operations/restore-drill-postgres'
import { runRestoreDrill } from '../operations/restore-drill'
import { applyContentMigrations, readContentMigrations } from './migrations'
import { PostgresContentRepository } from './postgres-content-repository'
import { S3OriginalObjectStore } from './s3-original-object-store'

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error('Restore drill integration services are required.')
  return value
}

const databaseUrl = requiredEnvironment('TASK42_DATABASE_URL')
const restoreDatabaseUrl = requiredEnvironment('TASK42_RESTORE_DATABASE_URL')
const composeFile = requiredEnvironment('TASK42_COMPOSE_FILE')
const fixtureTime = '2026-11-13T10:00:00.000Z'
const fixtureEmail = ['restore-fixture', 'example.test'].join('@')
const fixtureBody = new TextEncoder().encode('Synthetic original for the restore drill')

// Use the same PostgreSQL 18 binaries as the Compose server; the host needs no pg CLI install.
const dockerTools: PostgresToolRunner = async (command, args, url, input) => {
  const database = url ? new URL(url).pathname.slice(1) : undefined
  const connection = database
    ? ['-U', 'task42', ...(command === 'pg_dump' ? ['-d', database] : [])]
    : []
  const result = spawnSync(
    'docker',
    ['compose', '--file', composeFile, 'exec', '-T', 'postgres', command, ...connection, ...args],
    {
      input,
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 256 * 1024 * 1024,
      timeout: 60_000,
    },
  )
  if (result.error || result.status !== 0) throw new Error('Isolated PostgreSQL tool failed.')
  return result.stdout
}

describe('repeatable isolated PostgreSQL 18 restore drill', () => {
  let config: RestoreDrillConfig
  let source: Pool
  let admin: Pool
  let sourceObjects: S3Client
  let targetObjects: S3Client
  let media: MediaAsset
  let directory: string

  beforeEach(async () => {
    const suffix = randomUUID().replaceAll('-', '').slice(0, 20)
    const sourceUrl = new URL(databaseUrl)
    sourceUrl.pathname = `/restore_drill_source_${suffix}`
    const targetUrl = new URL(restoreDatabaseUrl)
    targetUrl.pathname = `/restore_drill_target_${suffix}`
    const credentials = {
      accessKeyId: 'task42-access',
      secretAccessKey: ['task42', 'local', 'secret'].join('-'),
      region: 'us-east-1',
    }
    config = {
      isolated: true,
      source: {
        databaseUrl: sourceUrl.href,
        objects: {
          ...credentials,
          endpoint: requiredEnvironment('TASK42_S3_PRIMARY'),
          bucket: `restore-drill-source-${suffix}`,
        },
      },
      target: {
        databaseUrl: targetUrl.href,
        objects: {
          ...credentials,
          endpoint: requiredEnvironment('TASK42_S3_RESTORE'),
          bucket: `restore-drill-target-${suffix}`,
        },
      },
    }
    admin = new Pool({ connectionString: databaseUrl })
    await admin.query(
      `CREATE DATABASE ${quotedIdentifier(sourceUrl.pathname.slice(1))} TEMPLATE template0`,
    )
    source = new Pool({ connectionString: sourceUrl.href })
    const migrations = await readContentMigrations()
    await applyContentMigrations(source, migrations)
    sourceObjects = s3DrillClient(config.source.objects)
    targetObjects = s3DrillClient(config.target.objects)
    await sourceObjects.send(new CreateBucketCommand({ Bucket: config.source.objects.bucket }))
    const repository = new PostgresContentRepository(source)
    const service = new ContentService(repository, { now: () => new Date(fixtureTime) })
    const makeStory = async (id: string) =>
      service.createArticle({
        id,
        slug: id,
        title: 'Synthetic restore story',
        dek: 'Restore evidence fixture',
        idempotencyKey: `create-${id}`,
        document: {
          articleId: id,
          title: 'Synthetic restore story',
          schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
          migrationProvenance: [],
          document: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Private synthetic article payload' }],
              },
            ],
          },
        },
      })
    const story = await makeStory('restore-published')
    const published = await service.publish({
      articleId: story.article.id,
      expectedVersion: story.article.version,
      revisionId: story.revision.id,
      idempotencyKey: 'publish-story',
    })
    await service.changeSlug({
      articleId: story.article.id,
      expectedVersion: published.article.version,
      slug: 'restore-new-slug',
      idempotencyKey: 'change-slug',
    })
    const scheduled = await makeStory('restore-scheduled')
    await service.schedulePublication({
      articleId: scheduled.article.id,
      expectedVersion: scheduled.article.version,
      revisionId: scheduled.revision.id,
      runAt: '2026-11-14T10:00:00.000Z',
      timeZone: 'Europe/Stockholm',
      idempotencyKey: 'schedule-story',
    })
    await source.query(
      `INSERT INTO subscribers (id, email_canonical, status, created_at, updated_at, confirmed_at)
      VALUES ('subscriber-fixture', $1, 'confirmed', $2, $2, $2)`,
      [fixtureEmail, fixtureTime],
    )
    await source.query(
      `INSERT INTO subscriber_consents (id, subscriber_id, consent_text_version, source, granted_at)
      VALUES ('consent-fixture', 'subscriber-fixture', 'v1', 'signup', $1)`,
      [fixtureTime],
    )
    await source.query(
      `INSERT INTO subscription_events (id, subscriber_id, type, consent_id, created_at)
      VALUES ('event-fixture', 'subscriber-fixture', 'confirmed', 'consent-fixture', $1)`,
      [fixtureTime],
    )
    media = await new MediaOriginalService(
      repository,
      new S3OriginalObjectStore(sourceObjects, config.source.objects.bucket),
      { now: () => new Date(fixtureTime) },
    ).store({
      id: 'restore-media',
      alt: 'Synthetic original',
      body: fixtureBody,
      contentType: 'image/png',
      creditName: 'Integration fixture',
      width: 1,
      height: 1,
    })
    await mkdir(path.resolve('ci-artifacts/tmp'), { recursive: true })
    directory = await mkdtemp(path.resolve('ci-artifacts/tmp/restore-drill-'))
  }, 60_000)

  afterEach(async () => {
    await source?.end()
    if (admin && config) {
      for (const location of [config.source, config.target]) {
        const name = new URL(location.databaseUrl).pathname.slice(1)
        await admin.query(`DROP DATABASE IF EXISTS ${quotedIdentifier(name)} WITH (FORCE)`)
      }
      await admin.end()
    }
    for (const [client, location] of [
      [sourceObjects, config?.source],
      [targetObjects, config?.target],
    ] as const) {
      if (!client || !location) continue
      try {
        for (const key of await listObjectKeys(client, location.objects.bucket)) {
          await client.send(new DeleteObjectCommand({ Bucket: location.objects.bucket, Key: key }))
        }
        await client.send(new DeleteBucketCommand({ Bucket: location.objects.bucket }))
      } catch (error) {
        if (
          (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode !== 404
        )
          throw error
      } finally {
        client.destroy()
      }
    }
    if (directory) await rm(directory, { recursive: true, force: true })
  }, 60_000)

  function assertRedacted(evidence: RestoreDrillEvidence) {
    const serialized = JSON.stringify(evidence)
    for (const value of [
      fixtureEmail,
      'Private synthetic article payload',
      config.source.databaseUrl,
      config.target.databaseUrl,
      config.source.objects.secretAccessKey,
      media.originalKey,
    ]) {
      expect(serialized).not.toContain(value)
    }
    expect(evidence.backup?.sha256).toMatch(/^[a-f0-9]{64}$/)
    expect(evidence.migrations.reviewedSha256).toMatch(/^[a-f0-9]{64}$/)
  }

  async function alteredRestore(sql: string): Promise<RestoreDrillEvidence> {
    return runRestoreDrill(config, {
      tools: async (command, args, url, input) => {
        const result = await dockerTools(command, args, url, input)
        if (command === 'pg_restore' && input) {
          const target = new Pool({ connectionString: config.target.databaseUrl })
          try {
            await target.query(sql)
          } finally {
            await target.end()
          }
        }
        return result
      },
    })
  }

  it('runs the operator command end to end and records counts, checksums, export validity and measured objectives', async () => {
    const evidencePath = path.join(directory, 'evidence.json')
    const exit = await runRestoreDrillCommand({
      args: ['--evidence', evidencePath],
      input: async () => config,
      drill: (value: unknown) => runRestoreDrill(value, { tools: dockerTools }),
      output: () => {},
    })
    expect(exit).toBe(0)
    const evidence: RestoreDrillEvidence = JSON.parse(await readFile(evidencePath, 'utf8'))
    expect(evidence.status).toBe('passed')
    expect(evidence.failures).toEqual([])
    expect(evidence.tables.restored).toEqual(evidence.tables.source)
    for (const table of [
      'articles',
      'article_revisions',
      'slug_redirects',
      'publishing_jobs',
      'subscribers',
      'subscriber_consents',
      'subscription_events',
      'audit_events',
    ]) {
      expect(evidence.tables.restored[table]?.count).toBeGreaterThan(0)
    }
    expect(evidence.export.status).toBe('valid')
    expect(evidence.media).toMatchObject({
      expected: 1,
      copied: 1,
      verified: 1,
      objects: [{ expectedSha256: hash(fixtureBody), restoredSha256: hash(fixtureBody) }],
    })
    expect(evidence.recovery.rpoMilliseconds).toBeGreaterThanOrEqual(0)
    expect(evidence.recovery.rtoMilliseconds).toBeGreaterThan(0)
    expect(evidence.recovery).toMatchObject({ rpoMet: true, rtoMet: true })
    assertRedacted(evidence)
  }, 60_000)

  it('applies only the documented forward migration when restoring an older compatible ledger', async () => {
    // 0010 changes only event constraints; these fixture rows are valid with either version.
    const down = await readFile(
      path.resolve('packages/web/migrations/0010_subscriber_privacy_events.down.sql'),
      'utf8',
    )
    await source.query(down)
    const evidence = await runRestoreDrill(config, { tools: dockerTools })
    expect(evidence.status).toBe('passed')
    expect(evidence.migrations.appliedCount).toBe(1)
    expect(evidence.migrations.finalSha256).toBe(evidence.migrations.reviewedSha256)
    assertRedacted(evidence)
  }, 60_000)

  it('reports a missing row by entity', async () => {
    const evidence = await alteredRestore('DELETE FROM slug_redirects')
    expect(evidence.failures).toContainEqual({
      code: 'row_count_mismatch',
      stage: 'comparison',
      subject: 'slug_redirects',
    })
    expect(evidence.status).toBe('failed')
    assertRedacted(evidence)
  }, 60_000)

  it('reports changed published, revision, schedule, consent and audit state even when counts match', async () => {
    const evidence =
      await alteredRestore(`UPDATE articles SET published_at = published_at + interval '1 second' WHERE published_at IS NOT NULL;
      UPDATE article_revisions SET title = 'Changed synthetic title';
      UPDATE publishing_jobs SET run_at = run_at + interval '1 second';
      UPDATE subscriber_consents SET consent_text_version = 'v2';
      UPDATE audit_events SET action = 'changed.fixture'`)
    for (const subject of [
      'articles',
      'article_revisions',
      'publishing_jobs',
      'subscriber_consents',
      'audit_events',
    ]) {
      expect(evidence.failures).toContainEqual({
        code: 'invariant_changed',
        stage: 'comparison',
        subject,
      })
    }
    expect(evidence.failures).toContainEqual({ code: 'export_invalid', stage: 'export' })
    expect(evidence.status).toBe('failed')
    assertRedacted(evidence)
  }, 60_000)

  it('reports missing originals', async () => {
    await sourceObjects.send(
      new DeleteObjectCommand({ Bucket: config.source.objects.bucket, Key: media.originalKey }),
    )
    const evidence = await runRestoreDrill(config, { tools: dockerTools })
    expect(evidence.failures).toContainEqual({
      code: 'missing_object',
      stage: 'backup',
      subject: hash(media.originalKey),
    })
    expect(evidence.failures).toContainEqual({
      code: 'missing_object',
      stage: 'comparison',
      subject: hash(media.originalKey),
    })
    expect(evidence.status).toBe('failed')
    assertRedacted(evidence)
  }, 60_000)

  it('reports orphaned objects independently of known originals', async () => {
    const key = 'orphaned-synthetic-original'
    await sourceObjects.send(
      new PutObjectCommand({ Bucket: config.source.objects.bucket, Key: key, Body: fixtureBody }),
    )
    const evidence = await runRestoreDrill(config, { tools: dockerTools })
    expect(evidence.failures).toContainEqual({
      code: 'orphaned_object',
      stage: 'backup',
      subject: hash(key),
    })
    expect(evidence.status).toBe('failed')
    assertRedacted(evidence)
  }, 60_000)

  it('reports checksum mismatches using downloaded bytes', async () => {
    await sourceObjects.send(
      new PutObjectCommand({
        Bucket: config.source.objects.bucket,
        Key: media.originalKey,
        Body: 'changed-original',
        Metadata: { 'application-sha256': media.originalSha256 },
      }),
    )
    const evidence = await runRestoreDrill(config, { tools: dockerTools })
    expect(evidence.failures).toContainEqual({
      code: 'checksum_mismatch',
      stage: 'backup',
      subject: hash(media.originalKey),
    })
    expect(evidence.status).toBe('failed')
    assertRedacted(evidence)
  }, 60_000)

  it('rejects migration identity drift before applying any forward SQL', async () => {
    const evidence = await alteredRestore(
      "UPDATE content_schema_migrations SET checksum = repeat('0', 64) WHERE id = '0001_content_foundation'",
    )
    expect(evidence.failures).toContainEqual({
      code: 'migration_identity_mismatch',
      stage: 'migrations',
    })
    expect(evidence.migrations.appliedCount).toBe(0)
    expect(evidence.status).toBe('failed')
    assertRedacted(evidence)
  }, 60_000)

  it('refuses a reused target without changing its sentinel data', async () => {
    const targetName = new URL(config.target.databaseUrl).pathname.slice(1)
    await admin.query(`CREATE DATABASE ${quotedIdentifier(targetName)} TEMPLATE template0`)
    const target = new Pool({ connectionString: config.target.databaseUrl })
    try {
      await target.query('CREATE TABLE sentinel (id int); INSERT INTO sentinel VALUES (42)')
      const evidence = await runRestoreDrill(config, { tools: dockerTools })
      expect(evidence.failures).toContainEqual({ code: 'target_exists', stage: 'preflight' })
      expect((await target.query('SELECT id FROM sentinel')).rows).toEqual([{ id: 42 }])
    } finally {
      await target.end()
    }
  }, 60_000)
})
