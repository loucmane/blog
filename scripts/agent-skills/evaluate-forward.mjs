#!/usr/bin/env node
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  scoreEvaluation,
  scoreRoutingEvaluation,
  renderReport,
  renderRoutingRevisionReport,
} from './evaluation.mjs'
import { selectSkills } from './routing.mjs'
import { selectSkills as selectBaselineSkills } from '../../docs/agent-skills/baseline-v1/routing.mjs'

const root = new URL('../../', import.meta.url)
const read = (name) => fs.readFileSync(new URL(name, root), 'utf8')
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex')

export const baselineV1Paths = Object.freeze({
  'config/agent-skills/catalog.yaml': 'docs/agent-skills/baseline-v1/catalog.yaml',
  'config/agent-skills/review-map.yaml': 'docs/agent-skills/baseline-v1/review-map.yaml',
  'scripts/agent-skills/routing.mjs': 'docs/agent-skills/baseline-v1/routing.mjs',
})
const loadedBaselineDigest = digest(read(baselineV1Paths['scripts/agent-skills/routing.mjs']))
const loadedLiveDigest = digest(read('scripts/agent-skills/routing.mjs'))

export function evaluateForward({ root: inputRoot = root } = {}) {
  // An explicit root lets completion fixtures replay the same evaluator.
  const read = (name) => fs.readFileSync(new URL(name, inputRoot), 'utf8')
  const json = (name) => JSON.parse(read(name))
  const freeze = json('docs/agent-skills/forward-freeze.json')
  for (const name of [
    'docs/agent-skills/forward-inputs.json',
    'docs/agent-skills/forward-labels.json',
    ...Object.keys(baselineV1Paths),
  ]) {
    assert.match(freeze.sha256?.[name] ?? '', /^[a-f0-9]{64}$/, `missing frozen digest: ${name}`)
  }
  for (const [name, expected] of Object.entries(freeze.sha256)) {
    const source = baselineV1Paths[name] ?? name
    assert.equal(digest(read(source)), expected, `frozen input changed: ${source}`)
  }
  // Alternate roots must prove they contain the code actually loaded above.
  assert.equal(
    freeze.sha256['scripts/agent-skills/routing.mjs'],
    loadedBaselineDigest,
    'frozen router differs from the loaded baseline module',
  )
  const inputs = json('docs/agent-skills/forward-inputs.json')
  assert.equal(inputs.cases.length, 5, 'this evaluation requires five real PRs')
  const config = {
    catalog: json(baselineV1Paths['config/agent-skills/catalog.yaml']),
    reviewMap: json(baselineV1Paths['config/agent-skills/review-map.yaml']),
  }
  // Prediction receives only PR paths and text. Labels are loaded afterwards.
  const predictions = inputs.cases.map((pr) => ({
    number: pr.number,
    routing: selectBaselineSkills({ paths: pr.files, taskText: `${pr.title}\n${pr.body}` }, config),
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

export function evaluateRoutingV2({ root: inputRoot = root } = {}) {
  const read = (name) => fs.readFileSync(new URL(name, inputRoot), 'utf8')
  const json = (name) => JSON.parse(read(name))
  const baseline = evaluateForward({ root: inputRoot })
  assert.deepEqual(json('docs/agent-skills/forward-results.json'), baseline, 'stale v1 results')
  assert.equal(
    read('docs/agent-skills/forward-report.md'),
    renderReport(baseline),
    'stale v1 report',
  )
  assert.equal(
    digest(read('scripts/agent-skills/routing.mjs')),
    loadedLiveDigest,
    'live router differs from the loaded module',
  )
  const inputs = json('docs/agent-skills/forward-inputs.json')
  const config = {
    catalog: json('config/agent-skills/catalog.yaml'),
    reviewMap: json('config/agent-skills/review-map.yaml'),
  }
  const skillIds = config.catalog.skills.map(({ id }) => id)
  assert.deepEqual(
    [...skillIds].sort(),
    baseline.perSkill.map(({ skill }) => skill).sort(),
    'v2 comparison requires the same skill denominator as v1',
  )
  const predictions = {
    schemaVersion: 1,
    cases: inputs.cases.map((pr) => ({
      number: pr.number,
      merge: pr.merge,
      routing: selectSkills({ paths: pr.files, taskText: `${pr.title}\n${pr.body}` }, config),
    })),
  }
  const result = scoreRoutingEvaluation({
    inputs,
    labels: json('docs/agent-skills/forward-labels.json'),
    predictions,
    skillIds,
  })
  result.evaluation = 'routing-v2'
  result.comparison = {
    baseline: Object.fromEntries(
      Object.keys(result.metrics).map((key) => [key, baseline.metrics[key]]),
    ),
    delta: Object.fromEntries(
      Object.entries(result.metrics).map(([key, value]) => [
        key,
        value === null || baseline.metrics[key] === null ? null : value - baseline.metrics[key],
      ]),
    ),
    denominators: {
      prs: inputs.cases.length,
      skills: skillIds.length,
      decisions: result.metrics.decisions,
      expectedPositives: result.metrics.truePositives + result.metrics.falseNegatives,
      expectedNegatives: result.metrics.falsePositives + result.metrics.trueNegatives,
      selectedV1: baseline.metrics.truePositives + baseline.metrics.falsePositives,
      selectedV2: result.metrics.truePositives + result.metrics.falsePositives,
    },
  }
  result.cases = result.cases.map((row) => {
    const before = baseline.cases.find(({ number }) => number === row.number)
    return {
      ...row,
      added: row.selected.filter((skill) => !before.selected.includes(skill)),
      removed: before.selected.filter((skill) => !row.selected.includes(skill)),
      matches: predictions.cases.find(({ number }) => number === row.number).routing.matches,
    }
  })
  result.provenance = {
    method:
      'Same five PRs informed this revision; this is not an independent sample or a generalization estimate.',
    labelsChanged: false,
    labelsVisibleDuringRevision: true,
    independentSample: false,
    adviceAssessment: 'not performed; v1 blind advice remains unchanged and is not rescored for v2',
    baselinePaths: baselineV1Paths,
    sha256: Object.fromEntries(
      [
        ...Object.keys(baselineV1Paths),
        ...Object.values(baselineV1Paths),
        'scripts/agent-skills/evaluate-forward.mjs',
        'scripts/agent-skills/evaluation.mjs',
        'tests/agent-skills/fixtures/routing.json',
        ...[
          'inputs.json',
          'labels.json',
          'freeze.json',
          'blind-review.json',
          'results.json',
          'report.md',
        ].map((name) => `docs/agent-skills/forward-${name}`),
      ].map((name) => [name, digest(read(name))]),
    ),
  }
  return result
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2)
    assert.ok(
      new Set(args).size === args.length &&
        args.every((arg) => ['--check', '--routing-v2'].includes(arg)),
      'usage: evaluate-forward.mjs [--routing-v2] [--check]',
    )
    const v2 = args.includes('--routing-v2')
    const result = v2 ? evaluateRoutingV2() : evaluateForward()
    const outputs = v2
      ? {
          'docs/agent-skills/routing-v2-results.json': `${JSON.stringify(result, null, 2)}\n`,
          'docs/agent-skills/routing-v2-report.md': renderRoutingRevisionReport(result),
        }
      : {
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
