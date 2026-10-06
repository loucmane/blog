import { beforeEach, describe, expect, it } from 'vitest'

import { CURRENT_CONTENT_DOCUMENT_VERSION, type ContentNode } from '@/server/content/document'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { InMemoryOriginalObjectStore, MediaOriginalService } from '@/server/content/media'
import type { Clock } from '@/server/content/ports'
import { SectionService } from '@/server/content/sections'
import { ContentService } from '@/server/content/service'

import {
  homeRecentStoryLimit,
  readArticleView,
  readHomeView,
  readPublicMediaIds,
  readSectionView,
  type ReaderSource,
} from './read-model'

const pngPixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=',
  'base64',
)

let repository: InMemoryContentRepository
let source: ReaderSource
let sections: SectionService
let day = 0

function clockAt(iso: string): Clock {
  return { now: () => new Date(iso) }
}

function nextDay(): string {
  day += 1
  return new Date(Date.UTC(2026, 8, day, 7)).toISOString()
}

function documentFor(articleId: string, title: string, content: ContentNode[]) {
  return {
    articleId,
    document: { content, type: 'doc' },
    migrationProvenance: [],
    schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
    title,
  }
}

function paragraph(value: string): ContentNode {
  return { content: [{ text: value, type: 'text' }], type: 'paragraph' }
}

function image(mediaId: string): ContentNode {
  return {
    attrs: {
      alt: `Alt for ${mediaId}`,
      caption: '',
      credit: { name: 'Studio', url: null },
      focalPoint: { x: 0.5, y: 0.5 },
      mediaId,
    },
    type: 'mediaImage',
  }
}

async function publish(input: {
  readonly content?: ContentNode[]
  readonly dek?: string
  readonly publishedAt?: string
  readonly section?: string
  readonly slug: string
  readonly title?: string
}) {
  const publishedAt = input.publishedAt ?? nextDay()
  const service = new ContentService(repository, clockAt(publishedAt))
  const articleId = `article-${input.slug}`
  const title = input.title ?? `Title for ${input.slug}`
  const created = await service.createArticle({
    dek: input.dek ?? `Summary for ${input.slug}`,
    document: documentFor(articleId, title, input.content ?? [paragraph(`Body of ${input.slug}`)]),
    id: articleId,
    idempotencyKey: `create-${input.slug}`,
    slug: input.slug,
    title,
  })
  if (input.section) {
    const section = await sections.ensureSection({ name: input.section, slug: input.section })
    await sections.assignSection({ articleId, sectionId: section.id })
  }
  const published = await service.publish({
    articleId,
    expectedVersion: created.article.version,
    idempotencyKey: `publish-${input.slug}`,
    revisionId: created.revision.id,
  })
  return { ...published, service }
}

beforeEach(() => {
  day = 0
  repository = new InMemoryContentRepository()
  source = { mediaAvailable: true, repository }
  sections = new SectionService(repository, clockAt('2026-09-01T00:00:00.000Z'))
})

