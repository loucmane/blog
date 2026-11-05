/**
 * Test-only AC-03 contract. Never import this module into application code.
 *
 * Seed the same corpus in either content repository, then register a surface by adding one
 * ExclusionSurface entry to the appropriate suite. A reader receives the whole corpus and must
 * return observed slugs and its raw public payload, without filtering by expected visibility.
 * assertExclusion requires positive controls as well as rejecting hidden identifiers and copy.
 */
import { expect } from 'vitest'

import { CURRENT_CONTENT_DOCUMENT_VERSION, type ContentDocument } from '../content/document'
import type { ContentRepository, SearchProjection, SearchQuery } from '../content/ports'
import { ContentReader } from '../content/reader'
import { SectionService } from '../content/sections'
import { ContentService } from '../content/service'
import {
  maxRelatedStoryLimit,
  RelatedStoriesService,
  type RelatedStoryCandidates,
} from '../discovery/related'
import { maxSearchPageSize, SearchService } from '../discovery/search-service'
import { syncSearchDocument } from '../outbox/handlers'

const states = [
  { state: 'published', visible: true, everPublished: true },
  { state: 'newer-draft', visible: true, everPublished: true },
  { state: 'rescheduled', visible: true, everPublished: true },
  { state: 'draft', visible: false, everPublished: false },
  { state: 'scheduled', visible: false, everPublished: false },
  { state: 'preview', visible: false, everPublished: false },
  { state: 'soft-deleted', visible: false, everPublished: true },
  { state: 'withdrawn', visible: false, everPublished: true },
  { state: 'orphaned', visible: false, everPublished: true },
] as const

export interface ExclusionStory {
  readonly state: (typeof states)[number]['state']
  readonly visible: boolean
  readonly everPublished: boolean
  readonly articleId: string
  readonly slug: string
  readonly title: string
  readonly dek: string
  readonly body: string
}

export interface ExclusionCorpus {
  readonly visible: readonly ExclusionStory[]
  readonly hidden: readonly ExclusionStory[]
  readonly privateMarkers: readonly string[]
}

export interface ExclusionObservation {
  readonly slugs: readonly string[]
  readonly payload: string
}

export interface ExclusionSurface<Context> {
  readonly name: string
  read(context: Context, corpus: ExclusionCorpus): Promise<ExclusionObservation>
}

export interface ExclusionQueries {
  readonly repository: ContentRepository
  readonly search: SearchQuery
  readonly related: RelatedStoryCandidates
}

