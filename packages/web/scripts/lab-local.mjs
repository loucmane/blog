import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'

const webRoot = fileURLToPath(new URL('../', import.meta.url))

export function localLabConfiguration(environment = process.env) {
  if (environment.NODE_ENV === 'production') {
    throw new Error('The local Reader Lab refuses to run with NODE_ENV=production.')
  }
  const origins = [
    'LAB_LOCAL_URL',
    'MAGAZINE_RUNTIME_SITE_URL',
    'BETTER_AUTH_URL',
    'MAGAZINE_LAB_SEED_URL',
  ]
    .map((key) => environment[key])
    .filter(Boolean)
  const url = new URL(origins[0] ?? 'http://localhost:3100')
  for (const value of [url.href, ...origins]) {
    const candidate = new URL(value)
    if (
      candidate.protocol !== 'http:' ||
      !['localhost', '127.0.0.1'].includes(candidate.hostname) ||
      candidate.username ||
      candidate.password ||
      candidate.search ||
      candidate.hash ||
      candidate.pathname !== '/' ||
      candidate.origin !== url.origin
    )
      throw new Error(
        'The local Reader Lab requires matching plain HTTP loopback URLs (localhost or 127.0.0.1).',
      )
  }
  const runtime = {
    ...environment,
    NODE_ENV: 'test',
    HOSTNAME: '127.0.0.1',
    PORT: url.port || '80',
    DATABASE_URL: '',
    MAGAZINE_OWNER_TEST_MODE: '1',
    MAGAZINE_OWNER_TEST_TOKEN: 'task43-owner-test-token-with-more-than-thirty-two-bytes',
    MAGAZINE_LAB_SEED_TOKEN: 'task44-lab-seed-token-with-more-than-32-bytes',
    MAGAZINE_OWNER_EMAIL: 'owner@example.test',
    MAGAZINE_OWNER_NAME: 'Editorial owner',
    MAGAZINE_OWNER_TIME_ZONE: 'Europe/Stockholm',
    MAGAZINE_RUNTIME_SITE_URL: url.origin,
    MAGAZINE_LAB_SEED_URL: url.origin,
    BETTER_AUTH_URL: url.origin,
    NEXT_PUBLIC_SITE_URL: 'https://canonical.magazine.invalid',
    MAGAZINE_PREVIEW_COOKIE_SECRET: 'task40-preview-cookie-secret-with-32-bytes',
    MAGAZINE_PREVIEW_TOKEN_SECRET: 'task40-preview-token-secret-with-32-bytes',
    MAGAZINE_REVALIDATION_SECRET: 'task40-revalidation-secret-with-32-bytes',
    MAGAZINE_PUBLICATION_WORKER_TOKEN: 'task43-publication-worker-token-more-than-32',
  }
  const build = { ...runtime, NODE_ENV: 'production' }
  delete build.MAGAZINE_OWNER_TEST_MODE
  delete build.MAGAZINE_OWNER_TEST_TOKEN
  return { url, runtime, build }
}

/** Include additions, edits and deletions, not just the timestamp of an old build. */
export async function sourceFingerprint(root = webRoot) {
  const hash = createHash('sha256').update(process.version)
  async function visit(relative) {
    const absolute = path.join(root, relative)
    const entries = await readdir(absolute, { withFileTypes: true }).catch((error) => {
      if (error.code === 'ENOTDIR') return null
      if (error.code === 'ENOENT') return []
      throw error
    })
    if (entries === null) {
      hash.update(relative).update(await readFile(absolute))
    } else {
      for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        if (entry.isSymbolicLink())
          throw new Error(`Cannot fingerprint symbolic source: ${relative}/${entry.name}`)
        await visit(path.join(relative, entry.name))
      }
    }
  }
  for (const file of [
    'src',
    'public',
    'content',
    'scripts',
    'package.json',
    'next.config.ts',
    'postcss.config.mjs',
    'tsconfig.json',
    '../../package.json',
    '../../pnpm-lock.yaml',
    '../../pnpm-workspace.yaml',
    '../../tsconfig.json',
  ]) {
    await visit(file)
  }
  return hash.digest('hex')
}

export async function canReuseBuild(fingerprint, root = webRoot, stampName = 'lab-local.json') {
  try {
    const buildId = await readFile(path.join(root, '.next/BUILD_ID'), 'utf8')
    const stamp = JSON.parse(await readFile(path.join(root, '.next', stampName), 'utf8'))
    return Boolean(buildId.trim()) && stamp.buildId === buildId && stamp.fingerprint === fingerprint
  } catch {
    return false
  }
}

async function assertPortAvailable(port) {
  const probe = net.createServer()
  await new Promise((resolve, reject) => {
    probe.once('error', () =>
      reject(
        new Error(
          `Port ${port} is in use. Stop the other server, then run node packages/web/scripts/lab-local.mjs again.`,
        ),
      ),
    )
    probe.listen(Number(port), '127.0.0.1', () => probe.close(resolve))
  })
}

export async function waitForLocalServer(
  url,
  { signal, exited, fetcher = fetch, pause = delay, timeout = 60_000 },
) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    signal.throwIfAborted()
    if (exited()) throw new Error('The local server stopped before it was ready.')
    try {
      const response = await fetcher(new URL('/owner/sign-in', url), {
        redirect: 'error',
        signal: AbortSignal.any([signal, AbortSignal.timeout(2_000)]),
      })
      await response.body?.cancel()
      if (response.ok && !exited()) return
    } catch {
      signal.throwIfAborted()
    }
    await pause(250, undefined, { signal })
  }
  throw new Error('The local server did not become ready within one minute.')
}

