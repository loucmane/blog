import { describe, expect, it } from 'vitest'

import { readArticleView } from '@/reader/read-model'
import { CURRENT_CONTENT_DOCUMENT_VERSION, type ContentDocument } from '@/server/content/document'
import type { Article } from '@/server/content/domain'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import type { Clock, IdentifierSource } from '@/server/content/ports'
import { ContentService } from '@/server/content/service'

import { RepositorySlugHistory } from './repository-slug-history'
import {
  readVisibleSlugs,
  resolveSlug,
  type SlugHistory,
  type SlugResolution,
  type SlugResolutionSources,
} from './slug-resolution'

const current: SlugResolution = { kind: 'current' }
const gone: SlugResolution = { kind: 'gone' }
const unknown: SlugResolution = { kind: 'unknown' }
const redirectTo = (slug: string): SlugResolution => ({ kind: 'redirect', slug })

/**
 * A story for the pure resolver: `live` is visible to readers, `withdrawn` was published and no
 * longer is, and `draft` was never published. A `deleted` story keeps its slug.
 */
interface StoryFact {
  readonly deleted?: boolean
  readonly id: string
  readonly slug: string
  readonly state: 'draft' | 'live' | 'withdrawn'
}

interface RedirectFact {
  readonly articleId: string
  readonly fromSlug: string
  readonly toSlug: string
}

function slugArticle({ deleted = false, id, slug, state }: StoryFact) {
  return { deleted, id, published: state !== 'draft', slug }
}

/** Sources over plain facts, counting the redirect lookups a resolution makes. */
function factSources(stories: readonly StoryFact[], redirects: readonly RedirectFact[] = []) {
  const lookups: string[] = []
  const history: SlugHistory = {
    async article(id) {
      const story = stories.find((candidate) => candidate.id === id)
      return story ? slugArticle(story) : null
    },
    async articlesAt(slug) {
      return stories.filter((story) => story.slug === slug).map(slugArticle)
    },
    async redirectFrom(slug) {
      lookups.push(slug)
      const redirect = redirects.find(({ fromSlug }) => fromSlug === slug)
      return redirect ? { articleId: redirect.articleId, toSlug: redirect.toSlug } : null
    },
  }
  const sources: SlugResolutionSources = {
    history,
    visibleArticleAt: async (slug) =>
      stories.find((story) => story.slug === slug && story.state === 'live')?.id ?? null,
  }
  return { lookups, resolve: (slug: string) => resolveSlug(slug, sources) }
}

