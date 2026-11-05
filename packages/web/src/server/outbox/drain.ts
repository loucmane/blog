import {
  configuredSecretIsStrong,
  readBearerToken,
  secureTokenMatches,
} from '@/lib/request-security'
import type { Logger } from '@/server/observability/logger'
import { observeRequest } from '@/server/observability/request'

import { maxOutboxBatchSize, type OutboxDispatcher } from './dispatcher'

const noStore = { 'cache-control': 'private, no-store' }

/**
 * Answers a request to drain the outbox; the `/api/internal/outbox/drain` route hands its POST
 * requests here, with the shared secret its configuration holds. The caller presents that secret
 * as a bearer token, and may name how many events to dispatch with `?limit=`. A missing or wrong
 * token gets a generic 401; missing or invalid configuration keeps the route closed with a 503.
 * Only an authenticated, valid request constructs a dispatcher. Every response carries its
 * correlation id (`observeRequest`); a finished batch returns and logs counts, and construction
 * or drain errors are logged, redacted, and answered with a 500 quoting the id.
 */
export async function answerOutboxDrainRequest(
  request: Request,
  input: {
    /** The logger for a drain with this correlation id: a console logger unless given. */
    readonly createLogger?: (correlationId: string) => Logger
    /** Called only after authentication and batch validation, inside request observation. */
    readonly createDispatcher: (logger: Logger) => Pick<OutboxDispatcher, 'drain'>
    readonly secret: string | undefined
  },
): Promise<Response> {
  return observeRequest(
    request,
    async ({ logger }) => {
      if (!configuredSecretIsStrong(input.secret)) {
        return Response.json(
          { error: 'The outbox drain is not configured.' },
          { headers: noStore, status: 503 },
        )
      }
      if (
        !secureTokenMatches(readBearerToken(request.headers.get('authorization')), input.secret)
      ) {
        return Response.json({ error: 'Unauthorized.' }, { headers: noStore, status: 401 })
      }
      const requested = new URL(request.url).searchParams.get('limit')
      const limit = requested === null ? null : Number(requested)
      if (
        limit !== null &&
        (!/^\d+$/.test(requested ?? '') || limit < 1 || limit > maxOutboxBatchSize)
      ) {
        return Response.json(
          { error: `The limit must be a whole number from 1 to ${maxOutboxBatchSize}.` },
          { headers: noStore, status: 400 },
        )
      }
      const dispatcher = input.createDispatcher(logger)
      const report = await dispatcher.drain(limit === null ? {} : { limit })
      const counts = {
        completed: report.completed.length,
        deadLettered: report.deadLettered.length,
        retrying: report.retrying.length,
      }
      logger.info('outbox.drain.finished', counts)
      return Response.json(counts, { headers: noStore })
    },
    input.createLogger ? { createLogger: input.createLogger } : {},
  )
}
