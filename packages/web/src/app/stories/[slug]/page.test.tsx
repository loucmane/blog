// @vitest-environment jsdom
import type * as Navigation from 'next/navigation'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { siteName } from '@/reader/components/failure-view'
import { readArticleView, type ReaderSource } from '@/reader/read-model'
import { readerDirections } from '@/reader-directions/registry'
import { ReaderPage } from '@/reader-lab/reader-page'
import { CURRENT_CONTENT_DOCUMENT_VERSION, type ContentNode } from '@/server/content/document'
import type { AuthorProfile } from '@/server/content/domain'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import type { Clock } from '@/server/content/ports'
import { SectionService } from '@/server/content/sections'
import { ContentService } from '@/server/content/service'
import {
  serializeJsonLd,
  storyStructuredData,
  type StoryJsonLd,
} from '@/server/distribution/structured-data'

import StoryPage from './page'

const store = vi.hoisted(() => ({ source: null as ReaderSource | null }))

vi.mock('next/server', () => ({ connection: async () => {} }))
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof Navigation>()),
  notFound: () => {
    throw new Error('NOT_FOUND')
  },
}))
// The page's view, read from this test's content store as the public reader cache reads it.
vi.mock('@/reader/cache', async () => {
  const readModel = await import('@/reader/read-model')
  return {
    loadArticleView: async (slug: string) => {
      if (!store.source) throw new Error('The test has no content store.')
      return {
        cacheGeneration: 'generation-1',
        status: 'ready',
        view: await readModel.readArticleView(store.source, slug),
      }
    },
  }
})
// A visitor's presentation: the default direction, outside the Reader Lab.
vi.mock('@/reader-lab/presentation', async () => {
  const registry = await import('@/reader-directions/registry')
  return {
    resolveReaderPresentation: async () => ({
      direction: registry.readerDirections.defaultDirection,
      lab: null,
    }),
  }
})
vi.mock('@/reader-lab/lab-bar', () => ({ ReaderLabBar: () => <aside aria-label="Reader Lab" /> }))

const origin = 'https://magazine.example'
const publishedAt = '2026-09-01T07:00:00.000Z'

let repository: InMemoryContentRepository

function clockAt(iso: string): Clock {
  return { now: () => new Date(iso) }
}

function documentFor(articleId: string, title: string, text: string) {
  return {
    articleId,
    document: { content: [paragraph(text)], type: 'doc' },
    migrationProvenance: [],
    schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
    title,
  }
}

function paragraph(value: string): ContentNode {
  return { content: [{ text: value, type: 'text' }], type: 'paragraph' }
}

/** Creates a story's first draft, which is never published. */
async function draft(input: {
  readonly dek?: string
  readonly slug: string
  readonly title?: string
}) {
  const service = new ContentService(repository, clockAt(publishedAt))
  const articleId = `article-${input.slug}`
  const title = input.title ?? `Title for ${input.slug}`
  const created = await service.createArticle({
    dek: input.dek ?? `Summary for ${input.slug}`,
    document: documentFor(articleId, title, `Body of ${input.slug}`),
    id: articleId,
    idempotencyKey: `create-${input.slug}`,
    slug: input.slug,
    title,
  })
  return { ...created, service }
}

async function publish(input: {
  readonly dek?: string
  readonly section?: { readonly name: string; readonly slug: string }
  readonly slug: string
  readonly title?: string
}) {
  const created = await draft(input)
  if (input.section) {
    const sections = new SectionService(repository, clockAt(publishedAt))
    const section = await sections.ensureSection(input.section)
    await sections.assignSection({ articleId: created.article.id, sectionId: section.id })
  }
  const published = await created.service.publish({
    articleId: created.article.id,
    expectedVersion: created.article.version,
    idempotencyKey: `publish-${input.slug}`,
    revisionId: created.revision.id,
  })
  return { ...published, service: created.service }
}

/** Saves the author and credits them on the article. */
async function credit(articleId: string, slug: string, displayName: string) {
  const author: AuthorProfile = {
    bio: '',
    createdAt: publishedAt,
    displayName,
    id: `author-${slug}`,
    slug,
    updatedAt: publishedAt,
  }
  await repository.transaction(async (transaction) => {
    await transaction.saveAuthor(author)
    await transaction.setArticleAuthors(articleId, [author.id])
    transaction.recordPublicationChange()
  })
}

async function publicView(slug: string) {
  if (!store.source) throw new Error('The test has no content store.')
  const view = await readArticleView(store.source, slug)
  if (!view) throw new Error(`No public story has the slug ${slug}.`)
  return view
}

async function renderStory(slug: string): Promise<string> {
  return renderToStaticMarkup(await StoryPage({ params: Promise.resolve({ slug }) }))
}

/**
 * React derives `useId` values from an element's place in the tree, so a page with one more
 * top-level element numbers them differently; the server and the client still agree on them.
 */
function withoutGeneratedIds(markup: string): string {
  return markup.replace(/_R_[0-9a-z]+_/g, '_R_')
}

/** The page as a browser's HTML parser reads it: the parser alone decides where a script ends. */
function parse(html: string): HTMLElement {
  const container = document.createElement('div')
  container.innerHTML = html
  return container
}

/**
 * What the public story route emits as structured data for a slug: the JSON-LD text, or null when
 * the route answers not found and so renders none.
 */
