import { readBoundedJson, requestOriginMatches } from '@/lib/request-security'

import type { AnalyticsSink } from './ports'
import { redactEventPayload } from './redact'

export const maxAnalyticsRequestBytes = 1024

function answer(status: number): Response {
  return new Response(null, { status, headers: { 'cache-control': 'no-store' } })
}

/** Accept JSON blobs or sendBeacon's plain-text JSON. Read no identity-bearing headers. */
export async function answerVitalsRequest(
  request: Request,
  dependencies: { readonly siteUrl: URL; readonly sink: () => AnalyticsSink },
): Promise<Response> {
  if (
    !requestOriginMatches(
      request.headers.get('origin'),
      dependencies.siteUrl,
      request.headers.get('sec-fetch-site'),
    )
  ) {
    return answer(403)
  }
  const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
  if (contentType !== 'application/json' && contentType !== 'text/plain') return answer(415)
  const body = await readBoundedJson(request, maxAnalyticsRequestBytes)
  if (!body.ok) return answer(body.reason === 'too-large' ? 413 : 400)
  const event = redactEventPayload(body.value)
  // A rejected route never even constructs a sink.
  if (!event) return answer(400)
  try {
    await dependencies.sink().record(event)
  } catch {
    // Database errors can quote payloads; do not echo or log them.
    return answer(503)
  }
  return answer(204)
}
