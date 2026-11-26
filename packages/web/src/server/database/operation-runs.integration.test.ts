import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { Pool } from 'pg'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { checkHealth, defaultHealthTimeoutMs } from '../observability/health'
import { createLogger } from '../observability/logger'
import { healthProbesFor } from '../observability/runtime'
import { unreadableRun, type OperationRun } from '../operations/operation-runs'
import { recoveryTargets } from '../operations/restore-drill-contract'
import { applyContentMigrations, readContentMigrations } from './migrations'
import { PostgresContentRepository } from './postgres-content-repository'
import { PostgresOperationRunStore } from './postgres-operation-runs'

const databaseUrl = process.env.TASK42_DATABASE_URL
if (!databaseUrl) throw new Error('TASK42_DATABASE_URL is required for operation run integration')
const migrationId = '0011_operation_runs'
const now = new Date('2026-11-23T12:00:00.000Z')
const hour = 3_600_000

function run(overrides: Partial<OperationRun> & Pick<OperationRun, 'kind'>): OperationRun {
  const drill = overrides.kind === 'restore-drill'
  return {
    failureReason: null,
    finishedAt: new Date(now.valueOf() - hour).toISOString(),
    outcome: 'succeeded',
    rpoMs: drill ? 2 * hour : null,
    rtoMs: drill ? 600_000 : null,
    startedAt: new Date(now.valueOf() - 2 * hour).toISOString(),
    ...overrides,
  }
}

