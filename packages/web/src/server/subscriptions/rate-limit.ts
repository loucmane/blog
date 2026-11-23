import { FixedWindowRateLimiter, type RateLimit } from '../security/rate-limit'

export {
  addressNetwork,
  defaultMaxRateLimitWindows,
  FixedWindowRateLimiter,
  requestNetwork,
  type RateLimit,
} from '../security/rate-limit'

/** Per-address and per-network subscription intake limits; a request must pass both. */
export const subscriptionRateLimits = {
  address: { limit: 3, windowMs: 3_600_000 },
  network: { limit: 10, windowMs: 600_000 },
} as const satisfies Readonly<Record<string, RateLimit>>

export interface SubscriptionRequestLimiter {
  readonly address: FixedWindowRateLimiter
  readonly network: FixedWindowRateLimiter
}

export function createSubscriptionRequestLimiter(): SubscriptionRequestLimiter {
  return {
    address: new FixedWindowRateLimiter(subscriptionRateLimits.address),
    network: new FixedWindowRateLimiter(subscriptionRateLimits.network),
  }
}
