import type { ContentService } from '@/server/content/service'

export interface PublicationWorkerReport {
  readonly completedJobIds: readonly string[]
  readonly retryJobIds: readonly string[]
  readonly supersededJobIds: readonly string[]
  readonly processed: number
}

export async function runDuePublicationJobs(
  content: ContentService,
  input: {
    readonly evaluationTime?: string
    readonly leaseMilliseconds?: number
    readonly maxJobs?: number
    readonly workerId: string
  },
): Promise<PublicationWorkerReport> {
  const maxJobs = input.maxJobs ?? 25
  if (!Number.isInteger(maxJobs) || maxJobs < 1 || maxJobs > 100) {
    throw new Error('Publication worker batch size must be between 1 and 100.')
  }
  const completedJobIds: string[] = []
  const retryJobIds: string[] = []
  const supersededJobIds: string[] = []
  let processed = 0
  for (let index = 0; index < maxJobs; index += 1) {
    const job = await content.claimDuePublication({
      leaseMilliseconds: input.leaseMilliseconds ?? 30_000,
      ...(input.evaluationTime ? { now: input.evaluationTime } : {}),
      workerId: input.workerId,
    })
    if (!job) break
    processed += 1
    try {
      const completed = await content.completeScheduledPublication({
        ...(input.evaluationTime ? { completedAt: input.evaluationTime } : {}),
        jobId: job.id,
        workerId: input.workerId,
      })
      if (completed.job.status === 'completed') completedJobIds.push(completed.job.id)
      else supersededJobIds.push(completed.job.id)
    } catch {
      retryJobIds.push(job.id)
    }
  }
  return { completedJobIds, processed, retryJobIds, supersededJobIds }
}
