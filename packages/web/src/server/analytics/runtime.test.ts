import { Pool } from 'pg'
import { describe, expect, it, vi } from 'vitest'

import { PostgresAnalyticsSink } from '../database/postgres-analytics'
import { OwnerConfigurationError } from '../owner/config'
import { noopAnalyticsSink } from './ports'
import { getAnalyticsSink } from './runtime'

describe('analytics runtime selection', () => {
  it('uses the existing PostgreSQL pool by default', async () => {
    const pool = new Pool({ connectionString: 'postgresql://reader@127.0.0.1:1/magazine' })
    expect(getAnalyticsSink(undefined, () => ({ pool }))).toBeInstanceOf(PostgresAnalyticsSink)
    await pool.end()
  })
  it('can be switched off before constructing a runtime, including for rollback', async () => {
    const owner = vi.fn()
    const sink = getAnalyticsSink('off', owner)
    expect(sink).toBe(noopAnalyticsSink)
    await expect(sink.record({ type: 'page_view', routePattern: '/' })).resolves.toBeUndefined()
    expect(owner).not.toHaveBeenCalled()
  })
  it('stores nothing when a database is absent or the explicit fixture has no pool', () => {
    expect(getAnalyticsSink(undefined, () => ({ pool: null }))).toBe(noopAnalyticsSink)
    expect(
      getAnalyticsSink(undefined, () => {
        throw new OwnerConfigurationError('Synthetic absent configuration')
      }),
    ).toBe(noopAnalyticsSink)
  })
  it('leaves unexpected initialization errors for the request boundary', () => {
    expect(() =>
      getAnalyticsSink(undefined, () => {
        throw new Error('Synthetic initialization error')
      }),
    ).toThrow('Synthetic initialization error')
  })
})
