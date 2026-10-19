import { isDeepStrictEqual } from 'node:util'

import { normalizeSlug, type Article } from '@/server/content/domain'
import {
  CURRENT_CONTENT_DOCUMENT_VERSION,
  parseMigratedContentDocument,
} from '@/server/content/document'
import { contentErrorCode } from '@/server/content/errors'
import type {
  Clock,
  ContentRepository,
  ContentTransaction,
  OriginalObjectStore,
} from '@/server/content/ports'
import { SectionService } from '@/server/content/sections'
import { ContentService, type CreateArticleInput } from '@/server/content/service'

import { renderIllustration } from './illustrations'
import { createLabMediaIfAbsent } from './media'
import { LabSeedLimits, type LabSeedTimeouts } from './limits'
import {
  labAuthors,
  labImages,
  labPreparedAt,
  labSections,
  labStories,
  labTopics,
  type LabImage,
  type LabStory,
} from './north-house'

export interface LabSeedTarget {
  /** Where media originals are stored; null when media storage is not configured. */
  readonly objects: OriginalObjectStore | null
  readonly repository: ContentRepository
}

export interface LabSeedReport {
  readonly authors: {
    readonly created: readonly string[]
    readonly existing: readonly string[]
    /** Authors whose slug already belongs to another author; no sample story credits them. */
    readonly slugInUse: readonly string[]
  }
  readonly images: {
    readonly created: readonly string[]
    readonly existing: readonly string[]
    /** Why images were not stored, when they were not. */
    readonly skipped: string | null
  }
  readonly sections: readonly string[]
  readonly stories: {
    readonly created: readonly string[]
    readonly existing: readonly string[]
    /** Stories an earlier run created but stopped before publishing; this run finished them. */
    readonly resumed: readonly string[]
    /** Stories whose slug already belongs to another article; they were left untouched. */
    readonly slugInUse: readonly string[]
  }
  readonly topics: {
    readonly created: readonly string[]
    /** Includes an existing tag that already had a sample topic's slug; it was reused as it is. */
    readonly existing: readonly string[]
  }
}

export { labSeedAllowed } from './environment.mjs'

const seedLockKey = 'magazine:lab-seed:north-house:v1'

export class LabSeedBusyError extends Error {
  constructor() {
    super('The lab seed is already running. Try again shortly.')
    this.name = 'LabSeedBusyError'
  }
}

export interface LabSeedHooks extends LabSeedTimeouts {
  /** An optional instrumentation barrier after reading an asset, while holding the seed lock. */
  readonly afterMediaCheck?: (id: string) => Promise<void>
}

function fixedClock(isoTimestamp: string): Clock {
  return { now: () => new Date(isoTimestamp) }
}

const renderedIllustrations = new Map<string, Uint8Array>()

function illustrationBytes(image: LabImage): Uint8Array {
  const cached = renderedIllustrations.get(image.id)
  if (cached) return cached
  const rendered = renderIllustration(image.illustration)
  renderedIllustrations.set(image.id, rendered)
  return rendered
}

export function labStorySlug(story: LabStory): string {
  return normalizeSlug(story.title)
}

/**
 * Topics are `tag` terms. Like sections, a topic that already exists, under its sample ID or as a
 * tag with its slug, is kept as it is and reused. Returns each sample slug's term ID.
 */
async function ensureTopics(repository: ContentRepository) {
  return repository.transaction(async (transaction) => {
    const terms = await transaction.listTaxonomyTerms()
    const ids = new Map<string, string>()
    const created: string[] = []
    const existing: string[] = []
    for (const topic of labTopics) {
      const current =
        terms.find(({ id }) => id === topic.id) ??
        terms.find(({ kind, slug }) => kind === 'tag' && slug === topic.slug)
      if (current) {
        existing.push(topic.slug)
        ids.set(topic.slug, current.id)
        continue
      }
      await transaction.saveTaxonomyTerm({
        createdAt: labPreparedAt,
        id: topic.id,
        kind: 'tag',
        name: topic.name,
        slug: topic.slug,
        updatedAt: labPreparedAt,
      })
      created.push(topic.slug)
      ids.set(topic.slug, topic.id)
    }
    // A new topic or author has a public page, even before any story is filed under it.
    if (created.length > 0) transaction.recordPublicationChange()
    return { created, existing, ids }
  })
}

/**
 * An author that already exists under its sample ID is kept as it is. A sample author whose slug
 * belongs to another author is left out, so no sample story is credited to that author. Returns
 * each sample slug's author ID, or null for one that was left out.
 */
