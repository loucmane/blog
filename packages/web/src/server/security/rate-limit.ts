import { createHmac, randomBytes } from 'node:crypto'
import { isIPv4, isIPv6 } from 'node:net'

export interface RateLimit {
  /** How many requests one value may make in a window. */
  readonly limit: number
  readonly windowMs: number
}

/** How many windows one limiter holds before it drops the oldest. */
export const defaultMaxRateLimitWindows = 10_000

interface Window {
  count: number
  readonly endsAt: number
}

/**
 * Fixed-window request counters, held in this process's memory and nowhere else. A counted value,
 * such as a network address or an email address, is kept only as an HMAC under a random key the
 * limiter makes for itself and never hands out, so no counter can be read back as what it counts;
 * and each counter is dropped once its window has ended. Each process counts on its own. When more
 * values are counted at once than the limiter holds, the oldest windows go first.
 */
export class FixedWindowRateLimiter {
  private readonly key = randomBytes(32)
  // Every window is as long as the others, so the order they began in is the order they end in.
  private readonly windows = new Map<string, Window>()

  constructor(
    private readonly rate: RateLimit,
    private readonly maxWindows = defaultMaxRateLimitWindows,
  ) {
    if (!Number.isInteger(maxWindows) || maxWindows < 1) {
      throw new RangeError('A rate limiter holds at least one window.')
    }
  }

  /** How many windows are held now. */
  get size(): number {
    return this.windows.size
  }

  /**
   * Counts one request for `value` at `now`. Null while its window allows the request; otherwise
   * the whole seconds until the window ends.
   */
  hit(value: string, now: number): number | null {
    this.prune(now)
    const digest = createHmac('sha256', this.key).update(value).digest('base64url')
    let window = this.windows.get(digest)
    if (!window) {
      window = { count: 0, endsAt: now + this.rate.windowMs }
      this.windows.set(digest, window)
      if (this.windows.size > this.maxWindows) {
        const oldest = this.windows.keys().next()
        if (!oldest.done) this.windows.delete(oldest.value)
      }
    }
    window.count += 1
    return window.count > this.rate.limit
      ? Math.max(1, Math.ceil((window.endsAt - now) / 1_000))
      : null
  }

  /** Drops every window that has ended: they come first, in the order they began. */
  private prune(now: number) {
    for (const [digest, window] of this.windows) {
      if (window.endsAt > now) return
      this.windows.delete(digest)
    }
  }
}

function ipv6Groups(address: string): string[] | null {
  let value = address.toLowerCase()
  // An IPv4 tail, as in ::ffff:192.0.2.1, is the last two groups.
  const ipv4Tail = /(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(value)
  if (ipv4Tail) {
    const [a, b, c, d] = ipv4Tail.slice(1).map(Number) as [number, number, number, number]
    value = `${value.slice(0, ipv4Tail.index)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`
  }
  const halves = value.split('::')
  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves[1] ? halves[1].split(':') : []
  const groups =
    halves.length === 2
      ? [...head, ...Array<string>(8 - head.length - tail.length).fill('0'), ...tail]
      : head
  return groups.length === 8 ? groups.map((group) => group.padStart(4, '0')) : null
}

/**
 * The network an address counts for. An IPv4 address counts alone, as does an IPv4 address
 * written in IPv6 form. An IPv6 address counts by its /64, which one household or server usually
 * holds whole. Null for anything that is not an IP address.
 */
export function addressNetwork(value: string): string | null {
  if (isIPv4(value)) return value
  const address = value.split('%', 1)[0] ?? ''
  if (!isIPv6(address)) return null
  const groups = ipv6Groups(address)
  if (!groups) return null
  if (groups.slice(0, 5).every((group) => group === '0000') && groups[5] === 'ffff') {
    const high = Number.parseInt(groups[6] ?? '0', 16)
    const low = Number.parseInt(groups[7] ?? '0', 16)
    return [high >> 8, high & 255, low >> 8, low & 255].join('.')
  }
  return `${groups.slice(0, 4).join(':')}::/64`
}

/**
 * The network a request came from, as the proxy in front of the application reports it:
 * `x-real-ip`, or else the first `x-forwarded-for` entry. Vercel sets both itself; a self-hosted
 * proxy must do the same, or a client could name any address. Null when neither names one, as on
 * a server no proxy fronts: there is then no address to trust, and one counter shared by every
 * such request would let ten of them close the form to everyone.
 */
export function requestNetwork(headers: Headers): string | null {
  for (const reported of [
    headers.get('x-real-ip'),
    headers.get('x-forwarded-for')?.split(',', 1)[0],
  ]) {
    const network = addressNetwork(reported?.trim() ?? '')
    if (network) return network
  }
  return null
}

/** Process-local abuse limits; valid preview/internal credentials never spend a failure allowance. */
export const routeRateLimits = {
  ownerMediaUpload: { limit: 120, windowMs: 600_000 },
  previewEnable: { limit: 120, windowMs: 600_000 },
  internalAuthenticationFailure: { limit: 60, windowMs: 600_000 },
} as const satisfies Readonly<Record<string, RateLimit>>

const mediaUploads = new FixedWindowRateLimiter(routeRateLimits.ownerMediaUpload)
const previewFailures = new FixedWindowRateLimiter(routeRateLimits.previewEnable)
const internalFailures = new FixedWindowRateLimiter(routeRateLimits.internalAuthenticationFailure)

function limited(retryAfter: number | null): Response | null {
  return retryAfter === null
    ? null
    : Response.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'cache-control': 'private, no-store',
            'retry-after': String(retryAfter),
          },
        },
      )
}

/** Count the authenticated owner ID, never a caller-supplied email or session token. */
export function limitOwnerMediaUpload(ownerId: string): Response | null {
  return limited(mediaUploads.hit(ownerId, Date.now()))
}

/**
 * Call only for a rejected preview (400/401). Missing proxy metadata shares a failure bucket;
 * valid tokens must never spend or inherit it, since any caller could exhaust that bucket.
 */
export function limitPreviewEnable(request: Request): Response | null {
  return limited(previewFailures.hit(requestNetwork(request.headers) ?? 'unattributed', Date.now()))
}

/** Call only on a rejected credential; fixed route names keep query strings out of the key. */
export function limitInternalAuthenticationFailure(
  request: Request,
  route: 'revalidate' | 'lab-seed' | 'publication-jobs' | 'outbox-drain' | 'fixture-session',
): Response | null {
  const network = requestNetwork(request.headers) ?? 'unattributed'
  return limited(internalFailures.hit(`${route}:${network}`, Date.now()))
}
