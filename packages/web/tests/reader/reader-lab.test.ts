import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ReaderLabPage from '@/app/owner/(workspace)/reader-lab/page'
import HomePage from '@/app/page'
import SectionPage from '@/app/sections/[slug]/page'
import StoryPage from '@/app/stories/[slug]/page'
import { exitReaderLab, openReaderDirection, switchReaderDirection } from '@/reader-lab/actions'
import { CURRENT_CONTENT_DOCUMENT_VERSION } from '@/server/content/document'
import { SectionService } from '@/server/content/sections'
import { ContentService } from '@/server/content/service'
import { getOwnerRuntime } from '@/server/owner/runtime'
import {
  createOwnerFixtureSession,
  OwnerAccessError,
  ownerFixtureCookieName,
} from '@/server/owner/session'

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

/* The real registry holds only baseline for now; a second direction exercises switching. */
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
const labCookie = 'reader_lab_direction'
const runtimeKey = Symbol.for('magazine.owner-runtime')

function resetOwnerRuntime() {
  delete (globalThis as { [runtimeKey]?: unknown })[runtimeKey]
}

beforeEach(() => {
  vi.stubEnv('BETTER_AUTH_URL', siteOrigin)
  vi.stubEnv('MAGAZINE_OWNER_EMAIL', 'owner@example.test')
  vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '1')
  vi.stubEnv('MAGAZINE_OWNER_TEST_TOKEN', 'reader-lab-owner-test-token-with-more-than-32-bytes')
  vi.stubEnv('MAGAZINE_RUNTIME_SITE_URL', siteOrigin)
  resetOwnerRuntime()
  requestScope.reset()
})

afterEach(() => {
  resetOwnerRuntime()
  requestScope.reset()
  vi.unstubAllEnvs()
})

function signInOwner(cookies: Record<string, string> = {}) {
  requestScope.setCookies({ ...cookies, [ownerFixtureCookieName]: createOwnerFixtureSession() })
  requestScope.setHeader('origin', siteOrigin)
}

async function publishStory(input: {
  readonly publishedAt: string
  readonly section?: string
  readonly slug: string
  readonly title: string
}) {
  const { content, repository } = getOwnerRuntime()
  const articleId = `article-${input.slug}`
  const created = await content.createArticle({
    dek: `A summary of ${input.title}.`,
    document: {
      articleId,
      document: {
        content: [
          { content: [{ text: `${input.title} begins.`, type: 'text' }], type: 'paragraph' },
        ],
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
    const section = await sections.ensureSection({ name: 'Interiors', slug: input.section })
    await sections.assignSection({ articleId: created.article.id, sectionId: section.id })
  }
  await new ContentService(repository, { now: () => new Date(input.publishedAt) }).publish({
    articleId: created.article.id,
    expectedVersion: created.article.version,
    idempotencyKey: `publish-${input.slug}`,
    revisionId: created.revision.id,
  })
}

function form(fields: Record<string, string>): FormData {
  const data = new FormData()
  for (const [name, value] of Object.entries(fields)) data.set(name, value)
  return data
}

/** The path a Next `redirect()` points at, read from its digest (`NEXT_REDIRECT;type;path;status;`). */
async function redirectTarget(action: Promise<unknown>): Promise<string> {
  const error: unknown = await action.then(
    () => {
      throw new Error('Expected the action to redirect.')
    },
    (reason: unknown) => reason,
  )
  const digest = (error as { digest?: unknown }).digest
  if (typeof digest !== 'string' || !digest.startsWith('NEXT_REDIRECT;')) throw error
  return digest.split(';')[2] ?? ''
}

function slugParams(slug: string) {
  return { params: Promise.resolve({ slug }) }
}

async function render(page: Promise<ReactElement> | ReactElement): Promise<string> {
  return renderToStaticMarkup(await page)
}

/** Each button's text, which is its accessible name, with tags removed and spaces collapsed. */
function buttonNames(markup: string): string[] {
  return [...markup.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g)].map(([, inner]) =>
    (inner ?? '')
      .replace(/<!-- -->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  )
}

/** The class names of the first element that has the given attribute. */
function classesOf(markup: string, attribute: string): string[] {
  const tag = new RegExp(`<[a-z]+\\s[^>]*\\b${attribute}=[^>]*>`).exec(markup)?.[0] ?? ''
  return /\sclass="([^"]*)"/.exec(tag)?.[1]?.split(/\s+/) ?? []
}

const labCookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7,
  path: '/',
  sameSite: 'lax',
  secure: false,
}