describe('slug resolution', () => {
  it('renders a slug readers can see', async () => {
    const { resolve } = factSources([{ id: 'x', slug: 'winter-light', state: 'live' }])

    expect(await resolve('winter-light')).toEqual(current)
  })

  it('resolves a chained rename a → b → c to a single redirect to c (AC-07)', async () => {
    const { lookups, resolve } = factSources(
      [{ id: 'x', slug: 'c', state: 'live' }],
      [
        { articleId: 'x', fromSlug: 'a', toSlug: 'b' },
        { articleId: 'x', fromSlug: 'b', toSlug: 'c' },
      ],
    )

    expect(await resolve('a')).toEqual(redirectTo('c'))
    // One answer names the end of the chain, so the reader never stops at b.
    expect(lookups).toEqual(['a', 'b'])
    expect(await resolve('b')).toEqual(redirectTo('c'))
    expect(await resolve('c')).toEqual(current)
  })

  it('stops at a redirect cycle instead of looping (AC-07)', async () => {
    // A story renamed a → b → a has redirects both ways; withdrawn, it has no live slug to reach.
    const withdrawn = factSources(
      [{ id: 'x', slug: 'a', state: 'withdrawn' }],
      [
        { articleId: 'x', fromSlug: 'a', toSlug: 'b' },
        { articleId: 'x', fromSlug: 'b', toSlug: 'a' },
      ],
    )
    expect(await withdrawn.resolve('a')).toEqual(gone)
    expect(await withdrawn.resolve('b')).toEqual(gone)
    // a is the withdrawn story's own URL; b leads to a story readers cannot see, in one lookup.
    expect(withdrawn.lookups).toEqual(['b'])

    // Live again at a, the same cycle sends b to a, once.
    const live = factSources(
      [{ id: 'x', slug: 'a', state: 'live' }],
      [
        { articleId: 'x', fromSlug: 'a', toSlug: 'b' },
        { articleId: 'x', fromSlug: 'b', toSlug: 'a' },
      ],
    )
    expect(await live.resolve('b')).toEqual(redirectTo('a'))
    expect(await live.resolve('a')).toEqual(current)

    // A cycle that never reaches the story's slug (imported history, say) visits each slug once.
    const cycle = Array.from({ length: 500 }, (_, index) => ({
      articleId: 'y',
      fromSlug: `slug-${index}`,
      toSlug: `slug-${(index + 1) % 500}`,
    }))
    const imported = factSources([{ id: 'y', slug: 'elsewhere', state: 'live' }], cycle)
    expect(await imported.resolve('slug-0')).toEqual(unknown)
    expect(imported.lookups).toHaveLength(500)
    expect(new Set(imported.lookups).size).toBe(500)
  })

  it('answers 410 for a story that was published and is no longer visible, by any of its slugs', async () => {
    const { resolve } = factSources(
      [
        { id: 'x', slug: 'renamed-then-withdrawn', state: 'withdrawn' },
        { id: 'y', slug: 'withdrawn-in-place', state: 'withdrawn' },
        { deleted: true, id: 'z', slug: 'deleted-in-place', state: 'withdrawn' },
      ],
      [{ articleId: 'x', fromSlug: 'first-slug', toSlug: 'renamed-then-withdrawn' }],
    )

    expect(await resolve('renamed-then-withdrawn')).toEqual(gone)
    expect(await resolve('first-slug')).toEqual(gone)
    expect(await resolve('withdrawn-in-place')).toEqual(gone)
    expect(await resolve('deleted-in-place')).toEqual(gone)
  })

  it("answers for the slug's owner now before any older story that left the slug", async () => {
    // x left shared-slug for its-new-home; y took shared-slug later.
    const owner = (state: StoryFact['state'], deleted = false) =>
      factSources(
        [
          { id: 'x', slug: 'its-new-home', state: 'live' },
          { deleted, id: 'y', slug: 'shared-slug', state },
        ],
        [{ articleId: 'x', fromSlug: 'shared-slug', toSlug: 'its-new-home' }],
      ).resolve('shared-slug')

    // y was published there: the URL is y's, so its withdrawal is a 410, not a trip back to x.
    expect(await owner('withdrawn')).toEqual(gone)
    // A draft owner was never public there, and a deleted one no longer owns the slug: the redirect
    // x recorded still holds.
    expect(await owner('draft')).toEqual(redirectTo('its-new-home'))
    expect(await owner('withdrawn', true)).toEqual(redirectTo('its-new-home'))
  })

  it('reveals nothing about a draft: its slugs, old or new, are unknown', async () => {
    const { resolve } = factSources(
      [{ id: 'x', slug: 'working-title', state: 'draft' }],
      [{ articleId: 'x', fromSlug: 'first-idea', toSlug: 'working-title' }],
    )

    expect(await resolve('working-title')).toEqual(unknown)
    expect(await resolve('first-idea')).toEqual(unknown)
    expect(await resolve('never-used')).toEqual(unknown)
  })

  it('lets a visible story keep a slug that another story left', async () => {
    const { resolve } = factSources(
      [
        { id: 'x', slug: 'new-home', state: 'live' },
        { id: 'y', slug: 'shared', state: 'live' },
      ],
      [{ articleId: 'x', fromSlug: 'shared', toSlug: 'new-home' }],
    )

    expect(await resolve('shared')).toEqual(current)
    expect(await resolve('new-home')).toEqual(current)
  })

  it("follows only the renaming story's own history across a slug another story took", async () => {
    // x was published at a, renamed to b and deleted there. y then took b and was renamed to c.
    const { lookups, resolve } = factSources(
      [
        { deleted: true, id: 'x', slug: 'b', state: 'withdrawn' },
        { id: 'y', slug: 'c', state: 'live' },
      ],
      [
        { articleId: 'x', fromSlug: 'a', toSlug: 'b' },
        { articleId: 'y', fromSlug: 'b', toSlug: 'c' },
      ],
    )

    // a was x's URL, and x is gone: a never leads to y's story.
    expect(await resolve('a')).toEqual(gone)
    expect(lookups).toEqual(['a'])
    // b was last left by y, so it leads to y's slug now.
    expect(await resolve('b')).toEqual(redirectTo('c'))
  })

  it('does not redirect along a history that does not reach the story', async () => {
    // Imported history whose last rename is missing: a → b, but the story is live at d.
    const { resolve } = factSources(
      [
        { id: 'x', slug: 'd', state: 'live' },
        { deleted: true, id: 'z', slug: 'a', state: 'withdrawn' },
      ],
      [{ articleId: 'x', fromSlug: 'a', toSlug: 'b' }],
    )
    const orphan = factSources(
      [{ id: 'x', slug: 'd', state: 'live' }],
      [{ articleId: 'x', fromSlug: 'a', toSlug: 'b' }],
    )

    // Nothing vouches for d: a is gone because a deleted story that was published kept it, and
    // otherwise unknown.
    expect(await resolve('a')).toEqual(gone)
    expect(await orphan.resolve('a')).toEqual(unknown)
  })

  it('treats a redirect to a missing article as no redirect', async () => {
    const { resolve } = factSources([], [{ articleId: 'missing', fromSlug: 'a', toSlug: 'b' }])

    expect(await resolve('a')).toEqual(unknown)
  })
})

