import type { Article, ArticleRevision } from './domain'
import type { ContentDocument } from './document'

export class ContentNotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} ${id} was not found`)
    this.name = 'ContentNotFoundError'
  }
}

export class ContentConflictError extends Error {
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
  constructor(slug: string) {
    super(`The slug ${slug} is already in use.`)
    this.name = 'DuplicateSlugError'
  }
}

export class InvalidContentTransitionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidContentTransitionError'
  }
}

export class ImportCollisionError extends Error {
  readonly collisions: readonly string[]

  constructor(collisions: readonly string[]) {
    super(`Import refused because identities already exist: ${collisions.join(', ')}`)
    this.name = 'ImportCollisionError'
    this.collisions = collisions
  }
}
