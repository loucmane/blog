import type { Article, ArticleRevision } from './domain'
import type { ContentDocument } from './document'

export type ContentErrorCode =
  | 'content_conflict'
  | 'content_document_invalid'
  | 'content_not_found'
  | 'duplicate_slug'
  | 'import_collision'
  | 'invalid_content_transition'

export function contentErrorCode(error: unknown): ContentErrorCode | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null
  switch (error.code) {
    case 'content_conflict':
    case 'content_document_invalid':
    case 'content_not_found':
    case 'duplicate_slug':
    case 'import_collision':
    case 'invalid_content_transition':
      return error.code
    default:
      return null
  }
}

export class ContentNotFoundError extends Error {
  readonly code = 'content_not_found' as const

  constructor(entity: string, id: string) {
    super(`${entity} ${id} was not found`)
    this.name = 'ContentNotFoundError'
  }
}

export class ContentConflictError extends Error {
  readonly code = 'content_conflict' as const
  readonly attemptedDocument: ContentDocument | null
  readonly currentArticle: Article
  readonly currentRevision: ArticleRevision | null

  constructor({
    attemptedDocument = null,
    currentArticle,
    currentRevision = null,
  }: {
    attemptedDocument?: ContentDocument | null
    currentArticle: Article
    currentRevision?: ArticleRevision | null
  }) {
    super('This article changed elsewhere. Both versions remain available for recovery.')
    this.name = 'ContentConflictError'
    this.attemptedDocument = attemptedDocument
    this.currentArticle = currentArticle
    this.currentRevision = currentRevision
  }
}

export class DuplicateSlugError extends Error {
  readonly code = 'duplicate_slug' as const

  constructor(slug: string) {
    super(`The slug ${slug} is already in use.`)
    this.name = 'DuplicateSlugError'
  }
}

export class InvalidContentTransitionError extends Error {
  readonly code = 'invalid_content_transition' as const

  constructor(message: string) {
    super(message)
    this.name = 'InvalidContentTransitionError'
  }
}

export class ImportCollisionError extends Error {
  readonly code = 'import_collision' as const
  readonly collisions: readonly string[]

  constructor(collisions: readonly string[]) {
    super(`Import refused because identities already exist: ${collisions.join(', ')}`)
    this.name = 'ImportCollisionError'
    this.collisions = collisions
  }
}
