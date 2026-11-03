import { siteName } from '@/reader/components/failure-view'
import type { Article, ArticleRevision } from '@/server/content/domain'
import type { ContentRepository } from '@/server/content/ports'
import { listVisibleArticles, loadVisibleRevision } from '@/server/content/reader'

import { canonicalArticleUrl, canonicalFeedUrl, canonicalHomeUrl } from './canonical'
import { feedPageSize } from './limits'

/*
 * The RSS 2.0 feed (TS-04, US-11), and the story projection and order it shares with the sitemap.
 * `selectFeedPage` and `renderFeed` are pure: the same stories give the same bytes in any input
 * order. `readFeedDocument` reads stories through the content reader, the visibility rule every
 * public surface shares, so drafts, scheduled first publications, newer unpublished revisions, and
 * unpublished or deleted stories never reach the feed.
 *
 * Paging follows RFC 5005: the feed lists the newest `feedPageSize` stories, and `rel="next"` leads
 * into its dated archive, `?before=<archive key>`, where each page lists the stories after the one
 * that key names and links its neighbours with `rel="previous"` and `rel="next"`.
 */

/** The tag of every cached feed document. */
export const feedCacheTag = 'feed'

/** A story as the distribution documents list it: published facts only, never draft fields. */
export interface ListedStory {
  readonly articleId: string
  /** When the published revision went public, as an ISO 8601 instant. */
  readonly publishedAt: string
  readonly slug: string
}

/** A story as the feed lists it, with its published revision's title and summary. */
export interface FeedStory extends ListedStory {
  /** The published summary; empty when the published revision has none. */
  readonly summary: string
  readonly title: string
}

/** A link from one feed page to another. */
export interface FeedLink {
  /** The archive key the linked page lists the stories after; null for the feed itself. */
  readonly before: string | null
}

export interface FeedPage<Story extends ListedStory> {
  /** The archive key this page lists the stories after; null for the feed itself. */
  readonly before: string | null
  /** The page of older stories; null on the last page. */
  readonly next: FeedLink | null
  /** The page of newer stories; null on the feed itself. */
  readonly previous: FeedLink | null
  readonly stories: readonly Story[]
}

function instant(value: string): number {
  const time = Date.parse(value)
  if (Number.isNaN(time)) {
    throw new RangeError(`${JSON.stringify(value)} is not a publication time.`)
  }
  return time
}

/** A publication time in the one form both documents print, `2026-11-03T09:00:00.000Z`. */
export function publicationInstant(value: string): string {
  return new Date(instant(value)).toISOString()
}

/**
 * The order both documents list stories in: newest publication first, then article id by code
 * unit, so stories published at the same instant keep one order on every run and in every locale.
 */
export function newestFirst(left: ListedStory, right: ListedStory): number {
  const byTime = instant(right.publishedAt) - instant(left.publishedAt)
  if (byTime !== 0) return byTime
  if (left.articleId === right.articleId) return 0
  return left.articleId < right.articleId ? -1 : 1
}

/**
 * A story's place in the feed: its publication instant and article id, which no other story
 * shares. The archive page `?before=<key>` lists the stories after it.
 */
export function archiveKey(story: ListedStory): string {
  return `${publicationInstant(story.publishedAt)}_${story.articleId}`
}

/**
 * One page of the feed: the feed itself when `before` is null, else the `feedPageSize` stories
 * after the story whose archive key `before` is. Null when no story has that key, so the archive
 * has only the pages the feed leads to.
 */
export function selectFeedPage<Story extends ListedStory>(
  stories: readonly Story[],
  before: string | null,
): FeedPage<Story> | null {
  const ordered = [...stories].sort(newestFirst)
  let start = 0
  if (before !== null) {
    const boundary = ordered.findIndex((story) => archiveKey(story) === before)
    if (boundary === -1) return null
    start = boundary + 1
  }
  const end = start + feedPageSize
  const lastListed = ordered[end - 1]
  const previousStart = start - feedPageSize
  const previousBoundary = ordered[previousStart - 1]
  return {
    before,
    next: ordered.length > end && lastListed ? { before: archiveKey(lastListed) } : null,
    previous:
      before === null ? null : { before: previousBoundary ? archiveKey(previousBoundary) : null },
    stories: ordered.slice(start, end),
  }
}

