import { PostgresAnalyticsSink } from '../database/postgres-analytics'
import { OwnerConfigurationError } from '../owner/config'
import { getOwnerRuntime, type OwnerRuntime } from '../owner/runtime'
import { noopAnalyticsSink, type AnalyticsSink } from './ports'

/**
 * Reuses the application pool; telemetry never creates its own database or fixture store.
 * For rollback, select 'off' here before dropping migration 0009's aggregate tables.
 */
export function getAnalyticsSink(
  mode: 'aggregate' | 'off' = 'aggregate',
  owner: () => Pick<OwnerRuntime, 'pool'> = getOwnerRuntime,
): AnalyticsSink {
  if (mode === 'off') return noopAnalyticsSink
  try {
    const { pool } = owner()
    return pool ? new PostgresAnalyticsSink(pool) : noopAnalyticsSink
  } catch (error) {
    if (error instanceof OwnerConfigurationError) return noopAnalyticsSink
    throw error
  }
}
