import { describe, expect, it } from 'vitest'

import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { CURRENT_CONTENT_DOCUMENT_VERSION } from '@/server/content/document'
import { ContentConflictError } from '@/server/content/errors'
import { ContentService } from '@/server/content/service'

import { ownerErrorResponse } from './api'
import {
  OwnerConfigurationError,
  resolveOwnerAuthConfiguration,
  resolveOwnerFixtureConfiguration,
  type OwnerEnvironment,
} from './config'
import { createOwnerContentDocument, emptyEditorDocument, publicationReadiness } from './document'
import {
  ownerRecoveryKey,
  parseOwnerRecovery,
  recoveryIsNewer,
  serializeOwnerRecovery,
} from './recovery'
import { createOwnerRuntime } from './runtime'
import { runDuePublicationJobs } from './publication-worker'
import { resolveScheduledPublication, validateTimeZone } from './schedule'
import { createOwnerFixtureSession, ownerFixtureCookieName, resolveOwnerSession } from './session'
import { OwnerWorkspaceService } from './workspace'

const fixtureEnvironment = {
  BETTER_AUTH_URL: 'http://localhost:3100',
  MAGAZINE_OWNER_EMAIL: 'owner@example.test',
  MAGAZINE_OWNER_NAME: 'Editorial owner',
  MAGAZINE_OWNER_TEST_MODE: '1',
  MAGAZINE_OWNER_TEST_TOKEN: 'owner-test-token-that-is-longer-than-thirty-two-bytes',
  NODE_ENV: 'test',
} satisfies OwnerEnvironment

function contentDocument(articleId: string, body = 'A complete owner-operated magazine story.') {
  return createOwnerContentDocument({
    articleId,
    document: {
      content: [
        {
          content: [{ text: body, type: 'text' }],
          type: 'paragraph',
        },
      ],
      type: 'doc',
    },
    title: 'Owner publishing foundation',
  })
}

describe('owner configuration and session boundary', () => {
  it('requires strong production configuration and an HTTPS recovery boundary', () => {
    expect(() => resolveOwnerAuthConfiguration({})).toThrow(OwnerConfigurationError)
    expect(() =>
      resolveOwnerAuthConfiguration({
        BETTER_AUTH_SECRET: 'strong-secret-that-is-longer-than-thirty-two-bytes',
        BETTER_AUTH_URL: 'https://magazine.example',
        DATABASE_URL: 'postgresql://db/magazine',
        MAGAZINE_OWNER_EMAIL: 'owner@example.com',
        MAGAZINE_OWNER_RECOVERY_WEBHOOK_SECRET:
          'recovery-secret-that-is-longer-than-thirty-two-bytes',
        MAGAZINE_OWNER_RECOVERY_WEBHOOK_URL: 'http://mail.example/recovery',
      }),
    ).toThrow(/must use HTTPS/)

    expect(
      resolveOwnerAuthConfiguration({
        BETTER_AUTH_SECRET: 'strong-secret-that-is-longer-than-thirty-two-bytes',
        BETTER_AUTH_URL: 'https://magazine.example',
        DATABASE_URL: 'postgresql://db/magazine',
        MAGAZINE_OWNER_EMAIL: 'OWNER@example.com',
      }),
    ).toMatchObject({ ownerEmail: 'owner@example.com' })

    expect(() =>
      resolveOwnerAuthConfiguration({
        BETTER_AUTH_SECRET: 'strong-secret-that-is-longer-than-thirty-two-bytes',
        BETTER_AUTH_URL: 'http://magazine.example',
        DATABASE_URL: 'postgresql://db/magazine',
        MAGAZINE_OWNER_EMAIL: 'owner@example.com',
        NODE_ENV: 'production',
      }),
    ).toThrow(/requires HTTPS/)
    expect(
      resolveOwnerAuthConfiguration({
        BETTER_AUTH_SECRET: 'strong-secret-that-is-longer-than-thirty-two-bytes',
        BETTER_AUTH_URL: 'http://localhost:3100',
        DATABASE_URL: 'postgresql://db/magazine',
        MAGAZINE_OWNER_EMAIL: 'owner@example.com',
        NODE_ENV: 'development',
      }),
    ).toMatchObject({ baseUrl: new URL('http://localhost:3100') })
  })

  it('restricts fixture auth to an explicit loopback harness and signs exact sessions', async () => {
    expect(resolveOwnerFixtureConfiguration(fixtureEnvironment)).toMatchObject({
      ownerEmail: 'owner@example.test',
    })
    expect(() =>
      resolveOwnerFixtureConfiguration({
        ...fixtureEnvironment,
        BETTER_AUTH_URL: 'https://magazine.example',
      }),
    ).toThrow(/loopback/)
    expect(() =>
      resolveOwnerFixtureConfiguration({
        ...fixtureEnvironment,
        NODE_ENV: 'production',
      }),
    ).toThrow(/explicit test runtime/)
    expect(() =>
      resolveOwnerFixtureConfiguration({
        ...fixtureEnvironment,
        NODE_ENV: 'development',
      }),
    ).toThrow(/explicit test runtime/)

    const value = createOwnerFixtureSession(fixtureEnvironment)
    const session = await resolveOwnerSession(
      new Headers({ cookie: `${ownerFixtureCookieName}=${encodeURIComponent(value)}` }),
      fixtureEnvironment,
    )
    expect(session).toEqual({
      email: 'owner@example.test',
      id: 'owner-test-fixture',
      name: 'Editorial owner',
    })
    await expect(
      resolveOwnerSession(
        new Headers({ cookie: `${ownerFixtureCookieName}=v1.tampered` }),
        fixtureEnvironment,
      ),
    ).resolves.toBeNull()
  })
})

