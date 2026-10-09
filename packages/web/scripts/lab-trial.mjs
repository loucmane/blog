import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { chmod, lstat, mkdir, open, readFile, rm, unlink, writeFile } from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { CreateBucketCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3'
import { Client } from 'pg'

import {
  canReuseBuild,
  sourceFingerprint,
  stopChild,
  stopChildren,
  waitForLocalServer,
} from './lab-local.mjs'

const webRoot = fileURLToPath(new URL('../', import.meta.url))
const repoRoot = path.resolve(webRoot, '../..')
export const trial = Object.freeze({
  project: 'blog-reader-lab-trial',
  url: 'http://localhost:3200',
  webPort: 3200,
  databasePort: 55444,
  storagePort: 57044,
  bucket: 'reader-lab-trial',
  stateDirectory: path.join(repoRoot, 'ci-artifacts/lab-trial'),
})
const composeFile = path.join(webRoot, 'scripts/lab-trial.compose.yml')
const secretNames = [
  'BETTER_AUTH_SECRET',
  'MAGAZINE_OWNER_SETUP_TOKEN',
  'MAGAZINE_LAB_SEED_TOKEN',
  'MAGAZINE_PREVIEW_TOKEN_SECRET',
  'MAGAZINE_PREVIEW_COOKIE_SECRET',
  'MAGAZINE_REVALIDATION_SECRET',
  'MAGAZINE_PUBLICATION_WORKER_TOKEN',
  'LAB_TRIAL_DB_USER',
  'LAB_TRIAL_DB_PASSWORD',
  'LAB_TRIAL_S3_ACCESS_KEY',
  'LAB_TRIAL_S3_SECRET_KEY',
]
const usage =
  'Usage: node packages/web/scripts/lab-trial.mjs start|stop|status|reset [--yes-delete-trial-data]'

export class TrialError extends Error {}

export function parseTrialArguments(args) {
  const [command, confirmation, ...extra] = args
  if (!['start', 'stop', 'status', 'reset'].includes(command) || extra.length) {
    throw new TrialError(usage)
  }
  if (command === 'reset') {
    if (confirmation !== '--yes-delete-trial-data') {
      throw new TrialError(
        'Reset deletes all trial stories, uploads and the owner account. To confirm, use reset --yes-delete-trial-data.',
      )
    }
  } else if (confirmation !== undefined) {
    throw new TrialError(usage)
  }
  return command
}

export function assertTrialEnvironment(environment) {
  if (environment.NODE_ENV === 'production') {
    throw new TrialError('The persistent local trial refuses to run with NODE_ENV=production.')
  }
  if (
    environment.VERCEL ||
    environment.VERCEL_ENV ||
    environment.VERCEL_TARGET_ENV ||
    environment.MAGAZINE_DEPLOYMENT_ENVIRONMENT === 'production'
  ) {
    throw new TrialError(
      'The persistent trial runs only on your computer, outside hosted deployments.',
    )
  }
}

export function generateTrialState() {
  const secrets = Object.fromEntries(
    secretNames.map((name) => [name, randomBytes(48).toString('base64url')]),
  )
  // PostgreSQL identifiers are limited to 63 bytes; start with a letter.
  secrets.LAB_TRIAL_DB_USER = `trial_${randomBytes(16).toString('hex')}`
  return { version: 1, secrets }
}

function validateState(state) {
  if (
    state?.version !== 1 ||
    !state.secrets ||
    Object.keys(state.secrets).length !== secretNames.length ||
    secretNames.some((name) => !/^[A-Za-z0-9_-]{32,64}$/.test(state.secrets[name] ?? '')) ||
    !/^trial_[a-f0-9]{32}$/.test(state.secrets.LAB_TRIAL_DB_USER) ||
    new Set(Object.values(state.secrets)).size !== secretNames.length
  ) {
    throw new TrialError(
      'The trial state is damaged. Restore its saved state file; do not replace credentials for existing data.',
    )
  }
  return state
}

export async function prepareStateDirectory(directory = trial.stateDirectory) {
  // Check both components, so an artifacts symlink cannot redirect secret writes or reset.
  for (const target of [path.dirname(directory), directory]) {
    await mkdir(target, { recursive: true, mode: 0o700 })
    if (!(await lstat(target)).isDirectory()) {
      throw new TrialError(
        'The trial state directory must be a real directory, not a symbolic link.',
      )
    }
  }
  await chmod(directory, 0o700)
}

export async function readTrialState(directory = trial.stateDirectory) {
  const file = path.join(directory, 'state.json')
  try {
    const info = await lstat(file)
    if (!info.isFile() || info.nlink !== 1)
      throw new TrialError('The trial state must be a private regular file.')
    await chmod(file, 0o600)
    return validateState(JSON.parse(await readFile(file, 'utf8')))
  } catch (error) {
    if (error.code === 'ENOENT') return null
    if (error instanceof TrialError) throw error
    throw new TrialError(
      'Could not read the private trial state. Check file access or restore its saved state file.',
    )
  }
}

export async function createTrialState(directory = trial.stateDirectory) {
  const state = generateTrialState()
  // Exclusive creation never rotates an existing database's credentials, including on crash.
  const file = await open(path.join(directory, 'state.json'), 'wx', 0o600)
  try {
    await file.writeFile(JSON.stringify(state))
    await file.sync()
  } finally {
    await file.close()
  }
  return state
}

function processAlive(pid) {
  if (!Number.isInteger(pid) || pid < 1) return false
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error.code !== 'ESRCH'
  }
}

