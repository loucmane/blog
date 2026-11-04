import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { siteName } from '@/reader/components/failure-view'
import { readArticleView, type ReaderSource } from '@/reader/read-model'
import type { ArticleView } from '@/reader/views'
import { CURRENT_CONTENT_DOCUMENT_VERSION, type ContentNode } from '@/server/content/document'
import type { AuthorProfile, TaxonomyTerm } from '@/server/content/domain'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { InMemoryOriginalObjectStore, MediaOriginalService } from '@/server/content/media'
import type { Clock } from '@/server/content/ports'
import { SectionService } from '@/server/content/sections'
import { ContentService } from '@/server/content/service'

import {
  absolute,
  canonicalArticleUrl,
  canonicalAuthorUrl,
  canonicalSectionUrl,
  publicMediaPath,
} from './canonical'
import {
  publicationOrganization,
  serializeJsonLd,
  storyStructuredData,
  type StoryJsonLd,
} from './structured-data'

const origin = 'https://magazine.example'
const publishedAt = '2026-09-01T07:00:00.000Z'
const termTime = '2026-09-01T00:00:00.000Z'
const pngPixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=',
  'base64',
)

let repository: InMemoryContentRepository
let source: ReaderSource

function clockAt(iso: string): Clock {
  return { now: () => new Date(iso) }
}

function documentFor(articleId: string, title: string, content: ContentNode[]) {
  return {
    articleId,
    document: { content, type: 'doc' },
    migrationProvenance: [],
    schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
    title,
  }
}

function paragraph(value: string): ContentNode {
  return { content: [{ text: value, type: 'text' }], type: 'paragraph' }
}

function image(mediaId: string): ContentNode {
  return {
    attrs: {
      alt: `Alt for ${mediaId}`,
      caption: '',
      credit: { name: 'Studio', url: null },
      focalPoint: { x: 0.5, y: 0.5 },
      mediaId,
    },
    type: 'mediaImage',
  }
}

async function storeImage(
  id: string,
  size: { readonly height?: number; readonly width?: number } = {},
) {
  await new MediaOriginalService(repository, new InMemoryOriginalObjectStore()).store({
    alt: `Stored alt for ${id}`,
    body: pngPixel,
    contentType: 'image/png',
    creditName: 'Studio',
    id,
    ...size,
  })
}

async function publish(input: {
  readonly content?: ContentNode[]
  readonly dek?: string
  readonly section?: { readonly name: string; readonly slug: string }
  readonly slug: string
  readonly title?: string
}) {
  const service = new ContentService(repository, clockAt(publishedAt))
  const articleId = `article-${input.slug}`
  const title = input.title ?? `Title for ${input.slug}`
  const created = await service.createArticle({
    dek: input.dek ?? `Summary for ${input.slug}`,
    document: documentFor(articleId, title, input.content ?? [paragraph(`Body of ${input.slug}`)]),
    id: articleId,
    idempotencyKey: `create-${input.slug}`,
    slug: input.slug,
    title,
  })
  if (input.section) {
    const sections = new SectionService(repository, clockAt(termTime))
    const section = await sections.ensureSection(input.section)
    await sections.assignSection({ articleId, sectionId: section.id })
  }
  const published = await service.publish({
    articleId,
    expectedVersion: created.article.version,
    idempotencyKey: `publish-${input.slug}`,
    revisionId: created.revision.id,
  })
  return { ...published, service }
}

function authorProfile(slug: string, displayName: string): AuthorProfile {
  return {
    bio: `${displayName} writes about rooms.`,
    createdAt: termTime,
    displayName,
    id: `author-${slug}`,
    slug,
    updatedAt: termTime,
  }
}

const alpha = authorProfile('alpha', 'Alpha Writer')
const bravo = authorProfile('bravo', 'Bravo Writer')

/** Saves the authors and sets them as the article's byline, in order. */
async function credit(articleId: string, ...profiles: AuthorProfile[]) {
  await repository.transaction(async (transaction) => {
    for (const profile of profiles) await transaction.saveAuthor(profile)
    await transaction.setArticleAuthors(
      articleId,
      profiles.map(({ id }) => id),
    )
    transaction.recordPublicationChange()
  })
}

