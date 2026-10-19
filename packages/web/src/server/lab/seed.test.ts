import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { authorPath, topicPath } from '@/reader/paths'
import type { ArticleBlock } from '@/reader/views'
import {
  readArticleView,
  readAuthorView,
  readHomeView,
  readSectionView,
  readTopicView,
} from '@/reader/read-model'
import { CURRENT_CONTENT_DOCUMENT_VERSION, type ContentNode } from '@/server/content/document'
import type { AuthorProfile, TaxonomyTerm } from '@/server/content/domain'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { InMemoryOriginalObjectStore, MediaOriginalService } from '@/server/content/media'
import type { ContentTransaction } from '@/server/content/ports'
import { SectionService } from '@/server/content/sections'
import { ContentService } from '@/server/content/service'

import { labSeedBarrier } from '../../../tests/support/lab-seed-barrier'

import {
  labAuthors,
  labImages,
  labSections,
  labStories,
  labTopics,
  type LabStory,
} from './north-house'
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
// avoid a full-size render of every sample image per worker; illustrations.test.ts
// and the real PostgreSQL/S3 integration suite retain full-size image coverage.
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

function labAuthorName(slug: string): string | undefined {
  return labAuthors.find((author) => author.slug === slug)?.name
}

function labTopicName(slug: string): string | undefined {
  return labTopics.find((topic) => topic.slug === slug)?.name
}

