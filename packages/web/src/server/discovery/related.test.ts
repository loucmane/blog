import { describe, expect, it, vi } from 'vitest'

import { CURRENT_CONTENT_DOCUMENT_VERSION, type ContentDocument } from '../content/document'
import type { AuthorProfile } from '../content/domain'
import { InMemoryContentRepository } from '../content/in-memory-repository'
import type { Clock, ContentRepository } from '../content/ports'
import { SectionService } from '../content/sections'
import { ContentService } from '../content/service'
import {
  assertRelatedStoryWeights,
  defaultRelatedStoryLimit,
  InMemoryRelatedStories,
  maxRelatedStoryLimit,
  RelatedStoriesService,
  type RelatedCandidate,
  type RelatedStory,
} from './related'
import { relatedStoryWeights, type RelatedStoryWeights } from './related-weights'

// The Phase 5 plan's weights (slice S6). The ranking cases pass them explicitly, so a change to
// related-weights.ts reorders stories without touching them.
const planWeights: RelatedStoryWeights = {
  recency: { decayDays: 45, weight: 0.5 },
  sharedAuthor: { cap: 1, weight: 1 },
  sharedSection: { cap: 1, weight: 2 },
  sharedTerm: { cap: 3, weight: 3 },
}

const dayMilliseconds = 86_400_000
const newest = Date.UTC(2026, 5, 30, 7)

type SharedCounts = Partial<
  Pick<RelatedCandidate, 'sharedAuthors' | 'sharedSections' | 'sharedTerms'>
>

/** A candidate published `daysBefore` days before the newest one, sharing what it is given. */
function candidate(slug: string, daysBefore: number, shared: SharedCounts = {}): RelatedCandidate {
  return {
    articleId: `article-${slug}`,
    publishedAt: new Date(newest - daysBefore * dayMilliseconds).toISOString(),
    sharedAuthors: 0,
    sharedSections: 0,
    sharedTerms: 0,
    slug,
    ...shared,
  }
}

function rankingOf(
  candidates: readonly RelatedCandidate[],
  weights: RelatedStoryWeights = planWeights,
) {
  return new RelatedStoriesService({ candidatesFor: async () => candidates }, weights)
}

const select = (service: RelatedStoriesService, limit = maxRelatedStoryLimit) =>
  service.relatedTo({ articleId: 'article-feature', limit })
const slugs = (stories: readonly RelatedStory[]) => stories.map(({ slug }) => slug)
const bases = (stories: readonly RelatedStory[]) => stories.map(({ basis, slug }) => [slug, basis])

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]]
  return items.flatMap((item, index) =>
    permutations([...items.slice(0, index), ...items.slice(index + 1)]).map((rest) => [
      item,
      ...rest,
    ]),
  )
}

