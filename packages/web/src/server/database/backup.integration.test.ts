import { spawnSync } from 'node:child_process'
import { randomBytes, randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, readFile, readdir, rm, truncate, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3'
import { Pool } from 'pg'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { runBackupCommand } from '../../../scripts/backup.mjs'
import { MediaOriginalService } from '../content/media'
import { createBackup, pruneBackups, verifyBackup } from '../operations/backup'
import { hash, type DrillLocation } from '../operations/restore-drill-contract'
import { listObjectKeys, s3DrillClient } from '../operations/restore-drill-media'
import { quotedIdentifier, type PostgresToolRunner } from '../operations/restore-drill-postgres'
import { runRestoreDrill } from '../operations/restore-drill'
import { applyContentMigrations, readContentMigrations } from './migrations'
import { PostgresContentRepository } from './postgres-content-repository'
import { S3OriginalObjectStore } from './s3-original-object-store'

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error('Backup integration services are required.')
  return value
}

function createTestPool(connectionString: string): Pool {
  const pool = new Pool({ connectionString })
  // DROP DATABASE WITH (FORCE) ends idle connections during fixture cleanup.
  pool.on('error', (error: Error & { code?: string }) => {
    if (error.code !== '57P01') throw error
  })
  return pool
}

const databaseUrl = requiredEnvironment('TASK42_DATABASE_URL')
const composeFile = requiredEnvironment('TASK42_COMPOSE_FILE')
const fixtureEmail = ['backup-fixture', 'example.test'].join('@')
const fixtureBody = Buffer.from('Synthetic original for the independent backup')

const dockerTools: PostgresToolRunner = async (command, args, url, input) => {
  const connection = url
    ? ['-U', 'task42', ...(command === 'pg_dump' ? ['-d', new URL(url).pathname.slice(1)] : [])]
    : []
  const result = spawnSync(
    'docker',
    ['compose', '--file', composeFile, 'exec', '-T', 'postgres', command, ...connection, ...args],
    { input, stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024, timeout: 60_000 },
  )
  if (result.error || result.status !== 0) throw new Error('Isolated PostgreSQL tool failed.')
  return result.stdout
}

