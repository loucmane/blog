import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AuthorPage, { generateMetadata as authorMetadata } from '@/app/authors/[slug]/page'
import StoryPage, { generateMetadata as storyMetadata } from '@/app/stories/[slug]/page'
import TopicPage, { generateMetadata as topicMetadata } from '@/app/topics/[slug]/page'
import { resolveCanonicalSiteUrl } from '@/lib/site-url'
import { CURRENT_CONTENT_DOCUMENT_VERSION } from '@/server/content/document'
import type { AuthorProfile, TaxonomyTerm } from '@/server/content/domain'
import { SectionService } from '@/server/content/sections'
import { getOwnerRuntime } from '@/server/owner/runtime'
import { createOwnerFixtureSession, ownerFixtureCookieName } from '@/server/owner/session'

import { requestScope } from '../support/request-scope'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: <T>(load: T) => load,
}))

vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  connection: vi.fn(async () => undefined),
}))

vi.mock('next/headers', async () => (await import('../support/request-scope')).nextHeaders)

/* Night Edition has no author or topic views, so baseline's show; Day Edition has its own. */
vi.mock('@/reader-directions/registry', async () => {
  const { createElement } = await import('react')
  const { createReaderDirectionRegistry, defineReaderDirection } =
    await import('@/reader-directions/contract')
  const { baselineDirection } = await import('@/reader-directions/baseline')
  const view = (edition: string, page: string) =>
    function StandInView() {
      return createElement('main', { [`data-${edition}`]: page }, `${edition} ${page}`)
    }
  return {
    readerDirections: createReaderDirectionRegistry({
      defaultId: 'baseline',
      directions: [
        baselineDirection,
        defineReaderDirection({
          Article: view('night-edition', 'article'),
          Home: view('night-edition', 'home'),
          id: 'night-edition',
          name: 'Night Edition',
          Section: view('night-edition', 'section'),
          thesis: 'A stand-in direction without author or topic views of its own.',
        }),
        defineReaderDirection({
          Article: view('day-edition', 'article'),
          Author: view('day-edition', 'author'),
          Home: view('day-edition', 'home'),
          id: 'day-edition',
          name: 'Day Edition',
          Section: view('day-edition', 'section'),
          thesis: 'A stand-in direction with author and topic views of its own.',
          Topic: view('day-edition', 'topic'),
        }),
      ],
    }),
  }
})

const siteOrigin = 'http://127.0.0.1:3100'
const labCookie = 'reader_lab_direction'
const runtimeKey = Symbol.for('magazine.owner-runtime')
const termTime = '2026-10-01T00:00:00.000Z'

interface Topic {
  readonly kind: Exclude<TaxonomyTerm['kind'], 'section'>
  readonly name: string
  readonly slug: string
}

interface StoryInput {
  readonly authors?: readonly AuthorProfile[]
  readonly dek: string
  readonly section?: string
  readonly slug: string
  readonly text: string
  readonly title: string
  readonly topics?: readonly Topic[]
}

const winterLight = {
  dek: 'How a north-facing room learns to hold the low sun of December.',
  slug: 'quiet-architecture-of-winter-light',
  text: 'By three in the afternoon the light is already leaving, and the room changes its mind.',
  title: 'The quiet architecture of winter light',
}
const shelf = {
  dek: 'Six objects and an empty third of a shelf.',
  slug: 'a-single-shelf-rearranged',
  text: 'Take everything off the shelf and put back only six objects.',
  title: 'A single shelf, rearranged',
}
const boathouse = {
  dek: 'A boathouse that keeps its shape through the winter.',
  slug: 'the-boathouse-in-winter',
  text: 'The boathouse stands empty from November, and the lake keeps its own counsel.',
  title: 'The boathouse in winter',
}

function authorProfile(slug: string, displayName: string, bio: string): AuthorProfile {
  return { bio, createdAt: termTime, displayName, id: `author-${slug}`, slug, updatedAt: termTime }
}

