import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import ts from 'typescript'
import { expect, it } from 'vitest'

const sourceRoot = path.resolve('packages/web/src')
const actionPath = path.join(sourceRoot, 'reader/components/resolve-error-presentation.ts')

/** Follow eager runtime imports only. Next replaces the read-only server action with a proxy. */
function staticGraph(entry: string) {
  const visited = new Set<string>()
  const imports = new Set<string>()
  function visit(file: string) {
    if (visited.has(file)) return
    visited.add(file)
    const source = readFileSync(file, 'utf8')
    if (file === actionPath) {
      expect(source).toMatch(/^'use server'/)
      return
    }
    // Type imports do not enter a browser bundle or invoke request APIs during prerendering.
    const runtime = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.Preserve,
        verbatimModuleSyntax: true,
      },
    }).outputText
    const tree = ts.createSourceFile(file, runtime, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    for (const node of tree.statements) {
      if (!(ts.isImportDeclaration(node) || ts.isExportDeclaration(node))) continue
      if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) continue
      const specifier = node.moduleSpecifier.text
      imports.add(specifier)
      const base = specifier.startsWith('@/')
        ? path.join(sourceRoot, specifier.slice(2))
        : specifier.startsWith('.')
          ? path.resolve(path.dirname(file), specifier)
          : null
      if (!base) continue
      const resolved = [
        base,
        `${base}.ts`,
        `${base}.tsx`,
        path.join(base, 'index.ts'),
        path.join(base, 'index.tsx'),
      ].find((candidate) => /\.(ts|tsx)$/.test(candidate) && existsSync(candidate))
      expect(resolved, `resolve ${specifier} from ${file}`).toBeDefined()
      if (resolved) visit(resolved)
    }
  }
  visit(path.join(sourceRoot, entry))
  return {
    files: [...visited].map((file) => path.relative(sourceRoot, file)),
    imports: [...imports],
    source: [...visited]
      .filter((file) => file !== actionPath)
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n'),
  }
}

it('keeps request APIs and session resolution out of root not-found prerendering', () => {
  const graph = staticGraph('app/not-found.tsx')
  expect(
    graph.imports.filter((name) => /^(next\/(headers|server)|server-only)$/.test(name)),
  ).toEqual([])
  expect(graph.files.filter((file) => /^(server\/|reader-lab\/presentation\.)/.test(file))).toEqual(
    [],
  )
})

it.each(['app/error.tsx', 'app/not-found.tsx'])('keeps %s eager fallback graph slim', (entry) => {
  const graph = staticGraph(entry)
  expect(
    graph.files.filter((file) =>
      /reader-directions\/(contract|registry)\.ts|reader-directions\/baseline\/(?!failure\.|failure-frame\.|error\.)|reader-lab\/reader-page|reader-lab\/lab-bar|reader\/components\/story-card|components\/theme-menu/.test(
        file,
      ),
    ),
  ).toEqual([])
})

it('renders the baseline not-found on the server, outside the client upgrader graph', () => {
  const source = readFileSync(path.join(sourceRoot, 'app/not-found.tsx'), 'utf8')
  expect(source).not.toMatch(/^[\s\S]*?['"]use client['"]/)
  expect(staticGraph('app/not-found.tsx').source).toContain('BaselineNotFound')
  const graph = staticGraph('reader/components/failure-boundary.tsx')
  expect(graph.files).toContain('reader/components/resolve-error-presentation.ts')
  expect(
    graph.files.filter((file) =>
      /reader-directions\/|site-header-frame|failure-view\.|lab-failure-page|reader-lab\//.test(
        file,
      ),
    ),
  ).toEqual([])
})

it('ships only the error view in the eager error boundary graph', () => {
  const graph = staticGraph('app/error.tsx')
  expect(graph.source).toContain('BaselineError')
  expect(graph.source).not.toMatch(/BaselineNotFound|BaselineUnavailable/)
  expect(graph.files).not.toContain('reader-directions/baseline/failure.tsx')
})