describe('Reader Lab for the owner', () => {
  it('shows the chosen direction with a lab bar on home, article, and section pages', async () => {
    await publishStory({
      publishedAt: '2026-09-01T09:00:00.000Z',
      section: 'interiors',
      slug: 'winter-light',
      title: 'Winter light',
    })
    signInOwner({ [labCookie]: 'night-edition' })

    for (const markup of [
      await render(HomePage()),
      await render(StoryPage(slugParams('winter-light'))),
      await render(SectionPage(slugParams('interiors'))),
    ]) {
      expect(markup).toContain('data-reader-direction="night-edition"')
      expect(markup).toMatch(/<section[^>]*aria-label="Reader Lab"[^>]*data-reader-lab-bar/)
      expect(markup).toContain('Night Edition')
      expect(markup).toContain('2 of 2')
      expect(buttonNames(markup)).toEqual([
        'Previous direction: Baseline',
        'Next direction: Baseline',
        'Exit lab',
      ])
      expect(markup).toContain('name="direction" value="baseline"')
      expect(markup).toMatch(/href="\/owner\/reader-lab"[^>]*>(?:<[^>]+>)*[^<]*All directions/)
      expect(markup.indexOf('data-reader-lab-bar')).toBeLessThan(
        markup.indexOf('data-reader-direction='),
      )
      expect(markup.indexOf('data-reader-lab-spacer')).toBeGreaterThan(
        markup.indexOf('data-night-edition'),
      )
      expect(markup).toContain('data-reader-lab-spacer=""></div></div>')
    }
  })

  it('hides the lab bar from print without taking its controls out of rendering', async () => {
    signInOwner({ [labCookie]: 'night-edition' })

    const markup = await render(HomePage())
    const bar = markup.slice(markup.indexOf('<section'), markup.indexOf('</section>'))

    // A control that stops rendering, even only in print, loses keyboard focus in Chromium, so
    // Enter after a print preview would reach the page instead of the focused control.
    expect(bar).toContain('data-reader-lab-bar')
    expect(bar).not.toMatch(/print:(?:hidden|invisible|collapse)\b/)
    expect(classesOf(markup, 'data-reader-lab-bar')).toEqual(
      expect.arrayContaining([
        'print:size-0',
        'print:overflow-hidden',
        'print:border-0',
        'print:shadow-none',
      ]),
    )
    expect(classesOf(markup, 'data-reader-lab-spacer')).toContain('print:hidden')
  })

  it('opens the site in a direction from the lab, at home or at the latest story', async () => {
    await publishStory({
      publishedAt: '2026-09-01T09:00:00.000Z',
      slug: 'older-story',
      title: 'An older story',
    })
    await publishStory({
      publishedAt: '2026-09-20T09:00:00.000Z',
      slug: 'newest-story',
      title: 'The newest story',
    })
    signInOwner()

    expect(
      await redirectTarget(
        openReaderDirection(form({ destination: 'home', direction: 'night-edition' })),
      ),
    ).toBe('/')
    expect(
      await redirectTarget(
        openReaderDirection(form({ destination: 'latest-story', direction: 'baseline' })),
      ),
    ).toBe('/stories/newest-story')
    expect(requestScope.writes).toEqual([
      { name: labCookie, options: labCookieOptions, value: 'night-edition' },
      { name: labCookie, options: labCookieOptions, value: 'baseline' },
    ])
  })

  it('opens home instead when no story is published yet', async () => {
    signInOwner()

    expect(
      await redirectTarget(
        openReaderDirection(form({ destination: 'latest-story', direction: 'night-edition' })),
      ),
    ).toBe('/')
    expect(requestScope.writes).toEqual([
      { name: labCookie, options: labCookieOptions, value: 'night-edition' },
    ])
  })

  it('switches directions in place, so the owner stays on the same page', async () => {
    signInOwner({ [labCookie]: 'night-edition' })

    await expect(switchReaderDirection(form({ direction: 'baseline' }))).resolves.toBeUndefined()

    expect(requestScope.writes).toEqual([
      { name: labCookie, options: labCookieOptions, value: 'baseline' },
    ])
  })

  it('exits the lab by clearing the override in place', async () => {
    signInOwner({ [labCookie]: 'night-edition' })

    await expect(exitReaderLab()).resolves.toBeUndefined()

    expect(requestScope.writes).toEqual([{ name: labCookie, options: { maxAge: 0 }, value: '' }])
  })

  it('refuses lab changes that come from another site', async () => {
    signInOwner()
    requestScope.setHeader('origin', 'https://attacker.example')

    await expect(
      openReaderDirection(form({ destination: 'home', direction: 'night-edition' })),
    ).rejects.toBeInstanceOf(OwnerAccessError)
    await expect(
      switchReaderDirection(form({ direction: 'night-edition' })),
    ).rejects.toBeInstanceOf(OwnerAccessError)
    await expect(exitReaderLab()).rejects.toBeInstanceOf(OwnerAccessError)
    expect(requestScope.writes).toEqual([])
  })

  it('asks a signed-out visitor to sign in, and closes a lab whose owner session ended', async () => {
    requestScope.setCookies({ [labCookie]: 'night-edition' })
    requestScope.setHeader('origin', siteOrigin)

    expect(
      await redirectTarget(
        openReaderDirection(form({ destination: 'home', direction: 'night-edition' })),
      ),
    ).toBe('/owner/sign-in')
    expect(requestScope.writes).toEqual([])

    await expect(switchReaderDirection(form({ direction: 'baseline' }))).resolves.toBeUndefined()
    expect(requestScope.writes).toEqual([{ name: labCookie, options: { maxAge: 0 }, value: '' }])
  })

  it('treats an owner session that cannot be checked as signed out', async () => {
    vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '')
    vi.stubEnv('DATABASE_URL', '')
    requestScope.setCookies({ [labCookie]: 'night-edition', [ownerFixtureCookieName]: 'v1.any' })
    requestScope.setHeader('origin', siteOrigin)

    expect(
      await redirectTarget(
        openReaderDirection(form({ destination: 'home', direction: 'baseline' })),
      ),
    ).toBe('/owner/sign-in')
    expect(requestScope.writes).toEqual([])
  })

  it('refuses directions and destinations that the lab does not offer', async () => {
    signInOwner()

    for (const direction of ['unknown-direction', 'NIGHT-EDITION', '', '../baseline']) {
      await expect(
        openReaderDirection(form({ destination: 'home', direction })),
        direction,
      ).rejects.toThrow('Choose a direction from the Reader Lab.')
      await expect(switchReaderDirection(form({ direction })), direction).rejects.toThrow(
        'Choose a direction from the Reader Lab.',
      )
    }
    await expect(
      openReaderDirection(
        form({ destination: 'https://attacker.example/', direction: 'baseline' }),
      ),
    ).rejects.toThrow('Choose where to open the site.')
    await expect(openReaderDirection(form({ direction: 'baseline' }))).rejects.toThrow(
      'Choose where to open the site.',
    )
    expect(requestScope.writes).toEqual([])
  })
})

