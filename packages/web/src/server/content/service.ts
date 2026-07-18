import { randomUUID } from 'node:crypto'

import type {
  Article,
  ArticleRevision,
  AuditEvent,
  DraftAutosave,
  IdempotencyRecord,
  OutboxEvent,
  PublicationJob,
  SlugRedirect,
} from './domain'
import { assertValidSlug } from './domain'
import {
  ContentDocumentValidationError,
  migrateContentDocument,
  type ContentDocument,
} from './document'
import { ContentConflictError, ContentNotFoundError, InvalidContentTransitionError } from './errors'
import type { Clock, ContentRepository, ContentTransaction, IdentifierSource } from './ports'

export class SystemClock implements Clock {
  now(): Date {
    return new Date()
  }
}

export class RandomIdentifierSource implements IdentifierSource {
  next(kind: string): string {
    return `${kind}-${randomUUID()}`
  }
}

export interface CreateArticleInput {
  readonly actorId?: string | null
  readonly dek: string
  readonly document: unknown
  readonly id?: string
  readonly idempotencyKey: string
  readonly slug: string
  readonly title: string
}

export interface SaveDraftInput {
  readonly actorId?: string | null
  readonly articleId: string
  readonly dek?: string
  readonly document: unknown
  readonly expectedVersion: number
  readonly idempotencyKey: string
  readonly title?: string
}

export interface PublishInput {
  readonly actorId?: string | null
  readonly articleId: string
  readonly expectedVersion: number
  readonly idempotencyKey: string
  readonly revisionId: string
}

export interface SchedulePublicationInput extends PublishInput {
  readonly runAt: string
}

export interface ArticleMutationResult {
  readonly article: Article
  readonly revision: ArticleRevision
}

export interface ScheduledPublicationResult {
  readonly article: Article
  readonly job: PublicationJob
  readonly revision: ArticleRevision
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function asDocument(value: unknown, articleId: string): ContentDocument {
  const migrated = migrateContentDocument(value)
  if (migrated.status === 'quarantined') {
    throw new ContentDocumentValidationError(migrated)
  }
  if (migrated.document.articleId !== articleId) {
    throw new InvalidContentTransitionError('The document identity does not match the article.')
  }
  return migrated.document
}

async function requireArticle(
  transaction: ContentTransaction,
  articleId: string,
): Promise<Article> {
  const article = await transaction.getArticle(articleId)
  if (!article) throw new ContentNotFoundError('Article', articleId)
  return article
}

async function requireRevision(
  transaction: ContentTransaction,
  articleId: string,
  revisionId: string,
): Promise<ArticleRevision> {
  const revision = await transaction.getRevision(revisionId)
  if (!revision || revision.articleId !== articleId) {
    throw new ContentNotFoundError('Article revision', revisionId)
  }
  return revision
}

async function assertExpectedVersion(
  transaction: ContentTransaction,
  article: Article,
  expectedVersion: number,
  attemptedDocument: ContentDocument | null = null,
) {
  if (article.version === expectedVersion) return
  const currentRevision = await transaction.getRevision(article.currentDraftRevisionId)
  throw new ContentConflictError({ attemptedDocument, currentArticle: article, currentRevision })
}

function assertAvailable(article: Article) {
  if (article.deletedAt !== null) {
    throw new InvalidContentTransitionError('Restore this article before changing it.')
  }
}

function idempotency<T>(record: IdempotencyRecord | null): T | null {
  return record ? (clone(record.result) as T) : null
}

export class ContentService {
  constructor(
    private readonly repository: ContentRepository,
    private readonly clock: Clock = new SystemClock(),
    private readonly identifiers: IdentifierSource = new RandomIdentifierSource(),
  ) {}

