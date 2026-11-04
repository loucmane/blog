import { checkHealth } from '@/server/observability/health'
import { observeRequest } from '@/server/observability/request'
import { resolveHealthProbes } from '@/server/observability/runtime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * `GET /api/health`: the state of the database, search, the email adapter and the job queue
 * (AC-11). It answers 503 when the site is down and 200 otherwise, degraded or not, so a monitor
 * can tell the two apart from the status alone, and the body says which check is degraded or down
 * and why. The body holds statuses, durations, reasons from a fixed list and the request's
 * correlation id, never an error message, host name or secret; failures are logged, redacted,
 * under that id. Nothing is cached.
 */
export async function GET(request: Request): Promise<Response> {
  return observeRequest(request, async ({ correlationId, logger }) => {
    const report = await checkHealth(resolveHealthProbes(), { logger })
    return Response.json(
      { ...report, correlationId },
      { headers: { 'cache-control': 'no-store' }, status: report.status === 'down' ? 503 : 200 },
    )
  })
}
