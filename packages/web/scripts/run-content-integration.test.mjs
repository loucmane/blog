import { EventEmitter } from 'node:events'
import { writeSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { parse } from 'yaml'

const mocks = vi.hoisted(() => ({
  spawnSync: vi.fn(() => ({ status: 0 })),
  createServer: vi.fn(),
  fetch: vi.fn(async () => ({ ok: true })),
}))
vi.mock('node:child_process', () => ({ spawnSync: mocks.spawnSync }))
vi.mock('node:net', () => ({ createServer: mocks.createServer }))

let runner
let importCalls
let bindings
let probes
let scratch
let servicesLog
let errors

beforeAll(async () => {
  vi.stubGlobal('fetch', mocks.fetch)
  runner = await import('./run-content-integration.mjs')
  importCalls = mocks.spawnSync.mock.calls.length
  const compose = parse(
    await readFile(new URL('../tests/content/docker-compose.yml', import.meta.url), 'utf8'),
  )
  bindings = Object.entries(compose.services).map(([service, config]) => {
    const [host, port] = config.ports[0].split(':')
    return { service, host, port: Number(port) }
  })
  // Failing runs save their service logs here, never in the repository's ci-artifacts/.
  scratch = await mkdtemp(path.join(os.tmpdir(), 'content-integration-'))
})
afterAll(async () => {
  vi.unstubAllGlobals()
  await rm(scratch, { recursive: true, force: true })
})

function probe(error) {
  const server = new EventEmitter()
  server.listen = vi.fn((_options, listening) => {
    queueMicrotask(() => (error ? server.emit('error', error) : listening()))
    return server
  })
  server.close = vi.fn((closed) => {
    queueMicrotask(() => closed())
    return server
  })
  probes.push(server)
  return server
}

beforeEach(async () => {
  probes = []
  // The ci-artifacts/ folder is missing until the runner creates it.
  servicesLog = path.join(
    await mkdtemp(path.join(scratch, 'run-')),
    'ci-artifacts/content-integration-services.log',
  )
  errors = vi.spyOn(console, 'error').mockImplementation(() => {})
  mocks.spawnSync.mockReset().mockReturnValue({ status: 0 })
  mocks.fetch.mockReset().mockResolvedValue({ ok: true })
  mocks.createServer.mockReset().mockImplementation(() => probe())
})

describe('content integration entrypoint', () => {
  const moduleUrl = new URL('./run-content-integration.mjs', import.meta.url).href
  const modulePath = fileURLToPath(moduleUrl)

  it.each([
    ['absolute', modulePath],
    ['relative', path.relative(process.cwd(), modulePath)],
  ])('recognizes its own %s path', (_kind, argv1) => {
    expect(runner.isEntrypoint(argv1, moduleUrl)).toBe(true)
  })

  it('recognizes its own path through a symlink', async () => {
    const fixtureRoot = new URL('../../../ci-artifacts/', import.meta.url)
    await mkdir(fixtureRoot, { recursive: true })
    const directory = await mkdtemp(new URL('content-entrypoint-', fixtureRoot))
    try {
      const link = path.join(directory, 'runner link.mjs')
      await symlink(modulePath, link)
      expect(runner.isEntrypoint(link, moduleUrl)).toBe(true)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('rejects another module path', () => {
    expect(runner.isEntrypoint(fileURLToPath(import.meta.url), moduleUrl)).toBe(false)
  })

  it('accepts a missing script argument without starting the suite', () => {
    expect(runner.isEntrypoint(undefined, moduleUrl)).toBe(false)
  })

  it('can be imported without starting Docker or the integration suite', () => {
    expect(importCalls).toBe(0)
  })

  it('starts the suite when invoked as the main script', async () => {
    const argv = process.argv
    try {
      process.argv = [process.execPath, modulePath]
      vi.resetModules()
      await import('./run-content-integration.mjs')
      expect(mocks.spawnSync.mock.calls.map(([command, args]) => [command, args[3]])).toEqual([
        ['docker', 'down'],
        ['docker', 'up'],
        ['pnpm', 'packages/web/src/server/database/postgres.integration.test.ts'],
        ['docker', 'down'],
      ])
    } finally {
      process.argv = argv
    }
  })
})

describe('content integration ports', () => {
  it('uses distinct loopback ports below the ephemeral range without trial clashes', async () => {
    const trial = parse(await readFile(new URL('./lab-trial.compose.yml', import.meta.url), 'utf8'))
    const trialPorts = Object.values(trial.services).flatMap((service) =>
      service.ports.map((binding) => Number(binding.split(':')[1])),
    )
    expect(new Set(bindings.map(({ port }) => port)).size).toBe(3)
    for (const { host, port } of bindings) {
      expect(host).toBe('127.0.0.1')
      expect(port).toBeGreaterThan(1023)
      expect(port).toBeLessThan(32768)
      expect(trialPorts).not.toContain(port)
    }
  })

  it('checks every Compose binding and releases every successful probe', async () => {
    await runner.assertContentPortsAvailable()
    expect(probes).toHaveLength(bindings.length)
    for (const [index, { host, port }] of bindings.entries()) {
      expect(probes[index].listen).toHaveBeenCalledWith(
        { host, port, exclusive: true },
        expect.any(Function),
      )
      expect(probes[index].close).toHaveBeenCalledOnce()
    }
  })

  it('waits for a probe to release its port before continuing', async () => {
    const first = probe()
    first.close.mockImplementation(() => first)
    mocks.createServer.mockReturnValueOnce(first)
    let finished = false
    const checking = runner.assertContentPortsAvailable().then(() => {
      finished = true
    })
    await Promise.resolve()
    expect(first.close).toHaveBeenCalledOnce()
    expect(finished).toBe(false)
    expect(mocks.createServer).toHaveBeenCalledOnce()
    first.close.mock.calls[0][0]()
    await checking
    expect(finished).toBe(true)
  })

  it.each([0, 1, 2])('fails before startup when service %i has a busy port', async (index) => {
    let count = 0
    mocks.createServer.mockImplementation(() =>
      probe(
        count++ === index ? Object.assign(new Error('busy'), { code: 'EADDRINUSE' }) : undefined,
      ),
    )
    const error = await runner.runContentIntegration().catch((cause) => cause)
    expect(error.message).toContain(bindings[index].service)
    expect(error.message).toContain(`127.0.0.1:${bindings[index].port}`)
    expect(error.message).toContain('already in use')
    expect(error.message).toContain('Stop')
    expect(mocks.spawnSync.mock.calls.map(([command, args]) => [command, args[3]])).toEqual([
      ['docker', 'down'],
    ])
    expect(mocks.fetch).not.toHaveBeenCalled()
    for (const server of probes.slice(0, index)) expect(server.close).toHaveBeenCalledOnce()
  })

  it.each(['EPERM', 'EACCES'])('reports %s as a bind failure, not a busy port', async (code) => {
    mocks.createServer.mockImplementation(() =>
      probe(Object.assign(new Error('network denied'), { code })),
    )
    const error = await runner.assertContentPortsAvailable().catch((cause) => cause)
    expect(error.message).toContain('postgres')
    expect(error.message).toContain(`127.0.0.1:${bindings[0].port}`)
    expect(error.message).toContain(code)
    expect(error.message).not.toContain('already in use')
  })

  it('rejects a failed probe close instead of declaring the port available', async () => {
    const server = probe()
    server.close.mockImplementation((closed) => closed(new Error('close failed')))
    mocks.createServer.mockReturnValueOnce(server)
    await expect(runner.assertContentPortsAvailable()).rejects.toThrow('close failed')
    expect(mocks.createServer).toHaveBeenCalledOnce()
  })

  it('checks after cleanup and before startup, using Compose ports for every endpoint', async () => {
    mocks.spawnSync.mockImplementation((command, args) => {
      if (command === 'docker' && args[3] === 'up') {
        expect(probes).toHaveLength(3)
        for (const server of probes) expect(server.close).toHaveBeenCalledOnce()
      }
      return { status: 0 }
    })
    await runner.runContentIntegration()
    const calls = mocks.spawnSync.mock.calls
    expect(calls.map(([command, args]) => [command, args[3]])).toEqual([
      ['docker', 'down'],
      ['docker', 'up'],
      ['pnpm', 'packages/web/src/server/database/postgres.integration.test.ts'],
      ['docker', 'down'],
    ])
    expect(mocks.spawnSync.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.createServer.mock.invocationCallOrder[0],
    )
    const ports = Object.fromEntries(bindings.map(({ service, port }) => [service, port]))
    const { env } = calls[2][2]
    for (const key of ['TASK42_DATABASE_URL', 'TASK42_RESTORE_DATABASE_URL']) {
      expect(new URL(env[key]).host).toBe(`127.0.0.1:${ports.postgres}`)
    }
    expect(new URL(env.TASK42_DATABASE_URL).pathname).toBe('/magazine')
    expect(new URL(env.TASK42_RESTORE_DATABASE_URL).pathname).toBe('/magazine_restore')
    expect(env.TASK42_CONTENT_INTEGRATION).toBe('1')
    expect(env.TASK42_COMPOSE_FILE).toBe(calls[0][1][2])
    expect(env.TASK42_S3_PRIMARY).toBe(`http://127.0.0.1:${ports['s3-primary']}`)
    expect(env.TASK42_S3_RESTORE).toBe(`http://127.0.0.1:${ports['s3-restore']}`)
    expect(mocks.fetch.mock.calls.map(([url]) => url)).toEqual([
      `${env.TASK42_S3_PRIMARY}/health`,
      `${env.TASK42_S3_RESTORE}/health`,
    ])
  })

  it.each(['up', 'pnpm'])('still cleans up after %s fails', async (failure) => {
    mocks.spawnSync.mockImplementation((command, args) => ({
      status: command === failure || args[3] === failure ? 1 : 0,
    }))
    await expect(runner.runContentIntegration({ servicesLog })).rejects.toThrow('failed with 1')
    expect(mocks.spawnSync.mock.calls.at(-1).slice(0, 2)).toEqual([
      'docker',
      ['compose', '--file', expect.any(String), 'down', '--volumes', '--remove-orphans'],
    ])
  })
})

describe('content integration service logs', () => {
  const composeFile = fileURLToPath(new URL('../tests/content/docker-compose.yml', import.meta.url))
  const suite = 'packages/web/src/server/database/postgres.integration.test.ts'
  const failures = {
    up: `docker compose --file ${composeFile} up --detach --wait failed with 1`,
    pnpm: `pnpm exec vitest run ${suite} failed with 1`,
  }
  const serviceOutput = 'postgres-1  | 2026-11-01T17:00:00.000000000Z database system is ready\n'

  // `failing` exits with 1. Like the real command, `docker compose logs` prints to the file
  // descriptor it is handed, then returns `capture`.
  function stubCommands(failing, capture = { status: 0 }) {
    mocks.spawnSync.mockImplementation((command, args, options) => {
      if (args[3] !== 'logs') return { status: command === failing || args[3] === failing ? 1 : 0 }
      writeSync(options.stdio[1], serviceOutput)
      return capture
    })
  }

  function steps() {
    return mocks.spawnSync.mock.calls.map(([command, args]) => [command, args[3]])
  }

  it('defaults to the ci-artifacts folder that CI uploads after a failure', () => {
    expect(runner.defaultServicesLog).toBe(
      fileURLToPath(
        new URL('../../../ci-artifacts/content-integration-services.log', import.meta.url),
      ),
    )
  })

  it.each([
    ['up', [['docker', 'up']]],
    [
      'pnpm',
      [
        ['docker', 'up'],
        ['pnpm', suite],
      ],
    ],
  ])('saves the service logs before teardown when %s fails', async (failing, started) => {
    stubCommands(failing)
    const error = await runner.runContentIntegration({ servicesLog }).catch((cause) => cause)
    expect(error.message).toBe(failures[failing])
    expect(steps()).toEqual([
      ['docker', 'down'],
      ...started,
      ['docker', 'logs'],
      ['docker', 'down'],
    ])
    const [command, args, options] = mocks.spawnSync.mock.calls.at(-2)
    expect([command, args]).toEqual([
      'docker',
      ['compose', '--file', composeFile, 'logs', '--no-color', '--timestamps'],
    ])
    expect(options.stdio).toEqual(['ignore', expect.any(Number), expect.any(Number)])
    expect(options.timeout).toBeGreaterThan(0)
    expect(options).not.toHaveProperty('shell')
    expect(await readFile(servicesLog, 'utf8')).toBe(serviceOutput)
    expect(errors).toHaveBeenCalledWith(`Docker service logs saved to ${servicesLog}`)
  })

  it('saves the service logs before teardown when a health check never passes', async () => {
    vi.useFakeTimers()
    try {
      stubCommands()
      mocks.fetch.mockResolvedValue({ ok: false })
      const running = runner.runContentIntegration({ servicesLog }).catch((cause) => cause)
      await vi.runAllTimersAsync()
      const error = await running
      const primary = bindings.find(({ service }) => service === 's3-primary')
      expect(error.message).toBe(
        `http://${primary.host}:${primary.port}/health did not become ready`,
      )
      expect(steps()).toEqual([
        ['docker', 'down'],
        ['docker', 'up'],
        ['docker', 'logs'],
        ['docker', 'down'],
      ])
      expect(await readFile(servicesLog, 'utf8')).toBe(serviceOutput)
    } finally {
      vi.useRealTimers()
    }
  })

  it('writes no service log when the run passes', async () => {
    await runner.runContentIntegration({ servicesLog })
    expect(steps()).not.toContainEqual(['docker', 'logs'])
    await expect(stat(path.dirname(servicesLog))).rejects.toMatchObject({ code: 'ENOENT' })
    expect(errors).not.toHaveBeenCalled()
  })

  it.each([
    [
      'docker compose logs exits with 1',
      () => stubCommands('pnpm', { status: 1 }),
      'docker compose logs failed with 1',
    ],
    [
      'docker compose logs times out',
      () =>
        stubCommands('pnpm', {
          status: null,
          signal: 'SIGTERM',
          error: Object.assign(new Error('spawnSync docker ETIMEDOUT'), { code: 'ETIMEDOUT' }),
        }),
      'spawnSync docker ETIMEDOUT',
    ],
    [
      'the log folder cannot be created',
      async () => {
        stubCommands('pnpm')
        await writeFile(path.dirname(servicesLog), 'a file in the way')
      },
      'EEXIST',
    ],
  ])('still tears down and rethrows the original error when %s', async (_case, arrange, reason) => {
    await arrange()
    const error = await runner.runContentIntegration({ servicesLog }).catch((cause) => cause)
    expect(error.message).toBe(failures.pnpm)
    expect(steps().at(-1)).toEqual(['docker', 'down'])
    expect(errors).toHaveBeenCalledOnce()
    const [note] = errors.mock.calls[0]
    expect(note).toContain(`Could not save the Docker service logs to ${servicesLog}: `)
    expect(note).toContain(reason)
  })
})
