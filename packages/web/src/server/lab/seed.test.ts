import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { ArticleBlock } from '@/reader/views'
import { readArticleView, readHomeView, readSectionView } from '@/reader/read-model'
import { CURRENT_CONTENT_DOCUMENT_VERSION, type ContentNode } from '@/server/content/document'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { InMemoryOriginalObjectStore, MediaOriginalService } from '@/server/content/media'
import { ContentService } from '@/server/content/service'

import { labSeedBarrier } from '../../../tests/support/lab-seed-barrier'

import { labImages, labStories } from './north-house'
import type * as Illustrations from './illustrations'
import { renderIllustration } from './illustrations'
import {
  LabSeedBusyError,
  labSeedAllowed,
  labStorySlug,
  seedLabContent,
  type LabSeedReport,
} from './seed'

// These tests prove seed/locking behavior, not image rendering. Tiny real PNGs
// avoid nine full-size renders per worker; illustrations.test.ts and the real
// PostgreSQL/S3 integration suite retain full-size image coverage.
vi.mock('./illustrations', async (importOriginal) => {
  const actual = await importOriginal<typeof Illustrations>()
  return {
    ...actual,
    renderIllustration: (spec: Illustrations.IllustrationSpec) =>
      actual.renderIllustration({ ...spec, width: 4, height: 4 }),
  }
})

describe('seed concurrency and media preservation', () => {
  it.each([false, true])(
    'preserves owner media when present at the first check: %s',
    async (present) => {
      const repository = new InMemoryContentRepository()
      const objects = new InMemoryOriginalObjectStore()
      const media = new MediaOriginalService(repository, objects)
      const image = labImages[0]!
      const put = vi.spyOn(objects, 'putOriginal')
      const createOwnerMedia = () =>
        media.store({
          ...image,
          body: renderIllustration(image.illustration),
          contentType: 'image/png',
        })
      if (present) await createOwnerMedia()
      const checked = labSeedBarrier()
      const resume = labSeedBarrier()
      const run = seedLabContent(
        { repository, objects },
        {
          afterMediaCheck: async (id) => {
            if (id !== image.id) return
            checked.resolve()
            await resume.promise
          },
        },
      )
      try {
        await checked.promise
        const putsBefore = put.mock.calls.length
        await expect(seedLabContent({ repository, objects })).rejects.toBeInstanceOf(
          LabSeedBusyError,
        )
        expect(put).toHaveBeenCalledTimes(putsBefore)
        if (!present) await createOwnerMedia()
        await repository.transaction(async (transaction) => {
          const asset = await transaction.getMediaAsset(image.id)
          await transaction.saveMediaAsset({
            ...asset!,
            alt: 'Owner alt',
            caption: 'Owner caption',
          })
        })
      } finally {
        resume.resolve()
        await run
      }
      expect((await run).images.created).toHaveLength(labImages.length - 1)
      expect(put).toHaveBeenCalledTimes(labImages.length)
      const beforeReplay = await repository.transaction((transaction) =>
        transaction.listMediaAssets(),
      )
      expect(beforeReplay.find(({ id }) => id === image.id)).toMatchObject({
        alt: 'Owner alt',
        caption: 'Owner caption',
      })
      const replay = await seedLabContent({ repository, objects })
      expect(replay.images.created).toEqual([])
      expect(put).toHaveBeenCalledTimes(labImages.length)
      expect(await repository.transaction((transaction) => transaction.listMediaAssets())).toEqual(
        beforeReplay,
      )
    },
  )

  it.each(['upload', 'verification'])(
    'releases the seed lock and rolls back a failed %s',
    async (failure) => {
      const repository = new InMemoryContentRepository()
      const objects = new InMemoryOriginalObjectStore()
      if (failure === 'upload')
        vi.spyOn(objects, 'putOriginal').mockRejectedValueOnce(new Error('Fixture upload failure'))
      else vi.spyOn(objects, 'verifyOriginal').mockResolvedValueOnce(false)
      await expect(seedLabContent({ repository, objects })).rejects.toThrow()
      expect(await repository.transaction((transaction) => transaction.listMediaAssets())).toEqual(
        [],
      )
      const report = await seedLabContent({ repository, objects })
      expect(report.images.created).toHaveLength(labImages.length)
    },
  )
})