describe('related-story ranking', () => {
  it('ships the Phase 5 plan weights until the owner chooses others (OQ-07)', () => {
    expect(relatedStoryWeights).toEqual(planWeights)
    expect(assertRelatedStoryWeights(relatedStoryWeights)).toBe(relatedStoryWeights)
  })

  it('scores each shared signal by its weight, counting at most three terms', async () => {
    const stories = await select(
      rankingOf([
        candidate('two-authors', 0, { sharedAuthors: 2 }),
        candidate('two-sections', 0, { sharedSections: 2 }),
        candidate('everything', 45, { sharedAuthors: 1, sharedSections: 1, sharedTerms: 1 }),
        candidate('two-terms', 0, { sharedTerms: 2 }),
        candidate('four-terms', 0, { sharedTerms: 4 }),
      ]),
    )

    expect(slugs(stories)).toEqual([
      'four-terms',
      'two-terms',
      'everything',
      'two-sections',
      'two-authors',
    ])
    // A fourth term adds nothing; a second section or author adds nothing; 45 days divide
    // recency by e.
    const expected = [9 + 0.5, 6 + 0.5, 3 + 2 + 1 + 0.5 * Math.exp(-1), 2 + 0.5, 1 + 0.5]
    stories.forEach(({ basis, score }, index) => {
      expect(basis).toBe('signals')
      expect(score).toBeCloseTo(expected[index] ?? Number.NaN, 12)
    })
  })

  it('counts recency back from the newest candidate, never from the clock', async () => {
    const service = rankingOf([
      candidate('oldest', 90),
      candidate('newest', 0),
      candidate('older', 45),
    ])
    const scores: number[][] = []
    vi.useFakeTimers()
    try {
      for (const now of ['2026-07-01T00:00:00.000Z', '2031-01-01T00:00:00.000Z']) {
        vi.setSystemTime(new Date(now))
        scores.push((await select(service)).map(({ score }) => score))
      }
    } finally {
      vi.useRealTimers()
    }

    expect(scores[1]).toEqual(scores[0])
    const [newestScore, olderScore, oldestScore] = scores[0] ?? []
    expect(newestScore).toBe(0.5)
    expect(olderScore).toBeCloseTo(0.5 * Math.exp(-1), 12)
    expect(oldestScore).toBeCloseTo(0.5 * Math.exp(-2), 12)
  })

  it('returns the same stories in the same order on every run, whatever order they arrive in', async () => {
    // Three stories tie on every signal and on publication time. Ids compare as plain strings:
    // upper case before lower case, where a locale-aware comparison would put tie-a first.
    const candidates = [
      candidate('tie-b', 2, { sharedTerms: 1 }),
      candidate('newer', 1, { sharedTerms: 1 }),
      { ...candidate('tie-c', 2, { sharedTerms: 1 }), articleId: 'article-Tie-c' },
      candidate('tie-a', 2, { sharedTerms: 1 }),
    ]
    const orders = permutations(candidates)
    expect(orders).toHaveLength(24)

    for (const order of orders) {
      const service = rankingOf(order)
      const first = await select(service)
      expect(slugs(first)).toEqual(['newer', 'tie-c', 'tie-a', 'tie-b'])
      for (let run = 0; run < 3; run += 1) expect(await select(service)).toEqual(first)
    }
  })

  it('falls back to the newest stories in the same section, then the newest stories anywhere', async () => {
    const candidates = [
      candidate('room-old', 30, { sharedSections: 1 }),
      candidate('chair', 5),
      candidate('tagged', 60, { sharedTerms: 1 }),
      candidate('loose', 0),
      candidate('room-new', 10, { sharedSections: 1 }),
    ]

    // A shared section is a signal in itself, worth more than any recency.
    expect(bases(await select(rankingOf(candidates)))).toEqual([
      ['tagged', 'signals'],
      ['room-new', 'signals'],
      ['room-old', 'signals'],
      ['loose', 'recent'],
      ['chair', 'recent'],
    ])
    // With the section weight at 0, the section's stories are still the first fallback.
    const unweightedSection = { ...planWeights, sharedSection: { cap: 1, weight: 0 } }
    expect(bases(await select(rankingOf(candidates, unweightedSection)))).toEqual([
      ['tagged', 'signals'],
      ['room-new', 'section'],
      ['room-old', 'section'],
      ['loose', 'recent'],
      ['chair', 'recent'],
    ])
    // With no signal at all, the newest stories anywhere.
    const unrelated = [candidate('chair', 5), candidate('loose', 0), candidate('lamp', 9)]
    expect(bases(await select(rankingOf(unrelated)))).toEqual([
      ['loose', 'recent'],
      ['chair', 'recent'],
      ['lamp', 'recent'],
    ])
  })

  it('relates nothing, without an error, when there is no candidate', async () => {
    const candidatesFor = vi.fn(async () => [])

    expect(
      await new RelatedStoriesService({ candidatesFor }, planWeights).relatedTo({
        articleId: 'article-unknown',
      }),
    ).toEqual([])
    expect(candidatesFor).toHaveBeenCalledExactlyOnceWith('article-unknown')
  })

  it('returns the selection size asked for, and refuses one it cannot serve before reading', async () => {
    const many = Array.from({ length: maxRelatedStoryLimit + 3 }, (_, index) =>
      candidate(`story-${index}`, index),
    )
    const candidatesFor = vi.fn(async () => many)
    const service = new RelatedStoriesService({ candidatesFor }, planWeights)

    for (const limit of [0, maxRelatedStoryLimit + 1, 1.5, Number.NaN]) {
      await expect(service.relatedTo({ articleId: 'article-feature', limit })).rejects.toThrow(
        RangeError,
      )
    }
    expect(candidatesFor).not.toHaveBeenCalled()
    expect(await service.relatedTo({ articleId: 'article-feature' })).toHaveLength(
      defaultRelatedStoryLimit,
    )
    expect(await select(service, 1)).toHaveLength(1)
    expect(await select(service)).toHaveLength(maxRelatedStoryLimit)
  })

  it('refuses weights that cannot rank, and accepts 0 to turn a signal off', () => {
    const candidatesFor = vi.fn(async () => [])
    const invalid: RelatedStoryWeights[] = [
      { ...planWeights, sharedTerm: { cap: 1.5, weight: 3 } },
      { ...planWeights, sharedTerm: { cap: 0, weight: 3 } },
      { ...planWeights, sharedSection: { cap: 1, weight: Number.NaN } },
      { ...planWeights, sharedSection: { cap: 1, weight: -2 } },
      { ...planWeights, sharedAuthor: { cap: 1, weight: Number.POSITIVE_INFINITY } },
      { ...planWeights, recency: { decayDays: 45, weight: Number.NaN } },
      { ...planWeights, recency: { decayDays: 45, weight: -0.5 } },
      { ...planWeights, recency: { decayDays: Number.POSITIVE_INFINITY, weight: 0.5 } },
      { ...planWeights, recency: { decayDays: 0, weight: 0.5 } },
    ]

    for (const weights of invalid) {
      expect(() => new RelatedStoriesService({ candidatesFor }, weights)).toThrow(RangeError)
    }
    const off: RelatedStoryWeights = {
      recency: { decayDays: 1, weight: 0 },
      sharedAuthor: { cap: 1, weight: 0 },
      sharedSection: { cap: 1, weight: 0 },
      sharedTerm: { cap: 1, weight: 0 },
    }
    expect(assertRelatedStoryWeights(off)).toBe(off)
    expect(candidatesFor).not.toHaveBeenCalled()
  })

  it('refuses a candidate without a valid publication time', async () => {
    const broken = { ...candidate('broken', 0), publishedAt: 'not a time' }

    await expect(select(rankingOf([candidate('lamp', 1), broken]))).rejects.toThrow(
      'Related candidate article-broken has no valid publication time.',
    )
  })

  it('ranks with the weights in related-weights.ts, so editing that file reorders stories', async () => {
    const port = {
      candidatesFor: async () => [
        candidate('same-author', 0, { sharedAuthors: 1 }),
        candidate('same-section', 0, { sharedSections: 1 }),
        candidate('same-tag', 0, { sharedTerms: 1 }),
      ],
    }
    // Given no weights, the service ranks with the ones related-weights.ts exports.
    expect(await select(new RelatedStoriesService(port))).toEqual(
      await select(new RelatedStoriesService(port, relatedStoryWeights)),
    )

    // The same related.ts, loaded against two versions of related-weights.ts.
    async function orderWith(fileWeights: RelatedStoryWeights) {
      vi.resetModules()
      vi.doMock('./related-weights', () => ({ relatedStoryWeights: fileWeights }))
      try {
        const loaded = await import('./related')
        return slugs(await select(new loaded.RelatedStoriesService(port)))
      } finally {
        vi.doUnmock('./related-weights')
        vi.resetModules()
      }
    }
    expect(await orderWith(planWeights)).toEqual(['same-tag', 'same-section', 'same-author'])
    // The owner raises the author weight in the file.
    expect(await orderWith({ ...planWeights, sharedAuthor: { cap: 1, weight: 4 } })).toEqual([
      'same-author',
      'same-tag',
      'same-section',
    ])
  })
})