describe('independent backup with disposable PostgreSQL and S3', () => {
  let source: DrillLocation
  let target: DrillLocation
  let admin: Pool
  let sourcePool: Pool
  let sourceObjects: S3Client
  let targetObjects: S3Client
  let originalKey: string
  let root: string
  let key: Buffer

  beforeEach(async () => {
    const suffix = randomUUID().replaceAll('-', '').slice(0, 20)
    const credentials = {
      accessKeyId: 'task42-access',
      secretAccessKey: ['task42', 'local', 'secret'].join('-'),
      region: 'us-east-1',
    }
    const location = (kind: 'source' | 'target', endpoint: string): DrillLocation => {
      const url = new URL(databaseUrl)
      url.pathname = `/restore_drill_${kind}_${suffix}`
      return {
        databaseUrl: url.href,
        objects: { ...credentials, endpoint, bucket: `restore-drill-${kind}-${suffix}` },
      }
    }
    source = location('source', requiredEnvironment('TASK42_S3_PRIMARY'))
    target = location('target', requiredEnvironment('TASK42_S3_RESTORE'))
    sourceObjects = s3DrillClient(source.objects)
    targetObjects = s3DrillClient(target.objects)
    admin = createTestPool(databaseUrl)
    await admin.query(
      `CREATE DATABASE ${quotedIdentifier(new URL(source.databaseUrl).pathname.slice(1))} TEMPLATE template0`,
    )
    sourcePool = createTestPool(source.databaseUrl)
    await applyContentMigrations(sourcePool, await readContentMigrations())
    await sourceObjects.send(new CreateBucketCommand({ Bucket: source.objects.bucket }))
    await sourcePool.query(
      `INSERT INTO subscribers (id, email_canonical, status, created_at, updated_at, confirmed_at)
       VALUES ('backup-subscriber', $1, 'confirmed', now(), now(), now())`,
      [fixtureEmail],
    )
    await sourcePool.query(
      `INSERT INTO subscriber_consents (id, subscriber_id, consent_text_version, source, granted_at)
       VALUES ('backup-consent', 'backup-subscriber', 'v1', 'signup', now())`,
    )
    const original = await new MediaOriginalService(
      new PostgresContentRepository(sourcePool),
      new S3OriginalObjectStore(sourceObjects, source.objects.bucket),
    ).store({
      id: 'backup-media',
      body: fixtureBody,
      contentType: 'image/png',
      alt: 'Synthetic original',
      creditName: 'Integration fixture',
      width: 1,
      height: 1,
    })
    originalKey = original.originalKey
    const parent = path.resolve('ci-artifacts/tmp')
    await mkdir(parent, { recursive: true })
    root = await mkdtemp(path.join(parent, 'backup-integration-'))
    key = randomBytes(32)
  }, 60_000)

  afterEach(async () => {
    await sourcePool?.end()
    if (admin) {
      for (const { databaseUrl: url } of [source, target]) {
        await admin.query(
          `DROP DATABASE IF EXISTS ${quotedIdentifier(new URL(url).pathname.slice(1))} WITH (FORCE)`,
        )
      }
      await admin.end()
    }
    for (const [client, location] of [
      [sourceObjects, source],
      [targetObjects, target],
    ] as const) {
      if (!client || !location) continue
      const { bucket } = location.objects
      try {
        for (const object of await listObjectKeys(client, bucket)) {
          await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: object }))
        }
        await client.send(new DeleteBucketCommand({ Bucket: bucket }))
      } catch (error) {
        if (
          (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode !== 404
        )
          throw error
      } finally {
        client.destroy()
      }
    }
    if (root) await rm(root, { recursive: true, force: true })
  }, 60_000)

  it('creates and verifies a set, refuses tampering and restores without live source data', async () => {
    const manifest = await createBackup(root, key, source, { tools: dockerTools })
    const set = path.join(root, `backup-${manifest.id}`)
    expect(await verifyBackup(set, key)).toEqual(manifest)
    expect(manifest.originals[0]).toMatchObject({
      sha256: hash(fixtureBody),
      bytes: fixtureBody.length,
    })
    expect(manifest.migrations).toHaveLength((await readContentMigrations()).length)
    const metadata = await readFile(path.join(set, 'manifest.json'), 'utf8')
    for (const secret of [
      source.databaseUrl,
      source.objects.secretAccessKey,
      originalKey,
      fixtureEmail,
      key.toString('base64url'),
    ]) {
      expect(metadata).not.toContain(secret)
    }
    await expect(verifyBackup(set, randomBytes(32))).rejects.toThrow('authentication_failed')
    const encryptedOriginal = path.join(set, 'original-0.enc')
    const ciphertext = await readFile(encryptedOriginal)
    const modified = Buffer.from(ciphertext)
    modified[12] = modified[12]! ^ 1
    await writeFile(encryptedOriginal, modified)
    await expect(verifyBackup(set, key)).rejects.toThrow('authentication_failed')
    await truncate(encryptedOriginal, ciphertext.length - 1)
    await expect(verifyBackup(set, key)).rejects.toThrow('truncated_file')
    await writeFile(encryptedOriginal, ciphertext)

    await sourcePool.query("DELETE FROM subscriber_consents WHERE id = 'backup-consent'")
    await sourcePool.query("DELETE FROM subscribers WHERE id = 'backup-subscriber'")
    await sourceObjects.send(
      new DeleteObjectCommand({ Bucket: source.objects.bucket, Key: originalKey }),
    )
    const evidence = await runRestoreDrill(
      { isolated: true, source: { backupDirectory: set }, target },
      {
        tools: dockerTools,
        loadBackupKey: async () => key,
      },
    )
    expect(evidence.failures).toEqual([])
    expect(evidence.status).toBe('passed')
    expect(evidence.backup?.setId).toBe(manifest.id)
    expect(evidence.tables.restored).toEqual(evidence.tables.source)
    expect(evidence.tables.restored.subscribers?.count).toBe(1)
    expect(evidence.media).toMatchObject({ expected: 1, copied: 1, verified: 1 })
  }, 120_000)

  it('records each backup:create run in the application database, and backs that table up', async () => {
    const keyFile = path.join(root, 'operator-key')
    await writeFile(keyFile, `${key.toString('base64url')}\n`, { mode: 0o600 })
    const output = vi.fn()
    const error = vi.fn()
    // The source fixture is the application database here: the runs land beside what is backed up.
    const create = (args: { DATABASE_URL: string; input?: unknown }) =>
      runBackupCommand({
        args: ['create', '--directory', root],
        // Only these two names are read; the cast drops Next's augmented required fields.
        environment: {
          MAGAZINE_BACKUP_KEY_FILE: keyFile,
          DATABASE_URL: args.DATABASE_URL,
        } as unknown as NodeJS.ProcessEnv,
        input: async () => ('input' in args ? args.input : source),
        create: (target: string, backupKey: Buffer, configuration: unknown) =>
          createBackup(target, backupKey, configuration, { tools: dockerTools }),
        output,
        error,
      })
    const runs = async () =>
      (
        await sourcePool.query(
          `SELECT kind, outcome, failure_reason, rpo_ms, rto_ms, started_at <= finished_at AS ordered
           FROM operation_runs ORDER BY id`,
        )
      ).rows

    expect(await create({ DATABASE_URL: source.databaseUrl })).toBe(0)
    expect(await runs()).toEqual([
      {
        failure_reason: null,
        kind: 'backup',
        ordered: true,
        outcome: 'succeeded',
        rpo_ms: null,
        rto_ms: null,
      },
    ])

    // The second backup holds the first run: an application table like any other.
    expect(await create({ DATABASE_URL: source.databaseUrl })).toBe(0)
    const second = JSON.parse(output.mock.calls.at(-1)?.[0] as string).name as string
    const evidence = await runRestoreDrill(
      { isolated: true, source: { backupDirectory: path.join(root, second) }, target },
      { tools: dockerTools, loadBackupKey: async () => key },
    )
    expect(evidence.failures).toEqual([])
    expect(evidence.status).toBe('passed')
    expect(evidence.tables.source.operation_runs?.count).toBe(1)
    expect(evidence.tables.restored).toEqual(evidence.tables.source)

    // A failed backup is recorded with its fixed code.
    expect(await create({ DATABASE_URL: source.databaseUrl, input: {} })).toBe(1)
    expect((await runs()).at(-1)).toMatchObject({
      failure_reason: 'invalid_configuration',
      outcome: 'failed',
    })

    // A backup whose run cannot be recorded keeps its set and exits 3, naming no connection detail.
    const unreachable = new URL(source.databaseUrl)
    unreachable.port = '1'
    error.mockClear()
    expect(await create({ DATABASE_URL: unreachable.href })).toBe(3)
    expect(error).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('(operation_failed)'))
    const kept = JSON.parse(output.mock.calls.at(-1)?.[0] as string).name as string
    expect((await verifyBackup(path.join(root, kept), key)).id).toBe(kept.slice('backup-'.length))
    for (const secret of [unreachable.href, decodeURIComponent(unreachable.password)]) {
      expect(JSON.stringify(error.mock.calls)).not.toContain(secret)
    }
    expect(await runs()).toHaveLength(3)
  }, 120_000)

  it('prunes only verified redundant sets and repeats without removing the latest', async () => {
    const snapshots = ['2026-11-23T00:00:00Z', '2026-11-23T10:00:00Z']
    const names = []
    for (const time of snapshots) {
      const set = await createBackup(root, key, source, {
        tools: dockerTools,
        now: () => new Date(time),
      })
      names.push(`backup-${set.id}`)
    }
    const incomplete = `backup-${randomUUID()}`
    await mkdir(path.join(root, incomplete))
    expect(await pruneBackups(root, key, true)).toMatchObject({
      remove: [names[0]],
      kept: [names[1]],
    })
    expect(await readdir(root)).toHaveLength(3)
    expect(await pruneBackups(root, key, false)).toMatchObject({
      remove: [names[0]],
      kept: [names[1]],
    })
    expect(await pruneBackups(root, key, false)).toMatchObject({ remove: [], kept: [names[1]] })
    expect(await readdir(root)).toEqual(expect.arrayContaining([names[1], incomplete]))
  }, 120_000)
})
