import type { Metadata } from 'next'
import { headers } from 'next/headers'

import { correlationIdFrom, createLogger } from '@/server/observability/logger'
import { ownerJobViewFor } from '@/server/observability/runtime'
import { getOwnerRuntime } from '@/server/owner/runtime'
import { requireOwnerPageSession } from '@/server/owner/session'

import { JobBoard } from './job-board'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Publishing jobs',
}

export default async function OwnerJobsPage() {
  await requireOwnerPageSession()
  const logger = createLogger({ correlationId: correlationIdFrom(await headers()) })
  const { recovery, timeZone, view } = await ownerJobViewFor(getOwnerRuntime(), { logger })
  return <JobBoard recovery={recovery} timeZone={timeZone} view={view} />
}
