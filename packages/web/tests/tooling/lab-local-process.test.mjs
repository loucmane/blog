import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { runLocalLab } from '../../scripts/lab-local.mjs'

const fakes = vi.hoisted(() => ({ spawn: vi.fn(), writeFile: vi.fn() }))
vi.mock('node:child_process', () => ({ spawn: fakes.spawn }))
vi.mock('node:fs/promises', () => ({
  readdir: async () => [],
  readFile: async (file) => {
    if (file.endsWith('lab-local.json')) throw new Error('No previous build')
    return 'build-id'
  },
  writeFile: fakes.writeFile,
}))
vi.mock('node:net', () => ({
  default: {
    createServer: () => ({
      once() {
        return this
      },
      listen(_port, _host, ready) {
        ready()
      },
      close(done) {
        done()
      },
    }),
  },
}))

let children
let handlers
let failStage
let holdBuild
let ignoreTerm

function finish(child, code, signal = null) {
  child.exitCode = code
  child.signalCode = signal
  child.emit('exit', code, signal)
}

beforeEach(() => {
  children = []
  handlers = new Map()
  failStage = undefined
  holdBuild = false
  ignoreTerm = false
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(process, 'once').mockImplementation((name, handler) => {
    handlers.set(name, handler)
    return process
  })
  vi.spyOn(process, 'kill').mockImplementation((pid, signal) => {
    const child = children.find((entry) => entry.pid === Math.abs(pid))
    if (child && !(ignoreTerm && signal === 'SIGTERM'))
      queueMicrotask(() => finish(child, null, signal))
    return true
  })
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('Ready')),
  )
  fakes.spawn.mockImplementation((_node, args, options) => {
    const child = new EventEmitter()
    Object.assign(child, {
      pid: 10_000 + children.length,
      exitCode: null,
      signalCode: null,
      args,
      options,
    })
    children.push(child)
    const stage = args[1] ?? 'seed'
    if ((stage === 'build' && !holdBuild) || stage === 'seed')
      queueMicrotask(() => finish(child, failStage === stage ? 1 : 0))
    return child
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('local launcher process ownership', () => {
  it('builds, binds loopback, seeds, reports the sign-in URL, and cleans up on Ctrl+C', async () => {
    const running = runLocalLab({})
    await vi.waitFor(() =>
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Open http://localhost:3100/owner/sign-in'),
      ),
    )
    expect(children.map(({ args }) => args[1] ?? 'seed')).toEqual(['build', 'start', 'seed'])
    expect(children[0].options.env.MAGAZINE_OWNER_TEST_MODE).toBeUndefined()
    expect(children[1].args.slice(2)).toEqual(['--hostname', '127.0.0.1', '--port', '3100'])
    expect(children[1].options.env.NODE_ENV).toBe('test')
    expect(children[2].options.env.MAGAZINE_LAB_SEED_URL).toBe('http://localhost:3100')
    handlers.get('SIGINT')()
    await running
    expect(children[1].signalCode).toBe('SIGTERM')
  })

  it('does not start or seed after a build failure', async () => {
    failStage = 'build'
    await expect(runLocalLab({})).rejects.toThrow('Build failed')
    expect(children).toHaveLength(1)
    expect(fakes.writeFile).not.toHaveBeenCalled()
  })

  it('stops its server after a failed seed and never reports a ready lab', async () => {
    failStage = 'seed'
    await expect(runLocalLab({})).rejects.toThrow('North House seed failed')
    expect(children[1].signalCode).toBe('SIGTERM')
    expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('Open http://'))
  })

  it('stops a build on cancellation without continuing to start or seed', async () => {
    holdBuild = true
    const running = runLocalLab({})
    await vi.waitFor(() => expect(children).toHaveLength(1))
    handlers.get('SIGTERM')()
    await running
    expect(children).toHaveLength(1)
    expect(children[0].signalCode).toBe('SIGTERM')
  })

  it('escalates cleanup when a build ignores the first stop signal', async () => {
    vi.useFakeTimers()
    holdBuild = true
    ignoreTerm = true
    const running = runLocalLab({})
    await vi.waitFor(() => expect(children).toHaveLength(1))
    handlers.get('SIGINT')()
    await vi.advanceTimersByTimeAsync(5000)
    await running
    expect(children[0].signalCode).toBe('SIGKILL')
    expect(children).toHaveLength(1)
  })
})
