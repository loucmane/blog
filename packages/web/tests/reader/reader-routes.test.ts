import { createHash } from 'node:crypto'

import { revalidateTag } from 'next/cache'
import { NextRequest } from 'next/server'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { POST as seedLab } from '@/app/api/internal/lab-seed/route'
import { GET as getMedia } from '@/app/api/media/[id]/route'
import { POST as applyStoryAction } from '@/app/api/owner/stories/[id]/actions/route'
import { POST as revalidate } from '@/app/api/revalidate/route'
import HomePage from '@/app/page'
import SectionPage, { generateMetadata as sectionMetadata } from '@/app/sections/[slug]/page'
import StoryPage, { generateMetadata as storyMetadata } from '@/app/stories/[slug]/page'
import { CURRENT_CONTENT_DOCUMENT_VERSION, type ContentNode } from '@/server/content/document'
import { SectionService } from '@/server/content/sections'
import { getOwnerRuntime } from '@/server/owner/runtime'
import { createOwnerFixtureSession, ownerFixtureCookieName } from '@/server/owner/session'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: <T>(load: T) => load,
}))

vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  connection: vi.fn(async () => undefined),
}))

const siteOrigin = 'http://127.0.0.1:3100'
const labSeedToken = 'reader-lab-seed-token-with-more-than-32-bytes'
const revalidationSecret = 'reader-revalidation-secret-with-more-than-32-bytes'
const runtimeKey = Symbol.for('magazine.owner-runtime')
const pngPixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=',
  'base64',
)
const pngPixelEntityTag = `"${createHash('sha256').update(pngPixel).digest('hex')}"`

function resetOwnerRuntime() {
  delete (globalThis as { [runtimeKey]?: unknown })[runtimeKey]
}

beforeEach(() => {
  vi.stubEnv('BETTER_AUTH_URL', siteOrigin)
  vi.stubEnv('MAGAZINE_OWNER_EMAIL', 'owner@example.test')
  vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '1')
  vi.stubEnv('MAGAZINE_OWNER_TEST_TOKEN', 'reader-route-test-token-with-more-than-32-bytes')
  vi.stubEnv('MAGAZINE_RUNTIME_SITE_URL', siteOrigin)
  resetOwnerRuntime()
})

afterEach(() => {
  resetOwnerRuntime()
  vi.unstubAllEnvs()
})

function slugParams(slug: string) {
  return { params: Promise.resolve({ slug }) }
}

async function render(page: Promise<ReactElement> | ReactElement): Promise<string> {
  return renderToStaticMarkup(await page)
}

async function expectNotFound(page: Promise<unknown>) {
  await expect(page).rejects.toMatchObject({ digest: 'NEXT_HTTP_ERROR_FALLBACK;404' })
}

function count(markup: string, pattern: RegExp): number {
  return markup.match(pattern)?.length ?? 0
}

function storyDocument(articleId: string, title: string, content: ContentNode[]) {
  return {
    articleId,
    document: { content, type: 'doc' },
    migrationProvenance: [],
    schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
    title,
  }
}

function paragraph(text: string): ContentNode {
  return { content: [{ text, type: 'text' }], type: 'paragraph' }
}

async function createStory(input: {
  readonly content?: ContentNode[]
  readonly dek: string
  readonly slug: string
  readonly text: string
  readonly title: string
}) {
  const articleId = `article-${input.slug}`
  return getOwnerRuntime().content.createArticle({
    dek: input.dek,
    document: storyDocument(articleId, input.title, input.content ?? [paragraph(input.text)]),
    id: articleId,
    idempotencyKey: `create-${input.slug}`,
    slug: input.slug,
    title: input.title,
  })
}

async function publishStory(input: Parameters<typeof createStory>[0] & { section?: string }) {
  const { content, repository } = getOwnerRuntime()
  const created = await createStory(input)
  if (input.section) {
    const sections = new SectionService(repository)
    const section = await sections.ensureSection({ name: 'Interiors', slug: input.section })
    await sections.assignSection({ articleId: created.article.id, sectionId: section.id })
  }
  return content.publish({
    articleId: created.article.id,
    expectedVersion: created.article.version,
    idempotencyKey: `publish-${input.slug}`,
    revisionId: created.revision.id,
  })
}

const winterLight = {
  dek: 'How a north-facing room learns to hold the low sun of December.',
  slug: 'quiet-architecture-of-winter-light',
  text: 'By three in the afternoon the light is already leaving, and the room changes its mind.',
  title: 'The quiet architecture of winter light',
}