function document(articleId: string, title: string, body: string): ContentDocument {
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
 * All stories match "lantern" and share a section. Hidden stories are newer than the visible
 * controls, so neither relevance nor recency can accidentally keep a leak off the first page.
 * Preview is an actual loadPreview read of an unpublished revision, not a publication status.
 */
export async function seedExclusionCorpus(
  repository: ContentRepository,
  search: SearchProjection,
): Promise<ExclusionCorpus> {
  const stories: ExclusionStory[] = []
  const privateMarkers: string[] = []
  for (const [index, state] of states.entries()) {
    const slug = `ac03-${state.state}`
    const story: ExclusionStory = {
      ...state,
      articleId: `article-${slug}`,
      slug,
      title: `Lantern title for ${slug}`,
      dek: `Lantern summary for ${slug}`,
      body: `Lantern body for ${slug}`,
    }
    stories.push(story)
    const clock = { now: () => new Date(Date.UTC(2026, 9, index + 1, 9)) }
    const service = new ContentService(repository, clock)
    const created = await service.createArticle({
      id: story.articleId,
      slug,
      title: story.title,
      dek: story.dek,
      document: document(story.articleId, story.title, story.body),
      idempotencyKey: `create-${slug}`,
    })
    const sections = new SectionService(repository, clock)
    const section = await sections.ensureSection({
      id: 'ac03-section',
      name: 'Lanterns',
      slug: 'ac03-lanterns',
    })
    await sections.assignSection({ articleId: story.articleId, sectionId: section.id })
    const sync = () => syncSearchDocument({ content: repository, search }, story.articleId)
    const schedule = (expectedVersion: number, revisionId: string) =>
      service.schedulePublication({
        articleId: story.articleId,
        expectedVersion,
        revisionId,
        idempotencyKey: `schedule-${slug}`,
        runAt: '2026-12-01T09:00:00.000Z',
        timeZone: 'Europe/Stockholm',
      })

    if (!story.everPublished) {
      if (story.state === 'scheduled') await schedule(created.article.version, created.revision.id)
      if (story.state === 'preview') {
        const preview = await new ContentReader(repository).loadPreview(story.articleId)
        expect(preview?.revision.id).toBe(created.revision.id)
      }
    } else {
      const published = await service.publish({
        articleId: story.articleId,
        expectedVersion: created.article.version,
        revisionId: created.revision.id,
        idempotencyKey: `publish-${slug}`,
      })
      // Removal cases start with a real search document; otherwise removing nothing could pass.
      await sync()
      if (story.state === 'soft-deleted') {
        await service.softDelete({
          articleId: story.articleId,
          expectedVersion: published.article.version,
          idempotencyKey: `delete-${slug}`,
        })
      } else if (story.state === 'withdrawn') {
        await service.unpublish({
          articleId: story.articleId,
          expectedVersion: published.article.version,
          idempotencyKey: `withdraw-${slug}`,
          reason: 'AC-03 synthetic exclusion check',
        })
      } else if (story.state !== 'published') {
        const title = `Unreleased lantern title ${slug}`
        const dek = `Unreleased lantern summary ${slug}`
        const body = `Unreleased lantern body ${slug}`
        privateMarkers.push(title, dek, body)
        const draft = await service.saveDraft({
          articleId: story.articleId,
          expectedVersion: published.article.version,
          idempotencyKey: `revise-${slug}`,
          title,
          dek,
          document: document(story.articleId, title, body),
        })
        if (story.state !== 'newer-draft') {
          await schedule(draft.article.version, draft.revision.id)
          if (story.state === 'orphaned') {
            await repository.transaction(async (transaction) => {
              for (const job of await transaction.listPublicationJobs(story.articleId)) {
                await transaction.savePublicationJob({ ...job, status: 'cancelled' })
              }
            })
          }
        }
      }
    }
    // Use the production writer, never a test-side filter of expected visible stories.
    await sync()
  }
  return {
    visible: stories.filter((story) => story.visible),
    hidden: stories.filter((story) => !story.visible),
    privateMarkers,
  }
}

/** Exact visible inventory prevents a broken reader returning nothing from passing AC-03. */
export function assertExclusion(
  surface: string,
  corpus: ExclusionCorpus,
  observed: ExclusionObservation,
): void {
  expect([...observed.slugs].sort(), `${surface}: visible controls`).toEqual(
    corpus.visible.map((story) => story.slug).sort(),
  )
  for (const story of corpus.hidden) {
    for (const marker of [story.articleId, story.slug, story.title, story.dek, story.body]) {
      expect(observed.payload, `${surface}: ${story.state} leaked`).not.toContain(marker)
    }
  }
  for (const marker of corpus.privateMarkers) {
    expect(observed.payload, `${surface}: unpublished revision leaked`).not.toContain(marker)
  }
  expect(observed.payload, `${surface}: preview URL leaked`).not.toContain('/preview/')
}

/** Query registrations run unchanged against in-memory and PostgreSQL adapters. */
export const queryExclusionSurfaces: readonly ExclusionSurface<ExclusionQueries>[] = [
  {
    name: 'search query',
    read: async ({ search }) => {
      const page = await search.search({ query: 'lantern', limit: maxSearchPageSize, offset: 0 })
      expect(page.total).toBe(page.items.length)
      return { slugs: page.items.map((item) => item.slug), payload: JSON.stringify(page) }
    },
  },
  {
    name: 'search service',
    read: async ({ search }) => {
      const page = await new SearchService(search).search({
        query: 'lantern',
        limit: maxSearchPageSize,
      })
      expect(page.status).toBe('results')
      if (page.status !== 'results') throw new Error('AC-03 search has no positive controls')
      expect(page.total).toBe(page.items.length)
      return { slugs: page.items.map((item) => item.slug), payload: JSON.stringify(page) }
    },
  },
  ...(['candidates', 'service'] as const).map((layer): ExclusionSurface<ExclusionQueries> => ({
    name: `related stories ${layer}`,
    read: async ({ related }, corpus) => {
      const read = (articleId: string) =>
        layer === 'candidates'
          ? related.candidatesFor(articleId)
          : new RelatedStoriesService(related).relatedTo({ articleId, limit: maxRelatedStoryLimit })
      const slugs = new Set<string>()
      const payload: unknown[] = []
      for (const story of [...corpus.visible, ...corpus.hidden]) {
        const result = await read(story.articleId)
        expect(result.map((item) => item.slug).sort(), `related from ${story.state}`).toEqual(
          story.visible
            ? corpus.visible
                .filter((other) => other.articleId !== story.articleId)
                .map((other) => other.slug)
                .sort()
            : [],
        )
        result.forEach((item) => slugs.add(item.slug))
        payload.push(result)
      }
      return { slugs: [...slugs], payload: JSON.stringify(payload) }
    },
  })),
]