export async function acquireTrialLock(directory = trial.stateDirectory) {
  const file = path.join(directory, 'launcher.lock')
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const handle = await open(file, 'wx', 0o600)
      await handle.writeFile(String(process.pid))
      await handle.close()
      return () => unlink(file)
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
      const info = await lstat(file)
      const pid = Number(await readFile(file, 'utf8'))
      if (!info.isFile() || !Number.isInteger(pid) || pid < 1 || processAlive(pid)) {
        throw new TrialError(
          'A trial command is already active. Press Ctrl+C in its terminal before stopping or resetting the trial.',
        )
      }
      await unlink(file)
    }
  }
  throw new TrialError('Another trial command started. Try again after it finishes.')
}

export function trialEnvironment(state, environment = process.env) {
  assertTrialEnvironment(environment)
  const clean = Object.fromEntries(
    Object.entries(environment).filter(
      ([name]) =>
        !/^(MAGAZINE_|BETTER_AUTH_|DATABASE_URL$|PG|NEXT_PUBLIC_|LAB_|VERCEL|COMPOSE_)/.test(name),
    ),
  )
  const secrets = state?.secrets ?? Object.fromEntries(secretNames.map((name) => [name, 'unused']))
  return {
    ...clean,
    ...secrets,
    NODE_ENV: 'test',
    HOSTNAME: '127.0.0.1',
    PORT: String(trial.webPort),
    DATABASE_URL: `postgresql://${secrets.LAB_TRIAL_DB_USER}:${secrets.LAB_TRIAL_DB_PASSWORD}@127.0.0.1:${trial.databasePort}/magazine_trial`,
    BETTER_AUTH_URL: trial.url,
    MAGAZINE_RUNTIME_SITE_URL: trial.url,
    MAGAZINE_LAB_SEED_URL: trial.url,
    NEXT_PUBLIC_SITE_URL: trial.url,
    MAGAZINE_OWNER_EMAIL: 'owner@example.test',
    MAGAZINE_OWNER_NAME: 'Local magazine owner',
    MAGAZINE_OWNER_TIME_ZONE: 'Europe/Stockholm',
    MAGAZINE_CONTENT_BACKEND: 'postgres',
    // Empty values prevent Next's .env loading from reactivating fixtures or recovery hooks.
    MAGAZINE_OWNER_TEST_MODE: '',
    MAGAZINE_OWNER_TEST_TOKEN: '',
    MAGAZINE_OWNER_RECOVERY_WEBHOOK_URL: '',
    MAGAZINE_OWNER_RECOVERY_WEBHOOK_SECRET: '',
    MAGAZINE_DEPLOYMENT_ENVIRONMENT: 'preview',
    VERCEL: '',
    VERCEL_ENV: 'preview',
    VERCEL_TARGET_ENV: 'preview',
    MAGAZINE_MEDIA_BUCKET: trial.bucket,
    MAGAZINE_MEDIA_REGION: 'us-east-1',
    MAGAZINE_MEDIA_ENDPOINT: `http://127.0.0.1:${trial.storagePort}`,
    MAGAZINE_MEDIA_ACCESS_KEY_ID: secrets.LAB_TRIAL_S3_ACCESS_KEY,
    MAGAZINE_MEDIA_SECRET_ACCESS_KEY: secrets.LAB_TRIAL_S3_SECRET_KEY,
    NEXT_TELEMETRY_DISABLED: '1',
  }
}

