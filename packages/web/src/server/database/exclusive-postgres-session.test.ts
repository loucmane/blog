import { EventEmitter } from 'node:events'
import { Duplex } from 'node:stream'

import { Client, Pool, type ClientConfig, type QueryResult } from 'pg'
import type * as Pg from 'pg'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { labSeedBarrier } from '../../../tests/support/lab-seed-barrier'
import { LabSeedLimits } from '../lab/limits'
import { PostgresContentRepository } from './postgres-content-repository'

vi.mock('pg', async (importOriginal) => {
  const actual = await importOriginal<typeof Pg>()
  return { ...actual, Client: vi.fn() }
})

function fixture() {
  const query = vi.fn<(text: string, values?: unknown[]) => Promise<QueryResult>>(async (text) => ({
    command: text,
    rowCount: 1,
    oid: 0,
    fields: [],
    rows: text.includes('pg_try_advisory_lock') ? [{ acquired: true }] : [],
  }))
  const client = Object.assign(new EventEmitter(), {
    query,
    connect: vi.fn(async () => {}),
    end: vi.fn(async () => {}),
    connection: { stream: { destroy: vi.fn() } },
  })
  vi.mocked(Client).mockImplementation(function () {
    return client as unknown as Client
  })
  const owner = { query: vi.fn(query.getMockImplementation()!), release: vi.fn() }
  const connect = vi.fn(async () => owner)
  const pool = { connect, options: {} } as unknown as Pool
  return { client, connect, owner, pool, query, repository: new PostgresContentRepository(pool) }
}

