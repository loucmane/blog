import { EventEmitter } from 'node:events'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { generateTrialState, trial, trialMain } from '../../scripts/lab-trial.mjs'

const fakes = vi.hoisted(() => ({
  files: new Map(),
  spawn: vi.fn(),
  removed: [],
  mkdir: vi.fn(),
  ignored: true,
  containers: [],
  volumes: '',
  owner: false,
  failure: '',
  hold: '',
  busy: 0,
  endpoint: 'unix:///var/run/docker.sock',
  databaseConnect: vi.fn(),
  databaseQuery: vi.fn(),
  migrateOutput: () => ['Migration stdout', 'Migration stderr'],
}))
vi.mock('node:child_process', () => ({ spawn: fakes.spawn }))
vi.mock('node:fs/promises', () => {
  const missing = () => Object.assign(new Error('missing'), { code: 'ENOENT' })
  return {
    mkdir: fakes.mkdir,
    chmod: vi.fn(),
    lstat: async (file) => {
      if ((file.endsWith('state.json') || file.endsWith('launcher.lock')) && !fakes.files.has(file))
        throw missing()
      return { isDirectory: () => true, isFile: () => true, nlink: 1 }
    },
    readFile: async (file) => {
      if (file.endsWith('BUILD_ID')) return 'trial-build'
      if (!fakes.files.has(file)) throw missing()
      return fakes.files.get(file)
    },
    writeFile: async (file, value) => {
      fakes.files.set(file, value)
    },
    open: async (file, flag, mode) => {
      expect(flag).toBe('wx')
      expect(mode).toBe(0o600)
      if (fakes.files.has(file)) throw Object.assign(new Error('exists'), { code: 'EEXIST' })
      fakes.files.set(file, '')
      return {
        writeFile: async (value) => {
          fakes.files.set(file, value)
        },
        close: vi.fn(),
        sync: vi.fn(),
      }
    },
    unlink: async (file) => {
      fakes.files.delete(file)
    },
    rm: async (file) => {
      fakes.removed.push(file)
      fakes.files.delete(file)
    },
  }
})
vi.mock('node:net', () => ({
  default: {
    createServer: () => ({
      once(_event, listener) {
        this.listener = listener
      },
      listen(port, host, ready) {
        expect(host).toBe('127.0.0.1')
        if (port === fakes.busy)
          this.listener(Object.assign(new Error('busy'), { code: 'EADDRINUSE' }))
        else ready()
      },
      close(done) {
        done()
      },
    }),
  },
}))
vi.mock('../../scripts/lab-local.mjs', async (importOriginal) => ({
  ...(await importOriginal()),
  sourceFingerprint: async () => 'trial-source',
  canReuseBuild: async () => false,
  waitForLocalServer: vi.fn(),
}))
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    async send() {}
    destroy() {}
  },
  HeadBucketCommand: class {},
  CreateBucketCommand: class {},
}))
vi.mock('pg', () => ({
  Client: class {
    on() {}
    async connect() {
      await fakes.databaseConnect()
    }
    async end() {}
    async query(sql) {
      await fakes.databaseQuery(sql)
      return { rows: [{ ownerExists: fakes.owner, setupClosed: fakes.owner }] }
    }
  },
}))

const statePath = path.join(trial.stateDirectory, 'state.json')
const lockPath = path.join(trial.stateDirectory, 'launcher.lock')
let children
let handlers
let log
let error
function finish(child, code, signal = null) {
  child.exitCode = code
  child.signalCode = signal
  child.emit('close', code, signal)
}
function run(args = ['start']) {
  return trialMain({ args, environment: {}, log, error })
}
function stages() {
  return children.map((child) => child.stage)
}

