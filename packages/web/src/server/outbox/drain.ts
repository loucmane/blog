import {
  configuredSecretIsStrong,
  readBearerToken,
  secureTokenMatches,
} from '@/lib/request-security'

import { maxOutboxBatchSize, type OutboxDispatcher } from './dispatcher'

const noStore = { 'cache-control': 'private, no-store' }

/**
 * Answers a request to drain the outbox; the `/api/internal/outbox/drain` route hands its POST
 * requests here, with the shared secret its configuration holds. The caller presents that secret
 * as a bearer token, and may name how many events to dispatch with `?limit=`. A missing or wrong
 * token is answered like an unknown route, so the drain does not reveal that it exists.
 */
export async function answerOutboxDrainRequest(
  request: Request,
  input: {
    readonly dispatcher: Pick<OutboxDispatcher, 'drain'>
    readonly secret: string | undefined
  },
): Promise<Response> {
  if (!configuredSecretIsStrong(input.secret)) {
    return Response.json(
      { error: 'The outbox drain is not configured.' },
      { headers: noStore, status: 503 },
    )
  }
  if (!secureTokenMatches(readBearerToken(request.headers.get('authorization')), input.secret)) {
    return Response.json({ error: 'Not found.' }, { headers: noStore, status: 404 })
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
  const report = await input.dispatcher.drain(limit === null ? {} : { limit })
  return Response.json(report, { headers: noStore })
}
