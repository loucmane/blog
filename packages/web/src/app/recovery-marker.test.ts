import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { expect, it } from 'vitest'

// Every page under the root error boundary (app/error.tsx) must confirm a recovered retry by
// rendering ReaderRecoveryMarker in its resolved content, directly or through ReaderPage;
// otherwise retry focus intent survives a successful recovery (blog-quly). Owner routes have
// their own error boundary (owner/error.tsx) and are excluded.
function pages(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) return entry.name === 'owner' ? [] : pages(full)
    return entry.name === 'page.tsx' ? [full] : []
  })
}

it('confirms recovery from every page under the root error boundary', () => {
  const appDirectory = path.dirname(new URL(import.meta.url).pathname)
  const found = pages(appDirectory)
  expect(found.length).toBeGreaterThan(5)
  for (const page of found) {
    const source = readFileSync(page, 'utf8')
    expect(
      /<ReaderPage\b|<ReaderRecoveryMarker\b/.test(source),
      `${path.relative(appDirectory, page)} must render ReaderPage or ReaderRecoveryMarker`,
    ).toBe(true)
  }
})
