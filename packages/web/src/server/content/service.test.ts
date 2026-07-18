import { describe, expect, it } from 'vitest'

import type { ContentDocument } from './document'
import { ContentConflictError, InvalidContentTransitionError } from './errors'
import { InMemoryContentRepository } from './in-memory-repository'
import type { Clock, IdentifierSource } from './ports'
import { ContentService } from './service'

class TestClock implements Clock {
  constructor(private value: Date) {}

  advance(milliseconds: number) {
    this.value = new Date(this.value.valueOf() + milliseconds)
  }

  now(): Date {
    return new Date(this.value)
  }
}

class TestIdentifiers implements IdentifierSource {
  private sequence = 0

  next(kind: string): string {
    this.sequence += 1
    return `${kind}-${this.sequence}`
  }
}

function document(articleId: string, text = 'Initial owner draft'): ContentDocument {
  return {
    articleId,
    document: {
      content: [{ content: [{ text, type: 'text' }], type: 'paragraph' }],
      type: 'doc',
    },
    migrationProvenance: [],
    schemaVersion: 3,
    title: text,
  }
}

function setup() {
  const clock = new TestClock(new Date('2026-07-17T20:00:00.000Z'))
  const repository = new InMemoryContentRepository()
  const service = new ContentService(repository, clock, new TestIdentifiers())
  return { clock, repository, service }
}

