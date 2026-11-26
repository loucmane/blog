import { randomUUID } from 'node:crypto'
import { readdir, rename, rm } from 'node:fs/promises'
import { isIPv4 } from 'node:net'
import path from 'node:path'

import { z } from 'zod'

import { readContentMigrations } from '../database/migrations'
import { S3OriginalObjectStore } from '../database/s3-original-object-store'
import { BackupError, type BackupFailureCode } from './backup-crypto'
import {
  backupSetName,
  readVerifiedBackup,
  requireBackupDirectory,
  syncBackupDirectory,
  writeBackupSet,
  type BackupManifest,
} from './backup-set'
import { listObjectKeys, missingObject, s3DrillClient } from './restore-drill-media'
import {
  capturePostgresSnapshot,
  drillPool,
  postgres18Version,
  runPostgresTool,
  type PostgresToolRunner,
} from './restore-drill-postgres'

const sourceConfig = z
  .object({
    databaseUrl: z.string().url(),
    objects: z
      .object({
        endpoint: z.string().url(),
        bucket: z.string().min(1),
        region: z.string().min(1),
        accessKeyId: z.string().min(1),
        secretAccessKey: z.string().min(1),
      })
      .strict(),
  })
  .strict()

function loopback(host: string): boolean {
  return host === '[::1]' || (isIPv4(host) && host.startsWith('127.'))
}

const sslModes = ['disable', 'require', 'verify-ca', 'verify-full']
/** The values libpq accepts for `channel_binding`, which Neon's connection strings carry. */
const channelBindings = ['disable', 'prefer', 'require']

/**
 * The URL of the database a backup reads, or a run is recorded in, with its TLS made explicit.
 * Its only query parameters are `sslmode` and `channel_binding`, each at most once. A host that is
 * not a literal loopback address must not turn TLS off, and always gets `sslmode=verify-full`:
 * certificate and hostname checks in node-postgres and libpq alike, whatever mode was asked for.
 * `channel_binding` is kept as given and never relaxes that; `require` needs TLS, so a loopback
 * URL without TLS cannot ask for it.
 */
export function backupDatabaseUrl(value: string): string {
  const url = new URL(value)
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !/^(?:[a-z0-9.-]+|\[[a-f0-9:]+\])$/i.test(url.hostname) ||
    !url.username ||
    url.hash ||
    !/^\/[^/]+$/.test(url.pathname)
  )
    throw new BackupError('invalid_configuration')
  const local = loopback(url.hostname)
  const modes = url.searchParams.getAll('sslmode')
  const mode = modes[0]
  if (!local && mode !== undefined && !['require', 'verify-ca', 'verify-full'].includes(mode))
    throw new BackupError('tls_required')
  const bindings = url.searchParams.getAll('channel_binding')
  const binding = bindings[0]
  const encrypted = !local || (mode !== undefined && mode !== 'disable')
  if (
    modes.length > 1 ||
    bindings.length > 1 ||
    [...url.searchParams.keys()].some((name) => name !== 'sslmode' && name !== 'channel_binding') ||
    (mode !== undefined && !sslModes.includes(mode)) ||
    (binding !== undefined && !channelBindings.includes(binding)) ||
    (binding === 'require' && !encrypted) ||
    [url.username, url.password, url.pathname].some((part) => /\0/.test(decodeURIComponent(part)))
  )
    throw new BackupError('invalid_configuration')
  url.searchParams.set('sslmode', encrypted ? 'verify-full' : 'disable')
  return url.href
}

