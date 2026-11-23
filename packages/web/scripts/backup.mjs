import { existsSync, realpathSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { readConfiguration } from './restore-drill.mjs'
import { registerApplicationModules } from './subscribers.mjs'

const usage =
  'Usage: backup:create --directory /absolute/root < source.json | backup:verify --directory /absolute/root/backup-ID | backup:prune --directory /absolute/root [--dry-run]'

export async function runBackupCommand({
  args = process.argv.slice(2),
  environment = process.env,
  input = readConfiguration,
  output = console.log,
  error = console.error,
} = {}) {
  const [operation, flag, directory, dryRun] = args
  if (
    (args.length === 1 && operation === '--help') ||
    (args.length === 2 && ['create', 'verify', 'prune'].includes(operation) && flag === '--help')
  ) {
    output(usage)
    return 0
  }
  if (
    !['create', 'verify', 'prune'].includes(operation) ||
    flag !== '--directory' ||
    !directory ||
    !path.isAbsolute(directory) ||
    (args.length !== 3 && !(args.length === 4 && operation === 'prune' && dryRun === '--dry-run'))
  ) {
    error(usage)
    return 1
  }
  try {
    const { BackupError, readBackupKey } = await import('../src/server/operations/backup-crypto.ts')
    try {
      const key = await readBackupKey(environment.MAGAZINE_BACKUP_KEY_FILE)
      const target = path.resolve(directory)
      const { createBackup, pruneBackups, verifyBackup } =
        await import('../src/server/operations/backup.ts')
      if (operation === 'prune') {
        const plan = await pruneBackups(target, key, dryRun === '--dry-run')
        output(JSON.stringify(plan))
        return plan.skipped.length ? 1 : 0
      }
      const manifest =
        operation === 'create'
          ? await createBackup(target, key, await input())
          : await verifyBackup(target, key)
      output(
        JSON.stringify({
          status: operation === 'create' ? 'created' : 'verified',
          name: `backup-${manifest.id}`,
          snapshotAt: manifest.snapshotAt,
          originals: manifest.originals.length,
          unreferencedObjects: manifest.unreferencedObjects,
        }),
      )
      return 0
    } catch (failure) {
      error(
        `Backup ${operation} failed (${failure instanceof BackupError ? failure.code : 'operation_failed'}).`,
      )
      return 1
    }
  } catch {
    error(`Backup ${operation} failed (operation_failed).`)
    return 1
  }
}

if (
  process.argv[1] &&
  existsSync(process.argv[1]) &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const hooks = registerApplicationModules()
  try {
    process.exitCode = await runBackupCommand()
  } finally {
    hooks.deregister()
  }
}
