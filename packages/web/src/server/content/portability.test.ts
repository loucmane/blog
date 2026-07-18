import { describe, expect, it } from 'vitest'

import type { ContentDocument } from './document'
import { ImportCollisionError } from './errors'
import { InMemoryContentRepository } from './in-memory-repository'
import { InMemoryOriginalObjectStore, MediaOriginalService } from './media'
import {
  createPortableContentBundle,
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
    schemaVersion: 3,
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

    await objects.deleteOriginal(bundle.media.objects[0]!.key)
    expect(await verifyPortableMedia(bundle, objects)).toEqual({
      failed: [bundle.media.objects[0]!.key],
      verified: 0,
    })
  })
})
