// @vitest-environment jsdom
import type * as Navigation from 'next/navigation'
import type * as Server from 'next/server'
import { NextRequest } from 'next/server'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GET as feedRoute } from '@/app/feed.xml/route'
import { GET as sitemapIndexRoute } from '@/app/sitemap.xml/route'
import { GET as sitemapPageRoute } from '@/app/sitemaps/[page]/route'
import StoryPage from '@/app/stories/[slug]/page'
import { readArticleView, type ReaderSource } from '@/reader/read-model'

import { dataCache } from '../../../tests/support/data-cache'
import { InMemoryContentRepository } from '../content/in-memory-repository'
import { InMemorySearch } from '../discovery/in-memory-search'
import { InMemoryRelatedStories } from '../discovery/related'
import {
  assertExclusion,
  queryExclusionSurfaces,
  seedExclusionCorpus,
  type ExclusionCorpus,
  type ExclusionObservation,
  type ExclusionQueries,
  type ExclusionSurface,
} from './exclusion-suite'
import { readFeedDocument } from './feed'
import { RepositorySlugHistory } from './repository-slug-history'
import { readSitemapUrls, renderSitemapIndex, renderSitemapPage, sitemapPageCount } from './sitemap'
import { readVisibleSlugs, resolveSlug } from './slug-resolution'
import { handleStoryRequest } from './story-requests'

const routeStore = vi.hoisted(() => ({ source: null as ReaderSource | null }))
vi.mock('next/cache', async () => {
  const { dataCache: cache } = await import('../../../tests/support/data-cache')
  return { revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: cache.cache }
})
vi.mock('next/server', async (original) => ({
  ...(await original<typeof Server>()),
  connection: async () => {},
}))
vi.mock('next/navigation', async (original) => ({
  ...(await original<typeof Navigation>()),
  notFound: () => {
    throw new Error('AC03_NOT_FOUND')
  },
}))
vi.mock('@/reader/store', () => ({ resolveReaderStore: () => routeStore.source }))
vi.mock('@/reader/cache', async () => {
  const model = await import('@/reader/read-model')
  return {
    readerCacheSeconds: 300,
    readerCacheTag: 'reader',
    loadArticleView: async (slug: string) => {
      if (!routeStore.source) throw new Error('No AC-03 reader source')
      return {
        cacheGeneration: 'ac03',
        status: 'ready',
        view: await model.readArticleView(routeStore.source, slug),
      }
    },
  }
})
vi.mock('@/reader-lab/presentation', async () => {
  const { readerDirections } = await import('@/reader-directions/registry')
  return {
    resolveReaderPresentation: async () => ({
      direction: readerDirections.defaultDirection,
      lab: null,
    }),
  }
})

const origin = 'https://magazine.example'
let context: ExclusionQueries
let corpus: ExclusionCorpus

beforeEach(async () => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', origin)
  dataCache.reset()
  const repository = new InMemoryContentRepository()
  const search = new InMemorySearch()
  context = { repository, search, related: new InMemoryRelatedStories(repository) }
  routeStore.source = { mediaAvailable: false, repository }
  corpus = await seedExclusionCorpus(repository, search)
})

afterEach(() => {
  routeStore.source = null
  vi.unstubAllEnvs()
})

function xml(source: string): Document {
  const parsed = new DOMParser().parseFromString(source, 'application/xml')
  expect(parsed.querySelector('parsererror')).toBeNull()
  return parsed
}

function observation(payload: string, urls: readonly string[]): ExclusionObservation {
  return {
    payload,
    slugs: urls.flatMap((url) => {
      const path = new URL(url).pathname
      return path.startsWith('/stories/') ? [decodeURIComponent(path.slice(9))] : []
    }),
  }
}

async function feedOutput(read: (before: string | null) => Promise<string | null>) {
  const pages: string[] = []
  const urls: string[] = []
  const visited = new Set<string | null>()
  let before: string | null = null
  do {
    expect(visited.has(before), 'feed pagination cycle').toBe(false)
    visited.add(before)
    const body = await read(before)
    expect(body).not.toBeNull()
    const parsed = xml(body ?? '')
    pages.push(body ?? '')
    urls.push(...[...parsed.querySelectorAll('item > link')].map((link) => link.textContent ?? ''))
    const next = parsed.querySelector('[rel="next"]')?.getAttribute('href')
    before = next ? new URL(next).searchParams.get('before') : null
  } while (before !== null)
  return observation(pages.join('\n'), urls)
}

async function responseText(response: Response): Promise<string> {
  expect(response.status).toBe(200)
  return response.text()
}

