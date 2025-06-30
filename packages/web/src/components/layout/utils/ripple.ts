import { useState, useCallback } from 'react'

interface Ripple {
  id: number
  x: number
  y: number
}

/**
 * Hook to create ripple effects on click
 * Simplified implementation for performance
 */
export function useRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([])

  const createRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const ripple: Ripple = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      id: Date.now()
    }

    setRipples(prev => [...prev, ripple])

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id))
    }, 600)
  }, [])

  return { ripples, createRipple }
}