import type { Clock } from '../content/ports'
import type { Logger } from './logger'

/**
 * `backup` and `restoreDrill` read the latest run the operator commands recorded in the
 * application database (blog-0046.3); every other check uses its subsystem.
 */
export const healthCheckNames = [
  'database',
  'search',
  'email',
  'jobQueue',
  'backup',
  'restoreDrill',
] as const
export type HealthCheckName = (typeof healthCheckNames)[number]

/**
 * `degraded` works but needs a look: slow, holding jobs that wait too long or need attention, or a
 * backup or restore drill that is missing, failed, out of date or missed its targets. `down` does
 * not work: it failed or did not answer in time. `not_configured` is neither: this site has not
 * set the subsystem up.
 */
export type HealthCheckStatus =
  'configured_for_development' | 'degraded' | 'down' | 'not_configured' | 'up'
export type OverallHealthStatus = 'degraded' | 'down' | 'ok'

/**
 * Why a check is degraded or down. The list is fixed, and a report holds nothing else from a
 * check: no error message, which could name a host, a user or a secret.
 */
export type HealthReason =
  | 'backlog'
  | 'last_run_failed'
  | 'misconfigured'
  | 'needs_attention'
  | 'never_run'
  | 'slow'
  | 'stale'
  | 'targets_missed'
  | 'timeout'
  | 'unavailable'
/**
 * What a probe that answered can report as wrong. The job queue holds jobs that need attention
 * (`needs_attention`) or wait too long (`backlog`). A backup or restore drill was never recorded
 * (`never_run`), its latest run failed (`last_run_failed`), the drill missed a recovery target
 * (`targets_missed`), or the run is older than allowed (`stale`).
 */
export type HealthFinding =
  'backlog' | 'last_run_failed' | 'needs_attention' | 'never_run' | 'stale' | 'targets_missed'

/** A probe's answer when it can also say how old the state it read is. */
export interface HealthObservation {
  /** Milliseconds since the state the probe read was recorded; absent when nothing was. */
  readonly ageMs?: number
  readonly finding: HealthFinding | null
}

export interface HealthCheckResult {
  /**
   * How long ago the state the check read was recorded, in whole milliseconds: for the backup
   * and the restore drill, since their latest run finished. Absent for every other check and
   * when nothing was recorded.
   */
  readonly ageMs?: number
  /** How long the check took; absent for a subsystem that is not configured. */
  readonly durationMs?: number
  readonly reason?: HealthReason
  readonly status: HealthCheckStatus
}

export interface HealthReport {
  readonly checkedAt: string
  readonly checks: Readonly<Record<HealthCheckName, HealthCheckResult>>
  readonly status: OverallHealthStatus
}

export interface HealthProbe {
  /** A successful simulation is explicitly distinct from a production transport being up. */
  readonly mode?: 'development'
  /**
   * Uses the subsystem once. It throws when the subsystem cannot be reached or used, and resolves
   * with a finding when it works but something about it is wrong, or with an observation that
   * also carries the age of what it read.
   */
  readonly run: (signal: AbortSignal) => Promise<HealthFinding | HealthObservation | null | void>
  /** The check is `degraded` (slow) when the probe takes at least this long. */
  readonly slowMs?: number
  /**
   * The check is `down` (timeout) when the probe has not answered by then; it is then aborted. A
   * probe that gives up sooner, at a deadline of its own, rejects with a `TimeoutError`, as an
   * `AbortSignal.timeout` signal does, and is reported the same way.
   */
  readonly timeoutMs?: number
}

/** One probe per subsystem, null for a subsystem this site has not configured. */
export type HealthProbes = Readonly<Record<HealthCheckName, HealthProbe | null>>

export const defaultHealthTimeoutMs = 2_000
export const defaultHealthSlowMs = 1_000

/** Thrown by a probe whose subsystem is configured wrongly, so it cannot even be tried. */
export class HealthCheckConfigurationError extends Error {
  constructor(options?: ErrorOptions) {
    super('The subsystem is not configured correctly.', options)
    this.name = 'HealthCheckConfigurationError'
  }
}

interface CheckContext {
  readonly elapsed: () => number
  readonly logger: Logger
}

