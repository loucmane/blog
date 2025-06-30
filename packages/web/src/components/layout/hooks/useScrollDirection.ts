import { useState, useEffect, useRef } from 'react'

/**
 * Hook to detect scroll direction and position
 * Uses RAF debouncing for optimal performance
 */
export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up')
  const [isAtTop, setIsAtTop] = useState(true)
  const lastScrollY = useRef(0)
  const rafId = useRef<number | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (rafId.current !== null) return

      rafId.current = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY
        const threshold = 5 // Minimum scroll distance to trigger

        // Update isAtTop state
        setIsAtTop(currentScrollY < 10)

        // Only update direction if scroll exceeds threshold
        if (Math.abs(currentScrollY - lastScrollY.current) > threshold) {
          if (currentScrollY > lastScrollY.current) {
            setScrollDirection('down')
          } else if (currentScrollY < lastScrollY.current) {
            setScrollDirection('up')
          }
          lastScrollY.current = currentScrollY
        }

        rafId.current = null
      })
    }

    // Add passive listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Initial check
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [])

  return { scrollDirection, isAtTop }
}