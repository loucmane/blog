import { subscriberRoute } from '@/server/subscriptions/owner-http'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  return subscriberRoute(request, 'export')
}
