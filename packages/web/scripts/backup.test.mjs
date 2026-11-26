import { randomBytes } from 'node:crypto'
import { chmod, mkdir, mkdtemp, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { verifyBackup } from '../src/server/operations/backup'
import { writeBackupSet } from '../src/server/operations/backup-set'
import { hash } from '../src/server/operations/restore-drill-contract'
import { runBackupCommand } from './backup.mjs'
import { notRecordedExitCode } from './restore-drill.mjs'

const directories = []
const startedAt = new Date('2026-11-23T02:00:00.000Z')
const finishedAt = new Date('2026-11-23T02:05:00.000Z')

async function fixture() {
  const parent = path.resolve('ci-artifacts/tmp')
  await mkdir(parent, { recursive: true })
  const directory = await mkdtemp(path.join(parent, 'backup-cli-'))
  directories.push(directory)
  const filename = path.join(directory, 'fixture-key')
  const value = randomBytes(32).toString('base64url')
  const output = vi.fn()
  const error = vi.fn()
  // No unit test reaches a database: every run is recorded here unless a test says otherwise.
  const record = vi.fn(async () => undefined)
  await writeFile(filename, `${value}\n`, { mode: 0o600 })
  return {
    directory,
    filename,
    value,
    output,
    error,
    record,
    call: (args, options = {}) =>
      runBackupCommand({
        args,
        output,
        error,
        record,
        now: vi.fn().mockReturnValueOnce(startedAt).mockReturnValue(finishedAt),
        environment: { MAGAZINE_BACKUP_KEY_FILE: filename },
        ...options,
      }),
  }
}

/** A create that publishes a real, verifiable set without a database or object store. */
function syntheticCreate(directory) {
  return (root, key) =>
    writeBackupSet({
      root,
      key,
      snapshot: {
        archive: Buffer.from('synthetic archive'),
        snapshotAt: startedAt.toISOString(),
        migrations: [{ id: '0001_fixture', checksum: hash('fixture') }],
        tables: {},
        media: { originals: [], renditions: [] },
      },
      tools: { node: process.versions.node, postgres: '18.4', pgDump: '18.4' },
      unreferencedObjects: 0,
      now: () => finishedAt,
      getOriginal: vi.fn(),
    }).then((manifest) => {
      expect(root).toBe(directory)
      return manifest
    })
}

afterEach(async () => {
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true })
})

