import { createHash, randomUUID } from 'node:crypto'

import { z } from 'zod'

import { canonicalJson } from '../content/portability'

export const recoveryTargets = { rpoMilliseconds: 86_400_000, rtoMilliseconds: 14_400_000 }

function localUrl(value: string, protocols: readonly string[]): boolean {
  try {
    const url = new URL(value)
    return (
      protocols.includes(url.protocol) &&
      ['127.0.0.1', '[::1]'].includes(url.hostname) &&
      !url.search &&
      !url.hash
    )
  } catch {
    return false
  }
}

const objects = z
  .object({
    endpoint: z.string().refine((value) => {
      if (!localUrl(value, ['http:', 'https:'])) return false
      const url = new URL(value)
      return !url.username && !url.password && url.pathname === '/'
    }),
    bucket: z.string(),
    region: z.string().min(1).max(100),
    accessKeyId: z.string().min(1),
    secretAccessKey: z.string().min(1),
  })
  .strict()

function location(kind: 'source' | 'target') {
  return z
    .object({
      databaseUrl: z.string().refine((value) => {
        if (!localUrl(value, ['postgres:', 'postgresql:'])) return false
        const url = new URL(value)
        return (
          Boolean(url.username) &&
          new RegExp(`^/restore_drill_${kind}_[a-z0-9_]{1,32}$`).test(url.pathname)
        )
      }),
      objects: objects.refine((value) =>
        new RegExp(`^restore-drill-${kind}-[a-z0-9-]{1,32}$`).test(value.bucket),
      ),
    })
    .strict()
}

export const restoreDrillConfig = z
  .object({
    isolated: z.literal(true),
    source: location('source'),
    target: location('target'),
  })
  .strict()

export type RestoreDrillConfig = z.infer<typeof restoreDrillConfig>
export type DrillLocation = RestoreDrillConfig['source']
export type DrillStage =
  | 'configuration'
  | 'preflight'
  | 'backup'
  | 'restore'
  | 'migrations'
  | 'comparison'
  | 'export'
  | 'cleanup'
export type DrillFailureCode =
  | 'invalid_configuration'
  | 'operation_failed'
  | 'unsupported_version'
  | 'target_exists'
  | 'migration_identity_mismatch'
  | 'row_count_mismatch'
  | 'invariant_changed'
  | 'missing_object'
  | 'orphaned_object'
  | 'checksum_mismatch'
  | 'export_invalid'
  | 'rpo_exceeded'
  | 'rto_exceeded'
  | 'invalid_clock'

export interface DrillFailure {
  readonly code: DrillFailureCode
  readonly stage: DrillStage
  readonly subject?: string
}

export class DrillError extends Error {
  constructor(readonly code: DrillFailureCode) {
    super(code)
  }
}

export function hash(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

export function fingerprint(value: unknown): string {
  return hash(canonicalJson(value))
}

export interface TableEvidence {
  readonly count: number
  readonly sha256: string
}

export interface RestoreDrillEvidence {
  readonly schemaVersion: 1
  readonly id: string
  status: 'failed' | 'passed'
  readonly startedAt: string
  completedAt: string | null
  snapshotAt: string | null
  restoreStartedAt: string | null
  readonly environment: 'isolated-local'
  identities: { source: string; target: string } | null
  readonly tools: {
    node: string
    pgDump: string | null
    pgRestore: string | null
    sourcePostgres: string | null
    targetPostgres: string | null
  }
  backup: { sha256: string; bytes: number; mediaManifestSha256: string } | null
  readonly migrations: {
    reviewedSha256: string | null
    sourceSha256: string | null
    restoredSha256: string | null
    finalSha256: string | null
    appliedCount: number
  }
  readonly tables: {
    source: Record<string, TableEvidence>
    restored: Record<string, TableEvidence>
  }
  readonly media: {
    expected: number
    copied: number
    verified: number
    objects: {
      identitySha256: string
      expectedSha256: string
      restoredSha256: string | null
      bytes: number
    }[]
  }
  export: { status: 'not-run' | 'invalid' | 'valid'; sha256: string | null }
  readonly recovery: {
    rpoMilliseconds: number | null
    rtoMilliseconds: number | null
    rpoMet: boolean
    rtoMet: boolean
    targets: typeof recoveryTargets
  }
  readonly failures: DrillFailure[]
}

export function newDrillEvidence(now = new Date()): RestoreDrillEvidence {
  return {
    schemaVersion: 1,
    id: randomUUID(),
    status: 'failed',
    startedAt: now.toISOString(),
    completedAt: null,
    snapshotAt: null,
    restoreStartedAt: null,
    environment: 'isolated-local',
    identities: null,
    tools: {
      node: process.versions.node,
      pgDump: null,
      pgRestore: null,
      sourcePostgres: null,
      targetPostgres: null,
    },
    backup: null,
    migrations: {
      reviewedSha256: null,
      sourceSha256: null,
      restoredSha256: null,
      finalSha256: null,
      appliedCount: 0,
    },
    tables: { source: {}, restored: {} },
    media: { expected: 0, copied: 0, verified: 0, objects: [] },
    export: { status: 'not-run', sha256: null },
    recovery: {
      rpoMilliseconds: null,
      rtoMilliseconds: null,
      rpoMet: false,
      rtoMet: false,
      targets: { ...recoveryTargets },
    },
    failures: [],
  }
}

export function measureRecovery(
  evidence: RestoreDrillEvidence,
  completed: Date,
  elapsed: number | null,
): void {
  evidence.completedAt = completed.toISOString()
  const rpo =
    evidence.snapshotAt === null ? null : completed.getTime() - Date.parse(evidence.snapshotAt)
  const invalid =
    (rpo !== null && (!Number.isFinite(rpo) || rpo < 0)) ||
    (elapsed !== null && (!Number.isFinite(elapsed) || elapsed < 0))
  if (invalid) evidence.failures.push({ code: 'invalid_clock', stage: 'comparison' })
  evidence.recovery.rpoMilliseconds = rpo !== null && Number.isFinite(rpo) && rpo >= 0 ? rpo : null
  evidence.recovery.rtoMilliseconds =
    elapsed !== null && Number.isFinite(elapsed) && elapsed >= 0 ? Math.ceil(elapsed) : null
  evidence.recovery.rpoMet = rpo !== null && rpo >= 0 && rpo <= recoveryTargets.rpoMilliseconds
  evidence.recovery.rtoMet =
    elapsed !== null && elapsed >= 0 && elapsed <= recoveryTargets.rtoMilliseconds
  if (rpo !== null && rpo > recoveryTargets.rpoMilliseconds)
    evidence.failures.push({ code: 'rpo_exceeded', stage: 'comparison' })
  if (elapsed !== null && elapsed > recoveryTargets.rtoMilliseconds)
    evidence.failures.push({ code: 'rto_exceeded', stage: 'comparison' })
}
