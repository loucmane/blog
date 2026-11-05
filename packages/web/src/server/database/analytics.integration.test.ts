import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { Pool } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { AnalyticsEvent, VitalName } from '../analytics/ports'
import { answerVitalsRequest } from '../analytics/requests'
import { applyContentMigrations, readContentMigrations } from './migrations'
import { PostgresAnalyticsSink } from './postgres-analytics'

const databaseUrl = process.env.TASK42_DATABASE_URL
if (!databaseUrl) throw new Error('TASK42_DATABASE_URL is required for analytics integration')
const migrationId = '0009_distribution_telemetry'

describe('daily analytics on PostgreSQL', () => {
  let admin: Pool
  let pool: Pool
  let schema: string
  beforeEach(async () => {
    schema = `analytics_${randomUUID().replaceAll('-', '')}`
    admin = new Pool({ connectionString: databaseUrl, max: 1 })
    await admin.query(`CREATE SCHEMA "${schema}"`)
    pool = new Pool({ connectionString: databaseUrl, max: 8, options: `-c search_path=${schema}` })
  }, 60_000)
  afterEach(async () => {
    await pool.end()
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
    await admin.end()
  }, 60_000)

  async function migrate() {
    await applyContentMigrations(pool, await readContentMigrations())
  }
  function sink(at = '2026-11-04T12:00:00Z') {
    return new PostgresAnalyticsSink(pool, () => new Date(at))
  }
  async function tables() {
    return (
      await pool.query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = $1
       AND table_name IN ('analytics_page_views_daily', 'web_vitals_daily') ORDER BY table_name`,
        [schema],
      )
    ).rows.map((row) => row.table_name)
  }

  it.each([false, true])(
    'applies, reverses and reapplies on a %s populated database',
    async (populated) => {
      const migrations = await readContentMigrations()
      const before = migrations.filter(({ id }) => id < migrationId)
      // Up to this migration only, so a later migration does not change what this test applies.
      const upToTelemetry = migrations.filter(({ id }) => id <= migrationId)
      await applyContentMigrations(pool, before)
      if (populated)
        await pool.query(
          "INSERT INTO authors (id, display_name, slug, created_at, updated_at) VALUES ('author-telemetry', 'Synthetic Author', 'synthetic-author', now(), now())",
        )
      expect(await tables()).toEqual([])
      expect((await applyContentMigrations(pool, upToTelemetry)).applied).toEqual([migrationId])
      expect(await tables()).toEqual(['analytics_page_views_daily', 'web_vitals_daily'])
      if (populated) {
        await sink().record({ type: 'page_view', routePattern: '/' })
        await sink().record({ type: 'web_vital', routePattern: '/', name: 'CLS', value: 0.1 })
      }
      const down = await readFile(
        path.join(process.cwd(), 'packages/web/migrations/0009_distribution_telemetry.down.sql'),
        'utf8',
      )
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        await client.query(down)
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
      expect(await tables()).toEqual([])
      expect((await pool.query('SELECT count(*)::int AS n FROM authors')).rows[0]?.n).toBe(
        populated ? 1 : 0,
      )
      expect(
        (await pool.query('SELECT id FROM content_schema_migrations ORDER BY id')).rows.map(
          (row) => row.id,
        ),
      ).toEqual(before.map(({ id }) => id))
      expect((await applyContentMigrations(pool, upToTelemetry)).applied).toEqual([migrationId])
      expect((await pool.query('SELECT count(*)::int AS n FROM web_vitals_daily')).rows[0]?.n).toBe(
        0,
      )
    },
    60_000,
  )

  it('does not lose concurrent page views and separates UTC days and route patterns', async () => {
    await migrate()
    const writer = sink('2026-11-05T00:30:00+01:00')
    await Promise.all(
      Array.from({ length: 32 }, () =>
        writer.record({ type: 'page_view', routePattern: '/stories/[slug]' }),
      ),
    )
    await writer.record({ type: 'page_view', routePattern: '/' })
    await sink('2026-11-05T00:01:00Z').record({
      type: 'page_view',
      routePattern: '/stories/[slug]',
    })
    expect(
      (
        await pool.query(
          'SELECT day::text, route_pattern, views::int FROM analytics_page_views_daily ORDER BY day, route_pattern',
        )
      ).rows,
    ).toEqual([
      { day: '2026-11-04', route_pattern: '/', views: 1 },
      { day: '2026-11-04', route_pattern: '/stories/[slug]', views: 32 },
      { day: '2026-11-05', route_pattern: '/stories/[slug]', views: 1 },
    ])
  }, 60_000)

  it.each(['LCP', 'INP', 'CLS'] as const)(
    'records the weighted continuous p75 for %s, including repeated buckets',
    async (name: VitalName) => {
      await migrate()
      const scale = name === 'CLS' ? 1000 : 1
      const values = [0, 100, 200, 300, 300, 300, 400, 500].map((value) => value / scale)
      await Promise.all(
        values.map((value) =>
          sink().record({ type: 'web_vital', routePattern: '/stories/[slug]', name, value }),
        ),
      )
      const row = (
        await pool.query('SELECT sample_count::int, histogram, p75 FROM web_vitals_daily')
      ).rows[0]
      const reference = (
        await pool.query(
          'SELECT percentile_cont(0.75) WITHIN GROUP (ORDER BY value) AS p75 FROM unnest($1::double precision[]) AS value',
          [values],
        )
      ).rows[0]?.p75
      expect(row?.sample_count).toBe(8)
      expect(row?.histogram).toEqual({ '0': 1, '100': 1, '200': 1, '300': 3, '400': 1, '500': 1 })
      expect(row?.p75).toBeCloseTo(reference, 8)
      await sink().record({ type: 'web_vital', routePattern: '/', name, value: 123 / scale })
      await sink('2026-11-05T12:00:00Z').record({
        type: 'web_vital',
        routePattern: '/',
        name,
        value: 0,
      })
      const others = (
        await pool.query(
          "SELECT day::text, sample_count::int, p75 FROM web_vitals_daily WHERE route_pattern = '/' ORDER BY day",
        )
      ).rows
      expect(others).toEqual([
        { day: '2026-11-04', sample_count: 1, p75: 123 / scale },
        { day: '2026-11-05', sample_count: 1, p75: 0 },
      ])
    },
    60_000,
  )

  it('persists only safe columns and collects nothing for private routes through HTTP or direct adapters', async () => {
    await migrate()
    const writer = sink()
    const siteUrl = new URL('https://magazine.example.invalid')
    for (const routePattern of [
      '/preview/stories/private',
      '/owner',
      '/owner/stories/private/preview',
    ]) {
      for (const event of [
        { type: 'page_view', routePattern },
        { type: 'web_vital', routePattern, name: 'INP', value: 250 },
      ]) {
        await writer.record(event as AnalyticsEvent)
        const response = await answerVitalsRequest(
          new Request(new URL('/api/vitals', siteUrl), {
            method: 'POST',
            headers: { origin: siteUrl.origin, 'content-type': 'text/plain' },
            body: JSON.stringify(event),
          }),
          { siteUrl, sink: () => writer },
        )
        expect(response.status).toBe(400)
      }
    }
    expect(
      (await pool.query('SELECT count(*)::int AS n FROM analytics_page_views_daily')).rows[0]?.n,
    ).toBe(0)
    expect((await pool.query('SELECT count(*)::int AS n FROM web_vitals_daily')).rows[0]?.n).toBe(0)
    const token = ['synthetic', 'private', 'value'].join('-')
    await writer.record({
      type: 'web_vital',
      routePattern: `/stories/${token}?token=${token}`,
      name: 'LCP',
      value: 100,
      ip: '192.0.2.1',
      address: 'reader@example.invalid',
      userAgent: 'Synthetic browser',
      draft: 'Synthetic private copy',
      visitorId: token,
    } as unknown as AnalyticsEvent)
    expect(
      (
        await pool.query(
          'SELECT day::text, route_pattern, metric, sample_count::int, histogram, p75 FROM web_vitals_daily',
        )
      ).rows,
    ).toEqual([
      {
        day: '2026-11-04',
        route_pattern: '/stories/[slug]',
        metric: 'LCP',
        sample_count: 1,
        histogram: { '100': 1 },
        p75: 100,
      },
    ])
    expect(
      (
        await pool.query(
          "SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'web_vitals_daily' ORDER BY ordinal_position",
          [schema],
        )
      ).rows.map((row) => row.column_name),
    ).toEqual(['day', 'route_pattern', 'metric', 'sample_count', 'histogram', 'p75'])
  }, 60_000)
})