export function trialComposeArguments(args) {
  return [
    'compose',
    '--project-name',
    trial.project,
    '--file',
    composeFile,
    '--env-file',
    process.platform === 'win32' ? 'NUL' : '/dev/null',
    ...args,
  ]
}

export function assertLocalDockerEndpoint(endpoint) {
  if (/^unix:\/\/\//.test(endpoint) || /^npipe:\/\/\/\/\.\/pipe\//.test(endpoint)) return
  try {
    const url = new URL(endpoint)
    if (
      url.protocol === 'tcp:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      !url.pathname
    )
      return
  } catch {
    /* Report a fixed message; an endpoint may contain credentials. */
  }
  throw new TrialError(
    'The trial requires Docker on this computer. Select a local Docker context before running this command.',
  )
}

/** Quiet children share the local lab's process-group cleanup, including resistant descendants. */
export function trialProcesses() {
  const abort = new AbortController()
  const children = new Set()
  let interrupted = false
  const stopped = new Promise((resolve) =>
    abort.signal.addEventListener('abort', resolve, { once: true }),
  )
  const stop = () => {
    interrupted = true
    abort.abort()
    for (const child of children) void stopChild(child).catch(() => {})
  }
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)
  function launch(command, args, env, capture = false) {
    abort.signal.throwIfAborted()
    const child = spawn(command, args, {
      cwd: webRoot,
      env,
      stdio: ['ignore', capture ? 'pipe' : 'ignore', capture === 'diagnostics' ? 'pipe' : 'ignore'],
      detached: process.platform !== 'win32',
    })
    let output = ''
    let errorOutput = ''
    let overflow = false
    const collect = (chunk, stderr) => {
      if (overflow) return
      if (stderr) errorOutput += chunk
      else output += chunk
      if (output.length + errorOutput.length > 1_000_000) {
        // Discard oversized output entirely: truncating could expose part of a secret.
        output = '[Child output omitted: capture limit exceeded.]'
        errorOutput = ''
        overflow = true
      }
    }
    child.stdout?.setEncoding('utf8')
    child.stderr?.setEncoding('utf8')
    child.stdout?.on('data', (chunk) => collect(chunk, false))
    child.stderr?.on('data', (chunk) => collect(chunk, true))
    const result = new Promise((resolve) => {
      child.once('error', () => resolve({ code: -1 }))
      child.once('close', (code) => resolve({ code, output, errorOutput }))
    })
    const managed = { child, result, retired: false }
    children.add(managed)
    managed.finished = result.then(async (outcome) => {
      await stopChild(managed)
      children.delete(managed)
      return outcome
    })
    void managed.finished.catch((error) => abort.abort(error))
    return managed
  }
  async function checked(managed, failure, redactOutput) {
    const outcome = await Promise.race([managed.finished, stopped])
    abort.signal.throwIfAborted()
    if (outcome.code !== 0) {
      const details = redactOutput
        ? [outcome.output, outcome.errorOutput]
            .map((text) => redactOutput(text ?? '').trim())
            .filter(Boolean)
            .join('\n')
        : ''
      throw new TrialError(details ? `${failure}\n${details}` : failure)
    }
    return outcome.output
  }
  return {
    launch,
    checked,
    signal: abort.signal,
    get interrupted() {
      return interrupted
    },
    async close() {
      try {
        await stopChildren(children)
      } finally {
        process.removeListener('SIGINT', stop)
        process.removeListener('SIGTERM', stop)
      }
    },
  }
}

