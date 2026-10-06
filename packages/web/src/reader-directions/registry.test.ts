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
      else if (/\.(?:ts|tsx)$/.test(entry.name) && !/\.test\.(?:ts|tsx)$/.test(entry.name)) {
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

/**
 * Next preloads every font that a route's module graph declares, whichever direction is active,
 * so direction fonts must opt out of preloading and load only when the active direction uses them.
 * Returns each `next/font` loader call that does not pass `preload: false`.
 */
function fontsThatPreload(source: string, file: string): string[] {
  const sourceFile = parse(source, file)
  const loaders = new Set<string>()
  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !statement.moduleSpecifier.text.startsWith('next/font/')
    ) {
      continue
    }
    const clause = statement.importClause
    if (clause?.name) loaders.add(clause.name.text)
    if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const element of clause.namedBindings.elements) loaders.add(element.name.text)
    }
  }

  const violations: string[] = []
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      loaders.has(node.expression.text)
    ) {
      const [options] = node.arguments
      const preloadsFont = !(
        options &&
        ts.isObjectLiteralExpression(options) &&
        options.properties.some(
          (property) =>
            ts.isPropertyAssignment(property) &&
            ts.isIdentifier(property.name) &&
            property.name.text === 'preload' &&
            property.initializer.kind === ts.SyntaxKind.FalseKeyword,
        )
      )
      if (preloadsFont) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart())
        violations.push(`${file}:${line + 1} ${node.expression.text}()`)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return violations
}

/** Returns each stylesheet import. Next bundles imported CSS into every reader page. */
function stylesheetImports(source: string, file: string): string[] {
  return parse(source, file)
    .statements.filter(
      (statement): statement is ts.ImportDeclaration =>
        ts.isImportDeclaration(statement) &&
        ts.isStringLiteral(statement.moduleSpecifier) &&
        /\.(?:css|scss|sass|less)(?:\?.*)?$/.test(statement.moduleSpecifier.text),
    )
    .map((statement) => `${file}: ${(statement.moduleSpecifier as ts.StringLiteral).text}`)
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

  it('finds direction fonts that would preload on every reader page', () => {
    const preloading = `
      import localFont from 'next/font/local'
      import { Fraunces as Display, Inter } from 'next/font/google'
      const a = localFont({ preload: false, src: './a.woff2', variable: '--a' })
      const b = Display({ subsets: ['latin'], variable: '--b' })
      const c = Inter({ preload: true, subsets: ['latin'], variable: '--c' })
      const d = localFont({ src: './d.woff2' })
    `

    expect(fontsThatPreload(preloading, 'sample.ts')).toEqual([
      'sample.ts:5 Display()',
      'sample.ts:6 Inter()',
      'sample.ts:7 localFont()',
    ])
  })

  it('declares every direction font without preloading, so only the active direction loads it', () => {
    const violations = directionSources().flatMap(({ file, source }) =>
      fontsThatPreload(source, file),
    )

    expect(violations).toEqual([])
  })

  it('keeps direction stylesheets out of the shared reader bundle', () => {
    expect(
      stylesheetImports(`import styles from './a.module.css'\nimport './b.css'`, 'x.ts'),
    ).toEqual(['x.ts: ./a.module.css', 'x.ts: ./b.css'])

    const imports = directionSources().flatMap(({ file, source }) =>
      stylesheetImports(source, file),
    )

    expect(imports).toEqual([])
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