  async createArticle(input: CreateArticleInput): Promise<ArticleMutationResult> {
    return this.repository.transaction(async (transaction) => {
      const replay = idempotency<ArticleMutationResult>(
        await transaction.getIdempotency('article.create', input.idempotencyKey),
      )
      if (replay) return replay

      const articleId = input.id ?? this.identifiers.next('article')
      const document = asDocument(input.document, articleId)
      const slug = assertValidSlug(input.slug)
      const now = this.clock.now().toISOString()
      const revision: ArticleRevision = {
        articleId,
        createdAt: now,
        document,
        id: this.identifiers.next('revision'),
        revisionNumber: 1,
      }
      const article: Article = {
        createdAt: now,
        currentDraftRevisionId: revision.id,
        deletedAt: null,
        dek: input.dek,
        id: articleId,
        preDeleteStatus: null,
        publishedAt: null,
        publishedRevisionId: null,
        scheduledAt: null,
        scheduledRevisionId: null,
        slug,
        status: 'draft',
        title: input.title,
        updatedAt: now,
        version: 1,
      }
      await transaction.saveRevision(revision)
      await transaction.saveArticle(article, null)
      await this.audit(transaction, articleId, 'article.created', input.actorId ?? null, now, {
        revisionId: revision.id,
        slug,
      })
      const result = { article, revision }
      await this.remember(transaction, 'article.create', input.idempotencyKey, result, now)
      return clone(result)
    })
  }

  async saveDraft(input: SaveDraftInput): Promise<ArticleMutationResult> {
    return this.repository.transaction(async (transaction) => {
      const replay = idempotency<ArticleMutationResult>(
        await transaction.getIdempotency('article.save-draft', input.idempotencyKey),
      )
      if (replay) return replay

      const document = asDocument(input.document, input.articleId)
      const current = await requireArticle(transaction, input.articleId)
      assertAvailable(current)
      await assertExpectedVersion(transaction, current, input.expectedVersion, document)
      const revisions = await transaction.listRevisions(input.articleId)
      const now = this.clock.now().toISOString()
      const revision: ArticleRevision = {
        articleId: input.articleId,
        createdAt: now,
        document,
        id: this.identifiers.next('revision'),
        revisionNumber: Math.max(0, ...revisions.map(({ revisionNumber }) => revisionNumber)) + 1,
      }
      const article: Article = {
        ...current,
        currentDraftRevisionId: revision.id,
        dek: input.dek ?? current.dek,
        title: input.title ?? current.title,
        updatedAt: now,
        version: current.version + 1,
      }
      const autosave: DraftAutosave = {
        articleId: article.id,
        articleVersion: article.version,
        createdAt: now,
        id: this.identifiers.next('autosave'),
        idempotencyKey: input.idempotencyKey,
        revisionId: revision.id,
      }
      await transaction.saveRevision(revision)
      await transaction.saveAutosave(autosave)
      await transaction.saveArticle(article, current.version)
      await this.audit(transaction, article.id, 'article.draft-saved', input.actorId ?? null, now, {
        articleVersion: article.version,
        revisionId: revision.id,
      })
      const result = { article, revision }
      await this.remember(transaction, 'article.save-draft', input.idempotencyKey, result, now)
      return clone(result)
    })
  }

  async publish(input: PublishInput): Promise<ArticleMutationResult> {
    return this.repository.transaction(async (transaction) => {
      const replay = idempotency<ArticleMutationResult>(
        await transaction.getIdempotency('article.publish', input.idempotencyKey),
      )
      if (replay) return replay
      const current = await requireArticle(transaction, input.articleId)
      assertAvailable(current)
      await assertExpectedVersion(transaction, current, input.expectedVersion)
      const revision = await requireRevision(transaction, input.articleId, input.revisionId)
      const now = this.clock.now().toISOString()
      const article: Article = {
        ...current,
        publishedAt: now,
        publishedRevisionId: revision.id,
        scheduledAt: null,
        scheduledRevisionId: null,
        status: 'published',
        updatedAt: now,
        version: current.version + 1,
      }
      await this.cancelPendingJobs(transaction, article.id, now)
      await transaction.saveArticle(article, current.version)
      await this.publicationOutbox(transaction, article, revision, now)
      await this.audit(transaction, article.id, 'article.published', input.actorId ?? null, now, {
        revisionId: revision.id,
      })
      const result = { article, revision }
      await this.remember(transaction, 'article.publish', input.idempotencyKey, result, now)
      return clone(result)
    })
  }