function observation(answer: HealthFinding | HealthObservation | null | void): HealthObservation {
  if (answer === undefined || answer === null) return { finding: null }
  return typeof answer === 'string' ? { finding: answer } : answer
}

/** Only a whole, non-negative age leaves a check; anything else is left out. */
function reportedAge({ ageMs }: HealthObservation): { readonly ageMs?: number } {
  return ageMs === undefined || !Number.isFinite(ageMs)
    ? {}
    : { ageMs: Math.max(0, Math.round(ageMs)) }
}

async function runCheck(
  name: HealthCheckName,
  probe: HealthProbe | null,
  context: CheckContext,
): Promise<HealthCheckResult> {
  if (probe === null) return { status: 'not_configured' }
  const timeoutMs = probe.timeoutMs ?? defaultHealthTimeoutMs
  const slowMs = probe.slowMs ?? defaultHealthSlowMs
  const controller = new AbortController()
  const started = context.elapsed()
  const took = () => Math.round(context.elapsed() - started)
  let timer: ReturnType<typeof setTimeout> | undefined
  const answered = Promise.resolve()
    .then(() => probe.run(controller.signal))
    .then(observation)
  // A probe abandoned at its timeout may still fail later; that failure is not unhandled.
  answered.catch(() => undefined)
  const timedOut = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs)
  })
  try {
    const outcome = await Promise.race([answered, timedOut])
    const durationMs = took()
    if (outcome === null) {
      controller.abort()
      context.logger.warn('health.check.timeout', { check: name, durationMs, timeoutMs })
      return { durationMs, reason: 'timeout', status: 'down' }
    }
    const age = reportedAge(outcome)
    if (outcome.finding) return { ...age, durationMs, reason: outcome.finding, status: 'degraded' }
    if (durationMs >= slowMs) return { ...age, durationMs, reason: 'slow', status: 'degraded' }
    return {
      ...age,
      durationMs,
      status: probe.mode === 'development' ? 'configured_for_development' : 'up',
    }
  } catch (error) {
    const durationMs = took()
    if (error instanceof Error && error.name === 'TimeoutError') {
      context.logger.warn('health.check.timeout', { check: name, durationMs, error })
      return { durationMs, reason: 'timeout', status: 'down' }
    }
    const misconfigured = error instanceof HealthCheckConfigurationError
    context.logger.error('health.check.failed', { check: name, durationMs, error })
    return { durationMs, reason: misconfigured ? 'misconfigured' : 'unavailable', status: 'down' }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * The site is down when its database is: no page can be served without it. Any other check that
 * is down or degraded, or a slow database, makes the site degraded; a missing, failed or stale
 * backup or restore drill never makes it down. A subsystem that is not configured counts for
 * nothing, except the database, which every site needs.
 */
function overallStatus(
  checks: Readonly<Record<HealthCheckName, HealthCheckResult>>,
): OverallHealthStatus {
  const database = checks.database.status
  if (database === 'down' || database === 'not_configured') return 'down'
  const troubled = healthCheckNames.some((name) =>
    ['degraded', 'down'].includes(checks[name].status),
  )
  return troubled ? 'degraded' : 'ok'
}

/**
 * Runs every probe at once, each under its own time limit, so one slow subsystem neither delays
 * the report past its limit nor hides the state of the others (AC-11). A probe that fails or times
 * out is logged, redacted, under the request's correlation id; the report itself only carries
 * each check's status, duration and reason.
 */
export async function checkHealth(
  probes: HealthProbes,
  options: {
    readonly clock?: Clock
    /** A monotonic clock in milliseconds: `performance.now` unless given. */
    readonly elapsed?: () => number
    readonly logger: Logger
  },
): Promise<HealthReport> {
  const checkedAt = (options.clock?.now() ?? new Date()).toISOString()
  const context = { elapsed: options.elapsed ?? (() => performance.now()), logger: options.logger }
  const results = await Promise.all(
    healthCheckNames.map(
      async (name) => [name, await runCheck(name, probes[name], context)] as const,
    ),
  )
  const checks = Object.fromEntries(results) as Record<HealthCheckName, HealthCheckResult>
  return { checkedAt, checks, status: overallStatus(checks) }
}
