import { chmod, lstat, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'
import { parse } from 'yaml'

import { canReuseBuild } from '../../scripts/lab-local.mjs'
import {
  acquireTrialLock,
  assertLocalDockerEndpoint,
  assertTrialEnvironment,
  assertTrialPortAvailable,
  checkTrialPorts,
  createTrialState,
  ensureTrialBucket,
  generateTrialState,
  parseTrialArguments,
  parseTrialContainers,
  prepareStateDirectory,
  readTrialState,
  trial,
  trialComposeArguments,
  trialEnvironment,
  trialMain,
  trialOwnerState,
  trialReadyLines,
  waitForTrialDatabase,
} from '../../scripts/lab-trial.mjs'
import { labSeedAllowed } from '../../src/server/lab/environment.mjs'

const temporary = []
async function stateDirectory() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'reader-lab-trial-'))
  temporary.push(root)
  const directory = path.join(root, 'ci-artifacts/lab-trial')
  await prepareStateDirectory(directory)
  return directory
}
afterEach(async () => {
  await Promise.all(temporary.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('authenticated database readiness', () => {
  function probe({ timeoutMs = 60_000, connectError, queryError } = {}) {
    const clients = []
    let elapsed = 0
    const sleep = vi.fn(async (milliseconds) => {
      elapsed += milliseconds
    })
    const createClient = vi.fn(() => {
      const client = {
        on: vi.fn(),
        connect: vi.fn().mockResolvedValue(),
        query: vi.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
        end: vi.fn().mockResolvedValue(),
      }
      if (clients.length === 0) {
        if (connectError) client.connect.mockRejectedValue(connectError)
        if (queryError) client.query.mockRejectedValue(queryError)
      }
      clients.push(client)
      return client
    })
    const env = trialEnvironment(generateTrialState(), {})
    const controller = new AbortController()
    const options = { createClient, timeoutMs, now: () => elapsed, sleep }
    return {
      clients,
      controller,
      env,
      options,
      run: () => waitForTrialDatabase(env, controller.signal, options),
    }
  }

  it.each([
    Object.assign(new Error('refused'), { code: 'ECONNREFUSED' }),
    Object.assign(new Error('reset'), { code: 'ECONNRESET' }),
    Object.assign(new Error('restarting'), { code: '57P03' }),
    Object.assign(new Error('terminating connection due to administrator command'), {
      code: '57P01',
    }),
    new Error('Connection terminated unexpectedly'),
    new Error('Connection terminated'),
    new Error('Connection terminated due to connection timeout'),
    new Error('the database system is starting up'),
    new Error('the database system is shutting down'),
  ])('retries transient connection errors before SELECT 1: %s', async (connectError) => {
    const test = probe({ connectError })
    await test.run()
    expect(test.clients).toHaveLength(2)
    expect(test.options.sleep.mock.calls.map(([milliseconds]) => milliseconds)).toEqual([250])
    expect(test.clients[0].query).not.toHaveBeenCalled()
    expect(test.clients[1].query).toHaveBeenCalledWith('SELECT 1')
    expect(test.options.createClient).toHaveBeenCalledWith({
      connectionString: test.env.DATABASE_URL,
      connectionTimeoutMillis: 3_000,
      query_timeout: 3_000,
      statement_timeout: 3_000,
    })
    for (const client of test.clients) expect(client.end).toHaveBeenCalledOnce()
  })

  it('reconnects if PostgreSQL restarts after connect but before SELECT 1 completes', async () => {
    const test = probe({ queryError: new Error('Connection terminated unexpectedly') })
    await test.run()
    expect(test.clients).toHaveLength(2)
    for (const client of test.clients) {
      expect(client.query).toHaveBeenCalledWith('SELECT 1')
      expect(client.end).toHaveBeenCalledOnce()
    }
  })

  it.each(['28P01', '3D000', '42501', undefined])(
    'fails immediately for fatal errors (%s) without echoing credentials',
    async (code) => {
      const test = probe()
      test.options.createClient.mockImplementationOnce(() => ({
        on: vi.fn(),
        connect: vi
          .fn()
          .mockRejectedValue(Object.assign(new Error(test.env.DATABASE_URL), { code })),
        end: vi.fn().mockResolvedValue(),
      }))
      const error = await test.run().catch((cause) => cause)
      expect(error.message).toContain('Could not connect to the trial database')
      expect(error.message).not.toContain(test.env.DATABASE_URL)
      expect(test.options.createClient).toHaveBeenCalledOnce()
      expect(test.options.sleep).not.toHaveBeenCalled()
    },
  )

  it('bounds exponential backoff by the 60-second deadline and closes every failed connection', async () => {
    const test = probe()
    const createClient = test.options.createClient.getMockImplementation()
    test.options.createClient.mockImplementation(() => {
      const client = createClient()
      client.connect.mockRejectedValue(
        Object.assign(new Error('refused'), { code: 'ECONNREFUSED' }),
      )
      return client
    })
    await expect(test.run()).rejects.toThrow('did not become ready in time')
    const waits = test.options.sleep.mock.calls.map(([milliseconds]) => milliseconds)
    expect(waits.slice(0, 4)).toEqual([250, 500, 1_000, 2_000])
    expect(Math.max(...waits)).toBe(2_000)
    expect(waits.reduce((sum, milliseconds) => sum + milliseconds, 0)).toBe(60_000)
    expect(test.options.createClient.mock.calls.at(-1)[0].connectionTimeoutMillis).toBe(250)
    for (const client of test.clients) expect(client.end).toHaveBeenCalledOnce()
  })

  it.each(['connect', 'query'])('bounds a hung %s by the remaining deadline', async (stage) => {
    const test = probe({ timeoutMs: 20 })
    test.options.now = () => performance.now()
    const createClient = test.options.createClient.getMockImplementation()
    test.options.createClient.mockImplementation(() => {
      const client = createClient()
      client[stage].mockImplementation(() => new Promise(() => {}))
      return client
    })
    await expect(test.run()).rejects.toThrow('did not become ready in time')
    for (const client of test.clients) expect(client.end).toHaveBeenCalledOnce()
  })

  it('cancels an in-flight connection promptly without retrying', async () => {
    const test = probe()
    const client = {
      on: vi.fn(),
      connect: vi.fn(() => new Promise(() => {})),
      end: vi.fn().mockResolvedValue(),
    }
    test.options.createClient.mockReturnValue(client)
    const running = test.run()
    test.controller.abort()
    await expect(running).rejects.toMatchObject({ name: 'AbortError' })
    expect(client.end).toHaveBeenCalledOnce()
    expect(test.options.sleep).not.toHaveBeenCalled()
    expect(test.options.createClient).toHaveBeenCalledOnce()
  })
})

describe('persistent trial command boundaries', () => {
  it('allows local Docker sockets or loopback endpoints and rejects remote contexts', () => {
    for (const endpoint of [
      'unix:///var/run/docker.sock',
      'npipe:////./pipe/docker_engine',
      'tcp://127.0.0.1:2375',
      'tcp://localhost:2375',
    ]) {
      expect(() => assertLocalDockerEndpoint(endpoint)).not.toThrow()
    }
    for (const endpoint of [
      '',
      'ssh://remote.invalid',
      'tcp://remote.invalid:2375',
      'tcp://user:unused@localhost:2375',
      'tcp://localhost.invalid:2375',
    ]) {
      expect(() => assertLocalDockerEndpoint(endpoint)).toThrow('Docker on this computer')
    }
  })
  it.each(['start', 'stop', 'status'])('accepts %s without deletion authority', (command) => {
    expect(parseTrialArguments([command])).toBe(command)
  })

  it('requires the exact typed reset confirmation and rejects unexpected flags', () => {
    expect(parseTrialArguments(['reset', '--yes-delete-trial-data'])).toBe('reset')
    for (const args of [
      [],
      ['reset'],
      ['reset', '--yes'],
      ['start', '--yes-delete-trial-data'],
      ['reset', '--yes-delete-trial-data', '--volumes'],
      ['stop', '--help'],
      ['unknown'],
    ]) {
      expect(() => parseTrialArguments(args)).toThrow()
    }
  })

  it.each([
    { NODE_ENV: 'production' },
    { VERCEL: '1' },
    { VERCEL_ENV: 'preview' },
    { VERCEL_TARGET_ENV: 'production' },
    { MAGAZINE_DEPLOYMENT_ENVIRONMENT: 'production' },
  ])('refuses hosted or production invocation before any side effect', async (environment) => {
    expect(() => assertTrialEnvironment(environment)).toThrow()
    const log = vi.fn()
    const error = vi.fn()
    expect(await trialMain({ args: ['start'], environment, log, error })).toBe(1)
    expect(log).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledOnce()
  })

  it('does not echo rejected command arguments', async () => {
    const state = generateTrialState()
    const error = vi.fn()
    expect(await trialMain({ args: ['reset', state.secrets.BETTER_AUTH_SECRET], error })).toBe(1)
    expect(error).toHaveBeenCalledWith(expect.stringContaining('--yes-delete-trial-data'))
    expect(JSON.stringify(error.mock.calls)).not.toContain(state.secrets.BETTER_AUTH_SECRET)
  })

  it('distinguishes port conflicts from network permission errors without echoing raw errors', async () => {
    for (const [code, message] of [
      ['EADDRINUSE', 'Port 3200 is in use'],
      ['EPERM', 'network permissions'],
    ]) {
      const createServer = () => ({
        once(_event, listener) {
          this.listener = listener
        },
        listen(port, host) {
          expect([port, host]).toEqual([3200, '127.0.0.1'])
          this.listener(Object.assign(new Error('private driver detail'), { code }))
        },
      })
      await expect(assertTrialPortAvailable(3200, createServer)).rejects.toThrow(message)
    }
  })
})

describe('private persistent state', () => {
  it('generates independent strong secrets, saves once with mode 0600 and reuses exact bytes silently', async () => {
    const directory = await stateDirectory()
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const state = await createTrialState(directory)
    const next = generateTrialState()
    expect(new Set(Object.values(state.secrets)).size).toBe(Object.keys(state.secrets).length)
    for (const [name, value] of Object.entries(state.secrets)) {
      expect(Buffer.byteLength(value)).toBeGreaterThanOrEqual(32)
      expect(value).toMatch(/^[\w-]+$/)
      expect(next.secrets[name]).not.toBe(value)
    }
    const file = path.join(directory, 'state.json')
    const bytes = await readFile(file, 'utf8')
    expect((await lstat(file)).mode & 0o777).toBe(0o600)
    expect((await lstat(directory)).mode & 0o777).toBe(0o700)
    expect(await readTrialState(directory)).toEqual(state)
    await expect(createTrialState(directory)).rejects.toMatchObject({ code: 'EEXIST' })
    expect(await readFile(file, 'utf8')).toBe(bytes)
    expect(log).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    await chmod(file, 0o644)
    await readTrialState(directory)
    expect((await lstat(file)).mode & 0o777).toBe(0o600)
  })

  it('refuses corrupt state without printing its contents or silently rotating credentials', async () => {
    const directory = await stateDirectory()
    expect(await readTrialState(directory)).toBeNull()
    const file = path.join(directory, 'state.json')
    const damaged = JSON.stringify({ version: 1, secrets: generateTrialState().secrets }).slice(
      0,
      -10,
    )
    await writeFile(file, damaged)
    await expect(readTrialState(directory)).rejects.toThrow(
      'Could not read the private trial state',
    )
    expect(await readFile(file, 'utf8')).toBe(damaged)
    await writeFile(file, JSON.stringify({ version: 1, secrets: {} }))
    await expect(readTrialState(directory)).rejects.toThrow('damaged')
  })

  it('refuses symbolic state files and directories', async () => {
    const directory = await stateDirectory()
    const other = await stateDirectory()
    await createTrialState(other)
    await symlink(path.join(other, 'state.json'), path.join(directory, 'state.json'))
    await expect(readTrialState(directory)).rejects.toThrow('regular file')
    await rm(directory, { recursive: true })
    await symlink(other, directory)
    await expect(prepareStateDirectory(directory)).rejects.toThrow('real directory')
  })

  it('serializes mutations and recovers a stale lock without signalling another process', async () => {
    const directory = await stateDirectory()
    const release = await acquireTrialLock(directory)
    await expect(acquireTrialLock(directory)).rejects.toThrow('already active')
    await release()
    await writeFile(path.join(directory, 'launcher.lock'), '2147483647')
    const kill = vi.spyOn(process, 'kill').mockImplementation((_pid, signal) => {
      expect(signal).toBe(0)
      throw Object.assign(new Error('gone'), { code: 'ESRCH' })
    })
    const recovered = await acquireTrialLock(directory)
    expect(await readFile(path.join(directory, 'launcher.lock'), 'utf8')).toBe(String(process.pid))
    expect(kill).toHaveBeenCalledOnce()
    await recovered()
  })
})

describe('real local services and output', () => {
  it('overrides inherited remote credentials and fixture flags, with real auth and local seed allowance', () => {
    const state = generateTrialState()
    const env = trialEnvironment(state, {
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://unused.invalid/unused',
      MAGAZINE_OWNER_TEST_MODE: '1',
      MAGAZINE_OWNER_TEST_TOKEN: 'unused',
      MAGAZINE_CONTENT_BACKEND: 'framework-fixture',
      COMPOSE_PROJECT_NAME: 'content',
      MAGAZINE_MEDIA_ENDPOINT: 'https://unused.invalid',
      MAGAZINE_OWNER_RECOVERY_WEBHOOK_URL: 'https://unused.invalid',
      PGHOST: 'unused.invalid',
      PATH: '/usr/bin',
    })
    expect(env).toMatchObject({
      NODE_ENV: 'test',
      HOSTNAME: '127.0.0.1',
      PORT: '3200',
      MAGAZINE_OWNER_TEST_MODE: '',
      MAGAZINE_OWNER_TEST_TOKEN: '',
      MAGAZINE_CONTENT_BACKEND: 'postgres',
      MAGAZINE_OWNER_RECOVERY_WEBHOOK_URL: '',
      MAGAZINE_MEDIA_ENDPOINT: 'http://127.0.0.1:57044',
      BETTER_AUTH_URL: trial.url,
      MAGAZINE_MEDIA_SECRET_ACCESS_KEY: state.secrets.LAB_TRIAL_S3_SECRET_KEY,
    })
    expect(new URL(env.DATABASE_URL).host).toBe('127.0.0.1:55444')
    expect(env.COMPOSE_PROJECT_NAME).toBeUndefined()
    expect(env.PGHOST).toBeUndefined()
    expect(labSeedAllowed(env)).toBe(true)
  })

  it('prints only the two public URLs after setup, or the fragment invitation before setup', () => {
    const state = generateTrialState()
    const before = trialReadyLines(state, { ownerExists: false, setupClosed: false })
    expect(before).toHaveLength(3)
    const setup = new URL(before[2])
    expect(setup.pathname).toBe('/owner/setup')
    expect(setup.search).toBe('')
    expect(decodeURIComponent(setup.hash.slice(1))).toBe(state.secrets.MAGAZINE_OWNER_SETUP_TOKEN)
    for (const owner of [
      { ownerExists: true, setupClosed: true },
      { ownerExists: false, setupClosed: true },
    ]) {
      const after = trialReadyLines(state, owner)
      expect(after).toEqual([trial.url, `${trial.url}/owner/sign-in`])
      for (const value of Object.values(state.secrets))
        expect(after.join('\n')).not.toContain(value)
    }
    for (const [name, value] of Object.entries(state.secrets)) {
      if (name !== 'MAGAZINE_OWNER_SETUP_TOKEN') expect(before.join('\n')).not.toContain(value)
    }
  })

  it('isolates every Compose command, host port and volume from integration tests', async () => {
    const config = parse(
      await readFile(new URL('../../scripts/lab-trial.compose.yml', import.meta.url), 'utf8'),
    )
    const test = parse(
      await readFile(new URL('../content/docker-compose.yml', import.meta.url), 'utf8'),
    )
    expect(config.name).toBe(trial.project)
    for (const args of [
      ['ps', '--all', '--format', 'json'],
      ['up', '--detach'],
      ['stop'],
      ['down', '--volumes'],
    ]) {
      const command = trialComposeArguments(args)
      expect(command.slice(0, 3)).toEqual(['compose', '--project-name', trial.project])
      expect(command[4]).toMatch(/scripts\/lab-trial.compose.yml$/)
      expect(command).not.toContain('--remove-orphans')
      expect(command.slice(-args.length)).toEqual(args)
    }
    const testPorts = Object.values(test.services).flatMap((service) => service.ports)
    expect(Object.values(config.services).flatMap((service) => service.ports)).toEqual([
      '127.0.0.1:55444:5432',
      '127.0.0.1:57044:7070',
    ])
    for (const service of Object.values(config.services)) {
      for (const binding of service.ports) expect(testPorts).not.toContain(binding)
      for (const volume of service.volumes)
        expect(test.volumes).not.toHaveProperty(volume.split(':')[0])
    }
    for (const volume of Object.values(config.volumes)) expect(volume?.external).not.toBe(true)
  })

  it('checks all fresh ports but allows already-running containers belonging to this trial', async () => {
    const probe = vi.fn()
    await checkTrialPorts([], probe)
    expect(probe.mock.calls.flat()).toEqual([3200, 55444, 57044])
    probe.mockClear()
    const own = {
      Project: trial.project,
      Service: 'postgres',
      State: 'running',
      Publishers: [{ URL: '127.0.0.1', PublishedPort: 55444 }],
    }
    expect(parseTrialContainers(JSON.stringify([own]))).toEqual([own])
    expect(parseTrialContainers(`${JSON.stringify(own)}\n`)).toEqual([own])
    await checkTrialPorts([own], probe)
    expect(probe.mock.calls.flat()).toEqual([3200, 57044])
    expect(() => parseTrialContainers(JSON.stringify([{ ...own, Project: 'content' }]))).toThrow()
    expect(() => parseTrialContainers('unexpected private output')).toThrow(
      'unrecognized trial status',
    )
    const busy = vi.fn().mockRejectedValue(new Error('busy'))
    await expect(checkTrialPorts([], busy)).rejects.toThrow('busy')
    expect(busy).toHaveBeenCalledOnce()
  })

  it('keeps trial and in-memory build stamps separate, and rejects replaced builds', async () => {
    const directory = await stateDirectory()
    await prepareStateDirectory(path.join(directory, '.next'))
    await writeFile(path.join(directory, '.next/BUILD_ID'), 'trial-build')
    await writeFile(
      path.join(directory, '.next/lab-trial.json'),
      JSON.stringify({ fingerprint: 'source', buildId: 'trial-build' }),
    )
    expect(await canReuseBuild('source', directory, 'lab-trial.json')).toBe(true)
    expect(await canReuseBuild('source', directory)).toBe(false)
    expect(await canReuseBuild('changed', directory, 'lab-trial.json')).toBe(false)
    await writeFile(path.join(directory, '.next/BUILD_ID'), 'another-build')
    expect(await canReuseBuild('source', directory, 'lab-trial.json')).toBe(false)
  })

  it('creates a missing bucket, reuses an existing one and refuses other failures without secret output', async () => {
    const env = trialEnvironment(generateTrialState(), {})
    const signal = new AbortController().signal
    for (const status of [200, 404, 403]) {
      const send = vi.fn()
      if (status === 200) send.mockResolvedValue({})
      else
        send
          .mockRejectedValueOnce(
            Object.assign(new Error(env.MAGAZINE_MEDIA_SECRET_ACCESS_KEY), {
              $metadata: { httpStatusCode: status },
            }),
          )
          .mockResolvedValue({})
      const destroy = vi.fn()
      const createClient = vi.fn(() => ({ send, destroy }))
      const result = ensureTrialBucket(env, signal, createClient)
      if (status === 403)
        await expect(result).rejects.toThrow('Could not prepare the trial media bucket')
      else await result
      expect(send).toHaveBeenCalledTimes(status === 404 ? 2 : 1)
      expect(destroy).toHaveBeenCalledOnce()
      expect(createClient.mock.calls[0][0].endpoint).toBe('http://127.0.0.1:57044')
    }
  })

  it('checks real owner state including the permanent setup latch and hides database failures', async () => {
    const env = trialEnvironment(generateTrialState(), {})
    const client = {
      on: vi.fn(),
      connect: vi.fn(),
      query: vi.fn().mockResolvedValue({ rows: [{ ownerExists: false, setupClosed: true }] }),
      end: vi.fn().mockResolvedValue(),
    }
    expect(await trialOwnerState(env, () => client)).toEqual({
      ownerExists: false,
      setupClosed: true,
    })
    expect(client.query.mock.calls[0][0]).toContain('owner_users')
    expect(client.query.mock.calls[0][0]).toContain('owner_accounts')
    expect(client.query.mock.calls[0][0]).toContain('idempotency_records')
    client.connect.mockRejectedValue(new Error(env.DATABASE_URL))
    await expect(trialOwnerState(env, () => client)).rejects.toThrow(
      'Could not check the trial owner',
    )
    expect(client.end).toHaveBeenCalledTimes(2)
  })
})
