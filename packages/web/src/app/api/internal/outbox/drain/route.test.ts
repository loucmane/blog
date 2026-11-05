import { randomBytes, timingSafeEqual } from 'node:crypto'
import type * as Crypto from 'node:crypto'
import type { Pool } from 'pg'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { selectedRuntime, expirePublicReader } = vi.hoisted(() => ({
  selectedRuntime: vi.fn(),
  expirePublicReader: vi.fn(),
}))
vi.mock('@/server/owner/runtime', () => ({ getOwnerRuntime: selectedRuntime }))
vi.mock('@/reader/cache', () => ({ expirePublicReader }))
vi.mock('node:crypto', async (original) => {
  const actual = await original<typeof Crypto>()
  return { ...actual, timingSafeEqual: vi.fn(actual.timingSafeEqual) }
})
vi.mock('@/server/outbox/dispatcher', { spy: true })

import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { PostgresContentRepository } from '@/server/database/postgres-content-repository'
import { PostgresOutboxStore } from '@/server/database/postgres-outbox-store'
import { createOutboxDispatcher, OutboxDispatcher } from '@/server/outbox/dispatcher'

import * as route from './route'

const secret = randomBytes(32).toString('hex')
const correlationId = 'outbox-scheduler-test-0001'

function request(token: string | null = secret, query = '', extraHeaders: HeadersInit = {}) {
  return new Request(`https://magazine.example/api/internal/outbox/drain${query}`, {
    headers: {
      ...(token === null ? {} : { authorization: `Bearer ${token}` }),
      'x-correlation-id': correlationId,
      ...extraHeaders,
    },
    method: 'POST',
  })
}

function captureLogs() {
  const lines: string[] = []
  for (const level of ['log', 'warn', 'error'] as const) {
    vi.spyOn(console, level).mockImplementation((line: unknown) => lines.push(String(line)))
  }
  return lines
}

function postgresRuntime() {
  const query = vi.fn(async (_text: string, _values?: readonly unknown[]) => ({ rows: [] }))
  const release = vi.fn()
  const connect = vi.fn(async () => ({ query, release }))
  const pool = { connect, query } as unknown as Pool
  const repository = new PostgresContentRepository(pool)
  selectedRuntime.mockReturnValue({ pool, repository })
  return { connect, pool, query, release, repository }
}