export function redactTrialOutput(output, env) {
  const secrets = [env.DATABASE_URL, ...secretNames.map((name) => env[name])]
    .filter((value) => typeof value === 'string' && value.length > 0)
    .flatMap((value) => [value, encodeURIComponent(value)])
    .sort((a, b) => b.length - a.length)
  let redacted = String(output)
  for (const secret of secrets) redacted = redacted.replaceAll(secret, '[redacted]')
  return redacted
}

export async function assertTrialPortAvailable(port, createServer = () => net.createServer()) {
  const probe = createServer()
  await new Promise((resolve, reject) => {
    probe.once('error', (error) =>
      reject(
        new TrialError(
          error.code === 'EADDRINUSE'
            ? `Port ${port} is in use. Stop the other service, then start the trial again.`
            : `Cannot use local port ${port}. Check your computer's network permissions.`,
        ),
      ),
    )
    probe.listen(port, '127.0.0.1', () => probe.close(resolve))
  })
}

export function parseTrialContainers(output) {
  try {
    const trimmed = output.trim()
    const rows = !trimmed
      ? []
      : trimmed.startsWith('[')
        ? JSON.parse(trimmed)
        : trimmed.split('\n').map((line) => JSON.parse(line))
    if (
      !Array.isArray(rows) ||
      rows.some(
        (row) => row.Project !== trial.project || !['postgres', 'storage'].includes(row.Service),
      )
    )
      throw new Error()
    return rows
  } catch {
    throw new TrialError('Docker returned an unrecognized trial status. Check Docker Compose v2.')
  }
}

export async function checkTrialPorts(containers, probe = assertTrialPortAvailable) {
  await probe(trial.webPort)
  for (const [service, port] of [
    ['postgres', trial.databasePort],
    ['storage', trial.storagePort],
  ]) {
    const own = containers.some(
      (row) =>
        row.Service === service &&
        row.State === 'running' &&
        row.Publishers?.some(
          (binding) => binding.URL === '127.0.0.1' && binding.PublishedPort === port,
        ),
    )
    if (!own) await probe(port)
  }
}

async function storageReady(signal) {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    signal.throwIfAborted()
    try {
      const response = await fetch(`http://127.0.0.1:${trial.storagePort}/health`, {
        redirect: 'error',
        signal: AbortSignal.any([signal, AbortSignal.timeout(2_000)]),
      })
      await response.body?.cancel()
      if (response.ok) return
    } catch {
      signal.throwIfAborted()
    }
    await delay(250, undefined, { signal })
  }
  throw new TrialError(
    'Trial storage did not become ready. Check Docker, then run start again; data is kept.',
  )
}

function retryableDatabaseError(error) {
  if (error.name === 'TimeoutError') return true
  if (error.code) {
    return [
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'EPIPE',
      '57P01',
      '57P02',
      '57P03',
      '08000',
      '08001',
      '08003',
      '08006',
    ].includes(error.code)
  }
  return /^(connection terminated(?: unexpectedly| due to connection timeout)?|connection ended unexpectedly|timeout expired|query read timeout|the database system is (?:starting up|shutting down))$/i.test(
    error.message ?? '',
  )
}

