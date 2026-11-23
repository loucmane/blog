import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  checkHealth,
  defaultHealthSlowMs,
  defaultHealthTimeoutMs,
  HealthCheckConfigurationError,
  type HealthProbe,
  type HealthProbes,
} from './health'
import { createLogger } from './logger'

const up: HealthProbe = { run: async () => undefined }

function capturingLogger() {
  const records: Record<string, unknown>[] = []
  const logger = createLogger({
    correlationId: 'health-request-01',
    sink: (line) => records.push(JSON.parse(line)),
  })
  return { logger, records }
}

/** A probe that answers after `ms` of fake time, and records whether it was aborted. */
function answeringAfter(ms: number, finding: 'backlog' | null = null) {
  const signals: AbortSignal[] = []
  const probe: HealthProbe = {
    run: (signal) => {
      signals.push(signal)
      return new Promise((resolve) => setTimeout(() => resolve(finding), ms))
    },
  }
  return { probe, signals }
}

function probes(overrides: Partial<HealthProbes> = {}): HealthProbes {
  return {
    backup: null,
    database: up,
    email: null,
    jobQueue: up,
    restoreDrill: null,
    search: up,
    ...overrides,
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('health checks', () => {
  it('identifies a development adapter without sending or claiming production readiness', async () => {
    const run = vi.fn(async () => undefined)
    const report = await checkHealth(probes({ email: { mode: 'development', run } }), {
      elapsed: () => 0,
      logger: capturingLogger().logger,
    })
    expect(report.checks.email).toEqual({ durationMs: 0, status: 'configured_for_development' })
    expect(report.status).toBe('ok')
    expect(run).toHaveBeenCalledOnce()
    const broken = await checkHealth(
      probes({
        email: {
          mode: 'development',
          run: async () => {
            throw new Error('unavailable')
          },
        },
      }),
      capturingLogger(),
    )
    expect(broken.checks.email).toMatchObject({ status: 'down', reason: 'unavailable' })
  })
  it('reports every subsystem, and is ok when every configured one answers in time', async () => {
    const { logger, records } = capturingLogger()

    const report = await checkHealth(probes(), {
      clock: { now: () => new Date('2026-11-03T09:00:00.000Z') },
      elapsed: () => 0,
      logger,
    })

    expect(report).toEqual({
      checkedAt: '2026-11-03T09:00:00.000Z',
      checks: {
        backup: { status: 'not_configured' },
        database: { durationMs: 0, status: 'up' },
        email: { status: 'not_configured' },
        jobQueue: { durationMs: 0, status: 'up' },
        restoreDrill: { status: 'not_configured' },
        search: { durationMs: 0, status: 'up' },
      },
      status: 'ok',
    })
    expect(records).toEqual([])
    expect([defaultHealthSlowMs, defaultHealthTimeoutMs]).toEqual([1_000, 2_000])
  })

  it('is down when the database is down or missing, and only degraded when another subsystem is', async () => {
    const { logger } = capturingLogger()
    const down: HealthProbe = { run: () => Promise.reject(new Error('refused')) }

    const databaseDown = await checkHealth(probes({ database: down }), { logger })
    const noDatabase = await checkHealth(probes({ database: null }), { logger })
    const searchDown = await checkHealth(probes({ search: down }), { logger })
    const queueDown = await checkHealth(probes({ jobQueue: down, search: null }), { logger })

    expect(databaseDown.status).toBe('down')
    expect(databaseDown.checks.database).toMatchObject({ reason: 'unavailable', status: 'down' })
    expect(noDatabase.status).toBe('down')
    expect(noDatabase.checks.database).toEqual({ status: 'not_configured' })
    expect(searchDown.status).toBe('degraded')
    expect(searchDown.checks.search).toMatchObject({ reason: 'unavailable', status: 'down' })
    expect(queueDown.status).toBe('degraded')
    expect(queueDown.checks.search).toEqual({ status: 'not_configured' })
  })

  it('tells a slow subsystem (degraded) from one that does not answer (down), each under its own limit', async () => {
    vi.useFakeTimers()
    const { logger, records } = capturingLogger()
    const slowSearch = answeringAfter(1_500)
    const silentQueue = answeringAfter(60_000)
    const quickDatabase = answeringAfter(10)

    const checking = checkHealth(
      probes({
        database: quickDatabase.probe,
        jobQueue: { ...silentQueue.probe, timeoutMs: 3_000 },
        search: { ...slowSearch.probe, slowMs: 1_000, timeoutMs: 2_000 },
      }),
      { elapsed: () => Date.now(), logger },
    )
    await vi.advanceTimersByTimeAsync(3_000)
    const report = await checking

    expect(report.checks).toEqual({
      backup: { status: 'not_configured' },
      database: { durationMs: 10, status: 'up' },
      email: { status: 'not_configured' },
      jobQueue: { durationMs: 3_000, reason: 'timeout', status: 'down' },
      restoreDrill: { status: 'not_configured' },
      search: { durationMs: 1_500, reason: 'slow', status: 'degraded' },
    })
    expect(report.status).toBe('degraded')
    // The queue probe was abandoned at its limit and told so; the others ran to the end.
    expect(silentQueue.signals[0]?.aborted).toBe(true)
    expect(slowSearch.signals[0]?.aborted).toBe(false)
    expect(records).toEqual([
      expect.objectContaining({
        check: 'jobQueue',
        correlationId: 'health-request-01',
        level: 'warn',
        message: 'health.check.timeout',
        timeoutMs: 3_000,
      }),
    ])
    // Its late answer changes nothing and is not left unhandled.
    await vi.advanceTimersByTimeAsync(60_000)
  })

  it('reports what a working probe found wrong as degraded', async () => {
    const { logger } = capturingLogger()

    const report = await checkHealth(probes({ jobQueue: { run: async () => 'needs_attention' } }), {
      elapsed: () => 0,
      logger,
    })

    expect(report.checks.jobQueue).toEqual({
      durationMs: 0,
      reason: 'needs_attention',
      status: 'degraded',
    })
    expect(report.status).toBe('degraded')
  })

  it('reports the age a probe observed, whole and never negative, beside its status and reason', async () => {
    const { logger } = capturingLogger()

    const report = await checkHealth(
      probes({
        backup: { run: async () => ({ ageMs: 3_600_000.4, finding: null }) },
        jobQueue: { run: async () => ({ finding: 'backlog' }) },
        restoreDrill: { run: async () => ({ ageMs: 40 * 86_400_000, finding: 'stale' }) },
      }),
      { elapsed: () => 0, logger },
    )
    const clamped = await checkHealth(
      probes({
        backup: { run: async () => ({ ageMs: -5, finding: null }) },
        restoreDrill: { run: async () => ({ ageMs: Number.NaN, finding: 'never_run' }) },
      }),
      { elapsed: () => 0, logger },
    )

    expect(report.checks).toMatchObject({
      backup: { ageMs: 3_600_000, durationMs: 0, status: 'up' },
      jobQueue: { durationMs: 0, reason: 'backlog', status: 'degraded' },
      restoreDrill: { ageMs: 3_456_000_000, durationMs: 0, reason: 'stale', status: 'degraded' },
    })
    expect(report.checks.jobQueue).not.toHaveProperty('ageMs')
    expect(clamped.checks.backup).toEqual({ ageMs: 0, durationMs: 0, status: 'up' })
    expect(clamped.checks.restoreDrill).toEqual({
      durationMs: 0,
      reason: 'never_run',
      status: 'degraded',
    })
  })

  it('never lets a missing, failed or unreadable backup or drill take the site down', async () => {
    const { logger } = capturingLogger()

    for (const backup of [
      { run: async () => 'last_run_failed' as const },
      { run: async () => ({ finding: 'never_run' as const }) },
      { run: () => Promise.reject(new Error('relation "operation_runs" does not exist')) },
    ]) {
      const report = await checkHealth(
        probes({ backup, restoreDrill: { run: async () => 'targets_missed' as const } }),
        { elapsed: () => 0, logger },
      )
      expect(report.status).toBe('degraded')
      expect(report.checks.database.status).toBe('up')
      expect(report.checks.restoreDrill).toEqual({
        durationMs: 0,
        reason: 'targets_missed',
        status: 'degraded',
      })
    }
  })

  it('logs a failing probe, redacted, under the correlation id, and keeps its error out of the report', async () => {
    const { logger, records } = capturingLogger()
    const failure = Object.assign(
      new Error(
        'connect ECONNREFUSED 10.20.30.40:5432 for postgres://magazine:hunter2@db.internal.example:5432/magazine',
      ),
      { hostname: 'db.internal.example' },
    )

    const report = await checkHealth(
      probes({
        database: { run: () => Promise.reject(failure) },
        search: { run: () => Promise.reject(new HealthCheckConfigurationError()) },
      }),
      { logger },
    )

    const serialized = JSON.stringify(report)
    expect(serialized).not.toMatch(/ECONNREFUSED|10\.20\.30\.40|db\.internal|hunter2|postgres/)
    expect(report.checks.database).toMatchObject({ reason: 'unavailable', status: 'down' })
    expect(report.checks.search).toMatchObject({ reason: 'misconfigured', status: 'down' })
    expect(records).toEqual([
      expect.objectContaining({
        check: 'database',
        correlationId: 'health-request-01',
        error: expect.objectContaining({
          message: expect.stringContaining('postgres://[redacted secret]@db.internal.example'),
        }),
        level: 'error',
        message: 'health.check.failed',
      }),
      expect.objectContaining({ check: 'search', message: 'health.check.failed' }),
    ])
    expect(JSON.stringify(records)).not.toContain('hunter2')
  })

  it('runs a probe that throws before returning a promise like one that rejects', async () => {
    const { logger } = capturingLogger()
    const throwing: HealthProbe = {
      run: () => {
        throw new Error('not a promise')
      },
    }

    const report = await checkHealth(probes({ search: throwing }), { logger })

    expect(report.checks.search).toMatchObject({ reason: 'unavailable', status: 'down' })
  })
})
