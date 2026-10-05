import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'

import { readBearerToken, secureTokenMatches } from '@/lib/request-security'
import {
  resolveOwnerFixtureConfiguration,
  resolvePublicationWorkerToken,
} from '@/server/owner/config'
import { runDuePublicationJobs } from '@/server/owner/publication-worker'
import { getOwnerRuntime } from '@/server/owner/runtime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  let expectedToken: string
  try {
    expectedToken = resolvePublicationWorkerToken()
  } catch {
    return NextResponse.json({ error: 'Publication worker is unavailable.' }, { status: 503 })
  }
  const provided = readBearerToken(request.headers.get('authorization'))
  if (!secureTokenMatches(provided, expectedToken)) {
    return NextResponse.json({ error: 'Publication worker is unavailable.' }, { status: 404 })
  }

  const requestedEvaluationTime = request.headers.get('x-magazine-test-now') ?? undefined
  const fixture = resolveOwnerFixtureConfiguration()
  if (requestedEvaluationTime && !fixture) {
    return NextResponse.json({ error: 'Publication worker request is invalid.' }, { status: 400 })
  }

  const report = await runDuePublicationJobs(getOwnerRuntime().content, {
    ...(requestedEvaluationTime ? { evaluationTime: requestedEvaluationTime } : {}),
    workerId: `publication-worker-${randomUUID()}`,
  })
  return NextResponse.json(report, {
    headers: { 'cache-control': 'private, no-store' },
  })
}
