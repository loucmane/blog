// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CURRENT_CONTENT_DOCUMENT_VERSION, type ContentDocument } from '../content/document'
import type { Article } from '../content/domain'
import { InMemoryContentRepository } from '../content/in-memory-repository'
import type { Clock, ContentRepository } from '../content/ports'
import { ContentService } from '../content/service'
import { canonicalArticleUrl, canonicalFeedUrl, canonicalHomeUrl } from './canonical'
import {
  archiveKey,
  escapeXml,
  listedStory,
  newestFirst,
  readFeedDocument,
  renderFeed,
  selectFeedPage,
  type FeedPage,
  type FeedStory,
} from './feed'
import { feedPageSize } from './limits'
import { readSitemapUrls, renderSitemapIndex, renderSitemapPage, sitemapPageCount } from './sitemap'

const origin = 'https://magazine.example'
const atomNamespace = 'http://www.w3.org/2005/Atom'
const rfc822Date =
  /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', origin)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

/** Story `index` is published `index` minutes after 09:00 on 1 October 2026, so higher is newer. */
function story(index: number, overrides: Partial<FeedStory> = {}): FeedStory {
  return {
    articleId: `article-${String(index).padStart(3, '0')}`,
    publishedAt: new Date(Date.UTC(2026, 9, 1, 9, index)).toISOString(),
    slug: `story-${index}`,
    summary: `Summary of story ${index}.`,
    title: `Story ${index}`,
    ...overrides,
  }
}

function stories(count: number): FeedStory[] {
  return Array.from({ length: count }, (_, index) => story(index + 1))
}

/** Every page of the feed, following `rel="next"` from the feed itself. */
function feedPages(listed: readonly FeedStory[]): FeedPage<FeedStory>[] {
  const pages: FeedPage<FeedStory>[] = []
  let page = selectFeedPage(listed, null)
  while (page) {
    pages.push(page)
    const next = page.next?.before ?? null
    page = next === null ? null : selectFeedPage(listed, next)
  }
  return pages
}

function parseXml(source: string): XMLDocument {
  const document = new DOMParser().parseFromString(source, 'application/xml')
  const error = document.getElementsByTagName('parsererror')[0]
  if (error) throw new Error(`The document is not well-formed XML: ${error.textContent ?? ''}`)
  return document
}

function children(parent: Element, name: string, namespace: string | null = null): Element[] {
  return [...parent.children].filter(
    (child) => child.localName === name && child.namespaceURI === namespace,
  )
}

function text(parent: Element, name: string): string | null {
  return children(parent, name)[0]?.textContent ?? null
}

function expectAbsoluteSiteUrl(value: string | null) {
  expect(value).not.toBeNull()
  expect(new URL(value ?? '').origin).toBe(origin)
}

/**
 * The RSS 2.0 rules the feed must keep (rssboard.org/rss-specification), with the Atom link
 * profile for `self` and RFC 5005 paging links: one channel with a title, link and description;
 * items with a title, a canonical link, a unique guid and an RFC 822 date.
 */
function expectValidRss(source: string): XMLDocument {
  const document = parseXml(source)
  const rss = document.documentElement
  expect(rss.localName).toBe('rss')
  expect(rss.getAttribute('version')).toBe('2.0')
  const channels = children(rss, 'channel')
  expect(channels).toHaveLength(1)
  const channel = channels[0] as Element
  for (const required of ['title', 'link', 'description']) {
    expect(text(channel, required), required).toBeTruthy()
  }
  expectAbsoluteSiteUrl(text(channel, 'link'))
  const lastBuildDate = text(channel, 'lastBuildDate')
  if (lastBuildDate !== null) expect(lastBuildDate).toMatch(rfc822Date)
  const links = children(channel, 'link', atomNamespace)
  expect(links.filter((link) => link.getAttribute('rel') === 'self')).toHaveLength(1)
  for (const link of links) {
    expect(['next', 'previous', 'self']).toContain(link.getAttribute('rel'))
    expect(link.getAttribute('type')).toBe('application/rss+xml')
    expectAbsoluteSiteUrl(link.getAttribute('href'))
  }
  const guids = new Set<string>()
  for (const item of children(channel, 'item')) {
    expect(text(item, 'title')).toBeTruthy()
    expectAbsoluteSiteUrl(text(item, 'link'))
    const guid = children(item, 'guid')[0]
    expect(guid?.getAttribute('isPermaLink')).toBe('false')
    const id = guid?.textContent ?? ''
    expect(id).not.toBe('')
    expect(guids.has(id), `duplicate guid ${id}`).toBe(false)
    guids.add(id)
    expect(text(item, 'pubDate')).toMatch(rfc822Date)
  }
  return document
}

