import { randomBytes } from 'node:crypto'
import { chmod, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { writeBackupSet } from '../src/server/operations/backup-set'
import { hash } from '../src/server/operations/restore-drill-contract'
import { runBackupCommand } from './backup.mjs'

const directories = []

async function fixture() {
  const parent = path.resolve('ci-artifacts/tmp')
  await mkdir(parent, { recursive: true })
  const directory = await mkdtemp(path.join(parent, 'backup-cli-'))
  directories.push(directory)
  const filename = path.join(directory, 'fixture-key')
  const value = randomBytes(32).toString('base64url')
  const output = vi.fn()
  const error = vi.fn()
  await writeFile(filename, `${value}\n`, { mode: 0o600 })
  return {
    directory,
    filename,
    value,
    output,
    error,
    call: (args, options = {}) =>
      runBackupCommand({
        args,
        output,
        error,
        environment: { MAGAZINE_BACKUP_KEY_FILE: filename },
        ...options,
      }),
  }
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
    const { call, directory, value, error } = await fixture()
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
