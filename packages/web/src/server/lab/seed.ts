import { normalizeSlug } from '@/server/content/domain'
import { CURRENT_CONTENT_DOCUMENT_VERSION } from '@/server/content/document'
import { contentErrorCode } from '@/server/content/errors'
import { MediaOriginalService } from '@/server/content/media'
import type { Clock, ContentRepository, OriginalObjectStore } from '@/server/content/ports'
import { SectionService } from '@/server/content/sections'
import { ContentService } from '@/server/content/service'

import { renderIllustration } from './illustrations'
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
export async function seedLabContent(target: LabSeedTarget): Promise<LabSeedReport> {
  const sections = new SectionService(target.repository, fixedClock(labPreparedAt))
  const sectionIds = new Map<string, string>()
  for (const section of labSections) {
    sectionIds.set(section.slug, (await sections.ensureSection(section)).id)
  }

  const images = { created: [] as string[], existing: [] as string[] }
  if (target.objects) {
    const media = new MediaOriginalService(
      target.repository,
      target.objects,
      fixedClock(labPreparedAt),
    )
    for (const image of labImages) {
      const existing = await target.repository.transaction((transaction) =>
        transaction.getMediaAsset(image.id),
      )
      if (existing) {
        images.existing.push(image.id)
        continue
      }
      await media.store({
        alt: image.alt,
        animated: false,
        body: illustrationBytes(image),
        caption: image.caption,
        contentType: 'image/png',
        creditName: image.creditName,
        focalPoint: image.focalPoint,
        height: image.illustration.height,
        id: image.id,
        width: image.illustration.width,
      })
      images.created.push(image.id)
    }
  }

  const stories = { created: [] as string[], existing: [] as string[], slugInUse: [] as string[] }
  for (const story of labStories) {
    const sectionId = sectionIds.get(story.section)
    if (!sectionId) throw new Error(`Lab story ${story.id} names an unknown section.`)
    const outcome = await seedStory(target, story, sectionId)
    const slug = labStorySlug(story)
    if (outcome === 'created') stories.created.push(slug)
    else if (outcome === 'existing') stories.existing.push(slug)
    else stories.slugInUse.push(slug)
  }

  return {
    images: {
      ...images,
      skipped: target.objects ? null : 'Media storage is not configured, so no images were stored.',
    },
    sections: labSections.map(({ slug }) => slug),
    stories,
  }
}