  async schedulePublication(input: SchedulePublicationInput): Promise<ScheduledPublicationResult> {
    return this.repository.transaction(async (transaction) => {
      const replay = idempotency<ScheduledPublicationResult>(
        await transaction.getIdempotency('article.schedule', input.idempotencyKey),
      )
      if (replay) return replay
      const current = await requireArticle(transaction, input.articleId)
      assertAvailable(current)
      await assertExpectedVersion(transaction, current, input.expectedVersion)
      const revision = await requireRevision(transaction, input.articleId, input.revisionId)
      const nowDate = this.clock.now()
      const runAt = new Date(input.runAt)
      if (!Number.isFinite(runAt.valueOf()) || runAt <= nowDate) {
        throw new InvalidContentTransitionError(
          'Scheduled publication must use a valid future time.',
        )
      }
      const now = nowDate.toISOString()
      await this.cancelPendingJobs(transaction, current.id, now)
      const job: PublicationJob = {
        articleId: current.id,
        attempt: 0,
        claimedBy: null,
        createdAt: now,
        id: this.identifiers.next('publication-job'),
        idempotencyKey: input.idempotencyKey,
        leaseUntil: null,
        revisionId: revision.id,
        runAt: runAt.toISOString(),
        status: 'pending',
        updatedAt: now,
      }
      const article: Article = {
        ...current,
        scheduledAt: job.runAt,
        scheduledRevisionId: revision.id,
        status: 'scheduled',
        updatedAt: now,
        version: current.version + 1,
      }
      await transaction.savePublicationJob(job)
      await transaction.saveArticle(article, current.version)
      await this.audit(transaction, article.id, 'article.scheduled', input.actorId ?? null, now, {
        jobId: job.id,
        revisionId: revision.id,
        runAt: job.runAt,
      })
      const result = { article, job, revision }
      await this.remember(transaction, 'article.schedule', input.idempotencyKey, result, now)
      return clone(result)
    })
  }

  async claimDuePublication(input: {
    leaseMilliseconds: number
    workerId: string
  }): Promise<PublicationJob | null> {
    if (!Number.isInteger(input.leaseMilliseconds) || input.leaseMilliseconds < 1_000) {
      throw new InvalidContentTransitionError('Publication leases must be at least one second.')
    }
    return this.repository.transaction(async (transaction) => {
      const nowDate = this.clock.now()
      return transaction.claimDuePublicationJob({
        leaseUntil: new Date(nowDate.valueOf() + input.leaseMilliseconds).toISOString(),
        now: nowDate.toISOString(),
        workerId: input.workerId,
      })
    })
  }

  async completeScheduledPublication(input: {
    jobId: string
    workerId: string
  }): Promise<{ article: Article | null; duplicate: boolean; job: PublicationJob }> {
    return this.repository.transaction(async (transaction) => {
      const currentJob = await transaction.getPublicationJob(input.jobId)
      if (!currentJob) throw new ContentNotFoundError('Publication job', input.jobId)
      const existingArticle = await transaction.getArticle(currentJob.articleId)
      if (currentJob.status === 'completed') {
        return { article: existingArticle, duplicate: true, job: currentJob }
      }
      if (currentJob.status !== 'claimed' || currentJob.claimedBy !== input.workerId) {
        throw new InvalidContentTransitionError(
          'The worker does not own the active publication lease.',
        )
      }
      if (!existingArticle) throw new ContentNotFoundError('Article', currentJob.articleId)
      const now = this.clock.now().toISOString()
      if (
        existingArticle.status !== 'scheduled' ||
        existingArticle.scheduledRevisionId !== currentJob.revisionId
      ) {
        const superseded: PublicationJob = {
          ...currentJob,
          claimedBy: null,
          leaseUntil: null,
          status: 'superseded',
          updatedAt: now,
        }
        await transaction.savePublicationJob(superseded)
        return { article: existingArticle, duplicate: true, job: superseded }
      }
      const revision = await requireRevision(transaction, existingArticle.id, currentJob.revisionId)
      const article: Article = {
        ...existingArticle,
        publishedAt: now,
        publishedRevisionId: revision.id,
        scheduledAt: null,
        scheduledRevisionId: null,
        status: 'published',
        updatedAt: now,
        version: existingArticle.version + 1,
      }
      const completed: PublicationJob = {
        ...currentJob,
        claimedBy: null,
        leaseUntil: null,
        status: 'completed',
        updatedAt: now,
      }
      await transaction.saveArticle(article, existingArticle.version)
      await transaction.savePublicationJob(completed)
      await this.publicationOutbox(transaction, article, revision, now)
      await this.audit(transaction, article.id, 'article.scheduled-publish-completed', null, now, {
        jobId: completed.id,
        revisionId: revision.id,
      })
      return { article, duplicate: false, job: completed }
    })
  }

