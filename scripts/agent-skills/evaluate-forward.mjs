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
  renderRoutingV4Report,
  scoreCoverageSamples,
  renderCoverageReport,
} from './evaluation.mjs'
import { selectSkills as selectLiveSkills } from './routing.mjs'
import { selectSkills as selectBaselineSkills } from '../../docs/agent-skills/baseline-v1/routing.mjs'
import { selectSkills as selectV2Skills } from '../../docs/agent-skills/baseline-v2/routing.mjs'
import { selectSkills as selectV3Skills } from '../../docs/agent-skills/routing-v3-router.mjs'
import { selectSkills as selectV4Skills } from '../../docs/agent-skills/routing-v4-router.mjs'

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
export const routingV4Paths = Object.freeze(
  Object.fromEntries(
    Object.entries(routingV3Paths).map(([live, snapshot]) => [
      live,
      snapshot.replace('v3-', 'v4-'),
    ]),
  ),
)
const loadedV4Digest = digest(read(routingV4Paths['scripts/agent-skills/routing.mjs']))
const loadedLiveDigest = digest(read('scripts/agent-skills/routing.mjs'))
const coverageSampleNames = ['forward', 'heldout', 'heldout2', 'heldout3']
const coveragePinnedPaths = [
  ...coverageSampleNames.flatMap((name) =>
    ['inputs', 'labels'].map((kind) => `docs/agent-skills/${name}-${kind}.json`),
  ),
  ...[
    'heldout3-selection.json',
    'heldout3-diff-evidence.json',
    'routing-v4-freeze.json',
    'advice-v2-review.json',
    'forward-blind-review.json',
  ].map((name) => `docs/agent-skills/${name}`),
  ...Object.values(routingV4Paths),
]

export function verifyHeldout3Freeze({ root: inputRoot = root } = {}) {
  const read = (name) => fs.readFileSync(new URL(name, inputRoot), 'utf8')
  const json = (name) => JSON.parse(read(name))
  const freeze = json('docs/agent-skills/heldout3-freeze.json')
  assert.equal(freeze.schemaVersion, 1)
  assert.equal(freeze.labelsBeforeRouting, true)
  assert.equal(freeze.routersRun, false, 'heldout3 freeze must precede prediction')
  assert.ok(Number.isFinite(Date.parse(freeze.frozenAt)), 'invalid heldout3 freeze time')
  assert.ok(
    Date.parse(freeze.frozenAt) >
      Date.parse(json('docs/agent-skills/routing-v4-freeze.json').frozenAt),
    'heldout3 must follow the v4 freeze',
  )
  for (const name of coveragePinnedPaths) {
    assert.match(freeze.sha256?.[name] ?? '', /^[a-f0-9]{64}$/, `missing coverage digest: ${name}`)
    assert.equal(digest(read(name)), freeze.sha256[name], `coverage input changed: ${name}`)
  }
  for (const [live, snapshot] of Object.entries(routingV4Paths))
    assert.equal(
      freeze.liveAtFreezeSha256?.[live],
      digest(read(snapshot)),
      `live at freeze differs from v4: ${live}`,
    )
  assert.equal(
    digest(read(routingV4Paths['scripts/agent-skills/routing.mjs'])),
    loadedV4Digest,
    'coverage router differs from loaded v4 snapshot',
  )
  const catalog = json(routingV4Paths['config/agent-skills/catalog.yaml'])
  for (const { entrypoint } of catalog.skills)
    assert.match(
      freeze.labelContractSha256?.[entrypoint] ?? '',
      /^[a-f0-9]{64}$/,
      `missing label contract provenance: ${entrypoint}`,
    )
  const samples = coverageSampleNames.map((name) => json(`docs/agent-skills/${name}-inputs.json`))
  assert.deepEqual(
    samples.map(({ cases }) => cases.length),
    [5, 8, 8, 8],
    'coverage sample sizes',
  )
  const all = samples.flatMap(({ cases }) => cases)
  assert.equal(new Set(all.map(({ number }) => number)).size, 29, 'coverage PR overlap')
  assert.equal(new Set(all.map(({ merge }) => merge)).size, 29, 'coverage merge overlap')
  const selection = json('docs/agent-skills/heldout3-selection.json')
  assert.equal(selection.candidateCount, 39)
  assert.equal(selection.candidates.length, selection.candidateCount)
  assert.equal(
    new Set(selection.candidates.map(({ number }) => number)).size,
    39,
    'duplicate coverage candidate',
  )
  assert.equal(
    new Set(selection.candidates.map(({ merge }) => merge)).size,
    39,
    'duplicate coverage candidate merge',
  )
  const prior = samples.slice(0, 3).flatMap(({ cases }) => cases)
  assert.ok(
    selection.candidates.every(
      (row) => !prior.some((old) => old.number === row.number || old.merge === row.merge),
    ),
    'candidate pool overlaps prior sample',
  )
  const current = samples[3].cases
  assert.deepEqual(
    selection.selected,
    current.map(({ number }) => number),
    'selection differs',
  )
  const evidence = json('docs/agent-skills/heldout3-diff-evidence.json')
  assert.deepEqual(
    evidence.cases.map(({ number }) => number),
    selection.selected,
    'diff evidence case inventory differs',
  )
  for (const row of current) {
    assert.ok(
      selection.candidates.some(
        ({ number, merge }) => number === row.number && merge === row.merge,
      ),
      `PR ${row.number} is not a supplied candidate`,
    )
    const diff = evidence.cases.find(({ number }) => number === row.number)
    assert.equal(diff.merge, row.merge, `PR ${row.number}: diff merge mismatch`)
    assert.deepEqual(diff.changedPaths, row.files, `PR ${row.number}: diff paths mismatch`)
  }
  return freeze
}

