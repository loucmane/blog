import type { Pool } from 'pg'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { selectedRuntime } = vi.hoisted(() => ({ selectedRuntime: vi.fn() }))
vi.mock('@/server/owner/runtime', () => ({ getOwnerRuntime: selectedRuntime }))

import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { PostgresContentRepository } from '@/server/database/postgres-content-repository'
import { OwnerConfigurationError } from '@/server/owner/config'

import { GET } from './route'

// What a failing driver puts in its errors: the connection string, the password, the host.
const connectionString = 'postgres://magazine:hunter2@db.internal.example:5432/magazine'
const leaked = /hunter2|db\.internal|10\.20\.30\.40|postgres:|ECONNREFUSED|magazine:/

function healthRequest(headers: HeadersInit = {}) {
  return new Request('http://127.0.0.1:3000/api/health', { headers })
}

function driverError() {
  return Object.assign(
    new Error(`connect ECONNREFUSED 10.20.30.40:5432 while opening ${connectionString}`),
    { address: '10.20.30.40', hostname: 'db.internal.example', port: 5432 },
  )
}

/** A PostgreSQL runtime whose pool refuses every statement that `refused` accepts. */
function postgresRuntime(refused: (text: string) => boolean) {
  const query = vi.fn(async (text: string) => {
    if (refused(text)) throw driverError()
    if (text.includes('content_publication_state')) return { rowCount: 1, rows: [{ version: '1' }] }
    if (text.includes('article_search_documents')) {
      return { rowCount: 1, rows: [{ article_id: null, total: 0 }] }
    }
    return { rowCount: 0, rows: [] }
  })
  const pool = {
    connect: vi.fn(async () => ({ query, release: vi.fn() })),
    options: { connectionString },
    query,
  } as unknown as Pool
  return { pool, repository: new PostgresContentRepository(pool) }
}

function consoleLines() {
  const lines: Record<string, unknown>[] = []
  for (const method of ['error', 'warn', 'log'] as const) {
    vi.spyOn(console, method).mockImplementation((line: unknown) => {
      lines.push(JSON.parse(String(line)))
    })
  }
  return lines
}

afterEach(() => {
  vi.useRealTimers()
})

describe('GET /api/health', () => {
  it('reports all four subsystems, uncached, under the caller’s correlation id', async () => {
    selectedRuntime.mockReturnValue({ pool: null, repository: new InMemoryContentRepository() })

    const response = await GET(healthRequest({ 'x-correlation-id': 'uptime-monitor-0001' }))

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('x-correlation-id')).toBe('uptime-monitor-0001')
    expect(await response.json()).toEqual({
      checkedAt: expect.any(String),
      checks: {
        database: { durationMs: expect.any(Number), status: 'up' },
        email: { durationMs: expect.any(Number), status: 'configured_for_development' },
        jobQueue: { durationMs: expect.any(Number), status: 'up' },
        search: { status: 'not_configured' },
      },
      correlationId: 'uptime-monitor-0001',
      status: 'ok',
    })
  })

  it('answers 503 when the database is down and names no secret, connection string or host', async () => {
    const lines = consoleLines()
    selectedRuntime.mockReturnValue(postgresRuntime(() => true))

    const response = await GET(healthRequest())

    const body = await response.text()
    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(body).not.toMatch(leaked)
    const report = JSON.parse(body)
    expect(report).toMatchObject({
      checks: {
        database: { reason: 'unavailable', status: 'down' },
        email: { status: 'configured_for_development' },
        jobQueue: { reason: 'unavailable', status: 'down' },
        search: { reason: 'unavailable', status: 'down' },
      },
      status: 'down',
    })
    // Each failure is logged under the request's correlation id, with its secrets redacted.
    const failures = lines.filter(({ message }) => message === 'health.check.failed')
    expect(failures.map(({ check }) => check).sort()).toEqual(['database', 'jobQueue', 'search'])
    for (const failure of failures) {
      expect(failure.correlationId).toBe(report.correlationId)
      expect(JSON.stringify(failure)).not.toContain('hunter2')
    }
  })

  it('answers 200 and degraded when the database works and search does not', async () => {
    consoleLines()
    selectedRuntime.mockReturnValue(
      postgresRuntime((text) => text.includes('websearch_to_tsquery')),
    )

    const response = await GET(healthRequest())

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      checks: {
        database: { status: 'up' },
        jobQueue: { status: 'up' },
        search: { reason: 'unavailable', status: 'down' },
      },
      status: 'degraded',
    })
  })

  it('answers 503 within the database’s time limit when the database does not answer', async () => {
    vi.useFakeTimers()
    const lines = consoleLines()
    const silent = new InMemoryContentRepository()
    vi.spyOn(silent, 'readPublicationVersion').mockReturnValue(new Promise(() => undefined))
    selectedRuntime.mockReturnValue({ pool: null, repository: silent })

    const answering = GET(healthRequest())
    await vi.advanceTimersByTimeAsync(2_000)
    const response = await answering

    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({
      checks: { database: { reason: 'timeout', status: 'down' }, jobQueue: { status: 'up' } },
      status: 'down',
    })
    expect(lines).toContainEqual(
      expect.objectContaining({ check: 'database', message: 'health.check.timeout' }),
    )
  })

  it('answers 503 when the site has no database configured', async () => {
    consoleLines()
    selectedRuntime.mockImplementation(() => {
      throw new OwnerConfigurationError('The owner workspace requires PostgreSQL.')
    })

    const response = await GET(healthRequest())

    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({
      checks: { database: { reason: 'misconfigured', status: 'down' } },
      status: 'down',
    })
  })
})
