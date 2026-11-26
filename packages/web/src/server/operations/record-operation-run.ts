import {
  PostgresOperationRunStore,
  type OperationRunPool,
} from '../database/postgres-operation-runs'
import { backupDatabaseUrl } from './backup'
import { BackupError } from './backup-crypto'
import { operationRun, type OperationRun } from './operation-runs'
import { drillPool } from './restore-drill-postgres'

/**
 * Why a run was not recorded: `not_configured` without DATABASE_URL, `invalid_configuration` and
 * `tls_required` for a URL the backup source would refuse too, `operation_failed` for anything
 * else. None carries the URL, a host or driver text.
 */
export const recordFailureCodes = [
  'invalid_configuration',
  'not_configured',
  'operation_failed',
  'tls_required',
] as const
export type RecordFailureCode = (typeof recordFailureCodes)[number]

export class RecordError extends Error {
  constructor(readonly code: RecordFailureCode) {
    super(code)
    this.name = 'RecordError'
  }
}

/** A connection the recorder writes one run through and then closes. */
export interface RecordingConnection extends OperationRunPool {
  end(): Promise<void>
}

/**
 * Records a finished backup or restore-drill run in the application database that DATABASE_URL
 * names, the database whose health check and owner job view report it. The URL follows the
 * backup source's rules: `sslmode` and `channel_binding` as its only query parameters, as a Neon
 * connection string carries them, and certificate and hostname verification for any host that is
 * not a literal loopback address. With `channel_binding=require` the run is written only over a
 * connection that bound (`drillPool`); any other fails as `operation_failed`. The role needs
 * INSERT on `operation_runs`.
 */
export async function recordOperationRun(
  environment: Readonly<Record<string, string | undefined>>,
  run: OperationRun,
  connect: (databaseUrl: string) => RecordingConnection = drillPool,
): Promise<void> {
  const configured = environment.DATABASE_URL
  if (!configured) throw new RecordError('not_configured')
  let databaseUrl: string
  try {
    databaseUrl = backupDatabaseUrl(configured)
  } catch (error) {
    throw new RecordError(
      error instanceof BackupError && error.code === 'tls_required'
        ? 'tls_required'
        : 'invalid_configuration',
    )
  }
  const checked = operationRun(run)
  const connection = connect(databaseUrl)
  try {
    await new PostgresOperationRunStore(connection).record(checked)
  } catch {
    throw new RecordError('operation_failed')
  } finally {
    await connection.end().catch(() => undefined)
  }
}