/** Stores `media-public` (the story's lead image) and `media-private` (in no story). */
async function publishStoryWithImage() {
  const media = getOwnerRuntime().media
  if (!media) throw new Error('The test runtime should store media in memory.')
  for (const id of ['media-public', 'media-private']) {
    await media.store({
      alt: 'A pixel',
      body: pngPixel,
      contentType: 'image/png',
      creditName: 'Studio',
      height: 1,
      id,
      width: 1,
    })
  }
  return publishStory({
    ...winterLight,
    content: [
      {
        attrs: {
          alt: 'A pixel of winter light',
          caption: 'Lead image',
          credit: { name: 'Studio', url: null },
          focalPoint: { x: 0.5, y: 0.5 },
          mediaId: 'media-public',
        },
        type: 'mediaImage',
      },
      paragraph(winterLight.text),
    ],
  })
}

function requestMedia(id: string, headers?: Record<string, string>) {
  return getMedia(new Request(`${siteOrigin}/api/media/${id}`, { headers }), {
    params: Promise.resolve({ id }),
  })
}

describe('public reader routes', () => {
  it('shows a story published through the content service on the home page', async () => {
    await publishStory(winterLight)

    const markup = await render(HomePage())

    expect(markup).toContain('The quiet architecture of winter light')
    expect(markup).toContain('href="/stories/quiet-architecture-of-winter-light"')
  })

  it('publishes to home, article, and section pages, hides unpublished stories, and shows republished revisions', async () => {
    const published = await publishStory({ ...winterLight, section: 'interiors' })
    const { content } = getOwnerRuntime()

    const home = await render(HomePage())
    const article = await render(StoryPage(slugParams(winterLight.slug)))
    const section = await render(SectionPage(slugParams('interiors')))
    const metadata = await storyMetadata(slugParams(winterLight.slug))

    expect(home).toContain('href="/sections/interiors"')
    expect(article).toMatch(/<h1[^>]*>The quiet architecture of winter light<\/h1>/)
    expect(article).toContain(winterLight.text)
    expect(article).toContain(winterLight.dek)
    expect(article).toMatch(/<time dateTime="[^"]+">/)
    expect(article).toMatch(/data-reader-cache-generation="[0-9a-f-]{36}"/)
    expect(section).toContain('href="/stories/quiet-architecture-of-winter-light"')
    expect(metadata).toMatchObject({
      alternates: { canonical: '/stories/quiet-architecture-of-winter-light' },
      description: winterLight.dek,
      openGraph: { publishedTime: published.article.publishedAt, type: 'article' },
      title: winterLight.title,
    })
    expect(await sectionMetadata(slugParams('interiors'))).toMatchObject({ title: 'Interiors' })

    const unpublished = await content.unpublish({
      articleId: published.article.id,
      expectedVersion: published.article.version,
      idempotencyKey: 'unpublish-winter-light',
      reason: 'Holding for corrections',
    })

    await expectNotFound(StoryPage(slugParams(winterLight.slug)))
    expect(await render(HomePage())).not.toContain(winterLight.title)
    expect(await render(SectionPage(slugParams('interiors')))).not.toContain(winterLight.title)

    const edited = await content.saveDraft({
      articleId: published.article.id,
      dek: winterLight.dek,
      document: storyDocument(published.article.id, 'Winter light, revisited', [
        paragraph('The revised story now begins with the long blue hour after sunset.'),
      ]),
      expectedVersion: unpublished.version,
      idempotencyKey: 'edit-winter-light',
      title: 'Winter light, revisited',
    })
    await content.publish({
      articleId: published.article.id,
      expectedVersion: edited.article.version,
      idempotencyKey: 'republish-winter-light',
      revisionId: edited.revision.id,
    })

    const republished = await render(StoryPage(slugParams(winterLight.slug)))
    expect(republished).toContain('Winter light, revisited')
    expect(republished).toContain('the long blue hour after sunset')
    expect(republished).not.toContain(winterLight.text)
  })

  it('keeps one heading, one main landmark, and the theme menu first on the home page', async () => {
    await publishStory({ ...winterLight, section: 'interiors' })
    await publishStory({
      dek: 'Six objects and an empty third of a shelf.',
      slug: 'a-single-shelf-rearranged',
      text: 'Take everything off the shelf and put back only six objects.',
      title: 'A single shelf, rearranged',
    })

    const home = await render(HomePage())

    expect(count(home, /<h1[\s>]/g)).toBe(1)
    expect(count(home, /<main[\s>]/g)).toBe(1)
    expect(home).toContain('aria-label="Sections"')
    expect(home.indexOf('aria-label="Choose color theme"')).toBeLessThan(home.indexOf('<a '))
    expect(home).toContain('Recent stories')
  })

  it('renders an honest empty state when nothing is published', async () => {
    await createStory({ ...winterLight, slug: 'only-a-draft' })

    const home = await render(HomePage())

    expect(home).toContain('No stories yet')
    expect(home).toContain('Nothing has been published so far.')
    expect(home).not.toContain(winterLight.title)
    expect(count(home, /<h1[\s>]/g)).toBe(1)
  })

  it('says stories are unavailable when no content store is configured', async () => {
    vi.stubEnv('MAGAZINE_OWNER_TEST_MODE', '')
    vi.stubEnv('DATABASE_URL', '')

    expect(await render(HomePage())).toContain('Stories are unavailable')
    await expectNotFound(StoryPage(slugParams(winterLight.slug)))
    await expectNotFound(SectionPage(slugParams('interiors')))
  })

  it('returns not found for malformed, oversized, and unknown slugs', async () => {
    await publishStory({ ...winterLight, section: 'interiors' })

    for (const slug of ['../private', 'a'.repeat(181), 'Upper-Case', 'unknown-story']) {
      await expectNotFound(StoryPage(slugParams(slug)))
    }
    await expectNotFound(SectionPage(slugParams('unknown-section')))
    expect(await storyMetadata(slugParams('unknown-story'))).toEqual({})
  })

  it('reflects owner publishing on the next request and expires cached reader views', async () => {
    const created = await createStory({
      dek: 'A complete summary that prepares readers for the story.',
      slug: 'owner-published-story',
      text: 'This owner story has enough body text to pass the publication readiness check.',
      title: 'Owner published story',
    })

    const response = await applyStoryAction(
      new Request(`${siteOrigin}/api/owner/stories/${created.article.id}/actions`, {
        body: JSON.stringify({
          action: 'publish',
          expectedVersion: created.article.version,
          idempotencyKey: 'owner-publish-story',
          revisionId: created.revision.id,
        }),
        headers: {
          'content-type': 'application/json',
          cookie: `${ownerFixtureCookieName}=${createOwnerFixtureSession()}`,
          origin: siteOrigin,
        },
        method: 'POST',
      }),
      { params: Promise.resolve({ id: created.article.id }) },
    )

    expect(response.status).toBe(200)
    expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith('reader', { expire: 0 })
    expect(await render(HomePage())).toContain('Owner published story')
  })

  it('serves media only while a visible revision references it', async () => {
    const published = await publishStoryWithImage()

    const servedImage = await requestMedia('media-public')
    expect(servedImage.status).toBe(200)
    expect(servedImage.headers.get('content-type')).toBe('image/png')
    expect(servedImage.headers.get('x-content-type-options')).toBe('nosniff')
    expect(Buffer.from(await servedImage.arrayBuffer())).toEqual(pngPixel)
    expect((await requestMedia('media-private')).status).toBe(404)
    expect((await requestMedia('..%2Fmedia-public')).status).toBe(404)
    expect(await render(StoryPage(slugParams(winterLight.slug)))).toContain(
      'alt="A pixel of winter light"',
    )

    await getOwnerRuntime().content.unpublish({
      articleId: published.article.id,
      expectedVersion: published.article.version,
      idempotencyKey: 'unpublish-media-story',
      reason: 'Image rights expired',
    })
    expect((await requestMedia('media-public')).status).toBe(404)
  })

  it('lets caches keep public media only if they revalidate it against a strong ETag', async () => {
    await publishStoryWithImage()

    const response = await requestMedia('media-public')

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('public, no-cache')
    expect(response.headers.get('etag')).toBe(pngPixelEntityTag)
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('confirms a cached image with 304 only while a visible revision still references it', async () => {
    const published = await publishStoryWithImage()
    const objects = getOwnerRuntime().objects
    if (!objects) throw new Error('The test runtime should store media in memory.')
    const readOriginal = vi.spyOn(objects, 'getOriginal')

    const notModified = await requestMedia('media-public', { 'if-none-match': pngPixelEntityTag })

    expect(notModified.status).toBe(304)
    expect(await notModified.text()).toBe('')
    expect(notModified.headers.get('cache-control')).toBe('public, no-cache')
    expect(notModified.headers.get('etag')).toBe(pngPixelEntityTag)
    expect(notModified.headers.get('x-content-type-options')).toBe('nosniff')
    expect(readOriginal).not.toHaveBeenCalled()
    const listed = await requestMedia('media-public', {
      'if-none-match': `"an-older-image", W/${pngPixelEntityTag}`,
    })
    expect(listed.status).toBe(304)
    const changed = await requestMedia('media-public', { 'if-none-match': '"an-older-image"' })
    expect(changed.status).toBe(200)
    expect(Buffer.from(await changed.arrayBuffer())).toEqual(pngPixel)

    await getOwnerRuntime().content.unpublish({
      articleId: published.article.id,
      expectedVersion: published.article.version,
      idempotencyKey: 'unpublish-cached-media-story',
      reason: 'Image rights expired',
    })

    for (const condition of [pngPixelEntityTag, '*']) {
      const revoked = await requestMedia('media-public', { 'if-none-match': condition })
      expect(revoked.status, condition).toBe(404)
      expect(revoked.headers.get('cache-control'), condition).toBe('no-store')
      expect(revoked.headers.get('etag'), condition).toBeNull()
    }
  })

  it('answers hidden, unknown, and malformed media ids with the same uncacheable not-found', async () => {
    await publishStoryWithImage()

    for (const id of ['media-private', 'media-unknown', '..%2Fmedia-public']) {
      for (const condition of [null, pngPixelEntityTag, `W/${pngPixelEntityTag}`, '*']) {
        const label = `${id} with ${condition ?? 'no condition'}`
        const response = await requestMedia(
          id,
          condition === null ? undefined : { 'if-none-match': condition },
        )
        expect(response.status, label).toBe(404)
        expect(response.headers.get('cache-control'), label).toBe('no-store')
        expect(response.headers.get('etag'), label).toBeNull()
        await expect(response.json(), label).resolves.toEqual({
          error: 'That image could not be found.',
        })
      }
    }
  })

  it('renders reader images from the revocable media route, not the image optimizer', async () => {
    await publishStoryWithImage()

    for (const markup of [
      await render(HomePage()),
      await render(StoryPage(slugParams(winterLight.slug))),
    ]) {
      expect(markup).toContain('src="/api/media/media-public"')
      expect(markup).not.toContain('/_next/image')
    }
  })

  it('expires reader caches through the revalidation boundary for known stories only', async () => {
    vi.stubEnv('MAGAZINE_REVALIDATION_SECRET', revalidationSecret)
    await publishStory(winterLight)
    const request = (slug: string, token = revalidationSecret) =>
      revalidate(
        new NextRequest(`${siteOrigin}/api/revalidate`, {
          body: JSON.stringify({ slug }),
          headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          method: 'POST',
        }),
      )

    expect((await request(winterLight.slug, 'wrong-revalidation-token-with-32-bytes')).status).toBe(
      401,
    )
    expect((await request('unknown-story')).status).toBe(404)
    expect((await request('../private')).status).toBe(404)
    const accepted = await request(winterLight.slug)

    expect(accepted.status).toBe(200)
    await expect(accepted.json()).resolves.toEqual({ revalidated: true, slug: winterLight.slug })
    expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(`story:${winterLight.slug}`, {
      expire: 0,
    })
    expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith('reader', { expire: 0 })
  })

  it('seeds the Reader Lab through the guarded route and never in production', async () => {
    const request = (token: string) =>
      seedLab(
        new Request(`${siteOrigin}/api/internal/lab-seed`, {
          headers: { authorization: `Bearer ${token}` },
          method: 'POST',
        }),
      )

    expect((await request(labSeedToken)).status).toBe(404)
    vi.stubEnv('MAGAZINE_LAB_SEED_TOKEN', labSeedToken)
    expect((await request('wrong-lab-seed-token-with-more-than-32-bytes')).status).toBe(404)
    vi.stubEnv('NODE_ENV', 'production')
    expect((await request(labSeedToken)).status).toBe(404)
    vi.stubEnv('NODE_ENV', 'test')

    const seeded = await request(labSeedToken)

    expect(seeded.status).toBe(200)
    expect(seeded.headers.get('cache-control')).toBe('private, no-store')
    expect((await seeded.json()).stories.created).toHaveLength(8)
    expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith('reader', { expire: 0 })
    expect(await render(HomePage())).toContain('The quiet architecture of winter light')
    expect(await render(SectionPage(slugParams('architecture')))).toContain(
      'Three cabins and the case for building less',
    )
  })
})
