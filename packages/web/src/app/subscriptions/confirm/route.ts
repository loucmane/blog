import { answerConfirmation, answerConfirmationLink } from '@/server/subscriptions/requests'
import { getSubscriptionRuntime } from '@/server/subscriptions/runtime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** The link in a confirmation email: a page whose one button confirms. Opening it changes nothing. */
export function GET(request: Request) {
  return answerConfirmationLink(request)
}

/** The page's button: confirms the subscription in one step. */
export async function POST(request: Request) {
  return answerConfirmation(request, getSubscriptionRuntime()?.service ?? null)
}