const alpha = authorProfile('alpha', 'Alpha Writer', 'Alpha Writer writes about rooms.')
const bravo = authorProfile('bravo', 'Bravo Writer', '')
const lightTag: Topic = { kind: 'tag', name: 'Light', slug: 'light' }

function resetOwnerRuntime() {
  delete (globalThis as { [runtimeKey]?: unknown })[runtimeKey]
}

beforeEach(() => {
  vi.stubEnv('BETTER_AUTH_URL', siteOrigin)
  vi.stubEnv('MAGAZINE_OWNER_EMAIL', 'owner@example.test')
  vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '1')
  vi.stubEnv('MAGAZINE_OWNER_TEST_TOKEN', 'author-topic-route-test-token-with-more-than-32-bytes')
  vi.stubEnv('MAGAZINE_RUNTIME_SITE_URL', siteOrigin)
  resetOwnerRuntime()
  requestScope.reset()
})

afterEach(() => {
  resetOwnerRuntime()
  requestScope.reset()
  vi.unstubAllEnvs()
})

function slugParams(slug: string) {
  return { params: Promise.resolve({ slug }) }
}

async function render(page: Promise<ReactElement>): Promise<string> {
  return renderToStaticMarkup(await page)
}

async function expectNotFound(page: Promise<unknown>) {
  await expect(page).rejects.toMatchObject({ digest: 'NEXT_HTTP_ERROR_FALLBACK;404' })
}

/** The text of every `h1` in the markup, without its inner tags. */
function headings(markup: string): string[] {
  return [...markup.matchAll(/<h1[\s>][\s\S]*?<\/h1>/g)].map(([heading]) =>
    heading.replace(/<[^>]+>/g, '').trim(),
  )
}

/** Creates a story with its section, byline, and topics, as the owner's tools would file it. */
async function createStory(input: StoryInput) {
  const { content, repository } = getOwnerRuntime()
  const articleId = `article-${input.slug}`
  const created = await content.createArticle({
    dek: input.dek,
    document: {
      articleId,
      document: {
        content: [{ content: [{ text: input.text, type: 'text' }], type: 'paragraph' }],
        type: 'doc',
      },
      migrationProvenance: [],
      schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
      title: input.title,
    },
    id: articleId,
    idempotencyKey: `create-${input.slug}`,
    slug: input.slug,
    title: input.title,
  })
  if (input.section) {
    const sections = new SectionService(repository)
    const section = await sections.ensureSection({ name: input.section, slug: input.section })
    await sections.assignSection({ articleId, sectionId: section.id })
  }
  await repository.transaction(async (transaction) => {
    const authors = await transaction.listAuthors()
    for (const profile of input.authors ?? []) {
      if (!authors.some(({ id }) => id === profile.id)) await transaction.saveAuthor(profile)
    }
    await transaction.setArticleAuthors(
      articleId,
      (input.authors ?? []).map(({ id }) => id),
    )
    const terms = await transaction.listTaxonomyTerms()
    for (const [index, topic] of (input.topics ?? []).entries()) {
      const id = `${topic.kind}-${topic.slug}`
      if (!terms.some((term) => term.id === id)) {
        await transaction.saveTaxonomyTerm({
          ...topic,
          createdAt: termTime,
          id,
          updatedAt: termTime,
        })
      }
      await transaction.saveArticleTaxonomy({ articleId, position: index + 1, taxonomyId: id })
    }
    transaction.recordPublicationChange()
  })
  return created
}

async function publishStory(input: StoryInput) {
  const created = await createStory(input)
  return getOwnerRuntime().content.publish({
    articleId: created.article.id,
    expectedVersion: created.article.version,
    idempotencyKey: `publish-${input.slug}`,
    revisionId: created.revision.id,
  })
}

async function unpublish(published: Awaited<ReturnType<typeof publishStory>>) {
  await getOwnerRuntime().content.unpublish({
    articleId: published.article.id,
    expectedVersion: published.article.version,
    idempotencyKey: `unpublish-${published.article.slug}`,
    reason: 'Holding for corrections',
  })
}

