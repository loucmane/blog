import { resolveRuntimeSiteUrl } from '@/lib/site-url'
import {
  answerSubscriptionRequest,
  subscriptionsUnavailable,
} from '@/server/subscriptions/requests'
import { getSubscriptionRuntime } from '@/server/subscriptions/runtime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** A request to subscribe from the site's subscription form (server/subscriptions/requests.ts). */
export async function POST(request: Request) {
  const subscriptions = getSubscriptionRuntime()
  if (!subscriptions) return subscriptionsUnavailable()
  return answerSubscriptionRequest(request, {
    limiter: subscriptions.limiter,
    service: subscriptions.service,
    siteUrl: resolveRuntimeSiteUrl(),
  })
}