function items(document: XMLDocument): Element[] {
  return children(children(document.documentElement, 'channel')[0] as Element, 'item')
}

function atomHref(document: XMLDocument, rel: string): string | null {
  const channel = children(document.documentElement, 'channel')[0] as Element
  const link = children(channel, 'link', atomNamespace).find(
    (candidate) => candidate.getAttribute('rel') === rel,
  )
  return link?.getAttribute('href') ?? null
}

describe('feed paging', () => {
  it('lists the newest feedPageSize stories and pages older ones into the archive', () => {
    expect(feedPageSize).toBe(50)
    const listed = stories(feedPageSize * 2 + 20)

    const pages = feedPages(listed)

    expect(pages.map((page) => page.stories.length)).toEqual([feedPageSize, feedPageSize, 20])
    // Every story appears once, newest first, across the feed and its archive.
    expect(pages.flatMap((page) => page.stories)).toEqual([...listed].reverse())
    expect(pages[0]?.before).toBeNull()
    expect(pages[0]?.previous).toBeNull()
    expect(pages[1]?.before).toBe(archiveKey(story(listed.length - feedPageSize + 1)))
    expect(pages.at(-1)?.next).toBeNull()
  })

  it('keeps the feed to one page at the threshold and pages the story past it', () => {
    expect(feedPages(stories(feedPageSize))).toHaveLength(1)
    const pages = feedPages(stories(feedPageSize + 1))
    expect(pages.map((page) => page.stories.length)).toEqual([feedPageSize, 1])
  })

  it('links every archive page back to the page before it', () => {
    const listed = stories(feedPageSize * 3)
    const pages = feedPages(listed)

    expect(pages[1]?.previous).toEqual({ before: null })
    for (const [index, page] of pages.entries()) {
      if (index === 0) continue
      const previous = selectFeedPage(listed, page.previous?.before ?? null)
      expect(previous?.stories).toEqual(pages[index - 1]?.stories)
    }
  })

  it('orders stories published at the same instant by article id, in any input order', () => {
    const publishedAt = '2026-10-01T09:00:00.000Z'
    const tied = ['article-b', 'article-B', 'article-a', 'article-10', 'article-9'].map(
      (articleId) => story(1, { articleId, publishedAt, slug: articleId }),
    )

    const expected = ['article-10', 'article-9', 'article-B', 'article-a', 'article-b']
    expect([...tied].sort(newestFirst).map(({ articleId }) => articleId)).toEqual(expected)
    expect(
      [...tied]
        .reverse()
        .sort(newestFirst)
        .map(({ articleId }) => articleId),
    ).toEqual(expected)
  })

  it('pages stories published at the same instant without losing or repeating one', () => {
    const publishedAt = '2026-10-01T09:00:00.000Z'
    const tied = stories(feedPageSize + 7).map((listed) => ({ ...listed, publishedAt }))

    const pages = feedPages(tied)

    expect(pages.map((page) => page.stories.length)).toEqual([feedPageSize, 7])
    expect(pages.flatMap((page) => page.stories.map(({ articleId }) => articleId))).toEqual(
      tied.map(({ articleId }) => articleId),
    )
  })

  it('has no archive page for a key that names no story', () => {
    const listed = stories(3)

    expect(selectFeedPage(listed, 'not-a-key')).toBeNull()
    expect(
      selectFeedPage(listed, archiveKey({ ...story(2), articleId: 'article-gone' })),
    ).toBeNull()
    expect(selectFeedPage(listed, archiveKey(story(1)))).toMatchObject({ next: null, stories: [] })
  })

  it('names a story by its publication instant and article id', () => {
    expect(archiveKey(story(1, { publishedAt: '2026-10-01T11:01:00+02:00' }))).toBe(
      '2026-10-01T09:01:00.000Z_article-001',
    )
    expect(() => archiveKey(story(1, { publishedAt: 'not a time' }))).toThrow(RangeError)
  })
})

