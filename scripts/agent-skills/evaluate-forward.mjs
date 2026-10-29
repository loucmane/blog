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
  compareRoutingScores,
  renderRoutingV3Report,
} from './evaluation.mjs'
import { selectSkills as selectBaselineSkills } from '../../docs/agent-skills/baseline-v1/routing.mjs'
import { selectSkills as selectV2Skills } from '../../docs/agent-skills/baseline-v2/routing.mjs'
import { selectSkills as selectV3Skills } from '../../docs/agent-skills/routing-v3-router.mjs'

const root = new URL('../../', import.meta.url)
const read = (name) => fs.readFileSync(new URL(name, root), 'utf8')
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex')

export const baselineV1Paths = Object.freeze({
  'config/agent-skills/catalog.yaml': 'docs/agent-skills/baseline-v1/catalog.yaml',
  'config/agent-skills/review-map.yaml': 'docs/agent-skills/baseline-v1/review-map.yaml',
  'scripts/agent-skills/routing.mjs': 'docs/agent-skills/baseline-v1/routing.mjs',
})
const loadedBaselineDigest = digest(read(baselineV1Paths['scripts/agent-skills/routing.mjs']))
export const baselineV2Paths = Object.freeze({
  ...Object.fromEntries(
    Object.keys(baselineV1Paths).map((name) => [name, baselineV1Paths[name].replace('v1/', 'v2/')]),
  ),
  'scripts/agent-skills/evaluate-forward.mjs': 'docs/agent-skills/baseline-v2/evaluate-forward.mjs',
  'scripts/agent-skills/evaluation.mjs': 'docs/agent-skills/baseline-v2/evaluation.mjs',
  'tests/agent-skills/fixtures/routing.json': 'docs/agent-skills/baseline-v2/routing.json',
})
const loadedV2Digest = digest(read(baselineV2Paths['scripts/agent-skills/routing.mjs']))
export const routingV3Paths = Object.freeze({
  'scripts/agent-skills/routing.mjs': 'docs/agent-skills/routing-v3-router.mjs',
  'config/agent-skills/review-map.yaml': 'docs/agent-skills/routing-v3-map.yaml',
  'config/agent-skills/catalog.yaml': 'docs/agent-skills/routing-v3-catalog.yaml',
})
const loadedV3Digest = digest(read(routingV3Paths['scripts/agent-skills/routing.mjs']))

export function verifyHeldoutFreeze({ root: inputRoot = root } = {}) {
  const read = (name) => fs.readFileSync(new URL(name, inputRoot), 'utf8')
  const freeze = JSON.parse(read('docs/agent-skills/heldout-freeze.json'))
  assert.equal(freeze.schemaVersion, 1)
  assert.equal(freeze.labelsBeforeRouting, true)
  assert.equal(freeze.routersRun, false, 'freeze records state before the first prediction')
  for (const name of [
    'docs/agent-skills/heldout-inputs.json',
    'docs/agent-skills/heldout-labels.json',
    'docs/agent-skills/heldout-diff-evidence.json',
    'docs/agent-skills/baseline-v2/freeze.json',
  ]) {
    assert.match(freeze.sha256?.[name] ?? '', /^[a-f0-9]{64}$/, `missing held-out digest: ${name}`)
  }
  for (const [name, expected] of Object.entries(freeze.sha256))
    assert.equal(digest(read(name)), expected, `held-out input changed: ${name}`)
  verifyV2Snapshot(read)
  return freeze
}

