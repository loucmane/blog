import type { Pool } from 'pg'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { selectedRuntime } = vi.hoisted(() => ({ selectedRuntime: vi.fn() }))
vi.mock('../owner/runtime', () => ({ getOwnerRuntime: selectedRuntime }))

import { InMemoryContentRepository } from '../content/in-memory-repository'
import { PostgresContentRepository } from '../database/postgres-content-repository'
import { latestRunsTimeoutMs, PostgresOperationRunStore } from '../database/postgres-operation-runs'
import { PostgresOutboxStore } from '../database/postgres-outbox-store'
import type { OperationRunStore } from '../operations/operation-runs'
import { InMemoryOutboxStore } from '../outbox/in-memory-outbox-store'
import { OwnerConfigurationError, resolveOwnerTimeZone } from '../owner/config'
import { checkHealth, defaultHealthTimeoutMs } from './health'
import { createLogger } from './logger'
import {
  healthProbesFor,
  jobRecordsFor,
  operationRunsFor,
  outboxStoreFor,
  ownerJobViewFor,
  resolveHealthProbes,
} from './runtime'

const now = new Date('2026-11-03T12:00:00.000Z')
const hour = 3_600_000

function silentLogger() {
  const records: Record<string, unknown>[] = []
  const logger = createLogger({
    correlationId: 'runtime-test-0001',
    sink: (line) => records.push(JSON.parse(line)),
  })
  return { logger, records }
}

/** Stored rows of operation_runs, finished `ageMs` before `at`. */
function runRows(at: Date, ageMs: number, drill: Partial<Record<string, unknown>> = {}) {
  const finished = new Date(at.valueOf() - ageMs)
  const started = new Date(finished.valueOf() - 60_000)
  return [
    {
      failure_reason: null,
      finished_at: finished,
      kind: 'backup',
      outcome: 'succeeded',
      rpo_ms: null,
      rto_ms: null,
      started_at: started,
    },
    {
      failure_reason: null,
      finished_at: finished,
      kind: 'restore-drill',
      outcome: 'succeeded',
      rpo_ms: String(2 * hour),
      rto_ms: '600000',
      started_at: started,
      ...drill,
    },
  ]
}

/**
 * A pool answering the probes' reads: the publication version, an empty search, empty tables and
 * the given backup and restore-drill runs, by default a fresh one of each. The runs come as pg
 * answers the store's two-statement read, unless `readRuns` answers instead.
 */
function answeringPool(
  runs: readonly Record<string, unknown>[] = runRows(new Date(), 60_000),
  readRuns: () => Promise<unknown> = async () => [
    { command: 'SET', rowCount: null, rows: [] },
    { command: 'SELECT', rowCount: runs.length, rows: runs },
  ],
) {
  const query = vi.fn(async (text: string, _values?: readonly unknown[]) => {
    if (text.includes('content_publication_state')) return { rowCount: 1, rows: [{ version: '4' }] }
    if (text.includes('article_search_documents')) {
      return { rowCount: 1, rows: [{ article_id: null, total: 0 }] }
    }
    if (text.includes('FROM operation_runs')) return readRuns()
    return { rowCount: 0, rows: [] }
  })
  const release = vi.fn()
  const pool = {
    connect: vi.fn(async () => ({ query, release })),
    options: {},
    query,
  } as unknown as Pool
  const runReads = () => query.mock.calls.filter(([text]) => text.includes('FROM operation_runs'))
  return { pool, query, release, runReads }
}

afterEach(() => {
  vi.useRealTimers()
})

async function seedPending(repository: InMemoryContentRepository, createdAt: string) {
  await repository.transaction((transaction) =>
    transaction.saveOutboxEvent({
      aggregateId: 'article-lantern',
      attempts: 0,
      createdAt,
      id: `outbox-${createdAt}`,
      lastError: null,
      payload: {},
      status: 'pending',
      type: 'search.upsert',
      updatedAt: createdAt,
    }),
  )
}