async function emittedStructuredData(slug: string): Promise<string | null> {
  let html: string
  try {
    html = await renderStory(slug)
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') return null
    throw error
  }
  return parse(html).querySelector('script[type="application/ld+json"]')?.textContent ?? null
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', origin)
  repository = new InMemoryContentRepository()
  store.source = { mediaAvailable: true, repository }
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('story page structured data', () => {
  it('adds the story’s JSON-LD after the reader page and leaves the reader markup as it was', async () => {
    const story = await publish({
      dek: 'How a north window lights a winter room.',
      section: { name: 'Interiors', slug: 'interiors' },
      slug: 'winter-light',
      title: 'Winter light',
    })
    await credit(story.article.id, 'alpha', 'Alpha Writer')
    const view = await publicView('winter-light')
    const { Article } = readerDirections.defaultDirection
    const readerMarkup = renderToStaticMarkup(
      <ReaderPage
        cacheGeneration="generation-1"
        presentation={{ direction: readerDirections.defaultDirection, lab: null }}
      >
        <Article view={view} />
      </ReaderPage>,
    )

    const html = await renderStory('winter-light')

    expect(withoutGeneratedIds(html)).toBe(
      withoutGeneratedIds(
        `${readerMarkup}<script type="application/ld+json">${serializeJsonLd(storyStructuredData(view))}</script>`,
      ),
    )
    const page = parse(html)
    const root = page.querySelector('[data-reader-direction]')
    const script = page.querySelector('script')
    expect(page.querySelectorAll('script')).toHaveLength(1)
    expect(script?.type).toBe('application/ld+json')
    expect(root?.nextElementSibling).toBe(script)
    expect(JSON.parse(script?.textContent ?? '')).toEqual(storyStructuredData(view))
  })

  it('keeps a stored title or name holding a closing script tag inside the JSON-LD', async () => {
    const hostile = '</script><script>document.title = "taken"</script><!--'
    const story = await publish({
      dek: hostile,
      section: { name: hostile, slug: 'hostile-section' },
      slug: 'hostile-story',
      title: hostile,
    })
    await credit(story.article.id, 'hostile-writer', hostile)

    const html = await renderStory('hostile-story')

    const scripts = [...parse(html).querySelectorAll('script')]
    expect(scripts.map((script) => script.type)).toEqual(['application/ld+json'])
    expect(html.match(/<\/script/gi)).toHaveLength(1)
    const data = JSON.parse(scripts[0]?.textContent ?? '') as StoryJsonLd
    expect(data['@graph'][0]).toMatchObject({
      articleSection: hostile,
      author: [{ name: hostile }],
      description: hostile,
      headline: hostile,
    })
    expect(data['@graph'][1].itemListElement.map(({ name }) => name)).toEqual([
      siteName,
      hostile,
      hostile,
    ])
  })

  it('carries the published revision, never a newer draft or a scheduled revision', async () => {
    const story = await publish({
      dek: 'The live summary',
      slug: 'live-story',
      title: 'Live title',
    })
    const newer = await story.service.saveDraft({
      articleId: story.article.id,
      dek: 'The previewed draft summary',
      document: documentFor(story.article.id, 'The previewed draft title', 'Previewed draft body'),
      expectedVersion: story.article.version,
      idempotencyKey: 'save-newer-draft',
      title: 'The previewed draft title',
    })

    const whileDrafting = await emittedStructuredData('live-story')

    await new ContentService(repository, clockAt('2026-09-20T00:00:00.000Z')).schedulePublication({
      articleId: story.article.id,
      expectedVersion: newer.article.version,
      idempotencyKey: 'schedule-newer-draft',
      revisionId: newer.revision.id,
      runAt: '2026-12-01T09:00:00.000Z',
      timeZone: 'Europe/Stockholm',
    })
    const whileScheduled = await emittedStructuredData('live-story')

    for (const emitted of [whileDrafting, whileScheduled]) {
      expect(JSON.parse(emitted ?? 'null')?.['@graph'][0]).toMatchObject({
        description: 'The live summary',
        headline: 'Live title',
      })
      expect(emitted).not.toContain('previewed')
    }
  })
})

/*
 * AC-03 for structured data: each state below is seeded through the content service, and the
 * public story route, the only route that emits structured data, emits none for it.
 */
const excludedStates: readonly (readonly [string, () => Promise<string>])[] = [
  [
    'a draft',
    async () => {
      await draft({ slug: 'draft-story' })
      return 'draft-story'
    },
  ],
  [
    'a scheduled story',
    async () => {
      const created = await draft({ slug: 'scheduled-story' })
      await created.service.schedulePublication({
        articleId: created.article.id,
        expectedVersion: created.article.version,
        idempotencyKey: 'schedule-story',
        revisionId: created.revision.id,
        runAt: '2026-12-01T09:00:00.000Z',
        timeZone: 'Europe/Stockholm',
      })
      return 'scheduled-story'
    },
  ],
  [
    'an unpublished story',
    async () => {
      const story = await publish({ slug: 'unpublished-story' })
      await story.service.unpublish({
        articleId: story.article.id,
        expectedVersion: story.article.version,
        idempotencyKey: 'unpublish-story',
        reason: 'Corrections pending',
      })
      return 'unpublished-story'
    },
  ],
  [
    'a soft-deleted story',
    async () => {
      const story = await publish({ slug: 'deleted-story' })
      await story.service.softDelete({
        articleId: story.article.id,
        expectedVersion: story.article.version,
        idempotencyKey: 'delete-story',
      })
      return 'deleted-story'
    },
  ],
  ['an unknown slug', async () => 'no-such-story'],
]

describe('structured data exclusion (AC-03)', () => {
  it('emits structured data for a published story', async () => {
    await publish({ slug: 'published-story' })

    expect(await emittedStructuredData('published-story')).toContain('"@type":"Article"')
  })

  it.each(excludedStates)('emits none for %s', async (_, seed) => {
    const slug = await seed()

    expect(await emittedStructuredData(slug)).toBeNull()
  })
})
