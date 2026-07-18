import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const projectRoot = path.resolve(webRoot, '../..')
const composeFile = path.join(webRoot, 'tests/content/docker-compose.yml')

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

const compose = ['compose', '--file', composeFile]
run('docker', [...compose, 'down', '--volumes', '--remove-orphans'])
try {
  run('docker', [...compose, 'up', '--detach', '--wait'])
  await Promise.all([
    waitFor('http://127.0.0.1:57042/health'),
    waitFor('http://127.0.0.1:57043/health'),
  ])
  run(
    'pnpm',
    ['exec', 'vitest', 'run', 'packages/web/src/server/database/postgres.integration.test.ts'],
    {
      env: {
        ...process.env,
        TASK42_CONTENT_INTEGRATION: '1',
        TASK42_COMPOSE_FILE: composeFile,
        TASK42_DATABASE_URL: 'postgresql://task42:task42-local-password@127.0.0.1:55442/magazine',
        TASK42_RESTORE_DATABASE_URL:
          'postgresql://task42:task42-local-password@127.0.0.1:55442/magazine_restore',
        TASK42_S3_PRIMARY: 'http://127.0.0.1:57042',
        TASK42_S3_RESTORE: 'http://127.0.0.1:57043',
      },
    },
  )
} finally {
  run('docker', [...compose, 'down', '--volumes', '--remove-orphans'])
}