describe('Reader Lab page', () => {
  it('lists every direction with its thesis and the ways to open it', async () => {
    await publishStory({
      publishedAt: '2026-09-20T09:00:00.000Z',
      slug: 'newest-story',
      title: 'The newest story',
    })
    signInOwner()

    const markup = await render(ReaderLabPage())

    expect(markup).toMatch(/<h1[^>]*>[^<]+<\/h1>/)
    expect(markup).toContain('Baseline')
    expect(markup).toContain('Night Edition')
    expect(markup).toContain('A stand-in direction that only a signed-in owner may see.')
    expect(markup).toContain('data-reader-direction-card="baseline"')
    expect(markup).toContain('data-reader-direction-card="night-edition"')
    expect(markup.match(/View the site in this direction/g)).toHaveLength(2)
    expect(markup.match(/Open latest story/g)).toHaveLength(2)
    expect(markup).toContain('name="destination" value="latest-story"')
    expect(markup).toContain('name="direction" value="night-edition"')
    expect(markup).toContain('The newest story')
    expect(markup).toContain('What readers see')
    expect(markup).toMatch(/href="\/owner\/stories\/new"[^>]*>Write a new post</)
    expect(markup).toMatch(/href="\/owner"[^>]*>Back to my stories</)
    expect(markup).not.toContain('protected')
    expect(markup).not.toContain('Exit lab')
  })

  it('marks the direction the owner is viewing and offers a way out', async () => {
    signInOwner({ [labCookie]: 'night-edition' })

    const markup = await render(ReaderLabPage())

    expect(markup).toContain('You are viewing the site in')
    expect(markup).toMatch(
      /<li(?=[^>]*data-reader-direction-card="night-edition")(?=[^>]*data-active="true")[^>]*>/,
    )
    expect(markup).not.toMatch(
      /<li(?=[^>]*data-reader-direction-card="baseline")(?=[^>]*data-active)/,
    )
    expect(markup).toContain('Exit lab')
  })

  it('explains that there is no published story to open yet', async () => {
    signInOwner()

    const markup = await render(ReaderLabPage())

    expect(markup).not.toContain('Open latest story')
    expect(markup).toContain('No published story yet')
  })

  it('stays private to the owner', async () => {
    await expect(ReaderLabPage()).rejects.toBeInstanceOf(OwnerAccessError)
  })
})
