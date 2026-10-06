import type { NextConfig } from 'next'

export interface SecurityHeaderOptions {
  development?: boolean
}

export function createContentSecurityPolicy({
  development = false,
}: SecurityHeaderOptions = {}): string {
  const scriptSources = ["'self'", "'unsafe-inline'"]
  if (development) {
    scriptSources.push("'unsafe-eval'")
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "connect-src 'self'",
    "font-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob:",
    "manifest-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    `script-src ${scriptSources.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "worker-src 'self' blob:",
    'upgrade-insecure-requests',
  ].join('; ')
}

export function createSecurityHeaders(options: SecurityHeaderOptions = {}) {
  return [
    {
      key: 'Content-Security-Policy',
      value: createContentSecurityPolicy(options),
    },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), geolocation=(), microphone=(), payment=()',
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },
  ]
}

export function createPreviewPrivacyHeaders() {
  return [
    {
      key: 'Cache-Control',
      value: 'private, no-store',
    },
    {
      key: 'Referrer-Policy',
      value: 'same-origin',
    },
  ]
}

export function createOwnerPrivacyHeaders() {
  return [
    {
      key: 'Cache-Control',
      value: 'private, no-store',
    },
    {
      key: 'Referrer-Policy',
      value: 'same-origin',
    },
    {
      key: 'X-Robots-Tag',
      value: 'noindex, nofollow, noarchive',
    },
  ]
}

/** The Reader Lab cookie (`src/reader-lab/cookie.ts`), repeated here because config loads alone. */
const readerLabCookieName = 'reader_lab_direction'
const readerRoutes = ['/', '/stories/:slug', '/sections/:slug']

/**
 * Reader responses to a request that carries the Reader Lab cookie may show an owner's lab
 * direction, so none of them may be cached or indexed. The rule matches on the cookie alone, before
 * the page checks the owner session, so it also covers a visitor who sends a stale or forged
 * cookie: that visitor gets the default direction with the same private headers.
 */
function createReaderLabHeaderRules() {
  return readerRoutes.map((source) => ({
    has: [{ key: readerLabCookieName, type: 'cookie' as const }],
    headers: createOwnerPrivacyHeaders(),
    source,
  }))
}

const nextConfig: NextConfig = {
  compress: true,
  images: {
    dangerouslyAllowSVG: false,
    formats: ['image/avif', 'image/webp'],
    // Only static images may be optimized. The optimizer keeps serving cached copies after their
    // source is gone, so public media (`/api/media/*`) must never pass through it.
    localPatterns: [{ pathname: '/images/**', search: '' }],
    minimumCacheTTL: 86_400,
  },
  poweredByHeader: false,
  typedRoutes: true,
  async headers() {
    return [
      {
        headers: createSecurityHeaders({ development: process.env.NODE_ENV !== 'production' }),
        source: '/:path*',
      },
      {
        headers: createPreviewPrivacyHeaders(),
        source: '/api/preview',
      },
      {
        headers: createPreviewPrivacyHeaders(),
        source: '/api/preview/:path*',
      },
      {
        headers: createPreviewPrivacyHeaders(),
        source: '/preview/:path*',
      },
      {
        headers: createOwnerPrivacyHeaders(),
        source: '/owner/:path*',
      },
      {
        headers: createOwnerPrivacyHeaders(),
        source: '/api/owner/:path*',
      },
      ...createReaderLabHeaderRules(),
    ]
  },
  async redirects() {
    return [
      {
        destination: '/stories/:slug',
        permanent: true,
        source: '/blog/:slug',
      },
    ]
  },
}

export default nextConfig
