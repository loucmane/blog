import type { ContentDocument } from './document'

export const articleStatuses = ['draft', 'published', 'scheduled', 'unpublished'] as const
export const publicationJobStatuses = [
  'cancelled',
  'claimed',
  'completed',
  'pending',
  'superseded',
] as const
export const outboxStatuses = ['completed', 'failed', 'pending'] as const

export type ArticleStatus = (typeof articleStatuses)[number]
export type PublicationJobStatus = (typeof publicationJobStatuses)[number]
export type OutboxStatus = (typeof outboxStatuses)[number]

export interface Article {
  readonly createdAt: string
  readonly currentDraftRevisionId: string
  readonly deletedAt: string | null
  readonly dek: string
  readonly id: string
  readonly preDeleteStatus: ArticleStatus | null
  readonly publishedAt: string | null
  readonly publishedRevisionId: string | null
  readonly scheduledAt: string | null
  readonly scheduledRevisionId: string | null
  readonly slug: string
  readonly status: ArticleStatus
  readonly title: string
  readonly updatedAt: string
  readonly version: number
}

export interface ArticleRevision {
  readonly articleId: string
  readonly createdAt: string
  readonly document: ContentDocument
  readonly id: string
  readonly revisionNumber: number
}

export interface DraftAutosave {
  readonly articleId: string
  readonly articleVersion: number
  readonly createdAt: string
  readonly id: string
  readonly idempotencyKey: string
  readonly revisionId: string
}

export interface SlugRedirect {
  readonly articleId: string
  readonly createdAt: string
  readonly fromSlug: string
  readonly id: string
  readonly toSlug: string
}

export interface PublicationJob {
  readonly articleId: string
  readonly attempt: number
  readonly claimedBy: string | null
  readonly createdAt: string
  readonly id: string
  readonly idempotencyKey: string
  readonly leaseUntil: string | null
  readonly revisionId: string
  readonly runAt: string
  readonly status: PublicationJobStatus
  readonly updatedAt: string
}

export interface OutboxEvent {
  readonly aggregateId: string
  readonly attempts: number
  readonly createdAt: string
  readonly id: string
  readonly lastError: string | null
  readonly payload: Readonly<Record<string, unknown>>
  readonly status: OutboxStatus
  readonly type: string
  readonly updatedAt: string
}

export interface AuditEvent {
  readonly action: string
  readonly actorId: string | null
  readonly articleId: string
  readonly createdAt: string
  readonly id: string
  readonly metadata: Readonly<Record<string, string | number | boolean | null>>
}

export interface IdempotencyRecord {
  readonly createdAt: string
  readonly key: string
  readonly operation: string
  readonly result: unknown
}

export interface TaxonomyTerm {
  readonly createdAt: string
  readonly id: string
  readonly kind: 'category' | 'section' | 'tag'
  readonly name: string
  readonly slug: string
  readonly updatedAt: string
}

export interface ArticleTaxonomy {
  readonly articleId: string
  readonly position: number
  readonly taxonomyId: string
}

export interface PublicationSettings {
  readonly createdAt: string
  readonly defaultLocale: string
  readonly id: string
  readonly ownerTimeZone: string
  readonly updatedAt: string
  readonly version: number
}

export interface AuthorProfile {
  readonly bio: string
  readonly createdAt: string
  readonly displayName: string
  readonly id: string
  readonly slug: string
  readonly updatedAt: string
}

export interface MediaAsset {
  readonly alt: string
  readonly bytes: number
  readonly caption: string
  readonly contentType: string
  readonly createdAt: string
  readonly creditName: string
  readonly creditUrl: string | null
  readonly focalX: number
  readonly focalY: number
  readonly height: number | null
  readonly id: string
  readonly originalKey: string
  readonly originalSha256: string
  readonly updatedAt: string
  readonly width: number | null
}

export interface MediaRendition {
  readonly bytes: number
  readonly contentType: string
  readonly createdAt: string
  readonly height: number
  readonly id: string
  readonly mediaId: string
  readonly objectKey: string
  readonly sha256: string
  readonly width: number
}

export interface ReusableBlock {
  readonly createdAt: string
  readonly currentRevisionId: string
  readonly id: string
  readonly kind: string
  readonly name: string
  readonly updatedAt: string
  readonly version: number
}

export interface ReusableBlockRevision {
  readonly blockId: string
  readonly createdAt: string
  readonly document: ContentDocument
  readonly id: string
  readonly revisionNumber: number
}

export function normalizeSlug(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function assertValidSlug(value: string): string {
  const slug = normalizeSlug(value)
  if (slug.length < 2 || slug.length > 180) {
    throw new Error('Slug must contain between 2 and 180 portable characters.')
  }
  return slug
}
