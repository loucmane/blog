import { abortable } from '@/server/content/abort'
import type { ContentRepository, ExclusiveWorkLimits } from '@/server/content/ports'

export interface LabSeedTimeouts {
  /** Server-owned limits; shorter values allow deterministic timeout tests. */
  readonly storageTimeoutMs?: number
  readonly runTimeoutMs?: number
  readonly statementTimeoutMs?: number
  readonly lockTimeoutMs?: number
  readonly idleTransactionTimeoutMs?: number
  readonly cleanupTimeoutMs?: number
}

export class LabSeedTimeoutError extends Error {
  constructor(kind: 'storage' | 'run') {
    super(
      kind === 'storage'
        ? 'Lab seed storage timed out. Try again shortly.'
        : 'The lab seed reached its run deadline. Try again shortly.',
    )
    this.name = 'LabSeedTimeoutError'
  }
}

export class LabSeedLimits {
  private readonly deadline: number
  private readonly storageTimeoutMs: number
  readonly database: ExclusiveWorkLimits

  constructor({
    storageTimeoutMs = 30_000,
    runTimeoutMs = 300_000,
    statementTimeoutMs = 30_000,
    lockTimeoutMs = 30_000,
    idleTransactionTimeoutMs = 30_000,
    cleanupTimeoutMs = 5_000,
  }: LabSeedTimeouts) {
    for (const timeout of [
      storageTimeoutMs,
      runTimeoutMs,
      statementTimeoutMs,
      lockTimeoutMs,
      idleTransactionTimeoutMs,
      cleanupTimeoutMs,
    ]) {
      if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 2_147_483_647) {
        throw new Error('Lab seed timeouts must be positive timer durations.')
      }
    }
    this.storageTimeoutMs = storageTimeoutMs
    this.deadline = performance.now() + runTimeoutMs
    this.database = {
      remainingMs: () => {
        this.check()
        return Math.max(1, Math.ceil(this.deadline - performance.now()))
      },
      statementTimeoutMs,
      lockTimeoutMs,
      idleTransactionTimeoutMs,
      cleanupTimeoutMs,
    }
  }

  check(): void {
    if (performance.now() >= this.deadline) throw new LabSeedTimeoutError('run')
  }

  /** Check callback work too; the database adapter checks again immediately before COMMIT. */
  repository(repository: ContentRepository): ContentRepository {
    return {
      tryExclusive: (key, work, limits) => repository.tryExclusive(key, work, limits),
      readPublicationVersion: () => repository.readPublicationVersion(),
      transaction: (work) => {
        this.check()
        return repository.transaction(async (transaction) => {
          this.check()
          const result = await work(transaction)
          this.check()
          return result
        })
      },
    }
  }

  storage<T>(work: (signal: AbortSignal) => Promise<T>): Promise<T> {
    return this.bounded(work, this.storageTimeoutMs)
  }

  /** Instrumentation must not hold a seed open past its deadline either. */
  wait<T>(work: () => Promise<T>): Promise<T> {
    return this.bounded(work)
  }

  private async bounded<T>(
    work: (signal: AbortSignal) => Promise<T>,
    callTimeoutMs = Infinity,
  ): Promise<T> {
    this.check()
    const remaining = this.deadline - performance.now()
    const timeout = Math.min(callTimeoutMs, remaining)
    const error = new LabSeedTimeoutError(remaining <= callTimeoutMs ? 'run' : 'storage')
    const expires = performance.now() + timeout
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(error), timeout)
    try {
      const result = await abortable(controller.signal, () => work(controller.signal))
      // Synchronous work can delay timer delivery; it still cannot start another operation.
      if (performance.now() >= expires) {
        controller.abort(error)
        throw error
      }
      this.check()
      return result
    } finally {
      clearTimeout(timer)
    }
  }
}
