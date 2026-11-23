import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { Pool } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { checkHealth } from '../observability/health'
import { createLogger } from '../observability/logger'
import { healthProbesFor } from '../observability/runtime'
import type { OperationRun } from '../operations/operation-runs'
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
    for (const values of [
      ['backup', 'failed', null, started, started, null, null],
      ['backup', 'succeeded', 'operation_failed', started, started, null, null],
      ['backup', 'failed', 'driver: connection refused', started, started, null, null],
      ['backup', 'succeeded', null, started, started, 1, null],
      ['restore-drill', 'succeeded', null, started, started, null, 1],
      ['restore-drill', 'succeeded', null, started, started, -1, 1],
      ['backup', 'succeeded', null, started, new Date(now.valueOf() - 1).toISOString(), null, null],
      ['export', 'succeeded', null, started, started, null, null],
    ]) {
      await expect(insert(values)).rejects.toMatchObject({ code: '23514' })
    }
    expect(
      (await pool.query('SELECT count(*)::int AS runs FROM operation_runs')).rows[0].runs,
    ).toBe(4)
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

    await store.record(run({ kind: 'backup' }))
    await store.record(run({ kind: 'restore-drill' }))
    expect(await report(now)).toMatchObject({
      backup: { ageMs: hour, status: 'up' },
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
      backup: { ageMs: 0, reason: 'last_run_failed', status: 'degraded' },
      restoreDrill: { ageMs: 0, reason: 'last_run_failed', status: 'degraded' },
    })
  }, 60_000)
})