beforeEach(() => {
  children = []
  handlers = new Map()
  log = vi.fn()
  error = vi.fn()
  fakes.files.clear()
  fakes.removed.length = 0
  Object.assign(fakes, {
    ignored: true,
    containers: [],
    volumes: '',
    owner: false,
    failure: '',
    hold: '',
    busy: 0,
    endpoint: 'unix:///var/run/docker.sock',
    migrateOutput: () => ['Migration stdout', 'Migration stderr'],
  })
  fakes.databaseConnect.mockResolvedValue()
  fakes.databaseQuery.mockResolvedValue()
  vi.spyOn(process, 'once').mockImplementation((name, handler) => {
    handlers.set(name, handler)
    return process
  })
  vi.spyOn(process, 'kill').mockImplementation((pid, signal) => {
    if (pid === process.pid && signal === 0) return true
    const child = children.find((entry) => entry.pid === -pid)
    if (!child || child.exitCode !== null || child.signalCode !== null)
      throw Object.assign(new Error('gone'), { code: 'ESRCH' })
    if (signal !== 0) queueMicrotask(() => finish(child, null, signal))
    return true
  })
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('ready')),
  )
  fakes.spawn.mockImplementation((command, args, options) => {
    const stage =
      command === 'git'
        ? 'ignore'
        : command === 'docker'
          ? args[0] === 'volume'
            ? 'volumes'
            : args[0] === 'context'
              ? 'context'
              : args[7]
          : args[0].endsWith('migrate.mjs')
            ? 'migrate'
            : args[0].endsWith('lab-seed.mjs')
              ? 'seed'
              : args[1]
    const child = Object.assign(new EventEmitter(), {
      pid: 20_000 + children.length,
      exitCode: null,
      signalCode: null,
      stdout:
        options.stdio[1] === 'pipe'
          ? Object.assign(new EventEmitter(), { setEncoding: vi.fn() })
          : null,
      stderr:
        options.stdio[2] === 'pipe'
          ? Object.assign(new EventEmitter(), { setEncoding: vi.fn() })
          : null,
      unref: vi.fn(),
      args,
      options,
      stage,
    })
    children.push(child)
    if (stage !== 'start' && stage !== fakes.hold)
      queueMicrotask(() => {
        if (stage === 'ps') child.stdout?.emit('data', JSON.stringify(fakes.containers))
        if (stage === 'volumes') child.stdout?.emit('data', fakes.volumes)
        if (stage === 'context') child.stdout?.emit('data', fakes.endpoint)
        if (stage === 'migrate') {
          expect(fakes.databaseQuery).toHaveBeenCalledWith('SELECT 1')
          const [stdout, stderr] = fakes.migrateOutput(options.env)
          // Split across data events to ensure redaction runs after stream capture.
          for (const chunk of stdout.match(/.{1,7}|\n/g) ?? []) child.stdout?.emit('data', chunk)
          child.stderr?.emit('data', stderr)
        }
        finish(child, stage === fakes.failure || (stage === 'ignore' && !fakes.ignored) ? 1 : 0)
      })
    return child
  })
})
afterEach(() => vi.unstubAllGlobals())

