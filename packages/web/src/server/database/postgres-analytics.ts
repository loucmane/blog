import type { AnalyticsEvent, AnalyticsSink } from '../analytics/ports'
import { redactEventPayload } from '../analytics/redact'

/** A pg Pool satisfies this contract. Neither headers nor raw payloads reach it. */
export interface AnalyticsDatabase {
  query(text: string, values: unknown[]): Promise<unknown>
}

/**
 * First-party, identifier-free daily aggregates. Single-statement upserts serialize concurrent
 * writes to each daily key, so no read/modify/write race loses counts or histogram observations.
 */
export class PostgresAnalyticsSink implements AnalyticsSink {
  constructor(
    private readonly database: AnalyticsDatabase,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async record(payload: AnalyticsEvent): Promise<void> {
    // Repeat redaction at the persistence boundary, including for non-HTTP callers.
    const event = redactEventPayload(payload)
    if (!event) return
    const day = this.now().toISOString().slice(0, 10)
    if (event.type === 'page_view') {
      await this.database.query(
        `INSERT INTO analytics_page_views_daily (day, route_pattern, views)
         VALUES ($1::date, $2, 1)
         ON CONFLICT (day, route_pattern) DO UPDATE
         SET views = analytics_page_views_daily.views + 1`,
        [day, event.routePattern],
      )
      return
    }
    const bucket = String(Math.round(event.value * (event.name === 'CLS' ? 1000 : 1)))
    await this.database.query(
      `INSERT INTO web_vitals_daily (day, route_pattern, metric, sample_count, histogram)
       VALUES ($1::date, $2, $3, 1, jsonb_build_object($4::text, 1))
       ON CONFLICT (day, route_pattern, metric) DO UPDATE
       SET sample_count = web_vitals_daily.sample_count + 1,
           histogram = jsonb_set(web_vitals_daily.histogram, ARRAY[$4::text],
             to_jsonb(coalesce((web_vitals_daily.histogram ->> $4::text)::bigint, 0) + 1))`,
      [day, event.routePattern, event.name, bucket],
    )
  }
}