describe('seed time limits', () => {
  afterEach(() => vi.useRealTimers())

  it.each(['putOriginal', 'verifyOriginal'] as const)(
    'times out a never-settling %s, rolls back, releases the lock and permits retry',
    async (operation) => {
      vi.useFakeTimers()
      const repository = new InMemoryContentRepository()
      const objects = new InMemoryOriginalObjectStore()
      const started = labSeedBarrier()
      let signal: AbortSignal | undefined
      const hang = (ioSignal?: AbortSignal): Promise<never> => {
        signal = ioSignal
        started.resolve()
        return new Promise(() => {})
      }
      if (operation === 'putOriginal')
        vi.spyOn(objects, operation).mockImplementationOnce((_input, signal) => hang(signal))
      else vi.spyOn(objects, operation).mockImplementationOnce((_key, _sha, signal) => hang(signal))
      const run = seedLabContent({ repository, objects })
      const failed = expect(run).rejects.toThrow('Lab seed storage timed out')
      await started.promise
      await expect(seedLabContent({ repository, objects })).rejects.toBeInstanceOf(LabSeedBusyError)
      await vi.advanceTimersByTimeAsync(29_999)
      expect(signal?.aborted).toBe(false)
      await vi.advanceTimersByTimeAsync(1)
      await failed
      expect(signal?.aborted).toBe(true)
      expect(vi.getTimerCount()).toBe(0)
      await repository.inspect(async (transaction) => {
        expect(await transaction.listMediaAssets()).toEqual([])
        expect(await transaction.listArticles()).toEqual([])
      })
      const retry = await seedLabContent({ repository, objects })
      expect(retry.images.created).toHaveLength(labImages.length)
      expect(retry.stories.created).toHaveLength(labStories.length)
      expect(vi.getTimerCount()).toBe(0)
    },
  )

  it('caps an active storage wait at the overall run deadline', async () => {
    vi.useFakeTimers()
    const repository = new InMemoryContentRepository()
    const objects = new InMemoryOriginalObjectStore()
    const started = labSeedBarrier()
    let signal: AbortSignal | undefined
    vi.spyOn(objects, 'putOriginal').mockImplementationOnce((_input, ioSignal) => {
      signal = ioSignal
      started.resolve()
      return new Promise(() => {})
    })
    const run = seedLabContent({ repository, objects }, { runTimeoutMs: 50, storageTimeoutMs: 100 })
    const failed = expect(run).rejects.toThrow('run deadline')
    await started.promise
    await vi.advanceTimersByTimeAsync(50)
    await failed
    expect(signal?.aborted).toBe(true)
    expect(await repository.transaction((transaction) => transaction.listMediaAssets())).toEqual([])
    expect((await seedLabContent({ repository, objects })).images.created).toHaveLength(
      labImages.length,
    )
  })

  it('stops before new media work after the deadline and releases the lock', async () => {
    vi.useFakeTimers()
    const repository = new InMemoryContentRepository()
    const objects = new InMemoryOriginalObjectStore()
    const put = vi.spyOn(objects, 'putOriginal')
    await expect(
      seedLabContent(
        { repository, objects },
        {
          afterMediaCheck: async () => {
            vi.advanceTimersByTime(300_000)
          },
        },
      ),
    ).rejects.toThrow('run deadline')
    expect(put).not.toHaveBeenCalled()
    expect(await repository.transaction((transaction) => transaction.listArticles())).toEqual([])
    expect((await seedLabContent({ repository, objects })).images.created).toHaveLength(
      labImages.length,
    )
  })

  it('checks the deadline at transaction boundaries even without media storage', async () => {
    vi.useFakeTimers()
    const repository = new InMemoryContentRepository()
    const transaction = repository.transaction.bind(repository)
    vi.spyOn(repository, 'transaction').mockImplementationOnce((work) =>
      transaction(async (tx) => {
        vi.advanceTimersByTime(300_000)
        return work(tx)
      }),
    )
    await expect(seedLabContent({ repository, objects: null })).rejects.toThrow('run deadline')
    expect(await repository.transaction((tx) => tx.listTaxonomyTerms())).toEqual([])
    expect((await seedLabContent({ repository, objects: null })).stories.created).toHaveLength(
      labStories.length,
    )
  })
})