export function evaluateCoverage({ root: inputRoot = root, live = false } = {}) {
  const read = (name) => fs.readFileSync(new URL(name, inputRoot), 'utf8')
  const json = (name) => JSON.parse(read(name))
  const freeze = verifyHeldout3Freeze({ root: inputRoot })
  const config = {
    catalog: json(routingV4Paths['config/agent-skills/catalog.yaml']),
    reviewMap: json(routingV4Paths['config/agent-skills/review-map.yaml']),
  }
  if (live) {
    for (const [name, snapshot] of Object.entries(routingV4Paths))
      assert.equal(read(name), read(snapshot), `live coverage router/config changed: ${name}`)
    assert.equal(
      digest(read('scripts/agent-skills/routing.mjs')),
      loadedLiveDigest,
      'live coverage router differs from loaded module',
    )
  }
  const skillIds = config.catalog.skills.map(({ id }) => id).sort()
  // Prediction takes only PR paths and title/body. Labels never reach either router.
  // First publication uses live v4 once per heldout3 PR; --check uses the frozen module.
  const samples = Object.fromEntries(
    coverageSampleNames.map((name) => {
      const inputs = json(`docs/agent-skills/${name}-inputs.json`)
      const select = live && name === 'heldout3' ? selectLiveSkills : selectV4Skills
      const predictions = {
        schemaVersion: 1,
        cases: inputs.cases.map((pr) => ({
          number: pr.number,
          merge: pr.merge,
          routing: select({ paths: pr.files, taskText: `${pr.title}\n${pr.body}` }, config),
        })),
      }
      return [name, { inputs, labels: json(`docs/agent-skills/${name}-labels.json`), predictions }]
    }),
  )
  const scored = scoreCoverageSamples(samples, skillIds)
  return {
    schemaVersion: 1,
    evaluation: 'coverage',
    router: 'frozen-v4',
    mode: 'advisory',
    blocking: false,
    denominators: { prs: 29, skills: skillIds.length, decisions: 29 * skillIds.length },
    ...scored,
    gaps: {
      noPositiveBeforeHeldout3: skillIds.filter((skill) =>
        coverageSampleNames
          .slice(0, 3)
          .every(
            (name) =>
              scored.samples[name].perSkill.find((row) => row.skill === skill).expected === 0,
          ),
      ),
      noPositiveAcrossAllSamples: scored.perSkill
        .filter(({ expected }) => expected === 0)
        .map(({ skill }) => skill),
    },
    priorAdviceEnvelopes: json('docs/agent-skills/advice-v2-review.json').assessments.map(
      ({ number, skill, result }, index) => ({
        number,
        skill,
        source: `docs/agent-skills/advice-v2-review.json#assessments/${index}/result`,
        reviewId: result.reviewId,
        generatedAt: result.generatedAt,
        headSha: result.headSha,
      }),
    ),
    provenance: {
      labelsFrozenAt: freeze.frozenAt,
      labelMethod: freeze.labelMethod,
      independentReviewer: freeze.independentReviewer,
      labelsChanged: false,
      routesChanged: false,
      adviceAssessment: 'not performed; prior advice preserved, not rescored',
      providerComparison: 'not performed',
      remainingGapReasons: json('docs/agent-skills/heldout3-selection.json').remainingGaps,
      sha256: {
        ...freeze.sha256,
        'docs/agent-skills/heldout3-freeze.json': digest(
          read('docs/agent-skills/heldout3-freeze.json'),
        ),
      },
    },
  }
}

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

function verifyV3Snapshot(read, labelsFreeze) {
  const freeze = JSON.parse(read('docs/agent-skills/routing-v3-freeze.json'))
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
  // The live evaluator and fixtures were recorded as provenance at freeze time.
  // Only frozen inputs govern historical replay; live code may now evolve.
  for (const name of [...Object.values(routingV3Paths), 'docs/agent-skills/heldout-freeze.json'])
    assert.equal(digest(read(name)), freeze.sha256[name], `v3 candidate changed: ${name}`)
  assert.equal(
    digest(read(routingV3Paths['scripts/agent-skills/routing.mjs'])),
    loadedV3Digest,
    'v3 router differs from the loaded snapshot module',
  )
  return freeze
}

