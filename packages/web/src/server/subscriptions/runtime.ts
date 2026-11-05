import { PostgresContentRepository } from '@/server/database/postgres-content-repository'
import { PostgresSubscriptionStore } from '@/server/database/postgres-subscriptions'
import { OwnerConfigurationError } from '@/server/owner/config'
import { getOwnerRuntime, type OwnerRuntime } from '@/server/owner/runtime'

import { InMemorySubscriptionStore } from './in-memory-store'
import { createSubscriptionRequestLimiter, type SubscriptionRequestLimiter } from './rate-limit'
import { SubscriptionService } from './service'
import type { SubscriptionStore } from './ports'

export interface SubscriptionRuntime {
  readonly limiter: SubscriptionRequestLimiter
  readonly service: SubscriptionService
  readonly store: SubscriptionStore
}

/**
 * Subscriptions on the content store the application runtime selected: PostgreSQL when it has a
 * pool, else the owner test mode's in-memory repository, whose outbox they then share.
 */
export function createSubscriptionRuntime(
  owner: Pick<OwnerRuntime, 'pool' | 'repository'>,
): SubscriptionRuntime {
  const store = owner.pool
    ? new PostgresSubscriptionStore(new PostgresContentRepository(owner.pool))
    : new InMemorySubscriptionStore(owner.repository)
  return {
    limiter: createSubscriptionRequestLimiter(),
    service: new SubscriptionService(store),
    store,
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

const runtimeSymbol = Symbol.for('magazine.subscription-runtime')
type RuntimeGlobal = typeof globalThis & { [runtimeSymbol]?: SubscriptionRuntime }

/**
 * The process's subscriptions, made on first use; null while no content store is configured, for
 * example in a production smoke run without a database. One limiter serves the whole process.
 */
export function getSubscriptionRuntime(
  owner: () => Pick<OwnerRuntime, 'pool' | 'repository'> = getOwnerRuntime,
): SubscriptionRuntime | null {
  const runtimeGlobal = globalThis as RuntimeGlobal
  if (!runtimeGlobal[runtimeSymbol]) {
    try {
      runtimeGlobal[runtimeSymbol] = createSubscriptionRuntime(owner())
    } catch (error) {
      if (isConfigurationError(error)) return null
      throw error
    }
  }
  return runtimeGlobal[runtimeSymbol]
}
