import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { distributionCacheControl } from '@/server/distribution/limits'

import { GET } from './route'

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://magazine.example')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

/** The rules robots.txt gives every crawler, as RFC 9309 groups read them. */
function rulesForEveryCrawler(body: string) {
  const lines = body.split('\n').filter((line) => line.trim() !== '')
  const records = lines.map((line) => {
    const match = /^([A-Za-z-]+):\s*(.*)$/.exec(line)
    if (!match) throw new Error(`${JSON.stringify(line)} is not a robots.txt record.`)
    return { key: (match[1] ?? '').toLowerCase(), value: match[2] ?? '' }
  })
  const disallow: string[] = []
  const allow: string[] = []
  let everyCrawler = false
  for (const { key, value } of records) {
    if (key === 'user-agent') everyCrawler = value === '*'
    else if (key === 'disallow' && everyCrawler && value) disallow.push(value)
    else if (key === 'allow' && everyCrawler && value) allow.push(value)
  }
  return { allow, disallow, records }
}

/** RFC 9309, 2.2.2: the longest matching rule wins, and a path no rule matches is allowed. */
function crawlable(rules: { allow: string[]; disallow: string[] }, path: string): boolean {
  const longest = (paths: string[]) =>
    Math.max(-1, ...paths.filter((rule) => path.startsWith(rule)).map((rule) => rule.length))
  return longest(rules.allow) >= longest(rules.disallow)
}

describe('GET /robots.txt', () => {
  it('disallows previews, the owner workspace and every API route except public media, and names the sitemap', async () => {
    const response = GET()

    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8')
    expect(response.headers.get('cache-control')).toBe(distributionCacheControl)
    expect(await response.text()).toBe(
      [
        'User-agent: *',
        'Allow: /api/media/',
        'Disallow: /api',
        'Disallow: /owner',
        'Disallow: /preview',
        '',
        'Sitemap: https://magazine.example/sitemap.xml',
        '',
      ].join('\n'),
    )
  })

  it('keeps every private route from crawlers and every reader route open to them', async () => {
    const rules = rulesForEveryCrawler(await GET().text())

    for (const path of [
      '/preview/stories/winter-light',
      '/api/preview',
      '/api/preview/disable',
      '/api/owner/stories',
      '/api/auth/sign-in',
      '/api/internal/publication-jobs',
      '/owner',
      '/owner/stories/article-1',
      '/owner/reader-lab',
    ]) {
      expect(crawlable(rules, path), path).toBe(false)
    }
    for (const path of [
      '/',
      '/stories/winter-light',
      '/sections/interiors',
      '/authors/alpha-writer',
      '/topics/light',
      '/feed.xml',
      '/sitemap.xml',
      '/sitemaps/1.xml',
      '/_next/static/chunks/main.js',
      '/api/media/media-1',
    ]) {
      expect(crawlable(rules, path), path).toBe(true)
    }
    expect(rules.records.filter(({ key }) => key === 'sitemap')).toEqual([
      { key: 'sitemap', value: 'https://magazine.example/sitemap.xml' },
    ])
  })
})
