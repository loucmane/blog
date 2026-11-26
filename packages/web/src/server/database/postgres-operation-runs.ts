import type { QueryResultRow } from 'pg'

import {
  operationRun,
  unreadableRun,
  type LatestOperationRun,
  type LatestOperationRuns,
  type OperationRun,
  type OperationRunStore,
} from '../operations/operation-runs'

/** The call `record` makes; a pg `Pool` provides it. */
export interface OperationRunClient {
  query<Row extends QueryResultRow = QueryResultRow>(
    text: string,
    values: readonly unknown[],
  ): Promise<{ readonly rows: readonly Row[] }>
}

/** A connection `latest` takes from the pool for its one read; a pg `PoolClient` is one. */
export interface OperationRunConnection {
  query(text: string): Promise<unknown>
  /** Returns the connection to the pool, or with `true` closes it instead. */
  release(destroy?: boolean): void
}

/** Where the store writes runs and reads the latest of each kind; a pg `Pool` is one. */
export interface OperationRunPool extends OperationRunClient {
  connect(): Promise<OperationRunConnection>
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

/**
 * How long reading the latest runs may take, from asking the pool for a connection to the last
 * row. It is under the health check's 2-second limit, so a stalled database fails the read in time
 * and keeps little of it waiting: at most one connection request per pool (see
 * `pooledConnection`), and a statement still running loses its connection. PostgreSQL itself ends
 * the statement after `latestRunsStatementTimeoutMs`.
 */
export const latestRunsTimeoutMs = 1_500
export const latestRunsStatementTimeoutMs = 1_000

const insertRun = `INSERT INTO operation_runs
  (kind, outcome, failure_reason, started_at, finished_at, rpo_ms, rto_ms)
VALUES ($1, $2, $3, $4, $5, $6, $7)`

// The latest run of each kind, by when it finished; of runs that finished together, the one
// recorded later. Each branch reads one entry of operation_runs_latest_idx. Both statements go in
// one simple-protocol message, so they share an implicit transaction: SET LOCAL limits this read
// alone, and the read costs one round trip.
const latestRuns = `SET LOCAL statement_timeout = '${latestRunsStatementTimeoutMs}ms';
(SELECT kind, outcome, failure_reason, started_at, finished_at, rpo_ms, rto_ms
  FROM operation_runs WHERE kind = 'backup' ORDER BY finished_at DESC, id DESC LIMIT 1)
UNION ALL
(SELECT kind, outcome, failure_reason, started_at, finished_at, rpo_ms, rto_ms
  FROM operation_runs WHERE kind = 'restore-drill' ORDER BY finished_at DESC, id DESC LIMIT 1)`

/** Why a read gave up: named as the reason of an `AbortSignal.timeout` signal is. */
function readTimedOut(): DOMException {
  return new DOMException('The latest operation runs were not read in time.', 'TimeoutError')
}

/** PostgreSQL's query_canceled, which ends a statement that ran past statement_timeout. */
function statementTimedOut(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '57014'
}

/** A read waiting for its pool's one connection request. */
interface Waiter {
  readonly accept: (connection: OperationRunConnection) => void
  readonly refuse: (error: unknown) => void
}

/** Per pool: the reads that wait for a connection, oldest first, and whether one is requested. */
interface Checkout {
  requested: boolean
  readonly waiters: Waiter[]
}

const checkouts = new WeakMap<OperationRunPool, Checkout>()

/**
 * Asks `pool` for one connection, for the oldest read still waiting, and then for another while
 * reads still wait. A connection no read waits for any more goes back to the pool unused. A failed
 * request fails every read that waited for it; the next read asks again.
 */
function requestConnection(pool: OperationRunPool, checkout: Checkout): void {
  checkout.requested = true
  new Promise<OperationRunConnection>((resolve) => resolve(pool.connect())).then(
    (connection) => {
      checkout.requested = false
      const waiter = checkout.waiters.shift()
      if (waiter === undefined) connection.release()
      else waiter.accept(connection)
      if (checkout.waiters.length > 0) requestConnection(pool, checkout)
    },
    (error: unknown) => {
      checkout.requested = false
      for (const waiter of checkout.waiters.splice(0)) waiter.refuse(error)
    },
  )
}

/**
 * A pooled connection for one read, unless `signal` aborts first; it then rejects with the abort
 * reason at once. pg-pool cannot withdraw a connection request it has queued, so the store keeps
 * at most one request per pool, shared by every read of every store on that pool: a read that
 * finds one waits for it within its own deadline and never adds another. However many reads give
 * up on a pool that has nothing to hand out, that pool holds one waiting request. When the pool
 * frees, the connection goes to the oldest read still waiting, or back to the pool unused.
 */
function pooledConnection(
  pool: OperationRunPool,
  signal: AbortSignal,
): Promise<OperationRunConnection> {
  if (signal.aborted) return Promise.reject(signal.reason)
  const checkout = checkouts.get(pool) ?? { requested: false, waiters: [] }
  checkouts.set(pool, checkout)
  return new Promise((resolve, reject) => {
    const waiter: Waiter = {
      accept: (connection) => {
        signal.removeEventListener('abort', leave)
        resolve(connection)
      },
      refuse: (error) => {
        signal.removeEventListener('abort', leave)
        reject(error)
      },
    }
    function leave() {
      const index = checkout.waiters.indexOf(waiter)
      if (index !== -1) checkout.waiters.splice(index, 1)
      reject(signal.reason)
    }
    signal.addEventListener('abort', leave, { once: true })
    checkout.waiters.push(waiter)
    if (!checkout.requested) requestConnection(pool, checkout)
  })
}

/**
 * Settles as `work` does, unless `signal`, which has not aborted yet, aborts first. Then it rejects
 * with the abort reason at once, and whatever `work` still delivers is dropped.
 */
function unlessAborted<T>(signal: AbortSignal, work: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false
    const stop = () => {
      if (settled) return
      settled = true
      reject(signal.reason)
      work.catch(() => undefined)
    }
    const finish = (settle: () => void) => {
      if (settled) return
      settled = true
      signal.removeEventListener('abort', stop)
      settle()
    }
    signal.addEventListener('abort', stop, { once: true })
    work.then(
      (value) => finish(() => resolve(value)),
      (error: unknown) => finish(() => reject(error)),
    )
  })
}

