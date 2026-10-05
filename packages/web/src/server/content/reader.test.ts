import { describe, expect, it } from 'vitest'

import { CURRENT_CONTENT_DOCUMENT_VERSION, type ContentDocument } from './document'
import { InMemoryContentRepository } from './in-memory-repository'
import type { Clock, IdentifierSource } from './ports'
import { ContentReader } from './reader'
import { ContentService } from './service'

const clock: Clock = { now: () => new Date('2026-07-17T23:30:00.000Z') }
let sequence = 0
const identifiers: IdentifierSource = {
  next: (kind) => {
    sequence += 1
    return `${kind}-reader-${sequence}`
  },
}

function document(articleId: string, text: string): ContentDocument {
  return {
    articleId,
    document: { content: [{ content: [{ text, type: 'text' }], type: 'paragraph' }], type: 'doc' },
    migrationProvenance: [],
    schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
    title: text,
  }
}

describe('content reader boundary', () => {
  it('exposes only the immutable published pointer while preview follows the latest draft', async () => {
    sequence = 0
    const repository = new InMemoryContentRepository()
    const service = new ContentService(repository, clock, identifiers)
    const reader = new ContentReader(repository)
    const created = await service.createArticle({
      dek: 'Reader boundary proof',
      document: document('article-reader', 'Published body'),
      id: 'article-reader',
      idempotencyKey: 'create-reader',
      slug: 'reader-boundary',
      title: 'Reader boundary',
    })

    expect(await reader.loadPublished(created.article.slug)).toBeNull()
    await service.publish({
      articleId: created.article.id,
      expectedVersion: 1,
      idempotencyKey: 'publish-reader',
      revisionId: created.revision.id,
    })
    const saved = await service.saveDraft({
      articleId: created.article.id,
      document: document(created.article.id, 'Private draft body'),
      expectedVersion: 2,
      idempotencyKey: 'save-reader',
    })

    expect((await reader.loadPublished(created.article.slug))?.revision.document.title).toBe(
      'Published body',
    )
    expect((await reader.loadPreview(created.article.id))?.revision.id).toBe(saved.revision.id)
  })
})
