import { performance } from 'node:perf_hooks'

import type { S3Client } from '@aws-sdk/client-s3'
import type { Pool } from 'pg'

import { createPortableContentBundle, inspectPortableContentBundle } from '../content/portability'
import { applyContentMigrations, readContentMigrations } from '../database/migrations'
import { PostgresContentRepository } from '../database/postgres-content-repository'
import { PostgresSubscriptionStore } from '../database/postgres-subscriptions'
import { S3OriginalObjectStore } from '../database/s3-original-object-store'
import { BackupError } from './backup-crypto'
import { readVerifiedBackup } from './backup-set'
import {
  DrillError,
  fingerprint,
  hash,
  measureRecovery,
  newDrillEvidence,
  restoreDrillConfig,
  type DrillLocation,
  type DrillStage,
  type RestoreDrillEvidence,
} from './restore-drill-contract'
import {
  copyOriginals,
  createFreshBucket,
  s3DrillClient,
  verifyOriginals,
  type DrillMediaObject,
} from './restore-drill-media'
import {
  capturePostgresSnapshot,
  captureTables,
  compareTables,
  drillPool,
  migrationIdentity,
  postgres18Version,
  quotedIdentifier,
  requireMigrationPrefix,
  runPostgresTool,
  type PostgresToolRunner,
} from './restore-drill-postgres'

export type { RestoreDrillEvidence } from './restore-drill-contract'