describe('feed document', () => {
  it('checks documents with a parser that rejects what XML cannot read', () => {
    expect(() => parseXml('<rss><channel></rss>')).toThrow('not well-formed')
    expect(() => parseXml('<rss>fish & chips</rss>')).toThrow('not well-formed')
    expect(() => parseXml('<rss>\u0001</rss>')).toThrow('not well-formed')
    expect(parseXml('<rss>fish &amp; chips</rss>').documentElement.textContent).toBe('fish & chips')
  })

  it('writes a valid RSS 2.0 document with canonical URLs and dates', () => {
    const page = selectFeedPage(
      [story(1), story(2, { summary: '' }), story(3, { slug: 'the-third-story' })],
      null,
    )
    if (!page) throw new Error('The feed has no first page.')

    const document = expectValidRss(renderFeed(page))

    const channel = children(document.documentElement, 'channel')[0] as Element
    expect(text(channel, 'link')).toBe(canonicalHomeUrl())
    expect(text(channel, 'lastBuildDate')).toBe('Thu, 01 Oct 2026 09:03:00 GMT')
    expect(atomHref(document, 'self')).toBe(canonicalFeedUrl())
    expect(atomHref(document, 'next')).toBeNull()
    expect(atomHref(document, 'previous')).toBeNull()
    const [third, second, first] = items(document)
    expect(text(third as Element, 'link')).toBe(`${origin}/stories/the-third-story`)
    expect(text(third as Element, 'link')).toBe(canonicalArticleUrl('the-third-story'))
    expect(text(third as Element, 'guid')).toBe('article-003')
    expect(text(third as Element, 'title')).toBe('Story 3')
    expect(text(third as Element, 'pubDate')).toBe('Thu, 01 Oct 2026 09:03:00 GMT')
    expect(text(third as Element, 'description')).toBe('Summary of story 3.')
    // A story without a published summary has no description rather than an empty one.
    expect(children(second as Element, 'description')).toEqual([])
    expect(text(first as Element, 'guid')).toBe('article-001')
  })

  it('links the feed and its archive pages with canonical paging URLs', () => {
    const listed = stories(feedPageSize * 2 + 1)
    const [head, middle, last] = feedPages(listed)
    if (!head || !middle || !last) throw new Error('The feed should have three pages.')

    const first = expectValidRss(renderFeed(head))
    const second = expectValidRss(renderFeed(middle))
    const third = expectValidRss(renderFeed(last))

    expect(atomHref(first, 'next')).toBe(canonicalFeedUrl(middle.before ?? undefined))
    expect(atomHref(second, 'self')).toBe(canonicalFeedUrl(middle.before ?? undefined))
    expect(atomHref(second, 'previous')).toBe(canonicalFeedUrl())
    expect(atomHref(second, 'next')).toBe(canonicalFeedUrl(last.before ?? undefined))
    expect(atomHref(third, 'previous')).toBe(canonicalFeedUrl(middle.before ?? undefined))
    expect(atomHref(third, 'next')).toBeNull()
    expect(canonicalFeedUrl(middle.before ?? undefined)).toBe(
      `${origin}/feed.xml?before=${encodeURIComponent(middle.before ?? '')}`,
    )
    expect(items(first)).toHaveLength(feedPageSize)
    expect(items(third)).toHaveLength(1)
  })

  it('renders the same bytes for the same stories, whatever order they come in', () => {
    const listed = stories(feedPageSize + 5)
    const shuffled = [
      ...listed.filter((_, index) => index % 2),
      ...listed.filter((_, i) => !(i % 2)),
    ]
    const render = (input: readonly FeedStory[]) => {
      const page = selectFeedPage(input, null)
      return page ? renderFeed(page) : null
    }

    const first = render(listed)
    expect(first).not.toBeNull()
    expect(render(listed)).toBe(first)
    expect(render(shuffled)).toBe(first)
    expect(render([...listed].reverse())).toBe(first)
  })

  it('escapes markup and drops characters XML cannot carry', () => {
    const title = `Fish & "chips" <b>'today'</b>\u{1}\u{FFFE}\u{D800} end`
    const page = selectFeedPage([story(1, { summary: 'A <summary> & more', title })], null)
    if (!page) throw new Error('The feed has no first page.')

    const source = renderFeed(page)
    const [item] = items(expectValidRss(source))

    expect(text(item as Element, 'title')).toBe(`Fish & "chips" <b>'today'</b> end`)
    expect(text(item as Element, 'description')).toBe('A <summary> & more')
    expect(source).not.toContain('<b>')
    expect(escapeXml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&apos;&amp;&apos;&lt;/a&gt;',
    )
  })

  it('keeps an item when its story is renamed: same guid, new canonical link', () => {
    const render = (slug: string) => {
      const page = selectFeedPage([story(1, { slug })], null)
      return page ? items(expectValidRss(renderFeed(page)))[0] : undefined
    }

    const before = render('first-name')
    const after = render('second-name')

    expect(text(after as Element, 'guid')).toBe(text(before as Element, 'guid'))
    expect(text(before as Element, 'link')).toBe(canonicalArticleUrl('first-name'))
    expect(text(after as Element, 'link')).toBe(canonicalArticleUrl('second-name'))
  })

  it('serves an empty feed as a valid document', () => {
    const page = selectFeedPage([], null)
    if (!page) throw new Error('The feed has no first page.')

    const document = expectValidRss(renderFeed(page))

    expect(items(document)).toEqual([])
    expect(text(children(document.documentElement, 'channel')[0] as Element, 'lastBuildDate')).toBe(
      null,
    )
    expect(atomHref(document, 'next')).toBeNull()
  })
})

