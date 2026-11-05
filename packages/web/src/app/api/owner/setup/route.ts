import { observeRequest } from '@/server/observability/request'
import { handleOwnerSetup } from '@/server/owner/setup'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request): Promise<Response> {
  return observeRequest(request, async () => handleOwnerSetup(request))
}