export async function createBackup(
  root: string,
  key: Buffer,
  configuration: unknown,
  options: { tools?: PostgresToolRunner; now?: () => Date } = {},
): Promise<BackupManifest> {
  try {
    const parsed = sourceConfig.safeParse(configuration)
    if (!parsed.success) throw new BackupError('invalid_configuration')
    const { objects } = parsed.data
    const endpoint = new URL(objects.endpoint)
    if (
      (endpoint.protocol !== 'https:' &&
        !(endpoint.protocol === 'http:' && loopback(endpoint.hostname))) ||
      endpoint.username ||
      endpoint.password ||
      endpoint.search ||
      endpoint.hash ||
      endpoint.pathname !== '/'
    )
      throw new BackupError('invalid_configuration')
    const databaseUrl = backupDatabaseUrl(parsed.data.databaseUrl)
    if (key.length !== 32) throw new BackupError('invalid_key_file')
    await requireBackupDirectory(root)
    const tools = options.tools ?? runPostgresTool
    const now = options.now ?? (() => new Date())
    const pool = drillPool(databaseUrl)
    const client = s3DrillClient(objects)
    try {
      const postgres = postgres18Version(
        (await pool.query('SHOW server_version')).rows[0].server_version,
      )
      const pgDump = postgres18Version((await tools('pg_dump', ['--version'])).toString('utf8'))
      const snapshot = await capturePostgresSnapshot({
        pool,
        databaseUrl,
        tools,
        reviewed: await readContentMigrations(),
        now,
      })
      const keys = await listObjectKeys(client, objects.bucket)
      const sourceKeys = new Set(keys)
      const known = new Set([
        ...snapshot.media.originals.map(({ key }) => key),
        ...snapshot.media.renditions,
      ])
      const store = new S3OriginalObjectStore(client, objects.bucket)
      return await writeBackupSet({
        root,
        key,
        snapshot,
        now,
        tools: { node: process.versions.node, postgres, pgDump },
        unreferencedObjects: keys.filter((object) => !known.has(object)).length,
        getOriginal: async (object) => {
          if (!sourceKeys.has(object)) throw new BackupError('missing_object')
          try {
            return await store.getOriginal(object, AbortSignal.timeout(60_000))
          } catch (error) {
            if (missingObject(error)) throw new BackupError('missing_object')
            throw error
          }
        },
      })
    } finally {
      client.destroy()
      await pool.end()
    }
  } catch (error) {
    if (error instanceof BackupError) throw error
    throw new BackupError('operation_failed')
  }
}

export async function verifyBackup(directory: string, key: Buffer): Promise<BackupManifest> {
  return (await readVerifiedBackup(directory, key, false)).manifest
}

type RetentionEntry = Pick<BackupManifest, 'id' | 'snapshotAt'>

function retentionSet(newestFirst: readonly RetentionEntry[]): Set<string> {
  const keep = new Set<string>()
  const day = (date: string) => date.slice(0, 10)
  const week = (date: string) => {
    const monday = new Date(date)
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7))
    return day(monday.toISOString())
  }
  const month = (date: string) => date.slice(0, 7)
  for (const [limit, bucket] of [
    [7, day],
    [4, week],
    [12, month],
  ] as const) {
    const selected = new Set<string>()
    for (const set of newestFirst) {
      const period = bucket(set.snapshotAt)
      if (selected.has(period)) continue
      selected.add(period)
      keep.add(set.id)
      if (selected.size === limit) break
    }
  }
  return keep
}

export async function pruneBackups(root: string, key: Buffer, dryRun: boolean) {
  try {
    await requireBackupDirectory(root)
    const verified: RetentionEntry[] = []
    const skipped: { name: string; reason: BackupFailureCode }[] = []
    for (const name of (await readdir(root)).sort()) {
      if (!backupSetName.test(name)) continue
      try {
        const { id, snapshotAt } = await verifyBackup(path.join(root, name), key)
        verified.push({ id, snapshotAt })
      } catch (error) {
        if (!(error instanceof BackupError)) throw error
        skipped.push({ name, reason: error.code })
      }
    }
    verified.sort(
      (left, right) =>
        right.snapshotAt.localeCompare(left.snapshotAt) || right.id.localeCompare(left.id),
    )
    const keep = retentionSet(verified)
    const remove = verified.filter(({ id }) => !keep.has(id)).map(({ id }) => `backup-${id}`)
    if (!dryRun) {
      for (const name of remove) {
        const pending = path.join(root, `.pruning-${randomUUID()}`)
        try {
          // First unpublish the complete set, then delete only its quarantined directory.
          await rename(path.join(root, name), pending)
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue
          throw error
        }
        await rm(pending, { recursive: true })
      }
      if (remove.length) await syncBackupDirectory(root)
    }
    return {
      dryRun,
      kept: verified.filter(({ id }) => keep.has(id)).map(({ id }) => `backup-${id}`),
      remove,
      skipped,
    }
  } catch (error) {
    if (error instanceof BackupError) throw error
    throw new BackupError('operation_failed')
  }
}