export async function waitForTrialDatabase(
  env,
  signal,
  {
    createClient = (options) => new Client(options),
    timeoutMs = 60_000,
    now = () => performance.now(),
    sleep = delay,
  } = {},
) {
  const deadline = now() + timeoutMs
  let backoff = 250
  while (now() < deadline) {
    signal.throwIfAborted()
    const attemptMs = Math.max(1, Math.ceil(Math.min(3_000, deadline - now())))
    const client = createClient({
      connectionString: env.DATABASE_URL,
      connectionTimeoutMillis: attemptMs,
      query_timeout: attemptMs,
      statement_timeout: attemptMs,
    })
    client.on('error', () => {})
    const attemptSignal = AbortSignal.any([signal, AbortSignal.timeout(attemptMs)])
    let onAbort
    const aborted = new Promise((_, reject) => {
      onAbort = () => reject(attemptSignal.reason)
      attemptSignal.addEventListener('abort', onAbort, { once: true })
    })
    try {
      await Promise.race([
        (async () => {
          await client.connect()
          attemptSignal.throwIfAborted()
          await client.query('SELECT 1')
        })(),
        aborted,
      ])
      attemptSignal.throwIfAborted()
      return
    } catch (error) {
      signal.throwIfAborted()
      if (!retryableDatabaseError(error)) {
        throw new TrialError(
          'Could not connect to the trial database. Check Docker and the saved trial credentials; data is kept.',
        )
      }
    } finally {
      attemptSignal.removeEventListener('abort', onAbort)
      await client.end().catch(() => {})
    }
    const remaining = deadline - now()
    if (remaining > 0) await sleep(Math.min(backoff, remaining), undefined, { signal })
    backoff = Math.min(backoff * 2, 2_000)
  }
  signal.throwIfAborted()
  throw new TrialError(
    'Trial database did not become ready in time. Check Docker, then run start again; data and credentials are kept.',
  )
}

export async function ensureTrialBucket(
  env,
  signal,
  createClient = (options) => new S3Client(options),
) {
  const client = createClient({
    endpoint: env.MAGAZINE_MEDIA_ENDPOINT,
    region: env.MAGAZINE_MEDIA_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.MAGAZINE_MEDIA_ACCESS_KEY_ID,
      secretAccessKey: env.MAGAZINE_MEDIA_SECRET_ACCESS_KEY,
    },
  })
  const options = { abortSignal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]) }
  try {
    try {
      await client.send(new HeadBucketCommand({ Bucket: trial.bucket }), options)
    } catch (error) {
      if (error.$metadata?.httpStatusCode !== 404) throw error
      await client.send(new CreateBucketCommand({ Bucket: trial.bucket }), options)
    }
  } catch {
    throw new TrialError(
      'Could not prepare the trial media bucket. Check Docker and the saved trial credentials.',
    )
  } finally {
    client.destroy()
  }
}

export async function trialOwnerState(env, createClient = (options) => new Client(options)) {
  const client = createClient({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: 3_000,
    query_timeout: 3_000,
    statement_timeout: 3_000,
  })
  client.on('error', () => {})
  try {
    await client.connect()
    const { rows } = await client.query(`SELECT
      EXISTS (SELECT 1 FROM owner_users) AS "ownerExists",
      (EXISTS (SELECT 1 FROM owner_users) OR EXISTS (SELECT 1 FROM owner_accounts) OR
       EXISTS (SELECT 1 FROM idempotency_records WHERE operation = 'owner-setup' AND key = 'singleton'
         AND result->>'completed' <> 'false')) AS "setupClosed"`)
    if (typeof rows[0]?.ownerExists !== 'boolean' || typeof rows[0]?.setupClosed !== 'boolean')
      throw new Error()
    return rows[0]
  } catch {
    throw new TrialError(
      'Could not check the trial owner. Start the trial to prepare its database, then try again.',
    )
  } finally {
    await client.end().catch(() => {})
  }
}

