import type { Clock, ContentRepository } from '../content/ports'
import { PostgresContentRepository } from '../database/postgres-content-repository'
import { PostgresOperationRunStore } from '../database/postgres-operation-runs'
import { PostgresOutboxStore } from '../database/postgres-outbox-store'
import { PostgresSearchQuery } from '../database/postgres-search-query'
import { consoleEmailHealthProbe } from '../email/console'
import {
  backupFinding,
  OperationRunError,
  restoreDrillFinding,
  runAgeMs,
  unreadableRun,
  type LatestOperationRun,
  type LatestOperationRuns,
  type OperationRun,
  type OperationRunStore,
  type RecoveryFinding,
} from '../operations/operation-runs'
import { InMemoryOutboxStore } from '../outbox/in-memory-outbox-store'
import type { OutboxStore } from '../outbox/ports'
import { OwnerConfigurationError, resolveOwnerTimeZone } from '../owner/config'
import { getOwnerRuntime, type OwnerRuntime } from '../owner/runtime'
import {
  HealthCheckConfigurationError,
  type HealthObservation,
  type HealthProbe,
  type HealthProbes,
} from './health'
import {
  jobQueueFinding,
  jobRecordSource,
  ownerTimeFormatter,
  projectJobView,
  projectRecoveryView,
  type JobRecordSource,
  type OwnerJobView,
  type OwnerRecoveryView,
} from './jobs'
import type { Logger } from './logger'

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
 * Where the backup and restore-drill runs of this runtime are read: the application database.
 * The in-memory runtime of owner test mode has none, so it has no runs to report.
 */
export function operationRunsFor(
  runtime: Partial<Pick<OwnerRuntime, 'pool'>>,
): OperationRunStore | null {
  return runtime.pool ? new PostgresOperationRunStore(runtime.pool) : null
}

/**
 * The latest runs as the owner job view shows them. When they cannot be read at all, the failure
 * is logged and both show as unreadable, as the health check reports them unavailable; the rest
 * of the view does not depend on them.
 */
async function recoveryRunsFor(
  runs: OperationRunStore,
  logger: Logger | undefined,
): Promise<LatestOperationRuns> {
  try {
    return await runs.latest()
  } catch (error) {
    logger?.error('owner.jobs.recovery.failed', { error })
    return { backup: unreadableRun, restoreDrill: unreadableRun }
  }
}

/**
 * The owner job view of a runtime as it is at `now`, its times in the owner's time zone: the one
 * in the publication settings, or the configured default. It includes the latest backup and
 * restore drill, or null for a runtime without a database; `logger` records why those could not
 * be read.
 */
export async function ownerJobViewFor(
  runtime: Pick<OwnerRuntime, 'repository' | 'workspace'> & Partial<Pick<OwnerRuntime, 'pool'>>,
  { logger, now = new Date() }: { readonly logger?: Logger; readonly now?: Date } = {},
): Promise<{
  readonly recovery: OwnerRecoveryView | null
  readonly timeZone: string
  readonly view: OwnerJobView
}> {
  const runs = operationRunsFor(runtime)
  const [records, settings, latest] = await Promise.all([
    jobRecordsFor(runtime).read(),
    runtime.workspace.publicationSettings(),
    runs ? recoveryRunsFor(runs, logger) : null,
  ])
  const timeZone = settings?.ownerTimeZone ?? resolveOwnerTimeZone()
  const options = { formatTime: ownerTimeFormatter(timeZone), now }
  return {
    recovery: latest ? projectRecoveryView(latest, options) : null,
    timeZone,
    view: projectJobView(records, options),
  }
}

/**
 * One read of the latest runs, shared by the probes that call it: the backup and restore-drill
 * checks of one health request issue one read, not two. The read is aborted once every probe that
 * waits for it was, so it is given up as soon as no check can use it.
 */
function sharedLatestRuns(
  runs: OperationRunStore,
): (signal: AbortSignal) => Promise<LatestOperationRuns> {
  const controller = new AbortController()
  let read: Promise<LatestOperationRuns> | undefined
  let waiting = 0
  return (signal) => {
    read ??= runs.latest(controller.signal)
    waiting += 1
    const leave = () => {
      waiting -= 1
      if (waiting === 0) controller.abort(signal.reason)
    }
    if (signal.aborted) leave()
    else signal.addEventListener('abort', leave, { once: true })
    return read
  }
}

/**
 * A probe of one kind's latest run: what is wrong with it, and its age (`runAgeMs`: since a backup
 * started, or since a drill finished). A latest run that cannot be read back says nothing about
 * the run, so its check is unavailable.
 */
function recoveryProbe(
  latest: (signal: AbortSignal) => Promise<LatestOperationRuns>,
  clock: Clock | undefined,
  latestOf: (latest: LatestOperationRuns) => LatestOperationRun,
  findingOf: (run: OperationRun | null, now: Date) => RecoveryFinding | null,
): HealthProbe {
  return {
    run: async (signal): Promise<HealthObservation> => {
      const run = latestOf(await latest(signal))
      if (run === unreadableRun) throw new OperationRunError()
      const now = clock?.now() ?? new Date()
      const ageMs = runAgeMs(run, now)
      return { finding: findingOf(run, now), ...(ageMs === null ? {} : { ageMs }) }
    },
  }
}

/**
 * The health probes of a runtime, built for one health request. The database answers with its
 * publication version, one query that also proves the content migrations ran. Search runs the
 * PostgreSQL search; the in-memory runtime of owner test mode has none, so it is not configured
 * there. The job queue is read as the owner job view reads it. Email is a development console
 * simulation; its probe never sends and never reports that a production email transport is up.
 * The backup and the restore drill are read from `runs`, by default the runs the operator commands
 * recorded in the database, in one bounded read the two probes share, so the in-memory runtime
 * has neither configured.
 */
export function healthProbesFor(
  runtime: Pick<OwnerRuntime, 'pool' | 'repository'>,
  clock?: Clock,
  runs: OperationRunStore | null = operationRunsFor(runtime),
): HealthProbes {
  const jobs = jobRecordsFor(runtime)
  const latest = runs ? sharedLatestRuns(runs) : null
  const { pool } = runtime
  return {
    backup: latest ? recoveryProbe(latest, clock, ({ backup }) => backup, backupFinding) : null,
    database: {
      run: async () => {
        await runtime.repository.readPublicationVersion()
      },
    },
    email: consoleEmailHealthProbe,
    jobQueue: {
      run: async () => {
        const now = clock?.now() ?? new Date()
        return jobQueueFinding(projectJobView(await jobs.read(), { formatTime: String, now }), now)
      },
    },
    restoreDrill: latest
      ? recoveryProbe(latest, clock, ({ restoreDrill }) => restoreDrill, restoreDrillFinding)
      : null,
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
    return {
      backup: unusable,
      database: unusable,
      email: null,
      jobQueue: unusable,
      restoreDrill: unusable,
      search: unusable,
    }
  }
  return healthProbesFor(runtime, clock)
}
