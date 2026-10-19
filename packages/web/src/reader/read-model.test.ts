import { beforeEach, describe, expect, it } from 'vitest'

import { CURRENT_CONTENT_DOCUMENT_VERSION, type ContentNode } from '@/server/content/document'
import type { AuthorProfile, TaxonomyTerm } from '@/server/content/domain'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { InMemoryOriginalObjectStore, MediaOriginalService } from '@/server/content/media'
import type { Clock } from '@/server/content/ports'
import { SectionService } from '@/server/content/sections'
import { ContentService } from '@/server/content/service'

import {
  homeRecentStoryLimit,
  readArticleView,
  readAuthorView,
  readHomeView,
  readPublicMediaIds,
  readSectionView,
  readTopicView,
  relatedStoryLimit,
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

const termTime = '2026-09-01T00:00:00.000Z'

async function createDraft(slug: string) {
  const articleId = `article-${slug}`
  await new ContentService(repository, clockAt(termTime)).createArticle({
    dek: `Summary for ${slug}`,
    document: documentFor(articleId, `Title for ${slug}`, [paragraph(`Body of ${slug}`)]),
    id: articleId,
    idempotencyKey: `create-${slug}`,
    slug,
    title: `Title for ${slug}`,
  })
  return articleId
}

function authorProfile(slug: string, displayName: string, bio: string): AuthorProfile {
  return { bio, createdAt: termTime, displayName, id: `author-${slug}`, slug, updatedAt: termTime }
}

const alpha = authorProfile('alpha', 'Alpha Writer', 'Alpha Writer writes about rooms.')
const bravo = authorProfile('bravo', 'Bravo Writer', '   ')

async function saveAuthors(...profiles: AuthorProfile[]) {
  await repository.transaction(async (transaction) => {
    for (const profile of profiles) await transaction.saveAuthor(profile)
  })
}

/** Sets an article's byline, in order, as an owner-facing byline change would. */
async function credit(articleId: string, ...profiles: AuthorProfile[]) {
  await repository.transaction(async (transaction) => {
    await transaction.setArticleAuthors(
      articleId,
      profiles.map(({ id }) => id),
    )
    transaction.recordPublicationChange()
  })
}

/** Files an article under a category or tag, after the article's existing taxonomy links. */
async function fileUnder(
  articleId: string,
  kind: Exclude<TaxonomyTerm['kind'], 'section'>,
  slug: string,
  name: string = slug,
) {
  await repository.transaction(async (transaction) => {
    const id = `${kind}-${slug}`
    if (!(await transaction.listTaxonomyTerms()).some((term) => term.id === id)) {
      await transaction.saveTaxonomyTerm({
        createdAt: termTime,
        id,
        kind,
        name,
        slug,
        updatedAt: termTime,
      })
    }
    const positions = (await transaction.listArticleTaxonomies())
      .filter((link) => link.articleId === articleId)
      .map(({ position }) => position)
    await transaction.saveArticleTaxonomy({
      articleId,
      position: Math.max(-1, ...positions) + 1,
      taxonomyId: id,
    })
    transaction.recordPublicationChange()
  })
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

describe('author pages and bylines', () => {
  it('lists an author’s publicly visible stories, newest first', async () => {
    await saveAuthors(alpha, bravo)
    await publish({ section: 'interiors', slug: 'first' })
    await publish({ slug: 'second' })
    await publish({ slug: 'theirs' })
    const withdrawn = await publish({ slug: 'withdrawn' })
    const deleted = await publish({ slug: 'deleted' })
    await credit('article-first', alpha)
    await credit('article-second', bravo, alpha)
    await credit('article-theirs', bravo)
    await credit(withdrawn.article.id, alpha)
    await credit(deleted.article.id, alpha)
    await credit(await createDraft('draft'), alpha)
    await withdrawn.service.unpublish({
      articleId: withdrawn.article.id,
      expectedVersion: withdrawn.article.version,
      idempotencyKey: 'unpublish-withdrawn',
      reason: 'Corrections pending',
    })
    await deleted.service.softDelete({
      articleId: deleted.article.id,
      expectedVersion: deleted.article.version,
      idempotencyKey: 'delete-deleted',
    })

    const page = await readAuthorView(source, 'alpha')

    expect(page).toMatchObject({
      bio: 'Alpha Writer writes about rooms.',
      href: '/authors/alpha',
      name: 'Alpha Writer',
      navigation: { sections: [{ slug: 'interiors' }] },
      slug: 'alpha',
    })
    expect(page?.stories.map(({ slug }) => slug)).toEqual(['second', 'first'])
    expect(page?.stories[1]).toMatchObject({
      href: '/stories/first',
      section: { href: '/sections/interiors', name: 'interiors', slug: 'interiors' },
      title: 'Title for first',
    })
  })

  it('returns null for an unknown author and an empty page for one with no visible stories', async () => {
    await saveAuthors(alpha, bravo)
    await publish({ slug: 'published' })
    await credit(await createDraft('draft'), bravo)

    expect(await readAuthorView(source, 'unknown')).toBeNull()
    expect(await readAuthorView(source, 'bravo')).toEqual({
      bio: null,
      href: '/authors/bravo',
      name: 'Bravo Writer',
      navigation: { sections: [] },
      slug: 'bravo',
      stories: [],
    })
  })

  it('credits an article’s authors in byline order and links their pages', async () => {
    await saveAuthors(alpha, bravo)
    await publish({ slug: 'credited' })
    await publish({ slug: 'uncredited' })
    await credit('article-credited', bravo, alpha)

    expect(await readArticleView(source, 'credited')).toMatchObject({
      authorLinks: [
        { href: '/authors/bravo', name: 'Bravo Writer' },
        { href: '/authors/alpha', name: 'Alpha Writer' },
      ],
      authors: ['Bravo Writer', 'Alpha Writer'],
    })
    expect(await readArticleView(source, 'uncredited')).toMatchObject({
      authorLinks: [],
      authors: [],
    })
  })
})

describe('topic pages and article topics', () => {
  it('lists the visible stories filed under the tags and categories that share a topic’s slug', async () => {
    await publish({ section: 'interiors', slug: 'lamp' })
    await publish({ section: 'craft', slug: 'window' })
    await publish({ slug: 'candle' })
    const hidden = await publish({ slug: 'hidden' })
    await publish({ section: 'light', slug: 'only-in-a-section' })
    await fileUnder('article-lamp', 'tag', 'light')
    await fileUnder('article-window', 'tag', 'light')
    await fileUnder('article-candle', 'category', 'light', 'Light')
    await fileUnder(hidden.article.id, 'tag', 'light')
    await hidden.service.unpublish({
      articleId: hidden.article.id,
      expectedVersion: hidden.article.version,
      idempotencyKey: 'unpublish-hidden',
      reason: 'Not ready',
    })

    const topic = await readTopicView(source, 'light')

    expect(topic).toMatchObject({
      description: null,
      href: '/topics/light',
      // The category names the topic before the tag that shares its slug.
      name: 'Light',
      slug: 'light',
    })
    expect(topic?.stories.map(({ slug }) => slug)).toEqual(['candle', 'window', 'lamp'])
    expect(topic?.stories.map(({ section }) => section?.slug ?? null)).toEqual([
      null,
      'craft',
      'interiors',
    ])
    expect(topic?.navigation.sections.map(({ slug }) => slug)).toEqual([
      'craft',
      'interiors',
      'light',
    ])
  })

  it('returns null for unknown topics and for sections, and an empty page for a topic with no visible stories', async () => {
    await publish({ section: 'interiors', slug: 'room' })
    await fileUnder(await createDraft('draft'), 'tag', 'unseen', 'Unseen')

    expect(await readTopicView(source, 'unknown')).toBeNull()
    expect(await readTopicView(source, 'interiors')).toBeNull()
    expect(await readTopicView(source, 'unseen')).toEqual({
      description: null,
      href: '/topics/unseen',
      name: 'Unseen',
      navigation: {
        sections: [{ href: '/sections/interiors', name: 'interiors', slug: 'interiors' }],
      },
      slug: 'unseen',
      stories: [],
    })
  })

  it('links an article’s topics by link position, each slug once, and never its sections', async () => {
    await publish({ section: 'interiors', slug: 'tagged' })
    await fileUnder('article-tagged', 'tag', 'winter', 'Winter')
    await fileUnder('article-tagged', 'category', 'light', 'Light')
    await fileUnder('article-tagged', 'tag', 'light')
    await publish({ slug: 'untagged' })

    const article = await readArticleView(source, 'tagged')

    expect(article?.topics).toEqual([
      { href: '/topics/winter', name: 'Winter' },
      { href: '/topics/light', name: 'Light' },
    ])
    expect(article?.section?.slug).toBe('interiors')
    expect((await readArticleView(source, 'untagged'))?.topics).toEqual([])
  })
})

describe('related stories', () => {
  it('relates the newest other visible stories filed under the article’s primary section', async () => {
    const rooms = Array.from({ length: relatedStoryLimit + 2 }, (_, index) => `room-${index + 1}`)
    for (const slug of rooms) await publish({ section: 'interiors', slug })
    await publish({ section: 'craft', slug: 'chair' })
    const hidden = await publish({ section: 'interiors', slug: 'hidden-room' })
    await hidden.service.unpublish({
      articleId: hidden.article.id,
      expectedVersion: hidden.article.version,
      idempotencyKey: 'unpublish-hidden-room',
      reason: 'Not ready',
    })
    // A story filed under interiors as its second section is related too.
    await publish({ section: 'craft', slug: 'stool' })
    const interiors = await sections.ensureSection({ name: 'interiors', slug: 'interiors' })
    await sections.assignSection({ articleId: 'article-stool', sectionId: interiors.id })

    const related = (await readArticleView(source, 'room-2'))?.related

    const newestFirst = ['stool', ...[...rooms].reverse()].filter((slug) => slug !== 'room-2')
    expect(related?.map(({ slug }) => slug)).toEqual(newestFirst.slice(0, relatedStoryLimit))
    expect(related?.[0]).toMatchObject({
      href: '/stories/stool',
      section: { slug: 'craft' },
      title: 'Title for stool',
    })
  })

  it('relates nothing to a story without a section or alone in its section', async () => {
    await publish({ section: 'interiors', slug: 'room' })
    await publish({ slug: 'loose' })

    expect((await readArticleView(source, 'loose'))?.related).toEqual([])
    expect((await readArticleView(source, 'room'))?.related).toEqual([])
  })
})
