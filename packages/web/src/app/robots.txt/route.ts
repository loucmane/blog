import { canonicalSitemapIndexUrl } from '@/server/distribution/canonical'
import { distributionCacheControl } from '@/server/distribution/limits'

export const dynamic = 'force-dynamic'

/**
 * What no crawler may fetch (TS-08, BR-01): previews, the owner workspace and every API route. Each
 * rule is a path prefix (RFC 9309), so `/owner` also covers `/owner/...`. Robots rules are a request,
 * not access control, so next.config.ts also sends `X-Robots-Tag: noindex` on these routes.
 */
const disallowedPaths = ['/api', '/owner', '/preview']

/**
 * Published story images stay crawlable for image search and rich results: the longest match wins
 * (RFC 9309), and the media route already answers 404 with no-store for anything not public.
 */
const allowedPaths = ['/api/media/']

/** robots.txt: the paths above for every crawler, and where the sitemap index is. */
export function GET(): Response {
  const body = [
    'User-agent: *',
    ...allowedPaths.map((path) => `Allow: ${path}`),
    ...disallowedPaths.map((path) => `Disallow: ${path}`),
    '',
    `Sitemap: ${canonicalSitemapIndexUrl()}`,
    '',
  ].join('\n')
  return new Response(body, {
    headers: {
      'cache-control': distributionCacheControl,
      'content-type': 'text/plain; charset=utf-8',
    },
  })
}