describe('feed stories read from the content store', () => {
  const publishedAt = '2026-10-01T09:00:00.000Z'
  const legacy: Article = {
    createdAt: publishedAt,
    currentDraftRevisionId: 'revision-legacy',
    deletedAt: null,
    dek: 'Article dek',
    id: 'article-legacy',
    preDeleteStatus: null,
    publishedAt,
    publishedRevisionId: 'revision-legacy',
    scheduledAt: null,
    scheduledRevisionId: null,
    slug: 'legacy',
    status: 'published',
    title: 'Article title',
    updatedAt: publishedAt,
    version: 1,
  }

  it('titles and summarizes a revision without its own copy as the reader does', async () => {
    const repository = new InMemoryContentRepository()
    // A revision saved before revisions carried their own title and summary.
    await repository.transaction(async (transaction) => {
      await transaction.saveRevision({
        articleId: legacy.id,
        createdAt: publishedAt,
        document: storyDocument(legacy.id, 'Document title', 'Legacy body.'),
        id: 'revision-legacy',
        revisionNumber: 1,
      })
      await transaction.saveArticle(legacy, null)
    })
    const read = async () =>
      items(expectValidRss((await readFeedDocument(repository, null)) ?? ''))[0] as Element

    expect(text(await read(), 'title')).toBe('Document title')
    // Unchanged since publication, the article's own summary is the published one.
    expect(text(await read(), 'description')).toBe('Article dek')

    await repository.transaction(async (transaction) => {
      await transaction.saveRevision({
        articleId: legacy.id,
        createdAt: publishedAt,
        document: storyDocument(legacy.id, 'Draft title', 'Draft body.'),
        id: 'revision-draft',
        revisionNumber: 2,
      })
      await transaction.saveArticle(
        { ...legacy, currentDraftRevisionId: 'revision-draft', dek: 'Draft dek', version: 2 },
        1,
      )
    })

    // Once a newer draft exists, the article's summary is the draft's, so none is shown.
    expect(text(await read(), 'title')).toBe('Document title')
    expect(children(await read(), 'description')).toEqual([])
  })

  it('refuses to list an article that has no publication time', () => {
    expect(listedStory(legacy)).toEqual({ articleId: legacy.id, publishedAt, slug: 'legacy' })
    expect(() => listedStory({ ...legacy, publishedAt: null })).toThrow(
      'The visible article article-legacy has no publication time.',
    )
  })
})