describe('reader read model', () => {
  it('builds an empty home view when nothing is published', async () => {
    await new ContentService(repository).createArticle({
      dek: 'Draft only',
      document: documentFor('article-draft', 'Draft', [paragraph('Not yet')]),
      id: 'article-draft',
      idempotencyKey: 'create-draft',
      slug: 'draft-only',
      title: 'Draft',
    })

    expect(await readHomeView(source)).toEqual({
      lead: null,
      navigation: { sections: [] },
      recent: [],
    })
  })

  it('leads with the newest story and lists the next ones with their sections', async () => {
    await publish({ section: 'craft', slug: 'oldest' })
    await publish({ section: 'interiors', slug: 'middle' })
    await publish({ slug: 'newest', title: 'The newest story' })

    const home = await readHomeView(source)

    expect(home.lead).toMatchObject({
      dek: 'Summary for newest',
      href: '/stories/newest',
      image: null,
      publishedAt: '2026-09-03T07:00:00.000Z',
      readingMinutes: 1,
      section: null,
      slug: 'newest',
      title: 'The newest story',
    })
    expect(home.recent.map(({ slug }) => slug)).toEqual(['middle', 'oldest'])
    expect(home.recent[0]?.section).toEqual({
      href: '/sections/interiors',
      name: 'interiors',
      slug: 'interiors',
    })
    expect(home.navigation.sections.map(({ slug }) => slug)).toEqual(['craft', 'interiors'])
  })

  it('limits the recent list after the lead story', async () => {
    for (let index = 0; index < homeRecentStoryLimit + 3; index += 1) {
      await publish({ slug: `story-${index}` })
    }

    const home = await readHomeView(source)

    expect(home.lead?.slug).toBe(`story-${homeRecentStoryLimit + 2}`)
    expect(home.recent).toHaveLength(homeRecentStoryLimit)
  })

  it('shows the published revision, never newer draft fields, and the republished revision', async () => {
    const { article, service } = await publish({
      dek: 'Published summary',
      slug: 'revisions',
      title: 'Published title',
    })
    const draft = await service.saveDraft({
      articleId: article.id,
      dek: 'Draft summary',
      document: documentFor(article.id, 'Draft title', [paragraph('Draft body')]),
      expectedVersion: article.version,
      idempotencyKey: 'save-revisions',
      title: 'Draft title',
    })

    const beforeRepublish = await readArticleView(source, 'revisions')
    expect(beforeRepublish).toMatchObject({ dek: 'Published summary', title: 'Published title' })
    expect(JSON.stringify(beforeRepublish)).not.toContain('Draft')

    await service.publish({
      articleId: article.id,
      expectedVersion: draft.article.version,
      idempotencyKey: 'republish-revisions',
      revisionId: draft.revision.id,
    })

    const republished = await readArticleView(source, 'revisions')
    expect(republished).toMatchObject({ dek: 'Draft summary', title: 'Draft title' })
    expect(republished?.body).toEqual([
      { content: [{ kind: 'text', marks: [], text: 'Draft body' }], kind: 'paragraph' },
    ])
  })

  it('hides unpublished, deleted, and never-published stories', async () => {
    const unpublished = await publish({ slug: 'unpublished' })
    const deleted = await publish({ slug: 'deleted' })
    await unpublished.service.unpublish({
      articleId: unpublished.article.id,
      expectedVersion: unpublished.article.version,
      idempotencyKey: 'unpublish',
      reason: 'Corrections pending',
    })
    await deleted.service.softDelete({
      articleId: deleted.article.id,
      expectedVersion: deleted.article.version,
      idempotencyKey: 'delete',
    })

    expect(await readArticleView(source, 'unpublished')).toBeNull()
    expect(await readArticleView(source, 'deleted')).toBeNull()
    expect(await readArticleView(source, 'missing')).toBeNull()
    expect((await readHomeView(source)).lead).toBeNull()
  })

  it('keeps a published story visible while a newer revision is scheduled', async () => {
    const { article, service } = await publish({ slug: 'scheduled', title: 'Live title' })
    const draft = await service.saveDraft({
      articleId: article.id,
      document: documentFor(article.id, 'Scheduled title', [paragraph('Scheduled body')]),
      expectedVersion: article.version,
      idempotencyKey: 'save-scheduled',
      title: 'Scheduled title',
    })
    await new ContentService(repository, clockAt('2026-09-20T00:00:00.000Z')).schedulePublication({
      articleId: article.id,
      expectedVersion: draft.article.version,
      idempotencyKey: 'schedule',
      revisionId: draft.revision.id,
      runAt: '2026-12-01T09:00:00.000Z',
      timeZone: 'Europe/Stockholm',
    })

    expect(await readArticleView(source, 'scheduled')).toMatchObject({ title: 'Live title' })
  })

  it('builds article views with a lead image, body, section, and navigation', async () => {
    const media = new MediaOriginalService(repository, new InMemoryOriginalObjectStore())
    await media.store({
      alt: 'Stored alt',
      body: pngPixel,
      contentType: 'image/png',
      creditName: 'Studio',
      height: 600,
      id: 'media-lead',
      width: 900,
    })
    await publish({
      content: [image('media-lead'), paragraph('The body text.')],
      section: 'architecture',
      slug: 'with-image',
    })

    const article = await readArticleView(source, 'with-image')

    expect(article).toMatchObject({
      authors: [],
      body: [{ kind: 'paragraph' }],
      hero: {
        contentType: 'image/png',
        height: 600,
        mediaId: 'media-lead',
        src: '/api/media/media-lead',
        width: 900,
      },
      href: '/stories/with-image',
      navigation: { sections: [{ slug: 'architecture' }] },
      section: { name: 'architecture', slug: 'architecture' },
    })
    expect((await readHomeView(source)).lead?.image).toMatchObject({ mediaId: 'media-lead' })
    expect(await readPublicMediaIds(source)).toEqual(['media-lead'])
    expect(
      (await readArticleView({ mediaAvailable: false, repository }, 'with-image'))?.hero,
    ).toBeNull()
  })

  it('lists a section’s visible stories and returns null for unknown sections', async () => {
    await publish({ section: 'interiors', slug: 'room-one' })
    await publish({ section: 'interiors', slug: 'room-two' })
    await publish({ section: 'craft', slug: 'chair' })
    const hidden = await publish({ section: 'interiors', slug: 'hidden' })
    await hidden.service.unpublish({
      articleId: hidden.article.id,
      expectedVersion: hidden.article.version,
      idempotencyKey: 'unpublish-hidden',
      reason: 'Not ready',
    })
    await sections.ensureSection({ name: 'Empty', slug: 'empty' })

    const interiors = await readSectionView(source, 'interiors')

    expect(interiors).toMatchObject({
      description: null,
      href: '/sections/interiors',
      name: 'interiors',
      slug: 'interiors',
    })
    expect(interiors?.stories.map(({ slug }) => slug)).toEqual(['room-two', 'room-one'])
    expect(interiors?.navigation.sections.map(({ slug }) => slug)).toEqual(['craft', 'interiors'])
    expect(await readSectionView(source, 'empty')).toMatchObject({ stories: [] })
    expect(await readSectionView(source, 'unknown')).toBeNull()
  })

  it('uses the lowest-positioned section as a story’s primary section', async () => {
    const { article } = await publish({ section: 'interiors', slug: 'two-sections' })
    const craft = await sections.ensureSection({ name: 'Craft', slug: 'craft' })
    await sections.assignSection({ articleId: article.id, sectionId: craft.id })

    expect((await readArticleView(source, 'two-sections'))?.section?.slug).toBe('interiors')
    expect((await readSectionView(source, 'craft'))?.stories.map(({ slug }) => slug)).toEqual([
      'two-sections',
    ])
  })
})
