import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  articleStatuses,
  outboxStatuses,
  publicationJobStatuses,
  type Article,
  type ArticleRevision,
  type ArticleTaxonomy,
  type AuditEvent,
  type AuthorProfile,
  type DraftAutosave,
  type MediaAsset,
  type MediaRendition,
  type OutboxEvent,
  type PublicationJob,
  type PublicationSettings,
  type ReusableBlock,
  type ReusableBlockRevision,
  type SlugRedirect,
  type TaxonomyTerm,
} from './domain'
import { parseMigratedContentDocument } from './document'
import { ImportCollisionError } from './errors'
import type { ContentRepository, OriginalObjectStore } from './ports'

export const PORTABLE_CONTENT_FORMAT = 'owner-operated-magazine-content'
export const PORTABLE_CONTENT_VERSION = 1

export interface PortableMediaObject {
  readonly bytes: number
  readonly key: string
  readonly kind: 'original' | 'rendition'
  readonly mediaId: string
  readonly sha256: string
}

export interface PortableContentData {
  readonly articleTaxonomies: readonly ArticleTaxonomy[]
  readonly articles: readonly Article[]
  readonly auditEvents: readonly AuditEvent[]
  readonly authors: readonly AuthorProfile[]
  readonly autosaves: readonly DraftAutosave[]
  readonly mediaAssets: readonly MediaAsset[]
  readonly mediaRenditions: readonly MediaRendition[]
  readonly outboxEvents: readonly OutboxEvent[]
  readonly publicationJobs: readonly PublicationJob[]
  readonly publicationSettings: PublicationSettings | null
  readonly redirects: readonly SlugRedirect[]
  readonly reusableBlockRevisions: readonly ReusableBlockRevision[]
  readonly reusableBlocks: readonly ReusableBlock[]
  readonly revisions: readonly ArticleRevision[]
  readonly taxonomies: readonly TaxonomyTerm[]
}

export interface PortableContentBundle {
  readonly data: PortableContentData
  readonly digest: string
  readonly exportedAt: string
  readonly format: typeof PORTABLE_CONTENT_FORMAT
  readonly media: { readonly objects: readonly PortableMediaObject[] }
  readonly version: typeof PORTABLE_CONTENT_VERSION
}

export type PortableContentInspection =
  | {
      readonly bundle: PortableContentBundle
      readonly issues: readonly []
      readonly status: 'valid'
    }
  | { readonly issues: readonly string[]; readonly original: unknown; readonly status: 'invalid' }

const id = z.string().trim().min(1).max(200)
const timestamp = z.string().datetime({ offset: true })
const nullableTimestamp = timestamp.nullable()
const sha256 = z.string().regex(/^[0-9a-f]{64}$/)
const status = z.enum(articleStatuses)

const articleSchema = z
  .object({
    createdAt: timestamp,
    currentDraftRevisionId: id,
    deletedAt: nullableTimestamp,
    dek: z.string(),
    id,
    preDeleteStatus: status.nullable(),
    publishedAt: nullableTimestamp,
    publishedRevisionId: id.nullable(),
    scheduledAt: nullableTimestamp,
    scheduledRevisionId: id.nullable(),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    status,
    title: z.string().min(1),
    updatedAt: timestamp,
    version: z.number().int().positive(),
  })
  .strict()
const revisionSchema = z
  .object({
    articleId: id,
    createdAt: timestamp,
    dek: z.string().optional(),
    document: z.unknown(),
    id,
    revisionNumber: z.number().int().positive(),
    title: z.string().min(1).max(300).optional(),
  })
  .strict()
const autosaveSchema = z
  .object({
    articleId: id,
    articleVersion: z.number().int().positive(),
    createdAt: timestamp,
    id,
    idempotencyKey: id,
    revisionId: id,
  })
  .strict()
const redirectSchema = z
  .object({ articleId: id, createdAt: timestamp, fromSlug: id, id, toSlug: id })
  .strict()
