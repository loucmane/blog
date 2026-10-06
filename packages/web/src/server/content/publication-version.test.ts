import { describe, expect, it } from 'vitest'

import { CURRENT_CONTENT_DOCUMENT_VERSION, type ContentDocument } from './document'
import { ContentConflictError } from './errors'
import { InMemoryContentRepository } from './in-memory-repository'
import { createPortableContentBundle, importPortableContentBundle } from './portability'
import type { Clock, IdentifierSource } from './ports'
import { SectionService } from './sections'
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

const articleId = 'article-version'

function document(text = 'A story readers may see'): ContentDocument {
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
  const identifiers = new TestIdentifiers()
  const repository = new InMemoryContentRepository()
  const service = new ContentService(repository, clock, identifiers)
  const created = () =>
    service.createArticle({
      dek: 'Publication version proof',
      document: document(),
      id: articleId,
      idempotencyKey: 'create-version',
      slug: 'publication-version-proof',
      title: 'Publication version proof',
    })
  return {
    clock,
    created,
    identifiers,
    repository,
    service,
    version: () => repository.readPublicationVersion(),
  }
}

describe('the publication version', () => {
  it('advances once when a transaction that records a publication change commits', async () => {
    const repository = new InMemoryContentRepository()
    expect(await repository.readPublicationVersion()).toBe(0)

    await repository.transaction(async (transaction) => {
      transaction.recordPublicationChange()
      transaction.recordPublicationChange()
    })
    expect(await repository.readPublicationVersion()).toBe(1)

    await repository.transaction((transaction) => transaction.listArticles())
    expect(await repository.readPublicationVersion()).toBe(1)
  })

  it('stays put when a transaction that records a change rolls back', async () => {
    const repository = new InMemoryContentRepository()

    await expect(
      repository.transaction(async (transaction) => {
        transaction.recordPublicationChange()
        throw new Error('synthetic rollback')
      }),
    ).rejects.toThrow('synthetic rollback')

    expect(await repository.readPublicationVersion()).toBe(0)
  })

  it('reads the last committed version while a change is still in progress', async () => {
    const repository = new InMemoryContentRepository()
    let reachChange!: () => void
    let finishChange!: () => void
    const reached = new Promise<void>((resolve) => {
      reachChange = resolve
    })
    const finishing = new Promise<void>((resolve) => {
      finishChange = resolve
    })
    const change = repository.transaction(async (transaction) => {
      transaction.recordPublicationChange()
      reachChange()
      await finishing
    })
    await reached

    expect(await repository.readPublicationVersion()).toBe(0)
    finishChange()
    await change
    expect(await repository.readPublicationVersion()).toBe(1)
  })

  it('advances with every change to what readers may see, and with nothing else', async () => {
    const { clock, created, service, version } = setup()
    const draft = await created()
    const edited = await service.saveDraft({
      articleId,
      document: document('An edited draft'),
      expectedVersion: draft.article.version,
      idempotencyKey: 'edit-version',
    })
    expect(await version()).toBe(0)

    const publishInput = {
      articleId,
      expectedVersion: edited.article.version,
      idempotencyKey: 'publish-version',
      revisionId: edited.revision.id,
    }
    const published = await service.publish(publishInput)
    expect(await version()).toBe(1)
    await service.publish(publishInput)
    expect(await version()).toBe(1)

    const scheduled = await service.schedulePublication({
      articleId,
      expectedVersion: published.article.version,
      idempotencyKey: 'schedule-version',
      revisionId: edited.revision.id,
      runAt: '2026-07-17T21:00:00.000Z',
      timeZone: 'Europe/Stockholm',
    })
    expect(await version()).toBe(2)
    const cancelled = await service.cancelScheduledPublication({
      articleId,
      expectedVersion: scheduled.article.version,
      idempotencyKey: 'cancel-version',
    })
    expect(await version()).toBe(3)
    const rescheduled = await service.schedulePublication({
      articleId,
      expectedVersion: cancelled.version,
      idempotencyKey: 'reschedule-version',
      revisionId: edited.revision.id,
      runAt: '2026-07-17T20:01:00.000Z',
      timeZone: 'Europe/Stockholm',
    })
    expect(await version()).toBe(4)

    clock.advance(60_000)
    await service.claimDuePublication({ leaseMilliseconds: 30_000, workerId: 'worker-version' })
    expect(await version()).toBe(4)
    const completed = await service.completeScheduledPublication({
      jobId: rescheduled.job.id,
      workerId: 'worker-version',
    })
    expect(await version()).toBe(5)
    if (!completed.article) throw new Error('The scheduled publication should have completed.')

    const unpublished = await service.unpublish({
      articleId,
      expectedVersion: completed.article.version,
      idempotencyKey: 'unpublish-version',
      reason: 'Holding for corrections',
    })
    expect(await version()).toBe(6)
    const moved = await service.changeSlug({
      articleId,
      expectedVersion: unpublished.version,
      idempotencyKey: 'move-version',
      slug: 'publication-version-moved',
    })
    expect(await version()).toBe(7)
    const deleted = await service.softDelete({
      articleId,
      expectedVersion: moved.article.version,
      idempotencyKey: 'delete-version',
    })
    expect(await version()).toBe(8)
    await service.restore({
      articleId,
      expectedVersion: deleted.version,
      idempotencyKey: 'restore-version',
    })
    expect(await version()).toBe(9)
  })

  it('stays put when a change is rejected', async () => {
    const { created, service, version } = setup()
    const draft = await created()

    await expect(
      service.publish({
        articleId,
        expectedVersion: draft.article.version + 1,
        idempotencyKey: 'publish-stale-version',
        revisionId: draft.revision.id,
      }),
    ).rejects.toBeInstanceOf(ContentConflictError)

    expect(await version()).toBe(0)
  })

  it('advances when a scheduled publication is superseded instead of completed', async () => {
    const { clock, created, repository, service, version } = setup()
    const draft = await created()
    const scheduled = await service.schedulePublication({
      articleId,
      expectedVersion: draft.article.version,
      idempotencyKey: 'schedule-superseded',
      revisionId: draft.revision.id,
      runAt: '2026-07-17T20:01:00.000Z',
      timeZone: 'Europe/Stockholm',
    })
    clock.advance(60_000)
    await service.claimDuePublication({ leaseMilliseconds: 30_000, workerId: 'worker-stale' })
    await repository.transaction((transaction) =>
      transaction.saveArticle(
        {
          ...scheduled.article,
          scheduledAt: '2026-07-17T20:02:00.000Z',
          version: scheduled.article.version + 1,
        },
        scheduled.article.version,
      ),
    )
    expect(await version()).toBe(1)

    await expect(
      service.completeScheduledPublication({ jobId: scheduled.job.id, workerId: 'worker-stale' }),
    ).resolves.toMatchObject({ duplicate: true, job: { status: 'superseded' } })
    expect(await version()).toBe(2)
  })

  it('advances when a section is created or a story is filed in it, not when either exists', async () => {
    const { clock, created, identifiers, repository, version } = setup()
    const sections = new SectionService(repository, clock, identifiers)
    await created()

    const section = await sections.ensureSection({ name: 'Interiors', slug: 'interiors' })
    expect(await version()).toBe(1)
    await sections.ensureSection({ name: 'Interiors', slug: 'interiors' })
    expect(await version()).toBe(1)
    await sections.assignSection({ articleId, sectionId: section.id })
    expect(await version()).toBe(2)
    await sections.assignSection({ articleId, sectionId: section.id })
    expect(await version()).toBe(2)
  })

  it('advances when a portable bundle is imported', async () => {
    const { created, repository, service } = setup()
    const draft = await created()
    await service.publish({
      articleId,
      expectedVersion: draft.article.version,
      idempotencyKey: 'publish-portable-version',
      revisionId: draft.revision.id,
    })
    const bundle = await createPortableContentBundle(repository, '2026-07-17T22:30:00.000Z')
    const restored = new InMemoryContentRepository()

    await importPortableContentBundle(restored, bundle)

    expect(await restored.readPublicationVersion()).toBe(1)
  })
})
