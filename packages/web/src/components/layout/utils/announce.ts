/**
 * Utility to announce messages to screen readers
 * Creates temporary live region for accessibility
 */
export function announce(
  message: string, 
  priority: 'polite' | 'assertive' = 'polite',
  timeout: number = 1000
) {
  // Create live region element
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  
  // Make it visually hidden but accessible to screen readers
  announcement.style.position = 'absolute'
  announcement.style.left = '-10000px'
  announcement.style.width = '1px'
  announcement.style.height = '1px'
  announcement.style.overflow = 'hidden'
  
  // Set the message
  announcement.textContent = message
  
  // Add to document
  document.body.appendChild(announcement)
  
  // Remove after timeout
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, timeout)
}