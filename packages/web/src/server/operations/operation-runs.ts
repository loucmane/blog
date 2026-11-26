import { z } from 'zod'

import type { HealthFinding } from '../observability/health'
import {
  recoveryTargets,
  type DrillFailureCode,
  type RestoreDrillEvidence,
} from './restore-drill-contract'

/** What an operator command ran: an independent backup, or a restore drill. */
export const operationRunKinds = ['backup', 'restore-drill'] as const
export type OperationRunKind = (typeof operationRunKinds)[number]

export const operationRunOutcomes = ['succeeded', 'failed'] as const
export type OperationRunOutcome = (typeof operationRunOutcomes)[number]

/**
 * Why a run failed: the fixed codes the backup and restore-drill commands report, and nothing
 * else. Migration 0011 checks the same list, in the same order.
 */
export const operationFailureReasons = [
  'invalid_configuration',
  'invalid_key_file',
  'tls_required',
  'invalid_manifest',
  'authentication_failed',
  'truncated_file',
  'checksum_mismatch',
  'missing_object',
  'operation_failed',
  'unsupported_version',
  'target_exists',
  'migration_identity_mismatch',
  'row_count_mismatch',
  'invariant_changed',
  'orphaned_object',
  'export_invalid',
  'rpo_exceeded',
  'rto_exceeded',
  'invalid_clock',
] as const satisfies readonly DrillFailureCode[]
export type OperationFailureReason = (typeof operationFailureReasons)[number]

// A failure code added to the commands needs a place in this list and in migration 0011's check.
const _everyFailureListed: [Exclude<DrillFailureCode, OperationFailureReason>] extends [never]
  ? true
  : never = true

/**
 * One finished run of the backup or restore-drill command, as the application database keeps it:
 * never a path, key, host, URL, set name or payload. Times are ISO 8601 instants. A drill also
 * keeps the recovery point and time it measured, null where it did not get that far.
 */
export interface OperationRun {
  readonly failureReason: OperationFailureReason | null
  readonly finishedAt: string
  readonly kind: OperationRunKind
  readonly outcome: OperationRunOutcome
  readonly rpoMs: number | null
  readonly rtoMs: number | null
  readonly startedAt: string
}

/**
 * Stands for a kind's latest run when its stored row cannot be read back: it breaks the rules of
 * migration 0011, as a row written by a later release could. Its check is unavailable; an older
 * run never stands in for it.
 */
export const unreadableRun = 'unreadable'

/** The latest run of one kind: the run, null when none was recorded, or `unreadableRun`. */
export type LatestOperationRun = OperationRun | null | typeof unreadableRun

/** The latest run of each kind, by when it finished. */
export interface LatestOperationRuns {
  readonly backup: LatestOperationRun
  readonly restoreDrill: LatestOperationRun
}

/** Where the operator commands record their runs, and where the site reads the latest of each. */
export interface OperationRunStore {
  /**
   * The latest run of each kind. It rejects when the runs cannot be read, within the store's own
   * time limit, or as soon as `signal` aborts.
   */
  latest(signal?: AbortSignal): Promise<LatestOperationRuns>
  record(run: OperationRun): Promise<void>
}

const instant = z.iso.datetime({ precision: 3 })
const measurement = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).nullable()

// The rules migration 0011 checks, so a store refuses a run before the database would.
const operationRunSchema = z
  .object({
    failureReason: z.enum(operationFailureReasons).nullable(),
    finishedAt: instant,
    kind: z.enum(operationRunKinds),
    outcome: z.enum(operationRunOutcomes),
    rpoMs: measurement,
    rtoMs: measurement,
    startedAt: instant,
  })
  .strict()
  .refine(({ finishedAt, startedAt }) => Date.parse(startedAt) <= Date.parse(finishedAt))
  .refine(({ failureReason, outcome }) => (outcome === 'failed') === (failureReason !== null))
  .refine(
    ({ kind, rpoMs, rtoMs }) => kind === 'restore-drill' || (rpoMs === null && rtoMs === null),
  )
  .refine(
    ({ kind, outcome, rpoMs, rtoMs }) =>
      kind === 'backup' || outcome === 'failed' || (rpoMs !== null && rtoMs !== null),
  )

/** Thrown for a run that breaks the rules of migration 0011. It names none of the run's values. */
export class OperationRunError extends Error {
  constructor() {
    super('The operation run does not follow the rules of migration 0011.')
    this.name = 'OperationRunError'
  }
}

/** The run as a store keeps it: exactly these fields, checked against migration 0011's rules. */
export function operationRun(value: unknown): OperationRun {
  const parsed = operationRunSchema.safeParse(value)
  if (!parsed.success) throw new OperationRunError()
  return parsed.data
}

/** The run as the backup command records it: when it ran and, when it failed, the fixed code. */
export function backupRun(
  startedAt: Date,
  finishedAt: Date,
  failureReason: OperationFailureReason | null,
): OperationRun {
  return operationRun({
    failureReason,
    // A clock stepped back during the run must not make the run unrecordable.
    finishedAt: new Date(Math.max(startedAt.valueOf(), finishedAt.valueOf())).toISOString(),
    kind: 'backup',
    outcome: failureReason === null ? 'succeeded' : 'failed',
    rpoMs: null,
    rtoMs: null,
    startedAt: startedAt.toISOString(),
  })
}