class Identifiers implements IdentifierSource {
  private index = 0

  next(kind: string): string {
    this.index += 1
    return `${kind}-${this.index}`
  }
}

const clock: Clock = { now: () => new Date('2026-07-17T20:00:00.000Z') }
const scheduledRunAt = '2026-12-01T09:00:00.000Z'

function document(articleId: string, text = 'A story for slug resolution.'): ContentDocument {
  return {
    articleId,
    document: {
      content: [{ content: [{ text, type: 'text' }], type: 'paragraph' }],
      type: 'doc',
    },
    migrationProvenance: [],
    schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
    title: text,
  }
}

/** Stories driven through the real content service on the in-memory store. */
function newsroom() {
  const repository = new InMemoryContentRepository()
  const service = new ContentService(repository, clock, new Identifiers())
  let keys = 0
  const key = (action: string) => `${action}-${(keys += 1)}`
  const article = async (id: string): Promise<Article> => {
    const found = await repository.transaction((transaction) => transaction.getArticle(id))
    if (!found) throw new Error(`Article ${id} is missing.`)
    return found
  }
  const edit = (id: string) =>
    article(id).then(({ currentDraftRevisionId, version }) => ({
      articleId: id,
      expectedVersion: version,
      revisionId: currentDraftRevisionId,
    }))

  return {
    repository,
    async create(id: string, slug: string) {
      await service.createArticle({
        dek: `Summary of ${slug}`,
        document: document(id),
        id,
        idempotencyKey: key('create'),
        slug,
        title: `Title of ${slug}`,
      })
    },
    async publish(id: string) {
      await service.publish({ ...(await edit(id)), idempotencyKey: key('publish') })
    },
    async rename(id: string, slug: string) {
      const { articleId, expectedVersion } = await edit(id)
      await service.changeSlug({ articleId, expectedVersion, idempotencyKey: key('rename'), slug })
    },
    async unpublish(id: string) {
      const { articleId, expectedVersion } = await edit(id)
      await service.unpublish({
        articleId,
        expectedVersion,
        idempotencyKey: key('unpublish'),
        reason: 'Holding the story for corrections.',
      })
    },
    async remove(id: string) {
      const { articleId, expectedVersion } = await edit(id)
      await service.softDelete({ articleId, expectedVersion, idempotencyKey: key('delete') })
    },
    async restore(id: string) {
      const { articleId, expectedVersion } = await edit(id)
      await service.restore({ articleId, expectedVersion, idempotencyKey: key('restore') })
    },
    async revise(id: string) {
      const { articleId, expectedVersion } = await edit(id)
      await service.saveDraft({
        articleId,
        document: document(id, 'A revision waiting for its scheduled publication.'),
        expectedVersion,
        idempotencyKey: key('save'),
      })
    },
    async schedule(id: string) {
      await service.schedulePublication({
        ...(await edit(id)),
        idempotencyKey: key('schedule'),
        runAt: scheduledRunAt,
        timeZone: 'Europe/Stockholm',
      })
    },
    resolve(slug: string) {
      return resolveSlug(slug, {
        history: new RepositorySlugHistory(repository),
        visibleArticleAt: async (candidate) =>
          (await readVisibleSlugs(repository)).get(candidate) ?? null,
      })
    },
    /** Whether the story page would render this slug. */
    async pageRenders(slug: string) {
      return (await readArticleView({ mediaAvailable: false, repository }, slug)) !== null
    },
  }
}