/** Files an article under a category or tag, after the article's existing taxonomy links. */
async function fileUnder(
  articleId: string,
  kind: Exclude<TaxonomyTerm['kind'], 'section'>,
  slug: string,
  name: string,
) {
  await repository.transaction(async (transaction) => {
    const id = `${kind}-${slug}`
    await transaction.saveTaxonomyTerm({
      createdAt: termTime,
      id,
      kind,
      name,
      slug,
      updatedAt: termTime,
    })
    const positions = (await transaction.listArticleTaxonomies())
      .filter((link) => link.articleId === articleId)
      .map(({ position }) => position)
    await transaction.saveArticleTaxonomy({
      articleId,
      position: Math.max(-1, ...positions) + 1,
      taxonomyId: id,
    })
    transaction.recordPublicationChange()
  })
}

/** A fully filed story: a lead image, a section, two credited authors and two topics. */
async function publishFeature() {
  await storeImage('media-lead', { height: 600, width: 900 })
  const story = await publish({
    content: [image('media-lead'), paragraph('Light falls through the north window.')],
    dek: 'How a north window lights a winter room.',
    section: { name: 'Interiors', slug: 'interiors' },
    slug: 'winter-light',
    title: 'Winter light',
  })
  await credit(story.article.id, bravo, alpha)
  await fileUnder(story.article.id, 'tag', 'winter', 'Winter')
  await fileUnder(story.article.id, 'category', 'light', 'Light')
  return story
}

async function structuredDataFor(slug: string, from: ReaderSource = source) {
  const view = await readArticleView(from, slug)
  if (!view) throw new Error(`No public story has the slug ${slug}.`)
  return storyStructuredData(view)
}