const jobSchema = z
  .object({
    articleId: id,
    attempt: z.number().int().nonnegative(),
    claimedBy: id.nullable(),
    createdAt: timestamp,
    id,
    idempotencyKey: id,
    leaseUntil: nullableTimestamp,
    previousStatus: z.enum(['draft', 'published', 'unpublished']).optional(),
    revisionId: id,
    runAt: timestamp,
    status: z.enum(publicationJobStatuses),
    timeZone: z.string().min(1).max(100).optional(),
    updatedAt: timestamp,
  })
  .strict()
  .superRefine((job, context) => {
    const claimed = job.status === 'claimed'
    if (claimed && (!job.claimedBy || !job.leaseUntil || job.attempt < 1)) {
      context.addIssue({ code: 'custom', message: 'claimed job requires an owner and lease' })
    }
    if (!claimed && (job.claimedBy !== null || job.leaseUntil !== null)) {
      context.addIssue({ code: 'custom', message: 'only claimed jobs may retain a lease' })
    }
  })
const outboxSchema = z
  .object({
    aggregateId: id,
    attempts: z.number().int().nonnegative(),
    createdAt: timestamp,
    id,
    lastError: z.string().nullable(),
    payload: z.record(z.string(), z.unknown()),
    status: z.enum(outboxStatuses),
    type: id,
    updatedAt: timestamp,
  })
  .strict()
const auditValue = z.union([z.string(), z.number(), z.boolean(), z.null()])
const auditSchema = z
  .object({
    action: id,
    actorId: id.nullable(),
    articleId: id,
    createdAt: timestamp,
    id,
    metadata: z.record(z.string(), auditValue),
  })
  .strict()
const authorSchema = z
  .object({
    bio: z.string(),
    createdAt: timestamp,
    displayName: z.string().min(1),
    id,
    slug: id,
    updatedAt: timestamp,
  })
  .strict()
const taxonomySchema = z
  .object({
    createdAt: timestamp,
    id,
    kind: z.enum(['category', 'section', 'tag']),
    name: z.string().min(1),
    slug: id,
    updatedAt: timestamp,
  })
  .strict()
const articleTaxonomySchema = z
  .object({ articleId: id, position: z.number().int().nonnegative(), taxonomyId: id })
  .strict()
const settingsSchema = z
  .object({
    createdAt: timestamp,
    defaultLocale: id,
    id,
    ownerTimeZone: id,
    updatedAt: timestamp,
    version: z.number().int().positive(),
  })
  .strict()
const mediaAssetSchema = z
  .object({
    alt: z.string().min(1),
    bytes: z.number().int().nonnegative(),
    caption: z.string(),
    contentType: id,
    createdAt: timestamp,
    creditName: z.string().min(1),
    creditUrl: z.string().url().nullable(),
    focalX: z.number().min(0).max(1),
    focalY: z.number().min(0).max(1),
    height: z.number().int().positive().nullable(),
    id,
    originalKey: id,
    originalSha256: sha256,
    updatedAt: timestamp,
    width: z.number().int().positive().nullable(),
  })
  .strict()
const mediaRenditionSchema = z
  .object({
    bytes: z.number().int().nonnegative(),
    contentType: id,
    createdAt: timestamp,
    height: z.number().int().positive(),
    id,
    mediaId: id,
    objectKey: id,
    sha256,
    width: z.number().int().positive(),
  })
  .strict()
const reusableBlockSchema = z
  .object({
    createdAt: timestamp,
    currentRevisionId: id,
    id,
    kind: id,
    name: z.string().min(1),
    updatedAt: timestamp,
    version: z.number().int().positive(),
  })
  .strict()
const reusableBlockRevisionSchema = z
  .object({
    blockId: id,
    createdAt: timestamp,
    document: z.unknown(),
    id,
    revisionNumber: z.number().int().positive(),
  })
  .strict()
const mediaObjectSchema = z
  .object({
    bytes: z.number().int().nonnegative(),
    key: id,
    kind: z.enum(['original', 'rendition']),
    mediaId: id,
    sha256,
  })
  .strict()