export function trialReadyLines(state, owner) {
  return [
    trial.url,
    `${trial.url}/owner/sign-in`,
    ...(!owner.ownerExists && !owner.setupClosed
      ? [`${trial.url}/owner/setup#${encodeURIComponent(state.secrets.MAGAZINE_OWNER_SETUP_TOKEN)}`]
      : []),
  ]
}

async function reportTrialStatus(containers, state, env, log) {
  for (const service of ['postgres', 'storage']) {
    const container = containers.find((row) => row.Service === service)
    log(
      `${service === 'postgres' ? 'Database' : 'Storage'}: ${container?.State === 'running' ? 'up' : 'stopped'}`,
    )
  }
  let up = false
  try {
    const pid = Number(await readFile(path.join(trial.stateDirectory, 'launcher.lock'), 'utf8'))
    if (processAlive(pid)) {
      const response = await fetch(`${trial.url}/owner/sign-in`, {
        redirect: 'error',
        signal: AbortSignal.timeout(2_000),
      })
      await response.body?.cancel()
      up = response.ok
    }
  } catch {
    /* A stopped server is an expected status. */
  }
  log(`Server: ${up ? 'up' : 'stopped or not ready'}`)
  let owner = 'unknown (start the trial to check)'
  if (state && containers.some((row) => row.Service === 'postgres' && row.State === 'running')) {
    try {
      owner = (await trialOwnerState(env)).ownerExists ? 'exists' : 'not created'
    } catch {
      /* Report unknown, never credentials. */
    }
  }
  log(`Owner: ${owner}`)
}

