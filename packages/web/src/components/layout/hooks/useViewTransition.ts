import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

/**
 * Hook to handle navigation with View Transitions API
 * Falls back to regular navigation if API not supported
 */
export function useViewTransition() {
  const router = useRouter()

  const navigate = useCallback((href: string) => {
    // Check if View Transitions API is supported
    if ('startViewTransition' in document && typeof document.startViewTransition === 'function') {
      // Use View Transitions API
      document.startViewTransition(() => {
        router.push(href)
      })
    } else {
      // Fallback to regular navigation
      router.push(href)
    }
  }, [router])

  return navigate
}