const unsignedBundleSchema = z
  .object({
    data: z
      .object({
        articleTaxonomies: z.array(articleTaxonomySchema),
        articles: z.array(articleSchema),
        auditEvents: z.array(auditSchema),
        authors: z.array(authorSchema),
        autosaves: z.array(autosaveSchema),
        mediaAssets: z.array(mediaAssetSchema),
        mediaRenditions: z.array(mediaRenditionSchema),
        outboxEvents: z.array(outboxSchema),
        publicationJobs: z.array(jobSchema),
        publicationSettings: settingsSchema.nullable(),
        redirects: z.array(redirectSchema),
        reusableBlockRevisions: z.array(reusableBlockRevisionSchema),
        reusableBlocks: z.array(reusableBlockSchema),
        revisions: z.array(revisionSchema),
        taxonomies: z.array(taxonomySchema),
      })
      .strict(),
    exportedAt: timestamp,
    format: z.literal(PORTABLE_CONTENT_FORMAT),
    media: z.object({ objects: z.array(mediaObjectSchema) }).strict(),
    version: z.literal(PORTABLE_CONTENT_VERSION),
  })
  .strict()
const bundleSchema = unsignedBundleSchema.extend({ digest: sha256 }).strict()

function normalizePortableBundle(bundle: z.infer<typeof bundleSchema>): PortableContentBundle {
  const articles = new Map(bundle.data.articles.map((article) => [article.id, article]))
  const fallbackTimeZone = bundle.data.publicationSettings?.ownerTimeZone ?? 'UTC'
  return {
    ...bundle,
    data: {
      ...bundle.data,
      publicationJobs: bundle.data.publicationJobs.map((job) => ({
        ...job,
        previousStatus:
          job.previousStatus ??
          (articles.get(job.articleId)?.status === 'published'
            ? 'published'
            : articles.get(job.articleId)?.status === 'unpublished'
              ? 'unpublished'
              : 'draft'),
        timeZone: job.timeZone ?? fallbackTimeZone,
      })),
    },
  } as unknown as PortableContentBundle
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    )
  }
  return value
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function digest(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex')
}

function sortById<T extends { readonly id: string }>(values: readonly T[]): readonly T[] {
  return [...values].sort((left, right) => left.id.localeCompare(right.id))
}

function uniqueIds(values: readonly { readonly id: string }[], label: string, issues: string[]) {
  const seen = new Set<string>()
  for (const value of values) {
    if (seen.has(value.id)) issues.push(`${label} contains duplicate id ${value.id}`)
    seen.add(value.id)
  }
}

