import { randomBytes } from 'node:crypto'
import { EventEmitter } from 'node:events'

import { Pool, type ClientBase } from 'pg'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  latestRunsStatementTimeoutMs,
  latestRunsTimeoutMs,
  PostgresOperationRunStore,
  type OperationRunPool,
} from '../database/postgres-operation-runs'
import { defaultHealthTimeoutMs } from '../observability/health'
import {
  backupFinding,
  backupRun,
  failedRestoreDrillRun,
  InMemoryOperationRunStore,
  operationRun,
  OperationRunError,
  recoveryPointMet,
  recoveryTimeMet,
  restoreDrillCadenceMs,
  restoreDrillFinding,
  restoreDrillRun,
  runAgeFrom,
  runAgeMs,
  unreadableRun,
  type OperationRun,
} from './operation-runs'
import { recordOperationRun, RecordError, type RecordingConnection } from './record-operation-run'
import { newDrillEvidence, recoveryTargets } from './restore-drill-contract'

const now = new Date('2026-11-23T12:00:00.000Z')
const hour = 3_600_000
const day = 24 * hour

function ago(milliseconds: number): string {
  return new Date(now.valueOf() - milliseconds).toISOString()
}

function backup(overrides: Partial<OperationRun> = {}): OperationRun {
  return {
    failureReason: null,
    finishedAt: ago(hour),
    kind: 'backup',
    outcome: 'succeeded',
    rpoMs: null,
    rtoMs: null,
    startedAt: ago(hour + 60_000),
    ...overrides,
  }
}

function drill(overrides: Partial<OperationRun> = {}): OperationRun {
  return {
    failureReason: null,
    finishedAt: ago(day),
    kind: 'restore-drill',
    outcome: 'succeeded',
    rpoMs: 2 * hour,
    rtoMs: 10 * 60_000,
    startedAt: ago(day + 10 * 60_000),
    ...overrides,
  }
}

/** A connection whose query calls are recorded; `fails` makes every query reject. */
function connection(fails = false) {
  const query = vi.fn(async (_text: string, _values: readonly unknown[]) => {
    if (fails) throw new Error('connect ECONNREFUSED 10.20.30.40:5432 synthetic driver text')
    return { rows: [] }
  })
  const end = vi.fn(async () => undefined)
  return { connection: { end, query } as unknown as RecordingConnection, end, query }
}

/**
 * A pool whose connections answer the latest-runs read with `rows`, both statements' results in
 * order, as pg answers a two-statement message; `answer` replaces that answer.
 */
function postgresPool(
  rows: readonly Record<string, unknown>[],
  answer: (text: string) => Promise<unknown> = async () => [
    { command: 'SET', rows: [] },
    { command: 'SELECT', rows },
  ],
) {
  const query = vi.fn(answer)
  const release = vi.fn()
  const connect = vi.fn(async () => ({ query, release }))
  const write = vi.fn(async (_text: string, _values: readonly unknown[]) => ({ rows: [] }))
  return { connect, pool: { connect, query: write } as OperationRunPool, query, release, write }
}

/**
 * A client for a real pg `Pool` (its `Client` option): it connects at once and reads no runs, so
 * what a test sees is the pool's own queue.
 */
class InstantClient extends EventEmitter {
  // What pg-pool reads to decide that a released client can be used again.
  readonly _ending = false
  readonly _queryable = true

  connect(callback: (error?: Error) => void): void {
    queueMicrotask(() => callback())
  }

  async query(): Promise<unknown> {
    return [
      { command: 'SET', rows: [] },
      { command: 'SELECT', rows: [] },
    ]
  }

  end(callback?: () => void): void {
    queueMicrotask(() => callback?.())
  }

  ref(): void {}

  unref(): void {}
}

/** A real pg pool of one instant client, that connection already taken, as busy requests hold it. */
async function saturatedPool() {
  const pool = new Pool({ Client: InstantClient as unknown as new () => ClientBase, max: 1 })
  const holder = await pool.connect()
  return { holder, pool }
}

/** A stored backup row and a stored drill row, as pg reads them: timestamps and bigint text. */
const storedBackup = {
  failure_reason: null,
  finished_at: new Date(ago(hour)),
  kind: 'backup',
  outcome: 'succeeded',
  rpo_ms: null,
  rto_ms: null,
  started_at: new Date(ago(2 * hour)),
}
const storedDrill = { ...storedBackup, kind: 'restore-drill', rpo_ms: '7200000', rto_ms: '600000' }

