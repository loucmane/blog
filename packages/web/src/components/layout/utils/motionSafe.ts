/**
 * Utility to conditionally apply motion classes
 * Respects user's prefers-reduced-motion setting
 */
export function motionSafe(classes: string): string {
  // Split classes into array
  const classArray = classes.split(' ').filter(Boolean)
  
  // Prefix each class with motion-safe:
  const motionSafeClasses = classArray.map(cls => `motion-safe:${cls}`)
  
  // Add motion-reduce fallback
  motionSafeClasses.push('motion-reduce:transition-none')
  
  return motionSafeClasses.join(' ')
}

/**
 * Utility to get transition duration based on motion preference
 * Returns 0 for reduced motion, normal duration otherwise
 */
export function getMotionDuration(duration: number): number {
  if (typeof window === 'undefined') return duration
  
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return prefersReducedMotion ? 0 : duration
}