describe('owner document, recovery, and scheduling contracts', () => {
  it('creates versioned structured documents and blocks incomplete publication', () => {
    const empty = createOwnerContentDocument({
      articleId: 'article-empty',
      document: emptyEditorDocument(),
      title: 'Draft',
    })
    expect(empty.schemaVersion).toBe(CURRENT_CONTENT_DOCUMENT_VERSION)
    expect(publicationReadiness({ dek: '', document: empty, title: 'Draft' })).toEqual([
      { field: 'dek', message: 'Add a short summary before publishing.' },
      { field: 'body', message: 'Add more story text before publishing.' },
    ])

    expect(
      publicationReadiness({
        dek: 'A useful summary for readers.',
        document: contentDocument('article-ready'),
        title: 'Ready story',
      }),
    ).toEqual([])
  })

  it('bounds local recovery copies and rejects stale or future evidence', () => {
    const savedAt = '2026-07-18T09:00:00.000Z'
    const draft = {
      articleId: 'article-recovery',
      baseVersion: 3,
      dek: 'A locally recoverable summary.',
      document: emptyEditorDocument(),
      savedAt,
      title: 'Recovered story',
    }
    const serialized = serializeOwnerRecovery(draft)
    expect(ownerRecoveryKey(draft.articleId)).toBe('magazine-owner-recovery:v1:article-recovery')
    expect(parseOwnerRecovery(serialized, Date.parse(savedAt) + 1_000)).toEqual(draft)
    expect(recoveryIsNewer(draft, '2026-07-18T08:59:59.000Z')).toBe(true)
    expect(
      parseOwnerRecovery(serialized, Date.parse(savedAt) + 8 * 24 * 60 * 60 * 1_000),
    ).toBeNull()
    expect(parseOwnerRecovery(serialized, Date.parse(savedAt) - 6 * 60_000)).toBeNull()
    expect(parseOwnerRecovery('{not-json')).toBeNull()
  })

  it('converts an owner-local time to an exact instant and rejects DST gaps or past times', () => {
    expect(validateTimeZone('Europe/Stockholm')).toBe('Europe/Stockholm')
    expect(
      resolveScheduledPublication({
        localDateTime: '2026-07-19T09:30',
        now: '2026-07-18T00:00:00Z',
        timeZone: 'Europe/Stockholm',
      }),
    ).toBe('2026-07-19T07:30:00Z')
    expect(() =>
      resolveScheduledPublication({
        localDateTime: '2026-03-29T02:30',
        now: '2026-03-01T00:00:00Z',
        timeZone: 'Europe/Stockholm',
      }),
    ).toThrow(/does not exist or is ambiguous/)
    expect(() =>
      resolveScheduledPublication({
        localDateTime: '2026-07-17T09:30',
        now: '2026-07-18T00:00:00Z',
        timeZone: 'Europe/Stockholm',
      }),
    ).toThrow(/future/)
  })

  it('runs due publication jobs through the portable worker entrypoint', async () => {
    const repository = new InMemoryContentRepository()
    const service = new ContentService(repository, {
      now: () => new Date('2026-07-18T10:00:00.000Z'),
    })
    const created = await service.createArticle({
      dek: 'A complete scheduled publication worker proof.',
      document: contentDocument('article-worker'),
      id: 'article-worker',
      idempotencyKey: 'create-worker-proof',
      slug: 'worker-proof',
      title: 'Publication worker proof',
    })
    const scheduled = await service.schedulePublication({
      articleId: created.article.id,
      expectedVersion: created.article.version,
      idempotencyKey: 'schedule-worker-proof',
      revisionId: created.revision.id,
      runAt: '2026-07-18T10:01:00.000Z',
      timeZone: 'Europe/Stockholm',
    })

    await expect(
      runDuePublicationJobs(service, {
        evaluationTime: '2026-07-18T10:02:00.000Z',
        workerId: 'worker-owner-foundation',
      }),
    ).resolves.toEqual({
      completedJobIds: [scheduled.job.id],
      processed: 1,
      retryJobIds: [],
      supersededJobIds: [],
    })
    await repository.inspect(async (transaction) => {
      expect(await transaction.getArticle(created.article.id)).toMatchObject({
        status: 'published',
      })
    })
  })

  it('supersedes a corrupt due job and continues publishing later jobs in the batch', async () => {
    const repository = new InMemoryContentRepository()
    const service = new ContentService(repository, {
      now: () => new Date('2026-07-18T10:00:00.000Z'),
    })
    const corrupt = await service.createArticle({
      dek: 'A corrupt schedule must not starve the queue.',
      document: contentDocument('article-worker-corrupt'),
      id: 'article-worker-corrupt',
      idempotencyKey: 'create-worker-corrupt',
      slug: 'worker-corrupt',
      title: 'Corrupt publication job',
    })
    const healthy = await service.createArticle({
      dek: 'A later healthy schedule must still publish.',
      document: contentDocument('article-worker-healthy'),
      id: 'article-worker-healthy',
      idempotencyKey: 'create-worker-healthy',
      slug: 'worker-healthy',
      title: 'Healthy publication job',
    })
    const corruptSchedule = await service.schedulePublication({
      articleId: corrupt.article.id,
      expectedVersion: corrupt.article.version,
      idempotencyKey: 'schedule-worker-corrupt',
      revisionId: corrupt.revision.id,
      runAt: '2026-07-18T10:01:00.000Z',
      timeZone: 'Europe/Stockholm',
    })
    const healthySchedule = await service.schedulePublication({
      articleId: healthy.article.id,
      expectedVersion: healthy.article.version,
      idempotencyKey: 'schedule-worker-healthy',
      revisionId: healthy.revision.id,
      runAt: '2026-07-18T10:01:00.000Z',
      timeZone: 'Europe/Stockholm',
    })
    await repository.inspect(async (transaction) => {
      await transaction.saveArticle(
        {
          ...corruptSchedule.article,
          scheduledAt: '2026-07-18T10:03:00.000Z',
          updatedAt: '2026-07-18T10:00:30.000Z',
          version: corruptSchedule.article.version + 1,
        },
        corruptSchedule.article.version,
      )
    })

    await expect(
      runDuePublicationJobs(service, {
        evaluationTime: '2026-07-18T10:02:00.000Z',
        workerId: 'worker-owner-foundation',
      }),
    ).resolves.toEqual({
      completedJobIds: [healthySchedule.job.id],
      processed: 2,
      retryJobIds: [],
      supersededJobIds: [corruptSchedule.job.id],
    })
    await repository.inspect(async (transaction) => {
      expect(await transaction.getArticle(corrupt.article.id)).toMatchObject({
        status: 'scheduled',
      })
      expect(await transaction.getPublicationJob(corruptSchedule.job.id)).toMatchObject({
        status: 'superseded',
      })
      expect(await transaction.getArticle(healthy.article.id)).toMatchObject({
        status: 'published',
      })
    })
  })

  it('continues after an unexpected completion failure and preserves retry lease evidence', async () => {
    const repository = new InMemoryContentRepository()
    const service = new ContentService(repository, {
      now: () => new Date('2026-07-18T10:00:00.000Z'),
    })
    const retryArticle = await service.createArticle({
      dek: 'The first job will keep an explicit retry lease.',
      document: contentDocument('article-worker-retry'),
      id: 'article-worker-retry',
      idempotencyKey: 'create-worker-retry',
      slug: 'worker-retry',
      title: 'Retry publication job',
    })
    const healthyArticle = await service.createArticle({
      dek: 'The later job still completes in the same batch.',
      document: contentDocument('article-worker-after-retry'),
      id: 'article-worker-after-retry',
      idempotencyKey: 'create-worker-after-retry',
      slug: 'worker-after-retry',
      title: 'Publication after retry',
    })
    const retrySchedule = await service.schedulePublication({
      articleId: retryArticle.article.id,
      expectedVersion: retryArticle.article.version,
      idempotencyKey: 'schedule-worker-retry',
      revisionId: retryArticle.revision.id,
      runAt: '2026-07-18T10:01:00.000Z',
      timeZone: 'Europe/Stockholm',
    })
    const healthySchedule = await service.schedulePublication({
      articleId: healthyArticle.article.id,
      expectedVersion: healthyArticle.article.version,
      idempotencyKey: 'schedule-worker-after-retry',
      revisionId: healthyArticle.revision.id,
      runAt: '2026-07-18T10:01:00.000Z',
      timeZone: 'Europe/Stockholm',
    })
    const workerContent = {
      claimDuePublication: service.claimDuePublication.bind(service),
      completeScheduledPublication: async (
        input: Parameters<ContentService['completeScheduledPublication']>[0],
      ) => {
        if (input.jobId === retrySchedule.job.id) throw new Error('Synthetic transient failure')
        return service.completeScheduledPublication(input)
      },
    } as ContentService

    await expect(
      runDuePublicationJobs(workerContent, {
        evaluationTime: '2026-07-18T10:02:00.000Z',
        workerId: 'worker-owner-foundation',
      }),
    ).resolves.toEqual({
      completedJobIds: [healthySchedule.job.id],
      processed: 2,
      retryJobIds: [retrySchedule.job.id],
      supersededJobIds: [],
    })
    await repository.inspect(async (transaction) => {
      expect(await transaction.getPublicationJob(retrySchedule.job.id)).toMatchObject({
        attempt: 1,
        claimedBy: 'worker-owner-foundation',
        leaseUntil: '2026-07-18T10:02:30.000Z',
        status: 'claimed',
      })
      expect(await transaction.getArticle(healthyArticle.article.id)).toMatchObject({
        status: 'published',
      })
    })
  })
})

