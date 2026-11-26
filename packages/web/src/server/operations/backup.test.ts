import { randomBytes, randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, readFile, readdir, rm, stat, truncate, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { chunkBytes } from './backup-crypto'
import { readVerifiedBackup, writeBackupSet } from './backup-set'
import { backupDatabaseUrl, createBackup, pruneBackups, verifyBackup } from './backup'
import { hash } from './restore-drill-contract'

const directories: string[] = []
const body = Buffer.from('synthetic-media')
const object = {
  assetId: 'synthetic',
  key: 'private/key',
  contentType: 'image/png',
  bytes: body.length,
  sha256: hash(body),
}

async function root() {
  const parent = path.resolve('ci-artifacts/tmp')
  await mkdir(parent, { recursive: true })
  const directory = await mkdtemp(path.join(parent, 'backup-unit-'))
  directories.push(directory)
  return directory
}

function set(
  directory: string,
  key: Buffer,
  archive: Buffer,
  iso: string,
  getOriginal = async () => body,
) {
  return writeBackupSet({
    root: directory,
    key,
    snapshot: {
      archive,
      snapshotAt: iso,
      migrations: [{ id: '0001_fixture', checksum: hash('synthetic migration') }],
      tables: { media_assets: { count: 1, sha256: hash('synthetic table') } },
      media: { originals: [object], renditions: [] },
    },
    tools: { node: process.versions.node, postgres: '18.4', pgDump: '18.4' },
    unreferencedObjects: 1,
    getOriginal,
    now: () => new Date(iso),
  })
}

afterEach(async () => {
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true })
})

