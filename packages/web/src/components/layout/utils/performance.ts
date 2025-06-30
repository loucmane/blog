import * as React from 'react'

/**
 * Performance monitoring utilities
 * Only active in development mode
 */

/**
 * Measure component render performance
 * Logs to console in development only
 */
export function measureComponentPerformance(componentName: string) {
  if (process.env.NODE_ENV !== 'development') {
    return (WrappedComponent: React.ComponentType<any>) => WrappedComponent
  }

  return (WrappedComponent: React.ComponentType<any>) => {
    return (props: any) => {
      const startTime = performance.now()

      React.useEffect(() => {
        const endTime = performance.now()
        const renderTime = endTime - startTime
        
        // Log if render time exceeds threshold
        if (renderTime > 16) { // 16ms = 60fps
          console.warn(`[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms`)
        }
      })

      return <WrappedComponent {...props} />
    }
  }
}

/**
 * RAF-based debounce for scroll handlers
 * Ensures callbacks run at most once per frame
 */
export function rafDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 0
): T {
  let rafId: number | null = null
  let lastArgs: any[] = []

  const debounced = (...args: any[]) => {
    lastArgs = args

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (delay > 0) {
          setTimeout(() => {
            callback(...lastArgs)
          }, delay)
        } else {
          callback(...lastArgs)
        }
        rafId = null
      })
    }
  }

  // Add cancel method
  ;(debounced as any).cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  return debounced as T
}

/**
 * Prefetch critical pages for better performance
 */
export function prefetchCriticalPages(pages: string[]) {
  if (typeof window === 'undefined') return

  pages.forEach(href => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = href
    link.as = 'document'
    document.head.appendChild(link)
  })
}