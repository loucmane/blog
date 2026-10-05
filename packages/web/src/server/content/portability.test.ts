import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { CURRENT_CONTENT_DOCUMENT_VERSION, type ContentDocument } from './document'
import { ImportCollisionError } from './errors'
import { InMemoryContentRepository } from './in-memory-repository'
import { InMemoryOriginalObjectStore, MediaOriginalService } from './media'
import {
  createPortableContentBundle,
  canonicalJson,
  importPortableContentBundle,
  inspectPortableContentBundle,
  verifyPortableMedia,
} from './portability'
import type { Clock, IdentifierSource } from './ports'
import { ContentService } from './service'

class Identifiers implements IdentifierSource {
  private index = 0

  next(kind: string): string {
    this.index += 1
    return `${kind}-portable-${this.index}`
  }
}

const clock: Clock = { now: () => new Date('2026-07-17T22:00:00.000Z') }

function document(articleId: string): ContentDocument {
  return {
    articleId,
    document: {
      content: [
        { content: [{ text: 'Lossless portable story', type: 'text' }], type: 'paragraph' },
      ],
      type: 'doc',
    },
    migrationProvenance: [],
    schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
    title: 'Lossless portable story',
  }
}

async function populatedRepository() {
  const repository = new InMemoryContentRepository()
  const identifiers = new Identifiers()
  const service = new ContentService(repository, clock, identifiers)
  const objects = new InMemoryOriginalObjectStore()
  const media = new MediaOriginalService(repository, objects, clock, identifiers)
  const created = await service.createArticle({
    dek: 'Export/import proof',
    document: document('article-portable'),
    id: 'article-portable',
    idempotencyKey: 'create-portable',
    slug: 'lossless-portable-story',
    title: 'Lossless portable story',
  })
  await service.publish({
    articleId: created.article.id,
    expectedVersion: 1,
    idempotencyKey: 'publish-portable',
    revisionId: created.revision.id,
  })
  await media.store({
    alt: 'Portable media bytes',
    body: new TextEncoder().encode('portable media original'),
    contentType: 'image/png',
    creditName: 'Magazine owner',
    id: 'media-portable',
  })
  await repository.transaction(async (transaction) => {
    await transaction.savePublicationSettings({
      createdAt: '2026-07-17T22:00:00.000Z',
      defaultLocale: 'en',
      id: 'publication-settings',
      ownerTimeZone: 'Europe/Stockholm',
      updatedAt: '2026-07-17T22:00:00.000Z',
      version: 1,
    })
    await transaction.saveAuthor({
      bio: 'Owner and editor',
      createdAt: '2026-07-17T22:00:00.000Z',
      displayName: 'Magazine owner',
      id: 'author-owner',
      slug: 'magazine-owner',
      updatedAt: '2026-07-17T22:00:00.000Z',
    })
    await transaction.saveTaxonomyTerm({
      createdAt: '2026-07-17T22:00:00.000Z',
      id: 'taxonomy-foundation',
      kind: 'section',
      name: 'Foundation',
      slug: 'foundation',
      updatedAt: '2026-07-17T22:00:00.000Z',
    })
    await transaction.saveArticleTaxonomy({
      articleId: created.article.id,
      position: 0,
      taxonomyId: 'taxonomy-foundation',
    })
  })
  return { objects, repository }
}

