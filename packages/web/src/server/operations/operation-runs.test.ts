import { randomBytes } from 'node:crypto'

import { describe, expect, it, vi } from 'vitest'

import { PostgresOperationRunStore } from '../database/postgres-operation-runs'
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
  runAgeMs,
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
    const query = vi.fn(async (text: string, _values: readonly unknown[]) => ({
      rows: text.startsWith('INSERT')
        ? []
        : [
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
          ],
    }))
    const store = new PostgresOperationRunStore({ query } as never)

    await store.record(drill())
    expect(query).toHaveBeenLastCalledWith(expect.stringContaining('INSERT INTO operation_runs'), [
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
    expect(query.mock.calls.at(-1)?.[0]).toMatch(/ORDER BY finished_at DESC, id DESC LIMIT 1/)

    const calls = query.mock.calls.length
    await expect(store.record(drill({ rtoMs: null }))).rejects.toThrow(OperationRunError)
    expect(query.mock.calls).toHaveLength(calls)
    const empty = new PostgresOperationRunStore({ query: async () => ({ rows: [] }) } as never)
    expect(await empty.latest()).toEqual({ backup: null, restoreDrill: null })
    const corrupt = new PostgresOperationRunStore({
      query: async () => ({
        rows: [
          {
            failure_reason: null,
            finished_at: ago(hour),
            kind: 'export',
            outcome: 'succeeded',
            rpo_ms: null,
            rto_ms: null,
            started_at: ago(2 * hour),
          },
        ],
      }),
    } as never)
    await expect(corrupt.latest()).rejects.toThrow(OperationRunError)
  })

  it('tells a fresh backup from a stale, failed or missing one', () => {
    expect(backupFinding(null, now)).toBe('never_run')
    expect(backupFinding(backup({ finishedAt: ago(hour) }), now)).toBeNull()
    const limit = backup({
      finishedAt: ago(recoveryTargets.rpoMilliseconds),
      startedAt: ago(recoveryTargets.rpoMilliseconds + 60_000),
    })
    expect(backupFinding(limit, now)).toBeNull()
    const stale = backup({
      finishedAt: ago(recoveryTargets.rpoMilliseconds + 1),
      startedAt: ago(recoveryTargets.rpoMilliseconds + 60_000),
    })
    expect(backupFinding(stale, now)).toBe('stale')
    // A failure is reported even when an earlier backup would still be fresh.
    expect(backupFinding(backup({ failureReason: 'missing_object', outcome: 'failed' }), now)).toBe(
      'last_run_failed',
    )
    expect(runAgeMs(stale, now)).toBe(recoveryTargets.rpoMilliseconds + 1)
    expect(runAgeMs(null, now)).toBeNull()
    // A run recorded by a clock slightly ahead is not older than now.
    expect(runAgeMs(backup({ finishedAt: ago(-5_000), startedAt: ago(0) }), now)).toBe(0)
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

    const refusals: [Record<string, string | undefined>, string][] = [
      [{}, 'not_configured'],
      [{ DATABASE_URL: '' }, 'not_configured'],
      [{ DATABASE_URL: `${hosted.href}?sslmode=disable` }, 'tls_required'],
      [{ DATABASE_URL: `${hosted.href}?sslmode=require&host=10.0.0.1` }, 'invalid_configuration'],
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