function validateRelationships(bundle: PortableContentBundle, issues: string[]) {
  const articles = new Map(bundle.data.articles.map((article) => [article.id, article]))
  const articleIds = new Set(articles.keys())
  const revisions = new Map(bundle.data.revisions.map((revision) => [revision.id, revision]))
  const taxonomyIds = new Set(bundle.data.taxonomies.map(({ id: taxonomyId }) => taxonomyId))
  const mediaIds = new Set(bundle.data.mediaAssets.map(({ id: mediaId }) => mediaId))
  const blockIds = new Set(bundle.data.reusableBlocks.map(({ id: blockId }) => blockId))
  const blockRevisions = new Map(
    bundle.data.reusableBlockRevisions.map((revision) => [revision.id, revision]),
  )

  for (const article of bundle.data.articles) {
    const pointers = [
      ['currentDraftRevisionId', article.currentDraftRevisionId],
      ['publishedRevisionId', article.publishedRevisionId],
      ['scheduledRevisionId', article.scheduledRevisionId],
    ] as const
    for (const [field, revisionId] of pointers) {
      if (revisionId === null) continue
      const revision = revisions.get(revisionId)
      if (!revision || revision.articleId !== article.id) {
        issues.push(`article ${article.id} has invalid ${field} ${revisionId}`)
      }
    }
    const activeJobs = bundle.data.publicationJobs.filter(
      (job) =>
        job.articleId === article.id && (job.status === 'pending' || job.status === 'claimed'),
    )
    if (article.status === 'scheduled' && activeJobs.length !== 1) {
      issues.push(`scheduled article ${article.id} must have exactly one active publication job`)
    }
    if (
      article.status === 'scheduled' &&
      (article.scheduledAt === null || article.scheduledRevisionId === null)
    ) {
      issues.push(`scheduled article ${article.id} is missing schedule metadata`)
    }
    if (
      article.status !== 'scheduled' &&
      (article.scheduledAt !== null || article.scheduledRevisionId !== null)
    ) {
      issues.push(`non-scheduled article ${article.id} retains schedule metadata`)
    }
    if ((article.publishedAt === null) !== (article.publishedRevisionId === null)) {
      issues.push(`article ${article.id} has incomplete published revision metadata`)
    }
    if (
      article.status === 'published' &&
      (article.publishedAt === null || article.publishedRevisionId === null)
    ) {
      issues.push(`published article ${article.id} has no published revision`)
    }
    if (article.status === 'scheduled' && activeJobs.length === 1) {
      const activeJob = activeJobs[0]!
      if (
        activeJob.revisionId !== article.scheduledRevisionId ||
        activeJob.runAt !== article.scheduledAt
      ) {
        issues.push(`scheduled article ${article.id} does not match its active publication job`)
      }
      if (
        activeJob.previousStatus === 'published' &&
        (article.publishedAt === null || article.publishedRevisionId === null)
      ) {
        issues.push(`scheduled article ${article.id} cannot restore published visibility`)
      }
    }
  }
  for (const revision of bundle.data.revisions) {
    if (!articleIds.has(revision.articleId)) {
      issues.push(`revision ${revision.id} references missing article ${revision.articleId}`)
    }
    try {
      const document = parseMigratedContentDocument(revision.document)
      if (document.articleId !== revision.articleId) {
        issues.push(`revision ${revision.id} document identity does not match its article`)
      }
    } catch (error) {
      issues.push(`revision ${revision.id} document is invalid: ${String(error)}`)
    }
  }
  for (const link of bundle.data.articleTaxonomies) {
    if (!articleIds.has(link.articleId) || !taxonomyIds.has(link.taxonomyId)) {
      issues.push(`taxonomy link ${link.articleId}:${link.taxonomyId} is unresolved`)
    }
  }
  for (const autosave of bundle.data.autosaves) {
    const revision = revisions.get(autosave.revisionId)
    if (
      !articleIds.has(autosave.articleId) ||
      !revision ||
      revision.articleId !== autosave.articleId
    ) {
      issues.push(`autosave ${autosave.id} is unresolved`)
    }
  }
  for (const job of bundle.data.publicationJobs) {
    const article = articles.get(job.articleId)
    const revision = revisions.get(job.revisionId)
    if (!article) {
      issues.push(`publication job ${job.id} references missing article ${job.articleId}`)
      continue
    }
    if (!revision || revision.articleId !== article.id) {
      issues.push(`publication job ${job.id} has invalid revision ${job.revisionId}`)
    }
    if (
      (job.status === 'pending' || job.status === 'claimed') &&
      (article.status !== 'scheduled' || article.scheduledRevisionId !== job.revisionId)
    ) {
      issues.push(`active publication job ${job.id} does not match its scheduled article`)
    }
  }
  for (const rendition of bundle.data.mediaRenditions) {
    if (!mediaIds.has(rendition.mediaId))
      issues.push(`rendition ${rendition.id} has no media asset`)
  }
  for (const block of bundle.data.reusableBlocks) {
    const revision = blockRevisions.get(block.currentRevisionId)
    if (!revision || revision.blockId !== block.id) {
      issues.push(`reusable block ${block.id} has an invalid current revision`)
    }
  }
  for (const revision of bundle.data.reusableBlockRevisions) {
    if (!blockIds.has(revision.blockId)) {
      issues.push(`reusable block revision ${revision.id} has no block`)
    }
    try {
      parseMigratedContentDocument(revision.document)
    } catch (error) {
      issues.push(`reusable block revision ${revision.id} document is invalid: ${String(error)}`)
    }
  }

  const expectedMedia = [
    ...bundle.data.mediaAssets.map((asset) => ({
      bytes: asset.bytes,
      key: asset.originalKey,
      kind: 'original' as const,
      mediaId: asset.id,
      sha256: asset.originalSha256,
    })),
    ...bundle.data.mediaRenditions.map((rendition) => ({
      bytes: rendition.bytes,
      key: rendition.objectKey,
      kind: 'rendition' as const,
      mediaId: rendition.mediaId,
      sha256: rendition.sha256,
    })),
  ].sort((left, right) => left.key.localeCompare(right.key))
  if (canonicalJson(expectedMedia) !== canonicalJson(bundle.media.objects)) {
    issues.push('media manifest does not exactly match media metadata')
  }
}