/**
 * The run as the restore-drill command records it from the drill's evidence, finished at
 * `finishedAt` when the evidence has no completion time. Only a passed drill that measured both
 * its recovery point and time succeeded. A failed drill gives its first failure, the earliest
 * stage's, as its reason.
 */
export function restoreDrillRun(evidence: RestoreDrillEvidence, finishedAt: Date): OperationRun {
  const { rpoMilliseconds: rpoMs, rtoMilliseconds: rtoMs } = evidence.recovery
  const succeeded = evidence.status === 'passed' && rpoMs !== null && rtoMs !== null
  const started = Date.parse(evidence.startedAt)
  const finished = Date.parse(evidence.completedAt ?? finishedAt.toISOString())
  return operationRun({
    failureReason: succeeded ? null : (evidence.failures[0]?.code ?? 'operation_failed'),
    finishedAt: new Date(Math.max(started, finished)).toISOString(),
    kind: 'restore-drill',
    outcome: succeeded ? 'succeeded' : 'failed',
    rpoMs,
    rtoMs,
    startedAt: evidence.startedAt,
  })
}

/** A restore drill whose command failed before it had evidence to record. */
export function failedRestoreDrillRun(startedAt: Date, finishedAt: Date): OperationRun {
  return operationRun({
    failureReason: 'operation_failed',
    finishedAt: new Date(Math.max(startedAt.valueOf(), finishedAt.valueOf())).toISOString(),
    kind: 'restore-drill',
    outcome: 'failed',
    rpoMs: null,
    rtoMs: null,
    startedAt: startedAt.toISOString(),
  })
}

/** Orders runs by when they finished; of runs that finished together, the one recorded later. */
function isLater(candidate: OperationRun, latest: OperationRun | null): boolean {
  return latest === null || Date.parse(candidate.finishedAt) >= Date.parse(latest.finishedAt)
}

/** Runs kept in memory, in the order they were recorded: the store of unit tests. */
export class InMemoryOperationRunStore implements OperationRunStore {
  private readonly runs: OperationRun[] = []

  async latest(signal?: AbortSignal): Promise<LatestOperationRuns> {
    signal?.throwIfAborted()
    let backup: OperationRun | null = null
    let restoreDrill: OperationRun | null = null
    for (const run of this.runs) {
      if (run.kind === 'backup' && isLater(run, backup)) backup = run
      if (run.kind === 'restore-drill' && isLater(run, restoreDrill)) restoreDrill = run
    }
    return { backup, restoreDrill }
  }

  async record(run: OperationRun): Promise<void> {
    this.runs.push(operationRun(run))
  }
}

/**
 * A restore drill is due again this long after the last one finished. The runbook asks for one at
 * least monthly; 35 days lets a monthly drill move by a few days without turning the check stale.
 */
export const restoreDrillCadenceMs = 35 * 24 * 60 * 60 * 1000

/** What the health check and the owner job view say is wrong with a kind's latest run. */
export type RecoveryFinding = Extract<
  HealthFinding,
  'last_run_failed' | 'never_run' | 'stale' | 'targets_missed'
>
/** A backup measures no recovery target, so it cannot miss one. */
export type BackupFinding = Exclude<RecoveryFinding, 'targets_missed'>

/** How long ago a run finished, in whole milliseconds and never negative; null for none. */
export function runAgeMs(run: OperationRun | null, now: Date): number | null {
  return run === null ? null : Math.max(0, Math.round(now.valueOf() - Date.parse(run.finishedAt)))
}

/** Whether a drill's measurement met its target; null when the drill did not measure it. */
export function recoveryPointMet(run: OperationRun): boolean | null {
  return run.rpoMs === null ? null : run.rpoMs <= recoveryTargets.rpoMilliseconds
}

export function recoveryTimeMet(run: OperationRun): boolean | null {
  return run.rtoMs === null ? null : run.rtoMs <= recoveryTargets.rtoMilliseconds
}

/**
 * What is wrong with the latest backup: none was recorded, it failed, or it finished longer ago
 * than the recovery point target, so a restore now would lose more than the target allows.
 */
export function backupFinding(run: OperationRun | null, now: Date): BackupFinding | null {
  if (run === null) return 'never_run'
  if (run.outcome === 'failed') return 'last_run_failed'
  return (runAgeMs(run, now) ?? 0) > recoveryTargets.rpoMilliseconds ? 'stale' : null
}

/**
 * What is wrong with the latest restore drill: none was recorded; it failed, or it missed a
 * recovery target, which also fails a drill; it worked but does not meet the targets as they are
 * now; or it finished longer ago than the drill cadence.
 */
export function restoreDrillFinding(run: OperationRun | null, now: Date): RecoveryFinding | null {
  if (run === null) return 'never_run'
  if (run.outcome === 'failed') {
    return run.failureReason === 'rpo_exceeded' || run.failureReason === 'rto_exceeded'
      ? 'targets_missed'
      : 'last_run_failed'
  }
  if (recoveryPointMet(run) !== true || recoveryTimeMet(run) !== true) return 'targets_missed'
  return (runAgeMs(run, now) ?? 0) > restoreDrillCadenceMs ? 'stale' : null
}
