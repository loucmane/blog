import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import nextConfig from '../../next.config'

interface PackageManifest {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>
}

function readManifest(relativePath: string): PackageManifest {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8'))
}

describe('Next and React migration contract', () => {
  it('pins one exact supported framework and React pair', () => {
    const root = readManifest('package.json')
    const web = readManifest('packages/web/package.json')

    expect(root.devDependencies?.['@next/eslint-plugin-next']).toBe('16.3.8')
    expect(root.devDependencies).toMatchObject({
      react: '19.2.7',
      'react-dom': '19.2.7',
    })
    expect(web.dependencies).toMatchObject({
      '@types/react': '19.2.17',
      '@types/react-dom': '19.2.3',
      next: '16.3.8',
      react: '19.2.7',
      'react-dom': '19.2.7',
    })
  })

  it('uses the Next 16 Turbopack default without the obsolete Webpack bridge', () => {
    expect(nextConfig.typedRoutes).toBe(true)
    expect(nextConfig.transpilePackages).toBeUndefined()
    expect(nextConfig.webpack).toBeUndefined()
    expect(nextConfig.output).toBeUndefined()

    const web = readManifest('packages/web/package.json')
    expect(web.devDependencies?.['@svgr/webpack']).toBeUndefined()
  })

  it('marks app-local interactive design-system entry points as client boundaries', () => {
    for (const relativePath of [
      'packages/web/src/components/theme-menu.tsx',
      'packages/web/src/components/theme-provider.tsx',
    ]) {
      const source = fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
      expect(source.startsWith("'use client'\n"), relativePath).toBe(true)
    }
  })

  it('keeps Next-generated type declarations outside formatting rewrites', () => {
    const prettierIgnore = fs.readFileSync(path.join(process.cwd(), '.prettierignore'), 'utf8')
    expect(prettierIgnore.split('\n')).toContain('packages/web/next-env.d.ts')
  })

  it('generates route declarations before standalone TypeScript validation', () => {
    const root = readManifest('package.json')
    const web = readManifest('packages/web/package.json')

    expect(root.scripts?.typecheck).toContain('pnpm --filter web run typecheck')
    expect(root.scripts?.typecheck).not.toContain('pnpm --filter web exec tsc --noEmit')
    expect(web.scripts?.typecheck).toBe('next typegen && tsc --noEmit')
  })

  it('keeps reader route sources free from owner editor runtimes', () => {
    const appRoot = path.join(process.cwd(), 'packages/web/src/app')
    const sources: string[] = []
    const visit = (directory: string) => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const absolute = path.join(directory, entry.name)
        const relative = path.relative(appRoot, absolute)
        if (entry.isDirectory()) {
          if (relative === 'owner' || relative === 'api/owner' || relative === 'api/auth') continue
          visit(absolute)
        } else if (/\.(?:ts|tsx)$/.test(entry.name)) {
          sources.push(fs.readFileSync(absolute, 'utf8'))
        }
      }
    }
    visit(appRoot)
    const readerSource = sources.join('\n')

    for (const runtime of [
      '@tiptap/core',
      '@tiptap/react',
      'lexical',
      'prosemirror-model',
      'prosemirror-state',
      '@/components/owner/',
    ]) {
      expect(readerSource, runtime).not.toContain(runtime)
    }
  })

  it('revalidates owner sessions in every leaf loader before reading private data', () => {
    for (const relativePath of [
      'packages/web/src/app/owner/(workspace)/page.tsx',
      'packages/web/src/app/owner/(workspace)/stories/new/page.tsx',
      'packages/web/src/app/owner/(workspace)/stories/[id]/page.tsx',
      'packages/web/src/app/owner/(workspace)/stories/[id]/preview/page.tsx',
    ]) {
      const source = fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
      expect(source, relativePath).toContain('await requireOwnerPageSession()')
      expect(source, relativePath).toContain('getOwnerRuntime()')
    }
  })

  it('pins Next internal PostCSS to the workspace patched release', () => {
    const workspace = fs.readFileSync(path.join(process.cwd(), 'pnpm-workspace.yaml'), 'utf8')
    expect(workspace).toContain("'next@16.3.8>postcss': 8.5.23")
    expect(workspace).toContain("'next@16.3.8>sharp': 0.35.4")
    expect(workspace).not.toContain('next@15.5.20')
  })

  it('removes stale prototype integrations from the framework config', async () => {
    const configSource = fs.readFileSync(
      path.join(process.cwd(), 'packages/web/next.config.ts'),
      'utf8',
    )
    const redirects = await nextConfig.redirects?.()

    expect(configSource).not.toMatch(/stripe|paypal|convertkit|animal-foundation|amazonaws/i)
    expect(redirects).toEqual([
      {
        destination: '/stories/:slug',
        permanent: true,
        source: '/blog/:slug',
      },
    ])
  })

  it('applies preview and owner privacy headers after the global header policy', async () => {
    const headers = await nextConfig.headers?.()
    const sources = headers?.map(({ source }) => source) ?? []

    expect(sources).toEqual([
      '/:path*',
      '/api/preview',
      '/api/preview/:path*',
      '/preview/:path*',
      '/owner/:path*',
      '/api/owner/:path*',
      '/',
      '/stories/:slug',
      '/sections/:slug',
    ])
    const ownerHeaders = headers?.filter(({ source }) => source.includes('owner')) ?? []
    expect(ownerHeaders).toHaveLength(2)
    for (const entry of ownerHeaders) {
      expect(entry.headers).toEqual(
        expect.arrayContaining([
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ]),
      )
    }
  })

  it('keeps every response that could carry a Reader Lab override private and unindexed', async () => {
    const headers = await nextConfig.headers?.()
    const readerRoutes = ['/', '/stories/:slug', '/sections/:slug']
    const labRules = headers?.filter(({ has }) => has !== undefined) ?? []

    expect(labRules.map(({ source }) => source)).toEqual(readerRoutes)
    for (const rule of labRules) {
      expect(rule.has, rule.source).toEqual([{ key: 'reader_lab_direction', type: 'cookie' }])
      expect(rule.missing, rule.source).toBeUndefined()
      expect(rule.headers, rule.source).toEqual(
        expect.arrayContaining([
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ]),
      )
    }
    const unconditional = headers?.filter(({ has }) => has === undefined) ?? []
    for (const route of readerRoutes) {
      expect(unconditional.map(({ source }) => source)).not.toContain(route)
    }
  })

  it('guards the Reader Lab page with the owner session before reading anything', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'packages/web/src/app/owner/(workspace)/reader-lab/page.tsx'),
      'utf8',
    )
    const guard = source.indexOf('await requireOwnerPageSession()')

    expect(guard).toBeGreaterThan(-1)
    expect(guard).toBeLessThan(source.indexOf('loadHomeView('))
    expect(guard).toBeLessThan(source.indexOf('await cookies()'))
  })

  it('keeps preview credentials slug-bound, purpose-separated, and body-bounded', () => {
    const previewRouteSource = fs.readFileSync(
      path.join(process.cwd(), 'packages/web/src/app/api/preview/route.ts'),
      'utf8',
    )
    const previewSecuritySource = fs.readFileSync(
      path.join(process.cwd(), 'packages/web/src/lib/request-security.ts'),
      'utf8',
    )
    const disableRouteSource = fs.readFileSync(
      path.join(process.cwd(), 'packages/web/src/app/api/preview/disable/route.ts'),
      'utf8',
    )

    expect(previewRouteSource).toContain('previewTokenMatches(token, slug')
    expect(previewRouteSource).toContain('MAGAZINE_PREVIEW_TOKEN_SECRET')
    expect(previewRouteSource).toContain('MAGAZINE_PREVIEW_COOKIE_SECRET')
    expect(previewRouteSource).toContain('readBoundedJson(request, maxPreviewRequestBytes)')
    expect(previewRouteSource).not.toContain('request.formData()')
    expect(previewRouteSource).not.toContain('MAGAZINE_PREVIEW_SECRET')
    expect(previewSecuritySource).toContain("const previewTokenDomain = 'magazine-preview-token'")
    expect(previewSecuritySource).toContain("const previewScopeDomain = 'magazine-preview-scope'")
    expect(disableRouteSource).not.toContain('request.formData()')
    expect(disableRouteSource).toContain('requestOriginMatches(')
    expect(disableRouteSource).toContain("request.headers.get('sec-fetch-site')")
  })

  it('separates deployment-specific canonical metadata from request-time redirects', () => {
    const layoutSource = fs.readFileSync(
      path.join(process.cwd(), 'packages/web/src/app/layout.tsx'),
      'utf8',
    )
    const previewRouteSource = fs.readFileSync(
      path.join(process.cwd(), 'packages/web/src/app/api/preview/route.ts'),
      'utf8',
    )
    const playwrightSource = fs.readFileSync(
      path.join(process.cwd(), 'playwright.config.ts'),
      'utf8',
    )

    expect(layoutSource).toContain('resolveCanonicalSiteUrl()')
    expect(previewRouteSource).toContain('resolveRuntimeSiteUrl()')
    expect(playwrightSource).toContain('NEXT_PUBLIC_SITE_URL: canonicalBuildURL')
    expect(playwrightSource).toContain('MAGAZINE_RUNTIME_SITE_URL: baseURL')
  })

  it('proves preview streaming and real cache regeneration on the built server', () => {
    const previewLoadingPath = path.join(
      process.cwd(),
      'packages/web/src/app/preview/stories/[slug]/loading.tsx',
    )
    const previewPageSource = fs.readFileSync(
      path.join(process.cwd(), 'packages/web/src/app/preview/stories/[slug]/page.tsx'),
      'utf8',
    )
    const browserTestSource = fs.readFileSync(
      path.join(process.cwd(), 'tests/e2e/homepage.spec.ts'),
      'utf8',
    )

    expect(fs.existsSync(previewLoadingPath)).toBe(false)
    expect(previewPageSource).toContain('<Suspense fallback={<PreviewStoryLoading />}>')
    expect(previewPageSource).toContain('await loadPreviewFrameworkStory(slug)')
    expect(previewPageSource.indexOf('if (!preview.isEnabled')).toBeLessThan(
      previewPageSource.indexOf('<Suspense'),
    )
    expect(browserTestSource).toContain('expect(unauthorizedPreview?.status()).toBe(404)')
    expect(browserTestSource).toContain(
      "expect(firstChunkHtml).toContain('data-preview-stream-fallback')",
    )
    expect(browserTestSource).toContain('expect(revalidatedGeneration).not.toBe(firstGeneration)')
  })

  it('expires publish-state cache entries immediately and rejects unbounded cache keys', () => {
    const read = (relativePath: string) =>
      fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
    const revalidationSource = read('packages/web/src/app/api/revalidate/route.ts')
    const cacheSource = read('packages/web/src/reader/cache.ts')

    expect(cacheSource).toContain('revalidateTag(storyCacheTag(slug), { expire: 0 })')
    expect(cacheSource).toContain('revalidateTag(readerCacheTag, { expire: 0 })')
    expect(cacheSource).not.toContain("'max')")
    expect(revalidationSource).toContain('expirePublicReader(slug)')
    expect(revalidationSource).toContain('normalizeReaderSlug(')
    expect(revalidationSource).toContain('readBoundedJson(request, maxRevalidationRequestBytes)')
    expect(revalidationSource).not.toContain('request.json()')
    for (const relativePath of [
      'packages/web/src/app/stories/[slug]/page.tsx',
      'packages/web/src/app/sections/[slug]/page.tsx',
    ]) {
      const pageSource = read(relativePath)
      expect(pageSource, relativePath).toContain('normalizeReaderSlug(')
      expect(pageSource, relativePath).toContain('await connection()')
    }
  })

  it('reads public reader routes from the content store, not the framework fixture', () => {
    const read = (relativePath: string) =>
      fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

    for (const relativePath of [
      'packages/web/src/app/page.tsx',
      'packages/web/src/app/stories/[slug]/page.tsx',
      'packages/web/src/app/sections/[slug]/page.tsx',
      'packages/web/src/app/api/media/[id]/route.ts',
      'packages/web/src/app/api/revalidate/route.ts',
    ]) {
      const source = read(relativePath)
      expect(source, relativePath).not.toContain('framework-content')
      expect(source, relativePath).not.toContain('@/server/database')
    }
    expect(read('packages/web/src/app/page.tsx')).toContain('await connection()')
    expect(read('packages/web/src/app/api/owner/stories/[id]/actions/route.ts')).toContain(
      'expirePublicReader()',
    )
    expect(read('packages/web/src/app/api/internal/publication-jobs/route.ts')).toContain(
      'expirePublicReader()',
    )
  })

  it('keeps public media out of the image optimizer, whose cache outlives an unpublish', () => {
    expect(nextConfig.images?.localPatterns).toEqual([{ pathname: '/images/**', search: '' }])
  })
})
