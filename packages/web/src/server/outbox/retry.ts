const minute = 60_000
const hour = 60 * minute

/**
 * How long a failed event waits before each retry: a minute after its first failure, then five
 * minutes, thirty minutes, two hours and twelve hours. Every delay is used: an event is tried once
 * and then retried after each of the five, and it is dead-lettered when the fifth retry fails as
 * well, at attempts = 6. That is how the plan's "dead-lettered after the fifth failure" is read:
 * the fifth failed retry, not the fifth failed attempt, which would leave the 12 h delay unused.
 */
export const outboxRetryDelaysMs: readonly number[] = [
  minute,
  5 * minute,
  30 * minute,
  2 * hour,
  12 * hour,
]

/** The wait before retrying an event that has now failed `failures` times; null once spent. */
export function outboxRetryDelayMs(failures: number): number | null {
  return outboxRetryDelaysMs[Math.max(failures, 1) - 1] ?? null
}