async function ensureAuthors(repository: ContentRepository) {
  return repository.transaction(async (transaction) => {
    const authors = await transaction.listAuthors()
    const ids = new Map<string, string | null>()
    const created: string[] = []
    const existing: string[] = []
    const slugInUse: string[] = []
    for (const author of labAuthors) {
      if (authors.some(({ id }) => id === author.id)) {
        existing.push(author.slug)
        ids.set(author.slug, author.id)
      } else if (authors.some(({ slug }) => slug === author.slug)) {
        slugInUse.push(author.slug)
        ids.set(author.slug, null)
      } else {
        await transaction.saveAuthor({
          bio: author.bio,
          createdAt: labPreparedAt,
          displayName: author.name,
          id: author.id,
          slug: author.slug,
          updatedAt: labPreparedAt,
        })
        created.push(author.slug)
        ids.set(author.slug, author.id)
      }
    }
    if (created.length > 0) transaction.recordPublicationChange()
    return { created, existing, ids, slugInUse }
  })
}

/** Where the seed files a story and whom it credits, as stored IDs. */
interface StoryFiling {
  /** The authors to credit, in byline order. */
  readonly authorIds: readonly string[]
  readonly sectionId: string
  /** The topic terms, in the order the story lists them. */
  readonly topicIds: readonly string[]
}

function storyFiling(
  story: LabStory,
  ids: {
    readonly authors: ReadonlyMap<string, string | null>
    readonly sections: ReadonlyMap<string, string>
    readonly topics: ReadonlyMap<string, string>
  },
): StoryFiling {
  const sectionId = ids.sections.get(story.section)
  if (!sectionId) throw new Error(`Lab story ${story.id} names an unknown section.`)
  const authorIds = story.authors.map((slug) => {
    const id = ids.authors.get(slug)
    if (id === undefined) throw new Error(`Lab story ${story.id} credits an unknown author.`)
    return id
  })
  const topicIds = story.topics.map((slug) => {
    const id = ids.topics.get(slug)
    if (!id) throw new Error(`Lab story ${story.id} names an unknown topic.`)
    return id
  })
  return {
    authorIds: authorIds.filter((id) => id !== null),
    sectionId,
    topicIds: [...new Set(topicIds)],
  }
}

/** The seed's first draft of a story, created under the seed's own idempotency key. */
function labStoryDraft(story: LabStory): CreateArticleInput {
  return {
    dek: story.dek,
    document: {
      articleId: story.id,
      document: { content: story.blocks, type: 'doc' },
      migrationProvenance: [],
      schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
      title: story.title,
    },
    id: story.id,
    idempotencyKey: `lab-seed:create:${story.id}`,
    slug: labStorySlug(story),
    title: story.title,
  }
}

/**
 * A repository whose transactions all join one that is already open, so everything the content
 * services write there commits, or rolls back, together.
 */
function joinTransaction(transaction: ContentTransaction): ContentRepository {
  const unavailable = () => Promise.reject(new Error('Only a transaction can join an open one.'))
  return {
    readPublicationVersion: unavailable,
    transaction: (work) => work(transaction),
    tryExclusive: unavailable,
  }
}

/**
 * Whether an existing sample article is a story an earlier run created and then stopped before
 * publishing, untouched since. The seed used to commit each step on its own, so such a run left
 * the seed's own first draft, filed under its section at most. Any other article, or any change to
 * that draft, is the owner's.
 */
async function isUnfinishedLabStory(
  transaction: ContentTransaction,
  article: Article,
  draft: CreateArticleInput,
  filing: StoryFiling,
): Promise<boolean> {
  // Every change to an article raises its version, so at version 1 it is as it was created.
  if (
    article.version !== 1 ||
    article.status !== 'draft' ||
    article.publishedAt !== null ||
    article.slug !== draft.slug ||
    !(await transaction.getIdempotency('article.create', draft.idempotencyKey))
  ) {
    return false
  }
  const revisions = await transaction.listRevisions(article.id)
  const [revision] = revisions
  if (
    revisions.length !== 1 ||
    revision?.id !== article.currentDraftRevisionId ||
    revision.title !== draft.title ||
    revision.dek !== draft.dek ||
    !isDeepStrictEqual(revision.document, parseMigratedContentDocument(draft.document)) ||
    (await transaction.listAutosaves(article.id)).length > 0
  ) {
    return false
  }
  // No byline or topic, and no section but the seed's, which its audit trail shows it assigned.
  const links = (await transaction.listArticleTaxonomies()).filter(
    ({ articleId }) => articleId === article.id,
  )
  const assignments = (await transaction.listAuditEvents(article.id)).filter(
    ({ action }) => action === 'article.section-assigned',
  )
  return (
    links.every(({ taxonomyId }) => taxonomyId === filing.sectionId) &&
    links.length === assignments.length &&
    (await transaction.listArticleAuthors(article.id)).length === 0
  )
}

