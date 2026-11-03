import type { ContentRepository } from '../content/ports'
import { listVisibleArticles } from '../content/reader'
import {
  relatedStoryWeights,
  type RelatedStoryWeights,
  type SharedSignalWeight,
} from './related-weights'

/** Related stories per selection when the caller asks for no particular number. */
export const defaultRelatedStoryLimit = 4

/** The most related stories one selection returns. */
export const maxRelatedStoryLimit = 12

/**
 * A publicly visible story other than the one being read, and what the two share. Each count is
 * of distinct items, before any cap.
 */
export interface RelatedCandidate {
  readonly articleId: string
  /** The story's publication time (`articles.published_at`), as an ISO 8601 timestamp. */
  readonly publishedAt: string
  /** Authors both stories credit. */
  readonly sharedAuthors: number
  /** Sections (taxonomy terms of kind `section`) both stories are filed under. */
  readonly sharedSections: number
  /** Categories and tags both stories are filed under. */
  readonly sharedTerms: number
  readonly slug: string
}

/**
 * The read side of related-story selection. An adapter decides visibility in its own query, so a
 * story readers cannot see is never a candidate and never reaches the ranking.
 */
export interface RelatedStoryCandidates {
  /**
   * Every publicly visible story other than this article, with what it shares with it, in no
   * particular order. Empty when the article is unknown or not publicly visible itself, so the
   * terms and authors of a hidden article never shape what readers are shown.
   */
  candidatesFor(articleId: string): Promise<readonly RelatedCandidate[]>
}

/**
 * Why a story was chosen. Stories come in this order:
 *
 * - `signals`: it shares a category, tag, section or author whose weight is above 0.
 * - `section`: the fallback. It shares no weighted signal but is filed under one of the article's
 *   sections. Under the default weights a shared section is itself a signal, so this appears only
 *   when the section weight is 0.
 * - `recent`: the fallback's last step. It shares nothing, and is among the newest stories.
 */
export type RelatedStoryBasis = 'recent' | 'section' | 'signals'

export interface RelatedStory {
  readonly articleId: string
  readonly basis: RelatedStoryBasis
  readonly publishedAt: string
  /**
   * The weighted signals plus recency; higher is better. Stories are ordered by basis before
   * score, so compare scores only between stories with the same basis.
   */
  readonly score: number
  readonly slug: string
}

export interface RelatedStoriesRequest {
  /** The story being read. */
  readonly articleId: string
  /** Stories to return, 1 to `maxRelatedStoryLimit`; `defaultRelatedStoryLimit` when omitted. */
  readonly limit?: number
}

const basisOrder: Readonly<Record<RelatedStoryBasis, number>> = {
  recent: 2,
  section: 1,
  signals: 0,
}
const dayMilliseconds = 86_400_000

function assertSignal(name: string, signal: SharedSignalWeight): void {
  if (!Number.isSafeInteger(signal.cap) || signal.cap < 1) {
    throw new RangeError(`The related-story ${name} cap must be a whole number, 1 or more.`)
  }
  if (!Number.isFinite(signal.weight) || signal.weight < 0) {
    throw new RangeError(`The related-story ${name} weight must be a finite number, 0 or more.`)
  }
}

/** Refuses weights that cannot rank: a negative or infinite weight, a cap below 1, no decay. */
export function assertRelatedStoryWeights(weights: RelatedStoryWeights): RelatedStoryWeights {
  assertSignal('sharedTerm', weights.sharedTerm)
  assertSignal('sharedSection', weights.sharedSection)
  assertSignal('sharedAuthor', weights.sharedAuthor)
  if (!Number.isFinite(weights.recency.weight) || weights.recency.weight < 0) {
    throw new RangeError('The related-story recency weight must be a finite number, 0 or more.')
  }
  if (!Number.isFinite(weights.recency.decayDays) || weights.recency.decayDays <= 0) {
    throw new RangeError('The related-story recency decayDays must be a finite number above 0.')
  }
  return weights
}

interface Ranked extends RelatedStory {
  readonly time: number
}

function signalScore(shared: number, signal: SharedSignalWeight): number {
  return Math.min(shared, signal.cap) * signal.weight
}

/**
 * Stories with a weighted signal first, highest score first; then the fallback, newest first:
 * stories filed under one of the article's sections, then every other story. Ties go to the newer
 * story, then to the lower article id compared as plain strings, so neither the order candidates
 * arrive in nor a locale can change the result.
 */
function byRank(left: Ranked, right: Ranked): number {
  return (
    basisOrder[left.basis] - basisOrder[right.basis] ||
    (left.basis === 'signals' ? right.score - left.score : 0) ||
    right.time - left.time ||
    (left.articleId < right.articleId ? -1 : left.articleId > right.articleId ? 1 : 0)
  )
}

