import { existsSync, realpathSync } from 'node:fs'
import { open } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerApplicationModules } from './subscribers.mjs'

const usage =
  'Usage: pnpm --filter web restore:drill --evidence /absolute/path/evidence.json < isolated-drill.json. Reads local-only configuration from stdin; the evidence file must not exist. DATABASE_URL names the application database that records the run.'
const incomplete =
  'Restore drill could not complete or record evidence. No success is assumed; retain isolated targets for diagnosis.'

/**
 * The exit status of a backup or restore drill that worked, and kept its set or evidence, but
 * whose run the application database did not record. A scheduler sees a failure; nothing is lost.
 */
export const notRecordedExitCode = 3

// The fixed reasons record-operation-run.ts gives; anything else is reported as operation_failed.
const recordFailureCodes = [
  'invalid_configuration',
  'not_configured',
  'operation_failed',
  'tls_required',
]

export async function readConfiguration() {
  const chunks = []
  let bytes = 0
  for await (const chunk of process.stdin) {
    bytes += Buffer.byteLength(chunk)
    if (bytes > 16_384) return undefined
    chunks.push(Buffer.from(chunk))
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return undefined
  }
}

/** Records a finished run in the application database that DATABASE_URL names. */
export async function recordRun(run, environment) {
  const { recordOperationRun } = await import('../src/server/operations/record-operation-run.ts')
  await recordOperationRun(environment, run)
}

/**
 * Records a finished run and returns the command's exit status. A run that worked but could not
 * be recorded exits with notRecordedExitCode; a run that failed keeps its own status. The warning
 * names a fixed code only, never the database URL, a host or driver text.
 */
export async function recordFinishedRun({
  build,
  environment,
  error,
  exitCode,
  notRecorded,
  record,
}) {
  try {
    await record(await build(), environment)
    return exitCode
  } catch (failure) {
    const code = recordFailureCodes.includes(failure?.code) ? failure.code : 'operation_failed'
    error(notRecorded(code))
    return exitCode === 0 ? notRecordedExitCode : exitCode
  }
}

async function execute(configuration, environment) {
  const [{ runRestoreDrill }, { readBackupKey }] = await Promise.all([
    import('../src/server/operations/restore-drill.ts'),
    import('../src/server/operations/backup-crypto.ts'),
  ])
  return runRestoreDrill(configuration, {
    loadBackupKey: () => readBackupKey(environment.MAGAZINE_BACKUP_KEY_FILE),
  })
}

async function drillRun(evidence, startedAt, finishedAt) {
  const { failedRestoreDrillRun, restoreDrillRun } =
    await import('../src/server/operations/operation-runs.ts')
  return evidence
    ? restoreDrillRun(evidence, finishedAt)
    : failedRestoreDrillRun(startedAt, finishedAt)
}

export async function runRestoreDrillCommand({
  args = process.argv.slice(2),
  environment = process.env,
  input = readConfiguration,
  drill = (configuration) => execute(configuration, environment),
  record = recordRun,
  now = () => new Date(),
  output = console.log,
  error = console.error,
} = {}) {
  if (args.length === 1 && args[0] === '--help') {
    output(usage)
    return 0
  }
  if (args.length !== 2 || args[0] !== '--evidence' || !path.isAbsolute(args[1])) {
    error(usage)
    return 1
  }
  let file
  try {
    // Reserve a private evidence file before any database or object-store work.
    file = await open(args[1], 'wx', 0o600)
  } catch {
    // No drill ran, so there is no run to record.
    error(incomplete)
    return 1
  }
  const startedAt = now()
  // Set only once the evidence file is complete: a run is recorded from what the file holds.
  let evidence
  let exitCode = 1
  try {
    const result = await drill(await input())
    await file.writeFile(`${JSON.stringify(result, null, 2)}\n`, 'utf8')
    await file.sync()
    await file.close()
    file = undefined
    evidence = result
    output(`Restore drill ${result.status}. Evidence recorded.`)
    exitCode = result.status === 'passed' ? 0 : 1
  } catch {
    // No driver text, input, connection strings, archive bytes or export payloads.
    error(incomplete)
  } finally {
    await file?.close().catch(() => {})
  }
  return recordFinishedRun({
    build: () => drillRun(evidence, startedAt, now()),
    environment,
    error,
    exitCode,
    notRecorded: (code) =>
      exitCode === 0
        ? `Restore drill evidence was kept, but the run was not recorded in the application database (${code}). Health reports the previous drill until a run is recorded.`
        : `The failed restore drill was not recorded in the application database either (${code}).`,
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
    process.exitCode = await runRestoreDrillCommand()
  } finally {
    hooks.deregister()
  }
}
