import { unstable_rethrow } from 'next/navigation'

import { correlationIdFrom, correlationIdHeader, createLogger, type Logger } from './logger'

/** A request taking at least this long is logged as slow, unless the route says otherwise. */
export const defaultSlowRequestMs = 1_000

/** What a route handler is given: the request's correlation id and a logger bound to it. */
export interface RequestObservation {
  readonly correlationId: string
  readonly logger: Logger
  /** Records a caught failure while letting the route keep its existing safe response. */
  readonly recordFailure: (error: unknown) => void
}

export interface ObserveRequestOptions {
  /** The logger for a request with this correlation id: a console logger unless given. */
  readonly createLogger?: (correlationId: string) => Logger
  /** A monotonic clock in milliseconds: `performance.now` unless given. */
  readonly elapsed?: () => number
  readonly slowRequestMs?: number
}

function withCorrelationId(response: Response, correlationId: string): Response {
  try {
    response.headers.set(correlationIdHeader, correlationId)
    return response
  } catch {
    // A redirect or a fetched response has immutable headers; a copy of it does not.
    const copy = new Response(response.body, response)
    copy.headers.set(correlationIdHeader, correlationId)
    return copy
  }
}

/**
 * Runs a route handler under the request's correlation id, taken from its `x-correlation-id` or
 * `x-request-id` header or made for it, and returns that id in `x-correlation-id` (BR-12). A
 * request that throws is logged as `request.failed`, redacted, and answered with a 500 that quotes
 * the id and nothing of the error; Next's own redirects and not-found signals pass through. A
 * handled 5xx response is also logged, without inspecting its body. A route can record a caught
 * failure with `recordFailure` to include redacted details without logging it twice. A request
 * that takes `slowRequestMs` or longer is logged as `request.slow`. Lines name the method and
 * path, never the query string.
 */
export async function observeRequest(
  request: Request,
  handle: (observation: RequestObservation) => Promise<Response>,
  options: ObserveRequestOptions = {},
): Promise<Response> {
  const correlationId = correlationIdFrom(request.headers)
  const logger = options.createLogger?.(correlationId) ?? createLogger({ correlationId })
  const elapsed = options.elapsed ?? (() => performance.now())
  const slowRequestMs = options.slowRequestMs ?? defaultSlowRequestMs
  const started = elapsed()
  const route = { method: request.method, path: new URL(request.url).pathname }
  let failureRecorded = false
  const recordFailure = (error: unknown) => {
    if (failureRecorded) return
    failureRecorded = true
    logger.error('request.failed', { ...route, durationMs: Math.round(elapsed() - started), error })
  }
  let response: Response
  try {
    response = await handle({ correlationId, logger, recordFailure })
  } catch (error) {
    unstable_rethrow(error)
    recordFailure(error)
    response = Response.json(
      { correlationId, error: 'Something went wrong. Quote this reference to a maintainer.' },
      { headers: { 'cache-control': 'no-store' }, status: 500 },
    )
  }
  const durationMs = Math.round(elapsed() - started)
  if (response.status >= 500 && !failureRecorded) {
    logger.error('request.failed', { ...route, durationMs, status: response.status })
  }
  if (durationMs >= slowRequestMs) {
    logger.warn('request.slow', { ...route, durationMs, status: response.status })
  }
  return withCorrelationId(response, correlationId)
}