// Characters XML 1.0 cannot carry even escaped: C0 controls other than tab, line feed and carriage
// return, lone surrogates, U+FFFE and U+FFFF.
const nonXmlCharacters = /[^\t\n\r\u{20}-\u{D7FF}\u{E000}-\u{FFFD}\u{10000}-\u{10FFFF}]/gu
const xmlEntities: Readonly<Record<string, string>> = {
  '"': '&quot;',
  '&': '&amp;',
  "'": '&apos;',
  '<': '&lt;',
  '>': '&gt;',
}

/** Text as XML character data or an attribute value, without characters XML cannot carry. */
export function escapeXml(value: string): string {
  return value
    .replace(nonXmlCharacters, '')
    .replace(/["&'<>]/g, (character) => xmlEntities[character] ?? character)
}

function element(name: string, text: string): string {
  return `<${name}>${escapeXml(text)}</${name}>`
}

/** An RFC 822 date, as RSS 2.0 dates are written: `Tue, 03 Nov 2026 09:00:00 GMT`. */
function rfc822(value: string): string {
  return new Date(instant(value)).toUTCString()
}

function atomLink(rel: 'next' | 'previous' | 'self', link: FeedLink): string {
  const href = escapeXml(canonicalFeedUrl(link.before ?? undefined))
  return `<atom:link rel="${rel}" type="application/rss+xml" href="${href}"/>`
}

function item(story: FeedStory): string[] {
  return [
    '<item>',
    element('title', story.title),
    element('link', canonicalArticleUrl(story.slug)),
    // The article id stays when the slug changes, so a renamed story is not a new item.
    `<guid isPermaLink="false">${escapeXml(story.articleId)}</guid>`,
    element('pubDate', rfc822(story.publishedAt)),
    ...(story.summary ? [element('description', story.summary)] : []),
    '</item>',
  ]
}

/**
 * One feed page as an RSS 2.0 document. Every URL in it is canonical, and nothing in it depends on
 * when it is rendered: the build date is the newest listed publication.
 */
export function renderFeed(page: FeedPage<FeedStory>): string {
  const newest = page.stories[0]
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    element('title', siteName),
    element('link', canonicalHomeUrl()),
    element('description', `The newest stories from ${siteName}.`),
    ...(newest ? [element('lastBuildDate', rfc822(newest.publishedAt))] : []),
    atomLink('self', page),
    ...(page.previous ? [atomLink('previous', page.previous)] : []),
    ...(page.next ? [atomLink('next', page.next)] : []),
    ...page.stories.flatMap(item),
    '</channel>',
    '</rss>',
    '',
  ].join('\n')
}

/** A visible article as both documents list it. */
export function listedStory(article: Article): ListedStory {
  if (article.publishedAt === null) {
    throw new Error(`The visible article ${article.id} has no publication time.`)
  }
  return { articleId: article.id, publishedAt: article.publishedAt, slug: article.slug }
}

/**
 * The published revision's own title and summary, as the reader shows them
 * (reader/read-model.ts): never the article's newer draft fields.
 */
function publishedCopy(article: Article, revision: ArticleRevision) {
  const title = revision.title?.trim() || revision.document.title
  const unchangedSincePublication = article.currentDraftRevisionId === revision.id
  const summary = revision.dek ?? (unchangedSincePublication ? article.dek : '')
  return { summary: summary.trim(), title }
}

/**
 * Reads one feed document: the feed itself when `before` is null, else that page of its archive.
 * Null when the archive has no such page. Only the listed stories' revisions are read.
 */
export async function readFeedDocument(
  repository: ContentRepository,
  before: string | null,
): Promise<string | null> {
  return repository.transaction(async (transaction) => {
    const visible = await listVisibleArticles(transaction)
    const page = selectFeedPage(
      visible.map((entry) => ({ ...listedStory(entry.article), entry })),
      before,
    )
    if (!page) return null
    const stories: FeedStory[] = []
    for (const { entry, ...listed } of page.stories) {
      const { article, revision } = await loadVisibleRevision(transaction, entry)
      stories.push({ ...listed, ...publishedCopy(article, revision) })
    }
    return renderFeed({ ...page, stories })
  })
}