export async function createPortableContentBundle(
  repository: ContentRepository,
  exportedAt: string,
): Promise<PortableContentBundle> {
  const data = await repository.transaction(async (transaction): Promise<PortableContentData> => ({
    articleTaxonomies: await transaction.listArticleTaxonomies(),
    articles: sortById(await transaction.listArticles()),
    auditEvents: sortById(await transaction.listAuditEvents()),
    authors: sortById(await transaction.listAuthors()),
    autosaves: sortById(
      (
        await Promise.all(
          (await transaction.listArticles()).map(({ id: articleId }) =>
            transaction.listAutosaves(articleId),
          ),
        )
      ).flat(),
    ),
    mediaAssets: sortById(await transaction.listMediaAssets()),
    mediaRenditions: sortById(await transaction.listMediaRenditions()),
    outboxEvents: sortById(await transaction.listOutboxEvents()),
    publicationJobs: sortById(await transaction.listPublicationJobs()),
    publicationSettings: await transaction.getPublicationSettings(),
    redirects: sortById(await transaction.listRedirects()),
    reusableBlockRevisions: sortById(await transaction.listReusableBlockRevisions()),
    reusableBlocks: sortById(await transaction.listReusableBlocks()),
    revisions: sortById(await transaction.listRevisions()),
    taxonomies: sortById(await transaction.listTaxonomyTerms()),
  }))
  const media = {
    objects: [
      ...data.mediaAssets.map((asset) => ({
        bytes: asset.bytes,
        key: asset.originalKey,
        kind: 'original' as const,
        mediaId: asset.id,
        sha256: asset.originalSha256,
      })),
      ...data.mediaRenditions.map((rendition) => ({
        bytes: rendition.bytes,
        key: rendition.objectKey,
        kind: 'rendition' as const,
        mediaId: rendition.mediaId,
        sha256: rendition.sha256,
      })),
    ].sort((left, right) => left.key.localeCompare(right.key)),
  }
  const unsigned = {
    data,
    exportedAt,
    format: PORTABLE_CONTENT_FORMAT,
    media,
    version: PORTABLE_CONTENT_VERSION,
  } as const
  return { ...unsigned, digest: digest(unsigned) }
}

export function inspectPortableContentBundle(value: unknown): PortableContentInspection {
  const original = structuredClone(value)
  const parsed = bundleSchema.safeParse(value)
  if (!parsed.success) {
    return {
      issues: parsed.error.issues.map(
        (issue) => `${issue.path.length > 0 ? issue.path.join('.') : 'bundle'}: ${issue.message}`,
      ),
      original,
      status: 'invalid',
    }
  }
  const { digest: claimedDigest } = parsed.data
  const { digest: _originalDigest, ...unsigned } = original as Record<string, unknown>
  const issues: string[] = []
  if (digest(unsigned) !== claimedDigest)
    issues.push('bundle digest does not match canonical content')
  const bundle = normalizePortableBundle(parsed.data)
  for (const [label, values] of [
    ['articles', bundle.data.articles],
    ['revisions', bundle.data.revisions],
    ['autosaves', bundle.data.autosaves],
    ['redirects', bundle.data.redirects],
    ['media assets', bundle.data.mediaAssets],
    ['media renditions', bundle.data.mediaRenditions],
    ['publication jobs', bundle.data.publicationJobs],
    ['outbox events', bundle.data.outboxEvents],
    ['audit events', bundle.data.auditEvents],
  ] as const) {
    uniqueIds(values, label, issues)
  }
  validateRelationships(bundle, issues)
  return issues.length > 0
    ? { issues, original, status: 'invalid' }
    : { bundle, issues: [], status: 'valid' }
}

