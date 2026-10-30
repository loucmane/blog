import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import {
  scoreEvaluation,
  scoreRoutingEvaluation,
  renderReport,
  renderRoutingRevisionReport,
  compareRoutingScores,
  renderRoutingV3Report,
  renderRoutingV4Report,
} from '../../scripts/agent-skills/evaluation.mjs'
import {
  evaluateForward,
  evaluateRoutingV2,
  evaluateRoutingV3,
  verifyHeldoutFreeze,
  routingV3Paths,
  routingV4Paths,
  evaluateRoutingV4,
  verifyHeldout2Freeze,
  verifyV4Disposition,
} from '../../scripts/agent-skills/evaluate-forward.mjs'

const sample = () => ({
  skillIds: ['alpha', 'beta', 'gamma'],
  inputs: {
    schemaVersion: 1,
    cases: [
      { number: 1, merge: 'a'.repeat(40), title: 'one' },
      { number: 2, merge: 'b'.repeat(40), title: 'two' },
    ],
  },
  labels: {
    schemaVersion: 1,
    cases: [
      {
        number: 1,
        selectionReason: 'mixed scope',
        expected: [
          { skill: 'alpha', rationale: 'required review' },
          { skill: 'beta', rationale: 'required review' },
        ],
      },
      {
        number: 2,
        selectionReason: 'single scope',
        expected: [{ skill: 'gamma', rationale: 'required review' }],
      },
    ],
  },
  blind: {
    schemaVersion: 1,
    labelsVisible: false,
    cases: [
      {
        number: 1,
        merge: 'a'.repeat(40),
        routing: { mode: 'advisory', blocking: false, skills: ['alpha', 'gamma'] },
        advice: [
          {
            skill: 'alpha',
            usable: true,
            recommendation: 'Check the domain.',
            evidence: ['source.ts'],
            findings: [],
          },
          {
            skill: 'gamma',
            usable: false,
            recommendation: 'Hand off to alpha.',
            evidence: ['source.ts'],
            findings: [
              {
                category: 'off-scope',
                message: 'Wrong domain',
                subjective: true,
                blocking: false,
                evidence: ['source.ts'],
              },
            ],
          },
        ],
      },
      {
        number: 2,
        merge: 'b'.repeat(40),
        routing: { mode: 'advisory', blocking: false, skills: [] },
        advice: [],
      },
    ],
  },
})

test('scores skill decisions, case-level misses and advice with explicit denominators', () => {
  const result = scoreEvaluation(sample())
  assert.deepEqual(result.metrics, {
    cases: 2,
    decisions: 6,
    truePositives: 1,
    falsePositives: 1,
    falseNegatives: 2,
    trueNegatives: 2,
    precision: 0.5,
    recall: 1 / 3,
    falsePositiveRate: 1 / 3,
    falseNegativeRate: 2 / 3,
    exactMatches: 0,
    missedRoutingCases: 2,
    whollyMissedCases: 1,
    assessedAdvice: 2,
    unusableAdvice: 1,
    unusableAdviceFindings: 1,
    unusableAdviceRate: 0.5,
  })
  assert.deepEqual(result.cases[0].falsePositives, ['gamma'])
  assert.deepEqual(result.cases[0].falseNegatives, ['beta'])
  assert.equal(result.mode, 'advisory')
  assert.equal(result.blocking, false)
})

test('undefined rates stay null rather than claiming perfect or zero accuracy', () => {
  const input = sample()
  input.labels.cases.forEach((row) => {
    row.expected = []
  })
  input.blind.cases.forEach((row) => {
    row.routing.skills = []
    row.advice = []
  })
  const { metrics } = scoreEvaluation(input)
  assert.equal(metrics.precision, null)
  assert.equal(metrics.recall, null)
  assert.equal(metrics.unusableAdviceRate, null)
})

