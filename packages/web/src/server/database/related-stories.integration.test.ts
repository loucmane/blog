import { randomUUID } from 'node:crypto'

import { Pool } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { CURRENT_CONTENT_DOCUMENT_VERSION, type ContentDocument } from '../content/document'
import type { Article, ArticleRevision, AuthorProfile, TaxonomyTerm } from '../content/domain'
import { InMemoryContentRepository } from '../content/in-memory-repository'
import type { Clock, ContentRepository } from '../content/ports'
import { SectionService } from '../content/sections'
import { ContentService } from '../content/service'
import {
  defaultRelatedStoryLimit,
  InMemoryRelatedStories,
  maxRelatedStoryLimit,
  RelatedStoriesService,
  type RelatedCandidate,
  type RelatedStory,
} from '../discovery/related'
import type { RelatedStoryWeights } from '../discovery/related-weights'
import { applyContentMigrations, readContentMigrations } from './migrations'
import { PostgresContentRepository } from './postgres-content-repository'
import { PostgresRelatedStories } from './postgres-related-stories'

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required for the Task 42 integration suite`)
  return value
}

const databaseUrl = requiredEnvironment('TASK42_DATABASE_URL')

// The Phase 5 plan's weights (slice S6). The ordering cases pass them explicitly, so a change to
// related-weights.ts reorders stories without touching them.
const planWeights: RelatedStoryWeights = {
  recency: { decayDays: 45, weight: 0.5 },
  sharedAuthor: { cap: 1, weight: 1 },
  sharedSection: { cap: 1, weight: 2 },
  sharedTerm: { cap: 3, weight: 3 },
}

interface Topic {
  readonly kind: 'category' | 'tag'
  readonly slug: string
}

type StoryState =
  'deleted' | 'draft' | 'orphaned' | 'published' | 'rescheduled' | 'scheduled' | 'withdrawn'

interface Story {
  /** The byline, in order. */
  readonly authors?: readonly AuthorProfile[]
  /** The day in June 2026 the story is written, and published if it is; later days run on. */
  readonly day: number
  /** Section slugs, primary section first. */
  readonly sections?: readonly string[]
  readonly slug: string
  /**
   * Readers see `published` stories and `rescheduled` ones: published, with a newer revision
   * scheduled. They never see the others, including `orphaned`: a rescheduled story whose only
   * active publication job was cancelled behind the service's back.
   */
  readonly state?: StoryState
  /** Categories and tags, filed after the sections. */
  readonly topics?: readonly Topic[]
}

const termTime = '2026-06-01T00:00:00.000Z'
const hiddenStates = ['withdrawn', 'deleted', 'draft', 'scheduled', 'orphaned'] as const

function profile(slug: string): AuthorProfile {
  return {
    bio: '',
    createdAt: termTime,
    displayName: `Writer ${slug}`,
    id: `author-${slug}`,
    slug,
    updatedAt: termTime,
  }
}

function storyDocument(articleId: string, title: string): ContentDocument {
  return {
    articleId,
    document: {
      content: [{ content: [{ text: `Notes for ${title}.`, type: 'text' }], type: 'paragraph' }],
      type: 'doc',
    },
    migrationProvenance: [],
    schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
    title,
  }
}

async function saveAuthors(store: ContentRepository, ...authors: AuthorProfile[]) {
  await store.transaction(async (transaction) => {
    for (const author of authors) await transaction.saveAuthor(author)
  })
}

/** Files an article under a category or tag, after its existing taxonomy links. */
async function fileUnder(store: ContentRepository, articleId: string, topic: Topic) {
  await store.transaction(async (transaction) => {
    const id = `${topic.kind}-${topic.slug}`
    if (!(await transaction.listTaxonomyTerms()).some((term) => term.id === id)) {
      await transaction.saveTaxonomyTerm({
        createdAt: termTime,
        id,
        kind: topic.kind,
        name: topic.slug,
        slug: topic.slug,
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
  })
}

/** Adds a story with its byline, sections and topics, then takes it to its state. */
async function addStory(store: ContentRepository, story: Story) {
  const { day, slug, state = 'published' } = story
  const clock: Clock = { now: () => new Date(Date.UTC(2026, 5, day, 7)) }
  const service = new ContentService(store, clock)
  const sections = new SectionService(store, clock)
  const articleId = `article-${slug}`
  const title = `Title of ${slug}`
  const created = await service.createArticle({
    dek: '',
    document: storyDocument(articleId, title),
    id: articleId,
    idempotencyKey: `create-${slug}`,
    slug,
    title,
  })
  const authorIds = (story.authors ?? []).map(({ id }) => id)
  if (authorIds.length > 0) {
    await store.transaction((transaction) => transaction.setArticleAuthors(articleId, authorIds))
  }
  for (const sectionSlug of story.sections ?? []) {
    const section = await sections.ensureSection({
      id: `section-${sectionSlug}`,
      name: sectionSlug,
      slug: sectionSlug,
    })
    await sections.assignSection({ articleId, sectionId: section.id })
  }
  for (const topic of story.topics ?? []) await fileUnder(store, articleId, topic)

  if (state === 'draft') return
  const schedule = (expectedVersion: number, revisionId: string) =>
    service.schedulePublication({
      articleId,
      expectedVersion,
      idempotencyKey: `schedule-${slug}`,
      revisionId,
      runAt: '2026-12-01T09:00:00.000Z',
      timeZone: 'Europe/Stockholm',
    })
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
      reason: 'Related-story check',
    })
  } else if (state === 'deleted') {
    await service.softDelete({
      articleId,
      expectedVersion: article.version,
      idempotencyKey: `delete-${slug}`,
    })
  } else if (state === 'rescheduled' || state === 'orphaned') {
    const update = await service.saveDraft({
      articleId,
      document: storyDocument(articleId, `Next ${title}`),
      expectedVersion: article.version,
      idempotencyKey: `save-${slug}`,
      title: `Next ${title}`,
    })
    await schedule(update.article.version, update.revision.id)
    if (state === 'orphaned') {
      await store.transaction(async (transaction) => {
        for (const job of await transaction.listPublicationJobs(articleId)) {
          await transaction.savePublicationJob({ ...job, status: 'cancelled' })
        }
      })
    }
  }
}

const publishedOn = (day: number) => new Date(Date.UTC(2026, 5, day, 7)).toISOString()
const byArticleId = (stories: readonly RelatedCandidate[]) =>
  [...stories].sort((left, right) => (left.articleId < right.articleId ? -1 : 1))
const slugs = (stories: readonly RelatedStory[]) => stories.map(({ slug }) => slug)
const bases = (stories: readonly RelatedStory[]) => stories.map(({ basis, slug }) => [slug, basis])

/** The item at `index`, counting round the list. */
function cycle<T>(items: readonly T[], index: number): T {
  const item = items[index % items.length]
  if (item === undefined) throw new Error('A reference list is empty.')
  return item
}

/**
 * The OQ-10 reference corpus (docs/planning/phase-5-publishing-distribution.md, Decisions Made At
 * This Stage): 500 published articles, 20 authors and 40 taxonomy terms (6 sections, 10
 * categories, 24 tags) from a deterministic seed. Story n (0 to 499) is published 18 hours after
 * story n - 1, from 2025-01-01T08:00Z. It is filed under section n mod 6 (every seventh story also
 * under section n + 3 mod 6), category 7n mod 10, tags 5n and 11n + 3 mod 24 (every third story
 * also tag 13n + 7 mod 24), and credits author n mod 20 (every fourth story also author 3n + 1
 * mod 20).
 */
function referenceCorpus() {
  const time = '2025-01-01T00:00:00.000Z'
  const authors = Array.from({ length: 20 }, (_, index): AuthorProfile => ({
    bio: '',
    createdAt: time,
    displayName: `Reference writer ${index + 1}`,
    id: `reference-author-${index + 1}`,
    slug: `reference-author-${index + 1}`,
    updatedAt: time,
  }))
  const terms = (kind: TaxonomyTerm['kind'], count: number) =>
    Array.from({ length: count }, (_, index): TaxonomyTerm => ({
      createdAt: time,
      id: `reference-${kind}-${index + 1}`,
      kind,
      name: `Reference ${kind} ${index + 1}`,
      slug: `reference-${kind}-${index + 1}`,
      updatedAt: time,
    }))
  const sections = terms('section', 6)
  const categories = terms('category', 10)
  const tags = terms('tag', 24)
  const stories = Array.from({ length: 500 }, (_, n) => {
    const filed = [
      cycle(sections, n),
      ...(n % 7 === 0 ? [cycle(sections, n + 3)] : []),
      cycle(categories, 7 * n),
      cycle(tags, 5 * n),
      cycle(tags, 11 * n + 3),
      ...(n % 3 === 0 ? [cycle(tags, 13 * n + 7)] : []),
    ]
    const credited = [cycle(authors, n), ...(n % 4 === 0 ? [cycle(authors, 3 * n + 1)] : [])]
    return {
      authorIds: [...new Set(credited.map(({ id }) => id))],
      id: `reference-${String(n + 1).padStart(3, '0')}`,
      publishedAt: new Date(Date.UTC(2025, 0, 1, 8) + n * 18 * 3_600_000).toISOString(),
      taxonomyIds: [...new Set(filed.map(({ id }) => id))],
    }
  })
  return { authors, stories, terms: [...sections, ...categories, ...tags] }
}

/** Writes the reference corpus as published articles in one transaction. */
async function seedReferenceCorpus(
  store: ContentRepository,
  corpus: ReturnType<typeof referenceCorpus>,
) {
  await store.transaction(async (transaction) => {
    for (const author of corpus.authors) await transaction.saveAuthor(author)
    for (const term of corpus.terms) await transaction.saveTaxonomyTerm(term)
    for (const story of corpus.stories) {
      const title = `Reference story ${story.id}`
      const revision: ArticleRevision = {
        articleId: story.id,
        createdAt: story.publishedAt,
        dek: '',
        document: storyDocument(story.id, title),
        id: `${story.id}-revision-1`,
        revisionNumber: 1,
        title,
      }
      const article: Article = {
        createdAt: story.publishedAt,
        currentDraftRevisionId: revision.id,
        deletedAt: null,
        dek: '',
        id: story.id,
        preDeleteStatus: null,
        publishedAt: story.publishedAt,
        publishedRevisionId: revision.id,
        scheduledAt: null,
        scheduledRevisionId: null,
        slug: story.id,
        status: 'published',
        title,
        updatedAt: story.publishedAt,
        version: 1,
      }
      await transaction.saveRevision(revision)
      await transaction.saveArticle(article, null)
      for (const [position, taxonomyId] of story.taxonomyIds.entries()) {
        await transaction.saveArticleTaxonomy({ articleId: story.id, position, taxonomyId })
      }
      await transaction.setArticleAuthors(story.id, story.authorIds)
    }
  })
}

describe('related-story selection on real PostgreSQL', () => {
  // Each case gets new schemas with every content migration applied, so it sees only its own
  // stories. The same stories also go into an in-memory repository, whose candidates come from
  // the reader's own visibility rule, and PostgreSQL must agree with it.
  const alpha = profile('alpha')
  const bravo = profile('bravo')
  const light: Topic = { kind: 'category', slug: 'light' }
  const winter: Topic = { kind: 'tag', slug: 'winter' }

  let admin: Pool
  let schemas: { pool: Pool; schema: string }[]
  let pool: Pool
  let memory: ContentRepository
  let postgres: ContentRepository

  /** A new schema with every content migration applied, dropped after the case. */
  async function openSchema(): Promise<Pool> {
    const schema = `related_stories_${randomUUID().replaceAll('-', '')}`
    await admin.query(`CREATE SCHEMA "${schema}"`)
    const opened = new Pool({
      connectionString: databaseUrl,
      max: 2,
      options: `-c search_path=${schema}`,
    })
    schemas.push({ pool: opened, schema })
    await applyContentMigrations(opened, await readContentMigrations())
    return opened
  }

  beforeEach(async () => {
    admin = new Pool({ connectionString: databaseUrl, max: 1 })
    schemas = []
    pool = await openSchema()
    memory = new InMemoryContentRepository()
    postgres = new PostgresContentRepository(pool)
  })

  afterEach(async () => {
    for (const opened of schemas) {
      await opened.pool.end()
      await admin.query(`DROP SCHEMA IF EXISTS "${opened.schema}" CASCADE`)
    }
    await admin.end()
  })

  /** Makes the same writes in the in-memory repository, then in PostgreSQL. */
  async function inBothStores(write: (store: ContentRepository) => Promise<void>) {
    await write(memory)
    await write(postgres)
  }

  const fromPostgres = (weights: RelatedStoryWeights = planWeights, from: Pool = pool) =>
    new RelatedStoriesService(new PostgresRelatedStories(from), weights)
  const fromMemory = (weights: RelatedStoryWeights = planWeights) =>
    new RelatedStoriesService(new InMemoryRelatedStories(memory), weights)
  const allRelated = { articleId: 'article-feature', limit: maxRelatedStoryLimit }

  it('leaves out the story being read and every story readers cannot see, in the query', async () => {
    await inBothStores(async (store) => {
      await saveAuthors(store, alpha, bravo)
      await addStory(store, {
        authors: [alpha],
        day: 10,
        sections: ['interiors'],
        slug: 'feature',
        topics: [light, winter],
      })
      await addStory(store, { day: 1, sections: ['interiors'], slug: 'lamp', topics: [light] })
      await addStory(store, {
        authors: [bravo, alpha],
        day: 2,
        sections: ['craft', 'interiors'],
        slug: 'window',
        topics: [winter, light],
      })
      await addStory(store, { day: 3, slug: 'loose' })
      await addStory(store, { day: 4, slug: 'rescheduled', state: 'rescheduled', topics: [winter] })
      // Every hidden story shares everything with the feature and is newer than it, so only the
      // query keeps it out.
      for (const state of hiddenStates) {
        await addStory(store, {
          authors: [alpha],
          day: 11,
          sections: ['interiors'],
          slug: state,
          state,
          topics: [light, winter],
        })
      }
    })
    const statuses = await pool.query<{ id: string; status: string }>(
      "SELECT id, status FROM articles WHERE id IN ('article-orphaned', 'article-rescheduled') ORDER BY id",
    )
    expect(statuses.rows).toEqual([
      { id: 'article-orphaned', status: 'scheduled' },
      { id: 'article-rescheduled', status: 'scheduled' },
    ])

    const candidates = await new PostgresRelatedStories(pool).candidatesFor('article-feature')

    expect(byArticleId(candidates)).toEqual([
      {
        articleId: 'article-lamp',
        publishedAt: publishedOn(1),
        sharedAuthors: 0,
        sharedSections: 1,
        sharedTerms: 1,
        slug: 'lamp',
      },
      {
        articleId: 'article-loose',
        publishedAt: publishedOn(3),
        sharedAuthors: 0,
        sharedSections: 0,
        sharedTerms: 0,
        slug: 'loose',
      },
      {
        articleId: 'article-rescheduled',
        publishedAt: publishedOn(4),
        sharedAuthors: 0,
        sharedSections: 0,
        sharedTerms: 1,
        slug: 'rescheduled',
      },
      {
        articleId: 'article-window',
        publishedAt: publishedOn(2),
        sharedAuthors: 1,
        sharedSections: 1,
        sharedTerms: 2,
        slug: 'window',
      },
    ])
    expect(byArticleId(candidates)).toEqual(
      byArticleId(await new InMemoryRelatedStories(memory).candidatesFor('article-feature')),
    )
    // A hidden or unknown article has no candidates, so its terms and authors relate nothing.
    for (const articleId of [...hiddenStates.map((state) => `article-${state}`), 'article-x']) {
      expect(await new PostgresRelatedStories(pool).candidatesFor(articleId)).toEqual([])
      expect(await fromPostgres().relatedTo({ articleId })).toEqual([])
    }
    const related = await fromPostgres().relatedTo(allRelated)
    expect(slugs(related)).toEqual(['window', 'lamp', 'rescheduled', 'loose'])
    expect(related).toEqual(await fromMemory().relatedTo(allRelated))
  }, 60_000)

  it('returns the same stories in the same order on every run, however the corpus was written', async () => {
    const stories: Story[] = [
      { day: 9, sections: ['interiors'], slug: 'feature', topics: [winter] },
      // Three stories tie on every signal and on publication time.
      { day: 3, sections: ['interiors'], slug: 'tie-b', topics: [winter] },
      { day: 3, sections: ['interiors'], slug: 'tie-c', topics: [winter] },
      { day: 3, sections: ['interiors'], slug: 'tie-a', topics: [winter] },
      { day: 5, sections: ['interiors'], slug: 'newer', topics: [winter] },
      { day: 7, sections: ['craft'], slug: 'elsewhere' },
      { day: 8, slug: 'loose' },
    ]
    for (const story of stories) await addStory(postgres, story)

    const first = await fromPostgres().relatedTo(allRelated)

    expect(slugs(first)).toEqual(['newer', 'tie-a', 'tie-b', 'tie-c', 'loose', 'elsewhere'])
    for (let run = 0; run < 5; run += 1) {
      expect(await fromPostgres().relatedTo(allRelated)).toEqual(first)
    }
    // The same stories written in the opposite order are the same corpus state.
    const reversed = await openSchema()
    const reversedStore = new PostgresContentRepository(reversed)
    for (const story of [...stories].reverse()) await addStory(reversedStore, story)
    expect(await fromPostgres(planWeights, reversed).relatedTo(allRelated)).toEqual(first)
  }, 60_000)

  it('scores a shared author at zero when no story credits an author, and still relates stories', async () => {
    await inBothStores(async (store) => {
      await addStory(store, { day: 50, sections: ['interiors'], slug: 'feature', topics: [winter] })
      await addStory(store, { day: 50, sections: ['interiors'], slug: 'lamp', topics: [winter] })
      await addStory(store, { day: 5, sections: ['interiors'], slug: 'chair' })
      await addStory(store, { day: 40, slug: 'loose' })
    })
    expect(
      (
        await pool.query<{ credits: number }>(
          'SELECT count(*)::int AS credits FROM article_authors',
        )
      ).rows,
    ).toEqual([{ credits: 0 }])

    const related = await fromPostgres().relatedTo({ articleId: 'article-feature' })

    expect(bases(related)).toEqual([
      ['lamp', 'signals'],
      ['chair', 'signals'],
      ['loose', 'recent'],
    ])
    // A tag and a section at full recency; a section 45 days older; recency alone, 10 days older.
    expect(related[0]?.score).toBeCloseTo(3 + 2 + 0.5, 12)
    expect(related[1]?.score).toBeCloseTo(2 + 0.5 * Math.exp(-1), 12)
    expect(related[2]?.score).toBeCloseTo(0.5 * Math.exp(-10 / 45), 12)
    expect(related).toEqual(await fromMemory().relatedTo({ articleId: 'article-feature' }))
  }, 60_000)

  it('falls back to the newest stories in the same section, then the newest anywhere', async () => {
    await inBothStores(async (store) => {
      await saveAuthors(store, alpha, bravo)
      // Nothing else shares the feature's tag or author.
      await addStory(store, {
        authors: [alpha],
        day: 20,
        sections: ['interiors'],
        slug: 'feature',
        topics: [winter],
      })
      await addStory(store, { authors: [bravo], day: 1, sections: ['interiors'], slug: 'room-old' })
      await addStory(store, { day: 2, sections: ['interiors'], slug: 'room-new', topics: [light] })
      await addStory(store, { day: 3, sections: ['craft'], slug: 'chair' })
      await addStory(store, { day: 4, slug: 'loose' })
    })
    const unweightedSection = { ...planWeights, sharedSection: { cap: 1, weight: 0 } }

    // A shared section is a signal in itself: the section's newest stories come first.
    expect(bases(await fromPostgres().relatedTo(allRelated))).toEqual([
      ['room-new', 'signals'],
      ['room-old', 'signals'],
      ['loose', 'recent'],
      ['chair', 'recent'],
    ])
    // With the section weight at 0 they are still the first fallback.
    expect(bases(await fromPostgres(unweightedSection).relatedTo(allRelated))).toEqual([
      ['room-new', 'section'],
      ['room-old', 'section'],
      ['loose', 'recent'],
      ['chair', 'recent'],
    ])
    expect(await fromPostgres().relatedTo(allRelated)).toEqual(
      await fromMemory().relatedTo(allRelated),
    )
  }, 60_000)

  it('relates nothing, without an error, when no other story is visible', async () => {
    expect(await fromPostgres().relatedTo({ articleId: 'article-feature' })).toEqual([])

    await inBothStores(async (store) => {
      await addStory(store, { day: 1, sections: ['interiors'], slug: 'feature' })
      await addStory(store, { day: 2, sections: ['interiors'], slug: 'draft', state: 'draft' })
    })

    expect(await fromPostgres().relatedTo({ articleId: 'article-feature' })).toEqual([])
    expect(await fromMemory().relatedTo({ articleId: 'article-feature' })).toEqual([])
  }, 60_000)

  it('reorders the same stories when a weight in related-weights.ts changes', async () => {
    await inBothStores(async (store) => {
      await saveAuthors(store, alpha)
      await addStory(store, {
        authors: [alpha],
        day: 10,
        sections: ['interiors'],
        slug: 'feature',
        topics: [winter],
      })
      await addStory(store, { day: 1, slug: 'same-tag', topics: [winter] })
      await addStory(store, { day: 2, sections: ['interiors'], slug: 'same-section' })
      await addStory(store, { authors: [alpha], day: 3, slug: 'same-author' })
    })
    const order = async (weights: RelatedStoryWeights) =>
      slugs(await fromPostgres(weights).relatedTo({ articleId: 'article-feature' }))

    expect(await order(planWeights)).toEqual(['same-tag', 'same-section', 'same-author'])
    expect(await order({ ...planWeights, sharedAuthor: { cap: 1, weight: 4 } })).toEqual([
      'same-author',
      'same-tag',
      'same-section',
    ])
    // A heavy recency weight that fades within days outweighs the older stories' signals.
    expect(await order({ ...planWeights, recency: { decayDays: 1, weight: 10 } })).toEqual([
      'same-author',
      'same-section',
      'same-tag',
    ])
  }, 60_000)

  it('selects related stories within the 100 ms budget on the OQ-10 reference corpus', async () => {
    const corpus = referenceCorpus()
    await seedReferenceCorpus(postgres, corpus)
    await seedReferenceCorpus(memory, corpus)
    await pool.query(
      'ANALYZE articles, article_taxonomies, taxonomies, article_authors, authors, publishing_jobs',
    )
    expect(
      (
        await pool.query(
          `SELECT
            (SELECT count(*)::int FROM articles WHERE status = 'published') AS articles,
            (SELECT count(*)::int FROM authors) AS authors,
            (SELECT count(*)::int FROM taxonomies) AS terms`,
        )
      ).rows,
    ).toEqual([{ articles: 500, authors: 20, terms: 40 }])
    // The reader's selection, with the shipped weights.
    const service = new RelatedStoriesService(new PostgresRelatedStories(pool))
    // Every fifth story is read: 100 selections, measured warm.
    const sample = corpus.stories.filter((_, index) => index % 5 === 0).map(({ id }) => id)
    for (const articleId of sample) await service.relatedTo({ articleId })

    const durations: number[] = []
    for (const articleId of sample) {
      const started = performance.now()
      const related = await service.relatedTo({ articleId })
      durations.push(performance.now() - started)
      expect(related).toHaveLength(defaultRelatedStoryLimit)
    }

    durations.sort((left, right) => left - right)
    const p95 = durations[Math.ceil(durations.length * 0.95) - 1] ?? Number.POSITIVE_INFINITY
    const slowest = durations.at(-1) ?? Number.POSITIVE_INFINITY
    expect(
      p95,
      `p95 ${p95.toFixed(1)} ms, slowest ${slowest.toFixed(1)} ms over ${durations.length} selections`,
    ).toBeLessThanOrEqual(100)
    // At this size PostgreSQL still offers exactly the reader's candidates.
    const fromReader = new RelatedStoriesService(new InMemoryRelatedStories(memory))
    for (const articleId of sample.slice(0, 10)) {
      expect(await service.relatedTo({ articleId })).toEqual(
        await fromReader.relatedTo({ articleId }),
      )
    }
  }, 240_000)
})
