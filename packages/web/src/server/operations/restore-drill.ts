import { performance } from 'node:perf_hooks'

import type { S3Client } from '@aws-sdk/client-s3'
import type { Pool, PoolClient } from 'pg'

import { createPortableContentBundle, inspectPortableContentBundle } from '../content/portability'
import { applyContentMigrations, readContentMigrations } from '../database/migrations'
import { PostgresContentRepository } from '../database/postgres-content-repository'
import { PostgresSubscriptionStore } from '../database/postgres-subscriptions'
import {
  DrillError,
  fingerprint,
  hash,
  measureRecovery,
  newDrillEvidence,
  restoreDrillConfig,
  type DrillStage,
  type RestoreDrillEvidence,
} from './restore-drill-contract'
import {
  copyOriginals,
  createFreshBucket,
  mediaManifest,
  s3DrillClient,
  verifyOriginals,
} from './restore-drill-media'
import {
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
  let snapshot: PoolClient | undefined
  try {
    const parsed = restoreDrillConfig.safeParse(input)
    if (!parsed.success) throw new DrillError('invalid_configuration')
    const config = parsed.data
    const identity = (location: typeof config.source) => {
      const url = new URL(location.databaseUrl)
      return fingerprint({
        database: `${url.hostname}:${url.port || '5432'}${url.pathname}`,
        bucket: location.objects.bucket,
        endpoint: location.objects.endpoint,
      })
    }
    evidence.identities = { source: identity(config.source), target: identity(config.target) }
    stage = 'preflight'
    const source = drillPool(config.source.databaseUrl)
    pools.push(source)
    const adminUrl = new URL(config.target.databaseUrl)
    const targetName = adminUrl.pathname.slice(1)
    adminUrl.pathname = '/postgres'
    const admin = drillPool(adminUrl.href)
    pools.push(admin)
    evidence.tools.sourcePostgres = postgres18Version(
      (await source.query('SHOW server_version')).rows[0].server_version,
    )
    evidence.tools.targetPostgres = postgres18Version(
      (await admin.query('SHOW server_version')).rows[0].server_version,
    )
    evidence.tools.pgDump = postgres18Version(
      (await tools('pg_dump', ['--version'])).toString('utf8'),
    )
    evidence.tools.pgRestore = postgres18Version(
      (await tools('pg_restore', ['--version'])).toString('utf8'),
    )
    const existing = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetName])
    if (existing.rowCount) throw new DrillError('target_exists')
    const from = s3DrillClient(config.source.objects)
    const to = s3DrillClient(config.target.objects)
    clients.push(from, to)
    const migrations = await readContentMigrations()
    const reviewed = migrations.map(({ id, checksum }) => ({ id, checksum }))
    evidence.migrations.reviewedSha256 = fingerprint(reviewed)

    stage = 'backup'
    snapshot = await source.connect()
    await snapshot.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
    await snapshot.query("SET LOCAL idle_in_transaction_session_timeout = '15min'")
    evidence.snapshotAt = now().toISOString()
    const snapshotId: string = (await snapshot.query('SELECT pg_export_snapshot() AS id')).rows[0]
      .id
    const sourceMigrations = await migrationIdentity(snapshot)
    evidence.migrations.sourceSha256 = fingerprint(sourceMigrations)
    requireMigrationPrefix(sourceMigrations, migrations)
    evidence.tables.source = await captureTables(snapshot)
    const manifest = await mediaManifest(snapshot)
    evidence.media.expected = manifest.originals.length
    const dump = await tools(
      'pg_dump',
      ['--format=custom', '--no-owner', '--no-privileges', '--snapshot', snapshotId],
      config.source.databaseUrl,
    )
    if (!dump.length) throw new DrillError('operation_failed')
    evidence.backup = {
      sha256: hash(dump),
      bytes: dump.length,
      mediaManifestSha256: fingerprint(manifest.originals),
    }
    await snapshot.query('ROLLBACK')
    snapshot.release()
    snapshot = undefined

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
    await copyOriginals({
      source: from,
      target: to,
      sourceBucket: config.source.objects.bucket,
      targetBucket: config.target.objects.bucket,
      manifest,
      evidence,
    })

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
    await verifyOriginals(to, config.target.objects.bucket, manifest.originals, evidence)

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
      code: error instanceof DrillError ? error.code : 'operation_failed',
      stage,
    })
  } finally {
    // Connection cleanup only. Retain isolated targets for diagnosis and operator teardown.
    if (snapshot) {
      try {
        await snapshot.query('ROLLBACK')
      } catch {
        evidence.failures.push({ code: 'operation_failed', stage: 'cleanup' })
      }
      snapshot.release()
    }
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