/** A published story's view, for the serializer: only the fields under test matter. */
function articleView(overrides: Partial<ArticleView> = {}): ArticleView {
  return {
    authorLinks: [],
    authors: [],
    body: [],
    dek: '',
    hero: null,
    href: '/stories/plain',
    navigation: { sections: [] },
    publishedAt,
    readingMinutes: 1,
    related: [],
    section: null,
    slug: 'plain',
    title: 'Plain',
    topics: [],
    ...overrides,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isText(value: unknown): boolean {
  return typeof value === 'string' && value.trim() !== ''
}

/** An absolute URL on the canonical origin, written exactly as the URL parser writes it. */
function isCanonicalUrl(value: unknown): boolean {
  if (typeof value !== 'string' || !URL.canParse(value)) return false
  const url = new URL(value)
  return url.origin === origin && url.href === value
}

function isTimestamp(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  )
}

function isPixels(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

/** The rules a node does not meet, each named after its place in the document. */
function unmet(at: string, rules: Record<string, boolean>): string[] {
  return Object.entries(rules).flatMap(([rule, met]) => (met ? [] : [`${at}: ${rule}`]))
}

function organizationProblems(node: unknown, at: string): string[] {
  if (!isRecord(node)) return [`${at}: is an object`]
  return unmet(at, {
    'has a name': isText(node.name),
    'is an Organization': node['@type'] === 'Organization',
    'links its home page': isCanonicalUrl(node.url),
  })
}

function personProblems(node: unknown, at: string): string[] {
  if (!isRecord(node)) return [`${at}: is an object`]
  return unmet(at, {
    'has a name': isText(node.name),
    'is a Person': node['@type'] === 'Person',
    'links their author page': isCanonicalUrl(node.url),
  })
}

function imageProblems(node: unknown, at: string): string[] {
  if (!isRecord(node)) return [`${at}: is an object`]
  const sized = node.width !== undefined || node.height !== undefined
  return unmet(at, {
    'gives both pixel dimensions or neither':
      !sized || (isPixels(node.width) && isPixels(node.height)),
    'is an ImageObject': node['@type'] === 'ImageObject',
    'links a canonical image': isCanonicalUrl(node.url),
  })
}

function articleProblems(node: unknown, at: string): string[] {
  if (!isRecord(node)) return [`${at}: is an object`]
  const { author, image } = node
  return [
    ...unmet(at, {
      'credits authors as a non-empty list, or not at all':
        author === undefined || (Array.isArray(author) && author.length > 0),
      'describes itself with text, if at all':
        node.description === undefined || isText(node.description),
      'has a canonical url': isCanonicalUrl(node.url),
      'has a headline': isText(node.headline),
      'has an ISO 8601 datePublished': isTimestamp(node.datePublished),
      'is an Article': node['@type'] === 'Article',
      'is the main entity of its page': node.mainEntityOfPage === node.url,
    }),
    ...organizationProblems(node.publisher, `${at}.publisher`),
    ...(Array.isArray(author)
      ? author.flatMap((each, index) => personProblems(each, `${at}.author[${index}]`))
      : []),
    ...(image === undefined ? [] : imageProblems(image, `${at}.image`)),
  ]
}

function breadcrumbProblems(node: unknown, at: string, articleUrl: unknown): string[] {
  if (!isRecord(node)) return [`${at}: is an object`]
  const items: unknown[] = Array.isArray(node.itemListElement) ? node.itemListElement : []
  const last = items.at(-1)
  return [
    ...unmet(at, {
      'ends at the story': isRecord(last) && last.item === articleUrl,
      'has at least two items': items.length >= 2,
      'is a BreadcrumbList': node['@type'] === 'BreadcrumbList',
    }),
    ...items.flatMap((item, index) => {
      const itemAt = `${at}.itemListElement[${index}]`
      if (!isRecord(item)) return [`${itemAt}: is an object`]
      return unmet(itemAt, {
        [`is at position ${index + 1}`]: item.position === index + 1,
        'has a name': isText(item.name),
        'is a ListItem': item['@type'] === 'ListItem',
        'links a canonical page': isCanonicalUrl(item.item),
      })
    }),
  ]
}

/**
 * Validates a story's structured data (AC-05) and returns every unmet rule; none means valid. The
 * required fields follow schema.org and Google's structured data rules: an `Article` with its
 * headline, publication date, canonical URL and publisher, and its authors when it credits any; a
 * `Person` with a name and a URL; a `BreadcrumbList` of at least two `ListItem`s, each with its
 * position, name and URL.
 */
function problems(data: unknown): string[] {
  if (!isRecord(data)) return ['document: is an object']
  const graph: unknown[] = Array.isArray(data['@graph']) ? data['@graph'] : []
  const [article, breadcrumbs] = graph
  return [
    ...unmet('document', {
      'is a graph of an Article and a BreadcrumbList': graph.length === 2,
      'uses the schema.org vocabulary': data['@context'] === 'https://schema.org',
    }),
    ...articleProblems(article, 'Article'),
    ...breadcrumbProblems(
      breadcrumbs,
      'BreadcrumbList',
      isRecord(article) ? article.url : undefined,
    ),
  ]
}

/** Every primitive value in a JSON value, with its path. */
function leaves(value: unknown, at = ''): (readonly [string, unknown])[] {
  if (Array.isArray(value)) return value.flatMap((each, index) => leaves(each, `${at}[${index}]`))
  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, each]) => leaves(each, at ? `${at}.${key}` : key))
  }
  return [[at, value]]
}

type Loose = Record<string, unknown>

interface LooseGraph {
  readonly article: Loose
  readonly breadcrumbs: Loose
}

/** A mutable copy of a document's two nodes, so a test can break one rule at a time. */
function looseGraph(data: StoryJsonLd): LooseGraph {
  const [article, breadcrumbs] = structuredClone(data)['@graph'] as unknown as [Loose, Loose]
  return { article, breadcrumbs }
}