export function evaluateRoutingV3({ root: inputRoot = root } = {}) {
  const read = (name) => fs.readFileSync(new URL(name, inputRoot), 'utf8')
  const json = (name) => JSON.parse(read(name))
  const labelsFreeze = verifyHeldoutFreeze({ root: inputRoot })
  const freeze = verifyV3Snapshot(read, labelsFreeze)
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

export function verifyHeldout2Freeze({ root: inputRoot = root } = {}) {
  const read = (name) => fs.readFileSync(new URL(name, inputRoot), 'utf8')
  const json = (name) => JSON.parse(read(name))
  const freeze = json('docs/agent-skills/heldout2-freeze.json')
  assert.equal(freeze.schemaVersion, 1)
  assert.equal(freeze.labelsBeforeRouting, true)
  assert.equal(freeze.routersRun, false, 'freeze must precede the first prediction')
  assert.ok(Number.isFinite(Date.parse(freeze.frozenAt)), 'invalid label freeze time')
  for (const name of [
    'docs/agent-skills/heldout2-inputs.json',
    'docs/agent-skills/heldout2-labels.json',
    'docs/agent-skills/routing-v3-freeze.json',
    'config/agent-skills/catalog.yaml',
  ])
    assert.match(freeze.sha256?.[name] ?? '', /^[a-f0-9]{64}$/, `missing heldout2 digest: ${name}`)
  for (const [name, expected] of Object.entries(freeze.sha256)) {
    // The catalog is frozen in v4; later live catalog changes cannot rewrite labels.
    const source = routingV4Paths[name] ?? name
    assert.equal(digest(read(source)), expected, `heldout2 input changed: ${source}`)
  }
  verifyV3Snapshot(read, verifyHeldoutFreeze({ root: inputRoot }))
  const inputs = json('docs/agent-skills/heldout2-inputs.json')
  const previous = [
    ...json('docs/agent-skills/forward-inputs.json').cases,
    ...json('docs/agent-skills/heldout-inputs.json').cases,
  ]
  assert.equal(inputs.cases.length, 8, 'heldout2 requires eight PRs')
  assert.equal(new Set(inputs.cases.map(({ number }) => number)).size, 8, 'duplicate heldout2 PR')
  assert.equal(new Set(inputs.cases.map(({ merge }) => merge)).size, 8, 'duplicate heldout2 merge')
  assert.ok(
    inputs.cases.every(
      (pr) => !previous.some((old) => old.number === pr.number || old.merge === pr.merge),
    ),
    'heldout2 overlaps a previous sample',
  )
  assert.ok(
    inputs.cases.filter(({ body }) =>
      /verification|host checks|previous|follow-up|earlier work/i.test(body),
    ).length >= 2,
    'heldout2 requires at least two noisy PR bodies',
  )
  return freeze
}

export function evaluateRoutingV4({ root: inputRoot = root } = {}) {
  const read = (name) => fs.readFileSync(new URL(name, inputRoot), 'utf8')
  const json = (name) => JSON.parse(read(name))
  const labelsFreeze = verifyHeldout2Freeze({ root: inputRoot })
  // Verify the original sample before using it as a previously-seen reference.
  evaluateForward({ root: inputRoot })
  const freeze = json('docs/agent-skills/routing-v4-freeze.json')
  assert.equal(freeze.schemaVersion, 1)
  assert.equal(freeze.heldoutPredictionsRun, false)
  assert.ok(Date.parse(freeze.frozenAt) > Date.parse(labelsFreeze.frozenAt), 'v4 freeze order')
  for (const name of [...Object.values(routingV4Paths), 'docs/agent-skills/heldout2-freeze.json']) {
    assert.match(freeze.sha256?.[name] ?? '', /^[a-f0-9]{64}$/, `missing v4 digest: ${name}`)
  }
  for (const [name, expected] of Object.entries(freeze.sha256))
    assert.equal(digest(read(name)), expected, `v4 candidate changed: ${name}`)
  assert.equal(
    digest(read(routingV4Paths['scripts/agent-skills/routing.mjs'])),
    loadedV4Digest,
    'v4 router differs from the loaded snapshot module',
  )
  const config = (paths) => ({
    catalog: json(paths['config/agent-skills/catalog.yaml']),
    reviewMap: json(paths['config/agent-skills/review-map.yaml']),
  })
  const v3Config = config(routingV3Paths),
    v4Config = config(routingV4Paths)
  const skillIds = v3Config.catalog.skills.map(({ id }) => id).sort()
  assert.deepEqual(
    v4Config.catalog.skills.map(({ id }) => id).sort(),
    skillIds,
    'v4 skill denominator changed',
  )
  const inputs = json('docs/agent-skills/heldout2-inputs.json')
  const predict = (sample, select, config) => ({
    schemaVersion: 1,
    cases: sample.cases.map((pr) => ({
      number: pr.number,
      merge: pr.merge,
      routing: select({ paths: pr.files, taskText: `${pr.title}\n${pr.body}` }, config),
    })),
  })
  // Neither router receives labels; first measurement executes each exactly once per PR.
  const v3Predictions = predict(inputs, selectV3Skills, v3Config)
  const v4Predictions = predict(inputs, selectV4Skills, v4Config)
  const labels = json('docs/agent-skills/heldout2-labels.json')
  const score = (inputs, labels, predictions) => {
    const result = scoreRoutingEvaluation({ inputs, labels, predictions, skillIds })
    result.cases = result.cases.map((row) => ({
      ...row,
      matches: predictions.cases.find(({ number }) => row.number === number).routing.matches,
    }))
    return result
  }
  const v3 = score(inputs, labels, v3Predictions),
    v4 = score(inputs, labels, v4Predictions)
  const reference = (prefix) => {
    const sample = json(`docs/agent-skills/${prefix}-inputs.json`)
    return score(
      sample,
      json(`docs/agent-skills/${prefix}-labels.json`),
      predict(sample, selectV4Skills, v4Config),
    )
  }
  return {
    schemaVersion: 1,
    evaluation: 'routing-v4',
    mode: 'advisory',
    blocking: false,
    heldout2: {
      v3,
      v4,
      ...compareRoutingScores(v3, v4, { baselineVersion: 'v3', candidateVersion: 'v4' }),
    },
    previouslySeen: {
      originalFive: reference('forward'),
      previousHeldoutEight: reference('heldout'),
    },
    provenance: {
      method:
        'Purposive heldout2 sample labelled from merged diffs and catalog contracts before prediction. Same worker labelled and implemented; no independent blind review.',
      labelsChanged: false,
      independentReviewer: false,
      labelsVisibleDuringRevision: true,
      adviceAssessment: 'not performed; routing-only comparison',
      labelsFrozenAt: labelsFreeze.frozenAt,
      candidateFrozenAt: freeze.frozenAt,
      buildSha256: freeze.buildSha256,
      sha256: {
        ...labelsFreeze.sha256,
        ...freeze.sha256,
        'docs/agent-skills/routing-v4-freeze.json': digest(
          read('docs/agent-skills/routing-v4-freeze.json'),
        ),
      },
    },
  }
}

export function verifyV4Disposition(result, { root: inputRoot = root } = {}) {
  for (const name of ['scripts/agent-skills/routing.mjs', 'config/agent-skills/review-map.yaml']) {
    const expected = (result.heldout2.acceptance.accepted ? routingV4Paths : routingV3Paths)[name]
    assert.equal(
      fs.readFileSync(new URL(name, inputRoot), 'utf8'),
      fs.readFileSync(new URL(expected, inputRoot), 'utf8'),
      `live routes differ from v4 disposition: ${name}`,
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
        args.every((arg) =>
          ['--check', '--routing-v2', '--routing-v3', '--routing-v4', '--coverage'].includes(arg),
        ) &&
        args.filter((arg) => arg.startsWith('--routing-') || arg === '--coverage').length <= 1,
      'usage: evaluate-forward.mjs [--routing-v2 | --routing-v3 | --routing-v4 | --coverage] [--check]',
    )
    const v2 = args.includes('--routing-v2')
    const v3 = args.includes('--routing-v3')
    const v4 = args.includes('--routing-v4')
    const coverage = args.includes('--coverage')
    const result = coverage
      ? evaluateCoverage({ live: !args.includes('--check') })
      : v4
        ? evaluateRoutingV4()
        : v3
          ? evaluateRoutingV3()
          : v2
            ? evaluateRoutingV2()
            : evaluateForward()
    if (v4 && args.includes('--check')) verifyV4Disposition(result)
    const outputs = coverage
      ? {
          'docs/agent-skills/coverage-results.json': `${JSON.stringify(result, null, 2)}\n`,
          'docs/agent-skills/coverage-report.md': renderCoverageReport(result),
        }
      : v4
        ? {
            'docs/agent-skills/routing-v4-results.json': `${JSON.stringify(result, null, 2)}\n`,
            'docs/agent-skills/routing-v4-report.md': renderRoutingV4Report(result),
          }
        : v3
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
        coverage
          ? result.samples.heldout3.metrics
          : v4
            ? {
                v3: result.heldout2.v3.metrics,
                v4: result.heldout2.v4.metrics,
                acceptance: result.heldout2.acceptance,
              }
            : v3
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