async function existingCollisions(repository: ContentRepository): Promise<readonly string[]> {
  return repository.transaction(async (transaction) => {
    const collections = await Promise.all([
      transaction.listArticles(),
      transaction.listAuthors(),
      transaction.listAuditEvents(),
      transaction.listMediaAssets(),
      transaction.listMediaRenditions(),
      transaction.listOutboxEvents(),
      transaction.listPublicationJobs(),
      transaction.listRedirects(),
      transaction.listReusableBlockRevisions(),
      transaction.listReusableBlocks(),
      transaction.listRevisions(),
      transaction.listTaxonomyTerms(),
    ])
    const ids = collections.flat().map(({ id: entityId }) => entityId)
    if ((await transaction.getPublicationSettings()) !== null) ids.push('publication-settings')
    if ((await transaction.listArticleTaxonomies()).length > 0) ids.push('article-taxonomies')
    return ids.sort()
  })
}

export async function importPortableContentBundle(
  repository: ContentRepository,
  value: unknown,
): Promise<{ readonly imported: Readonly<Record<string, number>> }> {
  const inspection = inspectPortableContentBundle(value)
  if (inspection.status === 'invalid') {
    throw new Error(`Portable import is invalid: ${inspection.issues.join('; ')}`)
  }
  const collisions = await existingCollisions(repository)
  if (collisions.length > 0) throw new ImportCollisionError(collisions)
  const { data } = inspection.bundle

  await repository.transaction(async (transaction) => {
    if (data.publicationSettings)
      await transaction.savePublicationSettings(data.publicationSettings)
    for (const author of data.authors) await transaction.saveAuthor(author)
    for (const taxonomy of data.taxonomies) await transaction.saveTaxonomyTerm(taxonomy)
    for (const asset of data.mediaAssets) await transaction.saveMediaAsset(asset)
    for (const rendition of data.mediaRenditions) await transaction.saveMediaRendition(rendition)
    for (const revision of data.revisions) await transaction.saveRevision(revision)
    for (const article of data.articles) await transaction.saveArticle(article, null)
    for (const link of data.articleTaxonomies) await transaction.saveArticleTaxonomy(link)
    for (const autosave of data.autosaves) await transaction.saveAutosave(autosave)
    for (const redirect of data.redirects) await transaction.saveRedirect(redirect)
    for (const revision of data.reusableBlockRevisions) {
      await transaction.saveReusableBlockRevision(revision)
    }
    for (const block of data.reusableBlocks) await transaction.saveReusableBlock(block)
    for (const job of data.publicationJobs) await transaction.savePublicationJob(job)
    for (const event of data.outboxEvents) await transaction.saveOutboxEvent(event)
    for (const event of data.auditEvents) await transaction.saveAuditEvent(event)
  })

  return {
    imported: {
      articles: data.articles.length,
      auditEvents: data.auditEvents.length,
      mediaAssets: data.mediaAssets.length,
      mediaRenditions: data.mediaRenditions.length,
      revisions: data.revisions.length,
      taxonomies: data.taxonomies.length,
    },
  }
}

export async function verifyPortableMedia(
  bundle: PortableContentBundle,
  objects: OriginalObjectStore,
): Promise<{ readonly failed: readonly string[]; readonly verified: number }> {
  const failed: string[] = []
  for (const object of bundle.media.objects) {
    try {
      if (!(await objects.verifyOriginal(object.key, object.sha256))) failed.push(object.key)
    } catch {
      failed.push(object.key)
    }
  }
  return { failed, verified: bundle.media.objects.length - failed.length }
}