export async function runTrial({
  args = process.argv.slice(2),
  environment = process.env,
  log = console.log,
} = {}) {
  const command = parseTrialArguments(args)
  assertTrialEnvironment(environment)
  const processes = trialProcesses()
  let unlock
  try {
    await processes.checked(
      processes.launch(
        'git',
        ['-C', repoRoot, 'check-ignore', '--quiet', 'ci-artifacts/lab-trial/state.json'],
        cleanGitEnvironment(environment),
      ),
      'The trial state path is not ignored by Git. Restore the ci-artifacts/ ignore before using this command.',
    )
    await prepareStateDirectory()
    if (command !== 'status') unlock = await acquireTrialLock()
    // Stop/reset do not authenticate to services. They must also work if state was lost or damaged.
    let state = ['stop', 'reset'].includes(command) ? null : await readTrialState()
    let env = trialEnvironment(state, environment)
    const docker = async (args, failure, capture = false) =>
      processes.checked(processes.launch('docker', args, env, capture), failure)
    const endpoint = await docker(
      ['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}'],
      'Could not inspect the Docker context. Check that Docker and Compose v2 are installed.',
      true,
    )
    // An explicit context takes precedence over DOCKER_HOST in Docker's CLI.
    assertLocalDockerEndpoint((env.DOCKER_CONTEXT ? endpoint : env.DOCKER_HOST || endpoint).trim())
    const compose = (args, capture = false) =>
      docker(
        trialComposeArguments(args),
        'Docker could not complete the trial command. Check that Docker and Compose v2 are running; trial data has been kept.',
        capture,
      )
    const containers = parseTrialContainers(
      await compose(['ps', '--all', '--format', 'json'], true),
    )
    if (command === 'status') {
      await reportTrialStatus(containers, state, env, log)
      return
    }
    if (command === 'stop') {
      await compose(['stop'])
      log('Trial containers stopped. Stories, uploads and the owner account are kept.')
      return
    }
    if (command === 'reset') {
      await assertTrialPortAvailable(trial.webPort)
      await compose(['down', '--volumes'])
      // Keep the lock until all state is removed; do not touch any sibling artifacts.
      await rm(path.join(trial.stateDirectory, 'state.json'), { force: true })
      log('Trial data and credentials deleted. The next start creates a fresh trial.')
      return
    }
    await checkTrialPorts(containers)
    if (!state) {
      const volumes = await docker(
        [
          'volume',
          'ls',
          '--filter',
          `label=com.docker.compose.project=${trial.project}`,
          '--format',
          '{{.Name}}',
        ],
        'Could not check the trial volumes. Check Docker.',
        true,
      )
      if (containers.length || volumes.trim())
        throw new TrialError(
          'Trial data exists but its saved credentials are missing. Restore ci-artifacts/lab-trial/state.json, or explicitly reset the trial.',
        )
      state = await createTrialState()
      env = trialEnvironment(state, environment)
    }
    await compose(['up', '--detach', '--wait', '--wait-timeout', '60'])
    await storageReady(processes.signal)
    await ensureTrialBucket(env, processes.signal)
    await waitForTrialDatabase(env, processes.signal)
    const node = (args, runtime, failure, diagnostics = false) =>
      processes.checked(
        processes.launch(process.execPath, args, runtime, diagnostics ? 'diagnostics' : false),
        failure,
        diagnostics ? (output) => redactTrialOutput(output, runtime) : undefined,
      )
    await node(
      [path.join(webRoot, 'scripts/migrate.mjs'), '--apply', '--environment', 'preview'],
      env,
      'Trial database preparation failed. Check Docker and the migration history; data and credentials have been kept.',
      true,
    )
    const next = path.join(webRoot, 'node_modules/next/dist/bin/next')
    const fingerprint = await sourceFingerprint()
    if (!(await canReuseBuild(fingerprint, webRoot, 'lab-trial.json'))) {
      await node(
        [next, 'build'],
        { ...env, NODE_ENV: 'production' },
        'The trial build failed. Check that the pinned Node/pnpm tools and dependencies are installed, then run the project build to diagnose it.',
      )
      const buildId = await readFile(path.join(webRoot, '.next/BUILD_ID'), 'utf8')
      await writeFile(
        path.join(webRoot, '.next/lab-trial.json'),
        JSON.stringify({ fingerprint, buildId }),
      )
    }
    await assertTrialPortAvailable(trial.webPort)
    const server = processes.launch(
      process.execPath,
      [next, 'start', '--hostname', '127.0.0.1', '--port', String(trial.webPort)],
      env,
    )
    let exited = false
    void server.result.then(() => {
      exited = true
    })
    await waitForLocalServer(new URL(trial.url), { signal: processes.signal, exited: () => exited })
    await node(
      [path.join(webRoot, 'scripts/lab-seed.mjs')],
      env,
      'North House seeding failed. Check the trial database and storage, then start again; existing data is kept.',
    )
    const owner = await trialOwnerState(env)
    processes.signal.throwIfAborted()
    if (exited) throw new TrialError('The trial server stopped before setup was ready.')
    for (const line of trialReadyLines(state, owner)) log(line)
    await processes.checked(
      server,
      'The trial server stopped unexpectedly. Start it again; trial data is kept.',
    )
  } catch (error) {
    if (!processes.interrupted) throw error
  } finally {
    try {
      await processes.close()
    } finally {
      await unlock?.()
    }
  }
}

function cleanGitEnvironment(environment) {
  return Object.fromEntries(
    Object.entries(environment).filter(([name]) => !name.startsWith('GIT_')),
  )
}

export async function trialMain(options = {}) {
  try {
    await runTrial(options)
    return 0
  } catch (error) {
    // Only our fixed errors and explicitly scrubbed migration diagnostics are safe to print.
    const reportError = options.error ?? console.error
    reportError(
      error instanceof TrialError
        ? error.message
        : 'The local trial could not complete. Check Docker, local file permissions and installed project dependencies; saved data is kept.',
    )
    return 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = await trialMain()
}