describe('author pages', () => {
  it('list the author’s visible stories, newest first, under one heading, with metadata', async () => {
    await publishStory({ ...winterLight, authors: [alpha], section: 'interiors' })
    await publishStory({ ...shelf, authors: [bravo, alpha] })
    await unpublish(await publishStory({ ...boathouse, authors: [alpha] }))

    const markup = await render(AuthorPage(slugParams('alpha')))
    const metadata = await authorMetadata(slugParams('alpha'))

    expect(headings(markup)).toEqual(['Alpha Writer'])
    expect(markup).toContain('Alpha Writer writes about rooms.')
    expect(markup).toContain(`href="/stories/${shelf.slug}"`)
    expect(markup).toContain(`href="/stories/${winterLight.slug}"`)
    expect(markup.indexOf(shelf.title)).toBeLessThan(markup.indexOf(winterLight.title))
    expect(markup).not.toContain(boathouse.title)
    expect(markup).toContain('href="/sections/interiors"')
    expect(markup).toContain('data-reader-direction="baseline"')
    expect(markup).toMatch(/data-reader-cache-generation="[0-9a-f-]{36}"/)
    expect(metadata).toMatchObject({
      alternates: { canonical: '/authors/alpha' },
      description: 'Alpha Writer writes about rooms.',
      openGraph: {
        description: 'Alpha Writer writes about rooms.',
        title: 'Alpha Writer',
        type: 'profile',
      },
      title: 'Alpha Writer',
    })
    expect(String(metadata.openGraph?.url)).toBe(
      new URL('/authors/alpha', resolveCanonicalSiteUrl()).href,
    )
  })

  it('show an author credited only on a draft on an empty page', async () => {
    await createStory({ ...winterLight, authors: [bravo] })

    const markup = await render(AuthorPage(slugParams('bravo')))

    expect(headings(markup)).toEqual(['Bravo Writer'])
    expect(markup).toContain('No stories by Bravo Writer have been published yet.')
    expect(markup).not.toContain(winterLight.title)
    expect(await authorMetadata(slugParams('bravo'))).toMatchObject({
      description: 'Stories by Bravo Writer.',
      title: 'Bravo Writer',
    })
  })

  it('return not found for unknown, empty, malformed, and oversized slugs', async () => {
    await publishStory({ ...winterLight, authors: [alpha] })

    for (const slug of ['unknown-author', '', ' ', '../alpha', 'Alpha', 'a'.repeat(201)]) {
      await expectNotFound(AuthorPage(slugParams(slug)))
      expect(await authorMetadata(slugParams(slug)), JSON.stringify(slug)).toEqual({})
    }
  })
})

describe('topic pages', () => {
  it('list the visible stories on a topic across sections, under one heading, with metadata', async () => {
    await publishStory({ ...winterLight, section: 'interiors', topics: [lightTag] })
    await publishStory({
      ...shelf,
      section: 'craft',
      topics: [{ kind: 'category', name: 'Light', slug: 'light' }],
    })
    await unpublish(await publishStory({ ...boathouse, topics: [lightTag] }))

    const markup = await render(TopicPage(slugParams('light')))
    const metadata = await topicMetadata(slugParams('light'))

    expect(headings(markup)).toEqual(['Light'])
    expect(markup).toContain(`href="/stories/${winterLight.slug}"`)
    expect(markup).toContain(`href="/stories/${shelf.slug}"`)
    expect(markup).not.toContain(boathouse.title)
    expect(markup).toContain('href="/sections/interiors"')
    expect(markup).toContain('href="/sections/craft"')
    expect(metadata).toMatchObject({
      alternates: { canonical: '/topics/light' },
      description: 'Stories about Light.',
      openGraph: { description: 'Stories about Light.', title: 'Light', type: 'website' },
      title: 'Light',
    })
    expect(String(metadata.openGraph?.url)).toBe(
      new URL('/topics/light', resolveCanonicalSiteUrl()).href,
    )
  })

  it('show a topic without visible stories on an empty page', async () => {
    await createStory({ ...winterLight, topics: [{ kind: 'tag', name: 'Unseen', slug: 'unseen' }] })

    const markup = await render(TopicPage(slugParams('unseen')))

    expect(headings(markup)).toEqual(['Unseen'])
    expect(markup).toContain('No stories on this topic have been published yet.')
    expect(markup).not.toContain(winterLight.title)
  })

  it('return not found for unknown topics, sections, and malformed slugs', async () => {
    await publishStory({ ...winterLight, section: 'interiors', topics: [lightTag] })

    for (const slug of ['unknown-topic', 'interiors', '', '../light', 'Light']) {
      await expectNotFound(TopicPage(slugParams(slug)))
      expect(await topicMetadata(slugParams(slug)), JSON.stringify(slug)).toEqual({})
    }
  })
})