beforeEach(() => {
  vi.stubEnv('MAGAZINE_OUTBOX_DRAIN_SECRET', secret)
  selectedRuntime.mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('POST /api/internal/outbox/drain', () => {
  it('exports a dynamic Node POST route without constructing the runtime on import', () => {
    expect(route.dynamic).toBe('force-dynamic')
    expect(route.runtime).toBe('nodejs')
    expect(Object.keys(route).sort()).toEqual(['POST', 'dynamic', 'runtime'])
    expect(selectedRuntime).not.toHaveBeenCalled()
    expect(createOutboxDispatcher).not.toHaveBeenCalled()
  })

  it.each([
    ['missing', null],
    ['wrong', randomBytes(32).toString('hex')],
    ['overlong', randomBytes(300).toString('hex')],
  ])('refuses a %s secret before runtime or dispatcher construction', async (_case, token) => {
    const logs = captureLogs()
    const response = await route.POST(request(token))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized.' })
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(response.headers.get('x-correlation-id')).toBe(correlationId)
    expect(selectedRuntime).not.toHaveBeenCalled()
    expect(createOutboxDispatcher).not.toHaveBeenCalled()
    expect(logs.join('\n')).not.toContain(secret)
    if (token) expect(logs.join('\n')).not.toContain(token)
    if (_case === 'wrong') {
      expect(timingSafeEqual).toHaveBeenCalledExactlyOnceWith(
        expect.any(Buffer),
        expect.any(Buffer),
      )
    }
  })

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['short', randomBytes(8).toString('hex')],
    ['overlong', randomBytes(300).toString('hex')],
  ])(
    'returns 503 for a %s configuration, without constructing anything',
    async (_case, configured) => {
      vi.stubEnv('MAGAZINE_OUTBOX_DRAIN_SECRET', configured)
      const logs = captureLogs()
      const response = await route.POST(request())

      expect(response.status).toBe(503)
      expect(await response.json()).toEqual({ error: 'The outbox drain is not configured.' })
      expect(response.headers.get('cache-control')).toContain('no-store')
      expect(response.headers.get('x-correlation-id')).toBe(correlationId)
      expect(selectedRuntime).not.toHaveBeenCalled()
      expect(createOutboxDispatcher).not.toHaveBeenCalled()
      expect(timingSafeEqual).not.toHaveBeenCalled()
      expect(logs.join('\n')).not.toContain(secret)
      if (configured) expect(logs.join('\n')).not.toContain(configured)
    },
  )

  it('accepts only a bearer header, never a query parameter or malformed header', async () => {
    const logs = captureLogs()
    const malformed: HeadersInit[] = [
      {},
      { authorization: secret },
      { authorization: `Basic ${secret}` },
    ]
    for (const headers of malformed) {
      const response = await route.POST(request(null, `?secret=${secret}`, headers))
      expect(response.status).toBe(401)
      expect(await response.text()).not.toContain(secret)
    }
    expect(selectedRuntime).not.toHaveBeenCalled()
    expect(createOutboxDispatcher).not.toHaveBeenCalled()
    expect(logs.join('\n')).not.toContain(secret)
  })

  it('drains exactly one batch and returns counts, with correlated redacted logs', async () => {
    const logs = captureLogs()
    const { repository } = postgresRuntime()
    const drain = vi.spyOn(OutboxDispatcher.prototype, 'drain').mockResolvedValueOnce({
      completed: ['event-1', 'event-2'],
      deadLettered: ['event-3'],
      retrying: ['event-4'],
    })
    const response = await route.POST(request(secret, '?limit=4'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ completed: 2, deadLettered: 1, retrying: 1 })
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(response.headers.get('x-correlation-id')).toBe(correlationId)
    expect(selectedRuntime).toHaveBeenCalledOnce()
    expect(createOutboxDispatcher).toHaveBeenCalledOnce()
    expect(drain).toHaveBeenCalledExactlyOnceWith({ limit: 4 })
    expect(timingSafeEqual).toHaveBeenCalledOnce()
    const compared = vi.mocked(timingSafeEqual).mock.calls[0]!
    expect(compared[0].byteLength).toBe(32)
    expect(compared[1].byteLength).toBe(32)
    const options = vi.mocked(createOutboxDispatcher).mock.calls[0]![0]
    expect(options.store).toBeInstanceOf(PostgresOutboxStore)
    expect(options.logger?.correlationId).toBe(correlationId)
    expect(logs.map((line) => JSON.parse(line))).toContainEqual(
      expect.objectContaining({
        correlationId,
        completed: 2,
        deadLettered: 1,
        retrying: 1,
        message: 'outbox.drain.finished',
      }),
    )
    expect(logs.join('\n')).not.toContain(secret)
    expect(repository).toBeInstanceOf(PostgresContentRepository)
  })

  it('runs the real dispatcher against the owner PostgreSQL repository and wires cache and search handlers', async () => {
    captureLogs()
    const { query, connect, release, repository } = postgresRuntime()
    const response = await route.POST(request())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ completed: 0, deadLettered: 0, retrying: 0 })
    expect(connect).toHaveBeenCalledOnce()
    expect(query.mock.calls.some(([sql]) => sql.includes('FOR UPDATE SKIP LOCKED'))).toBe(true)
    expect(release).toHaveBeenCalledOnce()

    const { cache, content, search } = vi.mocked(createOutboxDispatcher).mock.calls[0]![0]
    expect(content).toBe(repository)
    await cache.revalidate({ idempotencyKey: 'event-1', slugs: ['story-one'] })
    expect(expirePublicReader).toHaveBeenCalledExactlyOnceWith('story-one')
    await search.removeArticle('article-1')
    expect(query).toHaveBeenCalledWith(
      'DELETE FROM article_search_documents WHERE article_id = $1',
      ['article-1'],
    )
  })

  it('validates batch size before selecting the owner runtime', async () => {
    const response = await route.POST(request(secret, '?limit=101'))
    expect(response.status).toBe(400)
    expect(selectedRuntime).not.toHaveBeenCalled()
    expect(createOutboxDispatcher).not.toHaveBeenCalled()
  })

  it('observes owner-runtime construction errors without exposing credentials', async () => {
    const logs = captureLogs()
    selectedRuntime.mockImplementation(() => {
      throw new Error(`Authorization: Bearer ${secret}`)
    })
    const response = await route.POST(request())

    expect(response.status).toBe(500)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(response.headers.get('x-correlation-id')).toBe(correlationId)
    expect(await response.text()).not.toContain(secret)
    expect(logs.join('\n')).not.toContain(secret)
    expect(createOutboxDispatcher).not.toHaveBeenCalled()
  })

  it('refuses an in-memory owner runtime rather than acknowledging nonpersistent search work', async () => {
    captureLogs()
    selectedRuntime.mockReturnValue({ pool: null, repository: new InMemoryContentRepository() })
    const response = await route.POST(request())
    expect(response.status).toBe(500)
    expect(createOutboxDispatcher).not.toHaveBeenCalled()
  })
})