afterEach(() => {
  vi.useRealTimers()
})

describe('operation runs', () => {
  it('keeps exactly what migration 0011 allows and refuses anything else without naming a value', () => {
    expect(operationRun(backup())).toEqual(backup())
    expect(operationRun(drill())).toEqual(drill())
    const failedDrill = drill({
      failureReason: 'row_count_mismatch',
      outcome: 'failed',
      rpoMs: null,
    })
    expect(operationRun(failedDrill)).toEqual(failedDrill)
    const secret = randomBytes(12).toString('hex')
    for (const invalid of [
      { ...backup(), path: `/private/${secret}` },
      backup({ finishedAt: ago(2 * hour) }),
      backup({ outcome: 'failed' }),
      backup({ failureReason: 'operation_failed' }),
      backup({ rpoMs: 1 }),
      drill({ rtoMs: null }),
      drill({ rpoMs: -1 }),
      drill({ rtoMs: 1.5 }),
      backup({ outcome: 'failed', failureReason: secret as never }),
      backup({ kind: 'export' as never }),
      backup({ startedAt: '2026-11-23T10:00:00+01:00' }),
      backup({ finishedAt: secret }),
      null,
    ]) {
      expect(() => operationRun(invalid)).toThrow(OperationRunError)
      try {
        operationRun(invalid)
      } catch (error) {
        expect(String((error as Error).message)).not.toContain(secret)
      }
    }
  })

  it('keeps instants from year 0001 to year 9999, the years migration 0011 keeps, and no others', () => {
    const at = (instant: string) => backup({ finishedAt: instant, startedAt: instant })
    for (const instant of ['0001-01-01T00:00:00.000Z', '9999-12-31T23:59:59.999Z']) {
      expect(operationRun(at(instant))).toEqual(at(instant))
    }
    for (const instant of [
      '0000-12-31T23:59:59.999Z',
      '0000-01-01T00:00:00.000Z',
      '10000-01-01T00:00:00.000Z',
      '+010000-01-01T00:00:00.000Z',
      '-000001-01-01T00:00:00.000Z',
    ]) {
      expect(() => operationRun(at(instant))).toThrow(OperationRunError)
    }
    // A run that starts before year 0001 or finishes after year 9999 is refused as well.
    expect(() =>
      operationRun(
        backup({ finishedAt: '0001-01-01T00:00:00.000Z', startedAt: '0000-12-31T23:59:59.999Z' }),
      ),
    ).toThrow(OperationRunError)
    expect(() =>
      operationRun(
        backup({ finishedAt: '10000-01-01T00:00:00.000Z', startedAt: '9999-12-31T23:59:59.999Z' }),
      ),
    ).toThrow(OperationRunError)
  })

  it('records a backup from when it ran and the fixed code it failed with', () => {
    const started = new Date(ago(hour))
    expect(backupRun(started, now, null)).toEqual({
      failureReason: null,
      finishedAt: now.toISOString(),
      kind: 'backup',
      outcome: 'succeeded',
      rpoMs: null,
      rtoMs: null,
      startedAt: started.toISOString(),
    })
    expect(backupRun(started, now, 'tls_required')).toMatchObject({
      failureReason: 'tls_required',
      outcome: 'failed',
    })
    // A clock stepped back during the run still yields a recordable run.
    expect(backupRun(now, started, null)).toMatchObject({
      finishedAt: now.toISOString(),
      startedAt: now.toISOString(),
    })
  })

  it('records a drill from its evidence: measurements, outcome and its first failure', () => {
    const passed = newDrillEvidence(new Date(ago(hour)))
    passed.status = 'passed'
    passed.completedAt = ago(hour - 600_000)
    passed.recovery.rpoMilliseconds = 3 * hour
    passed.recovery.rtoMilliseconds = 500_000
    expect(restoreDrillRun(passed, now)).toEqual({
      failureReason: null,
      finishedAt: passed.completedAt,
      kind: 'restore-drill',
      outcome: 'succeeded',
      rpoMs: 3 * hour,
      rtoMs: 500_000,
      startedAt: passed.startedAt,
    })

    const failed = newDrillEvidence(new Date(ago(hour)))
    failed.failures.push(
      { code: 'missing_object', stage: 'backup', subject: 'hashed-object' },
      { code: 'rto_exceeded', stage: 'comparison' },
    )
    failed.recovery.rpoMilliseconds = hour
    expect(restoreDrillRun(failed, now)).toEqual({
      failureReason: 'missing_object',
      finishedAt: now.toISOString(),
      kind: 'restore-drill',
      outcome: 'failed',
      rpoMs: hour,
      rtoMs: null,
      startedAt: failed.startedAt,
    })

    // Evidence that claims a pass without both measurements never records a success.
    const unmeasured = newDrillEvidence(new Date(ago(hour)))
    unmeasured.status = 'passed'
    expect(restoreDrillRun(unmeasured, now)).toMatchObject({
      failureReason: 'operation_failed',
      outcome: 'failed',
    })
    expect(failedRestoreDrillRun(new Date(ago(60_000)), now)).toEqual({
      failureReason: 'operation_failed',
      finishedAt: now.toISOString(),
      kind: 'restore-drill',
      outcome: 'failed',
      rpoMs: null,
      rtoMs: null,
      startedAt: ago(60_000),
    })
  })

  it('reports the latest run of each kind by when it finished, from memory', async () => {
    const store = new InMemoryOperationRunStore()
    expect(await store.latest()).toEqual({ backup: null, restoreDrill: null })

    const newer = backup({ finishedAt: ago(hour) })
    const sameTimeLater = backup({ failureReason: 'operation_failed', outcome: 'failed' })
    await store.record(newer)
    await store.record(backup({ finishedAt: ago(2 * hour), startedAt: ago(3 * hour) }))
    await store.record(drill())
    expect(await store.latest()).toEqual({ backup: newer, restoreDrill: drill() })
    // Of runs that finished together, the one recorded later is the latest.
    await store.record(sameTimeLater)
    expect((await store.latest()).backup).toEqual(sameTimeLater)
    await expect(store.record(backup({ rpoMs: 1 }))).rejects.toThrow(OperationRunError)
  })

  it('writes and reads runs in PostgreSQL with parameters only, and checks rows read back', async () => {
    const { pool, query, release, write } = postgresPool([
      {
        failure_reason: 'rto_exceeded',
        finished_at: new Date(ago(day)),
        kind: 'restore-drill',
        outcome: 'failed',
        rpo_ms: String(2 * hour),
        rto_ms: String(5 * hour),
        started_at: new Date(ago(day + 5 * hour)),
      },
      {
        failure_reason: null,
        finished_at: ago(hour),
        kind: 'backup',
        outcome: 'succeeded',
        rpo_ms: null,
        rto_ms: null,
        started_at: ago(hour + 60_000),
      },
    ])
    const store = new PostgresOperationRunStore(pool)

    await store.record(drill())
    expect(write).toHaveBeenLastCalledWith(expect.stringContaining('INSERT INTO operation_runs'), [
      'restore-drill',
      'succeeded',
      null,
      drill().startedAt,
      drill().finishedAt,
      2 * hour,
      10 * 60_000,
    ])
    expect(await store.latest()).toEqual({
      backup: backup(),
      restoreDrill: drill({
        failureReason: 'rto_exceeded',
        outcome: 'failed',
        rpoMs: 2 * hour,
        rtoMs: 5 * hour,
        startedAt: ago(day + 5 * hour),
      }),
    })
    // One message on one pooled connection, which PostgreSQL limits itself, then handed back.
    expect(query).toHaveBeenCalledOnce()
    const [text] = query.mock.calls[0]!
    expect(text).toMatch(/^SET LOCAL statement_timeout = '1000ms';\n\(SELECT /)
    expect(text.match(/ORDER BY finished_at DESC, id DESC LIMIT 1/g)).toHaveLength(2)
    expect(release).toHaveBeenCalledExactlyOnceWith()
    expect(latestRunsStatementTimeoutMs).toBeLessThan(latestRunsTimeoutMs)
    expect(latestRunsTimeoutMs).toBeLessThan(defaultHealthTimeoutMs)

    const calls = write.mock.calls.length
    await expect(store.record(drill({ rtoMs: null }))).rejects.toThrow(OperationRunError)
    expect(write.mock.calls).toHaveLength(calls)
    const empty = new PostgresOperationRunStore(postgresPool([]).pool)
    expect(await empty.latest()).toEqual({ backup: null, restoreDrill: null })
  })

  it('reads a stored row that breaks the table rules as unreadable, for its kind only', async () => {
    for (const corrupt of [
      { ...storedDrill, outcome: 'paused' },
      { ...storedDrill, failure_reason: 'a_code_from_a_later_release', outcome: 'failed' },
      // pg reads PostgreSQL's infinite timestamps as JavaScript infinities.
      { ...storedDrill, finished_at: Number.POSITIVE_INFINITY },
      { ...storedDrill, started_at: Number.NEGATIVE_INFINITY },
      { ...storedDrill, finished_at: new Date(Date.UTC(10_000, 0, 1)) },
      { ...storedDrill, started_at: new Date('0000-06-01T00:00:00.000Z') },
      { ...storedDrill, rto_ms: '9007199254740993' },
      { ...storedDrill, rpo_ms: null },
    ]) {
      const store = new PostgresOperationRunStore(postgresPool([storedBackup, corrupt]).pool)
      expect(await store.latest()).toEqual({
        backup: backup({ finishedAt: ago(hour), startedAt: ago(2 * hour) }),
        restoreDrill: unreadableRun,
      })
    }
    const both = new PostgresOperationRunStore(
      postgresPool([
        { ...storedBackup, rpo_ms: '1' },
        { ...storedDrill, kind: 'restore-drill', outcome: 'skipped' },
      ]).pool,
    )
    expect(await both.latest()).toEqual({ backup: unreadableRun, restoreDrill: unreadableRun })
  })

  it('gives up a read that stalls before or after it gets a connection, and keeps nothing of it', async () => {
    vi.useFakeTimers()
    // The pool has no connection to give in time.
    let handOver: (connection: unknown) => void = () => undefined
    const connect = vi.fn(
      () =>
        new Promise((resolve) => {
          handOver = resolve
        }),
    )
    const waiting = new PostgresOperationRunStore({ connect, query: vi.fn() } as never)
    const acquiring = expect(waiting.latest()).rejects.toMatchObject({ name: 'TimeoutError' })
    await vi.advanceTimersByTimeAsync(latestRunsTimeoutMs)
    await acquiring

    // The statement does not answer in time: its connection is closed, not handed back.
    const stalled = postgresPool([], () => new Promise(() => undefined))
    const reading = expect(new PostgresOperationRunStore(stalled.pool).latest()).rejects.toThrow(
      'The latest operation runs were not read in time.',
    )
    await vi.advanceTimersByTimeAsync(latestRunsTimeoutMs - 1)
    expect(stalled.release).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    await reading
    expect(stalled.query).toHaveBeenCalledOnce()
    expect(stalled.release).toHaveBeenCalledExactlyOnceWith(true)
    vi.useRealTimers()

    // The connection that comes too late goes back to the pool without a statement.
    const late = { query: vi.fn(), release: vi.fn() }
    handOver(late)
    await vi.waitFor(() => expect(late.release).toHaveBeenCalledExactlyOnceWith())
    expect(late.query).not.toHaveBeenCalled()
  })

  it('adds one connection request at most to a saturated pg pool, and hands it back unused once the pool frees', async () => {
    vi.useFakeTimers()
    const { holder, pool } = await saturatedPool()
    // Each health request reads through a store of its own, on the one pool.
    const read = () => new PostgresOperationRunStore(pool).latest()
    const timedOut = () => expect(read()).rejects.toMatchObject({ name: 'TimeoutError' })

    const together = [timedOut(), timedOut(), timedOut()]
    expect(pool.waitingCount).toBe(1)
    await vi.advanceTimersByTimeAsync(latestRunsTimeoutMs)
    await Promise.all(together)
    // pg-pool keeps a request it queued; the reads that gave up added no other.
    expect(pool.waitingCount).toBe(1)
    for (let round = 0; round < 3; round += 1) {
      const reading = timedOut()
      await vi.advanceTimersByTimeAsync(latestRunsTimeoutMs)
      await reading
      expect(pool.waitingCount).toBe(1)
    }
    vi.useRealTimers()

    holder.release()
    // No read waits for that request any more, so its connection goes back unused.
    await vi.waitFor(() => expect([pool.waitingCount, pool.idleCount]).toEqual([0, 1]))
    await expect(read()).resolves.toEqual({ backup: null, restoreDrill: null })
    expect([pool.waitingCount, pool.idleCount, pool.totalCount]).toEqual([0, 1, 1])
    await pool.end()
  })

  it('gives the pool’s one waiting request to a later read that still waits when the pool frees', async () => {
    vi.useFakeTimers()
    const { holder, pool } = await saturatedPool()
    const store = new PostgresOperationRunStore(pool)
    const first = expect(store.latest()).rejects.toMatchObject({ name: 'TimeoutError' })
    await vi.advanceTimersByTimeAsync(latestRunsTimeoutMs)
    await first

    // The later read waits within its own deadline for the request the first one left.
    const second = store.latest()
    expect(pool.waitingCount).toBe(1)
    holder.release()

    await expect(second).resolves.toEqual({ backup: null, restoreDrill: null })
    expect([pool.waitingCount, pool.idleCount]).toEqual([0, 1])
    vi.useRealTimers()
    await pool.end()
  })

  it('asks a free pool for one connection at a time, and fails every read waiting on a request that fails', async () => {
    const { connect, pool, query, release } = postgresPool([storedBackup])
    let asking = 0
    const atOnce: number[] = []
    connect.mockImplementation(async () => {
      atOnce.push((asking += 1))
      await Promise.resolve()
      asking -= 1
      return { query, release }
    })
    const store = new PostgresOperationRunStore(pool)
    const read = await Promise.all([store.latest(), store.latest(), store.latest()])
    expect(atOnce).toEqual([1, 1, 1])
    expect(read).toEqual(
      Array.from({ length: 3 }, () => ({
        backup: backup({ startedAt: ago(2 * hour) }),
        restoreDrill: null,
      })),
    )
    expect(connect).toHaveBeenCalledTimes(3)
    expect(release).toHaveBeenCalledTimes(3)

    const refused = Object.assign(new Error('connect ECONNREFUSED synthetic driver text'), {
      code: 'ECONNREFUSED',
    })
    connect.mockRejectedValueOnce(refused)
    const waiting = await Promise.allSettled([store.latest(), store.latest()])
    expect(waiting).toEqual([
      { reason: refused, status: 'rejected' },
      { reason: refused, status: 'rejected' },
    ])
    expect(connect).toHaveBeenCalledTimes(4)
    // The next read asks again.
    await expect(store.latest()).resolves.toMatchObject({ restoreDrill: null })
    expect(connect).toHaveBeenCalledTimes(5)
  })

  it('hands back unused, without a statement, a connection that comes as its read gives up', async () => {
    const caller = new AbortController()
    const { connect, pool, query, release } = postgresPool([])
    connect
      .mockImplementationOnce(async () => ({ query, release }))
      // Asked for at once for the next waiting read, after the first read got its connection and
      // before it could use it: the first read's caller gives up meanwhile.
      .mockImplementationOnce(async () => {
        caller.abort(new Error('the check gave up'))
        return { query, release }
      })
    const store = new PostgresOperationRunStore(pool)

    const first = store.latest(caller.signal)
    const second = store.latest()

    await expect(first).rejects.toThrow('the check gave up')
    await expect(second).resolves.toEqual({ backup: null, restoreDrill: null })
    expect(query).toHaveBeenCalledOnce()
    expect(release.mock.calls).toEqual([[], []])
  })

  it('stops a read as soon as its caller gives up, and starts none for a caller that already has', async () => {
    let issued: () => void = () => undefined
    const statement = new Promise<void>((resolve) => {
      issued = resolve
    })
    const { connect, pool, release } = postgresPool([], () => {
      issued()
      return new Promise(() => undefined)
    })
    const store = new PostgresOperationRunStore(pool)
    const caller = new AbortController()

    const reading = store.latest(caller.signal)
    await statement
    caller.abort(new Error('the check gave up'))
    await expect(reading).rejects.toThrow('the check gave up')
    expect(release).toHaveBeenCalledExactlyOnceWith(true)

    await expect(store.latest(AbortSignal.abort(new Error('already gone')))).rejects.toThrow(
      'already gone',
    )
    expect(connect).toHaveBeenCalledOnce()
  })

  it('reports a statement PostgreSQL ended at its timeout as a timeout, and other failures as they are', async () => {
    const canceled = postgresPool([], async () => {
      throw Object.assign(new Error('canceling statement due to statement timeout'), {
        code: '57014',
      })
    })
    await expect(new PostgresOperationRunStore(canceled.pool).latest()).rejects.toMatchObject({
      name: 'TimeoutError',
    })
    expect(canceled.release).toHaveBeenCalledExactlyOnceWith(true)

    const missing = postgresPool([], async () => {
      throw Object.assign(new Error('relation "operation_runs" does not exist'), { code: '42P01' })
    })
    await expect(new PostgresOperationRunStore(missing.pool).latest()).rejects.toMatchObject({
      code: '42P01',
    })
    expect(missing.release).toHaveBeenCalledExactlyOnceWith(true)

    // One result, not the two a two-statement message gets.
    const single = postgresPool([], async () => ({ rows: [storedBackup] }))
    await expect(new PostgresOperationRunStore(single.pool).latest()).rejects.toThrow(
      'unexpected answer',
    )
    expect(single.release).toHaveBeenCalledExactlyOnceWith()
  })

  it('tells a fresh backup from a stale, failed or missing one, by when it started', () => {
    expect(backupFinding(null, now)).toBe('never_run')
    expect(backupFinding(backup({ finishedAt: ago(hour) }), now)).toBeNull()
    const limit = backup({
      finishedAt: ago(recoveryTargets.rpoMilliseconds - 20 * 60_000),
      startedAt: ago(recoveryTargets.rpoMilliseconds),
    })
    expect(backupFinding(limit, now)).toBeNull()
    const stale = backup({
      finishedAt: ago(hour),
      startedAt: ago(recoveryTargets.rpoMilliseconds + 1),
    })
    expect(backupFinding(stale, now)).toBe('stale')
    // Its snapshot, taken after it started, is past the target, however recently it finished.
    const straddling = backup({
      finishedAt: ago(23 * hour + 50 * 60_000),
      startedAt: ago(24 * hour + 10 * 60_000),
    })
    expect(backupFinding(straddling, now)).toBe('stale')
    expect(runAgeMs(straddling, now)).toBe(24 * hour + 10 * 60_000)
    expect(runAgeFrom(straddling)).toBe(straddling.startedAt)
    // A failure is reported even when an earlier backup would still be fresh.
    expect(backupFinding(backup({ failureReason: 'missing_object', outcome: 'failed' }), now)).toBe(
      'last_run_failed',
    )
    expect(runAgeMs(stale, now)).toBe(recoveryTargets.rpoMilliseconds + 1)
    expect(runAgeMs(null, now)).toBeNull()
    // A run recorded by a clock slightly ahead is not older than now.
    expect(runAgeMs(backup({ finishedAt: ago(-5_000), startedAt: ago(-5_000) }), now)).toBe(0)
  })

  it('tells a fresh drill from a stale, failed, off-target or missing one', () => {
    expect(restoreDrillFinding(null, now)).toBe('never_run')
    expect(restoreDrillFinding(drill(), now)).toBeNull()
    const cadence = drill({
      finishedAt: ago(restoreDrillCadenceMs),
      startedAt: ago(restoreDrillCadenceMs + hour),
    })
    expect(restoreDrillFinding(cadence, now)).toBeNull()
    const stale = drill({
      finishedAt: ago(restoreDrillCadenceMs + 1),
      startedAt: ago(restoreDrillCadenceMs + hour),
    })
    expect(restoreDrillFinding(stale, now)).toBe('stale')
    // A drill is due a cadence after it finished, so its age counts from its finish.
    expect(runAgeMs(stale, now)).toBe(restoreDrillCadenceMs + 1)
    expect(runAgeFrom(stale)).toBe(stale.finishedAt)
    expect(restoreDrillCadenceMs).toBe(35 * day)
    expect(
      restoreDrillFinding(drill({ failureReason: 'export_invalid', outcome: 'failed' }), now),
    ).toBe('last_run_failed')
    for (const failureReason of ['rpo_exceeded', 'rto_exceeded'] as const) {
      expect(restoreDrillFinding(drill({ failureReason, outcome: 'failed' }), now)).toBe(
        'targets_missed',
      )
    }
    // A drill recorded as passed but over today's targets has missed them.
    const offTarget = drill({ rtoMs: recoveryTargets.rtoMilliseconds + 1 })
    expect(restoreDrillFinding(offTarget, now)).toBe('targets_missed')
    expect(recoveryTimeMet(offTarget)).toBe(false)
    expect(recoveryPointMet(offTarget)).toBe(true)
    expect(restoreDrillFinding(drill({ rpoMs: recoveryTargets.rpoMilliseconds + 1 }), now)).toBe(
      'targets_missed',
    )
    const unmeasured = drill({ failureReason: 'invalid_clock', outcome: 'failed', rpoMs: null })
    expect(recoveryPointMet(unmeasured)).toBeNull()
    expect(restoreDrillFinding(unmeasured, now)).toBe('last_run_failed')
  })

  it('records a run only through a verified application database URL, without exposing it', async () => {
    const password = randomBytes(12).toString('hex')
    const hosted = new URL('postgresql://recorder@db.example.test/magazine')
    hosted.password = password
    const run = backup()

    const recorded = connection()
    const connect = vi.fn((_databaseUrl: string) => recorded.connection)
    await recordOperationRun({ DATABASE_URL: `${hosted.href}?sslmode=require` }, run, connect)
    expect(new URL(connect.mock.calls[0]![0]).searchParams.get('sslmode')).toBe('verify-full')
    expect(recorded.query).toHaveBeenCalledWith(expect.stringContaining('INSERT'), [
      'backup',
      'succeeded',
      null,
      run.startedAt,
      run.finishedAt,
      null,
      null,
    ])
    expect(recorded.end).toHaveBeenCalledOnce()

    const loopback = connection()
    await recordOperationRun(
      { DATABASE_URL: 'postgresql://recorder@127.0.0.1:25442/magazine' },
      run,
      () => loopback.connection,
    )
    expect(loopback.query).toHaveBeenCalledOnce()

    // A Neon connection string as Neon gives it: the channel binding is kept, TLS still verified.
    const neon = new URL(
      'postgresql://neondb_owner@ep-quiet-lake-a1b2c3d4.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    )
    neon.password = password
    const neonRecorded = connection()
    const neonConnect = vi.fn((_databaseUrl: string) => neonRecorded.connection)
    await recordOperationRun({ DATABASE_URL: neon.href }, run, neonConnect)
    const neonUrl = new URL(neonConnect.mock.calls[0]![0])
    expect(Object.fromEntries(neonUrl.searchParams)).toEqual({
      channel_binding: 'require',
      sslmode: 'verify-full',
    })
    expect([neonUrl.hostname, neonUrl.password]).toEqual([neon.hostname, password])
    expect(neonRecorded.query).toHaveBeenCalledWith(expect.stringContaining('INSERT'), [
      'backup',
      'succeeded',
      null,
      run.startedAt,
      run.finishedAt,
      null,
      null,
    ])
    expect(neonRecorded.end).toHaveBeenCalledOnce()

    const refusals: [Record<string, string | undefined>, string][] = [
      [{}, 'not_configured'],
      [{ DATABASE_URL: '' }, 'not_configured'],
      [{ DATABASE_URL: `${hosted.href}?sslmode=disable` }, 'tls_required'],
      [{ DATABASE_URL: `${hosted.href}?sslmode=disable&channel_binding=require` }, 'tls_required'],
      [{ DATABASE_URL: `${hosted.href}?sslmode=require&host=10.0.0.1` }, 'invalid_configuration'],
      [{ DATABASE_URL: `${neon.href}&sslrootcert=/private/root.crt` }, 'invalid_configuration'],
      [{ DATABASE_URL: `${hosted.href}?channel_binding=always` }, 'invalid_configuration'],
      [{ DATABASE_URL: hosted.href.replace('postgresql:', 'mysql:') }, 'invalid_configuration'],
      [{ DATABASE_URL: `not a url ${password}` }, 'invalid_configuration'],
    ]
    for (const [environment, code] of refusals) {
      const unused = vi.fn()
      const refusal = recordOperationRun(environment, run, unused)
      await expect(refusal).rejects.toThrow(RecordError)
      await expect(refusal).rejects.toMatchObject({ code, message: code })
      expect(unused).not.toHaveBeenCalled()
    }

    const failing = connection(true)
    const failure = recordOperationRun({ DATABASE_URL: hosted.href }, run, () => failing.connection)
    await expect(failure).rejects.toMatchObject({ code: 'operation_failed' })
    await failure.catch((error: Error) => {
      expect(JSON.stringify({ message: error.message, stack: error.stack })).not.toMatch(
        new RegExp(`${password}|ECONNREFUSED|10\\.20\\.30\\.40|db\\.example`),
      )
    })
    expect(failing.end).toHaveBeenCalledOnce()

    const neverConnects = vi.fn()
    await expect(
      recordOperationRun({ DATABASE_URL: hosted.href }, backup({ rpoMs: 1 }), neverConnects),
    ).rejects.toThrow(OperationRunError)
    expect(neverConnects).not.toHaveBeenCalled()
  })
})