const documentNodeTypes = [
  'blockquote',
  'bulletList',
  'callout',
  'codeBlock',
  'doc',
  'editorialBlock',
  'embed',
  'gallery',
  'hardBreak',
  'heading',
  'horizontalRule',
  'listItem',
  'mediaImage',
  'orderedList',
  'paragraph',
  'pullQuote',
  'taskItem',
  'taskList',
  'text',
]

function storySlug(id: string): string {
  const story = labStories.find((candidate) => candidate.id === id)
  if (!story) throw new Error(`Unknown lab story ${id}`)
  return labStorySlug(story)
}

function nodeTypes(node: ContentNode, types = new Set<string>()): Set<string> {
  types.add(node.type)
  for (const child of node.content ?? []) nodeTypes(child, types)
  return types
}

function blockKinds(blocks: readonly ArticleBlock[], kinds = new Set<string>()): Set<string> {
  for (const block of blocks) {
    kinds.add(block.kind)
    if (block.kind === 'quote' || block.kind === 'editorial') blockKinds(block.blocks, kinds)
    if (
      block.kind === 'bulleted-list' ||
      block.kind === 'numbered-list' ||
      block.kind === 'checklist'
    ) {
      for (const item of block.items) blockKinds(item.blocks, kinds)
    }
  }
  return kinds
}