  async unpublish(input: {
    actorId?: string | null
    articleId: string
    expectedVersion: number
    idempotencyKey: string
  }): Promise<Article> {
    return this.repository.transaction(async (transaction) => {
      const replay = idempotency<Article>(
        await transaction.getIdempotency('article.unpublish', input.idempotencyKey),
      )
      if (replay) return replay
      const current = await requireArticle(transaction, input.articleId)
      assertAvailable(current)
      await assertExpectedVersion(transaction, current, input.expectedVersion)
      if (!['published', 'scheduled'].includes(current.status)) {
        throw new InvalidContentTransitionError(
          'Only published or scheduled articles can be unpublished.',
        )
      }
      const now = this.clock.now().toISOString()
      const article: Article = {
        ...current,
        scheduledAt: null,
        scheduledRevisionId: null,
        status: 'unpublished',
        updatedAt: now,
        version: current.version + 1,
      }
      await this.cancelPendingJobs(transaction, article.id, now)
      await transaction.saveArticle(article, current.version)
      await this.saveOutbox(transaction, article.id, 'article.unpublished', now, {
        publishedRevisionId: article.publishedRevisionId,
      })
      await this.audit(
        transaction,
        article.id,
        'article.unpublished',
        input.actorId ?? null,
        now,
        {},
      )
      await this.remember(transaction, 'article.unpublish', input.idempotencyKey, article, now)
      return clone(article)
    })
  }

  async changeSlug(input: {
    actorId?: string | null
    articleId: string
    expectedVersion: number
    idempotencyKey: string
    slug: string
  }): Promise<{ article: Article; redirect: SlugRedirect }> {
    return this.repository.transaction(async (transaction) => {
      const replay = idempotency<{ article: Article; redirect: SlugRedirect }>(
        await transaction.getIdempotency('article.change-slug', input.idempotencyKey),
      )
      if (replay) return replay
      const current = await requireArticle(transaction, input.articleId)
      assertAvailable(current)
      await assertExpectedVersion(transaction, current, input.expectedVersion)
      const slug = assertValidSlug(input.slug)
      if (slug === current.slug) {
        throw new InvalidContentTransitionError('The new slug must differ from the current slug.')
      }
      const now = this.clock.now().toISOString()
      const article: Article = {
        ...current,
        slug,
        updatedAt: now,
        version: current.version + 1,
      }
      const redirect: SlugRedirect = {
        articleId: article.id,
        createdAt: now,
        fromSlug: current.slug,
        id: this.identifiers.next('redirect'),
        toSlug: slug,
      }
      await transaction.saveRedirect(redirect)
      await transaction.saveArticle(article, current.version)
      await this.audit(
        transaction,
        article.id,
        'article.slug-changed',
        input.actorId ?? null,
        now,
        {
          fromSlug: redirect.fromSlug,
          toSlug: redirect.toSlug,
        },
      )
      const result = { article, redirect }
      await this.remember(transaction, 'article.change-slug', input.idempotencyKey, result, now)
      return clone(result)
    })
  }

  async softDelete(input: {
    actorId?: string | null
    articleId: string
    expectedVersion: number
    idempotencyKey: string
  }): Promise<Article> {
    return this.repository.transaction(async (transaction) => {
      const replay = idempotency<Article>(
        await transaction.getIdempotency('article.soft-delete', input.idempotencyKey),
      )
      if (replay) return replay
      const current = await requireArticle(transaction, input.articleId)
      await assertExpectedVersion(transaction, current, input.expectedVersion)
      if (current.deletedAt !== null) return current
      const now = this.clock.now().toISOString()
      const article: Article = {
        ...current,
        deletedAt: now,
        preDeleteStatus: current.status,
        scheduledAt: null,
        scheduledRevisionId: null,
        status: current.status === 'draft' ? 'draft' : 'unpublished',
        updatedAt: now,
        version: current.version + 1,
      }
      await this.cancelPendingJobs(transaction, article.id, now)
      await transaction.saveArticle(article, current.version)
      await this.saveOutbox(transaction, article.id, 'article.deleted', now, {})
      await this.audit(
        transaction,
        article.id,
        'article.soft-deleted',
        input.actorId ?? null,
        now,
        {},
      )
      await this.remember(transaction, 'article.soft-delete', input.idempotencyKey, article, now)
      return clone(article)
    })
  }

