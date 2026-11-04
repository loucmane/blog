import type { ContentRepository } from '@/server/content/ports'
import { listVisibleArticles } from '@/server/content/reader'

import { canonicalArticleUrl, canonicalHomeUrl, canonicalSitemapPageUrl } from './canonical'
import { escapeXml, listedStory, newestFirst, publicationInstant, type ListedStory } from './feed'
import { sitemapPageSize } from './limits'

/*
 * The XML sitemap (TS-04): `/sitemap.xml` is a sitemap index linking pages of `sitemapPageSize`
 * URLs at `/sitemaps/<n>.xml`. `sitemapUrls` and both renderers are pure, like the feed's, and
 * `readSitemapUrls` reads stories through the same content reader, so only what readers can see
 * is listed, each story once, under its canonical URL.
 */

/** The tag of every cached sitemap document. */
export const sitemapCacheTag = 'sitemap'

export interface SitemapUrl {
  /** When what the URL shows last changed for readers, as an ISO 8601 instant; null if unknown. */
  readonly lastModified: string | null
  /** The canonical absolute URL. */
  readonly loc: string
}

/**
 * Every URL the sitemap lists: the front page, then each story, newest first. A story last changed
 * for readers when its published revision went public; the front page, when the newest one did.
 */
export function sitemapUrls(stories: readonly ListedStory[]): SitemapUrl[] {
  const urls = [...stories].sort(newestFirst).map((story) => ({
    lastModified: publicationInstant(story.publishedAt),
    loc: canonicalArticleUrl(story.slug),
  }))
  return [{ lastModified: urls[0]?.lastModified ?? null, loc: canonicalHomeUrl() }, ...urls]
}

/** How many pages the index links; an empty sitemap still has its first page. */
export function sitemapPageCount(urls: readonly SitemapUrl[]): number {
  return Math.max(1, Math.ceil(urls.length / sitemapPageSize))
}

function pageUrls(urls: readonly SitemapUrl[], page: number): readonly SitemapUrl[] {
  return urls.slice((page - 1) * sitemapPageSize, page * sitemapPageSize)
}

/** The newest change among these URLs. Instants in one ISO form compare as strings. */
function newestChange(urls: readonly SitemapUrl[]): string | null {
  let newest: string | null = null
  for (const { lastModified } of urls) {
    if (lastModified !== null && (newest === null || lastModified > newest)) newest = lastModified
  }
  return newest
}

function entry(name: 'sitemap' | 'url', loc: string, lastModified: string | null): string[] {
  return [
    `<${name}>`,
    `<loc>${escapeXml(loc)}</loc>`,
    ...(lastModified === null ? [] : [`<lastmod>${lastModified}</lastmod>`]),
    `</${name}>`,
  ]
}

/** The sitemap index: one entry per page, dated by the newest change on that page. */
export function renderSitemapIndex(urls: readonly SitemapUrl[]): string {
  const pages = Array.from({ length: sitemapPageCount(urls) }, (_, index) => index + 1)
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pages.flatMap((page) =>
      entry('sitemap', canonicalSitemapPageUrl(page), newestChange(pageUrls(urls, page))),
    ),
    '</sitemapindex>',
    '',
  ].join('\n')
}

/** One sitemap page, counting from 1; null for a page the index does not link. */
export function renderSitemapPage(urls: readonly SitemapUrl[], page: number): string | null {
  if (!Number.isSafeInteger(page) || page < 1 || page > sitemapPageCount(urls)) return null
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pageUrls(urls, page).flatMap(({ lastModified, loc }) => entry('url', loc, lastModified)),
    '</urlset>',
    '',
  ].join('\n')
}

/** Reads the URLs the sitemap lists. Only articles are read, never their revisions. */
export async function readSitemapUrls(repository: ContentRepository): Promise<SitemapUrl[]> {
  return repository.transaction(async (transaction) =>
    sitemapUrls(
      (await listVisibleArticles(transaction)).map(({ article }) => listedStory(article)),
    ),
  )
}
