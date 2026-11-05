import { describe, expect, it, vi } from 'vitest'

import type { AnalyticsEvent } from '../analytics/ports'
import { PostgresAnalyticsSink } from './postgres-analytics'

describe('PostgreSQL analytics boundary', () => {
  it('writes only allowlisted aggregates even when a caller bypasses TypeScript', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] })
    const sink = new PostgresAnalyticsSink({ query }, () => new Date('2026-11-05T00:30:00+01:00'))
    const token = ['synthetic', 'secret'].join('-')
    const raw = {
      type: 'page_view',
      routePattern: `/stories/${token}?token=${token}`,
      address: 'reader@example.invalid',
      ip: '192.0.2.1',
      userAgent: 'Example',
      draft: 'Private synthetic copy',
      visitorId: token,
      token,
      timestamp: '1999-01-01',
    } as unknown as AnalyticsEvent
    await sink.record(raw)
    expect(query).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT'), [
      '2026-11-04',
      '/stories/[slug]',
    ])
    expect(JSON.stringify(query.mock.calls)).not.toContain(token)
    expect(JSON.stringify(query.mock.calls)).not.toContain('reader@example.invalid')
    expect(JSON.stringify(query.mock.calls)).not.toContain('Private synthetic copy')
    expect(JSON.stringify(query.mock.calls)).not.toContain('192.0.2.1')
  })

  it.each([
    ['LCP', 1234.6, '1235'],
    ['INP', 201.2, '201'],
    ['CLS', 0.123456, '123'],
  ])(
    'increments a weighted bucket for %s without a raw observation row',
    async (name, value, bucket) => {
      const query = vi.fn().mockResolvedValue({ rows: [] })
      const sink = new PostgresAnalyticsSink({ query }, () => new Date('2026-11-04T12:00:00Z'))
      await sink.record({ type: 'web_vital', routePattern: '/', name, value } as AnalyticsEvent)
      expect(query).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('jsonb_set'), [
        '2026-11-04',
        '/',
        name,
        bucket,
      ])
    },
  )

  it.each(['/preview/stories/example', '/owner', '/owner/stories/example/preview'])(
    'never writes a private route %s',
    async (routePattern) => {
      const query = vi.fn()
      const sink = new PostgresAnalyticsSink({ query })
      await sink.record({ type: 'page_view', routePattern } as AnalyticsEvent)
      await sink.record({
        type: 'web_vital',
        routePattern,
        name: 'CLS',
        value: 0,
      } as AnalyticsEvent)
      expect(query).not.toHaveBeenCalled()
    },
  )

  it('lets the HTTP boundary handle write failures', async () => {
    const query = vi.fn().mockRejectedValue(new Error('Synthetic unavailable store'))
    await expect(
      new PostgresAnalyticsSink({ query }).record({ type: 'page_view', routePattern: '/' }),
    ).rejects.toThrow('Synthetic unavailable store')
  })
})
