'use client'

import { usePathname } from 'next/navigation'
import { useReportWebVitals } from 'next/web-vitals'
import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

import type { AnalyticsEvent } from '@/server/analytics/ports'
import { publicRoutePattern, type PublicRoutePattern } from '@/server/analytics/route-pattern'

function send(event: AnalyticsEvent) {
  try {
    navigator.sendBeacon(
      '/api/vitals',
      new Blob([JSON.stringify(event)], { type: 'application/json' }),
    )
  } catch {
    // Optional telemetry must never interrupt reading. No retry queue or browser storage.
  }
}

interface BrowserMetric {
  readonly name: string
  readonly value: number
  readonly navigationURL?: string
  readonly navigationType?: string
  readonly navigationId?: number
}

interface NavigationScope {
  readonly pathname: string | null
  readonly initial: boolean
}

/**
 * Next reports hard-navigation and, where supported, soft-navigation vitals. Attribute a metric
 * only to its own navigation, never to whichever page happens to be showing at callback time.
 */
function belongsToPage(metric: BrowserMetric, pathname: string, initial: boolean): boolean {
  if (window.location.pathname !== pathname) return false
  if (metric.navigationType === 'soft-navigation') {
    const latest = performance.getEntriesByType('soft-navigation').at(-1) as
      (PerformanceEntry & { readonly navigationId?: number }) | undefined
    // URL equality alone cannot distinguish two visits to the same path around a private page.
    if (!metric.navigationId || metric.navigationId !== latest?.navigationId) return false
  } else if (!initial) {
    // Document-level metrics can include interactions/CLS from private pages visited later.
    return false
  }
  const url =
    metric.navigationURL ??
    (metric.navigationType === 'soft-navigation'
      ? undefined
      : performance.getEntriesByType('navigation')[0]?.name)
  if (!url) return false
  try {
    const navigation = new URL(url, window.location.origin)
    return navigation.origin === window.location.origin && navigation.pathname === pathname
  } catch {
    return false
  }
}

/** Mounted only by PublicReaderTelemetry after its public-route gate succeeds. */
function WebVitalsBeacon({
  pathname,
  routePattern,
  navigationRef,
}: {
  readonly pathname: string
  readonly routePattern: PublicRoutePattern
  readonly navigationRef: RefObject<NavigationScope>
}) {
  const activeRef = useRef(false)
  const sampledRef = useRef<boolean | null>(null)
  const viewedRef = useRef(false)
  const reportedRef = useRef(new Set<string>())

  useEffect(() => {
    activeRef.current = true
    sampledRef.current ??= Math.random() < 0.1
    if (!viewedRef.current) {
      viewedRef.current = true
      send({ type: 'page_view', routePattern })
    }
    return () => {
      activeRef.current = false
    }
  }, [routePattern])

  const report = useCallback(
    (metric: BrowserMetric) => {
      if (
        !activeRef.current ||
        !sampledRef.current ||
        !belongsToPage(metric, pathname, navigationRef.current.initial)
      )
        return
      const { name, value } = metric
      if (name !== 'LCP' && name !== 'INP' && name !== 'CLS') return
      if (!Number.isFinite(value) || value < 0 || value > (name === 'CLS' ? 10 : 60_000)) return
      // One final observation per metric and mounted visit. No metric IDs leave the browser.
      if (reportedRef.current.has(name)) return
      reportedRef.current.add(name)
      send({ type: 'web_vital', routePattern, name, value })
    },
    [pathname, routePattern, navigationRef],
  )
  useReportWebVitals(report)
  return null
}

/** The shared layout can include this gate; private routes never render the beacon or its hook. */
export function PublicReaderTelemetry() {
  const pathname = usePathname()
  const navigationRef = useRef<NavigationScope>({ pathname: null, initial: true })
  useLayoutEffect(() => {
    const previous = navigationRef.current
    navigationRef.current = {
      pathname,
      initial: previous.initial && (previous.pathname === null || previous.pathname === pathname),
    }
  }, [pathname])
  const routePattern = publicRoutePattern(pathname)
  return pathname && routePattern ? (
    <WebVitalsBeacon
      key={pathname}
      pathname={pathname}
      routePattern={routePattern}
      navigationRef={navigationRef}
    />
  ) : null
}
