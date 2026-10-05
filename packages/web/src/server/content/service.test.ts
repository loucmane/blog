import { describe, expect, it } from 'vitest'

import { CURRENT_CONTENT_DOCUMENT_VERSION, type ContentDocument } from './document'
import { ContentConflictError, InvalidContentTransitionError } from './errors'
import { InMemoryContentRepository } from './in-memory-repository'
import type { Clock, IdentifierSource } from './ports'
import { ContentReader } from './reader'
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
    schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
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

  it('serializes concurrent fixture transactions without rolling back the winning draft', async () => {
    const { repository, service } = setup()
    const created = await service.createArticle({
      dek: 'Concurrent conflict proof',
      document: document('article-concurrent-conflict'),
      id: 'article-concurrent-conflict',
      idempotencyKey: 'create-concurrent-conflict',
      slug: 'concurrent-conflict-proof',
      title: 'Concurrent conflict proof',
    })

    const results = await Promise.allSettled([
      service.saveDraft({
        articleId: created.article.id,
        document: document(created.article.id, 'First concurrent draft'),
        expectedVersion: 1,
        idempotencyKey: 'concurrent-save-first',
      }),
      service.saveDraft({
        articleId: created.article.id,
        document: document(created.article.id, 'Second concurrent draft'),
        expectedVersion: 1,
        idempotencyKey: 'concurrent-save-second',
      }),
    ])

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
    const rejected = results.find(({ status }) => status === 'rejected')
    expect(rejected).toMatchObject({ reason: expect.any(ContentConflictError), status: 'rejected' })
    await repository.inspect(async (transaction) => {
      expect(await transaction.getArticle(created.article.id)).toMatchObject({ version: 2 })
      expect(
        (await transaction.listRevisions(created.article.id)).map(
          ({ revisionNumber }) => revisionNumber,
        ),
      ).toEqual([1, 2])
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

  it('rejects publishing a historical revision even when the article version is current', async () => {
    const { service } = setup()
    const created = await service.createArticle({
      dek: 'Exact revision validation proof',
      document: document('article-exact-revision'),
      id: 'article-exact-revision',
      idempotencyKey: 'create-exact-revision',
      slug: 'exact-revision-proof',
      title: 'Exact revision proof',
    })
    const saved = await service.saveDraft({
      articleId: created.article.id,
      document: document(created.article.id, 'Current validated draft'),
      expectedVersion: 1,
      idempotencyKey: 'save-exact-revision',
    })

    await expect(
      service.publish({
        articleId: created.article.id,
        expectedVersion: saved.article.version,
        idempotencyKey: 'publish-historical-revision',
        revisionId: created.revision.id,
      }),
    ).rejects.toThrow(/latest draft/)
  })

  it('keeps the live revision readable while an update is scheduled and restores it on cancel', async () => {
    const { repository, service } = setup()
    const reader = new ContentReader(repository)
    const created = await service.createArticle({
      dek: 'Scheduled update reader proof',
      document: document('article-scheduled-update'),
      id: 'article-scheduled-update',
      idempotencyKey: 'create-scheduled-update',
      slug: 'scheduled-update-proof',
      title: 'Scheduled update proof',
    })
    const published = await service.publish({
      articleId: created.article.id,
      expectedVersion: 1,
      idempotencyKey: 'publish-scheduled-update',
      revisionId: created.revision.id,
    })
    const draft = await service.saveDraft({
      articleId: created.article.id,
      document: document(created.article.id, 'Private scheduled update'),
      expectedVersion: published.article.version,
      idempotencyKey: 'save-scheduled-update',
    })
    const scheduled = await service.schedulePublication({
      articleId: created.article.id,
      expectedVersion: draft.article.version,
      idempotencyKey: 'schedule-published-update',
      revisionId: draft.revision.id,
      runAt: '2026-07-17T21:00:00.000Z',
      timeZone: 'Europe/Stockholm',
    })

    expect(scheduled.job).toMatchObject({
      previousStatus: 'published',
      timeZone: 'Europe/Stockholm',
    })
    expect(await reader.loadPublished(created.article.slug)).toMatchObject({
      revision: { id: created.revision.id },
    })
    const cancelled = await service.cancelScheduledPublication({
      articleId: created.article.id,
      expectedVersion: scheduled.article.version,
      idempotencyKey: 'cancel-published-update',
    })
    expect(cancelled).toMatchObject({ scheduledAt: null, status: 'published' })
    expect(await reader.loadPublished(created.article.slug)).toMatchObject({
      revision: { id: created.revision.id },
    })
  })

  it('keeps an unpublished story private while a replacement is scheduled', async () => {
    const { repository, service } = setup()
    const reader = new ContentReader(repository)
    const created = await service.createArticle({
      dek: 'Unpublished scheduling proof',
      document: document('article-unpublished-schedule'),
      id: 'article-unpublished-schedule',
      idempotencyKey: 'create-unpublished-schedule',
      slug: 'unpublished-schedule-proof',
      title: 'Unpublished schedule proof',
    })
    const published = await service.publish({
      articleId: created.article.id,
      expectedVersion: created.article.version,
      idempotencyKey: 'publish-before-unpublish',
      revisionId: created.revision.id,
    })
    const unpublished = await service.unpublish({
      articleId: created.article.id,
      expectedVersion: published.article.version,
      idempotencyKey: 'unpublish-before-schedule',
      reason: 'Prepare a private replacement before republishing.',
    })
    await repository.inspect(async (transaction) => {
      expect(await transaction.listAuditEvents(created.article.id)).toContainEqual(
        expect.objectContaining({
          action: 'article.unpublished',
          metadata: { reason: 'Prepare a private replacement before republishing.' },
        }),
      )
    })
    const draft = await service.saveDraft({
      articleId: created.article.id,
      document: document(created.article.id, 'Private replacement revision'),
      expectedVersion: unpublished.version,
      idempotencyKey: 'save-unpublished-replacement',
    })
    const scheduled = await service.schedulePublication({
      articleId: created.article.id,
      expectedVersion: draft.article.version,
      idempotencyKey: 'schedule-unpublished-replacement',
      revisionId: draft.revision.id,
      runAt: '2026-07-17T21:00:00.000Z',
      timeZone: 'Europe/Stockholm',
    })

    expect(scheduled.job.previousStatus).toBe('unpublished')
    expect(await reader.loadPublished(created.article.slug)).toBeNull()
    const cancelled = await service.cancelScheduledPublication({
      articleId: created.article.id,
      expectedVersion: scheduled.article.version,
      idempotencyKey: 'cancel-unpublished-replacement',
    })
    expect(cancelled.status).toBe('unpublished')
    expect(await reader.loadPublished(created.article.slug)).toBeNull()
  })

  it('refuses to reschedule when the existing active publication job set is incomplete', async () => {
    const { repository, service } = setup()
    const reader = new ContentReader(repository)
    const created = await service.createArticle({
      dek: 'Corrupted scheduling state proof',
      document: document('article-corrupted-schedule'),
      id: 'article-corrupted-schedule',
      idempotencyKey: 'create-corrupted-schedule',
      slug: 'corrupted-schedule-proof',
      title: 'Corrupted schedule proof',
    })
    const published = await service.publish({
      articleId: created.article.id,
      expectedVersion: created.article.version,
      idempotencyKey: 'publish-before-corrupted-schedule',
      revisionId: created.revision.id,
    })
    const unpublished = await service.unpublish({
      articleId: created.article.id,
      expectedVersion: published.article.version,
      idempotencyKey: 'unpublish-before-corrupted-schedule',
      reason: 'Keep the replacement private until its repaired schedule runs.',
    })
    const draft = await service.saveDraft({
      articleId: created.article.id,
      document: document(created.article.id, 'Private replacement for corrupted schedule'),
      expectedVersion: unpublished.version,
      idempotencyKey: 'save-before-corrupted-schedule',
    })
    const scheduled = await service.schedulePublication({
      articleId: created.article.id,
      expectedVersion: draft.article.version,
      idempotencyKey: 'schedule-before-corruption',
      revisionId: draft.revision.id,
      runAt: '2026-07-17T21:00:00.000Z',
      timeZone: 'Europe/Stockholm',
    })

    await repository.transaction((transaction) =>
      transaction.savePublicationJob({ ...scheduled.job, status: 'cancelled' }),
    )
    await expect(reader.loadPublished(created.article.slug)).resolves.toBeNull()
    await expect(
      service.cancelScheduledPublication({
        articleId: created.article.id,
        expectedVersion: scheduled.article.version,
        idempotencyKey: 'cancel-without-active-job',
      }),
    ).rejects.toThrow(/existing publication schedule is incomplete/)
    await expect(
      service.schedulePublication({
        articleId: created.article.id,
        expectedVersion: scheduled.article.version,
        idempotencyKey: 'reschedule-without-active-job',
        revisionId: draft.revision.id,
        runAt: '2026-07-17T22:00:00.000Z',
        timeZone: 'Europe/Stockholm',
      }),
    ).rejects.toThrow(/existing publication schedule is incomplete/)

    await repository.transaction(async (transaction) => {
      await transaction.savePublicationJob(scheduled.job)
      await transaction.savePublicationJob({
        ...scheduled.job,
        id: 'publication-job-duplicate',
        idempotencyKey: 'duplicate-active-schedule',
      })
    })
    await expect(reader.loadPublished(created.article.slug)).resolves.toBeNull()
    await expect(
      service.cancelScheduledPublication({
        articleId: created.article.id,
        expectedVersion: scheduled.article.version,
        idempotencyKey: 'cancel-with-duplicate-active-jobs',
      }),
    ).rejects.toThrow(/existing publication schedule is incomplete/)
    await expect(
      service.schedulePublication({
        articleId: created.article.id,
        expectedVersion: scheduled.article.version,
        idempotencyKey: 'reschedule-with-duplicate-active-jobs',
        revisionId: draft.revision.id,
        runAt: '2026-07-17T22:00:00.000Z',
        timeZone: 'Europe/Stockholm',
      }),
    ).rejects.toThrow(/existing publication schedule is incomplete/)
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
      timeZone: 'Europe/Stockholm',
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
    await expect(
      service.completeScheduledPublication({
        jobId: scheduled.job.id,
        workerId: 'worker-a',
      }),
    ).rejects.toThrow(/does not own/)
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

  it('supersedes a claimed job when the article schedule no longer matches its run time', async () => {
    const { clock, repository, service } = setup()
    const created = await service.createArticle({
      dek: 'Stale schedule proof',
      document: document('article-stale-schedule'),
      id: 'article-stale-schedule',
      idempotencyKey: 'create-stale-schedule',
      slug: 'stale-schedule-proof',
      title: 'Stale schedule proof',
    })
    const scheduled = await service.schedulePublication({
      articleId: created.article.id,
      expectedVersion: created.article.version,
      idempotencyKey: 'schedule-stale-schedule',
      revisionId: created.revision.id,
      runAt: '2026-07-17T20:01:00.000Z',
      timeZone: 'Europe/Stockholm',
    })
    clock.advance(60_000)
    await expect(
      service.claimDuePublication({ leaseMilliseconds: 30_000, workerId: 'worker-stale' }),
    ).resolves.toMatchObject({ id: scheduled.job.id })
    await repository.inspect(async (transaction) => {
      await transaction.saveArticle(
        {
          ...scheduled.article,
          scheduledAt: '2026-07-17T20:02:00.000Z',
          updatedAt: '2026-07-17T20:01:00.000Z',
          version: scheduled.article.version + 1,
        },
        scheduled.article.version,
      )
    })

    await expect(
      service.completeScheduledPublication({
        jobId: scheduled.job.id,
        workerId: 'worker-stale',
      }),
    ).resolves.toMatchObject({
      article: { scheduledAt: '2026-07-17T20:02:00.000Z', status: 'scheduled' },
      duplicate: true,
      job: { status: 'superseded' },
    })
  })

  it('terminally supersedes an orphaned claimed publication job', async () => {
    const { clock, repository, service } = setup()
    await repository.inspect(async (transaction) => {
      await transaction.savePublicationJob({
        articleId: 'article-missing',
        attempt: 0,
        claimedBy: null,
        createdAt: '2026-07-17T19:58:00.000Z',
        id: 'publication-job-orphaned',
        idempotencyKey: 'schedule-orphaned',
        leaseUntil: null,
        previousStatus: 'draft',
        revisionId: 'revision-missing',
        runAt: '2026-07-17T19:59:00.000Z',
        status: 'pending',
        timeZone: 'Europe/Stockholm',
        updatedAt: '2026-07-17T19:58:00.000Z',
      })
    })
    const claimed = await service.claimDuePublication({
      leaseMilliseconds: 30_000,
      workerId: 'worker-orphaned',
    })
    expect(claimed).toMatchObject({ attempt: 1, id: 'publication-job-orphaned' })

    await expect(
      service.completeScheduledPublication({
        jobId: 'publication-job-orphaned',
        workerId: 'worker-orphaned',
      }),
    ).resolves.toMatchObject({
      article: null,
      duplicate: true,
      job: { claimedBy: null, leaseUntil: null, status: 'superseded' },
    })
    clock.advance(30_001)
    await expect(
      service.claimDuePublication({ leaseMilliseconds: 30_000, workerId: 'worker-next' }),
    ).resolves.toBeNull()
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
        timeZone: 'Europe/Stockholm',
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
        reason: 'Invalid transition proof.',
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
