import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

interface PackageManifest {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

function readManifest(relativePath: string): PackageManifest {
  return JSON.parse(read(relativePath))
}

function collectSourceFiles(directory: string, files: string[] = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['.next', 'dist', 'node_modules'].includes(entry.name)) continue
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) collectSourceFiles(entryPath, files)
    else files.push(entryPath)
  }
  return files
}

describe('app-local design-system contract', () => {
  it('pins the reviewed stable Tailwind and owned-component chain', () => {
    const web = readManifest('packages/web/package.json')

    expect(web.dependencies).toMatchObject({
      '@base-ui/react': '1.6.0',
      'next-themes': '0.4.6',
      'tailwind-merge': '3.6.0',
    })
    expect(web.devDependencies).toMatchObject({
      '@tailwindcss/postcss': '4.3.2',
      '@tailwindcss/typography': '0.5.20',
      tailwindcss: '4.3.2',
      'tw-animate-css': '1.4.0',
    })
  })

  it('uses the Tailwind 4 CSS-first PostCSS boundary', () => {
    const css = read('packages/web/src/app/globals.css')
    const postcss = read('packages/web/postcss.config.mjs')
    const components = JSON.parse(read('packages/web/components.json'))

    expect(fs.existsSync(path.join(process.cwd(), 'packages/web/tailwind.config.js'))).toBe(false)
    expect(postcss).toContain("'@tailwindcss/postcss': {}")
    expect(css).toContain("@import 'tailwindcss'")
    expect(css).toContain("@plugin '@tailwindcss/typography'")
    expect(components.tailwind.config).toBe('')
  })

  it('keeps accessible operating-system preferences as first-class behavior', () => {
    const css = read('packages/web/src/app/globals.css')
    const themeMenu = read('packages/web/src/components/theme-menu.tsx')

    expect(css).toContain('@media (forced-colors: active)')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(themeMenu).toContain("import { Menu } from '@base-ui/react/menu'")
    expect(themeMenu).toContain("value: 'system'")
    expect(themeMenu).not.toMatch(/gentle|high-contrast|animal|trauma/i)
  })

  it('removes obsolete package and demonstration boundaries', () => {
    const workspace = read('pnpm-workspace.yaml')
    const webTree = collectSourceFiles(path.join(process.cwd(), 'packages/web/src/app')).join('\n')

    expect(workspace).toContain("- 'packages/web'")
    expect(workspace).not.toContain('packages/*')
    for (const relativePath of [
      'packages/backend/.babelrc',
      'packages/backend/package.json',
      'packages/shared/src/types/index.ts',
      'packages/ui/package.json',
    ]) {
      expect(fs.existsSync(path.join(process.cwd(), relativePath)), relativePath).toBe(false)
    }
    expect(webTree).not.toMatch(/src\/app\/(?:mockup|test)\//)
  })

  it('contains no live imports from removed workspace packages', () => {
    const webRoot = path.join(process.cwd(), 'packages/web')
    const sourceFiles = collectSourceFiles(webRoot).filter((file) =>
      /\.(?:[cm]?[jt]sx?|css)$/.test(file),
    )

    for (const file of sourceFiles) {
      const source = fs.readFileSync(file, 'utf8')
      expect(source, path.relative(process.cwd(), file)).not.toMatch(
        /@minniewinnie\/(?:backend|shared|ui)/,
      )
    }
  })
})
