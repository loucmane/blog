import type { Metadata } from 'next'

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
  const { timeZone, view } = await ownerJobViewFor(getOwnerRuntime())
  return <JobBoard timeZone={timeZone} view={view} />
}
