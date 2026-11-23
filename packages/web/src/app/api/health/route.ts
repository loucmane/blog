import { checkHealth } from '@/server/observability/health'
import { observeRequest } from '@/server/observability/request'
import { resolveHealthProbes } from '@/server/observability/runtime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * `GET /api/health`: the state of the database, search, the email adapter and the job queue
 * (AC-11), and of the latest backup and restore drill (blog-0046.3). It answers 503 when the site
 * is down and 200 otherwise, degraded or not, so a monitor can tell the two apart from the status
 * alone, and the body says which check is degraded or down and why. A backup or drill that is
 * missing, failed, stale or missed its targets only degrades the site. The body holds statuses,
 * durations, reasons from a fixed list, the age of the latest backup and drill, and the request's
 * correlation id, never an error message, host name, path, key, count or secret; failures are
 * logged, redacted, under that id. Nothing is cached.
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