/** Local synthetic environments only. No raw archive, export, driver error or URL leaves this boundary. */
export async function runRestoreDrill(
  input: unknown,
  options: {
    readonly tools?: PostgresToolRunner
    readonly now?: () => Date
    readonly monotonic?: () => number
    readonly loadBackupKey?: () => Promise<Buffer>
  } = {},
): Promise<RestoreDrillEvidence> {
  const now = options.now ?? (() => new Date())
  const monotonic = options.monotonic ?? (() => performance.now())
  const tools = options.tools ?? runPostgresTool
  const evidence = newDrillEvidence(now())
  let stage: DrillStage = 'configuration'
  let restoreStart: number | null = null
  const pools: Pool[] = []
  const clients: S3Client[] = []
  try {
    const parsed = restoreDrillConfig.safeParse(input)
    if (!parsed.success) throw new DrillError('invalid_configuration')
    const config = parsed.data
    const identity = (location: DrillLocation) => {
      const url = new URL(location.databaseUrl)
      return fingerprint({
        database: `${url.hostname}:${url.port || '5432'}${url.pathname}`,
        bucket: location.objects.bucket,
        endpoint: location.objects.endpoint,
      })
    }
    const location = config.source
    stage = 'preflight'
    const adminUrl = new URL(config.target.databaseUrl)
    const targetName = adminUrl.pathname.slice(1)
    adminUrl.pathname = '/postgres'
    const admin = drillPool(adminUrl.href)
    pools.push(admin)
    evidence.tools.targetPostgres = postgres18Version(
      (await admin.query('SHOW server_version')).rows[0].server_version,
    )
    evidence.tools.pgRestore = postgres18Version(
      (await tools('pg_restore', ['--version'])).toString('utf8'),
    )
    const existing = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetName])
    if (existing.rowCount) throw new DrillError('target_exists')
    const to = s3DrillClient(config.target.objects)
    clients.push(to)
    const migrations = await readContentMigrations()
    const reviewed = migrations.map(({ id, checksum }) => ({ id, checksum }))
    evidence.migrations.reviewedSha256 = fingerprint(reviewed)

    stage = 'backup'
    let dump: Buffer
    let originals: readonly DrillMediaObject[]
    let copyMedia: () => Promise<void>
    if ('backupDirectory' in location) {
      if (!options.loadBackupKey) throw new BackupError('invalid_key_file')
      const set = await readVerifiedBackup(
        location.backupDirectory,
        await options.loadBackupKey(),
        true,
      )
      const { manifest, catalog } = set
      requireMigrationPrefix(manifest.migrations, migrations)
      evidence.identities = { source: hash(manifest.id), target: identity(config.target) }
      evidence.snapshotAt = manifest.snapshotAt
      evidence.tools.sourcePostgres = manifest.tools.postgres
      evidence.tools.pgDump = manifest.tools.pgDump
      evidence.migrations.sourceSha256 = fingerprint(manifest.migrations)
      evidence.tables.source = catalog.tables
      evidence.backup = {
        setId: manifest.id,
        sha256: manifest.database.sha256,
        bytes: manifest.database.bytes,
        mediaManifestSha256: manifest.mediaManifest.sha256,
      }
      dump = set.archive
      originals = catalog.originals
      copyMedia = async () => {
        const store = new S3OriginalObjectStore(to, config.target.objects.bucket)
        for (const [index, object] of catalog.originals.entries()) {
          const body = await set.readOriginal(index, true)
          await store.putOriginal({ ...object, body }, AbortSignal.timeout(60_000))
          evidence.media.copied += 1
        }
      }
    } else {
      evidence.identities = { source: identity(location), target: identity(config.target) }
      const source = drillPool(location.databaseUrl)
      pools.push(source)
      evidence.tools.sourcePostgres = postgres18Version(
        (await source.query('SHOW server_version')).rows[0].server_version,
      )
      evidence.tools.pgDump = postgres18Version(
        (await tools('pg_dump', ['--version'])).toString('utf8'),
      )
      const snapshot = await capturePostgresSnapshot({
        pool: source,
        databaseUrl: location.databaseUrl,
        tools,
        reviewed: migrations,
        now,
      })
      evidence.snapshotAt = snapshot.snapshotAt
      evidence.migrations.sourceSha256 = fingerprint(snapshot.migrations)
      evidence.tables.source = snapshot.tables
      dump = snapshot.archive
      originals = snapshot.media.originals
      evidence.backup = {
        sha256: hash(dump),
        bytes: dump.length,
        mediaManifestSha256: fingerprint(originals),
      }
      const from = s3DrillClient(location.objects)
      clients.push(from)
      copyMedia = () =>
        copyOriginals({
          source: from,
          target: to,
          sourceBucket: location.objects.bucket,
          targetBucket: config.target.objects.bucket,
          manifest: snapshot.media,
          evidence,
        })
    }
    evidence.media.expected = originals.length

    stage = 'restore'
    restoreStart = monotonic()
    evidence.restoreStartedAt = now().toISOString()
    await createFreshBucket(to, config.target.objects.bucket)
    // CREATE fails if another run claimed the name; no DROP, reset or existing-target restore.
    await admin.query(`CREATE DATABASE ${quotedIdentifier(targetName)} TEMPLATE template0`)
    await tools(
      'pg_restore',
      ['--exit-on-error', '--no-owner', '--no-privileges', '--dbname', targetName],
      config.target.databaseUrl,
      dump,
    )
    const target = drillPool(config.target.databaseUrl)
    pools.push(target)
    await copyMedia()

    stage = 'migrations'
    const restoredMigrations = await migrationIdentity(target)
    evidence.migrations.restoredSha256 = fingerprint(restoredMigrations)
    if (evidence.migrations.sourceSha256 !== evidence.migrations.restoredSha256)
      throw new DrillError('migration_identity_mismatch')
    const migrationReport = await applyContentMigrations(target, migrations, async (client) => {
      requireMigrationPrefix(await migrationIdentity(client), migrations)
    })
    evidence.migrations.appliedCount = migrationReport.applied.length
    evidence.migrations.finalSha256 = fingerprint(await migrationIdentity(target))
    if (evidence.migrations.finalSha256 !== evidence.migrations.reviewedSha256)
      throw new DrillError('migration_identity_mismatch')

    stage = 'comparison'
    evidence.tables.restored = await captureTables(target)
    evidence.failures.push(...compareTables(evidence.tables.source, evidence.tables.restored))
    await verifyOriginals(to, config.target.objects.bucket, originals, evidence)

    stage = 'export'
    const repository = new PostgresContentRepository(target)
    const bundle = await createPortableContentBundle(
      repository,
      now().toISOString(),
      new PostgresSubscriptionStore(repository),
    )
    const inspection = inspectPortableContentBundle(bundle)
    evidence.export = { status: inspection.status, sha256: bundle.digest }
    if (inspection.status !== 'valid') evidence.failures.push({ code: 'export_invalid', stage })
  } catch (error) {
    evidence.failures.push({
      code:
        error instanceof DrillError || error instanceof BackupError
          ? error.code
          : 'operation_failed',
      stage,
    })
  } finally {
    // Connection cleanup only. Retain isolated targets for diagnosis and operator teardown.
    for (const pool of pools) {
      try {
        await pool.end()
      } catch {
        evidence.failures.push({ code: 'operation_failed', stage: 'cleanup' })
      }
    }
    for (const client of clients) client.destroy()
  }
  measureRecovery(evidence, now(), restoreStart === null ? null : monotonic() - restoreStart)
  evidence.status =
    evidence.failures.length === 0 &&
    evidence.export.status === 'valid' &&
    evidence.recovery.rpoMet &&
    evidence.recovery.rtoMet
      ? 'passed'
      : 'failed'
  return evidence
}
