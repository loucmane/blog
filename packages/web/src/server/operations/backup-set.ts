import { randomUUID, timingSafeEqual } from 'node:crypto'
import { lstat, mkdtemp, open, readdir, rename, rm } from 'node:fs/promises'
import path from 'node:path'

import { z } from 'zod'

import { MAX_MEDIA_ORIGINAL_BYTES } from '../content/media'
import {
  authenticateBackupFile,
  BackupError,
  backupKeys,
  encryptBackupFile,
  encryptedSize,
  manifestMac,
  readManifestFile,
  writePrivate,
} from './backup-crypto'
import { maxArchiveBytes, type capturePostgresSnapshot } from './restore-drill-postgres'

export const backupSetName =
  /^backup-([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12})$/
const maxMetadataBytes = 16 * 1024 * 1024
const manifestName = 'manifest.json'
const authName = 'manifest.mac'
const archiveName = 'database.enc'
const catalogName = 'media-manifest.enc'
const mediaName = (index: number) => `original-${index}.enc`
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const count = z.number().int().nonnegative()
const postgresVersion = z.string().regex(/^18(?:\.\d+)?$/)

function fileEntry(maxBytes: number) {
  return z
    .object({
      bytes: count.max(maxBytes),
      sha256: digest,
      encryptedBytes: count,
      encryptedSha256: digest,
    })
    .strict()
    .refine(({ bytes, encryptedBytes }) => encryptedSize(bytes) === encryptedBytes)
}

const manifestSchema = z
  .object({
    version: z.literal(1),
    id: z.uuidv4(),
    snapshotAt: z.iso.datetime({ precision: 3 }),
    completedAt: z.iso.datetime({ precision: 3 }),
    migrations: z
      .array(z.object({ id: z.string().regex(/^\d{4}_[a-z0-9_]+$/), checksum: digest }).strict())
      .min(1),
    tools: z
      .object({
        node: z.string().regex(/^\d+\.\d+\.\d+$/),
        postgres: postgresVersion,
        pgDump: postgresVersion,
      })
      .strict(),
    database: fileEntry(maxArchiveBytes),
    mediaManifest: fileEntry(maxMetadataBytes),
    originals: z.array(fileEntry(MAX_MEDIA_ORIGINAL_BYTES)),
    unreferencedObjects: count,
  })
  .strict()
  .refine(
    ({ database, snapshotAt, completedAt }) => database.bytes > 0 && snapshotAt <= completedAt,
  )

const catalogSchema = z
  .object({
    tables: z.record(z.string(), z.object({ count, sha256: digest }).strict()),
    originals: z.array(
      z
        .object({
          assetId: z.string().min(1),
          key: z.string().min(1),
          contentType: z.string().min(1),
          bytes: count.max(MAX_MEDIA_ORIGINAL_BYTES),
          sha256: digest,
        })
        .strict(),
    ),
  })
  .strict()

export type BackupManifest = z.infer<typeof manifestSchema>
type BackupCatalog = z.infer<typeof catalogSchema>
type Snapshot = Awaited<ReturnType<typeof capturePostgresSnapshot>>

export async function requireBackupDirectory(directory: string): Promise<void> {
  if (!path.isAbsolute(directory) || !(await lstat(directory)).isDirectory())
    throw new BackupError('invalid_configuration')
}

export async function syncBackupDirectory(directory: string): Promise<void> {
  const file = await open(directory, 'r')
  try {
    await file.sync()
  } finally {
    await file.close()
  }
}

function parseMetadata<T>(schema: z.ZodType<T>, bytes: Buffer): T {
  try {
    return schema.parse(JSON.parse(bytes.toString('utf8')))
  } catch {
    throw new BackupError('invalid_manifest')
  }
}

function encodeMetadata<T>(schema: z.ZodType<T>, value: T): Buffer {
  const bytes = Buffer.from(`${JSON.stringify(value)}\n`)
  if (bytes.length > maxMetadataBytes || !schema.safeParse(value).success)
    throw new BackupError('invalid_manifest')
  return bytes
}

