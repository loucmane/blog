import { createHash } from 'node:crypto'

import { describe, expect, it, vi } from 'vitest'

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
  type PortableContentBundle,
} from './portability'
import type { Clock, ContentTransaction, IdentifierSource } from './ports'
import { ContentService } from './service'

class Identifiers implements IdentifierSource {
  private index = 0

  next(kind: string): string {
    this.index += 1
    return `${kind}-portable-${this.index}`
  }
}

/** Fails every byline write, after authors and articles are already written in the transaction. */
class FailingBylineRepository extends InMemoryContentRepository {
  override transaction<T>(work: (transaction: ContentTransaction) => Promise<T>): Promise<T> {
    return super.transaction((transaction) =>
      work(
        new Proxy(transaction, {
          get(target, property, receiver) {
            if (property === 'setArticleAuthors') {
              return () => Promise.reject(new Error('byline write failed'))
            }
            const value: unknown = Reflect.get(target, property, receiver)
            return typeof value === 'function' ? value.bind(target) : value
          },
        }),
      ),
    )
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
    await transaction.saveAuthor({
      bio: 'Contributing writer',
      createdAt: '2026-07-17T22:00:00.000Z',
      displayName: 'Guest writer',
      id: 'author-guest',
      slug: 'guest-writer',
      updatedAt: '2026-07-17T22:00:00.000Z',
    })
    await transaction.setArticleAuthors(created.article.id, ['author-owner', 'author-guest'])
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
  return { objects, repository, service }
}

function withArticleAuthors(bundle: PortableContentBundle, articleAuthors: unknown) {
  const { digest: _discarded, ...base } = bundle
  const unsigned = { ...base, data: { ...base.data, articleAuthors } }
  return { ...unsigned, digest: createHash('sha256').update(canonicalJson(unsigned)).digest('hex') }
}

describe('portable content ownership', () => {
  it('exports deterministically and recreates identities and relationships in an empty store', async () => {
    const { objects, repository } = await populatedRepository()
    const exportedAt = '2026-07-17T22:30:00.000Z'
    const first = await createPortableContentBundle(repository, exportedAt)
    const second = await createPortableContentBundle(repository, exportedAt)
    expect(second).toEqual(first)
    expect(first.data.articleAuthors).toEqual([
      { articleId: 'article-portable', authorId: 'author-owner', position: 0 },
      { articleId: 'article-portable', authorId: 'author-guest', position: 1 },
    ])
    expect(inspectPortableContentBundle(first)).toMatchObject({ status: 'valid' })
    expect(await verifyPortableMedia(first, objects)).toEqual({ failed: [], verified: 1 })

    const restored = new InMemoryContentRepository()
    await expect(importPortableContentBundle(restored, first)).resolves.toMatchObject({
      imported: { articleAuthors: 2, articles: 1, mediaAssets: 1, revisions: 1, taxonomies: 1 },
    })
    const byline = await restored.transaction((transaction) =>
      transaction.listArticleAuthors('article-portable'),
    )
    expect(byline.map(({ id }) => id)).toEqual(['author-owner', 'author-guest'])
    const restoredBundle = await createPortableContentBundle(restored, exportedAt)
    expect(restoredBundle).toEqual(first)
  })

  it('restores each byline by position even when links are interleaved and out of order', async () => {
    const { repository, service } = await populatedRepository()
    for (const articleId of ['article-second', 'article-empty']) {
      await service.createArticle({
        dek: '',
        document: document(articleId),
        id: articleId,
        idempotencyKey: `create-${articleId}`,
        slug: articleId,
        title: articleId,
      })
    }
    await repository.transaction((transaction) =>
      transaction.setArticleAuthors('article-second', ['author-guest', 'author-owner']),
    )
    const exportedAt = '2026-07-17T22:30:00.000Z'
    const bundle = await createPortableContentBundle(repository, exportedAt)
    const links = [
      { articleId: 'article-portable', authorId: 'author-owner', position: 0 },
      { articleId: 'article-portable', authorId: 'author-guest', position: 1 },
      { articleId: 'article-second', authorId: 'author-guest', position: 0 },
      { articleId: 'article-second', authorId: 'author-owner', position: 1 },
    ]
    expect(bundle.data.articleAuthors).toEqual(links)
    const shuffled = withArticleAuthors(bundle, [links[3], links[1], links[2], links[0]])
    const restored = new InMemoryContentRepository()
    await expect(importPortableContentBundle(restored, shuffled)).resolves.toMatchObject({
      imported: { articleAuthors: 4, articles: 3 },
    })
    await restored.transaction(async (transaction) => {
      expect(
        (await transaction.listArticleAuthors('article-portable')).map(({ id }) => id),
      ).toEqual(['author-owner', 'author-guest'])
      expect((await transaction.listArticleAuthors('article-second')).map(({ id }) => id)).toEqual([
        'author-guest',
        'author-owner',
      ])
      expect(await transaction.listArticleAuthors('article-empty')).toEqual([])
    })
    expect(await createPortableContentBundle(restored, exportedAt)).toEqual(bundle)

    // A write that fails partway through rolls the whole import back.
    const failing = new FailingBylineRepository()
    await expect(importPortableContentBundle(failing, shuffled)).rejects.toThrow(
      'byline write failed',
    )
    await failing.transaction(async (transaction) => {
      expect(await transaction.listArticles()).toEqual([])
      expect(await transaction.listAuthors()).toEqual([])
    })
  })

  it('verifies and imports legacy bundles without article-author links as empty bylines', async () => {
    const { repository } = await populatedRepository()
    const current = await createPortableContentBundle(repository, '2026-07-17T22:30:00.000Z')
    const { digest: _discardedDigest, data, ...base } = current
    const { articleAuthors: _discardedLinks, ...legacyData } = data
    const unsigned = { ...base, data: legacyData }
    const legacy = {
      ...unsigned,
      digest: createHash('sha256').update(canonicalJson(unsigned)).digest('hex'),
    }
    expect(inspectPortableContentBundle(legacy)).toMatchObject({
      bundle: { data: { articleAuthors: [] } },
      status: 'valid',
    })
    const restored = new InMemoryContentRepository()
    await expect(importPortableContentBundle(restored, legacy)).resolves.toMatchObject({
      imported: { articleAuthors: 0, articles: 1 },
    })
    await expect(
      restored.transaction((transaction) => transaction.listArticleAuthors('article-portable')),
    ).resolves.toEqual([])
    const reexported = await createPortableContentBundle(restored, current.exportedAt)
    expect(reexported.data.articleAuthors).toEqual([])
    expect(reexported.data.authors).toEqual(current.data.authors)
    expect(inspectPortableContentBundle(reexported)).toMatchObject({ status: 'valid' })
  })

  it('includes article-author links in the bundle digest', async () => {
    const { repository } = await populatedRepository()
    const bundle = await createPortableContentBundle(repository, '2026-07-17T22:30:00.000Z')
    const tampered = { ...bundle, data: { ...bundle.data, articleAuthors: [] } }
    expect(inspectPortableContentBundle(tampered)).toMatchObject({
      issues: expect.arrayContaining(['bundle digest does not match canonical content']),
      status: 'invalid',
    })
  })

  it.each([
    {
      name: 'unknown article',
      links: [{ articleId: 'missing-article', authorId: 'author-owner', position: 0 }],
      issue: 'references missing article missing-article',
    },
    {
      name: 'unknown author',
      links: [{ articleId: 'article-portable', authorId: 'missing-author', position: 0 }],
      issue: 'references missing author missing-author',
    },
    {
      name: 'duplicate author on an article',
      links: [
        { articleId: 'article-portable', authorId: 'author-owner', position: 0 },
        { articleId: 'article-portable', authorId: 'author-owner', position: 1 },
      ],
      issue: 'duplicate author author-owner',
    },
    {
      name: 'duplicate position on an article',
      links: [
        { articleId: 'article-portable', authorId: 'author-owner', position: 0 },
        { articleId: 'article-portable', authorId: 'author-guest', position: 0 },
      ],
      issue: 'duplicate author position 0',
    },
    {
      name: 'position gap',
      links: [
        { articleId: 'article-portable', authorId: 'author-owner', position: 0 },
        { articleId: 'article-portable', authorId: 'author-guest', position: 2 },
      ],
      issue: 'author positions must be contiguous starting at 0',
    },
    {
      name: 'positions starting at one',
      links: [{ articleId: 'article-portable', authorId: 'author-owner', position: 1 }],
      issue: 'author positions must be contiguous starting at 0',
    },
    ...[-1, 0.5, '0', null].map((position) => ({
      name: `invalid position ${JSON.stringify(position)}`,
      links: [{ articleId: 'article-portable', authorId: 'author-owner', position }],
      issue: 'data.articleAuthors.0.position',
    })),
    {
      name: 'missing author id',
      links: [{ articleId: 'article-portable', position: 0 }],
      issue: 'data.articleAuthors.0.authorId',
    },
    {
      name: 'unexpected link field',
      links: [
        { articleId: 'article-portable', authorId: 'author-owner', position: 0, extra: true },
      ],
      issue: 'data.articleAuthors.0',
    },
    { name: 'null links', links: null, issue: 'data.articleAuthors' },
  ])('rejects $name before importing any content', async ({ links, issue }) => {
    const { repository } = await populatedRepository()
    const bundle = await createPortableContentBundle(repository, '2026-07-17T22:30:00.000Z')
    const malformed = withArticleAuthors(bundle, links)
    expect(inspectPortableContentBundle(malformed)).toMatchObject({
      issues: expect.arrayContaining([expect.stringContaining(issue)]),
      status: 'invalid',
    })
    const restored = new InMemoryContentRepository()
    await expect(importPortableContentBundle(restored, malformed)).rejects.toThrow(issue)
    await restored.transaction(async (transaction) => {
      expect(await transaction.listArticles()).toEqual([])
      expect(await transaction.listAuthors()).toEqual([])
    })
  })

  it.each([
    { collection: 'authors', label: 'authors' },
    { collection: 'taxonomies', label: 'taxonomies' },
    { collection: 'reusableBlocks', label: 'reusable blocks' },
    { collection: 'reusableBlockRevisions', label: 'reusable block revisions' },
  ] as const)(
    'rejects duplicate $label ids before accessing the import repository',
    async ({ collection, label }) => {
      const { repository } = await populatedRepository()
      await repository.transaction(async (transaction) => {
        await transaction.saveReusableBlockRevision({
          blockId: 'block-portable',
          createdAt: clock.now().toISOString(),
          document: document('block-portable'),
          id: 'block-revision-portable',
          revisionNumber: 1,
        })
        await transaction.saveReusableBlock({
          createdAt: clock.now().toISOString(),
          currentRevisionId: 'block-revision-portable',
          id: 'block-portable',
          kind: 'callout',
          name: 'Portable callout',
          updatedAt: clock.now().toISOString(),
          version: 1,
        })
      })
      const bundle = await createPortableContentBundle(repository, '2026-07-17T22:30:00.000Z')
      expect(inspectPortableContentBundle(bundle)).toMatchObject({ status: 'valid' })
      const duplicate = bundle.data[collection][0]!
      const { digest: _discarded, ...base } = bundle
      const unsigned = {
        ...base,
        data: { ...base.data, [collection]: [...base.data[collection], duplicate] },
      }
      const malformed = {
        ...unsigned,
        digest: createHash('sha256').update(canonicalJson(unsigned)).digest('hex'),
      }
      const issue = `${label} contains duplicate id ${duplicate.id}`
      expect(inspectPortableContentBundle(malformed)).toMatchObject({
        issues: [issue],
        status: 'invalid',
      })

      const restored = new InMemoryContentRepository()
      const transaction = vi.spyOn(restored, 'transaction')
      await expect(importPortableContentBundle(restored, malformed)).rejects.toThrow(issue)
      expect(transaction).not.toHaveBeenCalled()
    },
  )

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

  it('keeps what was measured about media through export and import, and reads older media as unmeasured', async () => {
    const repository = new InMemoryContentRepository()
    const media = new MediaOriginalService(
      repository,
      new InMemoryOriginalObjectStore(),
      clock,
      new Identifiers(),
    )
    await media.store({
      alt: 'A two-frame loop',
      animated: true,
      body: new TextEncoder().encode('portable animation bytes'),
      contentType: 'image/webp',
      creditName: 'Magazine owner',
      height: 48,
      id: 'media-loop',
      width: 64,
    })
    const current = await createPortableContentBundle(repository, '2026-07-17T22:30:00.000Z')
    expect(current.data.mediaAssets).toEqual([
      expect.objectContaining({ animated: true, height: 48, width: 64 }),
    ])
    const restored = new InMemoryContentRepository()
    await importPortableContentBundle(restored, current)
    await expect(
      restored.transaction((transaction) => transaction.getMediaAsset('media-loop')),
    ).resolves.toMatchObject({ animated: true, height: 48, width: 64 })

    // Bundles exported before animation was recorded have no such field.
    const { digest: _discarded, ...currentUnsigned } = current
    const unsigned = {
      ...currentUnsigned,
      data: {
        ...current.data,
        mediaAssets: current.data.mediaAssets.map(({ animated: _animated, ...asset }) => asset),
      },
    }
    const legacy = {
      ...unsigned,
      digest: createHash('sha256').update(canonicalJson(unsigned)).digest('hex'),
    }
    expect(inspectPortableContentBundle(legacy)).toMatchObject({ status: 'valid' })
    const fromLegacy = new InMemoryContentRepository()
    await importPortableContentBundle(fromLegacy, legacy)
    await expect(
      fromLegacy.transaction((transaction) => transaction.getMediaAsset('media-loop')),
    ).resolves.toMatchObject({ animated: null, height: 48, width: 64 })
  })

  it('keeps a web credit link through export and import, and refuses one that could run script', async () => {
    const repository = new InMemoryContentRepository()
    const media = new MediaOriginalService(
      repository,
      new InMemoryOriginalObjectStore(),
      clock,
      new Identifiers(),
    )
    await media.store({
      alt: 'A credited photograph',
      body: new TextEncoder().encode('portable credited bytes'),
      contentType: 'image/png',
      creditName: 'Studio',
      creditUrl: 'https://studio.example/credits',
      id: 'media-credited',
    })
    const current = await createPortableContentBundle(repository, '2026-07-17T22:30:00.000Z')
    expect(inspectPortableContentBundle(current)).toMatchObject({ status: 'valid' })
    const restored = new InMemoryContentRepository()
    await importPortableContentBundle(restored, current)
    await expect(
      restored.transaction((transaction) => transaction.getMediaAsset('media-credited')),
    ).resolves.toMatchObject({ creditUrl: 'https://studio.example/credits' })

    const { digest: _discarded, ...currentUnsigned } = current
    for (const creditUrl of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>']) {
      const unsigned = {
        ...currentUnsigned,
        data: {
          ...current.data,
          mediaAssets: current.data.mediaAssets.map((asset) => ({ ...asset, creditUrl })),
        },
      }
      const unsafe = {
        ...unsigned,
        digest: createHash('sha256').update(canonicalJson(unsigned)).digest('hex'),
      }
      const issue =
        'data.mediaAssets.0.creditUrl: credit URL must be an absolute http, https or mailto URL'

      expect(inspectPortableContentBundle(unsafe), creditUrl).toMatchObject({
        issues: [issue],
        status: 'invalid',
      })
      const target = new InMemoryContentRepository()
      await expect(importPortableContentBundle(target, unsafe), creditUrl).rejects.toThrow(issue)
      await expect(
        target.transaction((transaction) => transaction.listMediaAssets()),
      ).resolves.toEqual([])
    }
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
