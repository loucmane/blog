import type { Pool } from 'pg'
import { describe, expect, it, vi } from 'vitest'

const { selectedRuntime } = vi.hoisted(() => ({ selectedRuntime: vi.fn() }))
vi.mock('../owner/runtime', () => ({ getOwnerRuntime: selectedRuntime }))

import { InMemoryContentRepository } from '../content/in-memory-repository'
import { PostgresContentRepository } from '../database/postgres-content-repository'
import { PostgresOutboxStore } from '../database/postgres-outbox-store'
import { InMemoryOutboxStore } from '../outbox/in-memory-outbox-store'
import { OwnerConfigurationError, resolveOwnerTimeZone } from '../owner/config'
import { checkHealth } from './health'
import { createLogger } from './logger'
import {
  healthProbesFor,
  jobRecordsFor,
  outboxStoreFor,
  ownerJobViewFor,
  resolveHealthProbes,
} from './runtime'

const now = new Date('2026-11-03T12:00:00.000Z')

function silentLogger() {
  const records: Record<string, unknown>[] = []
  const logger = createLogger({
    correlationId: 'runtime-test-0001',
    sink: (line) => records.push(JSON.parse(line)),
  })
  return { logger, records }
}

/** A pool answering the probes' reads: the publication version, an empty search and empty tables. */
function answeringPool() {
  const query = vi.fn(async (text: string, _values?: readonly unknown[]) => {
    if (text.includes('content_publication_state')) return { rowCount: 1, rows: [{ version: '4' }] }
    if (text.includes('article_search_documents')) {
      return { rowCount: 1, rows: [{ article_id: null, total: 0 }] }
    }
    return { rowCount: 0, rows: [] }
  })
  const pool = {
    connect: vi.fn(async () => ({ query, release: vi.fn() })),
    options: {},
    query,
  } as unknown as Pool
  return { pool, query }
}

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

    const configured = await ownerJobViewFor(withSettings as never, now)
    const fallback = await ownerJobViewFor(withoutSettings as never, now)

    expect(configured.timeZone).toBe('UTC')
    expect(configured.view.jobs['waiting-to-send'][0]?.summary).toBe('Queued at 3 Nov 2026, 09:00.')
    expect(fallback.timeZone).toBe(resolveOwnerTimeZone())
    expect(fallback.view.counts['waiting-to-send']).toBe(1)
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
    expect(fresh.checks).toMatchObject({
      database: { status: 'up' },
      email: { status: 'configured_for_development' },
      jobQueue: { status: 'up' },
      search: { status: 'not_configured' },
    })
    expect(stalled.status).toBe('degraded')
    expect(stalled.checks.jobQueue).toMatchObject({ reason: 'backlog', status: 'degraded' })
  })

  it('checks PostgreSQL with its publication version, one small search and the job queue', async () => {
    const { pool, query } = answeringPool()
    const { logger, records } = silentLogger()

    const report = await checkHealth(
      healthProbesFor({ pool, repository: new PostgresContentRepository(pool) }),
      { logger },
    )

    expect(records).toEqual([])
    expect(report.status).toBe('ok')
    expect(report.checks).toMatchObject({
      database: { status: 'up' },
      email: { status: 'configured_for_development' },
      jobQueue: { status: 'up' },
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
      database: { reason: 'misconfigured', status: 'down' },
      email: { status: 'not_configured' },
      jobQueue: { reason: 'misconfigured', status: 'down' },
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