test('rejects incomplete, duplicated, unknown, non-blind or blocking evidence', () => {
  for (const mutate of [
    (v) => {
      v.blind.labelsVisible = true
    },
    (v) => {
      v.blind.cases.pop()
    },
    (v) => {
      v.labels.cases.push(v.labels.cases[0])
    },
    (v) => {
      v.blind.cases[0].merge = 'c'.repeat(40)
    },
    (v) => {
      v.labels.cases[0].expected[0].skill = 'unknown'
    },
    (v) => {
      v.blind.cases[0].routing.skills.push('alpha')
    },
    (v) => {
      v.blind.cases[0].advice.pop()
    },
    (v) => {
      v.blind.cases[0].advice[1].findings[0].blocking = true
    },
    (v) => {
      v.blind.cases[0].advice[1].findings = []
    },
    (v) => {
      v.blind.cases[0].routing.blocking = true
    },
  ]) {
    const changed = sample()
    mutate(changed)
    assert.throws(() => scoreEvaluation(changed))
  }
})

test('five real PRs reproduce the recorded predictions, metrics and report without label leakage', () => {
  const result = evaluateForward()
  const read = (name) =>
    fs.readFileSync(new URL(`../../docs/agent-skills/${name}`, import.meta.url), 'utf8')
  assert.equal(result.metrics.cases, 5)
  assert.equal(result.metrics.decisions, 60)
  assert.equal(result.provenance.labelsVisibleToReviewer, false)
  assert.deepEqual(JSON.parse(read('forward-results.json')), result)
  assert.equal(read('forward-report.md'), renderReport(result))
})

test('routing-only scoring shares decision counts without inventing blind advice', () => {
  const { blind, ...input } = sample()
  const predictions = {
    schemaVersion: 1,
    cases: blind.cases.map(({ number, merge, routing }) => ({ number, merge, routing })),
  }
  const result = scoreRoutingEvaluation({ ...input, predictions })
  const baseline = scoreEvaluation({ ...input, blind })
  for (const [key, value] of Object.entries(result.metrics))
    assert.equal(value, baseline.metrics[key], key)
  assert.equal(Object.hasOwn(result.metrics, 'assessedAdvice'), false)
  assert.ok(result.cases.every((row) => !Object.hasOwn(row, 'advice')))
  predictions.cases[0].routing.blocking = true
  assert.throws(() => scoreRoutingEvaluation({ ...input, predictions }), /advisory/)
})

test('held-out acceptance requires both precision and recall without undefined rates', () => {
  const { blind, ...input } = sample()
  const score = (skills) =>
    scoreRoutingEvaluation({
      ...input,
      predictions: {
        schemaVersion: 1,
        cases: blind.cases.map(({ number, merge }, i) => ({
          number,
          merge,
          routing: { mode: 'advisory', blocking: false, skills: skills[i] },
        })),
      },
    })
  const baseline = score([['alpha', 'gamma'], ['gamma']])
  const better = score([['alpha', 'beta'], ['gamma']])
  assert.equal(compareRoutingScores(baseline, better).acceptance.accepted, true)
  assert.equal(compareRoutingScores(baseline, baseline).acceptance.accepted, true)
  // Each regression is rejected even when the other metric improves.
  assert.equal(compareRoutingScores(baseline, score([['alpha'], []])).acceptance.accepted, false)
  assert.equal(
    compareRoutingScores(
      baseline,
      score([
        ['alpha', 'beta', 'gamma'],
        ['alpha', 'beta', 'gamma'],
      ]),
    ).acceptance.accepted,
    false,
  )
  assert.equal(compareRoutingScores(baseline, score([[], []])).acceptance.accepted, false)
  const changed = structuredClone(better)
  changed.cases[0].expected = ['gamma']
  assert.throws(() => compareRoutingScores(baseline, changed), /identical cases/)
})

function heldoutFixture(t) {
  // Keep transient roots out of docs/agent-skills: the v1 completion tests copy
  // that directory concurrently and fail if a root vanishes mid-copy.
  const docs = new URL('../../docs/agent-skills/', import.meta.url)
  const root = fs.mkdtempSync(new URL('.forward-evaluation-', import.meta.url))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const url = pathToFileURL(`${root}/`)
  for (const name of [
    ...fs
      .readdirSync(docs, { withFileTypes: true })
      .filter(
        (entry) =>
          ['baseline-v1', 'baseline-v2'].includes(entry.name) ||
          (entry.isFile() && /^(forward-|heldout2?-|routing-v[234]-)/.test(entry.name)),
      )
      .map(({ name }) => `docs/agent-skills/${name}`),
    'config/agent-skills',
    'scripts/agent-skills/evaluate-forward.mjs',
    'scripts/agent-skills/evaluation.mjs',
    'scripts/agent-skills/routing.mjs',
    'tests/agent-skills/fixtures/routing.json',
  ]) {
    const target = new URL(name, url)
    fs.mkdirSync(new URL('./', target), { recursive: true })
    fs.cpSync(new URL(`../../${name}`, import.meta.url), target, { recursive: true })
  }
  return url
}

