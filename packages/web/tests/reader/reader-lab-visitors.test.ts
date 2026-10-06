import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import HomePage from '@/app/page'
import SectionPage from '@/app/sections/[slug]/page'
import StoryPage from '@/app/stories/[slug]/page'
import { CURRENT_CONTENT_DOCUMENT_VERSION } from '@/server/content/document'
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

/* The real registry holds only baseline for now, so a second direction stands in for an override. */
vi.mock('@/reader-directions/registry', async () => {
  const { createElement } = await import('react')
  const { createReaderDirectionRegistry, defineReaderDirection } =
    await import('@/reader-directions/contract')
  const { baselineDirection } = await import('@/reader-directions/baseline')
  const view = (name: string) =>
    function NightEditionView() {
      return createElement('main', { 'data-night-edition': name }, `Night Edition ${name}`)
    }
  return {
    readerDirections: createReaderDirectionRegistry({
      defaultId: 'baseline',
      directions: [
        baselineDirection,
        defineReaderDirection({
          Article: view('article'),
          Home: view('home'),
          id: 'night-edition',
          name: 'Night Edition',
          Section: view('section'),
          thesis: 'A stand-in direction that only a signed-in owner may see.',
        }),
      ],
    }),
  }
})

const siteOrigin = 'http://127.0.0.1:3100'
const ownerTestToken = 'reader-lab-visitor-test-token-with-more-than-32-bytes'
const labCookie = 'reader_lab_direction'
const runtimeKey = Symbol.for('magazine.owner-runtime')
const story = {
  dek: 'How a north-facing room learns to hold the low sun of December.',
  slug: 'quiet-architecture-of-winter-light',
  text: 'By three in the afternoon the light is already leaving, and the room changes its mind.',
  title: 'The quiet architecture of winter light',
}

function resetOwnerRuntime() {
  delete (globalThis as { [runtimeKey]?: unknown })[runtimeKey]
}

beforeEach(() => {
  vi.stubEnv('BETTER_AUTH_URL', siteOrigin)
  vi.stubEnv('MAGAZINE_OWNER_EMAIL', 'owner@example.test')
  vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '1')
  vi.stubEnv('MAGAZINE_OWNER_TEST_TOKEN', ownerTestToken)
  vi.stubEnv('MAGAZINE_RUNTIME_SITE_URL', siteOrigin)
  resetOwnerRuntime()
  requestScope.reset()
})

afterEach(() => {
  resetOwnerRuntime()
  requestScope.reset()
  vi.unstubAllEnvs()
})

async function publishStoryInSection() {
  const { content, repository } = getOwnerRuntime()
  const articleId = `article-${story.slug}`
  const created = await content.createArticle({
    dek: story.dek,
    document: {
      articleId,
      document: {
        content: [{ content: [{ text: story.text, type: 'text' }], type: 'paragraph' }],
        type: 'doc',
      },
      migrationProvenance: [],
      schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
      title: story.title,
    },
    id: articleId,
    idempotencyKey: `create-${story.slug}`,
    slug: story.slug,
    title: story.title,
  })
  const sections = new SectionService(repository)
  const section = await sections.ensureSection({ name: 'Interiors', slug: 'interiors' })
  await sections.assignSection({ articleId: created.article.id, sectionId: section.id })
  await content.publish({
    articleId: created.article.id,
    expectedVersion: created.article.version,
    idempotencyKey: `publish-${story.slug}`,
    revisionId: created.revision.id,
  })
}

function slugParams(slug: string) {
  return { params: Promise.resolve({ slug }) }
}

async function renderReaderPages(): Promise<Record<string, string>> {
  const render = async (page: Promise<ReactElement>) => renderToStaticMarkup(await page)
  return {
    article: await render(StoryPage(slugParams(story.slug))),
    home: await render(HomePage()),
    section: await render(SectionPage(slugParams('interiors'))),
  }
}

function expectDefaultWithoutLabBar(pages: Record<string, string>, label: string) {
  for (const [page, markup] of Object.entries(pages)) {
    const context = `${page} page, ${label}`
    expect(markup, context).toContain('data-reader-direction="baseline"')
    expect(markup, context).toContain(story.title)
    expect(markup, context).not.toContain('data-reader-direction="night-edition"')
    expect(markup, context).not.toContain('data-night-edition')
    expect(markup, context).not.toContain('Night Edition')
    expect(markup, context).not.toContain('data-reader-lab')
    expect(markup, context).not.toContain('Reader Lab')
  }
}

describe('Reader Lab overrides', () => {
  it('renders the default direction without the lab bar for a visitor who sends the lab cookie', async () => {
    await publishStoryInSection()
    requestScope.setCookies({ [labCookie]: 'night-edition' })

    expectDefaultWithoutLabBar(await renderReaderPages(), 'visitor with the lab cookie')
  })

  it('ignores the lab cookie when the owner session is forged or signed for another owner', async () => {
    await publishStoryInSection()
    const otherOwnerSession = createOwnerFixtureSession({
      BETTER_AUTH_URL: siteOrigin,
      MAGAZINE_OWNER_EMAIL: 'someone-else@example.test',
      MAGAZINE_OWNER_TEST_MODE: '1',
      MAGAZINE_OWNER_TEST_TOKEN: 'a-different-owner-test-token-with-more-than-32-bytes',
      NODE_ENV: 'test',
    })

    for (const session of ['v1.forged-signature', 'v2.anything', otherOwnerSession]) {
      requestScope.setCookies({ [labCookie]: 'night-edition', [ownerFixtureCookieName]: session })
      expectDefaultWithoutLabBar(await renderReaderPages(), `session ${session}`)
    }
  })

  it('falls back to the default direction when the cookie names no registered direction, even for the owner', async () => {
    await publishStoryInSection()

    for (const value of ['unknown-direction', 'NIGHT-EDITION', '../night-edition', ' ', '']) {
      requestScope.setCookies({
        [labCookie]: value,
        [ownerFixtureCookieName]: createOwnerFixtureSession(),
      })
      expectDefaultWithoutLabBar(
        await renderReaderPages(),
        `owner with cookie ${JSON.stringify(value)}`,
      )
    }
  })

  it('treats a lab cookie as a visitor request when the owner session cannot be checked', async () => {
    vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '')
    vi.stubEnv('DATABASE_URL', '')
    requestScope.setCookies({ [labCookie]: 'night-edition', [ownerFixtureCookieName]: 'v1.any' })

    const home = renderToStaticMarkup(await HomePage())

    expect(home).toContain('Stories are unavailable')
    expect(home).toContain('data-reader-direction="baseline"')
    expect(home).not.toContain('data-reader-lab-bar')
  })

  it('shows the chosen direction only to the signed-in owner, with the lab bar', async () => {
    await publishStoryInSection()
    requestScope.setCookies({
      [labCookie]: 'night-edition',
      [ownerFixtureCookieName]: createOwnerFixtureSession(),
    })

    const pages = await renderReaderPages()

    expect(pages.home).toContain('data-night-edition="home"')
    expect(pages.article).toContain('data-night-edition="article"')
    expect(pages.section).toContain('data-night-edition="section"')
    for (const [page, markup] of Object.entries(pages)) {
      expect(markup, page).toContain('data-reader-direction="night-edition"')
      expect(markup, page).toContain('data-reader-lab-bar')
      expect(markup, page).toContain('aria-label="Reader Lab"')
      expect(markup, page).not.toContain('data-reader-direction="baseline"')
    }
  })
})
