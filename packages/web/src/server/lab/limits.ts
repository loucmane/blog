import { abortable } from '@/server/content/abort'
import type { ContentRepository } from '@/server/content/ports'

export interface LabSeedTimeouts {
  /** Server-owned limits; shorter values allow deterministic timeout tests. */
  readonly storageTimeoutMs?: number
  readonly runTimeoutMs?: number
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

  constructor({ storageTimeoutMs = 30_000, runTimeoutMs = 300_000 }: LabSeedTimeouts) {
    for (const timeout of [storageTimeoutMs, runTimeoutMs]) {
      if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 2_147_483_647) {
        throw new Error('Lab seed timeouts must be positive timer durations.')
      }
    }
    this.storageTimeoutMs = storageTimeoutMs
    this.deadline = performance.now() + runTimeoutMs
  }

  check(): void {
    if (performance.now() >= this.deadline) throw new LabSeedTimeoutError('run')
  }

  /** Check before each transaction and before commit; never abandon live SQL work. */
  repository(repository: ContentRepository): ContentRepository {
    return {
      tryExclusive: (key, work) => repository.tryExclusive(key, work),
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