/** Credits a story and files it under its topics, after its section. */
async function creditAndFileStory(
  transaction: ContentTransaction,
  articleId: string,
  filing: StoryFiling,
): Promise<void> {
  // Hold the article row, as replacing a byline requires.
  await transaction.getArticleForUpdate(articleId)
  if (filing.authorIds.length > 0) {
    await transaction.setArticleAuthors(articleId, filing.authorIds)
  }
  const links = (await transaction.listArticleTaxonomies()).filter(
    (link) => link.articleId === articleId,
  )
  let position = Math.max(-1, ...links.map((link) => link.position))
  for (const taxonomyId of filing.topicIds) {
    if (links.some((link) => link.taxonomyId === taxonomyId)) continue
    position += 1
    await transaction.saveArticleTaxonomy({ articleId, position, taxonomyId })
  }
}

/**
 * Creates, files, credits and publishes a story in one transaction, so a run that fails at any
 * step leaves nothing of it behind. An existing article is left as it is, unless it is a story an
 * earlier run left unfinished: that one gets its remaining steps.
 */
async function seedStory(
  repository: ContentRepository,
  story: LabStory,
  filing: StoryFiling,
): Promise<'created' | 'existing' | 'resumed' | 'slug-in-use'> {
  const draft = labStoryDraft(story)
  try {
    return await repository.transaction(async (transaction) => {
      const existing = await transaction.getArticle(story.id)
      if (existing && !(await isUnfinishedLabStory(transaction, existing, draft, filing))) {
        return 'existing'
      }
      const joined = joinTransaction(transaction)
      const clock = fixedClock(story.publishedAt)
      const content = new ContentService(joined, clock)
      // For an unfinished story, this replays its creation and writes nothing.
      const created = await content.createArticle(draft)
      await new SectionService(joined, clock).assignSection({
        articleId: story.id,
        sectionId: filing.sectionId,
      })
      await creditAndFileStory(transaction, story.id, filing)
      await content.publish({
        articleId: story.id,
        expectedVersion: created.article.version,
        idempotencyKey: `lab-seed:publish:${story.id}`,
        revisionId: created.revision.id,
      })
      return existing ? 'resumed' : 'created'
    })
  } catch (error) {
    // Only creation can collide, and the whole transaction has rolled back.
    if (contentErrorCode(error) === 'duplicate_slug') return 'slug-in-use'
    throw error
  }
}

/**
 * Seeds the North House sample magazine through the content services. It is idempotent: sections,
 * topics, authors, images, and stories that already exist are kept as they are, including any
 * owner edits. Each story is created, filed, credited and published in one transaction, so a failed
 * run leaves no half-made story. A story an earlier seed left unfinished is finished, but only
 * while it is still exactly as that run left it.
 */
export async function seedLabContent(
  target: LabSeedTarget,
  hooks: LabSeedHooks = {},
): Promise<LabSeedReport> {
  const limits = new LabSeedLimits(hooks)
  const result = await target.repository.tryExclusive(
    seedLockKey,
    (repository) =>
      seedLockedContent({ ...target, repository: limits.repository(repository) }, hooks, limits),
    limits.database,
  )
  if (!result.acquired) throw new LabSeedBusyError()
  return result.value
}

async function seedLockedContent(
  target: LabSeedTarget,
  hooks: LabSeedHooks,
  limits: LabSeedLimits,
): Promise<LabSeedReport> {
  const sections = new SectionService(target.repository, fixedClock(labPreparedAt))
  const sectionIds = new Map<string, string>()
  for (const section of labSections) {
    limits.check()
    sectionIds.set(section.slug, (await sections.ensureSection(section)).id)
  }
  limits.check()
  const topics = await ensureTopics(target.repository)
  limits.check()
  const authors = await ensureAuthors(target.repository)

  const images = { created: [] as string[], existing: [] as string[] }
  if (target.objects) {
    for (const image of labImages) {
      limits.check()
      const created = await createLabMediaIfAbsent({
        limits,
        repository: target.repository,
        objects: target.objects,
        image,
        body: () => illustrationBytes(image),
        ...(hooks.afterMediaCheck ? { afterCheck: hooks.afterMediaCheck } : {}),
      })
      images[created ? 'created' : 'existing'].push(image.id)
    }
  }

  const stories = {
    created: [] as string[],
    existing: [] as string[],
    resumed: [] as string[],
    slugInUse: [] as string[],
  }
  for (const story of labStories) {
    limits.check()
    const filing = storyFiling(story, {
      authors: authors.ids,
      sections: sectionIds,
      topics: topics.ids,
    })
    const outcome = await seedStory(target.repository, story, filing)
    const slug = labStorySlug(story)
    if (outcome === 'created') stories.created.push(slug)
    else if (outcome === 'existing') stories.existing.push(slug)
    else if (outcome === 'resumed') stories.resumed.push(slug)
    else stories.slugInUse.push(slug)
  }

  limits.check()
  return {
    authors: {
      created: authors.created,
      existing: authors.existing,
      slugInUse: authors.slugInUse,
    },
    images: {
      ...images,
      skipped: target.objects ? null : 'Media storage is not configured, so no images were stored.',
    },
    sections: labSections.map(({ slug }) => slug),
    stories,
    topics: { created: topics.created, existing: topics.existing },
  }
}