/*
 * Import takes author and taxonomy slugs of 1 to 200 characters and the tables check only the
 * kebab-case shape, so these routes accept that rule rather than the story and section one
 * (2 to 180 characters).
 */
describe('author and topic slugs', () => {
  it('resolve at one character and at 200 characters, from the story’s own links', async () => {
    const shortest = 'c'
    const longest = 'a'.repeat(200)
    await publishStory({
      ...winterLight,
      authors: [
        authorProfile(shortest, 'Short Writer', ''),
        authorProfile(longest, 'Long Writer', ''),
      ],
      topics: [
        { kind: 'tag', name: 'Short', slug: shortest },
        { kind: 'category', name: 'Long', slug: longest },
      ],
    })

    const article = await render(StoryPage(slugParams(winterLight.slug)))

    for (const [slug, writer, topic] of [
      [shortest, 'Short Writer', 'Short'],
      [longest, 'Long Writer', 'Long'],
    ] as const) {
      expect(article).toContain(`href="/authors/${slug}"`)
      expect(article).toContain(`href="/topics/${slug}"`)
      const authorPage = await render(AuthorPage(slugParams(slug)))
      const topicPage = await render(TopicPage(slugParams(slug)))
      expect(headings(authorPage)).toEqual([writer])
      expect(headings(topicPage)).toEqual([topic])
      expect(authorPage).toContain(`href="/stories/${winterLight.slug}"`)
      expect(topicPage).toContain(`href="/stories/${winterLight.slug}"`)
      expect(await authorMetadata(slugParams(slug))).toMatchObject({
        alternates: { canonical: `/authors/${slug}` },
        title: writer,
      })
      expect(await topicMetadata(slugParams(slug))).toMatchObject({
        alternates: { canonical: `/topics/${slug}` },
        title: topic,
      })
    }
  })

  it('return not found for empty, 201-character, and malformed slugs, even when one is stored', async () => {
    const rejected = ['', 'a'.repeat(201), 'C', '-c', 'c-', 'c--d', 'c d', ' c', '../c', 'c/d']
    await publishStory({
      ...winterLight,
      authors: rejected.map((slug, index) => authorProfile(slug, `Writer ${index}`, '')),
      topics: rejected.map((slug, index) => ({ kind: 'tag', name: `Topic ${index}`, slug })),
    })
    // The in-memory store does not check slugs, so only the routes' slug rule turns these away.
    const stored = await getOwnerRuntime().repository.transaction(async (transaction) => ({
      authors: (await transaction.listAuthors()).map(({ slug }) => slug),
      topics: (await transaction.listTaxonomyTerms()).map(({ slug }) => slug),
    }))
    expect(stored.authors).toEqual(expect.arrayContaining(rejected))
    expect(stored.topics).toEqual(expect.arrayContaining(rejected))

    for (const slug of rejected) {
      await expectNotFound(AuthorPage(slugParams(slug)))
      await expectNotFound(TopicPage(slugParams(slug)))
      expect(await authorMetadata(slugParams(slug)), JSON.stringify(slug)).toEqual({})
      expect(await topicMetadata(slugParams(slug)), JSON.stringify(slug)).toEqual({})
    }
  })
})