describe('backup and restore-drill runs on PostgreSQL', () => {
  let admin: Pool
  let pool: Pool
  let schema: string

  beforeEach(async () => {
    schema = `operation_runs_${randomUUID().replaceAll('-', '')}`
    admin = new Pool({ connectionString: databaseUrl, max: 1 })
    await admin.query(`CREATE SCHEMA "${schema}"`)
    pool = new Pool({ connectionString: databaseUrl, max: 4, options: `-c search_path=${schema}` })
  }, 60_000)

  afterEach(async () => {
    await pool.end()
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
    await admin.end()
  }, 60_000)

  async function tableExists(): Promise<boolean> {
    return (await pool.query("SELECT to_regclass('operation_runs') IS NOT NULL AS present")).rows[0]
      .present
  }

  async function ledger(): Promise<string[]> {
    return (await pool.query('SELECT id FROM content_schema_migrations ORDER BY id')).rows.map(
      ({ id }) => id,
    )
  }

  async function reverse(): Promise<void> {
    const down = await readFile(
      path.join(process.cwd(), `packages/web/migrations/${migrationId}.down.sql`),
      'utf8',
    )
    const connection = await pool.connect()
    try {
      await connection.query(down)
    } catch (error) {
      await connection.query('ROLLBACK')
      throw error
    } finally {
      connection.release()
    }
  }

  it('reverses 0011 while no run is recorded and refuses once one is', async () => {
    const migrations = await readContentMigrations()
    await applyContentMigrations(
      pool,
      migrations.filter(({ id }) => id < migrationId),
    )
    expect(await tableExists()).toBe(false)
    expect((await applyContentMigrations(pool, migrations)).applied).toEqual([migrationId])
    expect(await tableExists()).toBe(true)

    await reverse()
    expect(await tableExists()).toBe(false)
    expect(await ledger()).toEqual(
      migrations.filter(({ id }) => id < migrationId).map(({ id }) => id),
    )

    expect((await applyContentMigrations(pool, migrations)).applied).toEqual([migrationId])
    const store = new PostgresOperationRunStore(pool)
    await store.record(run({ kind: 'backup' }))
    await expect(reverse()).rejects.toThrow(
      'Cannot reverse operation runs while recorded backup or restore-drill runs exist.',
    )
    expect(await tableExists()).toBe(true)
    expect(await ledger()).toContain(migrationId)
    expect((await store.latest()).backup).toEqual(run({ kind: 'backup' }))
  }, 60_000)

  it('keeps only runs that follow the table rules and reads the latest of each kind', async () => {
    await applyContentMigrations(pool, await readContentMigrations())
    const store = new PostgresOperationRunStore(pool)
    expect(await store.latest()).toEqual({ backup: null, restoreDrill: null })

    const older = run({
      finishedAt: new Date(now.valueOf() - 30 * hour).toISOString(),
      kind: 'backup',
      startedAt: new Date(now.valueOf() - 31 * hour).toISOString(),
    })
    const failed = run({ failureReason: 'missing_object', kind: 'backup', outcome: 'failed' })
    const sameFinishLater = run({ kind: 'backup' })
    const drill = run({
      failureReason: 'rto_exceeded',
      kind: 'restore-drill',
      outcome: 'failed',
      // Beyond 2^31 milliseconds: the columns hold any measured recovery, as bigint.
      rpoMs: 40 * 24 * hour,
      rtoMs: recoveryTargets.rtoMilliseconds + 1,
    })
    for (const recorded of [older, failed, drill]) await store.record(recorded)
    expect(await store.latest()).toEqual({ backup: failed, restoreDrill: drill })
    // Of runs that finished together, the one recorded later is the latest.
    await store.record(sameFinishLater)
    expect((await store.latest()).backup).toEqual(sameFinishLater)

    // The table refuses what the store would, even from a caller that skips the store.
    const insert = (values: unknown[]) =>
      pool.query(
        `INSERT INTO operation_runs (kind, outcome, failure_reason, started_at, finished_at, rpo_ms, rto_ms)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        values,
      )
    const started = now.toISOString()
    const unsafe = String(Number.MAX_SAFE_INTEGER + 1)
    for (const values of [
      ['backup', 'failed', null, started, started, null, null],
      ['backup', 'succeeded', 'operation_failed', started, started, null, null],
      ['backup', 'failed', 'driver: connection refused', started, started, null, null],
      ['backup', 'succeeded', null, started, started, 1, null],
      ['restore-drill', 'succeeded', null, started, started, null, 1],
      ['restore-drill', 'succeeded', null, started, started, -1, 1],
      ['backup', 'succeeded', null, started, new Date(now.valueOf() - 1).toISOString(), null, null],
      ['export', 'succeeded', null, started, started, null, null],
      // Nor what the store could not read back: infinite or five-digit-year instants, and
      // measurements past Number.MAX_SAFE_INTEGER.
      ['backup', 'succeeded', null, 'infinity', 'infinity', null, null],
      ['backup', 'succeeded', null, '-infinity', started, null, null],
      ['backup', 'succeeded', null, started, 'infinity', null, null],
      ['backup', 'succeeded', null, '0001-12-31 00:00:00+00 BC', started, null, null],
      ['backup', 'succeeded', null, started, '10000-01-01 00:00:00+00', null, null],
      ['restore-drill', 'succeeded', null, started, started, unsafe, 1],
      ['restore-drill', 'succeeded', null, started, started, 1, unsafe],
    ]) {
      await expect(insert(values)).rejects.toMatchObject({ code: '23514' })
    }
    // The largest measurement the store reads back exactly is still kept, and read back exactly.
    const largest = String(Number.MAX_SAFE_INTEGER)
    await insert(['restore-drill', 'succeeded', null, started, started, largest, largest])
    expect((await store.latest()).restoreDrill).toMatchObject({
      rpoMs: Number.MAX_SAFE_INTEGER,
      rtoMs: Number.MAX_SAFE_INTEGER,
    })
    expect(
      (await pool.query('SELECT count(*)::int AS runs FROM operation_runs')).rows[0].runs,
    ).toBe(5)
  }, 60_000)

  it('reads a latest row the table rules no longer describe as unreadable, and only its check as down', async () => {
    await applyContentMigrations(pool, await readContentMigrations())
    const store = new PostgresOperationRunStore(pool)
    await store.record(run({ kind: 'backup' }))
    await store.record(run({ kind: 'restore-drill' }))
    // As a later release could: widen the failure codes, then record a run with a new one.
    const constraint = (
      await pool.query(
        `SELECT conname FROM pg_constraint
         WHERE conrelid = 'operation_runs'::regclass AND contype = 'c'
           AND pg_get_constraintdef(oid) LIKE '%invalid_configuration%'`,
      )
    ).rows.map(({ conname }) => conname)
    expect(constraint).toHaveLength(1)
    await pool.query(`ALTER TABLE operation_runs DROP CONSTRAINT "${constraint[0]}"`)
    await pool.query(
      `INSERT INTO operation_runs (kind, outcome, failure_reason, started_at, finished_at)
       VALUES ('restore-drill', 'failed', 'a_code_from_a_later_release', $1, $1)`,
      [now.toISOString()],
    )

    expect(await store.latest()).toEqual({
      backup: run({ kind: 'backup' }),
      restoreDrill: unreadableRun,
    })
    const logger = createLogger({ correlationId: 'operation-runs-integration', sink: () => {} })
    const report = await checkHealth(
      healthProbesFor(
        { pool, repository: new PostgresContentRepository(pool) },
        { now: () => now },
      ),
      { elapsed: () => 0, logger },
    )
    expect(report.status).toBe('degraded')
    // The backup is aged from when it started, two hours before `now`.
    expect(report.checks).toMatchObject({
      backup: { ageMs: 2 * hour, status: 'up' },
      database: { status: 'up' },
      restoreDrill: { reason: 'unavailable', status: 'down' },
    })
  }, 60_000)

  it('ends a read that waits on a stalled table in time, leaves nothing waiting and keeps its limit to itself', async () => {
    await applyContentMigrations(pool, await readContentMigrations())
    const store = new PostgresOperationRunStore(pool)
    await store.record(run({ kind: 'backup' }))
    const waiting = async () =>
      (
        await pool.query(
          `SELECT count(*)::int AS waiting FROM pg_locks l
           JOIN pg_class c ON c.oid = l.relation
           JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = $1 AND c.relname = 'operation_runs' AND NOT l.granted`,
          [schema],
        )
      ).rows[0].waiting
    // Another session holds the table, as a stalled migration or vacuum could.
    const holder = await admin.connect()
    try {
      await holder.query('BEGIN')
      await holder.query(`LOCK TABLE "${schema}".operation_runs IN ACCESS EXCLUSIVE MODE`)

      const started = performance.now()
      await expect(store.latest()).rejects.toMatchObject({ name: 'TimeoutError' })
      expect(performance.now() - started).toBeLessThan(defaultHealthTimeoutMs)
      const logger = createLogger({ correlationId: 'operation-runs-integration', sink: () => {} })
      const report = await checkHealth(
        healthProbesFor({ pool, repository: new PostgresContentRepository(pool) }),
        { logger },
      )
      expect(report.checks).toMatchObject({
        backup: { reason: 'timeout', status: 'down' },
        database: { status: 'up' },
        restoreDrill: { reason: 'timeout', status: 'down' },
      })
      // PostgreSQL ended the abandoned reads itself, while the table is still held.
      await vi.waitFor(async () => expect(await waiting()).toBe(0), {
        interval: 100,
        timeout: 5_000,
      })
    } finally {
      await holder.query('ROLLBACK')
      holder.release()
    }
    expect((await store.latest()).backup).toEqual(run({ kind: 'backup' }))

    // The read's statement limit ends with it: the connection keeps its own setting.
    const single = new Pool({
      connectionString: databaseUrl,
      max: 1,
      options: `-c search_path=${schema}`,
    })
    try {
      const setting = async () =>
        (await single.query('SHOW statement_timeout')).rows[0].statement_timeout
      const before = await setting()
      expect(before).not.toBe('1s')
      expect((await new PostgresOperationRunStore(single).latest()).backup).toEqual(
        run({ kind: 'backup' }),
      )
      expect(await setting()).toBe(before)
    } finally {
      await single.end()
    }
  }, 60_000)

  it('reports fresh, stale, failed and never-run backups and drills through the health check', async () => {
    await applyContentMigrations(pool, await readContentMigrations())
    const store = new PostgresOperationRunStore(pool)
    const logger = createLogger({ correlationId: 'operation-runs-integration', sink: () => {} })
    const report = async (at: Date) =>
      (
        await checkHealth(
          healthProbesFor(
            { pool, repository: new PostgresContentRepository(pool) },
            { now: () => at },
          ),
          { elapsed: () => 0, logger },
        )
      ).checks

    expect(await report(now)).toMatchObject({
      backup: { reason: 'never_run', status: 'degraded' },
      restoreDrill: { reason: 'never_run', status: 'degraded' },
    })

    // Started 24 h 10 min ago and finished 23 h 50 min ago: its snapshot is past the target.
    const ago = (milliseconds: number) => new Date(now.valueOf() - milliseconds).toISOString()
    await store.record(
      run({
        finishedAt: ago(23 * hour + 50 * 60_000),
        kind: 'backup',
        startedAt: ago(24 * hour + 10 * 60_000),
      }),
    )
    expect(await report(now)).toMatchObject({
      backup: { ageMs: 24 * hour + 10 * 60_000, reason: 'stale', status: 'degraded' },
      restoreDrill: { reason: 'never_run', status: 'degraded' },
    })

    await store.record(run({ kind: 'backup' }))
    await store.record(run({ kind: 'restore-drill' }))
    // A backup is aged from when it started, a drill from when it finished.
    expect(await report(now)).toMatchObject({
      backup: { ageMs: 2 * hour, status: 'up' },
      restoreDrill: { ageMs: hour, status: 'up' },
    })
    const later = new Date(now.valueOf() + 36 * 24 * hour)
    expect(await report(later)).toMatchObject({
      backup: { reason: 'stale', status: 'degraded' },
      restoreDrill: { reason: 'stale', status: 'degraded' },
    })

    const finishedAt = now.toISOString()
    await store.record(
      run({ failureReason: 'checksum_mismatch', finishedAt, kind: 'backup', outcome: 'failed' }),
    )
    await store.record(
      run({
        failureReason: 'export_invalid',
        finishedAt,
        kind: 'restore-drill',
        outcome: 'failed',
      }),
    )
    expect(await report(now)).toMatchObject({
      backup: { ageMs: 2 * hour, reason: 'last_run_failed', status: 'degraded' },
      restoreDrill: { ageMs: 0, reason: 'last_run_failed', status: 'degraded' },
    })
  }, 60_000)
})