/** Add one registration here for a new unit surface; it receives the entire unfiltered corpus. */
const unitSurfaces: readonly ExclusionSurface<ExclusionQueries>[] = [
  ...queryExclusionSurfaces,
  {
    name: 'feed generator',
    read: ({ repository }) => feedOutput((before) => readFeedDocument(repository, before)),
  },
  {
    name: 'feed route',
    read: () =>
      feedOutput(async (before) => {
        const url = new URL('/feed.xml', origin)
        if (before !== null) url.searchParams.set('before', before)
        return responseText(await feedRoute(new Request(url)))
      }),
  },
  {
    name: 'sitemap generators',
    read: async ({ repository }) => {
      const urls = await readSitemapUrls(repository)
      const pages = Array.from({ length: sitemapPageCount(urls) }, (_, index) =>
        renderSitemapPage(urls, index + 1),
      )
      const payload = [renderSitemapIndex(urls), ...pages].join('\n')
      return observation(
        payload,
        pages.flatMap((page) =>
          [...xml(page ?? '').querySelectorAll('url > loc')].map((loc) => loc.textContent ?? ''),
        ),
      )
    },
  },
  {
    name: 'sitemap index and page routes',
    read: async () => {
      const index = await responseText(await sitemapIndexRoute())
      const pages: string[] = []
      for (const loc of xml(index).querySelectorAll('sitemap > loc')) {
        const url = new URL(loc.textContent ?? '')
        pages.push(
          await responseText(
            await sitemapPageRoute(new Request(url), {
              params: Promise.resolve({ page: url.pathname.split('/').at(-1) ?? '' }),
            }),
          ),
        )
      }
      return observation(
        [index, ...pages].join('\n'),
        pages.flatMap((page) =>
          [...xml(page).querySelectorAll('url > loc')].map((loc) => loc.textContent ?? ''),
        ),
      )
    },
  },
  {
    name: 'story page structured data',
    read: async (_context, seeded) => {
      const scripts: string[] = []
      const urls: string[] = []
      for (const story of [...seeded.visible, ...seeded.hidden]) {
        if (!story.visible) {
          await expect(
            StoryPage({ params: Promise.resolve({ slug: story.slug }) }),
          ).rejects.toThrow('AC03_NOT_FOUND')
          continue
        }
        const markup = renderToStaticMarkup(
          await StoryPage({ params: Promise.resolve({ slug: story.slug }) }),
        )
        const page = new DOMParser().parseFromString(markup, 'text/html')
        const elements = [...page.querySelectorAll('script[type="application/ld+json"]')]
        expect(elements).toHaveLength(1)
        const text = elements[0]?.textContent ?? ''
        const article = JSON.parse(text)['@graph'][0] as { url: string; headline: string }
        expect(article.headline).toBe(story.title)
        urls.push(article.url)
        scripts.push(text)
      }
      return observation(scripts.join('\n'), urls)
    },
  },
  {
    name: 'slug resolution and 410 response',
    read: async ({ repository }, seeded) => {
      const visible = await readVisibleSlugs(repository)
      const resolve = (slug: string) =>
        resolveSlug(slug, {
          history: new RepositorySlugHistory(repository),
          visibleArticleAt: async (candidate) => visible.get(candidate) ?? null,
        })
      const slugs: string[] = []
      const bodies: string[] = []
      for (const story of [...seeded.visible, ...seeded.hidden]) {
        const resolution = await resolve(story.slug)
        expect(resolution.kind, story.state).toBe(
          story.visible ? 'current' : story.everPublished ? 'gone' : 'unknown',
        )
        const response = await handleStoryRequest(
          new NextRequest(`${origin}/stories/${story.slug}`),
          resolve,
        )
        expect(response.status).toBe(!story.visible && story.everPublished ? 410 : 200)
        bodies.push(await response.text())
        if (resolution.kind === 'current') slugs.push(story.slug)
        if (!story.visible) {
          expect(
            await readArticleView({ mediaAvailable: false, repository }, story.slug),
          ).toBeNull()
        }
      }
      return { payload: bodies.join('\n'), slugs }
    },
  },
  // blog-0045.8: register the public card route here when it lands. Exercise the private
  // preview card separately: valid-token-only, no-store/noindex, and 404 without a token.
]

describe('shared AC-03 distribution exclusion contract', () => {
  it.each(unitSurfaces)(
    '$name excludes hidden articles and unpublished revisions',
    async (surface) => {
      assertExclusion(surface.name, corpus, await surface.read(context, corpus))
    },
  )

  it('rejects an empty surface and each hidden state even when all visible controls are present', () => {
    const slugs = corpus.visible.map((story) => story.slug)
    expect(() => assertExclusion('empty control', corpus, { payload: '', slugs: [] })).toThrow()
    for (const hidden of corpus.hidden) {
      expect(() => assertExclusion(hidden.state, corpus, { payload: hidden.slug, slugs })).toThrow(
        hidden.state,
      )
      expect(() =>
        assertExclusion(hidden.state, corpus, { payload: '', slugs: [...slugs, hidden.slug] }),
      ).toThrow()
    }
    for (const marker of corpus.privateMarkers) {
      expect(() =>
        assertExclusion('revision control', corpus, { payload: marker, slugs }),
      ).toThrow()
    }
  })
})