describe('story pages', () => {
  it('link the byline and topics, and list related stories from the story’s section', async () => {
    await publishStory({ ...shelf, section: 'interiors' })
    await publishStory({ ...boathouse, section: 'boats' })
    await publishStory({
      ...winterLight,
      authors: [bravo, alpha],
      section: 'interiors',
      topics: [lightTag, { kind: 'tag', name: 'Winter', slug: 'winter' }],
    })

    const article = await render(StoryPage(slugParams(winterLight.slug)))

    expect(headings(article)).toEqual([winterLight.title])
    expect(article.indexOf('href="/authors/bravo"')).toBeGreaterThan(-1)
    expect(article.indexOf('href="/authors/alpha"')).toBeGreaterThan(
      article.indexOf('href="/authors/bravo"'),
    )
    expect(article).toContain('href="/topics/light"')
    expect(article).toContain('href="/topics/winter"')
    expect(article).toContain('Related stories')
    expect(article).toContain(`href="/stories/${shelf.slug}"`)
    expect(article).not.toContain(`href="/stories/${boathouse.slug}"`)
    expect(await storyMetadata(slugParams(winterLight.slug))).toMatchObject({
      authors: [
        { name: 'Bravo Writer', url: '/authors/bravo' },
        { name: 'Alpha Writer', url: '/authors/alpha' },
      ],
    })
  })

  it('leave the byline, topics, and related stories out when a story has none', async () => {
    await publishStory(winterLight)

    const article = await render(StoryPage(slugParams(winterLight.slug)))

    expect(article).not.toContain('href="/authors/')
    expect(article).not.toContain('href="/topics/')
    expect(article).not.toContain('Related stories')
    expect(await storyMetadata(slugParams(winterLight.slug))).toMatchObject({ authors: [] })
  })
})

describe('author and topic pages in the Reader Lab', () => {
  async function renderPages() {
    return {
      author: await render(AuthorPage(slugParams('alpha'))),
      topic: await render(TopicPage(slugParams('light'))),
    }
  }

  it('show visitors the default direction even when they send the lab cookie', async () => {
    await publishStory({ ...winterLight, authors: [alpha], topics: [lightTag] })
    requestScope.setCookies({ [labCookie]: 'night-edition' })

    for (const [page, markup] of Object.entries(await renderPages())) {
      expect(markup, page).toContain('data-reader-direction="baseline"')
      expect(markup, page).toContain(winterLight.title)
      expect(markup, page).not.toContain('night-edition')
      expect(markup, page).not.toContain('data-reader-lab')
    }
  })

  it('show the owner the lab direction, with baseline’s views when the direction has none', async () => {
    await publishStory({ ...winterLight, authors: [alpha], topics: [lightTag] })
    const owner = createOwnerFixtureSession()

    requestScope.setCookies({ [labCookie]: 'night-edition', [ownerFixtureCookieName]: owner })
    const night = await renderPages()
    expect(headings(night.author)).toEqual(['Alpha Writer'])
    expect(headings(night.topic)).toEqual(['Light'])
    for (const [page, markup] of Object.entries(night)) {
      expect(markup, page).toContain('data-reader-direction="night-edition"')
      expect(markup, page).toContain('data-reader-lab-bar')
      expect(markup, page).toContain(winterLight.title)
      expect(markup, page).not.toContain('data-reader-direction="baseline"')
    }

    requestScope.setCookies({ [labCookie]: 'day-edition', [ownerFixtureCookieName]: owner })
    const day = await renderPages()
    expect(day.author).toContain('data-day-edition="author"')
    expect(day.topic).toContain('data-day-edition="topic"')
    for (const [page, markup] of Object.entries(day)) {
      expect(markup, page).toContain('data-reader-direction="day-edition"')
      expect(markup, page).toContain('data-reader-lab-bar')
    }
  })
})

describe('author and topic pages without a content store', () => {
  it('return not found', async () => {
    vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '')
    vi.stubEnv('DATABASE_URL', '')

    await expectNotFound(AuthorPage(slugParams('alpha')))
    await expectNotFound(TopicPage(slugParams('light')))
    expect(await authorMetadata(slugParams('alpha'))).toEqual({})
    expect(await topicMetadata(slugParams('light'))).toEqual({})
  })
})