const brokenRules: readonly (readonly [string, (graph: LooseGraph) => void, string])[] = [
  [
    'a headline',
    ({ article }) => {
      delete article.headline
    },
    'Article: has a headline',
  ],
  [
    'a publication date',
    ({ article }) => {
      article.datePublished = 'last winter'
    },
    'Article: has an ISO 8601 datePublished',
  ],
  [
    'a publisher name',
    ({ article }) => {
      article.publisher = { '@type': 'Organization', url: `${origin}/` }
    },
    'Article.publisher: has a name',
  ],
  [
    'a non-empty byline',
    ({ article }) => {
      article.author = []
    },
    'Article: credits authors as a non-empty list, or not at all',
  ],
  [
    'an absolute author page',
    ({ article }) => {
      article.author = [{ '@type': 'Person', name: 'Alpha Writer', url: '/authors/alpha' }]
    },
    'Article.author[0]: links their author page',
  ],
  [
    'a second breadcrumb',
    ({ breadcrumbs }) => {
      breadcrumbs.itemListElement = (breadcrumbs.itemListElement as unknown[]).slice(-1)
    },
    'BreadcrumbList: has at least two items',
  ],
  [
    'breadcrumb positions',
    ({ breadcrumbs }) => {
      breadcrumbs.itemListElement = (breadcrumbs.itemListElement as Loose[]).map((item) => ({
        ...item,
        position: 0,
      }))
    },
    'BreadcrumbList.itemListElement[0]: is at position 1',
  ],
]

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', origin)
  repository = new InMemoryContentRepository()
  source = { mediaAvailable: true, repository }
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('story structured data', () => {
  it('describes a published story as an Article and a BreadcrumbList on canonical URLs', async () => {
    await publishFeature()

    expect(await structuredDataFor('winter-light')).toEqual({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          articleSection: 'Interiors',
          author: [
            { '@type': 'Person', name: 'Bravo Writer', url: `${origin}/authors/bravo` },
            { '@type': 'Person', name: 'Alpha Writer', url: `${origin}/authors/alpha` },
          ],
          datePublished: publishedAt,
          description: 'How a north window lights a winter room.',
          headline: 'Winter light',
          image: {
            '@type': 'ImageObject',
            height: 600,
            url: `${origin}/api/media/media-lead`,
            width: 900,
          },
          keywords: ['Winter', 'Light'],
          mainEntityOfPage: `${origin}/stories/winter-light`,
          publisher: { '@type': 'Organization', name: siteName, url: `${origin}/` },
          url: `${origin}/stories/winter-light`,
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', item: `${origin}/`, name: siteName, position: 1 },
            {
              '@type': 'ListItem',
              item: `${origin}/sections/interiors`,
              name: 'Interiors',
              position: 2,
            },
            {
              '@type': 'ListItem',
              item: `${origin}/stories/winter-light`,
              name: 'Winter light',
              position: 3,
            },
          ],
        },
      ],
    })
  })

  it('validates as Article, Person and BreadcrumbList with every required field populated (AC-05)', async () => {
    await publishFeature()
    await publish({ slug: 'plain-story' })

    for (const slug of ['winter-light', 'plain-story']) {
      expect(problems(await structuredDataFor(slug)), slug).toEqual([])
    }
  })

  it.each(brokenRules)(
    'reports a document without %s as invalid',
    async (_, breakRule, problem) => {
      await publishFeature()
      const data = await structuredDataFor('winter-light')
      const graph = looseGraph(data)

      breakRule(graph)

      expect(problems(data)).toEqual([])
      expect(problems({ ...data, '@graph': [graph.article, graph.breadcrumbs] })).toContain(problem)
    },
  )

  it('leaves author out entirely when no author is linked, and still validates', async () => {
    await publish({ dek: '', slug: 'uncredited', title: 'Uncredited' })

    const data = await structuredDataFor('uncredited')

    expect(data['@graph'][0]).toEqual({
      '@type': 'Article',
      datePublished: publishedAt,
      headline: 'Uncredited',
      mainEntityOfPage: `${origin}/stories/uncredited`,
      publisher: { '@type': 'Organization', name: siteName, url: `${origin}/` },
      url: `${origin}/stories/uncredited`,
    })
    expect(serializeJsonLd(data)).not.toContain('Person')
    expect(data['@graph'][1].itemListElement.map(({ name }) => name)).toEqual([
      siteName,
      'Uncredited',
    ])
    expect(problems(data)).toEqual([])
  })

  it('sources every field from canonical storage, never from a newer draft', async () => {
    const story = await publishFeature()
    await story.service.saveDraft({
      articleId: story.article.id,
      dek: 'An unpublished draft summary',
      document: documentFor(story.article.id, 'An unpublished draft title', [
        paragraph('An unpublished draft body'),
      ]),
      expectedVersion: story.article.version,
      idempotencyKey: 'save-newer-draft',
      title: 'An unpublished draft title',
    })

    // Canonical storage, read back directly: the story's published state, its byline in the
    // AuthorProfile projection, the terms it is filed under, and the stored media.
    const stored = await repository.transaction(async (transaction) => {
      const article = await transaction.getArticleBySlug('winter-light')
      const revision = article?.publishedRevisionId
        ? await transaction.getRevision(article.publishedRevisionId)
        : null
      if (!article || !revision) throw new Error('The story has no published revision.')
      const links = (await transaction.listArticleTaxonomies()).filter(
        (link) => link.articleId === article.id,
      )
      return {
        article,
        authors: await transaction.listArticleAuthors(article.id),
        media: await transaction.listMediaAssets(),
        revision,
        terms: (await transaction.listTaxonomyTerms()).filter(({ id }) =>
          links.some((link) => link.taxonomyId === id),
        ),
      }
    })
    const allowed = new Set<unknown>([
      // schema.org's own vocabulary
      'https://schema.org',
      'Article',
      'BreadcrumbList',
      'ImageObject',
      'ListItem',
      'Organization',
      'Person',
      // the publication: the site's name and its canonical home page
      siteName,
      absolute('/'),
      // the published revision and its publication
      stored.revision.title,
      stored.revision.dek,
      stored.revision.document.title,
      stored.article.publishedAt,
      canonicalArticleUrl(stored.article.slug),
      ...stored.authors.flatMap((author) => [author.displayName, canonicalAuthorUrl(author.slug)]),
      ...stored.terms.flatMap((term) =>
        term.kind === 'section' ? [term.name, canonicalSectionUrl(term.slug)] : [term.name],
      ),
      ...stored.media.flatMap((asset) => [
        absolute(publicMediaPath(asset.id)),
        asset.height,
        asset.width,
      ]),
    ])

    const emitted = leaves(await structuredDataFor('winter-light'))
    // Breadcrumb positions are the trail's order, which `problems` checks, not stored data.
    const sourced = emitted.filter(
      ([at]) => !/^@graph\[1\]\.itemListElement\[\d+\]\.position$/.test(at),
    )

    expect(sourced.length).toBeGreaterThan(20)
    expect(sourced.filter(([, value]) => !allowed.has(value))).toEqual([])
    expect(JSON.stringify(emitted)).not.toContain('unpublished draft')
  })

  it('takes the first image when the story does not open with one, sized only when both sizes are stored', async () => {
    await storeImage('media-inline')
    await publish({
      content: [paragraph('The opening words.'), image('media-inline')],
      slug: 'inline-image',
    })

    expect((await structuredDataFor('inline-image'))['@graph'][0].image).toEqual({
      '@type': 'ImageObject',
      url: `${origin}/api/media/media-inline`,
    })
  })

  it('leaves the image out when the story has none, or media cannot be served', async () => {
    await storeImage('media-lead', { height: 600, width: 900 })
    await publish({ content: [image('media-lead'), paragraph('Body')], slug: 'with-image' })
    await publish({ slug: 'without-image' })

    expect((await structuredDataFor('without-image'))['@graph'][0]).not.toHaveProperty('image')
    expect(
      (await structuredDataFor('with-image', { mediaAvailable: false, repository }))['@graph'][0],
    ).not.toHaveProperty('image')
  })

  it('names only the story’s current slug after a slug change (BR-04)', async () => {
    const story = await publish({
      dek: 'A story that moved.',
      section: { name: 'Interiors', slug: 'interiors' },
      slug: 'first-name',
      title: 'A renamed story',
    })
    await story.service.changeSlug({
      articleId: story.article.id,
      expectedVersion: story.article.version,
      idempotencyKey: 'rename',
      slug: 'second-name',
    })

    const data = await structuredDataFor('second-name')

    expect(data['@graph'][0]).toMatchObject({
      mainEntityOfPage: `${origin}/stories/second-name`,
      url: `${origin}/stories/second-name`,
    })
    expect(data['@graph'][1].itemListElement.at(-1)?.item).toBe(`${origin}/stories/second-name`)
    expect(serializeJsonLd(data)).not.toContain('first-name')
    expect(await readArticleView(source, 'first-name')).toBeNull()
  })

  it('names the publication with the site name, at its home page on the canonical origin', () => {
    expect(publicationOrganization()).toEqual({
      '@type': 'Organization',
      name: siteName,
      url: `${origin}/`,
    })

    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://elsewhere.example')
    expect(publicationOrganization().url).toBe('https://elsewhere.example/')
  })
})

