import { spawnSync } from 'node:child_process'
import { randomBytes, randomUUID } from 'node:crypto'
import { realpathSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

import { runLabSeed } from './lab-seed.mjs'

const project = 'blog-container-smoke'
const network = `${project}_default`
const revisionPattern = /^[0-9a-f]{40}$/
const revisionLabel = 'org.opencontainers.image.revision'
const storyPath = '/stories/the-long-table-a-field-guide-to-the-north-house-kitchen'
const canonicalOrigin = 'https://container-smoke.example'
const storage = {
  MAGAZINE_MEDIA_BUCKET: 'magazine-container-smoke',
  MAGAZINE_MEDIA_REGION: 'us-east-1',
  MAGAZINE_MEDIA_ENDPOINT: 'http://s3-primary:7070',
  // Synthetic credentials from tests/content/docker-compose.yml.
  MAGAZINE_MEDIA_ACCESS_KEY_ID: 'task42-access',
  MAGAZINE_MEDIA_SECRET_ACCESS_KEY: 'task42-local-secret',
}
const databaseUrl = new URL('postgresql://task42@postgres/magazine')
databaseUrl.password = 'task42-local-password'

const prepareBucket = `
import { CreateBucketCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3'
import { setTimeout as delay } from 'node:timers/promises'
const env = process.env
const health = new URL('/health', env.MAGAZINE_MEDIA_ENDPOINT)
for (let attempt = 0; ; attempt += 1) {
  const response = await fetch(health, { signal: AbortSignal.timeout(750) }).catch(() => null)
  await response?.body?.cancel()
  if (response?.ok) break
  if (attempt === 19) throw new Error('S3 fixture did not become ready')
  await delay(250)
}
const client = new S3Client({
  credentials: {
    accessKeyId: env.MAGAZINE_MEDIA_ACCESS_KEY_ID,
    secretAccessKey: env.MAGAZINE_MEDIA_SECRET_ACCESS_KEY,
  },
  endpoint: env.MAGAZINE_MEDIA_ENDPOINT,
  forcePathStyle: true,
  region: env.MAGAZINE_MEDIA_REGION,
  maxAttempts: 1,
})
const input = { Bucket: env.MAGAZINE_MEDIA_BUCKET }
try {
  await client.send(new HeadBucketCommand(input))
} catch (error) {
  if (error.$metadata?.httpStatusCode !== 404) throw error
  await client.send(new CreateBucketCommand(input))
} finally {
  client.destroy()
}
`

class SmokeError extends Error {}

function dockerCommand(args, { environment, timeout = 30_000, allowMissing = false } = {}) {
  const result = spawnSync('docker', args, {
    encoding: 'utf8',
    env: { ...process.env, ...environment },
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout,
  })
  if (result.error?.code === 'ENOENT') throw new SmokeError('Docker CLI is unavailable.')
  if (result.error?.code === 'ETIMEDOUT') throw new SmokeError('Docker command timed out.')
  if (result.status === 0) return result.stdout.trim()
  if (
    allowMissing &&
    /^Error response from daemon: No such container: [^\n]+\s*$/.test(result.stderr)
  ) {
    return ''
  }
  const outcome = result.status ?? result.signal ?? 'unknown'
  throw new SmokeError(`Docker command failed (${outcome}).`)
}

function parseJson(source, description) {
  try {
    return JSON.parse(source)
  } catch {
    throw new SmokeError(`${description} did not return valid JSON.`)
  }
}

function verifiedImage(image, revision) {
  if (!/^sha256:[0-9a-f]{64}$/.test(image?.Id)) {
    throw new SmokeError('Docker did not return an immutable image ID.')
  }
  const config = image.Config
  if (config?.Labels?.[revisionLabel] !== revision) {
    throw new SmokeError('Image revision label differs from the requested source revision.')
  }
  if (config.User !== 'node' || config.Healthcheck?.Test?.[0] !== 'CMD') {
    throw new SmokeError('Image must use the node account and an exec-form health check.')
  }
  if (
    config.Cmd?.[0] !== 'node' ||
    config.Cmd[1] !== 'node_modules/next/dist/bin/next' ||
    config.Cmd[2] !== 'start'
  ) {
    throw new SmokeError('Image default command must start Next.js.')
  }
  // Limit both names and values to the official Node base image and this Dockerfile's defaults.
  const permitted =
    /^(?:PATH=\/[a-zA-Z0-9/:._-]+|(?:NODE_VERSION|YARN_VERSION)=\d+\.\d+\.\d+|NODE_ENV=production|NEXT_TELEMETRY_DISABLED=1)$/
  if (!Array.isArray(config.Env) || config.Env.some((entry) => !permitted.test(entry))) {
    throw new SmokeError('Image config contains an unexpected environment entry.')
  }
  return image.Id
}

function runArguments(name, environment) {
  return [
    'run',
    '--name',
    name,
    '--network',
    network,
    '--read-only',
    '--tmpfs',
    '/tmp:rw,noexec,nosuid,nodev,size=256m,mode=1777',
    ...Object.keys(environment).flatMap((key) => ['--env', key]),
  ]
}

async function request(
  fetcher,
  origin,
  path,
  { status = 200, method = 'GET', timeout = 10_000 } = {},
) {
  let response
  try {
    response = await fetcher(new URL(path, origin), {
      method,
      redirect: 'manual',
      signal: AbortSignal.timeout(timeout),
    })
  } catch {
    throw new SmokeError(`${method} ${path} could not be reached.`)
  }
  if (response.status !== status) {
    await response.body?.cancel().catch(() => {})
    throw new SmokeError(`${method} ${path} returned HTTP ${response.status}; expected ${status}.`)
  }
  return response
}

async function expectDocument(fetcher, origin, path, type, ...markers) {
  const response = await request(fetcher, origin, path)
  const body = await response.text()
  if (
    !response.headers.get('content-type')?.startsWith(type) ||
    markers.some((marker) => !body.includes(marker))
  ) {
    throw new SmokeError(`GET ${path} did not serve the expected ${type} content.`)
  }
  return body
}

async function waitForHealth(fetcher, origin, readyForMs, pause) {
  const deadline = performance.now() + readyForMs
  do {
    try {
      const response = await request(fetcher, origin, '/api/health', { timeout: 3_000 })
      const health = parseJson(await response.text(), 'Health endpoint')
      if (
        ['ok', 'degraded'].includes(health?.status) &&
        ['up', 'degraded'].includes(health.checks?.database?.status)
      ) {
        return
      }
    } catch (error) {
      if (performance.now() >= deadline) throw error
    }
    if (performance.now() < deadline) await pause(250)
  } while (performance.now() < deadline)
  throw new SmokeError(
    'Health endpoint did not report ready PostgreSQL. Check the application and migrations.',
  )
}

export async function runContainerSmoke({
  image,
  revision,
  docker = dockerCommand,
  fetcher = fetch,
  seed = runLabSeed,
  readyForMs = 45_000,
  pause = delay,
  log = console.log,
}) {
  if (!image || image.startsWith('-') || !revisionPattern.test(revision)) {
    throw new SmokeError(
      'Usage: node packages/web/scripts/container-smoke.mjs IMAGE SOURCE_REVISION',
    )
  }
  const id = randomUUID()
  const containers = []
  let stage = 'Inspect image config'
  let result
  try {
    const inspected = docker(['image', 'inspect', '--format', '{{json .}}', image])
    const imageId = verifiedImage(parseJson(inspected, 'Image inspection'), revision)
    log('PASS image config and revision label')

    stage = 'Locate disposable Compose services'
    if (
      docker([
        'network',
        'inspect',
        '--format',
        '{{index .Labels "com.docker.compose.project"}}',
        network,
      ]) !== project
    ) {
      throw new SmokeError('Start the documented local PostgreSQL and S3 Compose services.')
    }

    stage = 'Apply migrations to the disposable database'
    const migrationName = `container-smoke-migrate-${id}`
    const migrationEnv = { DATABASE_URL: databaseUrl.href }
    containers.push(migrationName)
    docker(
      [
        ...runArguments(migrationName, migrationEnv),
        imageId,
        'node',
        'scripts/migrate.mjs',
        '--apply',
        '--environment',
        'production',
      ],
      { environment: migrationEnv, timeout: 120_000 },
    )
    log('PASS one-off migrations')

    stage = 'Wait for local S3 and prepare the fixture media bucket'
    const bucketName = `container-smoke-bucket-${id}`
    containers.push(bucketName)
    docker(
      [
        ...runArguments(bucketName, storage),
        imageId,
        'node',
        '--input-type=module',
        '--eval',
        prepareBucket,
      ],
      { environment: storage },
    )

    stage = 'Start the read-only application container'
    const appName = `container-smoke-web-${id}`
    const appEnv = {
      ...migrationEnv,
      ...storage,
      BETTER_AUTH_SECRET: randomBytes(32).toString('hex'),
      MAGAZINE_DEPLOYMENT_ENVIRONMENT: 'preview',
      MAGAZINE_LAB_SEED_TOKEN: randomBytes(32).toString('hex'),
      MAGAZINE_OWNER_EMAIL: 'owner@container-smoke.example',
      MAGAZINE_RUNTIME_SITE_URL: canonicalOrigin,
    }
    containers.push(appName)
    docker(
      [...runArguments(appName, appEnv), '--detach', '--publish', '127.0.0.1::3000', imageId],
      { environment: appEnv },
    )
    const binding = docker(['port', appName, '3000/tcp'])
    if (!/^127\.0\.0\.1:[1-9]\d{0,4}$/.test(binding)) {
      throw new SmokeError('Docker did not report a loopback-only HTTP port.')
    }
    const origin = `http://${binding}`

    stage = 'Wait for application health'
    await waitForHealth(fetcher, origin, readyForMs, pause)
    log('PASS /api/health and migrated PostgreSQL')

    stage = 'Check served build revision'
    const actual = await expectDocument(fetcher, origin, '/build-revision.txt', 'text/plain')
    if (actual !== `${revision}\n`)
      throw new SmokeError('Served revision differs from the build revision.')
    log('PASS served build revision')

    stage = 'Seed the disposable North House fixture'
    await seed({
      environment: {
        MAGAZINE_DEPLOYMENT_ENVIRONMENT: appEnv.MAGAZINE_DEPLOYMENT_ENVIRONMENT,
        MAGAZINE_LAB_SEED_TOKEN: appEnv.MAGAZINE_LAB_SEED_TOKEN,
        MAGAZINE_LAB_SEED_URL: origin,
      },
      fetcher,
    }).catch(() => {
      throw new SmokeError(
        'Fixture seed failed. Check the lab route and local PostgreSQL/S3 services.',
      )
    })

    stage = 'Check public and owner routes'
    await expectDocument(fetcher, origin, storyPath, 'text/html', 'North House kitchen notes')
    await expectDocument(fetcher, origin, '/feed.xml', 'application/rss+xml', '<rss', storyPath)
    await expectDocument(
      fetcher,
      origin,
      '/sitemap.xml',
      'application/xml',
      '<sitemapindex',
      '/sitemaps/1.xml',
    )
    await expectDocument(
      fetcher,
      origin,
      '/sitemaps/1.xml',
      'application/xml',
      '<urlset',
      storyPath,
    )
    await expectDocument(
      fetcher,
      origin,
      '/owner/sign-in',
      'text/html',
      'Sign in to write, preview, schedule, and publish',
    )
    const drain = await request(fetcher, origin, '/api/internal/outbox/drain', {
      method: 'POST',
      status: 503,
    })
    if (
      parseJson(await drain.text(), 'Outbox drain')?.error !== 'The outbox drain is not configured.'
    ) {
      throw new SmokeError('Outbox drain did not report that it was unconfigured.')
    }
    log('PASS published article, RSS, sitemap, owner sign-in and unconfigured outbox drain')
  } catch (error) {
    const reason =
      error instanceof SmokeError
        ? error.message
        : 'Unexpected error; check this step on the Docker host.'
    result = `${stage}: ${reason}`
  } finally {
    for (const container of containers.reverse()) {
      try {
        docker(['container', 'rm', '--force', container], { allowMissing: true })
      } catch {
        const cleanup = `Could not remove ${container}. Remove it from the local Docker host.`
        result = [result, cleanup].filter(Boolean).join(' ')
      }
    }
  }
  if (result) throw new SmokeError(result)
  log('PASS container smoke')
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [image, revision, ...extra] = process.argv.slice(2)
  try {
    await runContainerSmoke({ image: extra.length === 0 ? image : undefined, revision })
  } catch (error) {
    const message = error instanceof SmokeError ? error.message : 'Unexpected smoke runner error.'
    console.error(`FAIL container smoke: ${message}`)
    process.exitCode = 1
  }
}
