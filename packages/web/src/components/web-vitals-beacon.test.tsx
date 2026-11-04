// @vitest-environment jsdom

import { act, cleanup, render } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PublicReaderTelemetry } from './web-vitals-beacon'

const hooks = vi.hoisted(() => ({
  pathname: '/' as string | null,
  report: vi.fn(),
}))
vi.mock('next/navigation', () => ({ usePathname: () => hooks.pathname }))
vi.mock('next/web-vitals', () => ({ useReportWebVitals: hooks.report }))

interface TestMetric {
  readonly name: string
  readonly value: number
  readonly navigationURL?: string
  readonly navigationType?: string
  readonly navigationId?: number
}
const sendBeacon = vi.fn<(url: string, body: Blob) => boolean>()
const bodyTexts: string[] = []

function navigate(pathname: string) {
  hooks.pathname = pathname
  window.history.replaceState(null, '', pathname)
}
function callback(): (metric: TestMetric) => void {
  return hooks.report.mock.calls.at(-1)![0] as (metric: TestMetric) => void
}
function metric(name = 'LCP', value = 2500): TestMetric {
  return { name, value, navigationURL: window.location.href }
}
beforeEach(() => {
  hooks.report.mockClear()
  bodyTexts.length = 0
  navigate('/')
  vi.spyOn(Math, 'random').mockReturnValue(0.05)
  vi.stubGlobal(
    'Blob',
    class {
      constructor(parts: string[]) {
        bodyTexts.push(parts.join(''))
      }
    },
  )
  Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: sendBeacon })
  sendBeacon.mockReset().mockReturnValue(true)
  vi.spyOn(performance, 'getEntriesByType').mockReturnValue([])
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('invisible public reader telemetry', () => {
  it.each([
    '/preview',
    '/preview/stories/example',
    '/owner',
    '/owner/sign-in',
    '/owner/stories/example/preview',
    '/api/owner/stories',
    '/subscriptions/confirm',
    '/missing',
  ])('never renders a beacon or registers vitals on %s', (path) => {
    navigate(path)
    const { container } = render(<PublicReaderTelemetry />)
    expect(container).toBeEmptyDOMElement()
    expect(hooks.report).not.toHaveBeenCalled()
    expect(sendBeacon).not.toHaveBeenCalled()
    expect(Math.random).not.toHaveBeenCalled()
  })

  it('does not render a beacon while the pathname is unavailable', () => {
    hooks.pathname = null
    render(<PublicReaderTelemetry />)
    expect(hooks.report).not.toHaveBeenCalled()
    expect(sendBeacon).not.toHaveBeenCalled()
  })

  it.each([
    ['/', '/'],
    ['/stories/example', '/stories/[slug]'],
    ['/sections/culture', '/sections/[slug]'],
    ['/topics/ideas', '/topics/[slug]'],
    ['/authors/example', '/authors/[slug]'],
  ])('records an anonymous page view on %s without changing markup', (path, routePattern) => {
    navigate(path)
    const { container } = render(<PublicReaderTelemetry />)
    expect(container).toBeEmptyDOMElement()
    expect(bodyTexts.map((body) => JSON.parse(body))).toEqual([{ type: 'page_view', routePattern }])
    expect(sendBeacon).toHaveBeenCalledWith('/api/vitals', expect.any(Blob))
  })

  it.each([
    [0, true],
    [0.099999, true],
    [0.1, false],
    [0.999999, false],
  ])('uses the 10 percent sampling boundary at %s', (random, sampled) => {
    vi.mocked(Math.random).mockReturnValue(random)
    render(<PublicReaderTelemetry />)
    for (const name of ['LCP', 'INP', 'CLS']) act(() => callback()(metric(name, 0.1)))
    expect(sendBeacon).toHaveBeenCalledTimes(sampled ? 4 : 1)
    expect(Math.random).toHaveBeenCalledOnce()
  })

  it('sends only final allowlisted fields, with no duplicate metric or Strict Mode page view', () => {
    navigate('/stories/example')
    const { rerender } = render(
      <StrictMode>
        <PublicReaderTelemetry />
      </StrictMode>,
    )
    act(() =>
      callback()({
        ...metric(),
        id: 'synthetic-id',
        entries: [{ text: 'private synthetic draft' }],
      } as TestMetric),
    )
    act(() => callback()(metric()))
    act(() => callback()(metric('FCP')))
    act(() => callback()(metric('INP', -1)))
    act(() => callback()(metric('INP', Infinity)))
    act(() => callback()(metric('CLS', 11)))
    rerender(
      <StrictMode>
        <PublicReaderTelemetry />
      </StrictMode>,
    )
    expect(bodyTexts.map((body) => JSON.parse(body))).toEqual([
      { type: 'page_view', routePattern: '/stories/[slug]' },
      { type: 'web_vital', routePattern: '/stories/[slug]', name: 'LCP', value: 2500 },
    ])
    expect(Math.random).toHaveBeenCalledOnce()
  })

  it('drops stale callbacks before and after a public-to-private transition, including return navigation', () => {
    navigate('/stories/first')
    const { rerender } = render(<PublicReaderTelemetry />)
    const firstReport = callback()
    const firstMetric = metric()
    navigate('/preview/stories/private')
    act(() => firstReport(firstMetric)) // URL changes before React commits the private page.
    rerender(<PublicReaderTelemetry />)
    act(() => firstReport(firstMetric))
    expect(sendBeacon).toHaveBeenCalledTimes(1)
    navigate('/stories/first')
    rerender(<PublicReaderTelemetry />)
    act(() => firstReport(firstMetric)) // Next's hook does not unsubscribe old observers.
    expect(sendBeacon).toHaveBeenCalledTimes(2)
    act(() => callback()(firstMetric))
    expect(sendBeacon).toHaveBeenCalledTimes(2) // No hard-navigation data after a private visit.
    vi.mocked(performance.getEntriesByType).mockReturnValue([
      { navigationId: 3 } as unknown as PerformanceEntry,
    ])
    act(() => callback()({ ...firstMetric, navigationType: 'soft-navigation', navigationId: 1 }))
    expect(sendBeacon).toHaveBeenCalledTimes(2)
    act(() => callback()({ ...firstMetric, navigationType: 'soft-navigation', navigationId: 3 }))
    expect(sendBeacon).toHaveBeenCalledTimes(3)
  })

  it('counts soft visits, rejects mismatched navigation metrics, and handles the hard navigation fallback', () => {
    navigate('/stories/first')
    vi.mocked(performance.getEntriesByType).mockReturnValue([
      { name: window.location.href } as PerformanceEntry,
    ])
    const { rerender } = render(<PublicReaderTelemetry />)
    act(() => callback()({ name: 'INP', value: 120 }))
    navigate('/stories/second')
    rerender(<PublicReaderTelemetry />)
    act(() => callback()({ name: 'INP', value: 120 })) // Old hard-navigation measurement.
    act(() => callback()({ name: 'LCP', value: 120, navigationType: 'soft-navigation' }))
    act(() =>
      callback()({
        ...metric(),
        navigationURL: 'https://elsewhere.example.invalid/stories/second',
      }),
    )
    act(() => callback()({ ...metric(), navigationURL: 'http://[' }))
    expect(sendBeacon).toHaveBeenCalledTimes(3)
    vi.mocked(performance.getEntriesByType).mockReturnValue([
      { navigationId: 2 } as unknown as PerformanceEntry,
    ])
    act(() => callback()({ ...metric(), navigationType: 'soft-navigation', navigationId: 2 }))
    expect(sendBeacon).toHaveBeenCalledTimes(4)
  })

  it('does not attribute a private initial document to the first public client navigation', () => {
    navigate('/owner')
    const { rerender } = render(<PublicReaderTelemetry />)
    navigate('/stories/example')
    rerender(<PublicReaderTelemetry />)
    act(() => callback()(metric()))
    expect(sendBeacon).toHaveBeenCalledTimes(1)
  })

  it('rejects metrics without a trustworthy navigation URL on the initial public document', () => {
    render(<PublicReaderTelemetry />)
    act(() => callback()({ name: 'LCP', value: 120 }))
    act(() => callback()({ ...metric(), navigationURL: 'http://[' }))
    act(() => callback()({ ...metric(), navigationURL: 'https://elsewhere.example.invalid/' }))
    act(() => callback()({ ...metric(), navigationURL: `${window.location.origin}/owner` }))
    expect(sendBeacon).toHaveBeenCalledTimes(1)
  })

  it('does not interrupt rendering when the browser cannot queue a beacon', () => {
    sendBeacon.mockImplementation(() => {
      throw new Error('Synthetic browser refusal')
    })
    expect(() => render(<PublicReaderTelemetry />)).not.toThrow()
    expect(() => act(() => callback()(metric()))).not.toThrow()
  })
})
