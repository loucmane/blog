/*
 * The published contract of the distribution documents (BR-15): how many entries one feed or
 * sitemap document holds, and how long shared caches may keep one. The generators and routes read
 * these constants and the tests assert them, so no call site repeats a number.
 */

/** The newest stories the feed lists. Each older page of its dated archive lists as many. */
export const feedPageSize = 50

/** The URLs one sitemap page lists. The sitemap index links one page per `sitemapPageSize` URLs. */
export const sitemapPageSize = 5_000

/** How long a shared cache may serve a feed or sitemap document as fresh, in seconds. */
export const distributionCacheSeconds = 300

/** How much longer a shared cache may serve it stale while it fetches a fresh copy, in seconds. */
export const distributionStaleSeconds = 86_400

/** The `Cache-Control` of every feed and sitemap document. */
export const distributionCacheControl = `public, s-maxage=${distributionCacheSeconds}, stale-while-revalidate=${distributionStaleSeconds}`