function rank(
  candidates: readonly RelatedCandidate[],
  limit: number,
  weights: RelatedStoryWeights,
): RelatedStory[] {
  const timed = candidates.map((candidate) => {
    const time = Date.parse(candidate.publishedAt)
    if (Number.isNaN(time)) {
      throw new RangeError(
        `Related candidate ${candidate.articleId} has no valid publication time.`,
      )
    }
    return { candidate, time }
  })
  // Age counts back from the newest candidate, never from the clock: the same stories always
  // rank the same way (BR-07).
  const newest = timed.reduce((latest, { time }) => Math.max(latest, time), -Infinity)
  return timed
    .map(({ candidate, time }): Ranked => {
      const editorial =
        signalScore(candidate.sharedTerms, weights.sharedTerm) +
        signalScore(candidate.sharedSections, weights.sharedSection) +
        signalScore(candidate.sharedAuthors, weights.sharedAuthor)
      const ageDays = (newest - time) / dayMilliseconds
      const recency = weights.recency.weight * Math.exp(-ageDays / weights.recency.decayDays)
      return {
        articleId: candidate.articleId,
        basis: editorial > 0 ? 'signals' : candidate.sharedSections > 0 ? 'section' : 'recent',
        publishedAt: candidate.publishedAt,
        score: editorial + recency,
        slug: candidate.slug,
        time,
      }
    })
    .sort(byRank)
    .slice(0, limit)
    .map(({ time: _time, ...story }) => story)
}

/**
 * Chooses the related stories shown after an article (US-09, TS-03, BR-07). The candidates adapter
 * decides what readers may see; this service ranks what it returns with the weights in
 * related-weights.ts (OQ-07). A candidate scores each signal's weight times the items it shares,
 * up to the signal's cap, plus recency.
 */
export class RelatedStoriesService {
  private readonly weights: RelatedStoryWeights

  constructor(
    private readonly candidates: RelatedStoryCandidates,
    weights: RelatedStoryWeights = relatedStoryWeights,
  ) {
    this.weights = assertRelatedStoryWeights(weights)
  }

  /**
   * Up to `limit` related stories, best first. An empty list, never an error, when there is
   * nothing to relate: an unknown or hidden article, or no other publicly visible story.
   */
  async relatedTo(request: RelatedStoriesRequest): Promise<readonly RelatedStory[]> {
    const limit = request.limit ?? defaultRelatedStoryLimit
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > maxRelatedStoryLimit) {
      throw new RangeError(`A related-story selection holds 1 to ${maxRelatedStoryLimit} stories.`)
    }
    return rank(await this.candidates.candidatesFor(request.articleId), limit, this.weights)
  }
}

/**
 * Candidates read through the content repository, with visibility decided exactly as the reader
 * decides it (`listVisibleArticles`). It loads every article and link, so it suits the framework
 * fixture and tests; a PostgreSQL deployment uses `PostgresRelatedStories`, which the integration
 * suite holds to the same candidates.
 */
export class InMemoryRelatedStories implements RelatedStoryCandidates {
  constructor(private readonly repository: ContentRepository) {}

  async candidatesFor(articleId: string): Promise<readonly RelatedCandidate[]> {
    return this.repository.transaction(async (transaction) => {
      const visible = await listVisibleArticles(transaction)
      if (!visible.some(({ article }) => article.id === articleId)) return []
      const kinds = new Map(
        (await transaction.listTaxonomyTerms()).map(({ id, kind }) => [id, kind]),
      )
      const filed = new Map<string, string[]>()
      for (const link of await transaction.listArticleTaxonomies()) {
        filed.set(link.articleId, [...(filed.get(link.articleId) ?? []), link.taxonomyId])
      }
      const credited = async (id: string) =>
        new Set((await transaction.listArticleAuthors(id)).map((author) => author.id))
      const ownTerms = new Set(filed.get(articleId))
      const ownAuthors = await credited(articleId)
      const candidates: RelatedCandidate[] = []
      for (const { article } of visible) {
        if (article.id === articleId) continue
        const sharedKinds = (filed.get(article.id) ?? [])
          .filter((termId) => ownTerms.has(termId))
          .map((termId) => kinds.get(termId))
        const authors = [...(await credited(article.id))]
        candidates.push({
          articleId: article.id,
          // A visible article is a published one, which always has a publication time.
          publishedAt: article.publishedAt!,
          sharedAuthors: authors.filter((id) => ownAuthors.has(id)).length,
          sharedSections: sharedKinds.filter((kind) => kind === 'section').length,
          sharedTerms: sharedKinds.filter((kind) => kind === 'category' || kind === 'tag').length,
          slug: article.slug,
        })
      }
      return candidates
    })
  }
}
