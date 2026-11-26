import { existsSync, realpathSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { readConfiguration, recordFinishedRun, recordRun } from './restore-drill.mjs'
import { registerApplicationModules } from './subscribers.mjs'

const usage =
  'Usage: backup:create --directory /absolute/root < source.json | backup:verify --directory /absolute/root/backup-ID | backup:prune --directory /absolute/root [--dry-run]. backup:create records its run in the application database that DATABASE_URL names.'

async function backupRunOf(startedAt, finishedAt, failureReason) {
  const { backupRun } = await import('../src/server/operations/operation-runs.ts')
  return backupRun(startedAt, finishedAt, failureReason)
}

async function createSet(root, key, configuration) {
  const { createBackup } = await import('../src/server/operations/backup.ts')
  return createBackup(root, key, configuration)
}

export async function runBackupCommand({
  args = process.argv.slice(2),
  environment = process.env,
  input = readConfiguration,
  // The backup itself; the integration stage supplies one that runs the Compose PostgreSQL tools.
  create = createSet,
  record = recordRun,
  now = () => new Date(),
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
  const startedAt = now()
  let exitCode = 1
  let failureReason = null
  try {
    const { BackupError, readBackupKey } = await import('../src/server/operations/backup-crypto.ts')
    try {
      const key = await readBackupKey(environment.MAGAZINE_BACKUP_KEY_FILE)
      const target = path.resolve(directory)
      const { pruneBackups, verifyBackup } = await import('../src/server/operations/backup.ts')
      if (operation === 'prune') {
        const plan = await pruneBackups(target, key, dryRun === '--dry-run')
        output(JSON.stringify(plan))
        return plan.skipped.length ? 1 : 0
      }
      const manifest =
        operation === 'create'
          ? await create(target, key, await input())
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
      exitCode = 0
    } catch (failure) {
      failureReason = failure instanceof BackupError ? failure.code : 'operation_failed'
      error(`Backup ${operation} failed (${failureReason}).`)
    }
  } catch {
    failureReason = 'operation_failed'
    error(`Backup ${operation} failed (operation_failed).`)
  }
  // Only a backup changes what the health check reports; verify and prune record nothing.
  if (operation !== 'create') return exitCode
  return recordFinishedRun({
    build: () => backupRunOf(startedAt, now(), failureReason),
    environment,
    error,
    exitCode,
    notRecorded: (code) =>
      exitCode === 0
        ? `Backup created and kept, but its run was not recorded in the application database (${code}). Health reports the previous backup until a run is recorded.`
        : `The failed backup was not recorded in the application database either (${code}).`,
    record,
  })
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
