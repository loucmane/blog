import type { Clock, ContentRepository } from '../content/ports'
import { PostgresContentRepository } from '../database/postgres-content-repository'
import { PostgresOutboxStore } from '../database/postgres-outbox-store'
import { PostgresSearchQuery } from '../database/postgres-search-query'
import { InMemoryOutboxStore } from '../outbox/in-memory-outbox-store'
import type { OutboxStore } from '../outbox/ports'
import { OwnerConfigurationError, resolveOwnerTimeZone } from '../owner/config'
import { getOwnerRuntime, type OwnerRuntime } from '../owner/runtime'
import { HealthCheckConfigurationError, type HealthProbe, type HealthProbes } from './health'
import {
  jobQueueFinding,
  jobRecordSource,
  ownerTimeFormatter,
  projectJobView,
  type JobRecordSource,
  type OwnerJobView,
} from './jobs'

/** The search a probe runs: one result of an ordinary word, which every search path can serve. */
const probeSearch = { limit: 1, offset: 0, query: 'health' }

/** The outbox store over a content store: PostgreSQL's, or the in-memory one in owner test mode. */
export function outboxStoreFor(repository: ContentRepository): OutboxStore {
  return repository instanceof PostgresContentRepository
    ? new PostgresOutboxStore(repository)
    : new InMemoryOutboxStore(repository)
}

/** Where the owner job view reads its jobs in this runtime. */
export function jobRecordsFor(runtime: Pick<OwnerRuntime, 'repository'>): JobRecordSource {
  return jobRecordSource(runtime.repository, outboxStoreFor(runtime.repository))
}

/**
 * The owner job view of a runtime as it is at `now`, its times in the owner's time zone: the one
 * in the publication settings, or the configured default.
 */
export async function ownerJobViewFor(
  runtime: Pick<OwnerRuntime, 'repository' | 'workspace'>,
  now: Date = new Date(),
): Promise<{ readonly timeZone: string; readonly view: OwnerJobView }> {
  const [records, settings] = await Promise.all([
    jobRecordsFor(runtime).read(),
    runtime.workspace.publicationSettings(),
  ])
  const timeZone = settings?.ownerTimeZone ?? resolveOwnerTimeZone()
  return {
    timeZone,
    view: projectJobView(records, { formatTime: ownerTimeFormatter(timeZone), now }),
  }
}

/**
 * The health probes of a runtime. The database answers with its publication version, one query
 * that also proves the content migrations ran. Search runs the PostgreSQL search; the in-memory
 * runtime of owner test mode has none, so it is not configured there. The job queue is read as the
 * owner job view reads it. No email adapter exists yet (blog-0045.10), so email is not configured:
 * that slice adds its probe here.
 */
export function healthProbesFor(
  runtime: Pick<OwnerRuntime, 'pool' | 'repository'>,
  clock?: Clock,
): HealthProbes {
  const jobs = jobRecordsFor(runtime)
  const { pool } = runtime
  return {
    database: {
      run: async () => {
        await runtime.repository.readPublicationVersion()
      },
    },
    email: null,
    jobQueue: {
      run: async () => {
        const now = clock?.now() ?? new Date()
        return jobQueueFinding(projectJobView(await jobs.read(), { formatTime: String, now }), now)
      },
    },
    search: pool
      ? {
          run: async () => {
            await new PostgresSearchQuery(pool).search(probeSearch)
          },
        }
      : null,
  }
}

function isConfigurationError(error: unknown): boolean {
  return (
    error instanceof OwnerConfigurationError ||
    (typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'owner_configuration')
  )
}

/**
 * The health probes of the runtime the application selected. When that runtime cannot be created,
 * every check that needs it is down: misconfigured when its configuration is missing or wrong, and
 * unavailable, with the error logged, otherwise.
 */
export function resolveHealthProbes(clock?: Clock): HealthProbes {
  let runtime: OwnerRuntime
  try {
    runtime = getOwnerRuntime()
  } catch (error) {
    const reason = isConfigurationError(error)
      ? new HealthCheckConfigurationError({ cause: error })
      : error
    const unusable: HealthProbe = { run: () => Promise.reject(reason) }
    return { database: unusable, email: null, jobQueue: unusable, search: unusable }
  }
  return healthProbesFor(runtime, clock)
}
