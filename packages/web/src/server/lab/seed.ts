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
  labImages,
  labPreparedAt,
  labSections,
  labStories,
  type LabImage,
  type LabStory,
} from './north-house'

export interface LabSeedTarget {
  /** Where media originals are stored; null when media storage is not configured. */
  readonly objects: OriginalObjectStore | null
  readonly repository: ContentRepository
}

export interface LabSeedReport {
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

async function seedStory(
  target: LabSeedTarget,
  story: LabStory,
  sectionId: string,
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
  await sections.assignSection({ articleId: story.id, sectionId })
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
 * images, and stories that already exist are kept as they are, including any owner edits.
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
    const sectionId = sectionIds.get(story.section)
    if (!sectionId) throw new Error(`Lab story ${story.id} names an unknown section.`)
    const outcome = await seedStory(target, story, sectionId)
    const slug = labStorySlug(story)
    if (outcome === 'created') stories.created.push(slug)
    else if (outcome === 'existing') stories.existing.push(slug)
    else stories.slugInUse.push(slug)
  }

  limits.check()
  return {
    images: {
      ...images,
      skipped: target.objects ? null : 'Media storage is not configured, so no images were stored.',
    },
    sections: labSections.map(({ slug }) => slug),
    stories,
  }
}