describe('portable content ownership', () => {
  it('exports deterministically and recreates identities and relationships in an empty store', async () => {
    const { objects, repository } = await populatedRepository()
    const exportedAt = '2026-07-17T22:30:00.000Z'
    const first = await createPortableContentBundle(repository, exportedAt)
    const second = await createPortableContentBundle(repository, exportedAt)
    expect(second).toEqual(first)
    expect(inspectPortableContentBundle(first)).toMatchObject({ status: 'valid' })
    expect(await verifyPortableMedia(first, objects)).toEqual({ failed: [], verified: 1 })

    const restored = new InMemoryContentRepository()
    await expect(importPortableContentBundle(restored, first)).resolves.toMatchObject({
      imported: { articles: 1, mediaAssets: 1, revisions: 1, taxonomies: 1 },
    })
    const restoredBundle = await createPortableContentBundle(restored, exportedAt)
    expect(restoredBundle).toEqual(first)
  })

  it('refuses collisions instead of overwriting existing canonical content', async () => {
    const { repository } = await populatedRepository()
    const bundle = await createPortableContentBundle(repository, '2026-07-17T22:30:00.000Z')

    await expect(importPortableContentBundle(repository, bundle)).rejects.toBeInstanceOf(
      ImportCollisionError,
    )
  })

  it('imports version-three historical revisions and exposes their lossless v4 migration', async () => {
    const { repository } = await populatedRepository()
    const current = await createPortableContentBundle(repository, '2026-07-17T22:30:00.000Z')
    const { digest: _discarded, ...currentUnsigned } = current
    const unsigned = {
      ...currentUnsigned,
      data: {
        ...current.data,
        revisions: current.data.revisions.map((revision, index) =>
          index === 0
            ? {
                ...revision,
                document: {
                  ...revision.document,
                  migrationProvenance: [],
                  schemaVersion: 3,
                },
              }
            : revision,
        ),
      },
    }
    const legacy = {
      ...unsigned,
      digest: createHash('sha256').update(canonicalJson(unsigned)).digest('hex'),
    }

    expect(inspectPortableContentBundle(legacy)).toMatchObject({ status: 'valid' })
    const restored = new InMemoryContentRepository()
    await expect(importPortableContentBundle(restored, legacy)).resolves.toMatchObject({
      imported: { revisions: 1 },
    })
    const restoredBundle = await createPortableContentBundle(restored, '2026-07-17T22:30:00.000Z')
    expect(restoredBundle.data.revisions[0]!.document).toMatchObject({
      migrationProvenance: [{ from: 3, migration: 'content-v3-to-v4', to: 4 }],
      schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
    })
  })

  it('verifies legacy publication-job bytes before applying portable defaults', async () => {
    const { repository } = await populatedRepository()
    const current = await createPortableContentBundle(repository, '2026-07-17T22:30:00.000Z')
    const article = current.data.articles[0]!
    const revision = current.data.revisions[0]!
    const { digest: _discarded, ...currentUnsigned } = current
    const unsigned = {
      ...currentUnsigned,
      data: {
        ...current.data,
        publicationJobs: [
          {
            articleId: article.id,
            attempt: 0,
            claimedBy: null,
            createdAt: '2026-07-17T22:10:00.000Z',
            id: 'publication-job-legacy',
            idempotencyKey: 'schedule-legacy',
            leaseUntil: null,
            revisionId: revision.id,
            runAt: '2026-07-18T10:00:00.000Z',
            status: 'cancelled' as const,
            updatedAt: '2026-07-17T22:10:00.000Z',
          },
        ],
      },
    }
    const legacy = {
      ...unsigned,
      digest: createHash('sha256').update(canonicalJson(unsigned)).digest('hex'),
    }

    const inspection = inspectPortableContentBundle(legacy)
    expect(inspection).toMatchObject({
      bundle: {
        data: {
          publicationJobs: [{ previousStatus: 'published', timeZone: 'Europe/Stockholm' }],
        },
      },
      status: 'valid',
    })
    const restored = new InMemoryContentRepository()
    await expect(importPortableContentBundle(restored, legacy)).resolves.toMatchObject({
      imported: { articles: 1, revisions: 1 },
    })
    await expect(
      restored.transaction((transaction) => transaction.listPublicationJobs()),
    ).resolves.toEqual([
      expect.objectContaining({ previousStatus: 'published', timeZone: 'Europe/Stockholm' }),
    ])
    const reexported = await createPortableContentBundle(restored, '2026-07-17T22:30:00.000Z')
    expect(reexported.data.publicationJobs).toEqual([
      expect.objectContaining({ previousStatus: 'published', timeZone: 'Europe/Stockholm' }),
    ])
    expect(inspectPortableContentBundle(reexported)).toMatchObject({ status: 'valid' })

    const unpublishedUnsigned = {
      ...unsigned,
      data: {
        ...unsigned.data,
        articles: unsigned.data.articles.map((candidate) =>
          candidate.id === article.id
            ? { ...candidate, status: 'unpublished' as const }
            : candidate,
        ),
      },
    }
    const unpublishedLegacy = {
      ...unpublishedUnsigned,
      digest: createHash('sha256').update(canonicalJson(unpublishedUnsigned)).digest('hex'),
    }
    expect(inspectPortableContentBundle(unpublishedLegacy)).toMatchObject({
      bundle: { data: { publicationJobs: [{ previousStatus: 'unpublished' }] } },
      status: 'valid',
    })
  })

  it('fails closed on tampering, extra fields, invalid documents, and media drift', async () => {
    const { objects, repository } = await populatedRepository()
    const bundle = await createPortableContentBundle(repository, '2026-07-17T22:30:00.000Z')
    const tampered = structuredClone(bundle)
    ;(tampered.data.articles[0] as unknown as { title: string }).title = 'Tampered title'
    expect(inspectPortableContentBundle(tampered)).toMatchObject({
      issues: expect.arrayContaining([expect.stringContaining('digest')]),
      status: 'invalid',
    })

    const extra = { ...bundle, implementationAuthority: true }
    expect(inspectPortableContentBundle(extra)).toMatchObject({ status: 'invalid' })

    const invalidDocument = structuredClone(bundle)
    ;(invalidDocument.data.revisions[0]!.document.document.content as unknown[]).push({
      attrs: { execute: true },
      type: 'untrustedInstruction',
    })
    expect(inspectPortableContentBundle(invalidDocument)).toMatchObject({
      issues: expect.arrayContaining([expect.stringContaining('document is invalid')]),
      status: 'invalid',
    })

    const { digest: _relationshipDigest, ...relationshipBase } = bundle
    const relationshipUnsigned = {
      ...relationshipBase,
      data: {
        ...relationshipBase.data,
        publicationJobs: [
          {
            articleId: 'missing-article',
            attempt: 0,
            claimedBy: null,
            createdAt: '2026-07-17T22:10:00.000Z',
            id: 'publication-job-orphan',
            idempotencyKey: 'orphan-job',
            leaseUntil: null,
            previousStatus: 'draft' as const,
            revisionId: bundle.data.revisions[0]!.id,
            runAt: '2026-07-18T10:00:00.000Z',
            status: 'cancelled' as const,
            timeZone: 'Europe/Stockholm',
            updatedAt: '2026-07-17T22:10:00.000Z',
          },
        ],
      },
    }
    const invalidRelationship = {
      ...relationshipUnsigned,
      digest: createHash('sha256').update(canonicalJson(relationshipUnsigned)).digest('hex'),
    }
    expect(inspectPortableContentBundle(invalidRelationship)).toMatchObject({
      issues: expect.arrayContaining([
        expect.stringContaining('references missing article missing-article'),
      ]),
      status: 'invalid',
    })

    const { digest: _scheduledDigest, ...scheduledBase } = bundle
    const scheduledWithoutJob = {
      ...scheduledBase,
      data: {
        ...scheduledBase.data,
        articles: scheduledBase.data.articles.map((article) => ({
          ...article,
          scheduledAt: '2026-07-18T10:00:00.000Z',
          scheduledRevisionId: article.currentDraftRevisionId,
          status: 'scheduled' as const,
        })),
      },
    }
    expect(
      inspectPortableContentBundle({
        ...scheduledWithoutJob,
        digest: createHash('sha256').update(canonicalJson(scheduledWithoutJob)).digest('hex'),
      }),
    ).toMatchObject({
      issues: expect.arrayContaining([
        expect.stringContaining('exactly one active publication job'),
      ]),
      status: 'invalid',
    })

    const scheduledWithJobUnsigned = {
      ...scheduledBase,
      data: {
        ...scheduledBase.data,
        articles: scheduledBase.data.articles.map((article) => ({
          ...article,
          scheduledAt: '2026-07-18T10:00:00.000Z',
          scheduledRevisionId: article.currentDraftRevisionId,
          status: 'scheduled' as const,
        })),
        publicationJobs: [
          {
            articleId: bundle.data.articles[0]!.id,
            attempt: 0,
            claimedBy: null,
            createdAt: '2026-07-17T22:10:00.000Z',
            id: 'publication-job-active',
            idempotencyKey: 'active-job',
            leaseUntil: null,
            previousStatus: 'published' as const,
            revisionId: bundle.data.articles[0]!.currentDraftRevisionId,
            runAt: '2026-07-18T10:00:00.000Z',
            status: 'pending' as const,
            timeZone: 'Europe/Stockholm',
            updatedAt: '2026-07-17T22:10:00.000Z',
          },
        ],
      },
    }
    expect(
      inspectPortableContentBundle({
        ...scheduledWithJobUnsigned,
        digest: createHash('sha256').update(canonicalJson(scheduledWithJobUnsigned)).digest('hex'),
      }),
    ).toMatchObject({ status: 'valid' })

    const scheduledRunAtMismatch = structuredClone(scheduledWithJobUnsigned)
    scheduledRunAtMismatch.data.publicationJobs[0]!.runAt = '2026-07-18T10:05:00.000Z'
    expect(
      inspectPortableContentBundle({
        ...scheduledRunAtMismatch,
        digest: createHash('sha256').update(canonicalJson(scheduledRunAtMismatch)).digest('hex'),
      }),
    ).toMatchObject({
      issues: expect.arrayContaining([
        expect.stringContaining('does not match its active publication job'),
      ]),
      status: 'invalid',
    })

    const publishedPointerMismatch = structuredClone(scheduledWithJobUnsigned)
    publishedPointerMismatch.data.articles[0]!.publishedAt = null
    expect(
      inspectPortableContentBundle({
        ...publishedPointerMismatch,
        digest: createHash('sha256').update(canonicalJson(publishedPointerMismatch)).digest('hex'),
      }),
    ).toMatchObject({
      issues: expect.arrayContaining([
        expect.stringContaining('incomplete published revision metadata'),
        expect.stringContaining('cannot restore published visibility'),
      ]),
      status: 'invalid',
    })

    const duplicateActiveJob = structuredClone(scheduledWithJobUnsigned)
    duplicateActiveJob.data.publicationJobs.push({
      ...duplicateActiveJob.data.publicationJobs[0]!,
      id: 'publication-job-active-duplicate',
      idempotencyKey: 'active-job-duplicate',
    })
    expect(
      inspectPortableContentBundle({
        ...duplicateActiveJob,
        digest: createHash('sha256').update(canonicalJson(duplicateActiveJob)).digest('hex'),
      }),
    ).toMatchObject({
      issues: expect.arrayContaining([
        expect.stringContaining('exactly one active publication job'),
      ]),
      status: 'invalid',
    })

    await objects.deleteOriginal(bundle.media.objects[0]!.key)
    expect(await verifyPortableMedia(bundle, objects)).toEqual({
      failed: [bundle.media.objects[0]!.key],
      verified: 0,
    })
  })
})
