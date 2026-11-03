import type { Clock } from '../content/ports'
import type { Logger } from './logger'

export const healthCheckNames = ['database', 'search', 'email', 'jobQueue'] as const
export type HealthCheckName = (typeof healthCheckNames)[number]

/**
 * `degraded` works but needs a look: slow, or holding jobs that wait too long or need attention.
 * `down` does not work: it failed or did not answer in time. `not_configured` is neither: this
 * site has not set the subsystem up.
 */
export type HealthCheckStatus = 'degraded' | 'down' | 'not_configured' | 'up'
export type OverallHealthStatus = 'degraded' | 'down' | 'ok'

/**
 * Why a check is degraded or down. The list is fixed, and a report holds nothing else from a
 * check: no error message, which could name a host, a user or a secret.
 */
export type HealthReason =
  'backlog' | 'misconfigured' | 'needs_attention' | 'slow' | 'timeout' | 'unavailable'
/** What a probe that answered can report as wrong. */
export type HealthFinding = 'backlog' | 'needs_attention'

export interface HealthCheckResult {
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
  /**
   * Uses the subsystem once. It throws when the subsystem cannot be reached or used, and resolves
   * with a finding when it works but something about it is wrong.
   */
  readonly run: (signal: AbortSignal) => Promise<HealthFinding | null | void>
  /** The check is `degraded` (slow) when the probe takes at least this long. */
  readonly slowMs?: number
  /** The check is `down` (timeout) when the probe has not answered by then; it is then aborted. */
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
    .then((finding) => ({ finding: finding ?? null }))
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
    if (outcome.finding) return { durationMs, reason: outcome.finding, status: 'degraded' }
    if (durationMs >= slowMs) return { durationMs, reason: 'slow', status: 'degraded' }
    return { durationMs, status: 'up' }
  } catch (error) {
    const durationMs = took()
    const misconfigured = error instanceof HealthCheckConfigurationError
    context.logger.error('health.check.failed', { check: name, durationMs, error })
    return { durationMs, reason: misconfigured ? 'misconfigured' : 'unavailable', status: 'down' }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * The site is down when its database is: no page can be served without it. Any other check that
 * is down or degraded, or a slow database, makes the site degraded. A subsystem that is not
 * configured counts for nothing, except the database, which every site needs.
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
