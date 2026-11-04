import { answerUnsubscribe, answerUnsubscribeLink } from '@/server/subscriptions/requests'
import { getSubscriptionRuntime } from '@/server/subscriptions/runtime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** The unsubscribe link in an email: a page whose one button unsubscribes. Opening it changes nothing. */
export function GET(request: Request) {
  return answerUnsubscribeLink(request)
}

/**
 * Unsubscribes in one step, without signing in: from the page's button, or from a mail client's
 * one-click unsubscribe (RFC 8058), which posts to the same link.
 */
export async function POST(request: Request) {
  return answerUnsubscribe(request, getSubscriptionRuntime()?.service ?? null)
}
