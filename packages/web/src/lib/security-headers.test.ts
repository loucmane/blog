import { describe, expect, it } from 'vitest'

import nextConfig, {
  createContentSecurityPolicy,
  createPreviewPrivacyHeaders,
  createSecurityHeaders,
} from '../../next.config'

describe('framework security headers', () => {
  it('keeps production origins local and removes obsolete third parties', () => {
    const policy = createContentSecurityPolicy()

    expect(policy).toContain("default-src 'self'")
    expect(policy).toContain("frame-ancestors 'none'")
    expect(policy).toContain("object-src 'none'")
    expect(policy).not.toContain("'unsafe-eval'")
    expect(policy).not.toMatch(/google|paypal|stripe|convertkit|amazonaws/i)
  })

  it('limits unsafe evaluation to the development server', () => {
    expect(createContentSecurityPolicy({ development: true })).toContain("'unsafe-eval'")
    expect(createContentSecurityPolicy({ development: false })).not.toContain("'unsafe-eval'")
  })

  it('emits the complete baseline header set', () => {
    expect(createSecurityHeaders().map(({ key }) => key)).toEqual([
      'Content-Security-Policy',
      'Permissions-Policy',
      'Referrer-Policy',
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
    ])
  })

  it('prevents preview responses from being cached or referred cross-origin', () => {
    expect(createPreviewPrivacyHeaders()).toEqual([
      { key: 'Cache-Control', value: 'private, no-store' },
      { key: 'Referrer-Policy', value: 'same-origin' },
    ])
  })

  it('keeps previews and API routes out of search indexes, except public media', async () => {
    const rules = (await nextConfig.headers?.()) ?? []
    const robotsTag = (source: string) =>
      rules
        .filter((rule) => rule.source === source)
        .flatMap((rule) => rule.headers)
        .find(({ key }) => key === 'X-Robots-Tag')?.value
    expect(robotsTag('/api/:path((?!media/).*)')).toBe('noindex, nofollow')
    expect(robotsTag('/preview/:path*')).toBe('noindex, nofollow')
    expect(robotsTag('/api/owner/:path*')).toBe('noindex, nofollow, noarchive')
    const sources = rules.map(({ source }) => source)
    expect(sources.indexOf('/api/owner/:path*')).toBeGreaterThan(
      sources.indexOf('/api/:path((?!media/).*)'),
    )
    const apiNoIndex = new RegExp(`^/api/${'(?!media/).*'}$`)
    expect(apiNoIndex.test('/api/media/media-1')).toBe(false)
    expect(apiNoIndex.test('/api/owner/stories')).toBe(true)
  })
})
