import fs from 'node:fs'
import path from 'node:path'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

import type { AuthorView, StoryCard, TopicView } from '@/reader/views'
import { readerFailureView } from '@/reader/components/failure-view'

import { contrastRatio, wcagTextContrast } from './contrast'
import { ReaderDirectionRoot } from './direction-root'
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

const interiors = { href: '/sections/interiors', name: 'Interiors', slug: 'interiors' } as const
const navigation = { sections: [interiors] }
const card: StoryCard = {
  dek: 'How a north-facing room learns to hold the low sun of December.',
  href: '/stories/quiet-architecture-of-winter-light',
  image: null,
  publishedAt: '2026-10-02T07:00:00.000Z',
  readingMinutes: 4,
  section: interiors,
  slug: 'quiet-architecture-of-winter-light',
  title: 'The quiet architecture of winter light',
}
const authorView: AuthorView = {
  bio: 'Alpha Writer writes about rooms.',
  href: '/authors/alpha',
  name: 'Alpha Writer',
  navigation,
  slug: 'alpha',
  stories: [card],
}
const topicView: TopicView = {
  description: null,
  href: '/topics/light',
  name: 'Light',
  navigation,
  slug: 'light',
  stories: [card],
}

/** The text of every `h1` in the markup, without its inner tags. */
function topLevelHeadings(markup: string): string[] {
  return [...markup.matchAll(/<h1[\s>][\s\S]*?<\/h1>/g)].map(([heading]) =>
    heading.replace(/<[^>]+>/g, '').trim(),
  )
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
  it.each(readerDirections.directions)(
    '$id renders all failure views with one h1 and only its own assets',
    (direction) => {
      for (const kind of ['NotFound', 'Error', 'Unavailable'] as const) {
        const markup = renderToStaticMarkup(
          createElement(ReaderDirectionRoot, {
            direction,
            children: createElement(direction[kind], { view: readerFailureView, reset: () => {} }),
          }),
        )
        expect(topLevelHeadings(markup)).toHaveLength(1)
        expect(markup).toContain(`data-reader-direction="${direction.id}"`)
        expect(markup).toContain('<main')
        expect(markup).toContain('href="/"')
        for (const other of readerDirections.directions.filter(
          (item) => item.id !== direction.id,
        )) {
          expect(markup).not.toContain(`/reader-directions/${other.id}/fonts/`)
        }
        if (direction.fonts.length)
          expect(markup).toContain(`data-reader-direction-fonts="${direction.id}"`)
      }
    },
  )

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

  it.each(readerDirections.directions)(
    '$id renders author and topic pages, its own or baseline’s, with one h1 naming the page',
    (direction) => {
      const author = renderToStaticMarkup(createElement(direction.Author, { view: authorView }))
      const topic = renderToStaticMarkup(createElement(direction.Topic, { view: topicView }))

      expect(topLevelHeadings(author)).toEqual(['Alpha Writer'])
      expect(author).toContain('href="/stories/quiet-architecture-of-winter-light"')
      expect(topLevelHeadings(topic)).toEqual(['Light'])
      expect(topic).toContain('href="/stories/quiet-architecture-of-winter-light"')
    },
  )

  it.each(readerDirections.directions.filter(({ id }) => id !== 'baseline'))(
    '$id explicitly assigns its own font to every heading level',
    (direction) => {
      // Inheriting the page font is insufficient: globals.css sets a serif on h1–h3.
      const headingRule = direction.styles?.match(
        /:is\(h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6\)\s*\{([^}]+)\}/,
      )?.[1]
      const family = headingRule?.match(/font-family:\s*var\((--[a-z-]+)\)/)?.[1]
      expect(family, `${direction.id} needs an explicit heading font-family`).toBeDefined()
      const stack = direction.tokens?.light[family as `--${string}`] ?? `var(${family})`
      const font = stack.match(/^var\((--[a-z-]+)\)/)?.[1]
      expect(direction.fonts.map(({ variable }) => variable)).toContain(font)
    },
  )

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
