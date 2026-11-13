import { open } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerApplicationModules } from './subscribers.mjs'

const usage =
  'Usage: pnpm --filter web restore:drill --evidence /absolute/path/evidence.json < isolated-drill.json. Reads local-only configuration from stdin; the evidence file must not exist.'

async function readConfiguration() {
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

async function execute(configuration) {
  const { runRestoreDrill } = await import('../src/server/operations/restore-drill.ts')
  return runRestoreDrill(configuration)
}

export async function runRestoreDrillCommand({
  args = process.argv.slice(2),
  input = readConfiguration,
  drill = execute,
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
    const evidence = await drill(await input())
    await file.writeFile(`${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
    await file.sync()
    await file.close()
    file = undefined
    output(`Restore drill ${evidence.status}. Evidence recorded.`)
    return evidence.status === 'passed' ? 0 : 1
  } catch {
    // No driver text, input, connection strings, archive bytes or export payloads.
    error(
      'Restore drill could not complete or record evidence. No success is assumed; retain isolated targets for diagnosis.',
    )
    return 1
  } finally {
    await file?.close().catch(() => {})
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const hooks = registerApplicationModules()
  try {
    process.exitCode = await runRestoreDrillCommand()
  } finally {
    hooks.deregister()
  }
}
