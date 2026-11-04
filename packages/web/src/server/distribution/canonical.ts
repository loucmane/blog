import { resolveCanonicalSiteUrl } from '@/lib/site-url'

/*
 * The single source of every public URL (TS-05). Reader views, metadata, feeds, the sitemap,
 * structured data and cards take their paths and absolute URLs from here, and no other module in
 * server/, reader/ or app/ builds a public path by hand: canonical.test.ts enforces it.
 * `reader/paths.ts` re-exports the path builders under the names the reader has always used.
 */

export type StoryPath = `/stories/${string}`
export type SectionPath = `/sections/${string}`
export type AuthorPath = `/authors/${string}`
export type TopicPath = `/topics/${string}`
export type PublicMediaPath = `/api/media/${string}`
export type FeedPath = '/feed.xml' | `/feed.xml?${string}`
export type SitemapPagePath = `/sitemaps/${number}.xml`

/** Story slugs pass the content model's slug rule (`assertValidSlug`), so they need no encoding. */
export function storyPath(slug: string): StoryPath {
  return `/stories/${slug}`
}

/** Section slugs pass the same rule as story slugs. */
export function sectionPath(slug: string): SectionPath {
  return `/sections/${slug}`
}

/**
 * The author route resolves every slug `normalizeAuthorOrTopicSlug` accepts. The slug is encoded
 * anyway: the in-memory store does not check slugs, and an unchecked one must stay inside its own
 * path segment, where the route turns it away.
 */
export function authorPath(slug: string): AuthorPath {
  return `/authors/${encodeURIComponent(slug)}`
}

/** Encodes the slug, like `authorPath`; the topic route accepts the same slugs. */
export function topicPath(slug: string): TopicPath {
  return `/topics/${encodeURIComponent(slug)}`
}

export function publicMediaPath(mediaId: string): PublicMediaPath {
  return `/api/media/${encodeURIComponent(mediaId)}`
}

/**
 * The feed, or with `before` one page of its dated archive: the stories listed after the story that
 * archive key names (server/distribution/feed.ts).
 */
export function feedPath(before?: string): FeedPath {
  return before === undefined
    ? '/feed.xml'
    : `/feed.xml?${new URLSearchParams({ before }).toString()}`
}

export function sitemapIndexPath(): '/sitemap.xml' {
  return '/sitemap.xml'
}

/** Sitemap pages count from 1. */
export function sitemapPagePath(page: number): SitemapPagePath {
  if (!Number.isSafeInteger(page) || page < 1) {
    throw new RangeError(`${page} is not a sitemap page number.`)
  }
  return `/sitemaps/${page}.xml`
}

/**
 * A site path as an absolute URL on the canonical origin (`NEXT_PUBLIC_SITE_URL`, through
 * `resolveCanonicalSiteUrl`). Only a path on the site is accepted: anything that would resolve to
 * another origin, such as `//host`, `/\host` or a full URL, throws instead of leaving the site.
 */
export function absolute(path: string): string {
  const origin = resolveCanonicalSiteUrl()
  const url = new URL(path, origin)
  if (!path.startsWith('/') || url.origin !== origin.origin) {
    throw new TypeError(`${JSON.stringify(path)} is not a path on this site.`)
  }
  return url.href
}

export function canonicalArticleUrl(slug: string): string {
  return absolute(storyPath(slug))
}

export function canonicalSectionUrl(slug: string): string {
  return absolute(sectionPath(slug))
}

export function canonicalAuthorUrl(slug: string): string {
  return absolute(authorPath(slug))
}

export function canonicalTopicUrl(slug: string): string {
  return absolute(topicPath(slug))
}

export function canonicalHomeUrl(): string {
  return absolute('/')
}

export function canonicalFeedUrl(before?: string): string {
  return absolute(feedPath(before))
}

export function canonicalSitemapIndexUrl(): string {
  return absolute(sitemapIndexPath())
}

export function canonicalSitemapPageUrl(page: number): string {
  return absolute(sitemapPagePath(page))
}