interface Topic {
  readonly kind: 'category' | 'tag'
  readonly slug: string
}

type StoryState =
  'deleted' | 'draft' | 'orphaned' | 'published' | 'rescheduled' | 'scheduled' | 'withdrawn'

interface Story {
  /** The byline, in order. */
  readonly authors?: readonly AuthorProfile[]
  /** The day in June 2026 the story is written, and published if it is. */
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

describe('related-story candidates read through the content repository', () => {
  const alpha = profile('alpha')
  const bravo = profile('bravo')
  const light: Topic = { kind: 'category', slug: 'light' }
  const winter: Topic = { kind: 'tag', slug: 'winter' }

  async function corpus() {
    const repository = new InMemoryContentRepository()
    await saveAuthors(repository, alpha, bravo)
    await addStory(repository, {
      authors: [alpha],
      day: 10,
      sections: ['interiors'],
      slug: 'feature',
      topics: [light, winter],
    })
    await addStory(repository, { day: 1, sections: ['interiors'], slug: 'lamp', topics: [light] })
    await addStory(repository, {
      authors: [bravo, alpha],
      day: 2,
      sections: ['craft', 'interiors'],
      slug: 'window',
      topics: [winter, light],
    })
    await addStory(repository, { day: 3, slug: 'loose' })
    await addStory(repository, {
      day: 4,
      slug: 'rescheduled',
      state: 'rescheduled',
      topics: [winter],
    })
    // Every hidden story shares everything with the feature and is newer than it.
    for (const state of hiddenStates) {
      await addStory(repository, {
        authors: [alpha],
        day: 11,
        sections: ['interiors'],
        slug: state,
        state,
        topics: [light, winter],
      })
    }
    return repository
  }

  it('offers every visible story but the article itself, with what each shares with it', async () => {
    const repository = await corpus()

    const candidates = await new InMemoryRelatedStories(repository).candidatesFor('article-feature')

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
    const related = await new RelatedStoriesService(
      new InMemoryRelatedStories(repository),
      planWeights,
    ).relatedTo({ articleId: 'article-feature', limit: maxRelatedStoryLimit })
    expect(slugs(related)).toEqual(['window', 'lamp', 'rescheduled', 'loose'])
  })

  it('offers nothing for an unknown article or one readers cannot see', async () => {
    const candidates = new InMemoryRelatedStories(await corpus())

    for (const state of hiddenStates) {
      expect(await candidates.candidatesFor(`article-${state}`)).toEqual([])
    }
    expect(await candidates.candidatesFor('article-unknown')).toEqual([])
    expect(
      await new InMemoryRelatedStories(new InMemoryContentRepository()).candidatesFor(
        'article-feature',
      ),
    ).toEqual([])
  })

  it('counts no shared author when no story credits one, and still relates the stories', async () => {
    const repository = new InMemoryContentRepository()
    await addStory(repository, {
      day: 50,
      sections: ['interiors'],
      slug: 'feature',
      topics: [winter],
    })
    await addStory(repository, { day: 50, sections: ['interiors'], slug: 'lamp', topics: [winter] })
    await addStory(repository, { day: 5, sections: ['interiors'], slug: 'chair' })
    await addStory(repository, { day: 40, slug: 'loose' })

    const candidates = await new InMemoryRelatedStories(repository).candidatesFor('article-feature')
    const related = await new RelatedStoriesService(
      new InMemoryRelatedStories(repository),
      planWeights,
    ).relatedTo({ articleId: 'article-feature' })

    expect(candidates.map(({ sharedAuthors }) => sharedAuthors)).toEqual([0, 0, 0])
    expect(bases(related)).toEqual([
      ['lamp', 'signals'],
      ['chair', 'signals'],
      ['loose', 'recent'],
    ])
    expect(related[0]?.score).toBeCloseTo(3 + 2 + 0.5, 12)
    expect(related[1]?.score).toBeCloseTo(2 + 0.5 * Math.exp(-1), 12)
    expect(related[2]?.score).toBeCloseTo(0.5 * Math.exp(-10 / 45), 12)
  })
})
