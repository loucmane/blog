// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { canonicalArticleUrl, canonicalHomeUrl, canonicalSitemapPageUrl } from './canonical'
import type { ListedStory } from './feed'
import { distributionCacheControl, sitemapPageSize } from './limits'
import {
  renderSitemapIndex,
  renderSitemapPage,
  sitemapPageCount,
  sitemapUrls,
  type SitemapUrl,
} from './sitemap'

const origin = 'https://magazine.example'
const sitemapNamespace = 'http://www.sitemaps.org/schemas/sitemap/0.9'
/** W3C Datetime (www.w3.org/TR/NOTE-datetime), the form the protocol asks of `lastmod`. */
const w3cDatetime = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2}))?$/

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', origin)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

/** Story `index` is published `index` minutes after 09:00 on 1 October 2026, so higher is newer. */
function story(index: number, overrides: Partial<ListedStory> = {}): ListedStory {
  return {
    articleId: `article-${String(index).padStart(5, '0')}`,
    publishedAt: new Date(Date.UTC(2026, 9, 1, 9, index)).toISOString(),
    slug: `story-${index}`,
    ...overrides,
  }
}

function stories(count: number): ListedStory[] {
  return Array.from({ length: count }, (_, index) => story(index + 1))
}

function parseXml(source: string): XMLDocument {
  const document = new DOMParser().parseFromString(source, 'application/xml')
  const error = document.getElementsByTagName('parsererror')[0]
  if (error) throw new Error(`The document is not well-formed XML: ${error.textContent ?? ''}`)
  return document
}

function children(parent: Element, name: string): Element[] {
  return [...parent.children].filter(
    (child) => child.localName === name && child.namespaceURI === sitemapNamespace,
  )
}

/**
 * The sitemap protocol's rules (sitemaps.org/protocol.html) for a `urlset` or a `sitemapindex`: the
 * protocol namespace, at most 50,000 entries and 50 MiB, each entry one absolute `loc` of at most
 * 2,048 characters on the sitemap's own host, an optional W3C Datetime `lastmod`, and nothing else.
 */
function expectValidSitemap(source: string, root: 'sitemapindex' | 'urlset'): Element[] {
  expect(new TextEncoder().encode(source).byteLength).toBeLessThanOrEqual(50 * 1024 * 1024)
  const document = parseXml(source)
  expect(document.documentElement.localName).toBe(root)
  expect(document.documentElement.namespaceURI).toBe(sitemapNamespace)
  const entryName = root === 'urlset' ? 'url' : 'sitemap'
  const entries = children(document.documentElement, entryName)
  expect(entries).toHaveLength(document.documentElement.children.length)
  expect(entries.length).toBeLessThanOrEqual(50_000)
  for (const entry of entries) {
    const locations = children(entry, 'loc')
    expect(locations).toHaveLength(1)
    const loc = locations[0]?.textContent ?? ''
    expect(loc.length).toBeLessThanOrEqual(2_048)
    expect(new URL(loc).origin).toBe(origin)
    const dates = children(entry, 'lastmod')
    expect(dates.length).toBeLessThanOrEqual(1)
    if (dates[0]) expect(dates[0].textContent).toMatch(w3cDatetime)
    expect(entry.children).toHaveLength(locations.length + dates.length)
  }
  return entries
}

function locations(entries: readonly Element[]): string[] {
  return entries.map((entry) => children(entry, 'loc')[0]?.textContent ?? '')
}

function lastModified(entries: readonly Element[]): (string | null)[] {
  return entries.map((entry) => children(entry, 'lastmod')[0]?.textContent ?? null)
}

