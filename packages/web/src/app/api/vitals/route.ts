import { resolveRuntimeSiteUrl } from '@/lib/site-url'
import { answerVitalsRequest } from '@/server/analytics/requests'
import { getAnalyticsSink } from '@/server/analytics/runtime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export function POST(request: Request): Promise<Response> {
  return answerVitalsRequest(request, { siteUrl: resolveRuntimeSiteUrl(), sink: getAnalyticsSink })
}