describe('persistent trial orchestration without Docker', () => {
  it('prepares real services in order, prints only URLs and reuses credentials on the next start', async () => {
    const running = run()
    await vi.waitFor(() => expect(log).toHaveBeenCalledTimes(3))
    expect(stages()).toEqual([
      'ignore',
      'context',
      'ps',
      'volumes',
      'up',
      'migrate',
      'build',
      'start',
      'seed',
    ])
    const saved = fakes.files.get(statePath)
    const state = JSON.parse(saved)
    const server = children.find((child) => child.stage === 'start')
    expect(server.options.env.MAGAZINE_OWNER_TEST_MODE).toBe('')
    expect(server.options.env.NODE_ENV).toBe('test')
    expect(children.find((child) => child.stage === 'build').options.env.NODE_ENV).toBe(
      'production',
    )
    expect(server.options.env.DATABASE_URL).toContain('@127.0.0.1:55444/')
    expect(server.args.slice(2)).toEqual(['--hostname', '127.0.0.1', '--port', '3200'])
    for (const child of children) {
      expect(child.options.stdio[2]).toBe(child.stage === 'migrate' ? 'pipe' : 'ignore')
      expect(child.options.stdio[1]).not.toBe('inherit')
    }
    expect(log.mock.calls.flat()).toEqual([
      trial.url,
      `${trial.url}/owner/sign-in`,
      `${trial.url}/owner/setup#${state.secrets.MAGAZINE_OWNER_SETUP_TOKEN}`,
    ])
    handlers.get('SIGINT')()
    expect(await running).toBe(0)
    expect(server.signalCode).toBe('SIGTERM')
    expect(stages()).not.toContain('down')
    expect(fakes.files.get(statePath)).toBe(saved)
    expect(fakes.files.has(lockPath)).toBe(false)
    expect(error).not.toHaveBeenCalled()

    log.mockClear()
    fakes.owner = true
    const resumed = run()
    await vi.waitFor(() => expect(log).toHaveBeenCalledTimes(2))
    expect(log.mock.calls.flat()).toEqual([trial.url, `${trial.url}/owner/sign-in`])
    expect(fakes.files.get(statePath)).toBe(saved)
    handlers.get('SIGINT')()
    expect(await resumed).toBe(0)
  })

  it('shows redacted migration stdout and stderr on failure, preserving credentials and stopping startup', async () => {
    const state = generateTrialState()
    const saved = JSON.stringify(state)
    fakes.files.set(statePath, saved)
    fakes.failure = 'migrate'
    fakes.migrateOutput = (env) => [
      `Target: ${env.DATABASE_URL}\nPending migrations: 0001\n${Object.values(state.secrets).join('\n')}`,
      `Migration apply failed. ${encodeURIComponent(env.DATABASE_URL)} ${Object.values(state.secrets).join('\n')}`,
    ]
    expect(await run()).toBe(1)
    const message = error.mock.calls[0][0]
    expect(message).toMatch(/^Trial database preparation failed[^\n]+\nTarget: \[redacted\]/)
    expect(message).toContain('Pending migrations: 0001')
    expect(message).toContain('Migration apply failed. [redacted]')
    for (const secret of Object.values(state.secrets)) expect(message).not.toContain(secret)
    expect(message).not.toContain('postgresql://')
    expect(message).not.toContain('postgresql%3A')
    expect(log).not.toHaveBeenCalled()
    expect(stages()).not.toContain('build')
    expect(stages()).not.toContain('start')
    expect(fakes.files.get(statePath)).toBe(saved)
    expect(fakes.files.has(lockPath)).toBe(false)
  })

  it('omits oversized diagnostics entirely so truncated credentials cannot leak', async () => {
    const state = generateTrialState()
    fakes.files.set(statePath, JSON.stringify(state))
    fakes.failure = 'migrate'
    const secret = state.secrets.BETTER_AUTH_SECRET
    fakes.migrateOutput = () => ['', `${'x'.repeat(999_980)}${secret}`]
    expect(await run()).toBe(1)
    expect(error).toHaveBeenCalledWith(expect.stringContaining('capture limit exceeded'))
    expect(error.mock.calls[0][0]).not.toContain(secret.slice(0, 20))
  })

  it('does not migrate when authenticated readiness fails', async () => {
    fakes.databaseConnect.mockRejectedValue(
      Object.assign(new Error('private detail'), { code: '28P01' }),
    )
    expect(await run()).toBe(1)
    expect(stages()).not.toContain('migrate')
    expect(stages()).not.toContain('build')
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('Could not connect to the trial database'),
    )
    expect(fakes.files.has(statePath)).toBe(true)
    expect(fakes.files.has(lockPath)).toBe(false)
  })

  it('refuses unignored secret storage before creating state', async () => {
    fakes.ignored = false
    expect(await run()).toBe(1)
    expect(stages()).toEqual(['ignore'])
    expect(fakes.mkdir).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledWith(expect.stringContaining('not ignored by Git'))
  })

  it('refuses busy ports before creating credentials or starting containers', async () => {
    fakes.busy = 55444
    expect(await run()).toBe(1)
    expect(stages()).toEqual(['ignore', 'context', 'ps'])
    expect(fakes.files.has(statePath)).toBe(false)
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Port 55444 is in use'))
  })

  it('never generates new credentials over orphaned trial volumes', async () => {
    fakes.volumes = 'blog-reader-lab-trial_trial-postgres'
    expect(await run()).toBe(1)
    expect(fakes.files.has(statePath)).toBe(false)
    expect(stages()).not.toContain('up')
    expect(error).toHaveBeenCalledWith(expect.stringContaining('saved credentials are missing'))
  })

  it('stops the server and preserves credentials after failed seeding without printing an invitation', async () => {
    fakes.failure = 'seed'
    expect(await run()).toBe(1)
    expect(children.find((child) => child.stage === 'start').signalCode).toBe('SIGTERM')
    expect(log).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledWith(expect.stringContaining('North House seeding failed'))
    expect(fakes.files.has(statePath)).toBe(true)
    expect(fakes.removed).toEqual([])
    expect(stages()).not.toContain('down')
  })

  it('cancels a build without advancing to server or seed, and leaves its data intact', async () => {
    fakes.hold = 'build'
    const running = run()
    await vi.waitFor(() => expect(stages()).toContain('build'))
    handlers.get('SIGTERM')()
    expect(await running).toBe(0)
    expect(children.find((child) => child.stage === 'build').signalCode).toBe('SIGTERM')
    expect(stages()).not.toContain('start')
    expect(stages()).not.toContain('seed')
    expect(fakes.files.has(statePath)).toBe(true)
    expect(fakes.files.has(lockPath)).toBe(false)
  })

  it('stops containers without deleting data, even when state is damaged', async () => {
    fakes.files.set(statePath, '{damaged')
    expect(await run(['stop'])).toBe(0)
    expect(stages()).toEqual(['ignore', 'context', 'ps', 'stop'])
    expect(fakes.files.get(statePath)).toBe('{damaged')
    expect(fakes.removed).toEqual([])
  })

  it('deletes only confirmed trial resources, including recovery from damaged state', async () => {
    fakes.files.set(statePath, '{damaged')
    expect(await run(['reset'])).toBe(1)
    expect(children).toHaveLength(0)
    expect(fakes.removed).toEqual([])
    expect(await run(['reset', '--yes-delete-trial-data'])).toBe(0)
    expect(stages()).toEqual(['ignore', 'context', 'ps', 'down'])
    const down = children.find((child) => child.stage === 'down')
    expect(down.args).toContain(trial.project)
    expect(down.args.slice(-2)).toEqual(['down', '--volumes'])
    expect(fakes.removed).toEqual([statePath])
    expect(fakes.files.has(statePath)).toBe(false)
    expect(fakes.files.has(lockPath)).toBe(false)
  })

  it('keeps credentials if Docker reset fails, so deletion can be retried', async () => {
    const saved = JSON.stringify(generateTrialState())
    fakes.files.set(statePath, saved)
    fakes.failure = 'down'
    expect(await run(['reset', '--yes-delete-trial-data'])).toBe(1)
    expect(fakes.files.get(statePath)).toBe(saved)
    expect(fakes.removed).toEqual([])
  })

  it('reports containers, server and owner without secrets or an invitation', async () => {
    const state = generateTrialState()
    fakes.files.set(statePath, JSON.stringify(state))
    fakes.files.set(lockPath, String(process.pid))
    fakes.owner = true
    fakes.containers = ['postgres', 'storage'].map((Service) => ({
      Project: trial.project,
      Service,
      State: 'running',
    }))
    expect(await run(['status'])).toBe(0)
    expect(log.mock.calls.flat()).toEqual([
      'Database: up',
      'Storage: up',
      'Server: up',
      'Owner: exists',
    ])
    expect(stages()).toEqual(['ignore', 'context', 'ps'])
    for (const secret of Object.values(state.secrets))
      expect(JSON.stringify(log.mock.calls)).not.toContain(secret)
    expect(fakes.files.has(lockPath)).toBe(true)
  })

  it('refuses to reset resources on a remote Docker context', async () => {
    fakes.endpoint = 'ssh://remote.invalid'
    expect(await run(['reset', '--yes-delete-trial-data'])).toBe(1)
    expect(stages()).toEqual(['ignore', 'context'])
    expect(fakes.removed).toEqual([])
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Docker on this computer'))
  })
})