export function evaluateRoutingV3({ root: inputRoot = root } = {}) {
  const read = (name) => fs.readFileSync(new URL(name, inputRoot), 'utf8')
  const json = (name) => JSON.parse(read(name))
  const labelsFreeze = verifyHeldoutFreeze({ root: inputRoot })
  const freeze = json('docs/agent-skills/routing-v3-freeze.json')
  assert.equal(freeze.schemaVersion, 1)
  assert.equal(freeze.heldoutPredictionsRun, false, 'candidate freeze must precede predictions')
  assert.ok(Date.parse(freeze.frozenAt) > Date.parse(labelsFreeze.frozenAt), 'freeze order')
  for (const name of [
    ...Object.values(routingV3Paths),
    'docs/agent-skills/heldout-freeze.json',
    'scripts/agent-skills/evaluate-forward.mjs',
    'scripts/agent-skills/evaluation.mjs',
    'tests/agent-skills/fixtures/routing.json',
  ]) {
    assert.match(freeze.sha256?.[name] ?? '', /^[a-f0-9]{64}$/, `missing v3 digest: ${name}`)
  }
  for (const [name, expected] of Object.entries(freeze.sha256))
    assert.equal(digest(read(name)), expected, `v3 candidate changed: ${name}`)
  assert.equal(
    digest(read(routingV3Paths['scripts/agent-skills/routing.mjs'])),
    loadedV3Digest,
    'v3 router differs from the loaded snapshot module',
  )
  const baseline = evaluateRoutingV2({ root: inputRoot })
  const inputs = json('docs/agent-skills/heldout-inputs.json')
  const original = json('docs/agent-skills/forward-inputs.json')
  assert.equal(inputs.cases.length, 8, 'held-out evaluation requires eight PRs')
  assert.ok(
    inputs.cases.every(({ number }) => !original.cases.some((pr) => pr.number === number)),
    'held-out sample overlaps the original five PRs',
  )
  const config = (paths) => ({
    catalog: json(paths['config/agent-skills/catalog.yaml']),
    reviewMap: json(paths['config/agent-skills/review-map.yaml']),
  })
  const v2Config = config(baselineV2Paths),
    v3Config = config(routingV3Paths)
  const skillIds = v2Config.catalog.skills.map(({ id }) => id).sort()
  assert.deepEqual(
    v3Config.catalog.skills.map(({ id }) => id).sort(),
    skillIds,
    'v3 comparison requires the same skill denominator as v2',
  )
  // Each router receives only paths and PR text, never the expected labels.
  const predict = (sample, select, config) => ({
    schemaVersion: 1,
    cases: sample.cases.map((pr) => ({
      number: pr.number,
      merge: pr.merge,
      routing: select({ paths: pr.files, taskText: `${pr.title}\n${pr.body}` }, config),
    })),
  })
  const v2Predictions = predict(inputs, selectV2Skills, v2Config)
  const v3Predictions = predict(inputs, selectV3Skills, v3Config)
  const originalPredictions = predict(original, selectV3Skills, v3Config)
  const labels = json('docs/agent-skills/heldout-labels.json')
  assert.ok(
    labels.cases.filter(({ expected }) => expected.length <= 1).length >= 2,
    'held-out sample requires at least two zero- or single-skill cases',
  )
  const score = (inputs, labels, predictions) => {
    const result = scoreRoutingEvaluation({ inputs, labels, predictions, skillIds })
    result.cases = result.cases.map((row) => ({
      ...row,
      matches: predictions.cases.find(({ number }) => number === row.number).routing.matches,
    }))
    return result
  }
  const v2 = score(inputs, labels, v2Predictions),
    v3 = score(inputs, labels, v3Predictions)
  return {
    schemaVersion: 1,
    evaluation: 'routing-v3',
    mode: 'advisory',
    blocking: false,
    heldout: { v2, v3, ...compareRoutingScores(v2, v3) },
    originalFive: {
      v2: baseline.metrics,
      v3: score(original, json('docs/agent-skills/forward-labels.json'), originalPredictions),
    },
    provenance: {
      method:
        'Purposive held-out sample labelled by the same worker before either router ran. Separate from the original five PRs; not an independent blind review or a random sample.',
      labelsChanged: false,
      independentReviewer: false,
      labelsVisibleDuringRevision: true,
      adviceAssessment: 'not performed; routing-only comparison',
      labelsFrozenAt: labelsFreeze.frozenAt,
      candidateFrozenAt: freeze.frozenAt,
      sha256: {
        ...labelsFreeze.sha256,
        ...freeze.sha256,
        'docs/agent-skills/routing-v3-freeze.json': digest(
          read('docs/agent-skills/routing-v3-freeze.json'),
        ),
      },
    },
  }
}