describe('sitemap URLs', () => {
  it('lists the front page, then each story newest first under its canonical URL', () => {
    const urls = sitemapUrls([story(1), story(3, { slug: 'renamed' }), story(2)])

    expect(urls).toEqual<SitemapUrl[]>([
      { lastModified: '2026-10-01T09:03:00.000Z', loc: canonicalHomeUrl() },
      { lastModified: '2026-10-01T09:03:00.000Z', loc: canonicalArticleUrl('renamed') },
      { lastModified: '2026-10-01T09:02:00.000Z', loc: `${origin}/stories/story-2` },
      { lastModified: '2026-10-01T09:01:00.000Z', loc: `${origin}/stories/story-1` },
    ])
  })

  it('orders stories published at the same instant by article id', () => {
    const publishedAt = '2026-10-01T09:00:00.000Z'
    const tied = [
      story(1, { articleId: 'article-b', publishedAt, slug: 'lower-b' }),
      story(1, { articleId: 'article-B', publishedAt, slug: 'upper-b' }),
      story(1, { articleId: 'article-a', publishedAt, slug: 'lower-a' }),
    ]

    const forward = sitemapUrls(tied).map(({ loc }) => loc)
    const backward = sitemapUrls([...tied].reverse()).map(({ loc }) => loc)

    expect(forward).toEqual(backward)
    // By code unit, as on every run and in every locale: `B` sorts before `a`.
    expect(forward.slice(1)).toEqual(['upper-b', 'lower-a', 'lower-b'].map(canonicalArticleUrl))
  })

  it('lists an empty magazine as its front page without a date', () => {
    const urls = sitemapUrls([])

    expect(urls).toEqual([{ lastModified: null, loc: canonicalHomeUrl() }])
    const [home] = expectValidSitemap(renderSitemapPage(urls, 1) ?? '', 'urlset')
    expect(children(home as Element, 'lastmod')).toEqual([])
    expect(lastModified(expectValidSitemap(renderSitemapIndex(urls), 'sitemapindex'))).toEqual([
      null,
    ])
  })
})

describe('sitemap documents', () => {
  it('splits the index into pages of sitemapPageSize URLs, as published', () => {
    expect(sitemapPageSize).toBe(5_000)
    // The protocol's own ceiling per sitemap file.
    expect(sitemapPageSize).toBeLessThanOrEqual(50_000)

    const atThreshold = sitemapUrls(stories(sitemapPageSize - 1))
    expect(atThreshold).toHaveLength(sitemapPageSize)
    expect(sitemapPageCount(atThreshold)).toBe(1)

    const pastThreshold = sitemapUrls(stories(sitemapPageSize))
    expect(sitemapPageCount(pastThreshold)).toBe(2)
    const index = expectValidSitemap(renderSitemapIndex(pastThreshold), 'sitemapindex')
    expect(locations(index)).toEqual([canonicalSitemapPageUrl(1), canonicalSitemapPageUrl(2)])
    expect(canonicalSitemapPageUrl(2)).toBe(`${origin}/sitemaps/2.xml`)

    const first = expectValidSitemap(renderSitemapPage(pastThreshold, 1) ?? '', 'urlset')
    const second = expectValidSitemap(renderSitemapPage(pastThreshold, 2) ?? '', 'urlset')
    expect(first).toHaveLength(sitemapPageSize)
    expect(second).toHaveLength(1)
    // Every URL is listed once, in order, across the pages.
    expect([...locations(first), ...locations(second)]).toEqual(pastThreshold.map(({ loc }) => loc))
    expect(locations(second)).toEqual([canonicalArticleUrl('story-1')])
    // Builds more than one 5,000-URL page; allow for a loaded host.
  }, 30_000)

  it('dates each index entry by the newest change on its page', () => {
    const urls = sitemapUrls(stories(sitemapPageSize + 1))

    const index = expectValidSitemap(renderSitemapIndex(urls), 'sitemapindex')

    expect(lastModified(index)).toEqual([
      story(sitemapPageSize + 1).publishedAt,
      story(2).publishedAt,
    ])
  })

  it('has no page before the first or past the last', () => {
    const urls = sitemapUrls(stories(3))

    expect(renderSitemapPage(urls, 1)).not.toBeNull()
    for (const page of [0, -1, 2, 1.5, Number.NaN]) {
      expect(renderSitemapPage(urls, page), String(page)).toBeNull()
    }
  })

  it('renders the same bytes for the same stories, whatever order they come in', () => {
    const listed = stories(40)
    const reordered = [...listed.slice(20), ...listed.slice(0, 20).reverse()]

    expect(renderSitemapIndex(sitemapUrls(reordered))).toBe(renderSitemapIndex(sitemapUrls(listed)))
    expect(renderSitemapPage(sitemapUrls(reordered), 1)).toBe(
      renderSitemapPage(sitemapUrls(listed), 1),
    )
  })

  it('shares one cache policy with the feed', () => {
    expect(distributionCacheControl).toBe('public, s-maxage=300, stale-while-revalidate=86400')
  })
})