/*
 * AC-03 across the distribution surfaces: one corpus holds a story in every state readers must
 * never see, beside stories they can, and every surface registered below is read from it through
 * the route's own reader. A new surface registers here.
 */

type StoryState =
  | 'deleted'
  | 'draft'
  | 'orphaned'
  | 'preview'
  | 'published'
  | 'rescheduled'
  | 'scheduled'
  | 'withdrawn'

const hiddenStates = ['deleted', 'draft', 'orphaned', 'scheduled', 'withdrawn'] as const
const visibleStates = ['preview', 'published', 'rescheduled'] as const

function storyDocument(articleId: string, title: string, body: string): ContentDocument {
  return {
    articleId,
    document: {
      content: [{ content: [{ text: body, type: 'text' }], type: 'paragraph' }],
      type: 'doc',
    },
    migrationProvenance: [],
    schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
    title,
  }
}

/**
 * Adds a story in a state. `preview` is published with a newer draft that only the preview shows;
 * `rescheduled` is published with a newer revision scheduled; `orphaned` is rescheduled with its
 * only publication job cancelled behind the service's back, which readers never see.
 */
async function addStory(repository: ContentRepository, slug: string, state: StoryState, day = 1) {
  const clock: Clock = { now: () => new Date(Date.UTC(2026, 9, day, 9)) }
  const service = new ContentService(repository, clock)
  const articleId = `article-${slug}`
  const created = await service.createArticle({
    dek: `Dek of ${slug}`,
    document: storyDocument(articleId, `Title of ${slug}`, `Body of ${slug}.`),
    id: articleId,
    idempotencyKey: `create-${slug}`,
    slug,
    title: `Title of ${slug}`,
  })
  const schedule = (expectedVersion: number, revisionId: string) =>
    service.schedulePublication({
      articleId,
      expectedVersion,
      idempotencyKey: `schedule-${slug}`,
      revisionId,
      runAt: '2026-12-01T09:00:00.000Z',
      timeZone: 'Europe/Stockholm',
    })
  if (state === 'draft') return
  if (state === 'scheduled') {
    await schedule(created.article.version, created.revision.id)
    return
  }
  const { article } = await service.publish({
    articleId,
    expectedVersion: created.article.version,
    idempotencyKey: `publish-${slug}`,
    revisionId: created.revision.id,
  })
  if (state === 'withdrawn') {
    await service.unpublish({
      articleId,
      expectedVersion: article.version,
      idempotencyKey: `unpublish-${slug}`,
      reason: 'Exclusion check',
    })
  } else if (state === 'deleted') {
    await service.softDelete({
      articleId,
      expectedVersion: article.version,
      idempotencyKey: `delete-${slug}`,
    })
  } else if (state !== 'published') {
    const draft = await service.saveDraft({
      articleId,
      dek: `Quarantined dek of ${slug}`,
      document: storyDocument(articleId, `Quarantined ${slug}`, `Quarantined body of ${slug}.`),
      expectedVersion: article.version,
      idempotencyKey: `revise-${slug}`,
      title: `Quarantined ${slug}`,
    })
    if (state === 'preview') return
    await schedule(draft.article.version, draft.revision.id)
    if (state === 'orphaned') {
      await repository.transaction(async (transaction) => {
        for (const job of await transaction.listPublicationJobs(articleId)) {
          await transaction.savePublicationJob({ ...job, status: 'cancelled' })
        }
      })
    }
  }
}