test('held-out freeze rejects changed labels, inputs, missing digests and baseline drift', (t) => {
  const root = heldoutFixture(t)
  assert.equal(verifyHeldoutFreeze({ root }).labelsBeforeRouting, true)
  for (const name of ['inputs', 'labels', 'diff-evidence']) {
    const target = new URL(`docs/agent-skills/heldout-${name}.json`, root)
    const bytes = fs.readFileSync(target)
    fs.appendFileSync(target, '\n')
    assert.throws(() => verifyHeldoutFreeze({ root }), /held-out input changed/)
    fs.writeFileSync(target, bytes)
  }
  const target = new URL('docs/agent-skills/heldout-freeze.json', root)
  const original = fs.readFileSync(target)
  const freeze = JSON.parse(fs.readFileSync(target, 'utf8'))
  delete freeze.sha256['docs/agent-skills/heldout-labels.json']
  fs.writeFileSync(target, JSON.stringify(freeze))
  assert.throws(() => verifyHeldoutFreeze({ root }), /missing held-out digest/)
  fs.writeFileSync(target, original)
  fs.appendFileSync(new URL('docs/agent-skills/baseline-v2/routing.mjs', root), '\n')
  assert.throws(() => verifyHeldoutFreeze({ root }), /v2 snapshot changed/)
})

test('v3 replays the sealed comparison from snapshots alone', () => {
  const result = evaluateRoutingV3()
  const read = (name) =>
    fs.readFileSync(new URL(`../../docs/agent-skills/${name}`, import.meta.url), 'utf8')
  assert.deepEqual(JSON.parse(read('routing-v3-results.json')), result)
  assert.equal(read('routing-v3-report.md'), renderRoutingV3Report(result))
  assert.equal(result.heldout.denominators.prs, 8)
  assert.equal(result.heldout.denominators.decisions, 96)
  assert.equal(result.heldout.denominators.expectedPositives, 16)
  assert.equal(result.provenance.independentReviewer, false)
  assert.equal(result.provenance.labelsChanged, false)
  assert.equal(Object.hasOwn(result.heldout.v3.metrics, 'assessedAdvice'), false)
  assert.match(renderRoutingV3Report(result), /not an independent blind review/)
})

test('v3 rejects candidate drift, missing digests and a rewritten loaded-router identity', (t) => {
  const root = heldoutFixture(t)
  for (const name of Object.values(routingV3Paths)) {
    const target = new URL(name, root),
      bytes = fs.readFileSync(target)
    fs.appendFileSync(target, '\n')
    assert.throws(() => evaluateRoutingV3({ root }), /v3 candidate changed/)
    fs.writeFileSync(target, bytes)
  }
  const target = new URL('docs/agent-skills/routing-v3-freeze.json', root)
  const freeze = JSON.parse(fs.readFileSync(target, 'utf8'))
  const name = routingV3Paths['scripts/agent-skills/routing.mjs']
  const changed = structuredClone(freeze)
  delete changed.sha256[name]
  fs.writeFileSync(target, JSON.stringify(changed))
  assert.throws(() => evaluateRoutingV3({ root }), /missing v3 digest/)
  fs.appendFileSync(new URL(name, root), '\n')
  freeze.sha256[name] = createHash('sha256')
    .update(fs.readFileSync(new URL(name, root)))
    .digest('hex')
  fs.writeFileSync(target, JSON.stringify(freeze))
  assert.throws(() => evaluateRoutingV3({ root }), /loaded snapshot module/)
})

test('v3 replay ignores changes to live routes, evaluator and fixtures', (t) => {
  const root = heldoutFixture(t)
  const result = evaluateRoutingV3({ root })
  for (const name of [
    ...Object.keys(routingV3Paths),
    'scripts/agent-skills/evaluate-forward.mjs',
    'scripts/agent-skills/evaluation.mjs',
    'tests/agent-skills/fixtures/routing.json',
  ]) {
    fs.writeFileSync(new URL(name, root), 'unrelated live revision\n')
  }
  assert.deepEqual(evaluateRoutingV3({ root }), result)
})

