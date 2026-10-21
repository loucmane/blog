import { EventEmitter } from 'node:events'
import { readFile } from 'node:fs/promises'

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
})
afterAll(() => vi.unstubAllGlobals())

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

beforeEach(() => {
  probes = []
  mocks.spawnSync.mockReset().mockReturnValue({ status: 0 })
  mocks.fetch.mockReset().mockResolvedValue({ ok: true })
  mocks.createServer.mockReset().mockImplementation(() => probe())
})

describe('content integration ports', () => {
  it('can be imported without starting Docker or the integration suite', () => {
    expect(importCalls).toBe(0)
  })

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
    await expect(runner.runContentIntegration()).rejects.toThrow('failed with 1')
    expect(mocks.spawnSync.mock.calls.at(-1).slice(0, 2)).toEqual([
      'docker',
      ['compose', '--file', expect.any(String), 'down', '--volumes', '--remove-orphans'],
    ])
  })
})