/** Every distribution surface, each read in full through the reader its route uses. */
const surfaces: Readonly<Record<string, (repository: ContentRepository) => Promise<string>>> = {
  feed: async (repository) => (await readFeedDocument(repository, null)) ?? '',
  sitemap: async (repository) => {
    const urls = await readSitemapUrls(repository)
    const pages = Array.from({ length: sitemapPageCount(urls) }, (_, index) =>
      renderSitemapPage(urls, index + 1),
    )
    return [renderSitemapIndex(urls), ...pages].join('\n')
  },
}

describe('only stories readers can see reach the feed and the sitemap (AC-03)', () => {
  // Slugs carry their visibility, so no hidden slug is part of a visible one.
  const visibleSlug = (state: StoryState) => `visible-${state}`
  const hiddenSlug = (state: StoryState) => `hidden-${state}`

  async function corpus() {
    const repository = new InMemoryContentRepository()
    let day = 1
    for (const state of visibleStates) await addStory(repository, visibleSlug(state), state, day++)
    for (const state of hiddenStates) await addStory(repository, hiddenSlug(state), state, day++)
    return repository
  }

  it.each(Object.keys(surfaces))(
    'the %s lists visible stories and no draft, scheduled, preview or deleted content',
    async (surface) => {
      const read = surfaces[surface]
      if (!read) throw new Error(`No surface ${surface}`)
      const output = await read(await corpus())

      for (const state of visibleStates) {
        expect(output, state).toContain(canonicalArticleUrl(visibleSlug(state)))
      }
      for (const state of hiddenStates) {
        expect(output, state).not.toContain(hiddenSlug(state))
      }
      expect(output).not.toContain('hidden')
      // Newer drafts never replace what was published, whether awaiting review or scheduled.
      expect(output).not.toContain('Quarantined')
    },
  )

  it('lists the published copy of a story with a newer draft', async () => {
    const feed = items(expectValidRss((await readFeedDocument(await corpus(), null)) ?? ''))
    const preview = feed.find((item) => text(item, 'guid') === 'article-visible-preview')

    expect(feed.map((item) => text(item, 'guid'))).toEqual([
      'article-visible-rescheduled',
      'article-visible-published',
      'article-visible-preview',
    ])
    expect(text(preview as Element, 'title')).toBe('Title of visible-preview')
    expect(text(preview as Element, 'description')).toBe('Dek of visible-preview')
  })

  it('drops a story from every surface once it is unpublished or deleted (BR-05)', async () => {
    const repository = new InMemoryContentRepository()
    const clock: Clock = { now: () => new Date('2026-10-05T09:00:00.000Z') }
    const service = new ContentService(repository, clock)
    await addStory(repository, 'short-lived', 'published')
    await addStory(repository, 'removed', 'published', 2)
    await addStory(repository, 'kept', 'published', 3)

    for (const read of Object.values(surfaces)) {
      const output = await read(repository)
      expect(output).toContain(canonicalArticleUrl('short-lived'))
      expect(output).toContain(canonicalArticleUrl('removed'))
    }

    const withdrawn = await repository.transaction((transaction) =>
      transaction.getArticle('article-short-lived'),
    )
    await service.unpublish({
      articleId: 'article-short-lived',
      expectedVersion: withdrawn?.version ?? 0,
      idempotencyKey: 'unpublish-short-lived',
      reason: 'Removal check',
    })
    const removed = await repository.transaction((transaction) =>
      transaction.getArticle('article-removed'),
    )
    await service.softDelete({
      articleId: 'article-removed',
      expectedVersion: removed?.version ?? 0,
      idempotencyKey: 'delete-removed',
    })

    for (const read of Object.values(surfaces)) {
      const output = await read(repository)
      expect(output).not.toContain('short-lived')
      expect(output).not.toContain('removed')
      expect(output).toContain(canonicalArticleUrl('kept'))
    }
  })
})
