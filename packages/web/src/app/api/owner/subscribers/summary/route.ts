import { subscriberRoute } from '@/server/subscriptions/owner-http'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  return subscriberRoute(request, 'summary')
}
