import type { QueryResultRow } from 'pg'

import {
  operationRun,
  type LatestOperationRuns,
  type OperationRun,
  type OperationRunStore,
} from '../operations/operation-runs'

/** The one call this store makes; a pg `Pool` provides it. */
export interface OperationRunClient {
  query<Row extends QueryResultRow = QueryResultRow>(
    text: string,
    values: readonly unknown[],
  ): Promise<{ readonly rows: readonly Row[] }>
}

interface OperationRunRow {
  failure_reason: string | null
  finished_at: Date | string
  kind: string
  outcome: string
  // bigint arrives as text from pg.
  rpo_ms: number | string | null
  rto_ms: number | string | null
  started_at: Date | string
}

const insertRun = `INSERT INTO operation_runs
  (kind, outcome, failure_reason, started_at, finished_at, rpo_ms, rto_ms)
VALUES ($1, $2, $3, $4, $5, $6, $7)`

// The latest run of each kind, by when it finished; of runs that finished together, the one
// recorded later. Each branch reads one entry of operation_runs_latest_idx.
const latestRuns = `(SELECT kind, outcome, failure_reason, started_at, finished_at, rpo_ms, rto_ms
  FROM operation_runs WHERE kind = 'backup' ORDER BY finished_at DESC, id DESC LIMIT 1)
UNION ALL
(SELECT kind, outcome, failure_reason, started_at, finished_at, rpo_ms, rto_ms
  FROM operation_runs WHERE kind = 'restore-drill' ORDER BY finished_at DESC, id DESC LIMIT 1)`

function nullableNumber(value: number | string | null): number | null {
  return value === null ? null : Number(value)
}

function mapRun(row: OperationRunRow): OperationRun {
  return operationRun({
    failureReason: row.failure_reason,
    finishedAt: new Date(row.finished_at).toISOString(),
    kind: row.kind,
    outcome: row.outcome,
    rpoMs: nullableNumber(row.rpo_ms),
    rtoMs: nullableNumber(row.rto_ms),
    startedAt: new Date(row.started_at).toISOString(),
  })
}

/**
 * Backup and restore-drill runs in the application database (migration 0011). A run is checked
 * against the table's rules before it is written, and every row read back is checked again.
 */
export class PostgresOperationRunStore implements OperationRunStore {
  constructor(private readonly client: OperationRunClient) {}

  async latest(): Promise<LatestOperationRuns> {
    const runs = (await this.client.query<OperationRunRow>(latestRuns, [])).rows.map(mapRun)
    return {
      backup: runs.find(({ kind }) => kind === 'backup') ?? null,
      restoreDrill: runs.find(({ kind }) => kind === 'restore-drill') ?? null,
    }
  }

  async record(run: OperationRun): Promise<void> {
    const checked = operationRun(run)
    await this.client.query(insertRun, [
      checked.kind,
      checked.outcome,
      checked.failureReason,
      checked.startedAt,
      checked.finishedAt,
      checked.rpoMs,
      checked.rtoMs,
    ])
  }
}