describe('Reader Lab seed', () => {
  let repository: InMemoryContentRepository
  let objects: InMemoryOriginalObjectStore
  let firstRun: LabSeedReport

  beforeAll(async () => {
    repository = new InMemoryContentRepository()
    objects = new InMemoryOriginalObjectStore()
    firstRun = await seedLabContent({ objects, repository })
  })

  it('publishes eight North House stories across three sections, with images', async () => {
    const source = { mediaAvailable: true, repository }
    const home = await readHomeView(source)

    expect(firstRun.sections).toEqual(['architecture', 'craft', 'interiors'])
    expect(firstRun.stories.created).toHaveLength(8)
    expect(firstRun.images).toEqual({
      created: labImages.map(({ id }) => id),
      existing: [],
      skipped: null,
    })
    expect(home.lead?.title).toBe('The quiet architecture of winter light')
    expect(home.lead?.image).toMatchObject({
      height: 960,
      mediaId: 'media-lab-winter-light',
      width: 1440,
    })
    expect(home.recent).toHaveLength(7)
    expect(home.navigation.sections.map(({ name }) => name)).toEqual([
      'Architecture',
      'Craft',
      'Interiors',
    ])
    for (const slug of ['architecture', 'craft', 'interiors']) {
      expect((await readSectionView(source, slug))?.stories.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('is idempotent and keeps existing stories, images, and sections as they are', async () => {
    const secondRun = await seedLabContent({ objects, repository })

    expect(secondRun.stories).toEqual({
      created: [],
      existing: firstRun.stories.created,
      slugInUse: [],
    })
    expect(secondRun.images).toEqual({
      created: [],
      existing: labImages.map(({ id }) => id),
      skipped: null,
    })
    await repository.inspect(async (transaction) => {
      expect(await transaction.listArticles()).toHaveLength(8)
      expect(await transaction.listMediaAssets()).toHaveLength(labImages.length)
      expect(await transaction.listTaxonomyTerms()).toHaveLength(3)
      expect(await transaction.listArticleTaxonomies()).toHaveLength(8)
    })
  })

  it('covers the edge cases public designs must handle', async () => {
    const source = { mediaAvailable: true, repository }
    const longTitle = await readArticleView(source, storySlug('article-lab-boathouse'))
    const noImage = await readArticleView(source, storySlug('article-lab-chair'))
    const short = await readArticleView(source, storySlug('article-lab-shelf'))
    const longRead = await readArticleView(source, storySlug('article-lab-long-table'))
    const longReadStory = labStories.find(({ id }) => id === 'article-lab-long-table')

    expect(longTitle?.title.length).toBeGreaterThan(150)
    expect(longTitle?.slug.length).toBeGreaterThan(120)
    expect(noImage).toMatchObject({ hero: null })
    expect(JSON.stringify(noImage?.body)).not.toContain('"image"')
    expect(short).toMatchObject({ readingMinutes: 1 })
    expect(short?.body).toHaveLength(2)
    expect(longRead?.readingMinutes).toBeGreaterThanOrEqual(5)
    expect([...blockKinds(longRead?.body ?? [])].sort()).toEqual([
      'bulleted-list',
      'callout',
      'checklist',
      'code',
      'divider',
      'editorial',
      'embed',
      'gallery',
      'heading',
      'image',
      'numbered-list',
      'paragraph',
      'pull-quote',
      'quote',
    ])
    expect(
      [...nodeTypes({ content: longReadStory?.blocks as ContentNode[], type: 'doc' })].sort(),
    ).toEqual(documentNodeTypes)
  })

  it('creates the stories without images when media storage is not configured', async () => {
    const withoutMedia = new InMemoryContentRepository()

    const report = await seedLabContent({ objects: null, repository: withoutMedia })

    expect(report.images).toEqual({
      created: [],
      existing: [],
      skipped: 'Media storage is not configured, so no images were stored.',
    })
    expect(report.stories.created).toHaveLength(8)
    expect(
      (
        await readArticleView(
          { mediaAvailable: false, repository: withoutMedia },
          storySlug('article-lab-winter-light'),
        )
      )?.hero,
    ).toBeNull()
  })

  it('leaves a story alone when another article already uses its slug', async () => {
    const occupied = new InMemoryContentRepository()
    const slug = storySlug('article-lab-door-handle')
    await new ContentService(occupied).createArticle({
      dek: 'The owner wrote this first.',
      document: {
        articleId: 'article-owner',
        document: { content: [{ type: 'paragraph' }], type: 'doc' },
        migrationProvenance: [],
        schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
        title: 'Owner story',
      },
      id: 'article-owner',
      idempotencyKey: 'create-owner',
      slug,
      title: 'Owner story',
    })

    const report = await seedLabContent({ objects: null, repository: occupied })

    expect(report.stories.slugInUse).toEqual([slug])
    expect(report.stories.created).toHaveLength(7)
  })

  it('requires explicit Preview intent in a production runtime while preserving local labs', () => {
    expect(labSeedAllowed({ NODE_ENV: 'production' })).toBe(false)
    expect(
      labSeedAllowed({ NODE_ENV: 'production', MAGAZINE_DEPLOYMENT_ENVIRONMENT: 'preview' }),
    ).toBe(true)
    expect(
      labSeedAllowed({ NODE_ENV: 'test', MAGAZINE_DEPLOYMENT_ENVIRONMENT: 'production' }),
    ).toBe(false)
    expect(labSeedAllowed({ NODE_ENV: 'development' })).toBe(true)
    expect(labSeedAllowed({ NODE_ENV: 'test' })).toBe(true)
  })

  it('does not publish, edit or assign sections to an existing owner article with a sample ID', async () => {
    const occupied = new InMemoryContentRepository()
    const id = 'article-lab-winter-light'
    const owner = await new ContentService(occupied).createArticle({
      id,
      title: 'Owner draft',
      slug: 'owner-draft',
      dek: 'Keep my words.',
      idempotencyKey: 'fixture-owner-draft',
      document: {
        articleId: id,
        document: { type: 'doc', content: [{ type: 'paragraph' }] },
        migrationProvenance: [],
        schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
        title: 'Owner draft',
      },
    })
    const report = await seedLabContent({ objects: null, repository: occupied })
    expect(report.stories.existing).toContain(storySlug(id))
    await occupied.inspect(async (transaction) => {
      expect(await transaction.getArticle(id)).toEqual(owner.article)
      expect(await transaction.listRevisions(id)).toEqual([owner.revision])
      expect(
        (await transaction.listArticleTaxonomies()).filter((link) => link.articleId === id),
      ).toEqual([])
    })
  })
})
