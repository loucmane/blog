// @vitest-environment jsdom

import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import nextConfig from '../../next.config'
import ComparePage, { dynamic, metadata } from '@/app/owner/(workspace)/reader-lab/compare/page'
import { readerDirections } from '@/reader-directions/registry'
import { openComparedDirection } from './compare-actions'
import { loadComparePage } from './compare-data'
import { CompareView } from './compare-view'
import { CURRENT_CONTENT_DOCUMENT_VERSION } from '@/server/content/document'
import { SectionService } from '@/server/content/sections'
import { getOwnerRuntime } from '@/server/owner/runtime'
import { createOwnerFixtureSession, ownerFixtureCookieName } from '@/server/owner/session'
import { requestScope } from '../../tests/support/request-scope'

vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), unstable_cache: <T,>(load: T) => load }))
vi.mock('next/headers', async () => (await import('../../tests/support/request-scope')).nextHeaders)
vi.mock('@/reader-directions/registry', async (importOriginal) => {
  const { readerDirections: actual } = await importOriginal<{
    readerDirections: typeof readerDirections
  }>()
  const { createReaderDirectionRegistry, defineReaderDirection } =
    await import('@/reader-directions/contract')
  return {
    readerDirections: createReaderDirectionRegistry({
      defaultId: actual.defaultDirection.id,
      directions: [
        ...actual.directions,
        defineReaderDirection({
          ...actual.defaultDirection,
          id: 'future-direction',
          name: 'Future Direction',
        }),
      ],
    }),
  }
})

const origin = 'http://127.0.0.1:3100'
const runtimeKey = Symbol.for('magazine.owner-runtime')
const reset = () => {
  delete (globalThis as { [runtimeKey]?: unknown })[runtimeKey]
  requestScope.reset()
}
beforeEach(() => {
  vi.stubEnv('BETTER_AUTH_URL', origin)
  vi.stubEnv('MAGAZINE_RUNTIME_SITE_URL', origin)
  vi.stubEnv('MAGAZINE_OWNER_EMAIL', 'owner@example.test')
  vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '1')
  vi.stubEnv('MAGAZINE_OWNER_TEST_TOKEN', 'compare-fixture-token-with-more-than-32-bytes')
  reset()
})
afterEach(() => {
  reset()
  vi.unstubAllEnvs()
})

function signIn() {
  requestScope.setCookies({ [ownerFixtureCookieName]: createOwnerFixtureSession() })
  requestScope.setHeader('origin', origin)
}
async function story(slug: string, published: boolean) {
  const { content, repository } = getOwnerRuntime()
  const created = await content.createArticle({
    id: slug,
    slug,
    title: `Title ${slug}`,
    dek: 'Published comparison fixture.',
    idempotencyKey: `create-${slug}`,
    document: {
      articleId: slug,
      title: `Title ${slug}`,
      schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
      migrationProvenance: [],
      document: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'The same real story.' }] }],
      },
    },
  })
  const sections = new SectionService(repository)
  const section = await sections.ensureSection({ name: 'Interiors', slug: 'interiors' })
  await sections.assignSection({ articleId: slug, sectionId: section.id })
  if (published)
    await content.publish({
      articleId: slug,
      expectedVersion: created.article.version,
      idempotencyKey: `publish-${slug}`,
      revisionId: created.revision.id,
    })
}
const page = (path = '/') => ComparePage({ searchParams: Promise.resolve({ page: path }) })

