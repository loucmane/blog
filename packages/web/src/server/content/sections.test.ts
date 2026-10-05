import { describe, expect, it } from 'vitest'

import { CURRENT_CONTENT_DOCUMENT_VERSION } from './document'
import { InMemoryContentRepository } from './in-memory-repository'
import type { Clock, IdentifierSource } from './ports'
import { maxSectionNameLength, SectionService } from './sections'
import { ContentService } from './service'

const clock: Clock = { now: () => new Date('2026-09-01T07:00:00.000Z') }

function identifiers(): IdentifierSource {
  let sequence = 0
  return {
    next: (kind) => {
      sequence += 1
      return `${kind}-${sequence}`
    },
  }
}

async function createArticle(repository: InMemoryContentRepository, id: string) {
  return new ContentService(repository, clock).createArticle({
    dek: 'A summary',
    document: {
      articleId: id,
      document: { content: [{ type: 'paragraph' }], type: 'doc' },
      migrationProvenance: [],
      schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
      title: 'A story',
    },
    id,
    idempotencyKey: `create-${id}`,
    slug: id,
    title: 'A story',
  })
}

describe('section service', () => {
  it('creates a section once and returns the existing one for the same slug', async () => {
    const repository = new InMemoryContentRepository()
    const service = new SectionService(repository, clock, identifiers())

    const created = await service.ensureSection({ name: '  Interiors ', slug: 'Interiors' })
    const again = await service.ensureSection({ name: 'Renamed', slug: 'interiors' })

    expect(created).toEqual({
      createdAt: '2026-09-01T07:00:00.000Z',
      id: 'section-1',
      kind: 'section',
      name: 'Interiors',
      slug: 'interiors',
      updatedAt: '2026-09-01T07:00:00.000Z',
    })
    expect(again).toEqual(created)
    expect(await repository.inspect((transaction) => transaction.listTaxonomyTerms())).toHaveLength(
      1,
    )
  })

  it('rejects empty and overlong names and invalid slugs', async () => {
    const service = new SectionService(new InMemoryContentRepository(), clock)

    await expect(service.ensureSection({ name: ' ', slug: 'blank' })).rejects.toThrow(
      'Section names must contain',
    )
    await expect(
      service.ensureSection({ name: 'x'.repeat(maxSectionNameLength + 1), slug: 'long' }),
    ).rejects.toThrow('Section names must contain')
    await expect(service.ensureSection({ name: 'Bad', slug: '!' })).rejects.toThrow('Slug must')
  })

  it('links an article to sections idempotently, in order, with an audit record', async () => {
    const repository = new InMemoryContentRepository()
    const service = new SectionService(repository, clock, identifiers())
    await createArticle(repository, 'article-linked')
    const interiors = await service.ensureSection({
      id: 'section-interiors',
      name: 'Interiors',
      slug: 'interiors',
    })
    const craft = await service.ensureSection({ id: 'section-craft', name: 'Craft', slug: 'craft' })

    const first = await service.assignSection({
      actorId: 'owner',
      articleId: 'article-linked',
      sectionId: interiors.id,
    })
    const repeated = await service.assignSection({
      articleId: 'article-linked',
      sectionId: interiors.id,
    })
    const second = await service.assignSection({ articleId: 'article-linked', sectionId: craft.id })

    expect(first).toEqual({
      articleId: 'article-linked',
      position: 0,
      taxonomyId: 'section-interiors',
    })
    expect(repeated).toEqual(first)
    expect(second).toEqual({
      articleId: 'article-linked',
      position: 1,
      taxonomyId: 'section-craft',
    })
    const audits = await repository.inspect((transaction) =>
      transaction.listAuditEvents('article-linked'),
    )
    expect(audits.filter(({ action }) => action === 'article.section-assigned')).toEqual([
      expect.objectContaining({
        actorId: 'owner',
        metadata: { sectionId: 'section-interiors', sectionSlug: 'interiors' },
      }),
      expect.objectContaining({
        actorId: null,
        metadata: { sectionId: 'section-craft', sectionSlug: 'craft' },
      }),
    ])
  })

  it('refuses unknown articles and unknown sections', async () => {
    const repository = new InMemoryContentRepository()
    const service = new SectionService(repository, clock)
    await createArticle(repository, 'article-known')
    const section = await service.ensureSection({ name: 'Craft', slug: 'craft' })

    await expect(
      service.assignSection({ articleId: 'article-missing', sectionId: section.id }),
    ).rejects.toMatchObject({ code: 'content_not_found' })
    await expect(
      service.assignSection({ articleId: 'article-known', sectionId: 'section-missing' }),
    ).rejects.toMatchObject({ code: 'content_not_found' })
  })
})