function processStillAlive(managed) {
  if (managed.retired || !managed.child.pid) return false
  if (process.platform === 'win32') {
    return managed.child.exitCode === null && managed.child.signalCode === null
  }
  try {
    // A detached child's PID is our process-group ID, even after that child exits.
    process.kill(-managed.child.pid, 0)
    return true
  } catch (error) {
    if (error.code !== 'ESRCH') throw error
    // Once gone, never probe or signal this ID again: the OS may reuse it.
    managed.retired = true
    return false
  }
}

function signalChild(managed, signal) {
  if (!processStillAlive(managed)) return
  try {
    if (process.platform === 'win32') managed.child.kill(signal)
    else process.kill(-managed.child.pid, signal)
  } catch (error) {
    if (error.code !== 'ESRCH') throw error
    managed.retired = true
  }
}

export function stopChild(managed) {
  managed.cleanup ??= (async () => {
    try {
      signalChild(managed, 'SIGTERM')
      const termDeadline = Date.now() + 5_000
      let killDeadline
      while (processStillAlive(managed)) {
        if (killDeadline !== undefined && Date.now() >= killDeadline) {
          throw new Error('group still present 5 seconds after SIGKILL')
        }
        if (killDeadline === undefined && Date.now() >= termDeadline) {
          signalChild(managed, 'SIGKILL')
          killDeadline = Date.now() + 5_000
        }
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
      await managed.result
    } catch (error) {
      // A child we cannot stop must not keep the launcher alive after reporting failure.
      const { child } = managed
      child.unref()
      const leaderState =
        child.exitCode === null && child.signalCode === null
          ? 'leader has not exited'
          : `leader exitCode=${child.exitCode}, signal=${child.signalCode}`
      const detail = error.code ? `${error.code}: ${error.message}` : error.message
      throw new Error(
        `Could not stop local Reader Lab process group ${child.pid}: ${detail}; ${leaderState}.`,
        { cause: error },
      )
    }
  })()
  return managed.cleanup
}

export async function stopChildren(children) {
  const outcomes = await Promise.allSettled([...children].map(stopChild))
  const failure = outcomes.find((outcome) => outcome.status === 'rejected')
  if (failure) throw failure.reason
}

/** Own every process from build through seed; Ctrl+C also stops Next's worker children. */
export async function runLocalLab(environment = process.env) {
  const configuration = localLabConfiguration(environment)
  const abort = new AbortController()
  const stopped = new Promise((resolve) => {
    abort.signal.addEventListener('abort', () => resolve(), { once: true })
  })
  const children = new Set()
  const stop = () => {
    abort.abort()
    // Start escalation even if checked() is still waiting for an unresponsive leader.
    // The same cleanup promises are awaited (and errors surfaced) in finally.
    for (const managed of children) void stopChild(managed).catch(() => {})
  }
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)
  const launch = (args, env) => {
    abort.signal.throwIfAborted()
    const child = spawn(process.execPath, args, {
      cwd: webRoot,
      env,
      stdio: 'inherit',
      detached: process.platform !== 'win32',
    })
    const result = new Promise((resolve) => {
      child.once('error', (error) => resolve({ error }))
      child.once('exit', (code, signal) => resolve({ code, signal }))
    })
    const managed = { child, result, retired: false }
    children.add(managed)
    managed.finished = result.then(async (outcome) => {
      // Retire completed build/seed groups promptly, before their IDs can be reused.
      // Also clean up a crashed server's descendants while readiness/seed is pending.
      await stopChild(managed)
      children.delete(managed)
      return outcome
    })
    // Interrupt readiness or another child too; finally reports the cleanup failure.
    void managed.finished.catch((error) => abort.abort(error))
    return managed
  }
  const checked = async (managed, name) => {
    // Cancellation must reach finally even if a child never emits its exit event.
    const result = await Promise.race([managed.finished, stopped])
    abort.signal.throwIfAborted()
    if (result.error || result.code !== 0)
      throw new Error(`${name} failed. See the output above.`, { cause: result.error })
  }
  const next = path.join(webRoot, 'node_modules/next/dist/bin/next')
  try {
    await assertPortAvailable(configuration.runtime.PORT)
    const fingerprint = await sourceFingerprint()
    if (!(await canReuseBuild(fingerprint))) {
      console.log('Building your local Reader Lab…')
      await checked(launch([next, 'build'], configuration.build), 'Build')
      const buildId = await readFile(path.join(webRoot, '.next/BUILD_ID'), 'utf8')
      await writeFile(
        path.join(webRoot, '.next/lab-local.json'),
        JSON.stringify({ fingerprint, buildId }),
      )
    }
    await assertPortAvailable(configuration.runtime.PORT)
    const server = launch(
      [next, 'start', '--hostname', '127.0.0.1', '--port', configuration.runtime.PORT],
      configuration.runtime,
    )
    let exited = false
    void server.result.then(() => {
      exited = true
    })
    await waitForLocalServer(configuration.url, { signal: abort.signal, exited: () => exited })
    await checked(
      launch([path.join(webRoot, 'scripts/lab-seed.mjs')], configuration.runtime),
      'North House seed',
    )
    console.log(
      `\nOpen ${configuration.url.origin}/owner/sign-in\nChoose “Sign in as the local owner”.\nKeep this terminal open. Ctrl+C stops the lab; local stories and changes will be lost.\n`,
    )
    await checked(server, 'Local server')
  } catch (error) {
    if (!abort.signal.aborted) throw error
  } finally {
    try {
      await stopChildren(children)
    } finally {
      process.removeListener('SIGINT', stop)
      process.removeListener('SIGTERM', stop)
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  runLocalLab().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