describe('owner comparison boundary', () => {
  it('requires the existing owner guard even if a lab cookie is supplied', async () => {
    requestScope.setCookies({
      reader_lab_direction: readerDirections.directions[1]?.id ?? 'baseline',
    })
    await expect(page()).rejects.toThrow('Sign in')
    requestScope.setCookies({ [ownerFixtureCookieName]: 'v1.forged' })
    await expect(page()).rejects.toThrow('Sign in')
  })
  it('is dynamic, noindex and covered by private no-store owner headers', async () => {
    expect(dynamic).toBe('force-dynamic')
    expect(metadata.robots).toMatchObject({ index: false, follow: false })
    const rules = await nextConfig.headers?.()
    expect(rules?.find((rule) => rule.source === '/owner/:path*')?.headers).toEqual(
      expect.arrayContaining([
        { key: 'Cache-Control', value: 'private, no-store' },
        { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      ]),
    )
  })
  it('lists every registered direction without rendering direction fonts in the parent document', async () => {
    signIn()
    await story('first-story', true)
    const markup = renderToStaticMarkup(await page('/stories/first-story'))
    for (const direction of readerDirections.directions) {
      expect(markup).toContain(`data-compare-direction="${direction.id}"`)
      expect(markup).toContain(direction.name)
    }
    expect(markup.match(/<iframe/g)).toHaveLength(readerDirections.directions.length)
    expect(markup).not.toMatch(/@font-face|reader-directions\/.*\.woff2/)
    expect(markup).toContain('No published author pages yet')
    expect(markup).toContain('No published topic pages yet')
    expect(markup).not.toContain('/owner/stories/new')
    expect(requestScope.writes).toEqual([])
  })
  it('uses published views only and reports missing pages without substituting a different story', async () => {
    await story('draft-only', false)
    await story('visible-story', true)
    expect(await loadComparePage('/stories/draft-only')).toMatchObject({ status: 'missing' })
    expect(await loadComparePage('/stories/visible-story')).toMatchObject({
      status: 'ready',
      page: { kind: 'story', view: { title: 'Title visible-story' } },
    })
    expect(await loadComparePage('/sections/interiors')).toMatchObject({
      status: 'ready',
      page: { kind: 'section' },
    })
    expect(await loadComparePage('/authors/missing')).toMatchObject({ status: 'missing' })
    expect(await loadComparePage('/topics/missing')).toMatchObject({ status: 'missing' })
  })
  it('projects the same published story through every real direction', async () => {
    await story('visible-story', true)
    const selected = await loadComparePage('/stories/visible-story')
    if (selected.status !== 'ready') throw new Error('Expected a published page')
    for (const direction of readerDirections.directions) {
      const markup = renderToStaticMarkup(
        <CompareView direction={direction} page={selected.page} />,
      )
      expect(markup).toContain('Title visible-story')
      expect(markup).toContain('The same real story.')
      expect(markup).toContain(`data-reader-direction="${direction.id}"`)
      expect(markup).not.toContain('data-reader-lab-bar')
    }
  })
  it('compares real author and topic views and offers their published links', async () => {
    signIn()
    await story('credited-story', true)
    const { repository } = getOwnerRuntime()
    await repository.transaction(async (transaction) => {
      const time = '2026-10-19T12:00:00.000Z'
      await transaction.saveAuthor({
        id: 'author-one',
        slug: 'author-one',
        displayName: 'Test Author',
        bio: 'A biography.',
        createdAt: time,
        updatedAt: time,
      })
      await transaction.setArticleAuthors('credited-story', ['author-one'])
      await transaction.saveTaxonomyTerm({
        id: 'topic-one',
        slug: 'topic-one',
        name: 'Test Topic',
        kind: 'tag',
        createdAt: time,
        updatedAt: time,
      })
      await transaction.saveArticleTaxonomy({
        articleId: 'credited-story',
        taxonomyId: 'topic-one',
        position: 1,
      })
    })
    expect(await loadComparePage('/authors/author-one')).toMatchObject({
      status: 'ready',
      page: { kind: 'author', view: { name: 'Test Author' } },
    })
    expect(await loadComparePage('/topics/topic-one')).toMatchObject({
      status: 'ready',
      page: { kind: 'topic', view: { name: 'Test Topic' } },
    })
    const markup = renderToStaticMarkup(await page('/stories/credited-story'))
    expect(markup).toContain('value="/authors/author-one"')
    expect(markup).toContain('value="/topics/topic-one"')
  })
  it('renders a clear unavailable state when the reader store is not configured', async () => {
    vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '')
    vi.stubEnv('DATABASE_URL', '')
    expect(await loadComparePage('/')).toEqual({ status: 'unavailable' })
  })
  it.each([
    'https://example.test',
    '//example.test',
    '/owner',
    '/stories/../owner',
    '/stories/ok?preview=1',
    '/stories/%2e%2e',
    '/stories/a%2Fb',
    '/\\example.test',
    '/stories/UPPER',
    '/stories/ok/',
    '/stories/ok#fragment',
  ])('rejects arbitrary destinations: %s', async (path) => {
    expect(await loadComparePage(path)).toMatchObject({ status: 'invalid' })
  })
  it('rejects a repeated page value', async () => {
    expect(await loadComparePage(['/', '/sections/ok'])).toMatchObject({ status: 'invalid' })
  })
  it('opens the exact selected published page using the existing lab cookie', async () => {
    signIn()
    await story('selected-story', true)
    const data = new FormData()
    data.set('page', '/stories/selected-story')
    data.set('direction', readerDirections.directions[1]?.id ?? 'baseline')
    await expect(openComparedDirection(data)).rejects.toMatchObject({
      digest: expect.stringContaining(';/stories/selected-story;'),
    })
    expect(requestScope.writes).toEqual([
      expect.objectContaining({
        name: 'reader_lab_direction',
        value: readerDirections.directions[1]?.id ?? 'baseline',
      }),
    ])
  })
  it('refuses an anonymous or cross-origin full-page request without changing the lab cookie', async () => {
    const data = new FormData()
    data.set('page', '/')
    data.set('direction', readerDirections.defaultDirection.id)
    await expect(openComparedDirection(data)).rejects.toThrow('Sign in')
    requestScope.setHeader('origin', origin)
    await expect(openComparedDirection(data)).rejects.toMatchObject({
      digest: expect.stringContaining(';/owner/sign-in;'),
    })
    signIn()
    requestScope.setHeader('origin', 'https://example.test')
    await expect(openComparedDirection(data)).rejects.toThrow('Sign in')
    expect(requestScope.writes).toEqual([])
  })
})