describe('owner workspace composition', () => {
  it('maps coded domain conflicts across server bundle boundaries', async () => {
    const currentArticle = {
      createdAt: '2026-07-18T09:00:00.000Z',
      currentDraftRevisionId: 'revision-current',
      deletedAt: null,
      dek: 'Current summary',
      id: 'article-bundled-conflict',
      preDeleteStatus: null,
      publishedAt: null,
      publishedRevisionId: null,
      scheduledAt: null,
      scheduledRevisionId: null,
      slug: 'bundled-conflict',
      status: 'draft' as const,
      title: 'Bundled conflict',
      updatedAt: '2026-07-18T09:01:00.000Z',
      version: 2,
    }
    const source = new ContentConflictError({ currentArticle })
    const foreignBundleError = {
      code: source.code,
      currentArticle,
      currentRevision: null,
      message: source.message,
    }

    const response = ownerErrorResponse(foreignBundleError)

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({
      conflict: { article: { id: currentArticle.id, version: 2 } },
    })
  })

  it('reuses Task 42 lifecycle, versions, audit, deletion, and recovery without a second model', async () => {
    const repository = new InMemoryContentRepository()
    const service = new ContentService(repository)
    const workspace = new OwnerWorkspaceService(repository)
    const created = await service.createArticle({
      actorId: 'owner-1',
      dek: 'A useful summary for the owner workflow.',
      document: contentDocument('article-owner'),
      id: 'article-owner',
      idempotencyKey: 'owner-create-1',
      slug: 'owner-publishing-foundation',
      title: 'Owner publishing foundation',
    })
    const saved = await service.saveDraft({
      actorId: 'owner-1',
      articleId: created.article.id,
      document: contentDocument('article-owner', 'A revised story that remains portable.'),
      expectedVersion: created.article.version,
      idempotencyKey: 'owner-save-1',
    })
    const published = await service.publish({
      actorId: 'owner-1',
      articleId: saved.article.id,
      expectedVersion: saved.article.version,
      idempotencyKey: ['owner', 'publish', '1'].join('-'),
      revisionId: saved.revision.id,
    })
    const deleted = await service.softDelete({
      actorId: 'owner-1',
      articleId: published.article.id,
      expectedVersion: published.article.version,
      idempotencyKey: 'owner-delete-1',
    })
    const restored = await service.restore({
      actorId: 'owner-1',
      articleId: deleted.id,
      expectedVersion: deleted.version,
      idempotencyKey: 'owner-restore-1',
    })

    const loaded = await workspace.loadStory(restored.id)
    expect(loaded.article.status).toBe('unpublished')
    expect(loaded.revisions.map(({ revisionNumber }) => revisionNumber)).toEqual([2, 1])
    expect(loaded.autosaves).toHaveLength(1)
    expect(loaded.auditEvents.map(({ action }) => action)).toHaveLength(5)
    expect(new Set(loaded.auditEvents.map(({ action }) => action))).toEqual(
      new Set([
        'article.created',
        'article.draft-saved',
        'article.published',
        'article.restored',
        'article.soft-deleted',
      ]),
    )
  })

  it('builds an isolated in-memory runtime only through the explicit fixture gate', async () => {
    const runtime = createOwnerRuntime(fixtureEnvironment)
    await runtime.content.createArticle({
      dek: 'Fixture runtime remains explicit and local.',
      document: contentDocument('article-fixture'),
      id: 'article-fixture',
      idempotencyKey: 'fixture-create-1',
      slug: 'fixture-story',
      title: 'Fixture story',
    })
    expect(await runtime.workspace.listStories()).toHaveLength(1)
    expect(runtime.media).not.toBeNull()
    expect(runtime.pool).toBeNull()
  })
})
