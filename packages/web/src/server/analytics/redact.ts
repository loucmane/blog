import { z } from 'zod'

import type { AnalyticsEvent } from './ports'
import { publicRoutePattern } from './route-pattern'

const eventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('page_view'), routePattern: z.string().max(2048) }),
  z.object({
    type: z.literal('web_vital'),
    routePattern: z.string().max(2048),
    name: z.enum(['LCP', 'INP', 'CLS']),
    value: z.number().min(0).max(60_000),
  }),
])

/**
 * The sole write allowlist. Constructs a fresh record; no spreading, recursive copying or
 * logging of unknown input. Timings are milliseconds, CLS is unitless to three decimal places.
 */
export function redactEventPayload(payload: unknown): AnalyticsEvent | null {
  const parsed = eventSchema.safeParse(payload)
  if (!parsed.success) return null
  const event = parsed.data
  const routePattern = publicRoutePattern(event.routePattern)
  if (!routePattern) return null
  if (event.type === 'page_view') return { type: 'page_view', routePattern }
  if (event.name === 'CLS' && event.value > 10) return null
  const scale = event.name === 'CLS' ? 1000 : 1
  return {
    type: 'web_vital',
    routePattern,
    name: event.name,
    value: Math.round(event.value * scale) / scale,
  }
}
