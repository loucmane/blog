#!/usr/bin/env node
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { scoreEvaluation, renderReport } from './evaluation.mjs'
import { selectSkills } from './routing.mjs'

const root = new URL('../../', import.meta.url)
const read = (name) => fs.readFileSync(new URL(name, root), 'utf8')
const json = (name) => JSON.parse(read(name))
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex')

export function evaluateForward() {
  const freeze = json('docs/agent-skills/forward-freeze.json')
  for (const [name, expected] of Object.entries(freeze.sha256)) {
    assert.equal(digest(read(name)), expected, `frozen input changed: ${name}`)
  }
  const inputs = json('docs/agent-skills/forward-inputs.json')
  assert.equal(inputs.cases.length, 5, 'this evaluation requires five real PRs')
  const config = {
    catalog: json('config/agent-skills/catalog.yaml'),
    reviewMap: json('config/agent-skills/review-map.yaml'),
  }
  // Prediction receives only PR paths and text. Labels are loaded afterwards.
  const predictions = inputs.cases.map((pr) => ({
    number: pr.number,
    routing: selectSkills({ paths: pr.files, taskText: `${pr.title}\n${pr.body}` }, config),
  }))
  const blind = json('docs/agent-skills/forward-blind-review.json')
  for (const prediction of predictions) {
    const review = blind.cases.find(({ number }) => number === prediction.number)
    assert.deepEqual(
      review?.routing,
      prediction.routing,
      `PR ${prediction.number}: blind routing differs from replay`,
    )
  }
  const labels = json('docs/agent-skills/forward-labels.json')
  const result = scoreEvaluation({
    inputs,
    labels,
    blind,
    skillIds: config.catalog.skills.map(({ id }) => id),
  })
  result.provenance = {
    baseline: labels.baseline,
    frozenAt: freeze.frozenAt,
    sha256: {
      ...freeze.sha256,
      'docs/agent-skills/forward-blind-review.json': digest(
        read('docs/agent-skills/forward-blind-review.json'),
      ),
    },
    reviewMethod: blind.method,
    labelsVisibleToReviewer: blind.labelsVisible,
  }
  return result
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2)
    assert.ok(
      args.length === 0 || (args.length === 1 && args[0] === '--check'),
      'usage: evaluate-forward.mjs [--check]',
    )
    const result = evaluateForward()
    const outputs = {
      'docs/agent-skills/forward-results.json': `${JSON.stringify(result, null, 2)}\n`,
      'docs/agent-skills/forward-report.md': renderReport(result),
    }
    for (const [name, content] of Object.entries(outputs)) {
      if (args.includes('--check'))
        assert.equal(read(name), content, `stale evaluation artifact: ${name}`)
      else fs.writeFileSync(fileURLToPath(new URL(name, root)), content)
    }
    console.log(JSON.stringify(result.metrics, null, 2))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