/** Everything a seed run may write, and the publication version readers are cached by. */
async function snapshot(repository: InMemoryContentRepository) {
  const publicationVersion = await repository.readPublicationVersion()
  return repository.inspect(async (transaction) => ({
    articles: await transaction.listArticles(),
    audits: await transaction.listAuditEvents(),
    authors: await transaction.listAuthors(),
    bylines: await Promise.all(labStories.map(({ id }) => transaction.listArticleAuthors(id))),
    links: await transaction.listArticleTaxonomies(),
    media: await transaction.listMediaAssets(),
    publicationVersion,
    revisions: await transaction.listRevisions(),
    terms: await transaction.listTaxonomyTerms(),
  }))
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

  it('publishes twelve North House stories, at least four in each of three sections, with images', async () => {
    const source = { mediaAvailable: true, repository }
    const home = await readHomeView(source)

    expect(firstRun.sections).toEqual(['architecture', 'craft', 'interiors'])
    for (const slug of ['architecture', 'craft', 'interiors']) {
      expect((await readSectionView(source, slug))?.stories.length, slug).toBeGreaterThanOrEqual(4)
    }
    expect(firstRun.stories.created).toHaveLength(12)
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
    // The direction specs describe this front page: a long title, a story without images, then a
    // very short one.
    expect(home.recent.slice(0, 3).map(({ slug }) => slug)).toEqual([
      storySlug('article-lab-boathouse'),
      storySlug('article-lab-chair'),
      storySlug('article-lab-shelf'),
    ])
    expect(home.recent).toHaveLength(11)
    expect(home.navigation.sections.map(({ name }) => name)).toEqual([
      'Architecture',
      'Craft',
      'Interiors',
    ])
    expect(firstRun.authors).toEqual({
      created: labAuthors.map(({ slug }) => slug),
      existing: [],
      slugInUse: [],
    })
    expect(firstRun.topics).toEqual({ created: labTopics.map(({ slug }) => slug), existing: [] })
  })

  it('credits every story with one to three authors and files it under one to three topics', async () => {
    const source = { mediaAvailable: true, repository }
    for (const story of labStories) {
      const view = await readArticleView(source, labStorySlug(story))

      expect(view?.authors.length, story.id).toBeGreaterThanOrEqual(1)
      expect(view?.authors.length, story.id).toBeLessThanOrEqual(3)
      expect(view?.topics.length, story.id).toBeGreaterThanOrEqual(1)
      expect(view?.topics.length, story.id).toBeLessThanOrEqual(3)
      expect(view?.authorLinks, story.id).toEqual(
        story.authors.map((slug) => ({ href: authorPath(slug), name: labAuthorName(slug) })),
      )
      expect(view?.topics, story.id).toEqual(
        story.topics.map((slug) => ({ href: topicPath(slug), name: labTopicName(slug) })),
      )
      expect(view?.section?.slug, story.id).toBe(story.section)
    }
  })

  it('gives every author and topic several stories, and every story at least three related stories', async () => {
    const source = { mediaAvailable: true, repository }
    const authors = await repository.inspect((transaction) => transaction.listAuthors())
    const topics = (
      await repository.inspect((transaction) => transaction.listTaxonomyTerms())
    ).filter(({ kind }) => kind === 'tag')

    expect(authors).toHaveLength(5)
    expect(topics).toHaveLength(7)
    expect(authors.map(({ id }) => id).sort()).toEqual(labAuthors.map(({ id }) => id).sort())
    expect(topics.map(({ id }) => id).sort()).toEqual(labTopics.map(({ id }) => id).sort())
    const authorViews = await Promise.all(authors.map(({ slug }) => readAuthorView(source, slug)))
    for (const view of authorViews) {
      expect(view?.stories.length, view?.slug).toBeGreaterThanOrEqual(3)
    }
    // One guest contributor has no biography, so author pages must work without one.
    expect(authorViews.filter((view) => view?.bio === null).map((view) => view?.slug)).toEqual([
      'saga-lindqvist',
    ])
    for (const { slug } of topics) {
      expect((await readTopicView(source, slug))?.stories.length, slug).toBeGreaterThanOrEqual(3)
    }
    for (const story of labStories) {
      const related = (await readArticleView(source, labStorySlug(story)))?.related
      expect(related?.length, story.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('is idempotent and keeps existing stories, images, sections, authors and topics as they are', async () => {
    const before = await snapshot(repository)

    const secondRun = await seedLabContent({ objects, repository })

    expect(secondRun.stories).toEqual({
      created: [],
      existing: firstRun.stories.created,
      resumed: [],
      slugInUse: [],
    })
    expect(secondRun.images).toEqual({
      created: [],
      existing: labImages.map(({ id }) => id),
      skipped: null,
    })
    expect(secondRun.authors).toEqual({
      created: [],
      existing: firstRun.authors.created,
      slugInUse: [],
    })
    expect(secondRun.topics).toEqual({ created: [], existing: firstRun.topics.created })
    expect(await snapshot(repository)).toEqual(before)
    await repository.inspect(async (transaction) => {
      expect(await transaction.listArticles()).toHaveLength(labStories.length)
      expect(await transaction.listMediaAssets()).toHaveLength(labImages.length)
      expect(await transaction.listAuthors()).toHaveLength(labAuthors.length)
      expect(await transaction.listTaxonomyTerms()).toHaveLength(
        labSections.length + labTopics.length,
      )
      expect(await transaction.listArticleTaxonomies()).toHaveLength(
        labStories.reduce((links, { topics }) => links + 1 + topics.length, 0),
      )
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
    expect(longRead?.authors).toHaveLength(3)
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

    // An image later in the story is not a lead image, but it still illustrates the story card.
    const inlineImage = await readArticleView(source, storySlug('article-lab-limewash'))
    const inlineCard = (await readSectionView(source, 'craft'))?.stories.find(
      ({ slug }) => slug === inlineImage?.slug,
    )
    expect(inlineImage?.hero).toBeNull()
    expect(inlineImage?.body.some(({ kind }) => kind === 'image')).toBe(true)
    expect(inlineCard?.image?.mediaId).toBe('media-lab-limewash')
  })

  it('creates the stories without images when media storage is not configured', async () => {
    const withoutMedia = new InMemoryContentRepository()

    const report = await seedLabContent({ objects: null, repository: withoutMedia })

    expect(report.images).toEqual({
      created: [],
      existing: [],
      skipped: 'Media storage is not configured, so no images were stored.',
    })
    expect(report.stories.created).toHaveLength(labStories.length)
    expect(report.authors.created).toHaveLength(labAuthors.length)
    expect(report.topics.created).toHaveLength(labTopics.length)
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
    expect(report.stories.created).toHaveLength(labStories.length - 1)
    await occupied.inspect(async (transaction) => {
      expect(await transaction.listArticleAuthors('article-owner')).toEqual([])
      expect(
        (await transaction.listArticleTaxonomies()).filter(
          ({ articleId }) => articleId === 'article-owner',
        ),
      ).toEqual([])
    })
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

  it('does not publish, edit, credit or file an existing owner article with a sample ID', async () => {
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
      expect(await transaction.listArticleAuthors(id)).toEqual([])
    })
  })

  it('keeps owner changes to sample authors, topics and bylines when it runs again', async () => {
    const edited = new InMemoryContentRepository()
    await seedLabContent({ objects: null, repository: edited })
    const author = labAuthors[0]!
    const topic = labTopics[0]!
    const story = labStories.find(({ id }) => id === 'article-lab-long-table')!
    await edited.transaction(async (transaction) => {
      const profile = (await transaction.listAuthors()).find(({ id }) => id === author.id)!
      const term = (await transaction.listTaxonomyTerms()).find(({ id }) => id === topic.id)!
      // The in-memory store overwrites rows by ID, which stands in for owner edits here.
      await transaction.saveAuthor({ ...profile, bio: 'Owner bio', displayName: 'Owner name' })
      await transaction.saveTaxonomyTerm({ ...term, name: 'Owner topic' })
      await transaction.setArticleAuthors(story.id, [])
      transaction.recordPublicationChange()
    })
    const before = await snapshot(edited)

    const replay = await seedLabContent({ objects: null, repository: edited })

    expect(replay.authors).toEqual({
      created: [],
      existing: labAuthors.map(({ slug }) => slug),
      slugInUse: [],
    })
    expect(replay.topics).toEqual({ created: [], existing: labTopics.map(({ slug }) => slug) })
    expect(await snapshot(edited)).toEqual(before)
  })

  it('does not credit a sample author whose slug another author already uses', async () => {
    const occupied = new InMemoryContentRepository()
    const sample = labAuthors.find(({ slug }) => slug === 'tomas-ek')!
    const owner: AuthorProfile = {
      bio: 'The owner wrote this.',
      createdAt: '2026-08-01T07:00:00.000Z',
      displayName: 'Owner writer',
      id: 'author-owner',
      slug: sample.slug,
      updatedAt: '2026-08-01T07:00:00.000Z',
    }
    await occupied.transaction((transaction) => transaction.saveAuthor(owner))

    const report = await seedLabContent({ objects: null, repository: occupied })

    expect(report.authors).toEqual({
      created: labAuthors.filter(({ slug }) => slug !== sample.slug).map(({ slug }) => slug),
      existing: [],
      slugInUse: [sample.slug],
    })
    await occupied.inspect(async (transaction) => {
      expect((await transaction.listAuthors()).find(({ id }) => id === owner.id)).toEqual(owner)
      expect(await transaction.listAuthorArticles(owner.id)).toEqual([])
      for (const story of labStories) {
        expect(
          (await transaction.listArticleAuthors(story.id)).map(({ slug }) => slug),
          story.id,
        ).toEqual(story.authors.filter((slug) => slug !== sample.slug))
      }
    })
  })

  it('files sample stories under an existing tag that already uses a topic slug', async () => {
    const occupied = new InMemoryContentRepository()
    const sample = labTopics.find(({ slug }) => slug === 'light')!
    const owner: TaxonomyTerm = {
      createdAt: '2026-08-01T07:00:00.000Z',
      id: 'tag-owner-light',
      kind: 'tag',
      name: 'Owner light',
      slug: sample.slug,
      updatedAt: '2026-08-01T07:00:00.000Z',
    }
    await occupied.transaction((transaction) => transaction.saveTaxonomyTerm(owner))

    const report = await seedLabContent({ objects: null, repository: occupied })

    expect(report.topics).toEqual({
      created: labTopics.filter(({ slug }) => slug !== sample.slug).map(({ slug }) => slug),
      existing: [sample.slug],
    })
    await occupied.inspect(async (transaction) => {
      expect(
        (await transaction.listTaxonomyTerms()).filter(({ slug }) => slug === sample.slug),
      ).toEqual([owner])
      expect(
        (await transaction.listArticleTaxonomies())
          .filter(({ taxonomyId }) => taxonomyId === owner.id)
          .map(({ articleId }) => articleId)
          .sort(),
      ).toEqual(
        labStories
          .filter(({ topics }) => topics.includes(sample.slug))
          .map(({ id }) => id)
          .sort(),
      )
    })
  })
})

describe('seed recovery after an interrupted run', () => {
  const failure = new Error('Injected failure')
  const story = labStories[0]!
  const slugs = labStories.map(labStorySlug)

  afterEach(() => vi.restoreAllMocks())

  /** The prototype every in-memory transaction shares, so a test can make one of its writes fail. */
  function transactionPrototype(
    repository: InMemoryContentRepository,
  ): Promise<ContentTransaction> {
    return repository.inspect(async (transaction) => Object.getPrototypeOf(transaction))
  }

  /** Everything stored about one story. */
  function storyState(repository: InMemoryContentRepository, id: string) {
    return repository.inspect(async (transaction) => ({
      article: await transaction.getArticle(id),
      audits: await transaction.listAuditEvents(id),
      autosaves: await transaction.listAutosaves(id),
      bylines: await transaction.listArticleAuthors(id),
      links: (await transaction.listArticleTaxonomies()).filter(
        ({ articleId }) => articleId === id,
      ),
      revisions: await transaction.listRevisions(id),
    }))
  }

  /** Readers see the story, in its section, with its bylines and topics in order. */
  async function expectFinished(repository: InMemoryContentRepository, finished: LabStory) {
    const view = await readArticleView(
      { mediaAvailable: false, repository },
      labStorySlug(finished),
    )
    expect(view?.section?.slug).toBe(finished.section)
    expect(view?.authorLinks).toEqual(
      finished.authors.map((slug) => ({ href: authorPath(slug), name: labAuthorName(slug) })),
    )
    expect(view?.topics).toEqual(
      finished.topics.map((slug) => ({ href: topicPath(slug), name: labTopicName(slug) })),
    )
  }

  async function expectReplayWritesNothing(repository: InMemoryContentRepository) {
    const before = await snapshot(repository)
    const replay = await seedLabContent({ objects: null, repository })
    expect(replay.stories).toEqual({ created: [], existing: slugs, resumed: [], slugInUse: [] })
    expect(await snapshot(repository)).toEqual(before)
  }

  /**
   * Before this fix, creating a story and assigning its section committed one at a time, so a run
   * that failed before publishing left a draft behind. This recreates what such a run left: the seed
   * stops at its first story, which is then created, and optionally filed under its section, the
   * way the earlier seed did it.
   */
  async function interruptedEarlierRun(
    repository: InMemoryContentRepository,
    { sectioned }: { sectioned: boolean },
  ) {
    vi.spyOn(ContentService.prototype, 'createArticle').mockRejectedValueOnce(failure)
    await expect(seedLabContent({ objects: null, repository })).rejects.toThrow(failure)
    vi.restoreAllMocks()
    const clock = { now: () => new Date(story.publishedAt) }
    await new ContentService(repository, clock).createArticle({
      dek: story.dek,
      document: {
        articleId: story.id,
        document: { content: story.blocks, type: 'doc' },
        migrationProvenance: [],
        schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
        title: story.title,
      },
      id: story.id,
      idempotencyKey: `lab-seed:create:${story.id}`,
      slug: labStorySlug(story),
      title: story.title,
    })
    if (sectioned) {
      await new SectionService(repository, clock).assignSection({
        articleId: story.id,
        sectionId: labSections.find(({ slug }) => slug === story.section)!.id,
      })
    }
  }

  const interruptions: readonly (readonly [
    string,
    (repository: InMemoryContentRepository) => Promise<unknown>,
  ])[] = [
    [
      'assigning its section',
      async () =>
        vi.spyOn(SectionService.prototype, 'assignSection').mockRejectedValueOnce(failure),
    ],
    [
      'crediting its authors',
      async (repository) =>
        vi
          .spyOn(await transactionPrototype(repository), 'setArticleAuthors')
          .mockRejectedValueOnce(failure),
    ],
    [
      'filing it under a topic',
      async (repository) => {
        const prototype = await transactionPrototype(repository)
        const save = prototype.saveArticleTaxonomy
        const topic = labTopics.find(({ slug }) => slug === story.topics[0])!
        return vi.spyOn(prototype, 'saveArticleTaxonomy').mockImplementation(function (
          this: ContentTransaction,
          link,
        ) {
          return link.taxonomyId === topic.id ? Promise.reject(failure) : save.call(this, link)
        })
      },
    ],
    [
      'publishing it',
      async () => vi.spyOn(ContentService.prototype, 'publish').mockRejectedValueOnce(failure),
    ],
  ]

  it.each(interruptions)(
    'stores nothing of a story when %s fails, and creates all of it on the retry',
    async (_step, interrupt) => {
      const repository = new InMemoryContentRepository()
      await interrupt(repository)

      await expect(seedLabContent({ objects: null, repository })).rejects.toThrow(failure)
      vi.restoreAllMocks()

      expect(await storyState(repository, story.id)).toEqual({
        article: null,
        audits: [],
        autosaves: [],
        bylines: [],
        links: [],
        revisions: [],
      })
      const retry = await seedLabContent({ objects: null, repository })
      expect(retry.stories).toEqual({ created: slugs, existing: [], resumed: [], slugInUse: [] })
      await expectFinished(repository, story)
      await expectReplayWritesNothing(repository)
    },
  )

  it.each([false, true])(
    'finishes the draft an earlier interrupted run left (filed under its section: %s)',
    async (sectioned) => {
      const repository = new InMemoryContentRepository()
      await interruptedEarlierRun(repository, { sectioned })
      const [draft] = (await storyState(repository, story.id)).revisions

      const report = await seedLabContent({ objects: null, repository })

      expect(report.stories).toEqual({
        created: slugs.slice(1),
        existing: [],
        resumed: [labStorySlug(story)],
        slugInUse: [],
      })
      await expectFinished(repository, story)
      // It publishes the seed's own first draft, on the story's date.
      const finished = await storyState(repository, story.id)
      expect(finished.revisions).toEqual([draft])
      expect(finished.article).toMatchObject({
        publishedAt: story.publishedAt,
        publishedRevisionId: draft?.id,
        status: 'published',
        version: 2,
      })
      await expectReplayWritesNothing(repository)
    },
  )

  const ownerChanges: readonly (readonly [
    string,
    (repository: InMemoryContentRepository) => Promise<unknown>,
  ])[] = [
    [
      'saves a new revision',
      (repository) =>
        new ContentService(repository).saveDraft({
          articleId: story.id,
          document: {
            articleId: story.id,
            document: {
              content: [{ content: [{ text: 'Keep my words.', type: 'text' }], type: 'paragraph' }],
              type: 'doc',
            },
            migrationProvenance: [],
            schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
            title: story.title,
          },
          expectedVersion: 1,
          idempotencyKey: 'owner-edit',
        }),
    ],
    // A byline or topic makes the draft the owner's, even one the seed would also have added.
    [
      'credits its author',
      (repository) =>
        repository.transaction((transaction) =>
          transaction.setArticleAuthors(story.id, [
            labAuthors.find(({ slug }) => slug === story.authors[0])!.id,
          ]),
        ),
    ],
    [
      'files it under its topic',
      (repository) =>
        repository.transaction((transaction) =>
          transaction.saveArticleTaxonomy({
            articleId: story.id,
            position: 0,
            taxonomyId: labTopics.find(({ slug }) => slug === story.topics[0])!.id,
          }),
        ),
    ],
    // The in-memory store cannot remove a link, so this builds what removing the section the seed
    // assigned leaves behind: the assignment in the audit trail, and no link.
    [
      'removes its section',
      (repository) =>
        repository.transaction((transaction) =>
          transaction.saveAuditEvent({
            action: 'article.section-assigned',
            actorId: null,
            articleId: story.id,
            createdAt: story.publishedAt,
            id: 'audit-section-assigned',
            metadata: {
              sectionId: labSections.find(({ slug }) => slug === story.section)!.id,
              sectionSlug: story.section,
            },
          }),
        ),
    ],
  ]

  it.each(ownerChanges)(
    'leaves that draft exactly as it is once the owner %s',
    async (_change, change) => {
      const repository = new InMemoryContentRepository()
      await interruptedEarlierRun(repository, { sectioned: false })
      await change(repository)
      const owned = await storyState(repository, story.id)

      const report = await seedLabContent({ objects: null, repository })

      expect(report.stories).toEqual({
        created: slugs.slice(1),
        existing: [labStorySlug(story)],
        resumed: [],
        slugInUse: [],
      })
      expect(await storyState(repository, story.id)).toEqual(owned)
    },
  )
})
