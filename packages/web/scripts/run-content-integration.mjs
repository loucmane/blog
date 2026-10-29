import { spawnSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { createServer } from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const projectRoot = path.resolve(webRoot, '../..')
const composeFile = path.join(webRoot, 'tests/content/docker-compose.yml')
// Keep these in sync with Compose, below Linux's default ephemeral range (32768–60999).
const ports = { postgres: 25442, 's3-primary': 27042, 's3-restore': 27043 }
const s3Primary = `http://127.0.0.1:${ports['s3-primary']}`
const s3Restore = `http://127.0.0.1:${ports['s3-restore']}`

export async function assertContentPortsAvailable() {
  for (const [service, port] of Object.entries(ports)) {
    await new Promise((resolve, reject) => {
      const probe = createServer()
      probe.once('error', (error) => {
        const address = `${service} port 127.0.0.1:${port}`
        reject(
          new Error(
            error.code === 'EADDRINUSE'
              ? `Content integration ${address} is already in use. Stop the process using it and rerun pnpm test:content:integration.`
              : `Cannot check content integration ${address}: ${error.code ?? 'bind failed'}. Check local network permissions.`,
          ),
        )
      })
      probe.listen({ host: '127.0.0.1', port, exclusive: true }, () => {
        probe.close((error) => (error ? reject(error) : resolve()))
      })
    })
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: 'inherit',
    ...options,
  })
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with ${result.status}`)
  }
}

async function waitFor(url) {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch (error) {
      void error
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`${url} did not become ready`)
}

export async function runContentIntegration() {
  const compose = ['compose', '--file', composeFile]
  run('docker', [...compose, 'down', '--volumes', '--remove-orphans'])
  // Release stale containers before probing. Docker still handles a competing bind
  // between the probe closing and Compose starting the services.
  await assertContentPortsAvailable()
  try {
    run('docker', [...compose, 'up', '--detach', '--wait'])
    await Promise.all([waitFor(`${s3Primary}/health`), waitFor(`${s3Restore}/health`)])
    run(
      'pnpm',
      ['exec', 'vitest', 'run', 'packages/web/src/server/database/postgres.integration.test.ts'],
      {
        env: {
          ...process.env,
          TASK42_CONTENT_INTEGRATION: '1',
          TASK42_COMPOSE_FILE: composeFile,
          TASK42_DATABASE_URL: `postgresql://task42:task42-local-password@127.0.0.1:${ports.postgres}/magazine`,
          TASK42_RESTORE_DATABASE_URL: `postgresql://task42:task42-local-password@127.0.0.1:${ports.postgres}/magazine_restore`,
          TASK42_S3_PRIMARY: s3Primary,
          TASK42_S3_RESTORE: s3Restore,
        },
      },
    )
  } finally {
    run('docker', [...compose, 'down', '--volumes', '--remove-orphans'])
  }
}

export function isEntrypoint(argv1, moduleUrl) {
  if (!argv1) return false
  // Node resolves the module URL even when the script is launched through a symlink.
  return realpathSync(argv1) === fileURLToPath(moduleUrl)
}

if (isEntrypoint(process.argv[1], import.meta.url)) {
  try {
    await runContentIntegration()
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
