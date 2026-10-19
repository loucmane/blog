import { normalizeSlug } from '@/server/content/domain'
import { CURRENT_CONTENT_DOCUMENT_VERSION } from '@/server/content/document'
import { contentErrorCode } from '@/server/content/errors'
import type { Clock, ContentRepository, OriginalObjectStore } from '@/server/content/ports'
import { SectionService } from '@/server/content/sections'
import { ContentService } from '@/server/content/service'

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

/** Where a new story is filed and whom it credits, as stored IDs. */
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

/** Credits a story the seed has just created and files it under its topics, after its section. */
async function creditAndFileStory(
  repository: ContentRepository,
  articleId: string,
  filing: StoryFiling,
): Promise<void> {
  await repository.transaction(async (transaction) => {
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
    // Like assigning a section, in case readers can already see the story.
    transaction.recordPublicationChange()
  })
}

async function seedStory(
  target: LabSeedTarget,
  story: LabStory,
  filing: StoryFiling,
): Promise<'created' | 'existing' | 'slug-in-use'> {
  const sections = new SectionService(target.repository, fixedClock(story.publishedAt))
  const existing = await target.repository.transaction((transaction) =>
    transaction.getArticle(story.id),
  )
  if (existing) {
    return 'existing'
  }
  const content = new ContentService(target.repository, fixedClock(story.publishedAt))
  let created: Awaited<ReturnType<ContentService['createArticle']>>
  try {
    created = await content.createArticle({
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
    })
  } catch (error) {
    if (contentErrorCode(error) === 'duplicate_slug') return 'slug-in-use'
    throw error
  }
  await sections.assignSection({ articleId: story.id, sectionId: filing.sectionId })
  await creditAndFileStory(target.repository, story.id, filing)
  await content.publish({
    articleId: story.id,
    expectedVersion: created.article.version,
    idempotencyKey: `lab-seed:publish:${story.id}`,
    revisionId: created.revision.id,
  })
  return 'created'
}

/**
 * Seeds the North House sample magazine through the content services. It is idempotent: sections,
 * topics, authors, images, and stories that already exist are kept as they are, including any
 * owner edits. Bylines and topics are written only for stories created in the same run.
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

  const stories = { created: [] as string[], existing: [] as string[], slugInUse: [] as string[] }
  for (const story of labStories) {
    limits.check()
    const filing = storyFiling(story, {
      authors: authors.ids,
      sections: sectionIds,
      topics: topics.ids,
    })
    const outcome = await seedStory(target, story, filing)
    const slug = labStorySlug(story)
    if (outcome === 'created') stories.created.push(slug)
    else if (outcome === 'existing') stories.existing.push(slug)
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
