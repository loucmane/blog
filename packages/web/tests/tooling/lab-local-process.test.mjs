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
    const child = children.find((entry) => -entry.pid === pid)
    const leaderAlive = child?.exitCode === null && child?.signalCode === null
    if (!leaderAlive && !child?.descendantAlive)
      throw Object.assign(new Error('No such process group'), { code: 'ESRCH' })
    if (signal === 0) return true
    if (signal === 'SIGKILL' && child.descendantExitOnKill) child.descendantAlive = false
    if (
      leaderAlive &&
      !(ignoreTerm && signal === 'SIGTERM') &&
      !(signal === 'SIGKILL' && !child.leaderExitOnKill)
    )
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
      leaderExitOnKill: true,
      descendantAlive: false,
      descendantExitOnKill: true,
      unref: vi.fn(),
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
    await vi.advanceTimersByTimeAsync(5100)
    await running
    expect(children[0].signalCode).toBe('SIGKILL')
    expect(children).toHaveLength(1)
  })

  it.each(['stops', 'crashes'])(
    'waits for a resistant descendant after its leader %s',
    async (event) => {
      vi.useFakeTimers()
      let returned = false
      const result = runLocalLab({}).then(
        () => {
          returned = true
        },
        (error) => {
          returned = true
          return error
        },
      )
      await vi.waitFor(() =>
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Open http://')),
      )
      const server = children[1]
      server.descendantAlive = true
      server.descendantExitOnKill = false
      if (event === 'crashes') finish(server, 1)
      else handlers.get('SIGINT')()

      await vi.advanceTimersByTimeAsync(0)
      expect(server.exitCode !== null || server.signalCode !== null).toBe(true)
      expect(returned).toBe(false)
      expect(process.kill).toHaveBeenCalledWith(-server.pid, 'SIGTERM')
      await vi.advanceTimersByTimeAsync(5000)
      expect(process.kill).toHaveBeenCalledWith(-server.pid, 'SIGKILL')
      expect(returned).toBe(false)

      // Delivery of SIGKILL is not proof of exit. Wait until the whole group is gone.
      server.descendantAlive = false
      await vi.advanceTimersByTimeAsync(50)
      const outcome = await result
      expect(returned).toBe(true)
      if (event === 'crashes') expect(outcome.message).toContain('Local server failed')
      else expect(outcome).toBeUndefined()
    },
  )

  it.each(['exited', 'running'])(
    'reports a persistent group within the shutdown bound with its leader %s',
    async (leaderState) => {
      vi.useFakeTimers()
      holdBuild = true
      ignoreTerm = leaderState === 'running'
      const rejected = vi.fn()
      const running = runLocalLab({}).catch(rejected)
      await vi.waitFor(() => expect(children).toHaveLength(1))
      const build = children[0]
      build.leaderExitOnKill = false
      build.descendantAlive = true
      build.descendantExitOnKill = false

      handlers.get('SIGINT')()
      await vi.advanceTimersByTimeAsync(9999)
      expect(rejected).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(1)
      expect(rejected).toHaveBeenCalledOnce()
      await running
      const error = rejected.mock.calls[0][0]
      expect(error.message).toContain(`process group ${build.pid}`)
      expect(error.message).toContain('still present 5 seconds after SIGKILL')
      expect(error.message).toContain(
        leaderState === 'running'
          ? 'leader has not exited'
          : 'leader exitCode=null, signal=SIGTERM',
      )
      expect(process.kill).toHaveBeenCalledWith(-build.pid, 'SIGTERM')
      expect(process.kill).toHaveBeenCalledWith(-build.pid, 'SIGKILL')
      expect(build.descendantAlive).toBe(true)
      expect(build.unref).toHaveBeenCalledOnce()
      expect(children).toHaveLength(1)
      expect(fakes.writeFile).not.toHaveBeenCalled()
      expect(vi.getTimerCount()).toBe(0)
      const calls = process.kill.mock.calls.length
      await vi.advanceTimersByTimeAsync(60_000)
      expect(process.kill).toHaveBeenCalledTimes(calls)
    },
  )

  it.each([
    { signal: 'SIGTERM', code: 'EPERM' },
    { signal: 'SIGKILL', code: 'EIO' },
    { signal: 0, code: 'EPERM' },
  ])(
    'reports $signal failure ($code) without waiting for leader exit',
    async ({ signal, code }) => {
      vi.useFakeTimers()
      holdBuild = true
      ignoreTerm = true
      const rejected = vi.fn()
      const running = runLocalLab({}).catch(rejected)
      await vi.waitFor(() => expect(children).toHaveLength(1))
      const build = children[0]
      const kill = vi.mocked(process.kill).getMockImplementation()
      const failure = Object.assign(new Error(`kill ${code}`), { code })
      vi.mocked(process.kill).mockImplementation((pid, requestedSignal) => {
        if (pid === -build.pid && requestedSignal === signal) throw failure
        return kill(pid, requestedSignal)
      })

      handlers.get('SIGINT')()
      await vi.advanceTimersByTimeAsync(signal === 'SIGKILL' ? 5000 : 0)
      expect(rejected).toHaveBeenCalledOnce()
      await running
      const error = rejected.mock.calls[0][0]
      expect(error.message).toContain(`process group ${build.pid}`)
      expect(error.message).toContain(code)
      expect(error.message).toContain('leader has not exited')
      expect(error.cause).toBe(failure)
      expect(build.exitCode).toBeNull()
      expect(build.signalCode).toBeNull()
      expect(build.unref).toHaveBeenCalledOnce()
      expect(children).toHaveLength(1)
      expect(vi.getTimerCount()).toBe(0)
    },
  )

  it('never signals a completed group ID again after the OS could reuse it', async () => {
    const running = runLocalLab({})
    await vi.waitFor(() =>
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Open http://')),
    )
    const build = children[0]
    // The old build group is gone; this models an unrelated new group using that ID.
    build.descendantAlive = true
    vi.mocked(process.kill).mockClear()
    handlers.get('SIGINT')()
    await running
    expect(process.kill.mock.calls.some(([pid]) => pid === -build.pid)).toBe(false)
    expect(build.descendantAlive).toBe(true)
    expect(process.kill.mock.calls.every(([pid]) => pid === -children[1].pid)).toBe(true)
  })
})