describe('content service', () => {
  it('creates immutable revisions, autosaves optimistically, and replays idempotently', async () => {
    const { repository, service } = setup()
    const created = await service.createArticle({
      dek: 'Portable editorial data',
      document: document('article-foundation'),
      id: 'article-foundation',
      idempotencyKey: 'create-1',
      slug: 'Portable Foundation',
      title: 'Portable foundation',
    })
    const saved = await service.saveDraft({
      articleId: created.article.id,
      document: document(created.article.id, 'Recovered autosave'),
      expectedVersion: 1,
      idempotencyKey: 'save-1',
    })
    const replay = await service.saveDraft({
      articleId: created.article.id,
      document: document(created.article.id, 'Ignored duplicate payload'),
      expectedVersion: 1,
      idempotencyKey: 'save-1',
    })

    expect(created.article.slug).toBe('portable-foundation')
    expect(saved.article.version).toBe(2)
    expect(replay).toEqual(saved)
    await repository.inspect(async (transaction) => {
      expect(
        (await transaction.listRevisions(created.article.id)).map(
          ({ revisionNumber }) => revisionNumber,
        ),
      ).toEqual([1, 2])
      expect(await transaction.listAutosaves(created.article.id)).toHaveLength(1)
    })
  })

  it('preserves attempted and remote drafts when optimistic concurrency fails', async () => {
    const { service } = setup()
    const created = await service.createArticle({
      dek: 'Conflict proof',
      document: document('article-conflict'),
      id: 'article-conflict',
      idempotencyKey: 'create-conflict',
      slug: 'conflict-proof',
      title: 'Conflict proof',
    })
    await service.saveDraft({
      articleId: created.article.id,
      document: document(created.article.id, 'Remote draft'),
      expectedVersion: 1,
      idempotencyKey: 'remote-save',
    })
    const attempted = document(created.article.id, 'Local recoverable draft')

    const error = await service
      .saveDraft({
        articleId: created.article.id,
        document: attempted,
        expectedVersion: 1,
        idempotencyKey: 'local-save',
      })
      .catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ContentConflictError)
    expect(error).toMatchObject({
      attemptedDocument: attempted,
      currentArticle: { version: 2 },
      currentRevision: { document: document(created.article.id, 'Remote draft') },
    })
  })

  it('publishes one immutable revision and keeps later draft work private', async () => {
    const { repository, service } = setup()
    const created = await service.createArticle({
      dek: 'Publication proof',
      document: document('article-publish'),
      id: 'article-publish',
      idempotencyKey: 'create-publish',
      slug: 'publication-proof',
      title: 'Publication proof',
    })
    const published = await service.publish({
      articleId: created.article.id,
      expectedVersion: 1,
      idempotencyKey: 'publish-1',
      revisionId: created.revision.id,
    })
    const draft = await service.saveDraft({
      articleId: created.article.id,
      document: document(created.article.id, 'Private post-publication draft'),
      expectedVersion: 2,
      idempotencyKey: 'draft-after-publish',
    })

    expect(draft.article.currentDraftRevisionId).not.toBe(published.article.publishedRevisionId)
    expect(draft.article.publishedRevisionId).toBe(created.revision.id)
    expect(draft.article.status).toBe('published')
    await repository.inspect(async (transaction) => {
      expect(
        (await transaction.listOutboxEvents(created.article.id)).map(({ type }) => type),
      ).toEqual(['cache.revalidate', 'search.upsert', 'article.published'])
    })
  })

  it('recovers expired worker leases and completes scheduled publication exactly once', async () => {
    const { clock, repository, service } = setup()
    const created = await service.createArticle({
      dek: 'Scheduling proof',
      document: document('article-scheduled'),
      id: 'article-scheduled',
      idempotencyKey: 'create-scheduled',
      slug: 'scheduled-proof',
      title: 'Scheduled proof',
    })
    const scheduled = await service.schedulePublication({
      articleId: created.article.id,
      expectedVersion: 1,
      idempotencyKey: 'schedule-1',
      revisionId: created.revision.id,
      runAt: '2026-07-17T20:01:00.000Z',
    })
    clock.advance(60_000)
    const firstClaim = await service.claimDuePublication({
      leaseMilliseconds: 1_000,
      workerId: 'worker-a',
    })
    expect(firstClaim?.id).toBe(scheduled.job.id)
    expect(
      await service.claimDuePublication({ leaseMilliseconds: 1_000, workerId: 'worker-b' }),
    ).toBeNull()
    clock.advance(1_001)
    const recovered = await service.claimDuePublication({
      leaseMilliseconds: 1_000,
      workerId: 'worker-b',
    })
    expect(recovered).toMatchObject({ attempt: 2, id: scheduled.job.id })
    const completed = await service.completeScheduledPublication({
      jobId: scheduled.job.id,
      workerId: 'worker-b',
    })
    const duplicate = await service.completeScheduledPublication({
      jobId: scheduled.job.id,
      workerId: 'worker-b',
    })

    expect(completed).toMatchObject({ article: { status: 'published' }, duplicate: false })
    expect(duplicate).toMatchObject({ duplicate: true, job: { status: 'completed' } })
    await repository.inspect(async (transaction) => {
      expect(await transaction.listRevisions(created.article.id)).toHaveLength(1)
      expect(await transaction.listOutboxEvents(created.article.id)).toHaveLength(3)
    })
  })

  it('keeps publication committed when an external effect fails', async () => {
    const { repository, service } = setup()
    const created = await service.createArticle({
      dek: 'Outbox proof',
      document: document('article-outbox'),
      id: 'article-outbox',
      idempotencyKey: 'create-outbox',
      slug: 'outbox-proof',
      title: 'Outbox proof',
    })
    await service.publish({
      articleId: created.article.id,
      expectedVersion: 1,
      idempotencyKey: 'publish-outbox',
      revisionId: created.revision.id,
    })
    const event = await repository.inspect(
      async (transaction) => (await transaction.listOutboxEvents(created.article.id))[0],
    )
    if (!event) throw new Error('outbox fixture missing')
    expect(
      await service.completeOutboxEvent({ error: 'synthetic provider failure', eventId: event.id }),
    ).toMatchObject({
      attempts: 1,
      status: 'failed',
    })
    await repository.inspect(async (transaction) => {
      expect(await transaction.getArticle(created.article.id)).toMatchObject({
        status: 'published',
      })
    })
  })

  it('retains redirects and supports recoverable deletion without permanent loss', async () => {
    const { repository, service } = setup()
    const created = await service.createArticle({
      dek: 'Recovery proof',
      document: document('article-recovery'),
      id: 'article-recovery',
      idempotencyKey: 'create-recovery',
      slug: 'first-slug',
      title: 'Recovery proof',
    })
    const renamed = await service.changeSlug({
      articleId: created.article.id,
      expectedVersion: 1,
      idempotencyKey: 'rename-1',
      slug: 'second-slug',
    })
    const deleted = await service.softDelete({
      articleId: created.article.id,
      expectedVersion: 2,
      idempotencyKey: 'delete-1',
    })
    await expect(
      service.saveDraft({
        articleId: created.article.id,
        document: document(created.article.id, 'Blocked while deleted'),
        expectedVersion: 3,
        idempotencyKey: 'blocked-save',
      }),
    ).rejects.toBeInstanceOf(InvalidContentTransitionError)
    const restored = await service.restore({
      articleId: created.article.id,
      expectedVersion: deleted.version,
      idempotencyKey: 'restore-1',
    })

    expect(restored).toMatchObject({ deletedAt: null, slug: 'second-slug', status: 'draft' })
    await repository.inspect(async (transaction) => {
      expect(await transaction.listRedirects(created.article.id)).toEqual([renamed.redirect])
      expect(await transaction.listRevisions(created.article.id)).toHaveLength(1)
    })
  })

  it('rejects invalid schedules, unsafe leases, and invalid lifecycle transitions', async () => {
    const { service } = setup()
    const created = await service.createArticle({
      dek: 'Failure-path proof',
      document: document('article-failure-path'),
      id: 'article-failure-path',
      idempotencyKey: 'create-failure-path',
      slug: 'failure-path-proof',
      title: 'Failure-path proof',
    })

    await expect(
      service.schedulePublication({
        articleId: created.article.id,
        expectedVersion: 1,
        idempotencyKey: 'past-schedule',
        revisionId: created.revision.id,
        runAt: '2026-07-17T19:59:59.000Z',
      }),
    ).rejects.toThrow(/valid future time/)
    await expect(
      service.claimDuePublication({ leaseMilliseconds: 999, workerId: 'worker-invalid' }),
    ).rejects.toThrow(/at least one second/)
    await expect(
      service.unpublish({
        articleId: created.article.id,
        expectedVersion: 1,
        idempotencyKey: 'invalid-unpublish',
      }),
    ).rejects.toThrow(/published or scheduled/)
    await expect(
      service.restore({
        articleId: created.article.id,
        expectedVersion: 1,
        idempotencyKey: 'invalid-restore',
      }),
    ).rejects.toThrow(/not deleted/)
  })
})
