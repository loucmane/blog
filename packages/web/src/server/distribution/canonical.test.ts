import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import ts from 'typescript'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  absolute,
  authorPath,
  canonicalArticleUrl,
  canonicalAuthorUrl,
  canonicalFeedUrl,
  canonicalHomeUrl,
  canonicalSectionUrl,
  canonicalSitemapIndexUrl,
  canonicalSitemapPageUrl,
  canonicalTopicUrl,
  feedPath,
  publicMediaPath,
  sectionPath,
  sitemapIndexPath,
  sitemapPagePath,
  storyPath,
  topicPath,
} from './canonical'

describe('canonical URLs', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://magazine.example')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('builds each public path from its slug', () => {
    expect(storyPath('winter-light')).toBe('/stories/winter-light')
    expect(sectionPath('interiors')).toBe('/sections/interiors')
    expect(authorPath('alpha-writer')).toBe('/authors/alpha-writer')
    expect(topicPath('light')).toBe('/topics/light')
    expect(publicMediaPath('media-1')).toBe('/api/media/media-1')
  })

  it('makes absolute URLs on the configured canonical origin', () => {
    expect(canonicalArticleUrl('winter-light')).toBe(
      'https://magazine.example/stories/winter-light',
    )
    expect(canonicalSectionUrl('interiors')).toBe('https://magazine.example/sections/interiors')
    expect(canonicalAuthorUrl('alpha-writer')).toBe('https://magazine.example/authors/alpha-writer')
    expect(canonicalTopicUrl('light')).toBe('https://magazine.example/topics/light')
    // An unchecked author or topic slug stays inside its own path segment.
    expect(canonicalAuthorUrl('../owner')).toBe('https://magazine.example/authors/..%2Fowner')
    expect(absolute('/')).toBe('https://magazine.example/')
    expect(absolute('/feed.xml?format=rss')).toBe('https://magazine.example/feed.xml?format=rss')
  })

  it('builds the feed, its archive pages and the sitemap on the canonical origin', () => {
    expect(feedPath()).toBe('/feed.xml')
    expect(feedPath('2026-11-03T09:00:00.000Z_article-1')).toBe(
      '/feed.xml?before=2026-11-03T09%3A00%3A00.000Z_article-1',
    )
    // An archive key stays one query value, whatever it holds.
    expect(feedPath('a&b=c#d')).toBe('/feed.xml?before=a%26b%3Dc%23d')
    expect(sitemapIndexPath()).toBe('/sitemap.xml')
    expect(sitemapPagePath(1)).toBe('/sitemaps/1.xml')
    expect(sitemapPagePath(12)).toBe('/sitemaps/12.xml')

    expect(canonicalHomeUrl()).toBe('https://magazine.example/')
    expect(canonicalFeedUrl()).toBe('https://magazine.example/feed.xml')
    expect(canonicalFeedUrl('key')).toBe('https://magazine.example/feed.xml?before=key')
    expect(canonicalSitemapIndexUrl()).toBe('https://magazine.example/sitemap.xml')
    expect(canonicalSitemapPageUrl(2)).toBe('https://magazine.example/sitemaps/2.xml')
  })

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('has no sitemap page %d', (page) => {
    expect(() => sitemapPagePath(page)).toThrow(RangeError)
  })

  it('fails closed to the unconfigured origin when production has no valid HTTPS origin', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://magazine.example')

    expect(canonicalArticleUrl('winter-light')).toBe(
      'https://unconfigured.magazine.invalid/stories/winter-light',
    )
  })

  it.each([
    'stories/winter-light',
    'https://magazine.example/stories/winter-light',
    'https://elsewhere.example/stories/winter-light',
    '//elsewhere.example/stories/winter-light',
    '/\\elsewhere.example/stories/winter-light',
    '/\t/elsewhere.example/stories/winter-light',
  ])('never leaves the site for %j', (input) => {
    expect(() => absolute(input)).toThrow(TypeError)
  })
})

const sourceRoot = path.resolve('packages/web/src')
/** Application code, as the slice scopes the rule; tests and the reader directions build freely. */
const applicationRoots = ['app', 'reader', 'server']
const canonicalFile = 'server/distribution/canonical.ts'

