import { revalidateTag } from 'next/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CURRENT_CONTENT_DOCUMENT_VERSION } from '@/server/content/document'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import type { Clock } from '@/server/content/ports'
import { SectionService } from '@/server/content/sections'
import { ContentService } from '@/server/content/service'

import { dataCache } from '../../tests/support/data-cache'
import {
  authorCacheTag,
  expirePublicReader,
  loadAuthorView,
  loadSectionView,
  loadTopicView,
  topicCacheTag,
} from './cache'
import { resolveReaderStore } from './store'

vi.mock('next/cache', async () => {
  const { dataCache: standIn } = await import('../../tests/support/data-cache')
  return {
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn((tag: string) => standIn.expireTag(tag)),
    unstable_cache: standIn.cache,
  }
})

vi.mock('./store', () => ({ resolveReaderStore: vi.fn() }))

const createdAt = '2026-10-01T07:00:00.000Z'

function clockAt(iso: string): Clock {
  return { now: () => new Date(iso) }
}

let repository: InMemoryContentRepository

beforeEach(() => {
  dataCache.reset()
  repository = new InMemoryContentRepository()
  vi.mocked(resolveReaderStore).mockReturnValue({
    mediaAvailable: false,
    objects: null,
    repository,
    variants: null,
  })
})

/**
 * Publishes a story credited to the "design" author, tagged "design", and filed in the "design"
 * section, so all three pages share one slug.
 */
async function publishDesignStory(slug: string, publishedAt = createdAt) {
  const clock = clockAt(publishedAt)
  const content = new ContentService(repository, clock)
  const articleId = `article-${slug}`
  const created = await content.createArticle({
    dek: `Summary for ${slug}`,
    document: {
      articleId,
      document: {
        content: [{ content: [{ text: `Body of ${slug}`, type: 'text' }], type: 'paragraph' }],
        type: 'doc',
      },
      migrationProvenance: [],
      schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
      title: `Title for ${slug}`,
    },
    id: articleId,
    idempotencyKey: `create-${slug}`,
    slug,
    title: `Title for ${slug}`,
  })
  const sections = new SectionService(repository, clock)
  const section = await sections.ensureSection({ name: 'Design section', slug: 'design' })
  await sections.assignSection({ articleId, sectionId: section.id })
  await repository.transaction(async (transaction) => {
    if (!(await transaction.listAuthors()).some(({ id }) => id === 'author-design')) {
      await transaction.saveAuthor({
        bio: 'The design desk.',
        createdAt,
        displayName: 'Design Desk',
        id: 'author-design',
        slug: 'design',
        updatedAt: createdAt,
      })
      await transaction.saveTaxonomyTerm({
        createdAt,
        id: 'tag-design',
        kind: 'tag',
        name: 'Design topic',
        slug: 'design',
        updatedAt: createdAt,
      })
    }
    await transaction.setArticleAuthors(articleId, ['author-design'])
    await transaction.saveArticleTaxonomy({ articleId, position: 1, taxonomyId: 'tag-design' })
    transaction.recordPublicationChange()
  })
  await content.publish({
    articleId,
    expectedVersion: created.article.version,
    idempotencyKey: `publish-${slug}`,
    revisionId: created.revision.id,
  })
}

function storySlugs(result: Awaited<ReturnType<typeof loadAuthorView | typeof loadTopicView>>) {
  return result.status === 'ready' ? result.view?.stories.map(({ slug }) => slug) : undefined
}

describe('author and topic views in the public reader cache', () => {
  it('caches author, topic, and section views apart when they share a slug', async () => {
    await publishDesignStory('first-design-story')
    const reads = vi.spyOn(repository, 'transaction')

    const author = await loadAuthorView('design')
    const topic = await loadTopicView('design')
    const section = await loadSectionView('design')

    expect(author).toMatchObject({
      status: 'ready',
      view: { bio: 'The design desk.', href: '/authors/design', name: 'Design Desk' },
    })
    expect(topic).toMatchObject({
      status: 'ready',
      view: { href: '/topics/design', name: 'Design topic' },
    })
    expect(section).toMatchObject({
      status: 'ready',
      view: { href: '/sections/design', name: 'Design section' },
    })
    expect(reads).toHaveBeenCalledTimes(3)

    // Until the publication version changes, every request gets the cached entries.
    expect(await loadAuthorView('design')).toEqual(author)
    expect(await loadTopicView('design')).toEqual(topic)
    expect(reads).toHaveBeenCalledTimes(3)
  })

  it('reads author and topic views again once the publication version advances', async () => {
    await publishDesignStory('first-design-story')
    expect(storySlugs(await loadAuthorView('design'))).toEqual(['first-design-story'])
    expect(storySlugs(await loadTopicView('design'))).toEqual(['first-design-story'])

    await publishDesignStory('second-design-story', '2026-10-02T07:00:00.000Z')

    // No tag expired: the new publication version alone keeps the old entries from answering.
    expect(vi.mocked(revalidateTag)).not.toHaveBeenCalled()
    expect(storySlugs(await loadAuthorView('design'))).toEqual([
      'second-design-story',
      'first-design-story',
    ])
    expect(storySlugs(await loadTopicView('design'))).toEqual([
      'second-design-story',
      'first-design-story',
    ])
  })

  it('expires author and topic views with the public reader, and each by its own tag', async () => {
    await publishDesignStory('first-design-story')
    const author = await loadAuthorView('design')
    const topic = await loadTopicView('design')

    revalidateTag(authorCacheTag('design'), { expire: 0 })
    const authorAfterItsTag = await loadAuthorView('design')
    expect(authorAfterItsTag).not.toEqual(author)
    expect(await loadTopicView('design')).toEqual(topic)

    revalidateTag(topicCacheTag('design'), { expire: 0 })
    expect(await loadTopicView('design')).not.toEqual(topic)

    const cached = [await loadAuthorView('design'), await loadTopicView('design')]
    expirePublicReader()
    expect(await loadAuthorView('design')).not.toEqual(cached[0])
    expect(await loadTopicView('design')).not.toEqual(cached[1])
  })

  it('names author and topic cache tags apart from story and section tags', () => {
    expect(authorCacheTag('design')).toBe('author:design')
    expect(topicCacheTag('design')).toBe('topic:design')
  })

  it('says the reader is unavailable when no content store is configured', async () => {
    vi.mocked(resolveReaderStore).mockReturnValue(null)

    expect(await loadAuthorView('design')).toEqual({ status: 'unavailable' })
    expect(await loadTopicView('design')).toEqual({ status: 'unavailable' })
  })
})