describe('bounded exclusive PostgreSQL sessions', () => {
  afterEach(() => vi.useRealTimers())

  it('sets server bounds only on the standalone client and ends it after unlocking', async () => {
    vi.useFakeTimers()
    const { repository, query, client, connect, owner } = fixture()
    const limits = new LabSeedLimits({ runTimeoutMs: 1_000 })
    await repository.tryExclusive(
      'fixture-lock',
      async (locked) => {
        await vi.advanceTimersByTimeAsync(100)
        await locked.transaction(async () => 'done')
      },
      limits.database,
    )
    const settings = query.mock.calls.filter(([text]) => text.includes('set_config'))
    expect(settings.map(([, values]) => values)).toEqual([
      ['1000ms', '1000ms', '1000ms'],
      ['900ms', '900ms', '900ms'],
    ])
    expect(query.mock.calls.at(-1)?.[0]).toContain('pg_advisory_unlock')
    expect(client.end).toHaveBeenCalledExactlyOnceWith()
    expect(connect).not.toHaveBeenCalled()
    query.mockClear()
    await repository.transaction(async () => 'owner work')
    expect(query).not.toHaveBeenCalled()
    expect(owner.query.mock.calls.map(([text]) => text)).toEqual([
      'BEGIN',
      'SET CONSTRAINTS ALL DEFERRED',
      'COMMIT',
    ])
    expect(connect).toHaveBeenCalledOnce()
    expect(owner.release).toHaveBeenCalledExactlyOnceWith()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('checks the deadline after publication bookkeeping and rolls back instead of committing', async () => {
    vi.useFakeTimers()
    const { repository, query, client } = fixture()
    const original = query.getMockImplementation()!
    query.mockImplementation(async (text, values) => {
      const result = await original(text, values)
      if (text.startsWith('UPDATE content_publication_state')) vi.advanceTimersByTime(50)
      return result
    })
    await expect(
      repository.tryExclusive(
        'fixture-lock',
        (locked) =>
          locked.transaction(async (tx) => {
            tx.recordPublicationChange()
          }),
        new LabSeedLimits({ runTimeoutMs: 50 }).database,
      ),
    ).rejects.toThrow()
    expect(query.mock.calls.some(([text]) => text === 'COMMIT')).toBe(false)
    expect(client.end).toHaveBeenCalledOnce()
  })

  it('uses a fresh deadline check even if timers have not fired after bookkeeping', async () => {
    const { repository, query } = fixture()
    const original = query.getMockImplementation()!
    const now = performance.now.bind(performance)
    let elapsed = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now() + elapsed)
    query.mockImplementation(async (text, values) => {
      const result = await original(text, values)
      if (text.startsWith('UPDATE content_publication_state')) elapsed = 300_000
      return result
    })
    await expect(
      repository.tryExclusive(
        'fixture-lock',
        (locked) =>
          locked.transaction(async (tx) => {
            tx.recordPublicationChange()
          }),
        new LabSeedLimits({}).database,
      ),
    ).rejects.toThrow('run deadline')
    expect(query.mock.calls.map(([text]) => text)).toContain('ROLLBACK')
    expect(query.mock.calls.some(([text]) => text === 'COMMIT')).toBe(false)
  })

  it.each(['ROLLBACK', 'pg_advisory_unlock'])(
    'destroys the connection when %s never settles, without issuing more SQL',
    async (operation) => {
      vi.useFakeTimers()
      const { repository, query, client } = fixture()
      const entered = labSeedBarrier()
      const original = query.getMockImplementation()!
      query.mockImplementation((text, values) => {
        if (text.includes(operation)) {
          entered.resolve()
          return new Promise(() => {})
        }
        return original(text, values)
      })
      const run = repository.tryExclusive(
        'fixture-lock',
        (locked) =>
          locked.transaction(async () => {
            if (operation === 'ROLLBACK') throw new Error('Fixture work failure')
          }),
        new LabSeedLimits({ cleanupTimeoutMs: 50 }).database,
      )
      const failed = expect(run).rejects.toThrow('database operation timed out')
      await entered.promise
      const calls = query.mock.calls.length
      await vi.advanceTimersByTimeAsync(50)
      await failed
      expect(query).toHaveBeenCalledTimes(calls)
      expect(client.connection.stream.destroy).toHaveBeenCalledOnce()
      expect(client.end).toHaveBeenCalledOnce()
      expect(vi.getTimerCount()).toBe(0)
    },
  )

  it.each(['ROLLBACK', 'pg_advisory_unlock'])(
    'destroys the connection when %s errors',
    async (operation) => {
      const { repository, query, client } = fixture()
      const original = query.getMockImplementation()!
      query.mockImplementation((text, values) =>
        text.includes(operation)
          ? Promise.reject(new Error('Fixture cleanup failure'))
          : original(text, values),
      )
      await expect(
        repository.tryExclusive(
          'fixture-lock',
          (locked) =>
            locked.transaction(async () => {
              if (operation === 'ROLLBACK') throw new Error('Fixture work failure')
            }),
          new LabSeedLimits({}).database,
        ),
      ).rejects.toThrow('Fixture cleanup failure')
      expect(client.connection.stream.destroy).toHaveBeenCalledOnce()
      expect(client.end).toHaveBeenCalledOnce()
    },
  )

  it('bounds a stalled SQL transport by the run deadline and destroys the session', async () => {
    vi.useFakeTimers()
    const { repository, query, client } = fixture()
    const entered = labSeedBarrier()
    const original = query.getMockImplementation()!
    query.mockImplementation((text, values) => {
      if (text === 'SET CONSTRAINTS ALL DEFERRED') {
        entered.resolve()
        return new Promise(() => {})
      }
      return original(text, values)
    })
    const run = repository.tryExclusive(
      'fixture-lock',
      (locked) => locked.transaction(async () => 'done'),
      new LabSeedLimits({ runTimeoutMs: 50 }).database,
    )
    const failed = expect(run).rejects.toThrow('database operation timed out')
    await entered.promise
    await vi.advanceTimersByTimeAsync(50)
    await failed
    expect(client.connection.stream.destroy).toHaveBeenCalledOnce()
    expect(client.end).toHaveBeenCalledOnce()
    expect(query.mock.calls.some(([text]) => text === 'COMMIT')).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each([false, true])(
    'the real driver destroys stalled startup (TCP connected: %s) without using the owner pool',
    async (tcpConnected) => {
      vi.useFakeTimers()
      const { repository, connect, owner, query } = fixture()
      const { Client: RealClient } = await vi.importActual<typeof Pg>('pg')
      // An inert socket transport exercises pg's actual startup timer without network access.
      const startup = labSeedBarrier()
      const socket = Object.assign(
        new Duplex({
          read() {},
          write(_chunk, _encoding, callback) {
            startup.resolve()
            callback()
          },
        }),
        {
          connect() {
            if (tcpConnected) queueMicrotask(() => socket.emit('connect'))
          },
          setNoDelay() {},
        },
      )
      let seedClient!: Client
      vi.mocked(Client).mockImplementationOnce(function (configuration) {
        seedClient = new RealClient({
          ...(configuration as ClientConfig),
          host: 'fixture.invalid',
          user: 'USER',
          database: 'DB',
          password: 'PASSWORD',
          ssl: false,
          stream: () => socket,
        })
        return seedClient
      })
      const work = vi.fn(async () => 'done')
      const run = repository.tryExclusive(
        'fixture-lock',
        work,
        new LabSeedLimits({ runTimeoutMs: 50 }).database,
      )
      const failed = expect(run).rejects.toThrow('timeout expired')
      if (tcpConnected) await startup.promise
      const end = vi.spyOn(seedClient, 'end')
      expect(connect).not.toHaveBeenCalled()
      // No clock advancement or seed completion is needed for ordinary owner work.
      await repository.transaction(async () => 'owner work')
      expect(owner.release).toHaveBeenCalledExactlyOnceWith()
      await vi.advanceTimersByTimeAsync(50)
      await failed
      expect(socket.destroyed).toBe(true)
      expect(end).toHaveBeenCalledOnce()
      expect(work).not.toHaveBeenCalled()
      expect(query).not.toHaveBeenCalled()
      expect(connect).toHaveBeenCalledOnce()
      expect(vi.getTimerCount()).toBe(0)
    },
  )

  it('copies connection options including a hidden password, without changing owner pool settings', async () => {
    const { client } = fixture()
    const password = () => 'PASSWORD'
    const ssl = { rejectUnauthorized: true }
    const pool = new Pool({
      host: 'fixture.invalid',
      database: 'DB',
      user: 'USER',
      password,
      ssl,
      options: '-c search_path=fixture',
      max: 8,
    })
    try {
      await new PostgresContentRepository(pool).tryExclusive('fixture-lock', async () => 'done')
      expect(Client).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          host: 'fixture.invalid',
          database: 'DB',
          user: 'USER',
          password,
          ssl,
          options: '-c search_path=fixture',
          connectionTimeoutMillis: 10_000,
        }),
      )
      expect(pool.options.connectionTimeoutMillis).toBeUndefined()
      expect(pool.options.max).toBe(8)
      expect(pool.totalCount).toBe(0)
      expect(client.end).toHaveBeenCalledOnce()
    } finally {
      await pool.end()
    }
  })

  it('ends a refused concurrent run without calling its work', async () => {
    const { repository, client, query, connect } = fixture()
    query.mockResolvedValue({ command: 'SELECT', rowCount: 1, oid: 0, fields: [], rows: [] })
    const work = vi.fn(async () => 'done')
    await expect(repository.tryExclusive('fixture-lock', work)).resolves.toEqual({
      acquired: false,
    })
    expect(work).not.toHaveBeenCalled()
    expect(client.end).toHaveBeenCalledOnce()
    expect(connect).not.toHaveBeenCalled()
  })

  it.each(['startup', 'configuration'])(
    'ends the standalone client on %s failure',
    async (step) => {
      const { repository, client, query, connect } = fixture()
      if (step === 'startup') client.connect.mockRejectedValueOnce(new Error('Fixture failure'))
      else query.mockRejectedValueOnce(new Error('Fixture failure'))
      await expect(
        repository.tryExclusive('fixture-lock', async () => 'done', new LabSeedLimits({}).database),
      ).rejects.toThrow('Fixture failure')
      expect(client.end).toHaveBeenCalledOnce()
      expect(connect).not.toHaveBeenCalled()
    },
  )

  it('destroys the transport if client.end stalls past its cleanup bound', async () => {
    vi.useFakeTimers()
    const { repository, client } = fixture()
    const ending = labSeedBarrier()
    client.end.mockImplementationOnce(() => {
      ending.resolve()
      return new Promise(() => {})
    })
    const run = repository.tryExclusive(
      'fixture-lock',
      async () => 'done',
      new LabSeedLimits({ cleanupTimeoutMs: 50 }).database,
    )
    const failed = expect(run).rejects.toThrow('database operation timed out')
    await ending.promise
    await vi.advanceTimersByTimeAsync(50)
    await failed
    expect(client.end).toHaveBeenCalledOnce()
    expect(client.connection.stream.destroy).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('destroys the transport if client.end fails', async () => {
    const { repository, client } = fixture()
    client.end.mockRejectedValueOnce(new Error('Fixture shutdown failure'))
    await expect(repository.tryExclusive('fixture-lock', async () => 'done')).rejects.toThrow(
      'Fixture shutdown failure',
    )
    expect(client.connection.stream.destroy).toHaveBeenCalledOnce()
  })
})
