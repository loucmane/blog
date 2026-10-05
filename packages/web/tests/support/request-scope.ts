/*
 * A stand-in for the request scope behind `cookies()` and `headers()` from `next/headers`, which
 * only exist inside a running Next server. Tests set the incoming cookies and headers, then read
 * the cookies a server action wrote. Use it with:
 *
 *   vi.mock('next/headers', async () => (await import('../support/request-scope')).nextHeaders)
 */

export interface CookieWrite {
  readonly name: string
  readonly options: Readonly<Record<string, unknown>>
  readonly value: string
}

const scope = {
  cookies: new Map<string, string>(),
  headers: new Headers(),
  writes: [] as CookieWrite[],
}

function cookieHeader(): string {
  return [...scope.cookies]
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join('; ')
}

export const requestScope = {
  /** Starts a new request with no cookies, no extra headers, and no recorded writes. */
  reset(): void {
    scope.cookies = new Map()
    scope.headers = new Headers()
    scope.writes = []
  },
  /** Sets the cookies the browser sends with the request. */
  setCookies(cookies: Readonly<Record<string, string>>): void {
    scope.cookies = new Map(Object.entries(cookies))
  },
  /** Sets one request header, such as `origin`. */
  setHeader(name: string, value: string): void {
    scope.headers.set(name, value)
  },
  /** The cookies written during the request, in order. A deletion has an empty value. */
  get writes(): readonly CookieWrite[] {
    return scope.writes
  },
}

export const nextHeaders = {
  async cookies() {
    const jar = new Map(scope.cookies)
    return {
      delete(name: string) {
        jar.delete(name)
        scope.writes.push({ name, options: { maxAge: 0 }, value: '' })
      },
      get(name: string) {
        const value = jar.get(name)
        return value === undefined ? undefined : { name, value }
      },
      getAll() {
        return [...jar].map(([name, value]) => ({ name, value }))
      },
      has(name: string) {
        return jar.has(name)
      },
      set(name: string, value: string, options: Readonly<Record<string, unknown>> = {}) {
        jar.set(name, value)
        scope.writes.push({ name, options, value })
      },
    }
  },
  async headers() {
    const headers = new Headers(scope.headers)
    const cookies = cookieHeader()
    if (cookies) headers.set('cookie', cookies)
    return headers
  },
}