describe('slug resolution over the content service', () => {
  it('resolves every old slug of a renamed story to its slug now, in one redirect (AC-07)', async () => {
    // Content slugs have at least two characters, so a, b and c are story-a, story-b and story-c.
    const desk = newsroom()
    await desk.create('article-chain', 'story-a')
    await desk.publish('article-chain')
    await desk.rename('article-chain', 'story-b')
    await desk.rename('article-chain', 'story-c')

    expect(await desk.resolve('story-a')).toEqual(redirectTo('story-c'))
    expect(await desk.resolve('story-b')).toEqual(redirectTo('story-c'))
    expect(await desk.resolve('story-c')).toEqual(current)
    expect(await desk.resolve('story-d')).toEqual(unknown)
  })

  it('answers 410 once a published story is unpublished or deleted, and 308 again when it returns', async () => {
    const desk = newsroom()
    await desk.create('article-withdrawn', 'first-slug')
    await desk.publish('article-withdrawn')
    await desk.rename('article-withdrawn', 'second-slug')

    await desk.unpublish('article-withdrawn')
    expect(await desk.resolve('second-slug')).toEqual(gone)
    expect(await desk.resolve('first-slug')).toEqual(gone)

    await desk.publish('article-withdrawn')
    expect(await desk.resolve('second-slug')).toEqual(current)
    expect(await desk.resolve('first-slug')).toEqual(redirectTo('second-slug'))

    await desk.remove('article-withdrawn')
    expect(await desk.resolve('second-slug')).toEqual(gone)
    expect(await desk.resolve('first-slug')).toEqual(gone)

    // Restored, the story is unpublished: still gone until it is published again.
    await desk.restore('article-withdrawn')
    expect(await desk.resolve('second-slug')).toEqual(gone)
  })

  it("answers for a slug's new owner once it was published there, and not while it is a draft", async () => {
    const desk = newsroom()
    await desk.create('article-moved-on', 'owner-old')
    await desk.publish('article-moved-on')
    await desk.rename('article-moved-on', 'owner-new')
    await desk.create('article-new-owner', 'owner-old')

    // A draft took the slug: readers following an old link still reach the story that left it.
    expect(await desk.resolve('owner-old')).toEqual(redirectTo('owner-new'))
    await desk.publish('article-new-owner')
    expect(await desk.resolve('owner-old')).toEqual(current)
    // Published there, the slug is the new owner's URL, so its withdrawal is a 410.
    await desk.unpublish('article-new-owner')
    expect(await desk.resolve('owner-old')).toEqual(gone)
    expect(await desk.resolve('owner-new')).toEqual(current)
  })

  it('keeps drafts, renamed drafts and first scheduled publications unknown', async () => {
    const desk = newsroom()
    await desk.create('article-draft', 'draft-title')
    await desk.rename('article-draft', 'better-draft-title')
    await desk.create('article-deleted-draft', 'deleted-draft')
    await desk.remove('article-deleted-draft')
    await desk.create('article-scheduled', 'coming-soon')
    await desk.schedule('article-scheduled')

    for (const slug of ['draft-title', 'better-draft-title', 'deleted-draft', 'coming-soon']) {
      expect(await desk.resolve(slug), slug).toEqual(unknown)
    }
  })

  it('follows the content reader on scheduled stories: visible while a revision waits, gone while a withdrawn one does', async () => {
    const desk = newsroom()
    await desk.create('article-rescheduled', 'rescheduled')
    await desk.publish('article-rescheduled')
    await desk.revise('article-rescheduled')
    await desk.schedule('article-rescheduled')
    await desk.create('article-returning', 'returning')
    await desk.publish('article-returning')
    await desk.unpublish('article-returning')
    await desk.schedule('article-returning')

    expect(await desk.resolve('rescheduled')).toEqual(current)
    expect(await desk.resolve('returning')).toEqual(gone)
  })

  it('stops at a cyclic redirect history in the store (AC-07)', async () => {
    const desk = newsroom()
    await desk.create('article-cycle', 'settled')
    await desk.publish('article-cycle')
    await desk.repository.transaction(async (transaction) => {
      for (const [fromSlug, toSlug] of [
        ['loop-a', 'loop-b'],
        ['loop-b', 'loop-a'],
      ] as const) {
        await transaction.saveRedirect({
          articleId: 'article-cycle',
          createdAt: clock.now().toISOString(),
          fromSlug,
          id: `redirect-${fromSlug}`,
          toSlug,
        })
      }
    })

    expect(await desk.resolve('loop-a')).toEqual(unknown)
    expect(await desk.resolve('loop-b')).toEqual(unknown)
    expect(await desk.resolve('settled')).toEqual(current)
  })

  it('calls a slug current exactly when the story page renders it', async () => {
    const desk = newsroom()
    await desk.create('article-live', 'live')
    await desk.publish('article-live')
    await desk.create('article-moved', 'moved-from')
    await desk.publish('article-moved')
    await desk.rename('article-moved', 'moved-to')
    await desk.create('article-pulled', 'pulled')
    await desk.publish('article-pulled')
    await desk.unpublish('article-pulled')
    await desk.create('article-unwritten', 'unwritten')

    for (const slug of ['live', 'moved-from', 'moved-to', 'pulled', 'unwritten', 'nothing']) {
      expect((await desk.resolve(slug)).kind === 'current', slug).toBe(await desk.pageRenders(slug))
    }
  })

  it('reads the visible slugs with their article ids', async () => {
    const desk = newsroom()
    await desk.create('article-one', 'one')
    await desk.publish('article-one')
    await desk.create('article-two', 'two')

    expect(await readVisibleSlugs(desk.repository)).toEqual(new Map([['one', 'article-one']]))
  })
})
