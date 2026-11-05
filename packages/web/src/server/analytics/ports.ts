import type { PublicRoutePattern } from './route-pattern'

export type VitalName = 'LCP' | 'INP' | 'CLS'

/** Deliberately no user, session, event id, timestamp, URL, referrer or arbitrary metadata. */
export type AnalyticsEvent =
  | { readonly type: 'page_view'; readonly routePattern: PublicRoutePattern }
  | {
      readonly type: 'web_vital'
      readonly routePattern: PublicRoutePattern
      readonly name: VitalName
      readonly value: number
    }

export interface AnalyticsSink {
  record(event: AnalyticsEvent): Promise<void>
}

/** Rollback/disabled adapter; callers retain the same contract without storing anything. */
export const noopAnalyticsSink: AnalyticsSink = {
  async record() {},
}
