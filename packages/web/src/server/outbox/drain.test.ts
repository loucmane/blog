import { describe, expect, it, vi } from 'vitest'

import { createLogger } from '../observability/logger'
import { maxOutboxBatchSize, type OutboxDrainReport } from './dispatcher'
import { answerOutboxDrainRequest } from './drain'

const secret = 'outbox-drain-secret-with-at-least-32-bytes'
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
      dispatcher: outbox,
      secret,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(await response.json()).toEqual(report)
    expect(outbox.drain).toHaveBeenCalledWith({})
  })

  it('runs an accepted drain under the caller’s correlation id and logs what became of its events', async () => {
    const { factory, logs } = capturingLogs()

    const response = await answerOutboxDrainRequest(
      drainRequest('', secret, { 'x-correlation-id': 'scheduler-run-0001' }),
      { createLogger: factory, dispatcher: dispatcher(), secret },
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
      { createLogger: factory, dispatcher: outbox, secret },
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

  it('adds no correlation id to a refusal, which must look like any unknown route', async () => {
    const wrongToken = await answerOutboxDrainRequest(drainRequest('', 'wrong-token'), {
      dispatcher: dispatcher(),
      secret,
    })
    const unconfigured = await answerOutboxDrainRequest(drainRequest(), {
      dispatcher: dispatcher(),
      secret: undefined,
    })

    expect(wrongToken.status).toBe(404)
    expect(wrongToken.headers.has('x-correlation-id')).toBe(false)
    expect(unconfigured.status).toBe(503)
    expect(unconfigured.headers.has('x-correlation-id')).toBe(false)
  })

  it('passes a requested batch size on', async () => {
    const outbox = dispatcher()

    await answerOutboxDrainRequest(drainRequest(`?limit=${maxOutboxBatchSize}`), {
      createLogger: capturingLogs().factory,
      dispatcher: outbox,
      secret,
    })

    expect(outbox.drain).toHaveBeenCalledWith({ limit: maxOutboxBatchSize })
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
      dispatcher: outbox,
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
  ])('answers %s like an unknown route', async (_case, token) => {
    const outbox = dispatcher()

    const response = await answerOutboxDrainRequest(drainRequest('', token), {
      dispatcher: outbox,
      secret,
    })

    expect(response.status).toBe(404)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(outbox.drain).not.toHaveBeenCalled()
  })

  it.each([
    ['missing', undefined],
    ['too short', 'short-secret'],
  ])('stays closed while the secret is %s', async (_case, configured) => {
    const outbox = dispatcher()

    const response = await answerOutboxDrainRequest(drainRequest('', configured ?? null), {
      dispatcher: outbox,
      secret: configured,
    })

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'The outbox drain is not configured.' })
    expect(outbox.drain).not.toHaveBeenCalled()
  })
})
