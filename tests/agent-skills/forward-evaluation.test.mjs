import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import { scoreEvaluation } from '../../scripts/agent-skills/evaluation.mjs'
import { renderReport } from '../../scripts/agent-skills/evaluation.mjs'
import { evaluateForward } from '../../scripts/agent-skills/evaluate-forward.mjs'

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