describe('independent backup sets', () => {
  it('authenticates the manifest and round-trips an archive and originals without exposing identifiers', async () => {
    const directory = await root()
    const key = randomBytes(32)
    const archive = randomBytes(chunkBytes * 2 + 13)
    const manifest = await set(directory, key, archive, '2026-11-20T00:00:00.000Z')
    const setPath = path.join(directory, `backup-${manifest.id}`)
    const restored = await readVerifiedBackup(setPath, key, true)
    expect(restored.archive.equals(archive)).toBe(true)
    expect((await restored.readOriginal(0, true)).equals(body)).toBe(true)
    expect(restored.catalog.originals).toEqual([object])
    expect(manifest.database.sha256).toBe(hash(archive))
    expect((await stat(setPath)).mode & 0o777).toBe(0o700)
    const metadata = path.join(setPath, 'manifest.json')
    const text = await readFile(metadata, 'utf8')
    expect((await stat(metadata)).mode & 0o777).toBe(0o600)
    expect(text).not.toContain(object.key)
    expect(text).not.toContain(key.toString('base64url'))
    expect(await verifyBackup(setPath, key)).toEqual(manifest)
    await expect(verifyBackup(setPath, randomBytes(32))).rejects.toThrow('authentication_failed')

    await writeFile(metadata, text.replace('2026-11-20', '2026-11-19'))
    await expect(verifyBackup(setPath, key)).rejects.toThrow('authentication_failed')
    await writeFile(metadata, text)

    const file = path.join(setPath, 'database.enc')
    const ciphertext = await readFile(file)
    const frame = chunkBytes + 28
    await writeFile(
      file,
      Buffer.concat([
        ciphertext.subarray(frame, frame * 2),
        ciphertext.subarray(0, frame),
        ciphertext.subarray(frame * 2),
      ]),
    )
    await expect(verifyBackup(setPath, key)).rejects.toThrow('authentication_failed')
    await writeFile(file, ciphertext)
    await truncate(file, ciphertext.length - 1)
    await expect(verifyBackup(setPath, key)).rejects.toThrow('truncated_file')
    await writeFile(file, Buffer.concat([ciphertext, Buffer.alloc(1)]))
    await expect(verifyBackup(setPath, key)).rejects.toThrow('checksum_mismatch')
  })

  it('never publishes or leaves a visible set when an original differs from its snapshot', async () => {
    const directory = await root()
    await expect(
      set(
        directory,
        randomBytes(32),
        Buffer.from('archive'),
        '2026-11-20T00:00:00.000Z',
        async () => Buffer.alloc(body.length),
      ),
    ).rejects.toThrow('checksum_mismatch')
    expect(await readdir(directory)).toEqual([])
  })

  it('keeps the latest verified UTC day, week and month representatives and leaves invalid sets intact', async () => {
    const directory = await root()
    const key = randomBytes(32)
    const archive = Buffer.from('synthetic-archive')
    const make = async (when: string) => `backup-${(await set(directory, key, archive, when)).id}`
    const newest = await make('2026-11-23T12:00:00.000Z')
    const sameDay = await make('2026-11-23T00:00:00.000Z')
    const sameWeek = await make('2026-11-16T00:00:00.000Z')
    const weekly = await make('2026-11-09T00:00:00.000Z')
    const monthly = await make('2026-05-20T00:00:00.000Z')
    const sameMonth = await make('2026-05-01T00:00:00.000Z')
    const old = await make('2025-11-01T00:00:00.000Z')
    for (const when of [
      '2026-11-22',
      '2026-11-21',
      '2026-11-20',
      '2026-11-19',
      '2026-11-18',
      '2026-11-17',
      '2026-11-02',
      '2026-10-01',
      '2026-09-01',
      '2026-08-01',
      '2026-07-01',
      '2026-06-01',
      '2026-04-01',
      '2026-03-01',
      '2026-02-01',
      '2026-01-01',
      '2025-12-01',
    ]) {
      await make(`${when}T00:00:00.000Z`)
    }
    const broken = `backup-${randomUUID()}`
    await mkdir(path.join(directory, broken))
    const plan = await pruneBackups(directory, key, true)
    expect(plan.kept).toEqual(expect.arrayContaining([newest, weekly, monthly]))
    expect(plan.remove).toEqual(expect.arrayContaining([sameDay, sameWeek, sameMonth, old]))
    expect(plan.skipped).toEqual([{ name: broken, reason: 'invalid_manifest' }])
    expect(await readdir(directory)).toContain(sameDay)
    const applied = await pruneBackups(directory, key, false)
    expect(applied.remove).toEqual(plan.remove)
    const repeated = await pruneBackups(directory, key, false)
    expect(repeated).toMatchObject({ remove: [], kept: plan.kept, skipped: plan.skipped })
    expect(await readdir(directory)).toEqual(expect.arrayContaining([newest, broken]))
    expect((await pruneBackups(directory, randomBytes(32), false)).remove).toEqual([])
  })

  it('requires verified TLS for hosted databases and refuses connection option overrides', () => {
    const hosted = 'postgresql://fixture@db.example.test/magazine'
    for (const mode of ['', '?sslmode=require', '?sslmode=verify-full']) {
      expect(new URL(backupDatabaseUrl(hosted + mode)).searchParams.get('sslmode')).toBe(
        'verify-full',
      )
    }
    for (const sslmode of ['disable', 'allow', 'prefer']) {
      expect(() => backupDatabaseUrl(`${hosted}?sslmode=${sslmode}`)).toThrow('tls_required')
    }
    expect(() => backupDatabaseUrl(`${hosted}?sslmode=require&host=127.0.0.1`)).toThrow(
      'invalid_configuration',
    )
    expect(() => backupDatabaseUrl(`${hosted}?sslmode=require&sslmode=disable`)).toThrow(
      'invalid_configuration',
    )
    expect(
      new URL(backupDatabaseUrl('postgresql://fixture@[::1]:5432/magazine')).searchParams.get(
        'sslmode',
      ),
    ).toBe('disable')
  })

  it('accepts the channel binding a Neon connection string carries, never in place of verified TLS', async () => {
    // Neon's direct connection string, its credential made at runtime.
    const neon = new URL(
      'postgresql://neondb_owner@ep-quiet-lake-a1b2c3d4.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    )
    neon.password = randomBytes(12).toString('base64url')
    const checked = new URL(backupDatabaseUrl(neon.href))
    expect([...checked.searchParams]).toEqual([
      ['sslmode', 'verify-full'],
      ['channel_binding', 'require'],
    ])
    expect(checked.password).toBe(neon.password)

    const hosted = 'postgresql://fixture@db.example.test/magazine'
    for (const binding of ['require', 'prefer', 'disable']) {
      const url = new URL(backupDatabaseUrl(`${hosted}?channel_binding=${binding}`))
      expect(Object.fromEntries(url.searchParams)).toEqual({
        channel_binding: binding,
        sslmode: 'verify-full',
      })
    }
    // It never stands in for TLS, and nothing else rides along with it.
    expect(() => backupDatabaseUrl(`${hosted}?sslmode=disable&channel_binding=require`)).toThrow(
      'tls_required',
    )
    for (const query of [
      '?channel_binding=required',
      '?channel_binding=',
      '?channel_binding=require&channel_binding=disable',
      '?sslmode=require&channel_binding=require&sslrootcert=system',
      '?channel_binding=require&options=-c%20statement_timeout%3D0',
    ]) {
      expect(() => backupDatabaseUrl(hosted + query)).toThrow('invalid_configuration')
    }
    // A loopback URL without TLS cannot require binding; with TLS it can, and is verified.
    const local = 'postgresql://fixture@127.0.0.1:5432/magazine'
    expect(() => backupDatabaseUrl(`${local}?channel_binding=require`)).toThrow(
      'invalid_configuration',
    )
    expect(
      Object.fromEntries(
        new URL(backupDatabaseUrl(`${local}?channel_binding=disable`)).searchParams,
      ),
    ).toEqual({ channel_binding: 'disable', sslmode: 'disable' })
    expect(
      new URL(
        backupDatabaseUrl(`${local}?sslmode=require&channel_binding=require`),
      ).searchParams.get('sslmode'),
    ).toBe('verify-full')

    // The backup's own source accepts it: the run gets past the URL to the next check, the key.
    const objects = {
      endpoint: 'https://objects.example.test',
      bucket: 'synthetic',
      region: 'us-east-1',
      accessKeyId: 'fixture',
      secretAccessKey: randomBytes(16).toString('base64url'),
    }
    await expect(
      createBackup(await root(), Buffer.alloc(0), { databaseUrl: neon.href, objects }),
    ).rejects.toThrow('invalid_key_file')
    await expect(
      createBackup(await root(), Buffer.alloc(0), {
        databaseUrl: `${neon.href}&sslnegotiation=direct`,
        objects,
      }),
    ).rejects.toThrow('invalid_configuration')
  })
})
