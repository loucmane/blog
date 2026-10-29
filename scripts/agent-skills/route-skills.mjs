#!/usr/bin/env node
import fs from 'node:fs'
import { selectSkills } from './routing.mjs'

// Accept data only: { paths: repository-relative paths, taskText: string }.
// Resolve config against this checkout, independent of the caller's directory.
try {
  const [file, ...extra] = process.argv.slice(2)
  if (!file || extra.length) throw new Error('usage: route-skills.mjs <input.json>')
  const read = (url) => JSON.parse(fs.readFileSync(url, 'utf8'))
  const result = selectSkills(read(file), {
    catalog: read(new URL('../../config/agent-skills/catalog.yaml', import.meta.url)),
    reviewMap: read(new URL('../../config/agent-skills/review-map.yaml', import.meta.url)),
  })
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