describe('structured data serialization', () => {
  const hostile = '</script><script>alert(1)</script><!-- a & b --> \u{2028}\u{2029}'

  it('escapes markup so a stored title or name cannot end the script element', () => {
    const data = storyStructuredData(
      articleView({
        authorLinks: [{ href: '/authors/alpha', name: hostile }],
        dek: hostile,
        section: { href: '/sections/interiors', name: hostile, slug: 'interiors' },
        title: hostile,
        topics: [{ href: '/topics/light', name: hostile }],
      }),
    )

    const text = serializeJsonLd(data)

    expect(text).not.toMatch(/[<>&\u{2028}\u{2029}]/u)
    expect(text).toContain('\\u003c/script\\u003e\\u003cscript\\u003ealert(1)')
    expect(text).toContain('\\u003c!-- a \\u0026 b --\\u003e \\u2028\\u2029')
    expect(JSON.parse(text)).toEqual(data)
  })

  it('reads back every character it escapes, and the rest, unchanged', () => {
    const everyCharacter = Array.from({ length: 0x3000 }, (_, code) => String.fromCharCode(code))
      .join('')
      .concat('\u{d800} \u{dfff} \u{1f600}')
    const data = storyStructuredData(articleView({ dek: everyCharacter, title: everyCharacter }))

    const text = serializeJsonLd(data)

    expect(text).not.toMatch(/[<>&\u{2028}\u{2029}]/u)
    expect(JSON.parse(text)).toEqual(data)
  })
})

const sourceRoot = path.resolve('packages/web/src')

/** Every application source file under `directory`, as a path relative to `src`. */
function sourceFiles(directory: string): string[] {
  return readdirSync(path.join(sourceRoot, directory), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.posix.join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(relative)
    return /\.tsx?$/.test(entry.name) && !/\.(?:test|spec|e2e)\.tsx?$|\.d\.ts$/.test(entry.name)
      ? [relative]
      : []
  })
}

describe('where structured data is emitted', () => {
  it('comes from the public story page alone: never a preview, an owner page or the shared layout', () => {
    const files = sourceFiles('.')
    expect(files).toEqual(
      expect.arrayContaining([
        'app/layout.tsx',
        'app/owner/(workspace)/stories/[id]/preview/page.tsx',
        'app/preview/stories/[slug]/page.tsx',
        'app/stories/[slug]/page.tsx',
      ]),
    )

    const emitters = files.filter((file) =>
      /application\/ld\+json|from '(?:@\/server\/distribution|\.)\/structured-data'/.test(
        readFileSync(path.join(sourceRoot, file), 'utf8'),
      ),
    )

    expect(emitters.sort()).toEqual([
      'app/stories/[slug]/page.tsx',
      'server/distribution/structured-data.ts',
    ])
  })
})