export async function writeBackupSet(input: {
  root: string
  key: Buffer
  snapshot: Snapshot
  tools: BackupManifest['tools']
  unreferencedObjects: number
  getOriginal: (key: string) => Promise<Uint8Array>
  now: () => Date
}): Promise<BackupManifest> {
  const { root, snapshot } = input
  await requireBackupDirectory(root)
  const id = randomUUID()
  const keys = backupKeys(input.key, id)
  const staging = await mkdtemp(path.join(root, '.creating-'))
  let published = false
  try {
    const catalog: BackupCatalog = {
      tables: snapshot.tables,
      originals: [...snapshot.media.originals],
    }
    const catalogBytes = encodeMetadata(catalogSchema, catalog)
    const database = await encryptBackupFile(staging, archiveName, snapshot.archive, keys.files)
    const mediaManifest = await encryptBackupFile(staging, catalogName, catalogBytes, keys.files)
    const originals: BackupManifest['originals'] = []
    for (const [index, object] of catalog.originals.entries()) {
      const body = await input.getOriginal(object.key)
      if (body.length !== object.bytes) throw new BackupError('checksum_mismatch')
      const entry = await encryptBackupFile(staging, mediaName(index), body, keys.files)
      if (entry.sha256 !== object.sha256) throw new BackupError('checksum_mismatch')
      originals.push(entry)
    }
    const manifest: BackupManifest = {
      version: 1,
      id,
      snapshotAt: snapshot.snapshotAt,
      completedAt: input.now().toISOString(),
      migrations: [...snapshot.migrations],
      tools: input.tools,
      database,
      mediaManifest,
      originals,
      unreferencedObjects: input.unreferencedObjects,
    }
    const bytes = encodeMetadata(manifestSchema, manifest)
    await writePrivate(path.join(staging, manifestName), bytes)
    await writePrivate(path.join(staging, authName), manifestMac(keys.manifest, bytes))
    await syncBackupDirectory(staging)
    await rename(staging, path.join(root, `backup-${id}`))
    published = true
    await syncBackupDirectory(root)
    return manifest
  } finally {
    if (!published) await rm(staging, { recursive: true, force: true })
  }
}

async function openBackupSet(directory: string, key: Buffer) {
  const id = backupSetName.exec(path.basename(directory))?.[1]
  if (!id) throw new BackupError('invalid_manifest')
  await requireBackupDirectory(directory)
  const keys = backupKeys(key, id)
  const bytes = await readManifestFile(path.join(directory, manifestName), maxMetadataBytes)
  const mac = await readManifestFile(path.join(directory, authName), 32)
  if (mac.length !== 32 || !timingSafeEqual(mac, manifestMac(keys.manifest, bytes)))
    throw new BackupError('authentication_failed')
  const manifest = parseMetadata(manifestSchema, bytes)
  const expected = new Set([
    manifestName,
    authName,
    archiveName,
    catalogName,
    ...manifest.originals.map((_, index) => mediaName(index)),
  ])
  const entries = await readdir(directory, { withFileTypes: true })
  if (
    manifest.id !== id ||
    entries.length !== expected.size ||
    entries.some((entry) => !entry.isFile() || !expected.has(entry.name))
  )
    throw new BackupError('invalid_manifest')
  const catalog = parseMetadata(
    catalogSchema,
    await authenticateBackupFile(directory, catalogName, manifest.mediaManifest, keys.files, true),
  )
  if (
    catalog.originals.length !== manifest.originals.length ||
    new Set(catalog.originals.map(({ key }) => key)).size !== catalog.originals.length ||
    catalog.originals.some((object, index) => {
      const entry = manifest.originals[index]
      return object.bytes !== entry?.bytes || object.sha256 !== entry.sha256
    })
  )
    throw new BackupError('invalid_manifest')
  return {
    manifest,
    catalog,
    readArchive: (retain: boolean) =>
      authenticateBackupFile(directory, archiveName, manifest.database, keys.files, retain),
    readOriginal: async (index: number, retain: boolean) => {
      const entry = manifest.originals[index]
      if (!entry) throw new BackupError('invalid_manifest')
      return authenticateBackupFile(directory, mediaName(index), entry, keys.files, retain)
    },
  }
}

export async function readVerifiedBackup(directory: string, key: Buffer, retainArchive: boolean) {
  try {
    const set = await openBackupSet(directory, key)
    for (const index of set.manifest.originals.keys()) await set.readOriginal(index, false)
    const archive = await set.readArchive(retainArchive)
    return { ...set, archive }
  } catch (error) {
    if (error instanceof BackupError) throw error
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      throw new BackupError('invalid_manifest')
    throw new BackupError('operation_failed')
  }
}
