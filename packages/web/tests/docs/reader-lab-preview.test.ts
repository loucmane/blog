import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { expect, it } from 'vitest'

const webRoot = fileURLToPath(new URL('../..', import.meta.url))
const variableName = /^(?:MAGAZINE_[A-Z0-9_]+|BETTER_AUTH_[A-Z0-9_]+|DATABASE_URL)$/

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(filename)
    if (!/\.(?:[cm]?[jt]s|[jt]sx)$/.test(entry.name)) return []
    if (/(?:\.test\.|\.spec\.|\.d\.ts$|-integration\.)/.test(entry.name)) return []
    return [filename]
  })
}

it('documents every application and script environment name in the Preview environment table', () => {
  const inventory = new Map<string, Set<string>>()
  const files = ['src', 'scripts'].flatMap((directory) =>
    sourceFiles(path.join(webRoot, directory)),
  )
  for (const filename of files) {
    const source = ts.createSourceFile(
      filename,
      readFileSync(filename, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    )
    // Collect exact identifiers/string keys, regardless of the environment object's alias.
    // This covers dot access, bracket access and destructuring without counting comments.
    // Conservatively include configuration declarations too, so new settings cannot hide.
    const visit = (node: ts.Node) => {
      if ((ts.isIdentifier(node) || ts.isStringLiteralLike(node)) && variableName.test(node.text)) {
        const locations = inventory.get(node.text) ?? new Set<string>()
        locations.add(path.relative(webRoot, filename))
        inventory.set(node.text, locations)
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }

  // Guard against an empty/wrong scan root, including the operator-only script inventory.
  expect([...inventory.keys()]).toEqual(
    expect.arrayContaining(['DATABASE_URL', 'BETTER_AUTH_SECRET', 'MAGAZINE_LAB_SEED_URL']),
  )
  const document = readFileSync(
    path.join(webRoot, '../../docs/deployment/reader-lab-preview.md'),
    'utf8',
  )
  const table = document.match(
    /<!-- reader-lab-environment:start -->([\s\S]*?)<!-- reader-lab-environment:end -->/,
  )?.[1]
  expect(table, 'The runbook must delimit its complete environment table').toBeDefined()
  const rows = [...(table ?? '').matchAll(/^\|\s*`([A-Z][A-Z0-9_]*)`\s*\|(.+)\|\s*$/gm)]
  const documented = new Set(rows.map((row) => row[1]))
  const missing = [...inventory.entries()]
    .filter(([name]) => !documented.has(name))
    .map(([name, locations]) => `${name}: ${[...locations].join(', ')}`)
    .sort()
  expect(missing, 'Environment table is missing source configuration').toEqual([])
  for (const row of rows) {
    const details = row[2]?.split('|').map((cell) => cell.trim()) ?? []
    expect(
      details,
      `${row[1]} needs purpose, source/example, Preview, Production and secrecy`,
    ).toHaveLength(5)
    expect(details.every(Boolean), `${row[1]} has an empty documentation cell`).toBe(true)
  }
})