const publicRoute = String.raw`(?:(?:stories|sections|authors|topics|api\/media|sitemaps)\/|feed\.xml\?)`
/** A literal that starts a public path, alone or after an origin. */
const startsPublicPath = new RegExp(
  String.raw`^(?:[a-z][a-z\d+.-]*:\/\/[^/]*)?\/${publicRoute}`,
  'i',
)
/** Literal text right after an interpolated or concatenated origin. */
const continuesPublicPath = new RegExp(String.raw`^\/?${publicRoute}`, 'i')

/**
 * Template literals and string concatenations that build a public path. Types such as
 * `/stories/${string}` and plain literals are not building anything, and owner, preview and API
 * paths that only contain a public segment name are not public paths.
 */
function handBuiltPublicPaths(source: string): string[] {
  const tree = ts.createSourceFile(
    'source.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const found: string[] = []
  const visit = (node: ts.Node) => {
    if (
      ts.isTemplateExpression(node) &&
      (startsPublicPath.test(node.head.text) ||
        node.templateSpans.some(({ literal }) => continuesPublicPath.test(literal.text)))
    ) {
      found.push(node.getText(tree))
    } else if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.PlusToken &&
      ((ts.isStringLiteralLike(node.left) && startsPublicPath.test(node.left.text)) ||
        (ts.isStringLiteralLike(node.right) && continuesPublicPath.test(node.right.text)))
    ) {
      found.push(node.getText(tree))
    }
    ts.forEachChild(node, visit)
  }
  visit(tree)
  return found
}

function applicationFiles(directory: string): string[] {
  return readdirSync(path.join(sourceRoot, directory), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.posix.join(directory, entry.name)
    if (entry.isDirectory()) return applicationFiles(relative)
    return /\.tsx?$/.test(entry.name) && !/\.(?:test|spec|e2e)\.tsx?$|\.d\.ts$/.test(entry.name)
      ? [relative]
      : []
  })
}

describe('no hand-built public URL', () => {
  it('recognizes a public path built by hand, and nothing else', () => {
    for (const built of [
      'const href = `/stories/${slug}`',
      'const href = `${origin}/stories/${slug}`',
      'const href = `${origin}stories/${slug}`',
      'const href = `https://magazine.example/stories/${slug}`',
      "const href = '/stories/' + slug",
      "const href = origin + '/stories/' + slug",
      'const url = new URL(`/stories/${slug}`, origin)',
      'const link = <a href={`/stories/${story.slug}`}>Read</a>',
      'const href = `/sections/${slug}`',
      'const href = `/authors/${slug}`',
      'const href = `/topics/${slug}`',
      'const src = `/api/media/${id}`',
      'const page = `/sitemaps/${page}.xml`',
      'const archive = `/feed.xml?before=${key}`',
      "const archive = origin + '/feed.xml?before=' + key",
    ]) {
      expect(handBuiltPublicPaths(built), built).toHaveLength(1)
    }
    for (const notBuilt of [
      'type StoryPath = `/stories/${string}`',
      'const href = storyPath(slug)',
      'const url = canonicalArticleUrl(slug)',
      "const placeholder = '/stories/your-story'",
      '// A comment may show `/stories/${slug}`.',
      'const owner = `/owner/stories/${id}`',
      'const preview = `/preview/stories/${slug}`',
      'const action = `/api/owner/stories/${id}/actions`',
      'const variant = `${publicMediaPath(id)}?w=${width}`',
      "const feed = '/feed.xml'",
      'const url = canonicalSitemapPageUrl(page)',
    ]) {
      expect(handBuiltPublicPaths(notBuilt), notBuilt).toEqual([])
    }
  })

  it('finds every public path in app/, reader/ and server/ built in canonical.ts alone', () => {
    const files = applicationRoots.flatMap(applicationFiles)
    // The scan reads the files that render and link stories, and the builder itself.
    expect(files).toEqual(
      expect.arrayContaining([
        'app/stories/[slug]/page.tsx',
        'reader/paths.ts',
        'reader/read-model.ts',
        canonicalFile,
      ]),
    )
    expect(
      handBuiltPublicPaths(readFileSync(path.join(sourceRoot, canonicalFile), 'utf8')),
    ).not.toEqual([])

    const elsewhere = files
      .filter((file) => file !== canonicalFile)
      .flatMap((file) =>
        handBuiltPublicPaths(readFileSync(path.join(sourceRoot, file), 'utf8')).map(
          (snippet) => `${file}: ${snippet}`,
        ),
      )
    expect(elsewhere).toEqual([])
  })
})
