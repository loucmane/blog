import { EventEmitter } from 'node:events'

import type { Pool, PoolClient, QueryResult } from 'pg'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { labSeedBarrier } from '../../../tests/support/lab-seed-barrier'
import { LabSeedLimits } from '../lab/limits'
import { PostgresContentRepository } from './postgres-content-repository'

function fixture() {
  const query = vi.fn<(text: string, values?: unknown[]) => Promise<QueryResult>>(async (text) => ({
    command: text,
    rowCount: 1,
    oid: 0,
    fields: [],
    rows: text.includes('pg_try_advisory_lock') ? [{ acquired: true }] : [],
  }))
  const client = Object.assign(new EventEmitter(), { query, release: vi.fn() })
  const connect = vi.fn(async () => client as unknown as PoolClient)
  const pool = { connect } as unknown as Pool
  return { client, connect, query, repository: new PostgresContentRepository(pool) }
}

describe('bounded exclusive PostgreSQL sessions', () => {
  afterEach(() => vi.useRealTimers())

  it('sets server bounds only on the dedicated session and discards it after unlocking', async () => {
    vi.useFakeTimers()
    const { repository, query, client } = fixture()
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
    expect(client.release).toHaveBeenCalledExactlyOnceWith(true)
    query.mockClear()
    client.release.mockClear()
    await repository.transaction(async () => 'owner work')
    expect(query.mock.calls.map(([text]) => text)).toEqual([
      'BEGIN',
      'SET CONSTRAINTS ALL DEFERRED',
      'COMMIT',
    ])
    expect(client.release).toHaveBeenCalledExactlyOnceWith()
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
    expect(client.release).toHaveBeenCalledExactlyOnceWith(true)
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
      expect(client.release).toHaveBeenCalledExactlyOnceWith(true)
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
      expect(client.release).toHaveBeenCalledExactlyOnceWith(true)
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
    expect(client.release).toHaveBeenCalledExactlyOnceWith(true)
    expect(query.mock.calls.some(([text]) => text === 'COMMIT')).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('bounds checkout and destroys a connection that arrives after expiry', async () => {
    vi.useFakeTimers()
    const { repository, connect, query, client } = fixture()
    const arrived = labSeedBarrier()
    connect.mockImplementationOnce(async () => {
      await arrived.promise
      return client as unknown as PoolClient
    })
    const run = repository.tryExclusive(
      'fixture-lock',
      async () => 'done',
      new LabSeedLimits({ runTimeoutMs: 50 }).database,
    )
    const failed = expect(run).rejects.toThrow('database operation timed out')
    await vi.advanceTimersByTimeAsync(50)
    await failed
    arrived.resolve()
    await vi.advanceTimersByTimeAsync(0)
    expect(client.release).toHaveBeenCalledExactlyOnceWith(true)
    expect(query).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
})
