import fs from 'node:fs'
import path from 'node:path'

import ts from 'typescript'
import { describe, expect, it } from 'vitest'

import { contrastRatio, wcagTextContrast } from './contrast'
import { readerDirections } from './registry'

const directionsRoot = path.join(process.cwd(), 'packages/web/src/reader-directions')

function directionSources(): { readonly file: string; readonly source: string }[] {
  const sources: { file: string; source: string }[] = []
  const visit = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name)
      if (entry.isDirectory()) visit(absolute)
      else if (/\.(?:[cm]?[jt]sx?)$/.test(entry.name) && !/\.test\.(?:ts|tsx)$/.test(entry.name)) {
        sources.push({
          file: path.relative(process.cwd(), absolute),
          source: fs.readFileSync(absolute, 'utf8'),
        })
      }
    }
  }
  visit(directionsRoot)
  return sources
}

function parse(source: string, file: string): ts.SourceFile {
  return ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
}

/** Static, re-exported, dynamic and CommonJS asset imports all enter the route graph. */
function forbiddenAssetImports(source: string, file: string): string[] {
  const violations: string[] = []
  const visit = (node: ts.Node) => {
    if (ts.isStringLiteralLike(node)) {
      const parent = node.parent
      const isModule =
        ((ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) &&
          parent.moduleSpecifier === node) ||
        ts.isExternalModuleReference(parent) ||
        (ts.isCallExpression(parent) &&
          (parent.expression.kind === ts.SyntaxKind.ImportKeyword ||
            (ts.isIdentifier(parent.expression) && parent.expression.text === 'require')))
      if (
        isModule &&
        (/^next\/font(?:\/|$)/.test(node.text) ||
          /\.(?:css|scss|sass|less)(?:\?.*)?$/.test(node.text))
      ) {
        violations.push(`${file}: ${node.text}`)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(parse(source, file))
  return violations
}

function themeTokens(selector: ':root' | '.dark'): Map<string, string> {
  const css = fs.readFileSync(path.join(process.cwd(), 'packages/web/src/app/globals.css'), 'utf8')
  const escaped = selector.replace('.', '\\.')
  const block = new RegExp(`^${escaped} \\{([\\s\\S]*?)^\\}`, 'm').exec(css)?.[1]
  if (!block) throw new Error(`globals.css has no ${selector} block`)
  return new Map(
    [...block.matchAll(/(--[a-z-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name!,
      value!.trim(),
    ]),
  )
}

describe('registered reader directions', () => {
  it('registers baseline as the public default and keeps every id unique', () => {
    const ids = readerDirections.directions.map(({ id }) => id)

    expect(ids).toContain('baseline')
    expect(new Set(ids).size).toBe(ids.length)
    expect(readerDirections.defaultDirection.id).toBe('baseline')
    expect(readerDirections.find('baseline')).toBe(readerDirections.defaultDirection)
    for (const direction of readerDirections.directions) {
      expect(direction.name.trim(), direction.id).not.toBe('')
      expect(direction.thesis.trim(), direction.id).not.toBe('')
    }
  })

  it('rejects next/font even with preload disabled, and every form of stylesheet import', () => {
    const source = `
      import localFont from 'next/font/local'
      import { Jost } from 'next/font/google'
      const font = Jost({ preload: false })
      export { font } from 'next/font/google'
      const lazy = import('next/font/local')
      const common = require('next/font/google')
      import styles from './a.module.css'
      import './b.css'
      const lazyCss = import('./c.css')
      export * from './d.css'
      const commonCss = require('./e.css')
    `
    expect(forbiddenAssetImports(source, 'sample.ts')).toEqual([
      'sample.ts: next/font/local',
      'sample.ts: next/font/google',
      'sample.ts: next/font/google',
      'sample.ts: next/font/local',
      'sample.ts: next/font/google',
      'sample.ts: ./a.module.css',
      'sample.ts: ./b.css',
      'sample.ts: ./c.css',
      'sample.ts: ./d.css',
      'sample.ts: ./e.css',
    ])
  })

  it('keeps direction font CSS and imported stylesheets out of the shared route graph', () => {
    expect(
      directionSources().flatMap(({ file, source }) => forbiddenAssetImports(source, file)),
    ).toEqual([])
    expect(readerDirections.defaultDirection.fonts).toEqual([])
    const globalCss = fs.readFileSync(
      path.join(process.cwd(), 'packages/web/src/app/globals.css'),
      'utf8',
    )
    expect(globalCss).not.toMatch(/@font-face|reader-directions\//)
  })

  it('keeps the theme colors that baseline and the lab bar use at WCAG AA in light and dark', () => {
    const light = themeTokens(':root')
    const dark = new Map([...light, ...themeTokens('.dark')])
    const textPairs = [
      ['--foreground', '--background'],
      ['--muted-foreground', '--background'],
      ['--primary', '--background'],
      ['--foreground', '--card'],
      ['--muted-foreground', '--card'],
      ['--muted-foreground', '--muted'],
      ['--primary-foreground', '--primary'],
      ['--background', '--foreground'],
      ['--muted', '--foreground'],
    ] as const

    for (const [mode, tokens] of [
      ['light', light],
      ['dark', dark],
    ] as const) {
      for (const [text, background] of textPairs) {
        const ratio = contrastRatio(tokens.get(text) ?? '', tokens.get(background) ?? '')
        expect(ratio, `${text} on ${background} in ${mode} mode`).toBeGreaterThanOrEqual(
          wcagTextContrast,
        )
      }
    }
  })
})