/** The rows of the read's second statement: pg answers a two-statement message with both. */
function selectedRows(answer: unknown): readonly OperationRunRow[] {
  const rows: unknown =
    Array.isArray(answer) && answer.length === 2 ? (answer[1] as { rows?: unknown })?.rows : null
  if (!Array.isArray(rows)) throw new Error('The operation runs read had an unexpected answer.')
  return rows as OperationRunRow[]
}

function nullableNumber(value: number | string | null): number | null {
  return value === null ? null : Number(value)
}

/**
 * A stored row as the run it records, or `unreadableRun` when it breaks the rules the store reads
 * by, an infinite or out-of-range instant included; null when there is no row.
 */
function storedRun(row: OperationRunRow | undefined): LatestOperationRun {
  if (row === undefined) return null
  try {
    return operationRun({
      failureReason: row.failure_reason,
      finishedAt: new Date(row.finished_at).toISOString(),
      kind: row.kind,
      outcome: row.outcome,
      rpoMs: nullableNumber(row.rpo_ms),
      rtoMs: nullableNumber(row.rto_ms),
      startedAt: new Date(row.started_at).toISOString(),
    })
  } catch {
    return unreadableRun
  }
}

/**
 * Backup and restore-drill runs in the application database (migration 0011). A run is checked
 * against the table's rules before it is written, and every row read back is checked again: a row
 * that breaks them reads as unreadable, for its kind only.
 */
export class PostgresOperationRunStore implements OperationRunStore {
  constructor(private readonly pool: OperationRunPool) {}

  /**
   * The latest run of each kind, read in one statement on one pooled connection, within
   * `latestRunsTimeoutMs` and while `signal` has not aborted. Past that it rejects with a
   * `TimeoutError` or the abort reason. The connection comes through the pool's one shared
   * request (`pooledConnection`).
   */
  async latest(signal?: AbortSignal): Promise<LatestOperationRuns> {
    const deadline = new AbortController()
    const timer = setTimeout(() => deadline.abort(readTimedOut()), latestRunsTimeoutMs)
    const limit = signal ? AbortSignal.any([signal, deadline.signal]) : deadline.signal
    try {
      const connection = await pooledConnection(this.pool, limit)
      if (limit.aborted) {
        // The read gave up just as its connection came: hand it back without a statement.
        connection.release()
        limit.throwIfAborted()
      }
      let answer: unknown
      try {
        answer = await unlessAborted(limit, connection.query(latestRuns))
      } catch (error) {
        // A read that failed or was cut off may still be running: close its connection.
        connection.release(true)
        throw statementTimedOut(error) ? readTimedOut() : error
      }
      connection.release()
      const rows = selectedRows(answer)
      const ofKind = (kind: OperationRun['kind']) => rows.find((row) => row.kind === kind)
      return {
        backup: storedRun(ofKind('backup')),
        restoreDrill: storedRun(ofKind('restore-drill')),
      }
    } finally {
      clearTimeout(timer)
    }
  }

  async record(run: OperationRun): Promise<void> {
    const checked = operationRun(run)
    await this.pool.query(insertRun, [
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