test('v4 replays sealed predictions, reference samples, denominators and live disposition', () => {
  const result = evaluateRoutingV4()
  const read = (name) =>
    fs.readFileSync(new URL(`../../docs/agent-skills/${name}`, import.meta.url), 'utf8')
  assert.deepEqual(JSON.parse(read('routing-v4-results.json')), result)
  assert.equal(read('routing-v4-report.md'), renderRoutingV4Report(result))
  assert.deepEqual(result.heldout2.denominators, {
    prs: 8,
    skills: 12,
    decisions: 96,
    expectedPositives: 15,
    expectedNegatives: 81,
    selectedV3: 18,
    selectedV4: 15,
  })
  assert.equal(result.heldout2.acceptance.accepted, true)
  assert.equal(result.heldout2.v4.metrics.falsePositives, 2)
  assert.equal(result.heldout2.v4.metrics.falseNegatives, 2)
  assert.equal(result.previouslySeen.originalFive.metrics.cases, 5)
  assert.equal(result.previouslySeen.previousHeldoutEight.metrics.cases, 8)
  assert.equal(result.provenance.independentReviewer, false)
  assert.equal(result.provenance.labelsChanged, false)
  assert.equal(result.provenance.labelsVisibleDuringRevision, true)
  assert.match(renderRoutingV4Report(result), /previously seen, reference only/)
  for (const score of [
    result.heldout2.v3,
    result.heldout2.v4,
    ...Object.values(result.previouslySeen),
  ]) {
    assert.equal(Object.hasOwn(score.metrics, 'assessedAdvice'), false)
    for (const row of score.cases) {
      assert.deepEqual([...new Set(row.matches.map(({ skill }) => skill))].sort(), row.selected)
    }
  }
  verifyV4Disposition(result)
})

test('heldout2 freeze refuses modified inputs, missing hashes and overlap with either prior sample', (t) => {
  const root = heldoutFixture(t)
  const target = (name) => new URL(`docs/agent-skills/${name}`, root)
  const read = (name) => JSON.parse(fs.readFileSync(target(name), 'utf8'))
  const freeze = read('heldout2-freeze.json')
  assert.equal(verifyHeldout2Freeze({ root }).labelsBeforeRouting, true)
  for (const name of ['heldout2-inputs.json', 'heldout2-labels.json']) {
    const bytes = fs.readFileSync(target(name))
    fs.appendFileSync(target(name), '\n')
    assert.throws(() => verifyHeldout2Freeze({ root }), /heldout2 input changed/)
    fs.writeFileSync(target(name), bytes)
  }
  const missing = structuredClone(freeze)
  delete missing.sha256['docs/agent-skills/heldout2-labels.json']
  fs.writeFileSync(target('heldout2-freeze.json'), JSON.stringify(missing))
  assert.throws(() => verifyHeldout2Freeze({ root }), /missing heldout2 digest/)
  const inputs = read('heldout2-inputs.json')
  for (const prefix of ['forward', 'heldout']) {
    const changed = structuredClone(inputs)
    changed.cases[0] = read(`${prefix}-inputs.json`).cases[0]
    fs.writeFileSync(target('heldout2-inputs.json'), JSON.stringify(changed))
    const rehashed = structuredClone(freeze)
    rehashed.sha256['docs/agent-skills/heldout2-inputs.json'] = createHash('sha256')
      .update(fs.readFileSync(target('heldout2-inputs.json')))
      .digest('hex')
    fs.writeFileSync(target('heldout2-freeze.json'), JSON.stringify(rehashed))
    assert.throws(() => verifyHeldout2Freeze({ root }), /overlaps a previous sample/)
  }
})