  async restore(input: {
    actorId?: string | null
    articleId: string
    expectedVersion: number
    idempotencyKey: string
  }): Promise<Article> {
    return this.repository.transaction(async (transaction) => {
      const replay = idempotency<Article>(
        await transaction.getIdempotency('article.restore', input.idempotencyKey),
      )
      if (replay) return replay
      const current = await requireArticle(transaction, input.articleId)
      await assertExpectedVersion(transaction, current, input.expectedVersion)
      if (current.deletedAt === null) {
        throw new InvalidContentTransitionError('This article is not deleted.')
      }
      const now = this.clock.now().toISOString()
      const restoredStatus = current.preDeleteStatus === 'draft' ? 'draft' : 'unpublished'
      const article: Article = {
        ...current,
        deletedAt: null,
        preDeleteStatus: null,
        status: restoredStatus,
        updatedAt: now,
        version: current.version + 1,
      }
      await transaction.saveArticle(article, current.version)
      await this.audit(transaction, article.id, 'article.restored', input.actorId ?? null, now, {
        restoredStatus,
      })
      await this.remember(transaction, 'article.restore', input.idempotencyKey, article, now)
      return clone(article)
    })
  }

  async completeOutboxEvent(input: { error?: string; eventId: string }): Promise<OutboxEvent> {
    return this.repository.transaction(async (transaction) => {
      const current = await transaction.getOutboxEvent(input.eventId)
      if (!current) throw new ContentNotFoundError('Outbox event', input.eventId)
      const now = this.clock.now().toISOString()
      const event: OutboxEvent = {
        ...current,
        attempts: current.attempts + 1,
        lastError: input.error ?? null,
        status: input.error ? 'failed' : 'completed',
        updatedAt: now,
      }
      await transaction.saveOutboxEvent(event)
      return clone(event)
    })
  }

  private async audit(
    transaction: ContentTransaction,
    articleId: string,
    action: string,
    actorId: string | null,
    createdAt: string,
    metadata: AuditEvent['metadata'],
  ) {
    await transaction.saveAuditEvent({
      action,
      actorId,
      articleId,
      createdAt,
      id: this.identifiers.next('audit'),
      metadata,
    })
  }

  private async cancelPendingJobs(transaction: ContentTransaction, articleId: string, now: string) {
    const jobs = await transaction.listPublicationJobs(articleId)
    for (const job of jobs) {
      if (!['claimed', 'pending'].includes(job.status)) continue
      await transaction.savePublicationJob({
        ...job,
        claimedBy: null,
        leaseUntil: null,
        status: 'cancelled',
        updatedAt: now,
      })
    }
  }

  private async publicationOutbox(
    transaction: ContentTransaction,
    article: Article,
    revision: ArticleRevision,
    now: string,
  ) {
    for (const type of ['cache.revalidate', 'search.upsert', 'article.published']) {
      await this.saveOutbox(transaction, article.id, type, now, {
        articleVersion: article.version,
        revisionId: revision.id,
        slug: article.slug,
      })
    }
  }

  private async remember(
    transaction: ContentTransaction,
    operation: string,
    key: string,
    result: unknown,
    createdAt: string,
  ) {
    await transaction.saveIdempotency({ createdAt, key, operation, result: clone(result) })
  }

  private async saveOutbox(
    transaction: ContentTransaction,
    aggregateId: string,
    type: string,
    createdAt: string,
    payload: Readonly<Record<string, unknown>>,
  ) {
    const event: OutboxEvent = {
      aggregateId,
      attempts: 0,
      createdAt,
      id: this.identifiers.next('outbox'),
      lastError: null,
      payload,
      status: 'pending',
      type,
      updatedAt: createdAt,
    }
    await transaction.saveOutboxEvent(event)
  }
}
