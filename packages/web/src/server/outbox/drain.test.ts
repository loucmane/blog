import { randomBytes } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'

import { createLogger } from '../observability/logger'
import { maxOutboxBatchSize, type OutboxDrainReport } from './dispatcher'
import { answerOutboxDrainRequest } from './drain'

const secret = randomBytes(32).toString('hex')
const report: OutboxDrainReport = {
  completed: ['outbox-1'],
  deadLettered: [],
  retrying: ['outbox-2'],
}

function drainRequest(query = '', token: string | null = secret, headers: HeadersInit = {}) {
  return new Request(`http://127.0.0.1:3000/api/internal/outbox/drain${query}`, {
    headers: { ...(token === null ? {} : { authorization: `Bearer ${token}` }), ...headers },
    method: 'POST',
  })
}

function dispatcher() {
  return { drain: vi.fn(async () => report) }
}

function capturingLogs() {
  const logs: Record<string, unknown>[] = []
  const factory = (correlationId: string) =>
    createLogger({ correlationId, sink: (line) => logs.push(JSON.parse(line)) })
  return { factory, logs }
}

describe('outbox drain request', () => {
  it('drains with the shared secret and reports what became of each event, uncached', async () => {
    const outbox = dispatcher()

    const response = await answerOutboxDrainRequest(drainRequest(), {
      createLogger: capturingLogs().factory,
      createDispatcher: () => outbox,
      secret,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(await response.json()).toEqual({ completed: 1, deadLettered: 0, retrying: 1 })
    expect(outbox.drain).toHaveBeenCalledWith({})
  })

  it('runs an accepted drain under the caller’s correlation id and logs what became of its events', async () => {
    const { factory, logs } = capturingLogs()

    const response = await answerOutboxDrainRequest(
      drainRequest('', secret, { 'x-correlation-id': 'scheduler-run-0001' }),
      { createLogger: factory, createDispatcher: dispatcher, secret },
    )

    expect(response.headers.get('x-correlation-id')).toBe('scheduler-run-0001')
    expect(logs).toEqual([
      expect.objectContaining({
        completed: 1,
        correlationId: 'scheduler-run-0001',
        deadLettered: 0,
        level: 'info',
        message: 'outbox.drain.finished',
        retrying: 1,
      }),
    ])
  })

  it('answers a drain that fails with a 500 quoting its correlation id, and logs it redacted', async () => {
    const { factory, logs } = capturingLogs()
    const outbox = {
      drain: vi.fn(async (): Promise<OutboxDrainReport> => {
        throw new Error('pool exhausted at postgres://magazine:hunter2@db.internal/magazine')
      }),
    }

    const response = await answerOutboxDrainRequest(
      drainRequest('', secret, { 'x-correlation-id': 'scheduler-run-0002' }),
      { createLogger: factory, createDispatcher: () => outbox, secret },
    )

    const body = await response.text()
    expect(response.status).toBe(500)
    expect(JSON.parse(body)).toMatchObject({ correlationId: 'scheduler-run-0002' })
    expect(body).not.toMatch(/hunter2|db\.internal|pool exhausted/)
    expect(logs).toEqual([
      expect.objectContaining({
        correlationId: 'scheduler-run-0002',
        error: expect.objectContaining({
          message: 'pool exhausted at postgres://[redacted secret]@db.internal/magazine',
        }),
        message: 'request.failed',
        path: '/api/internal/outbox/drain',
      }),
    ])
  })

  it('correlates refusals and unavailable configuration', async () => {
    const wrongToken = await answerOutboxDrainRequest(drainRequest('', 'wrong-token'), {
      createDispatcher: dispatcher,
      secret,
    })
    const unconfigured = await answerOutboxDrainRequest(drainRequest(), {
      createDispatcher: dispatcher,
      secret: undefined,
    })

    expect(wrongToken.status).toBe(401)
    expect(wrongToken.headers.has('x-correlation-id')).toBe(true)
    expect(unconfigured.status).toBe(503)
    expect(unconfigured.headers.has('x-correlation-id')).toBe(true)
  })

  it('passes a requested batch size on', async () => {
    const outbox = dispatcher()

    await answerOutboxDrainRequest(drainRequest(`?limit=${maxOutboxBatchSize}`), {
      createLogger: capturingLogs().factory,
      createDispatcher: () => outbox,
      secret,
    })

    expect(outbox.drain).toHaveBeenCalledWith({ limit: maxOutboxBatchSize })
  })

  it('passes its correlated logger to the dispatcher factory and drains only once', async () => {
    const outbox = dispatcher()
    const createDispatcher = vi.fn(() => outbox)
    const response = await answerOutboxDrainRequest(
      drainRequest('', secret, { 'x-correlation-id': 'scheduler-factory-0001' }),
      { createDispatcher, createLogger: capturingLogs().factory, secret },
    )

    expect(response.status).toBe(200)
    expect(createDispatcher).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ correlationId: 'scheduler-factory-0001' }),
    )
    expect(outbox.drain).toHaveBeenCalledOnce()
  })

  it.each([
    ['no bearer token', null, secret, '', 401],
    ['wrong bearer token', randomBytes(32).toString('hex'), secret, '', 401],
    ['no configuration', null, undefined, '', 503],
    ['invalid batch', secret, secret, '?limit=invalid', 400],
  ])('does not construct a dispatcher for %s', async (_case, token, configured, query, status) => {
    const outbox = dispatcher()
    const createDispatcher = vi.fn(() => outbox)
    const { factory, logs } = capturingLogs()
    const response = await answerOutboxDrainRequest(drainRequest(query, token), {
      createDispatcher,
      createLogger: factory,
      secret: configured,
    })

    expect(response.status).toBe(status)
    const body = await response.text()
    if (status === 401) expect(JSON.parse(body)).toEqual({ error: 'Unauthorized.' })
    expect(createDispatcher).not.toHaveBeenCalled()
    expect(outbox.drain).not.toHaveBeenCalled()
    expect(body).not.toContain(secret)
    expect(JSON.stringify(logs)).not.toContain(secret)
    if (token) expect(JSON.stringify(logs)).not.toContain(token)
  })

  it('observes construction errors and redacts bearer credentials', async () => {
    const { factory, logs } = capturingLogs()
    const response = await answerOutboxDrainRequest(drainRequest(), {
      createDispatcher: () => {
        throw new Error(`Authorization: Bearer ${secret}`)
      },
      createLogger: factory,
      secret,
    })

    expect(response.status).toBe(500)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(response.headers.get('x-correlation-id')).toBeTruthy()
    expect(await response.text()).not.toContain(secret)
    expect(JSON.stringify(logs)).not.toContain(secret)
    expect(logs).toContainEqual(expect.objectContaining({ message: 'request.failed' }))
  })

  it.each([
    '?limit=0',
    '?limit=2.5',
    '?limit=-1',
    '?limit=many',
    `?limit=${maxOutboxBatchSize + 1}`,
  ])('refuses %s without draining', async (query) => {
    const outbox = dispatcher()

    const response = await answerOutboxDrainRequest(drainRequest(query), {
      createDispatcher: () => outbox,
      secret,
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: `The limit must be a whole number from 1 to ${maxOutboxBatchSize}.`,
    })
    expect(outbox.drain).not.toHaveBeenCalled()
  })

  it.each([
    ['no token', null],
    ['a wrong token', `${secret}-wrong`],
  ])('answers %s with a generic unauthorized response', async (_case, token) => {
    const outbox = dispatcher()

    const response = await answerOutboxDrainRequest(drainRequest('', token), {
      createDispatcher: () => outbox,
      secret,
    })

    expect(response.status).toBe(401)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(outbox.drain).not.toHaveBeenCalled()
  })

  it.each([
    ['missing', undefined],
    ['too short', 'short-secret'],
  ])('stays closed while the secret is %s', async (_case, configured) => {
    const outbox = dispatcher()

    const response = await answerOutboxDrainRequest(drainRequest('', configured ?? null), {
      createDispatcher: () => outbox,
      secret: configured,
    })

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'The outbox drain is not configured.' })
    expect(outbox.drain).not.toHaveBeenCalled()
  })
})
