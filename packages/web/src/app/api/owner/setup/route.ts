import { handleOwnerSetup } from '@/server/owner/setup'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request): Promise<Response> {
  return handleOwnerSetup(request)
}
