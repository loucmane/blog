import { getOwnerAuth } from '@/server/owner/auth'
import { ownerErrorResponse } from '@/server/owner/api'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function handler(request: Request): Promise<Response> {
  try {
    return await getOwnerAuth().handler(request)
  } catch (error) {
    return ownerErrorResponse(error)
  }
}

export { handler as DELETE, handler as GET, handler as PATCH, handler as POST, handler as PUT }
