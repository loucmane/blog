import { NextResponse } from 'next/server'

import {
  configuredSecretIsStrong,
  readBearerToken,
  secureTokenMatches,
} from '@/lib/request-security'
import { expirePublicReader } from '@/reader/cache'
import { labSeedAllowed, seedLabContent } from '@/server/lab/seed'
import { OwnerConfigurationError } from '@/server/owner/config'
import { getOwnerRuntime, type OwnerRuntime } from '@/server/owner/runtime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const headers = { 'cache-control': 'private, no-store' }

/**
 * Seeds the Reader Lab sample magazine into the store this server uses, through the content
 * services. It exists only outside production and only for a caller holding
 * MAGAZINE_LAB_SEED_TOKEN; `pnpm --filter web lab:seed` calls it.
 */
export async function POST(request: Request) {
  const token = process.env.MAGAZINE_LAB_SEED_TOKEN
  if (
    !labSeedAllowed() ||
    !configuredSecretIsStrong(token) ||
    !secureTokenMatches(readBearerToken(request.headers.get('authorization')), token)
  ) {
    return NextResponse.json({ error: 'The lab seed is not available.' }, { headers, status: 404 })
  }

  let ownerRuntime: OwnerRuntime
  try {
    ownerRuntime = getOwnerRuntime()
  } catch (error) {
    if (error instanceof OwnerConfigurationError) {
      return NextResponse.json(
        { error: 'No content store is configured for this server.' },
        { headers, status: 503 },
      )
    }
    throw error
  }

  const report = await seedLabContent({
    objects: ownerRuntime.objects,
    repository: ownerRuntime.repository,
  })
  expirePublicReader()
  return NextResponse.json(report, { headers })
}