test('v4 rejects candidate drift, omitted pins, wrong freeze order and rewritten loaded code', (t) => {
  const root = heldoutFixture(t)
  for (const name of Object.values(routingV4Paths)) {
    const target = new URL(name, root),
      bytes = fs.readFileSync(target)
    fs.appendFileSync(target, '\n')
    assert.throws(() => evaluateRoutingV4({ root }), /v4 candidate changed|heldout2 input changed/)
    fs.writeFileSync(target, bytes)
  }
  const target = new URL('docs/agent-skills/routing-v4-freeze.json', root)
  const freeze = JSON.parse(fs.readFileSync(target, 'utf8'))
  const name = routingV4Paths['scripts/agent-skills/routing.mjs']
  const missing = structuredClone(freeze)
  delete missing.sha256[name]
  fs.writeFileSync(target, JSON.stringify(missing))
  assert.throws(() => evaluateRoutingV4({ root }), /missing v4 digest/)
  fs.writeFileSync(target, JSON.stringify({ ...freeze, frozenAt: '2020-01-01T00:00:00Z' }))
  assert.throws(() => evaluateRoutingV4({ root }), /v4 freeze order/)
  fs.appendFileSync(new URL(name, root), '\n')
  freeze.sha256[name] = createHash('sha256')
    .update(fs.readFileSync(new URL(name, root)))
    .digest('hex')
  fs.writeFileSync(target, JSON.stringify(freeze))
  assert.throws(() => evaluateRoutingV4({ root }), /loaded snapshot module/)
})

test('v4 snapshot replay is independent of live changes while disposition checks both outcomes', (t) => {
  const root = heldoutFixture(t)
  const result = evaluateRoutingV4({ root })
  for (const name of Object.keys(routingV4Paths))
    fs.writeFileSync(new URL(name, root), 'future live revision\n')
  assert.deepEqual(evaluateRoutingV4({ root }), result)
  assert.throws(() => verifyV4Disposition(result, { root }), /live routes differ/)
  for (const accepted of [true, false]) {
    for (const name of [
      'scripts/agent-skills/routing.mjs',
      'config/agent-skills/review-map.yaml',
    ]) {
      fs.copyFileSync(
        new URL((accepted ? routingV4Paths : routingV3Paths)[name], root),
        new URL(name, root),
      )
    }
    verifyV4Disposition({ heldout2: { acceptance: { accepted } } }, { root })
  }
})

test('v2 corrects only the two quality misses and preserves original scopes and labels', () => {
  const baseline = evaluateForward(),
    result = evaluateRoutingV2()
  assert.deepEqual(result.comparison.denominators, {
    prs: 5,
    skills: 12,
    decisions: 60,
    expectedPositives: 9,
    expectedNegatives: 51,
    selectedV1: 16,
    selectedV2: 18,
  })
  assert.deepEqual(
    [
      'truePositives',
      'falsePositives',
      'falseNegatives',
      'trueNegatives',
      'precision',
      'recall',
    ].map((key) => [result.metrics[key], result.comparison.delta[key]]),
    [
      [9, 2],
      [9, 0],
      [0, -2],
      [42, 0],
      [0.5, 0.0625],
      [1, 1 - 7 / 9],
    ],
  )
  for (const row of result.cases) {
    const before = baseline.cases.find(({ number }) => number === row.number)
    assert.deepEqual(row.expected, before.expected)
    assert.deepEqual(row.removed, [])
    assert.deepEqual(row.falseNegatives, [])
    assert.deepEqual(row.falsePositives, before.falsePositives)
    assert.deepEqual(
      row.added,
      [130, 118].includes(row.number) ? ['quality-reliability-observability'] : [],
    )
    if (row.added.length)
      assert.ok(
        row.matches.some(
          ({ skill, kind }) => skill === 'quality-reliability-observability' && kind === 'path',
        ),
      )
  }
  assert.equal(result.provenance.independentSample, false)
  assert.equal(result.provenance.labelsVisibleDuringRevision, true)
  assert.equal(result.provenance.labelsChanged, false)
  assert.equal(Object.hasOwn(result.metrics, 'assessedAdvice'), false)
  const read = (name) =>
    fs.readFileSync(new URL(`../../docs/agent-skills/${name}`, import.meta.url), 'utf8')
  assert.deepEqual(JSON.parse(read('routing-v2-results.json')), result)
  assert.equal(read('routing-v2-report.md'), renderRoutingRevisionReport(result))
  assert.match(
    renderRoutingRevisionReport(result),
    /not an independent sample or a generalization estimate/,
  )
})
