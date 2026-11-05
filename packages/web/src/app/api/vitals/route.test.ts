import { expect, it, vi } from 'vitest'

const sink = vi.hoisted(() => ({ record: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/server/analytics/runtime', () => ({ getAnalyticsSink: () => sink }))
vi.mock('@/lib/site-url', () => ({
  resolveRuntimeSiteUrl: () => new URL('https://magazine.example.invalid'),
}))

import { POST } from './route'

it('wires the route through the same-origin validation and redacting ingestion boundary', async () => {
  const request = new Request('https://magazine.example.invalid/api/vitals', {
    method: 'POST',
    headers: { origin: 'https://magazine.example.invalid', 'content-type': 'text/plain' },
    body: JSON.stringify({
      type: 'web_vital',
      routePattern: '/stories/example',
      name: 'CLS',
      value: 0.1,
      id: 'synthetic-id',
    }),
  })
  expect((await POST(request)).status).toBe(204)
  expect(sink.record).toHaveBeenCalledExactlyOnceWith({
    type: 'web_vital',
    routePattern: '/stories/[slug]',
    name: 'CLS',
    value: 0.1,
  })
})