describe('backup operator command', () => {
  it('validates arguments before reading stdin or loading a key', async () => {
    const { call, directory, output, error } = await fixture()
    const input = vi.fn()
    expect(await call(['create', '--help'], { input, environment: {} })).toBe(0)
    expect(await call(['verify', '--directory', 'relative'], { input })).toBe(1)
    expect(await call(['verify', '--directory', directory, '--dry-run'], { input })).toBe(1)
    expect(output).toHaveBeenCalledWith(expect.stringContaining('backup:create'))
    expect(error).toHaveBeenCalledTimes(2)
    expect(input).not.toHaveBeenCalled()
  })

  it('accepts an operator key with private permissions and rejects public permissions, links and malformed bytes', async () => {
    const { call, directory, filename, value, output, error } = await fixture()
    const args = ['prune', '--directory', directory, '--dry-run']
    const input = vi.fn()
    await chmod(filename, 0o400)
    expect(await call(args, { input })).toBe(0)
    expect(JSON.parse(output.mock.calls[0][0])).toEqual({
      dryRun: true,
      kept: [],
      remove: [],
      skipped: [],
    })
    expect(input).not.toHaveBeenCalled()
    const link = path.join(directory, 'key-link')
    await symlink(filename, link)
    expect(await call(args, { environment: { MAGAZINE_BACKUP_KEY_FILE: link } })).toBe(1)
    await chmod(filename, 0o640)
    expect(await call(args)).toBe(1)
    await chmod(filename, 0o600)
    await writeFile(filename, `${value}=`)
    expect(await call(args)).toBe(1)
    expect(error.mock.calls).toEqual(
      Array.from({ length: 3 }, () => ['Backup prune failed (invalid_key_file).']),
    )
    expect(JSON.stringify([output.mock.calls, error.mock.calls])).not.toContain(value)
  })

  it('refuses a hosted TLS downgrade with a fixed error and no connection details', async () => {
    const { call, directory, value, error, record } = await fixture()
    const password = randomBytes(16).toString('base64url')
    const databaseUrl = `postgresql://fixture:${password}@db.example.test/magazine?sslmode=disable`
    expect(
      await call(['create', '--directory', directory], {
        input: async () => ({
          databaseUrl,
          objects: {
            endpoint: 'https://s3.example.test',
            bucket: 'synthetic',
            region: 'us-east-1',
            accessKeyId: 'fixture',
            secretAccessKey: randomBytes(16).toString('base64url'),
          },
        }),
      }),
    ).toBe(1)
    expect(error).toHaveBeenCalledWith('Backup create failed (tls_required).')
    for (const privateValue of [databaseUrl, password, value]) {
      expect(JSON.stringify(error.mock.calls)).not.toContain(privateValue)
    }
    // The failed run is recorded with its fixed code and nothing from the configuration.
    expect(record).toHaveBeenCalledExactlyOnceWith(
      {
        failureReason: 'tls_required',
        finishedAt: finishedAt.toISOString(),
        kind: 'backup',
        outcome: 'failed',
        rpoMs: null,
        rtoMs: null,
        startedAt: startedAt.toISOString(),
      },
      { MAGAZINE_BACKUP_KEY_FILE: expect.any(String) },
    )
    expect(JSON.stringify(record.mock.calls)).not.toContain(password)
  })

  it('records a created backup, and keeps the set but exits 3 when the run cannot be recorded', async () => {
    const { call, directory, filename, value, output, error, record } = await fixture()
    const args = ['create', '--directory', directory]
    const input = vi.fn(async () => ({}))

    expect(await call(args, { create: syntheticCreate(directory), input })).toBe(0)
    expect(record).toHaveBeenCalledExactlyOnceWith(
      {
        failureReason: null,
        finishedAt: finishedAt.toISOString(),
        kind: 'backup',
        outcome: 'succeeded',
        rpoMs: null,
        rtoMs: null,
        startedAt: startedAt.toISOString(),
      },
      { MAGAZINE_BACKUP_KEY_FILE: filename },
    )
    expect(error).not.toHaveBeenCalled()

    record.mockRejectedValueOnce(
      Object.assign(new Error('not_configured'), { code: 'not_configured' }),
    )
    expect(await call(args, { create: syntheticCreate(directory), input })).toBe(
      notRecordedExitCode,
    )
    expect(notRecordedExitCode).toBe(3)
    const created = JSON.parse(output.mock.calls.at(-1)[0])
    expect(created).toMatchObject({ status: 'created', name: expect.stringMatching(/^backup-/) })
    expect(error).toHaveBeenCalledExactlyOnceWith(
      'Backup created and kept, but its run was not recorded in the application database (not_configured). Health reports the previous backup until a run is recorded.',
    )
    // The published set is still there and still verifies.
    const key = Buffer.from(value, 'base64url')
    expect(await readdir(directory)).toEqual(expect.arrayContaining([created.name]))
    expect((await verifyBackup(path.join(directory, created.name), key)).id).toBe(
      created.name.slice('backup-'.length),
    )

    // A recorder failure that is not one of the fixed codes is reported as operation_failed.
    const sensitive = ['private', 'driver', 'text'].join('-')
    record.mockRejectedValueOnce(new Error(sensitive))
    expect(await call(args, { create: syntheticCreate(directory), input })).toBe(3)
    expect(error).toHaveBeenLastCalledWith(expect.stringContaining('(operation_failed)'))
    expect(JSON.stringify(error.mock.calls)).not.toContain(sensitive)
  })

  it('keeps a failed backup’s own exit status when its run cannot be recorded either', async () => {
    const { call, directory, error, record } = await fixture()
    record.mockRejectedValueOnce(Object.assign(new Error('tls_required'), { code: 'tls_required' }))

    expect(await call(['create', '--directory', directory], { input: async () => ({}) })).toBe(1)
    expect(error.mock.calls).toEqual([
      ['Backup create failed (invalid_configuration).'],
      ['The failed backup was not recorded in the application database either (tls_required).'],
    ])
    expect(record.mock.calls[0][0]).toMatchObject({
      failureReason: 'invalid_configuration',
      outcome: 'failed',
    })
  })

  it('records nothing for verify or prune, and records with DATABASE_URL by default', async () => {
    const { call, directory, filename, output, error, record } = await fixture()
    expect(await call(['prune', '--directory', directory, '--dry-run'])).toBe(0)
    expect(await call(['verify', '--directory', path.join(directory, 'backup-missing')])).toBe(1)
    expect(record).not.toHaveBeenCalled()

    // The default recorder refuses before connecting when DATABASE_URL is absent or downgrades TLS.
    const password = randomBytes(16).toString('base64url')
    const hosted = new URL('postgresql://recorder@db.example.test/magazine?sslmode=disable')
    hosted.password = password
    for (const [environment, code] of [
      [{ MAGAZINE_BACKUP_KEY_FILE: filename }, 'not_configured'],
      [{ MAGAZINE_BACKUP_KEY_FILE: filename, DATABASE_URL: hosted.href }, 'tls_required'],
    ]) {
      error.mockClear()
      expect(
        await call(['create', '--directory', directory], {
          create: syntheticCreate(directory),
          environment,
          input: async () => ({}),
          record: undefined,
        }),
      ).toBe(3)
      expect(error).toHaveBeenCalledExactlyOnceWith(expect.stringContaining(`(${code})`))
      expect(JSON.stringify([output.mock.calls, error.mock.calls])).not.toContain(password)
    }
  })

  it('verifies a stored set with the recovered copy of the operator key', async () => {
    const { call, directory, filename, value, output, error } = await fixture()
    const now = () => new Date('2026-11-23T03:00:00.000Z')
    const manifest = await writeBackupSet({
      root: directory,
      key: Buffer.from(value, 'base64url'),
      snapshot: {
        archive: Buffer.from('synthetic archive'),
        snapshotAt: now().toISOString(),
        migrations: [{ id: '0001_fixture', checksum: hash('fixture') }],
        tables: {},
        media: { originals: [], renditions: [] },
      },
      tools: { node: process.versions.node, postgres: '18.4', pgDump: '18.4' },
      unreferencedObjects: 0,
      now,
      getOriginal: vi.fn(),
    })
    const recovered = path.join(directory, 'recovered-key')
    await writeFile(recovered, value, { mode: 0o600 })
    await rm(filename)
    const args = ['verify', '--directory', path.join(directory, `backup-${manifest.id}`)]
    expect(await call(args)).toBe(1)
    expect(await call(args, { environment: { MAGAZINE_BACKUP_KEY_FILE: recovered } })).toBe(0)
    expect(JSON.parse(output.mock.calls[0][0])).toMatchObject({
      status: 'verified',
      name: `backup-${manifest.id}`,
    })
    expect(JSON.stringify([output.mock.calls, error.mock.calls])).not.toContain(value)
  })
})