export function verifyV3Disposition(result, { root: inputRoot = root } = {}) {
  for (const name of ['scripts/agent-skills/routing.mjs', 'config/agent-skills/review-map.yaml']) {
    const expected = (result.heldout.acceptance.accepted ? routingV3Paths : baselineV2Paths)[name]
    assert.equal(
      fs.readFileSync(new URL(name, inputRoot), 'utf8'),
      fs.readFileSync(new URL(expected, inputRoot), 'utf8'),
      `live routes differ from v3 disposition: ${name}`,
    )
  }
}

function verifyV2Snapshot(read) {
  const freeze = JSON.parse(read('docs/agent-skills/baseline-v2/freeze.json'))
  for (const [name, snapshot] of Object.entries(baselineV2Paths)) {
    assert.equal(freeze.files?.[name]?.snapshot, snapshot, `missing v2 snapshot: ${name}`)
    assert.equal(digest(read(snapshot)), freeze.files[name].sha256, `v2 snapshot changed: ${name}`)
  }
  assert.equal(
    digest(read(baselineV2Paths['scripts/agent-skills/routing.mjs'])),
    loadedV2Digest,
    'v2 router differs from the loaded snapshot module',
  )
  for (const name of ['routing-v2-results.json', 'routing-v2-report.md']) {
    const path = `docs/agent-skills/${name}`
    assert.equal(
      digest(read(path)),
      freeze.artifacts?.[path],
      `historical artifact changed: ${path}`,
    )
  }
}

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
  verifyV2Snapshot(read)
  const baseline = evaluateForward({ root: inputRoot })
  assert.deepEqual(json('docs/agent-skills/forward-results.json'), baseline, 'stale v1 results')
  assert.equal(
    read('docs/agent-skills/forward-report.md'),
    renderReport(baseline),
    'stale v1 report',
  )
  const inputs = json('docs/agent-skills/forward-inputs.json')
  const config = {
    catalog: json(baselineV2Paths['config/agent-skills/catalog.yaml']),
    reviewMap: json(baselineV2Paths['config/agent-skills/review-map.yaml']),
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
      routing: selectV2Skills({ paths: pr.files, taskText: `${pr.title}\n${pr.body}` }, config),
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
      ].map((name) => [name, digest(read(baselineV2Paths[name] ?? name))]),
    ),
  }
  return result
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2)
    assert.ok(
      new Set(args).size === args.length &&
        args.every((arg) => ['--check', '--routing-v2', '--routing-v3'].includes(arg)) &&
        !(args.includes('--routing-v2') && args.includes('--routing-v3')),
      'usage: evaluate-forward.mjs [--routing-v2 | --routing-v3] [--check]',
    )
    const v2 = args.includes('--routing-v2')
    const v3 = args.includes('--routing-v3')
    const result = v3 ? evaluateRoutingV3() : v2 ? evaluateRoutingV2() : evaluateForward()
    if (v3 && args.includes('--check')) verifyV3Disposition(result)
    const outputs = v3
      ? {
          'docs/agent-skills/routing-v3-results.json': `${JSON.stringify(result, null, 2)}\n`,
          'docs/agent-skills/routing-v3-report.md': renderRoutingV3Report(result),
        }
      : v2
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
    console.log(
      JSON.stringify(
        v3
          ? {
              v2: result.heldout.v2.metrics,
              v3: result.heldout.v3.metrics,
              acceptance: result.heldout.acceptance,
            }
          : result.metrics,
        null,
        2,
      ),
    )
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
