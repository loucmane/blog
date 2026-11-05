/** Pure, browser-safe route allowlist. Never return a path segment supplied by a visitor. */
export const publicRoutePatterns = [
  '/',
  '/stories/[slug]',
  '/sections/[slug]',
  '/topics/[slug]',
  '/authors/[slug]',
] as const

export type PublicRoutePattern = (typeof publicRoutePatterns)[number]

export function publicRoutePattern(path: unknown): PublicRoutePattern | null {
  if (typeof path !== 'string' || path.length > 2048) return null
  const pathname = path.split(/[?#]/, 1)[0]
  if (pathname === '/') return '/'
  for (const pattern of publicRoutePatterns.slice(1)) {
    if (pathname === pattern) return pattern
    const prefix = pattern.slice(0, -'[slug]'.length)
    if (
      pathname?.startsWith(prefix) &&
      /^[a-z0-9]+(?:-[a-z0-9]+)*\/?$/.test(pathname.slice(prefix.length))
    ) {
      return pattern
    }
  }
  return null
}
