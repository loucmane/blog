import { describe, expect, it } from 'vitest'

import { createDesignLabStory } from './seed'
import { actionIntoStory, mutationIntoStory, storyToDocument } from './story-document'
import type { Article, ArticleRevision } from '@/server/content/domain'

function article(status: Article['status'], version: number): Article {
  return {
    createdAt: '2026-07-20T00:00:00.000Z',
    currentDraftRevisionId: 'revision-1',
    dek: 'A complete summary for the design-lab contract.',
    deletedAt: null,
    id: 'article-1',
    preDeleteStatus: null,
    publishedAt: status === 'published' ? '2026-07-20T01:00:00.000Z' : null,
    publishedRevisionId: status === 'published' ? 'revision-1' : null,
    scheduledAt: null,
    scheduledRevisionId: null,
    slug: 'design-lab-contract',
    status,
    title: 'Design lab contract',
    updatedAt: '2026-07-20T01:00:00.000Z',
    version,
  }
}

function revision(revisionNumber = 1): ArticleRevision {
  return {
    articleId: 'article-1',
    createdAt: '2026-07-20T00:00:00.000Z',
    document: {
      articleId: 'article-1',
      document: {
        content: [{ content: [{ text: 'Body', type: 'text' }], type: 'paragraph' }],
        type: 'doc',
      },
      migrationProvenance: [],
      schemaVersion: 4,
      title: 'Design lab contract',
    },
    id: `revision-${revisionNumber}`,
    revisionNumber,
  }
}

describe('design-lab story document adapter', () => {
  it('persists uploaded media as a portable content node', () => {
    const document = storyToDocument({
      ...createDesignLabStory(),
      imageAlt: 'A useful description',
      imageCaption: 'A useful caption',
      imageCredit: 'North House',
      mediaId: 'media-1',
    })
    expect(document.content?.[0]).toMatchObject({
      attrs: { alt: 'A useful description', mediaId: 'media-1' },
      type: 'mediaImage',
    })
  })

  it('maps save and mixed lifecycle response shapes without losing revision identity', () => {
    const saved = mutationIntoStory(createDesignLabStory(), {
      article: article('draft', 2),
      revision: revision(3),
    })
    expect(saved.server).toMatchObject({ revisionId: 'revision-3', revisionNumber: 3, version: 2 })
    expect(
      actionIntoStory(saved, { article: article('published', 3), revision: revision(3) }),
    ).toMatchObject({
      server: { revisionId: 'revision-3', version: 3 },
      status: 'published',
    })
    expect(actionIntoStory(saved, article('unpublished', 4))).toMatchObject({
      server: { revisionId: 'revision-3', version: 4 },
      status: 'unpublished',
    })
  })
})
