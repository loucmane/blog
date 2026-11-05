import { describe, expect, it, vi } from 'vitest'

import { answerVitalsRequest, maxAnalyticsRequestBytes } from './requests'

const siteUrl = new URL('https://magazine.example.invalid')
function request(payload: unknown, headers: Record<string, string> = {}) {
  return new Request(new URL('/api/vitals', siteUrl), {
    body: JSON.stringify(payload),
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: siteUrl.origin, ...headers },
  })
}
function dependencies() {
  const record = vi.fn().mockResolvedValue(undefined)
  return { record, sink: vi.fn(() => ({ record })), siteUrl }
}

describe('vitals ingestion', () => {
  it.each(['application/json', 'text/plain;charset=UTF-8'])(
    'accepts a first-party beacon as %s after redaction',
    async (contentType) => {
      const deps = dependencies()
      const response = await answerVitalsRequest(
        request(
          {
            type: 'web_vital',
            routePattern: '/stories/example?email=reader@example.invalid',
            name: 'INP',
            value: 120,
            id: 'synthetic-metric-id',
            draft: 'synthetic private text',
          },
          {
            'content-type': contentType,
            'user-agent': 'Synthetic browser',
            'x-forwarded-for': '192.0.2.1',
          },
        ),
        deps,
      )
      expect(response.status).toBe(204)
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(response.headers.get('set-cookie')).toBeNull()
      expect(await response.text()).toBe('')
      expect(deps.record).toHaveBeenCalledExactlyOnceWith({
        type: 'web_vital',
        routePattern: '/stories/[slug]',
        name: 'INP',
        value: 120,
      })
    },
  )

  it.each([
    '/preview',
    '/preview/stories/[slug]',
    '/owner',
    '/owner/stories/example',
    '/owner/stories/example/preview',
    '/api/owner/stories',
  ])('collects zero events for %s at the server', async (routePattern) => {
    const deps = dependencies()
    for (const event of [
      { type: 'page_view', routePattern },
      { type: 'web_vital', routePattern, name: 'LCP', value: 2500 },
    ]) {
      expect((await answerVitalsRequest(request(event), deps)).status).toBe(400)
    }
    expect(deps.sink).not.toHaveBeenCalled()
    expect(deps.record).not.toHaveBeenCalled()
  })

  it.each([
    [{ origin: 'https://elsewhere.example.invalid' }, 403],
    [{ origin: 'null' }, 403],
    [{ 'sec-fetch-site': 'cross-site' }, 403],
    [{ 'content-type': 'application/x-www-form-urlencoded' }, 415],
    [{ 'content-length': String(maxAnalyticsRequestBytes + 1) }, 413],
  ] as const)('refuses invalid request headers %#', async (headers, status) => {
    const deps = dependencies()
    expect(
      (await answerVitalsRequest(request({ type: 'page_view', routePattern: '/' }, headers), deps))
        .status,
    ).toBe(status)
    expect(deps.sink).not.toHaveBeenCalled()
  })

  it('bounds the actual streamed bytes and rejects malformed JSON and metric values', async () => {
    const deps = dependencies()
    expect(
      (await answerVitalsRequest(request({ extra: 'x'.repeat(maxAnalyticsRequestBytes) }), deps))
        .status,
    ).toBe(413)
    expect(
      (
        await answerVitalsRequest(
          new Request(new URL('/api/vitals', siteUrl), {
            method: 'POST',
            headers: { origin: siteUrl.origin, 'content-type': 'text/plain' },
            body: '{',
          }),
          deps,
        )
      ).status,
    ).toBe(400)
    for (const value of [-1, 60001, '2500', null]) {
      expect(
        (
          await answerVitalsRequest(
            request({ type: 'web_vital', routePattern: '/', name: 'LCP', value }),
            deps,
          )
        ).status,
      ).toBe(400)
    }
    expect(deps.sink).not.toHaveBeenCalled()
  })

  it('records an unsampled page-view event', async () => {
    const deps = dependencies()
    expect(
      (await answerVitalsRequest(request({ type: 'page_view', routePattern: '/' }), deps)).status,
    ).toBe(204)
    expect(deps.record).toHaveBeenCalledExactlyOnceWith({ type: 'page_view', routePattern: '/' })
  })

  it('does not expose or log database failures or sink configuration errors', async () => {
    const deps = dependencies()
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    deps.record.mockRejectedValue(new Error('Synthetic private database details'))
    const response = await answerVitalsRequest(
      request({ type: 'page_view', routePattern: '/' }),
      deps,
    )
    expect(response.status).toBe(503)
    expect(await response.text()).toBe('')
    expect(log).not.toHaveBeenCalled()
    deps.sink.mockImplementation(() => {
      throw new Error('Synthetic configuration details')
    })
    expect(
      (await answerVitalsRequest(request({ type: 'page_view', routePattern: '/' }), deps)).status,
    ).toBe(503)
  })
})
