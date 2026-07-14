import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import nextConfig from '../../next.config'

interface PackageManifest {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

function readManifest(relativePath: string): PackageManifest {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8'))
}

describe('Next and React migration contract', () => {
  it('pins one exact supported framework and React pair', () => {
    const root = readManifest('package.json')
    const web = readManifest('packages/web/package.json')
    const ui = readManifest('packages/ui/package.json')

    expect(root.devDependencies?.['@next/eslint-plugin-next']).toBe('16.2.10')
    expect(root.devDependencies).toMatchObject({
      react: '19.2.7',
      'react-dom': '19.2.7',
    })
    expect(web.dependencies).toMatchObject({
      '@types/react': '19.2.17',
      '@types/react-dom': '19.2.3',
      next: '16.2.10',
      react: '19.2.7',
      'react-dom': '19.2.7',
    })
    expect(ui.devDependencies).toMatchObject({
      '@types/react': '19.2.17',
      '@types/react-dom': '19.2.3',
      react: '19.2.7',
      'react-dom': '19.2.7',
    })
  })

  it('uses the Next 16 Turbopack default without the obsolete Webpack bridge', () => {
    expect(nextConfig.typedRoutes).toBe(true)
    expect(nextConfig.transpilePackages).toEqual(['@minniewinnie/ui'])
    expect(nextConfig.webpack).toBeUndefined()
    expect(nextConfig.output).toBeUndefined()

    const web = readManifest('packages/web/package.json')
    expect(web.devDependencies?.['@svgr/webpack']).toBeUndefined()
  })

  it('marks shared React hook entry points as client-only boundaries', () => {
    const mediaQueryHook = fs.readFileSync(
      path.join(process.cwd(), 'packages/ui/src/hooks/useMediaQuery.ts'),
      'utf8',
    )
    expect(mediaQueryHook.startsWith("'use client'\n")).toBe(true)
  })

  it('keeps Next-generated type declarations outside formatting rewrites', () => {
    const prettierIgnore = fs.readFileSync(path.join(process.cwd(), '.prettierignore'), 'utf8')
    expect(prettierIgnore.split('\n')).toContain('packages/web/next-env.d.ts')
  })

  it('keeps the reader dependency graph free from editor runtimes', () => {
    const web = readManifest('packages/web/package.json')
    const dependencies = Object.keys(web.dependencies ?? {})

    expect(dependencies).not.toEqual(
      expect.arrayContaining([
        '@tiptap/core',
        '@tiptap/react',
        'lexical',
        'prosemirror-model',
        'prosemirror-state',
      ]),
    )
  })

  it('pins Next internal PostCSS to the workspace patched release', () => {
    const workspace = fs.readFileSync(path.join(process.cwd(), 'pnpm-workspace.yaml'), 'utf8')
    expect(workspace).toContain("'next@16.2.10>postcss': 8.5.16")
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
})