describe('observability runtime', () => {
  it('reads the outbox through the store that belongs to the runtime’s content store', () => {
    expect(outboxStoreFor(new PostgresContentRepository(answeringPool().pool))).toBeInstanceOf(
      PostgresOutboxStore,
    )
    expect(outboxStoreFor(new InMemoryContentRepository())).toBeInstanceOf(InMemoryOutboxStore)
  })

  it('reads the job view’s records from the runtime’s content store', async () => {
    const repository = new InMemoryContentRepository()
    await seedPending(repository, '2026-11-03T11:59:00.000Z')

    const records = await jobRecordsFor({ repository }).read()

    expect(records).toMatchObject({
      articles: [],
      deadLetters: [],
      outboxEvents: [{ id: 'outbox-2026-11-03T11:59:00.000Z', status: 'pending' }],
      publicationJobs: [],
    })
  })

  it('shows the job view in the owner’s time zone, from the settings or the configured default', async () => {
    const repository = new InMemoryContentRepository()
    await seedPending(repository, '2026-11-03T09:00:00.000Z')
    const withSettings = {
      repository,
      workspace: { publicationSettings: async () => ({ ownerTimeZone: 'UTC' }) },
    }
    const withoutSettings = { repository, workspace: { publicationSettings: async () => null } }

    const configured = await ownerJobViewFor(withSettings as never, { now })
    const fallback = await ownerJobViewFor(withoutSettings as never, { now })

    expect(configured.timeZone).toBe('UTC')
    expect(configured.view.jobs['waiting-to-send'][0]?.summary).toBe('Queued at 3 Nov 2026, 09:00.')
    expect(fallback.timeZone).toBe(resolveOwnerTimeZone())
    expect(fallback.view.counts['waiting-to-send']).toBe(1)
    // Without a database there is no backup or restore drill to show.
    expect(configured.recovery).toBeNull()
  })

  it('shows the last backup and restore drill from PostgreSQL in the owner’s time zone', async () => {
    const { pool } = answeringPool(runRows(now, 2 * hour))
    const runtime = {
      pool,
      repository: new InMemoryContentRepository(),
      workspace: { publicationSettings: async () => ({ ownerTimeZone: 'UTC' }) },
    }

    const { recovery } = await ownerJobViewFor(runtime as never, { now })

    expect(operationRunsFor(runtime)).toBeInstanceOf(PostgresOperationRunStore)
    expect(operationRunsFor({ pool: null })).toBeNull()
    expect(recovery?.backup).toMatchObject({
      ageMs: 2 * hour,
      finding: null,
      summary: 'The last backup finished at 3 Nov 2026, 10:00 and worked.',
    })
    expect(recovery?.restoreDrill).toMatchObject({ finding: null, title: 'Restore drill' })
  })

  it('checks the database and job queue of owner test mode with console email and no search', async () => {
    const repository = new InMemoryContentRepository()
    const { logger } = silentLogger()
    const clock = { now: () => now }

    const fresh = await checkHealth(healthProbesFor({ pool: null, repository }, clock), { logger })
    await seedPending(repository, '2026-11-03T11:40:00.000Z')
    const stalled = await checkHealth(healthProbesFor({ pool: null, repository }, clock), {
      logger,
    })

    expect(fresh.status).toBe('ok')
    expect(fresh.checks).toEqual({
      backup: { status: 'not_configured' },
      database: { durationMs: expect.any(Number), status: 'up' },
      email: { durationMs: expect.any(Number), status: 'configured_for_development' },
      jobQueue: { durationMs: expect.any(Number), status: 'up' },
      restoreDrill: { status: 'not_configured' },
      search: { status: 'not_configured' },
    })
    expect(stalled.status).toBe('degraded')
    expect(stalled.checks.jobQueue).toMatchObject({ reason: 'backlog', status: 'degraded' })
  })

  it('checks PostgreSQL with its publication version, one small search and the job queue', async () => {
    const { pool, query, runReads } = answeringPool()
    const { logger, records } = silentLogger()

    const report = await checkHealth(
      healthProbesFor({ pool, repository: new PostgresContentRepository(pool) }),
      { logger },
    )

    // The backup and restore-drill checks share one read of the runs.
    expect(runReads()).toHaveLength(1)
    expect(records).toEqual([])
    expect(report.status).toBe('ok')
    expect(report.checks).toMatchObject({
      backup: { ageMs: expect.any(Number), status: 'up' },
      database: { status: 'up' },
      email: { status: 'configured_for_development' },
      jobQueue: { status: 'up' },
      restoreDrill: { ageMs: expect.any(Number), status: 'up' },
      search: { status: 'up' },
    })
    const searches = query.mock.calls.filter(([text]) => text.includes('websearch_to_tsquery'))
    expect(searches.map(([, values]) => values)).toEqual([
      ['health', 1, 0],
      ['health', 1, 0],
    ])
    expect(query.mock.calls.map(([text]) => text)).toContain(
      'SELECT version FROM content_publication_state WHERE id = 1',
    )
  })

  it('reports a stale, failed, off-target or never-run backup and drill as degraded, never down', async () => {
    const { logger, records } = silentLogger()
    const clock = { now: () => now }
    const check = async (runs: readonly Record<string, unknown>[]) => {
      const { pool } = answeringPool(runs)
      return checkHealth(
        healthProbesFor({ pool, repository: new PostgresContentRepository(pool) }, clock),
        { elapsed: () => 0, logger },
      )
    }

    const never = await check([])
    const stale = await check(runRows(now, 40 * 24 * hour))
    const [backupRow, drillRow] = runRows(now, hour)
    const failed = await check([
      { ...backupRow, failure_reason: 'missing_object', outcome: 'failed' },
      { ...drillRow, failure_reason: 'rpo_exceeded', outcome: 'failed' },
    ])
    const lost = await check([{ ...drillRow, failure_reason: 'export_invalid', outcome: 'failed' }])

    expect(records).toEqual([])
    for (const report of [never, stale, failed, lost]) {
      expect(report.status).toBe('degraded')
      expect(report.checks.database.status).toBe('up')
    }
    expect(never.checks).toMatchObject({
      backup: { reason: 'never_run', status: 'degraded' },
      restoreDrill: { reason: 'never_run', status: 'degraded' },
    })
    expect(never.checks.backup).not.toHaveProperty('ageMs')
    expect(stale.checks).toMatchObject({
      backup: { ageMs: 40 * 24 * hour, reason: 'stale', status: 'degraded' },
      restoreDrill: { ageMs: 40 * 24 * hour, reason: 'stale', status: 'degraded' },
    })
    expect(failed.checks).toMatchObject({
      backup: { ageMs: hour, reason: 'last_run_failed', status: 'degraded' },
      restoreDrill: { ageMs: hour, reason: 'targets_missed', status: 'degraded' },
    })
    expect(lost.checks).toMatchObject({
      backup: { reason: 'never_run', status: 'degraded' },
      restoreDrill: { reason: 'last_run_failed', status: 'degraded' },
    })
    // The public report carries only status, reason, the probe's duration and the run's age.
    for (const report of [never, stale, failed, lost]) {
      for (const result of [report.checks.backup, report.checks.restoreDrill]) {
        expect(
          Object.keys(result).every((key) =>
            ['ageMs', 'durationMs', 'reason', 'status'].includes(key),
          ),
        ).toBe(true)
      }
    }
    expect(JSON.stringify(failed)).not.toMatch(/missing_object|rpo_exceeded|started|finished/)
  })

  it('times both recovery checks out on one stalled read, and gives that read up once both have', async () => {
    vi.useFakeTimers()
    const { logger, records } = silentLogger()
    const { pool } = answeringPool()
    const signals: AbortSignal[] = []
    const stalled: OperationRunStore = {
      latest: vi.fn((signal?: AbortSignal) => {
        if (signal) signals.push(signal)
        return new Promise<never>(() => undefined)
      }),
      record: vi.fn(),
    }

    const checking = checkHealth(
      healthProbesFor(
        { pool, repository: new PostgresContentRepository(pool) },
        undefined,
        stalled,
      ),
      { elapsed: () => Date.now(), logger },
    )
    await vi.advanceTimersByTimeAsync(defaultHealthTimeoutMs - 1)
    expect(signals.map(({ aborted }) => aborted)).toEqual([false])
    await vi.advanceTimersByTimeAsync(1)
    const report = await checking

    expect(stalled.latest).toHaveBeenCalledOnce()
    expect(signals.map(({ aborted }) => aborted)).toEqual([true])
    expect(report.checks).toMatchObject({
      backup: { durationMs: defaultHealthTimeoutMs, reason: 'timeout', status: 'down' },
      database: { status: 'up' },
      restoreDrill: { durationMs: defaultHealthTimeoutMs, reason: 'timeout', status: 'down' },
    })
    expect(report.status).toBe('degraded')
    expect(records.map(({ check, message }) => [check, message])).toEqual([
      ['backup', 'health.check.timeout'],
      ['restoreDrill', 'health.check.timeout'],
    ])
  })

  it('gives up the runs read of a stalled database before the health limit, closing its connection', async () => {
    vi.useFakeTimers()
    const { logger, records } = silentLogger()
    const { pool, release, runReads } = answeringPool([], () => new Promise(() => undefined))

    const checking = checkHealth(
      healthProbesFor({ pool, repository: new PostgresContentRepository(pool) }),
      { elapsed: () => Date.now(), logger },
    )
    await vi.advanceTimersByTimeAsync(latestRunsTimeoutMs)
    const report = await checking

    expect(runReads()).toHaveLength(1)
    expect(release).toHaveBeenCalledWith(true)
    expect(report.checks).toMatchObject({
      backup: { durationMs: latestRunsTimeoutMs, reason: 'timeout', status: 'down' },
      database: { status: 'up' },
      restoreDrill: { durationMs: latestRunsTimeoutMs, reason: 'timeout', status: 'down' },
    })
    expect(records).toEqual([
      expect.objectContaining({ check: 'backup', level: 'warn', message: 'health.check.timeout' }),
      expect.objectContaining({ check: 'restoreDrill', message: 'health.check.timeout' }),
    ])
  })

  it('reports a latest run that cannot be read back as unavailable, for its own check only', async () => {
    const { logger, records } = silentLogger()
    const [backupRow, drillRow] = runRows(now, hour)
    const later = ['a', 'code', 'from', 'a', 'later', 'release'].join('_')
    const { pool } = answeringPool([
      backupRow!,
      { ...drillRow, failure_reason: later, outcome: 'failed' },
    ])

    const report = await checkHealth(
      healthProbesFor(
        { pool, repository: new PostgresContentRepository(pool) },
        { now: () => now },
      ),
      { elapsed: () => 0, logger },
    )

    expect(report.status).toBe('degraded')
    expect(report.checks.backup).toEqual({ ageMs: hour, durationMs: 0, status: 'up' })
    expect(report.checks.restoreDrill).toEqual({
      durationMs: 0,
      reason: 'unavailable',
      status: 'down',
    })
    expect(records).toEqual([
      expect.objectContaining({
        check: 'restoreDrill',
        error: expect.objectContaining({ name: 'OperationRunError' }),
        message: 'health.check.failed',
      }),
    ])
    expect(JSON.stringify([report, records])).not.toContain(later)
  })

  it('still shows the job view when its backup and drill cannot be read, saying so', async () => {
    const { logger, records } = silentLogger()
    const [backupRow, drillRow] = runRows(now, hour)
    const runtime = (pool: Pool) => ({
      pool,
      repository: new InMemoryContentRepository(),
      workspace: { publicationSettings: async () => ({ ownerTimeZone: 'UTC' }) },
    })
    const missing = answeringPool([], async () => {
      throw Object.assign(new Error('relation "operation_runs" does not exist'), { code: '42P01' })
    })
    const unreadable = answeringPool([{ ...backupRow, outcome: 'paused' }, drillRow!])

    const failed = await ownerJobViewFor(runtime(missing.pool) as never, { logger, now })
    const partly = await ownerJobViewFor(runtime(unreadable.pool) as never, { now })

    expect(failed.view.counts['needs-attention']).toBe(0)
    expect(failed.recovery?.backup).toMatchObject({
      finding: 'unavailable',
      lastRun: null,
      summary: 'The site could not read its record of the last backup.',
    })
    expect(failed.recovery?.restoreDrill).toMatchObject({
      finding: 'unavailable',
      lastRun: null,
      summary: 'The site could not read its record of the last restore drill.',
    })
    expect(records).toEqual([
      expect.objectContaining({ level: 'error', message: 'owner.jobs.recovery.failed' }),
    ])
    expect(partly.recovery?.backup).toMatchObject({ finding: 'unavailable', lastRun: null })
    expect(partly.recovery?.restoreDrill).toMatchObject({ finding: null, title: 'Restore drill' })
  })

  it('checks the runtime the application selected', async () => {
    const repository = new InMemoryContentRepository()
    selectedRuntime.mockReturnValueOnce({ pool: null, repository })

    const probes = resolveHealthProbes()

    expect(probes.search).toBeNull()
    expect(probes.email).toMatchObject({ mode: 'development', run: expect.any(Function) })
    expect((await checkHealth(probes, silentLogger())).status).toBe('ok')
  })

  it('reports every check that needs the runtime as misconfigured when its configuration is wrong', async () => {
    selectedRuntime.mockImplementationOnce(() => {
      throw new OwnerConfigurationError('The owner workspace requires PostgreSQL.')
    })
    const { logger, records } = silentLogger()

    const report = await checkHealth(resolveHealthProbes(), { logger })

    expect(report.status).toBe('down')
    expect(report.checks).toMatchObject({
      backup: { reason: 'misconfigured', status: 'down' },
      database: { reason: 'misconfigured', status: 'down' },
      email: { status: 'not_configured' },
      jobQueue: { reason: 'misconfigured', status: 'down' },
      restoreDrill: { reason: 'misconfigured', status: 'down' },
      search: { reason: 'misconfigured', status: 'down' },
    })
    expect(records[0]).toMatchObject({
      check: 'database',
      error: {
        cause: expect.objectContaining({ message: 'The owner workspace requires PostgreSQL.' }),
        name: 'HealthCheckConfigurationError',
      },
    })
  })

  it('knows a configuration error by its code, as one from another copy of the module carries', async () => {
    selectedRuntime.mockImplementationOnce(() => {
      throw Object.assign(new Error('Media storage requires both bucket and region.'), {
        code: 'owner_configuration',
      })
    })

    const report = await checkHealth(resolveHealthProbes(), silentLogger())

    expect(report.checks.database).toMatchObject({ reason: 'misconfigured', status: 'down' })
  })

  it('reports those checks as unavailable when the runtime fails for another reason', async () => {
    selectedRuntime.mockImplementationOnce(() => {
      throw new Error('the pool could not be created')
    })

    const report = await checkHealth(resolveHealthProbes(), silentLogger())

    expect(report.checks.database).toMatchObject({ reason: 'unavailable', status: 'down' })
    expect(report.checks.search).toMatchObject({ reason: 'unavailable', status: 'down' })
  })
})
