import { notFound } from 'next/navigation'
import { describe, expect, it, vi } from 'vitest'

import { createLogger, type Logger } from './logger'
import { defaultSlowRequestMs, observeRequest } from './request'

function capturingLogger() {
  const records: Record<string, unknown>[] = []
  const loggers: Logger[] = []
  const createFor = (correlationId: string) => {
    const logger = createLogger({ correlationId, sink: (line) => records.push(JSON.parse(line)) })
    loggers.push(logger)
    return logger
  }
  return { createFor, loggers, records }
}

/** A monotonic clock that moves on by `steps` milliseconds each time it is read. */
function ticking(...steps: number[]) {
  let at = 0
  return () => {
    at += steps.shift() ?? 0
    return at
  }
}

function request(path = '/api/example?token=secret-in-query', headers: HeadersInit = {}) {
  return new Request(`http://127.0.0.1:3000${path}`, { headers, method: 'POST' })
}

describe('observed requests', () => {
  it('runs the handler under the caller’s correlation id and answers with it', async () => {
    const { createFor, records } = capturingLogger()
    const handle = vi.fn(async () => Response.json({ ok: true }))

    const response = await observeRequest(
      request('/api/example', { 'x-correlation-id': 'caller-trace-0001' }),
      handle,
      { createLogger: createFor, elapsed: ticking(0, 5) },
    )

    expect(handle).toHaveBeenCalledWith({
      correlationId: 'caller-trace-0001',
      logger: expect.objectContaining({ correlationId: 'caller-trace-0001' }),
      recordFailure: expect.any(Function),
    })
    expect(response.headers.get('x-correlation-id')).toBe('caller-trace-0001')
    expect(await response.json()).toEqual({ ok: true })
    // A quick request leaves no line.
    expect(records).toEqual([])
  })

  it('logs a slow request with its method, path and time, never its query string', async () => {
    const { createFor, records } = capturingLogger()

    const response = await observeRequest(
      request(),
      async () => new Response(null, { status: 204 }),
      {
        createLogger: createFor,
        elapsed: ticking(0, 1_250),
        slowRequestMs: 1_000,
      },
    )

    expect(response.status).toBe(204)
    expect(records).toEqual([
      expect.objectContaining({
        correlationId: response.headers.get('x-correlation-id'),
        durationMs: 1_250,
        level: 'warn',
        message: 'request.slow',
        method: 'POST',
        path: '/api/example',
        status: 204,
      }),
    ])
    expect(JSON.stringify(records)).not.toContain('secret-in-query')
    expect(defaultSlowRequestMs).toBe(1_000)
  })

  it('logs a failed request, redacted, and answers 500 with nothing of the error', async () => {
    const { createFor, records } = capturingLogger()
    const thrown = new Error(
      'connect to postgres://magazine:hunter2@db.internal.example:5432/magazine failed for owner@magazine.example',
    )

    const response = await observeRequest(
      request('/api/example', { 'x-request-id': 'proxy-request-42' }),
      async () => {
        throw thrown
      },
      { createLogger: createFor, elapsed: ticking(0, 3, 3) },
    )

    const body = await response.text()
    expect(response.status).toBe(500)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('x-correlation-id')).toBe('proxy-request-42')
    expect(JSON.parse(body)).toEqual({
      correlationId: 'proxy-request-42',
      error: 'Something went wrong. Quote this reference to a maintainer.',
    })
    expect(body).not.toMatch(/hunter2|db\.internal|owner@|postgres/)
    expect(records).toEqual([
      expect.objectContaining({
        correlationId: 'proxy-request-42',
        durationMs: 3,
        error: expect.objectContaining({
          message:
            'connect to postgres://[redacted secret]@db.internal.example:5432/magazine failed for [redacted email]',
        }),
        level: 'error',
        message: 'request.failed',
        path: '/api/example',
      }),
    ])
  })

  it('lets Next’s own not-found and redirect signals through, unlogged', async () => {
    const { createFor, records } = capturingLogger()

    await expect(
      observeRequest(
        request(),
        async () => {
          notFound()
        },
        { createLogger: createFor },
      ),
    ).rejects.toMatchObject({ digest: expect.stringContaining('404') })
    expect(records).toEqual([])
  })

  it('returns the correlation id on a response whose headers cannot be changed', async () => {
    const response = await observeRequest(
      request('/api/example', { 'x-correlation-id': 'caller-trace-0002' }),
      async () => Response.redirect('https://magazine.example/owner', 303),
      { createLogger: capturingLogger().createFor },
    )

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('https://magazine.example/owner')
    expect(response.headers.get('x-correlation-id')).toBe('caller-trace-0002')
  })

  it('makes a correlation id and a console logger when given neither', async () => {
    const log = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const response = await observeRequest(request(), async () => new Response('done'), {
      elapsed: ticking(0, 2_000),
    })

    const correlationId = response.headers.get('x-correlation-id')
    expect(correlationId).toMatch(/^[\da-f-]{36}$/)
    expect(JSON.parse(String(log.mock.calls[0]?.[0]))).toMatchObject({
      correlationId,
      message: 'request.slow',
    })
  })

  it('logs handled server failures without consuming or exposing the response', async () => {
    const { createFor, records } = capturingLogger()
    const body = JSON.stringify({ error: 'Owner recovery copy remains available.' })
    const handled = new Response(body, {
      headers: { 'cache-control': 'private, no-store', 'retry-after': '60' },
      status: 503,
    })
    const response = await observeRequest(request(), async () => handled, {
      createLogger: createFor,
      elapsed: ticking(0, 5),
    })
    expect(response).toBe(handled)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('retry-after')).toBe('60')
    expect(await response.text()).toBe(body)
    expect(records).toEqual([
      expect.objectContaining({
        correlationId: response.headers.get('x-correlation-id'),
        level: 'error',
        message: 'request.failed',
        status: 503,
      }),
    ])
    expect(JSON.stringify(records)).not.toContain('Owner recovery')
  })

  it('records a handled failure once, redacted, and still reports a slow response', async () => {
    const { createFor, records } = capturingLogger()
    const response = await observeRequest(
      request(),
      async ({ recordFailure }) => {
        recordFailure({
          email: 'owner@example.test',
          document: 'private draft',
          token: 'private value',
        })
        return new Response('Unavailable', { status: 500 })
      },
      { createLogger: createFor, elapsed: ticking(0, 100, 1_000) },
    )
    expect(response.status).toBe(500)
    expect(await response.text()).toBe('Unavailable')
    expect(records.map(({ message }) => message)).toEqual(['request.failed', 'request.slow'])
    expect(records[0]).toMatchObject({
      level: 'error',
      correlationId: response.headers.get('x-correlation-id'),
    })
    expect(JSON.stringify(records)).not.toMatch(/owner@example|private draft|private value/)
  })

  it('does not log expected client rejections as server failures', async () => {
    const { createFor, records } = capturingLogger()
    const response = await observeRequest(
      request(),
      async () => new Response('Conflict', { status: 409 }),
      {
        createLogger: createFor,
        elapsed: ticking(0, 1),
      },
    )
    expect(response.status).toBe(409)
    expect(records).toEqual([])
  })
})
