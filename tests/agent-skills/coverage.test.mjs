import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
import { validateReviewResult } from '../../scripts/agent-skills/lib.mjs'
import { compileSchema } from './json-schema-subset.mjs'
import {
  coverageInventory,
  renderCoverageInventory,
} from '../../scripts/agent-skills/coverage-inventory.mjs'
import {
  evaluateCoverage,
  verifyHeldout3Freeze,
} from '../../scripts/agent-skills/evaluate-forward.mjs'
import {
  renderCoverageReport,
  scoreCoverageSamples,
} from '../../scripts/agent-skills/evaluation.mjs'

const root = new URL('../../', import.meta.url)
const read = (name) => fs.readFileSync(new URL(name, root), 'utf8')
const json = (name) => JSON.parse(read(name))

test('every registered skill has a persisted runtime- and schema-valid example', () => {
  const validate = compileSchema(json('schemas/agent-skills/review-result.schema.json'))
  for (const { id } of json('config/agent-skills/catalog.yaml').skills) {
    const name = `tests/agent-skills/fixtures/${id}.json`
    assert.ok(fs.existsSync(new URL(name, root)), `missing persisted example: ${id}`)
    const result = json(name).reviewResult
    assert.equal(result?.skill, id)
    assert.deepEqual(validateReviewResult(result), [], id)
    assert.deepEqual(validate(result), [], id)
  }
})

test('new examples explicitly distinguish synthetic identity and context from executed reviews', () => {
  for (const id of ['cross-agent-skill-platform', 'gas-city-coordinator']) {
    const fixture = json(`tests/agent-skills/fixtures/${id}.json`)
    assert.equal(fixture.synthetic, true)
    assert.match(fixture.provenance, /not a historical review time/)
    assert.match(fixture.reviewResult.reviewId, /^synthetic-/)
    assert.match(fixture.reviewResult.summary, /^Synthetic example only:/)
    assert.ok(fixture.reviewResult.findings.every(({ blocking }) => !blocking))
  }
})

test('generated inventory records all capabilities, relative links, examples and genuine gaps', () => {
  const inventory = coverageInventory()
  assert.equal(read('docs/agent-skills/coverage-inventory.md'), renderCoverageInventory(inventory))
  assert.equal(inventory.skills.length, 12)
  assert.deepEqual(inventory.gaps.missingOrInvalidExamples, [])
  assert.equal(inventory.gaps.noPositiveBeforeHeldout3.length, 5)
  assert.equal(inventory.gaps.noPositiveAcrossAllSamples.length, 4)
  const owner = inventory.skills.find(({ skill }) => skill === 'owner-publishing-ux')
  assert.deepEqual(owner.samples.heldout3, [75, 90])
  for (const row of inventory.skills) {
    assert.match(row.relativeTarget, /^\.\.\//)
    assert.ok(row.capabilities.length > 0)
    assert.ok(row.example.endsWith('#reviewResult'))
  }
})

function fixtureRoot(t) {
  const dir = fs.mkdtempSync(new URL('.coverage-', import.meta.url))
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  const fixture = pathToFileURL(`${dir}/`)
  for (const name of ['docs/agent-skills', 'config/agent-skills', 'tests/agent-skills/fixtures']) {
    const target = new URL(name, fixture)
    fs.mkdirSync(new URL('./', target), { recursive: true })
    fs.cpSync(new URL(name, root), target, { recursive: true })
  }
  for (const { id } of json('config/agent-skills/catalog.yaml').skills) {
    const canonical = `.claude/skills/${id}`
    const target = new URL(canonical, fixture)
    fs.mkdirSync(new URL('./', target), { recursive: true })
    fs.cpSync(new URL(canonical, root), target, { recursive: true })
    fs.mkdirSync(new URL('.agents/skills/', fixture), { recursive: true })
    fs.symlinkSync(`../../.claude/skills/${id}`, new URL(`.agents/skills/${id}`, fixture))
  }
  return fixture
}

function writeJson(fixture, name, value) {
  fs.writeFileSync(new URL(name, fixture), `${JSON.stringify(value, null, 2)}\n`)
}

test('inventory exposes a deleted, invalid or misattributed persisted example', (t) => {
  const fixture = fixtureRoot(t)
  const name = 'tests/agent-skills/fixtures/gas-city-coordinator.json'
  const original = json(name)
  for (const result of [
    null,
    { ...original.reviewResult, mode: 'enforced' },
    { ...original.reviewResult, skill: 'reader-frontend' },
  ]) {
    writeJson(fixture, name, { ...original, reviewResult: result })
    assert.deepEqual(coverageInventory({ root: fixture }).gaps.missingOrInvalidExamples, [
      'gas-city-coordinator',
    ])
  }
  fs.unlinkSync(new URL(name, fixture))
  assert.deepEqual(coverageInventory({ root: fixture }).gaps.missingOrInvalidExamples, [
    'gas-city-coordinator',
  ])
})

test('coverage replay matches persisted results and keeps prior review identities', () => {
  const result = evaluateCoverage()
  assert.deepEqual(result, json('docs/agent-skills/coverage-results.json'))
  assert.equal(renderCoverageReport(result), read('docs/agent-skills/coverage-report.md'))
  assert.deepEqual(result.denominators, { prs: 29, skills: 12, decisions: 348 })
  assert.equal(result.samples.heldout3.metrics.decisions, 96)
  assert.equal(result.provenance.independentReviewer, false)
  assert.equal(result.provenance.routesChanged, false)
  assert.equal(result.provenance.providerComparison, 'not performed')
  const prior = json('docs/agent-skills/advice-v2-review.json').assessments
  assert.equal(result.priorAdviceEnvelopes.length, prior.length)
  for (const [index, ref] of result.priorAdviceEnvelopes.entries()) {
    assert.equal(ref.reviewId, prior[index].result.reviewId)
    assert.equal(ref.generatedAt, prior[index].result.generatedAt)
    assert.equal(ref.headSha, prior[index].result.headSha)
    assert.equal(ref.skill, prior[index].result.skill)
  }
  for (const row of result.perSkill) {
    assert.equal(
      row.truePositives + row.falsePositives + row.falseNegatives + row.trueNegatives,
      29,
    )
    const parts = Object.values(result.samples).map((s) =>
      s.perSkill.find(({ skill }) => skill === row.skill),
    )
    for (const key of ['truePositives', 'falsePositives', 'falseNegatives', 'trueNegatives'])
      assert.equal(
        row[key],
        parts.reduce((sum, part) => sum + part[key], 0),
      )
    if (row.expected === 0) assert.equal(row.recall, null)
  }
})

test('coverage publication ignores live revisions and the legacy live option', (t) => {
  const fixture = fixtureRoot(t)
  fs.mkdirSync(new URL('scripts/agent-skills/', fixture), { recursive: true })
  for (const name of [
    'scripts/agent-skills/routing.mjs',
    'config/agent-skills/catalog.yaml',
    'config/agent-skills/review-map.yaml',
  ])
    fs.writeFileSync(new URL(name, fixture), 'future live revision\n')
  assert.deepEqual(
    evaluateCoverage({ root: fixture, live: true }),
    json('docs/agent-skills/coverage-results.json'),
  )
})

test('coverage freeze rejects changed evidence and missing required digests', (t) => {
  const fixture = fixtureRoot(t)
  const freezePath = 'docs/agent-skills/heldout3-freeze.json'
  const original = json(freezePath)
  for (const name of Object.keys(original.sha256)) {
    const bytes = read(name)
    fs.writeFileSync(new URL(name, fixture), `${bytes} `)
    assert.throws(() => verifyHeldout3Freeze({ root: fixture }), /coverage input changed/)
    fs.writeFileSync(new URL(name, fixture), bytes)
    const missing = structuredClone(original)
    delete missing.sha256[name]
    writeJson(fixture, freezePath, missing)
    assert.throws(() => verifyHeldout3Freeze({ root: fixture }), /missing coverage digest/)
    writeJson(fixture, freezePath, original)
  }
})

test('coverage refuses repeated PRs/merges even if inputs are rehashed', (t) => {
  const fixture = fixtureRoot(t)
  const name = 'docs/agent-skills/heldout3-inputs.json'
  const freezePath = 'docs/agent-skills/heldout3-freeze.json'
  for (const key of ['number', 'merge']) {
    const input = json(name)
    input.cases[0][key] = json('docs/agent-skills/forward-inputs.json').cases[0][key]
    writeJson(fixture, name, input)
    const freeze = json(freezePath)
    freeze.sha256[name] = createHash('sha256')
      .update(fs.readFileSync(new URL(name, fixture)))
      .digest('hex')
    writeJson(fixture, freezePath, freeze)
    assert.throws(() => verifyHeldout3Freeze({ root: fixture }), /coverage (PR|merge) overlap/)
  }
})

test('coverage refuses claims that labels were frozen after prediction or before v4', (t) => {
  const fixture = fixtureRoot(t)
  const name = 'docs/agent-skills/heldout3-freeze.json'
  for (const change of [
    { routersRun: true },
    { labelsBeforeRouting: false },
    { frozenAt: '2020-01-01T00:00:00Z' },
    { liveAtFreezeSha256: {} },
  ]) {
    writeJson(fixture, name, { ...json(name), ...change })
    assert.throws(() => verifyHeldout3Freeze({ root: fixture }))
  }
})

test('coverage scorer derives all four outcomes and leaves absent-positive recall undefined', () => {
  const inputs = {
    schemaVersion: 1,
    cases: [{ number: 1, title: 'fixture', merge: 'a'.repeat(40) }],
  }
  const labels = {
    schemaVersion: 1,
    cases: [
      {
        number: 1,
        selectionReason: 'fixture',
        expected: [
          { skill: 'alpha', rationale: 'fixture' },
          { skill: 'beta', rationale: 'fixture' },
        ],
      },
    ],
  }
  const predictions = {
    schemaVersion: 1,
    cases: [
      {
        number: 1,
        merge: 'a'.repeat(40),
        routing: { mode: 'advisory', blocking: false, skills: ['alpha', 'gamma'], matches: [] },
      },
    ],
  }
  const sample = { inputs, labels, predictions }
  const ids = ['alpha', 'beta', 'gamma', 'delta']
  const result = scoreCoverageSamples({ one: sample }, ids)
  assert.deepEqual(
    result.perSkill.map((row) => [
      row.skill,
      row.truePositives,
      row.falsePositives,
      row.falseNegatives,
      row.trueNegatives,
      row.recall,
    ]),
    [
      ['alpha', 1, 0, 0, 0, 1],
      ['beta', 0, 0, 1, 0, 0],
      ['delta', 0, 0, 0, 1, null],
      ['gamma', 0, 1, 0, 0, null],
    ],
  )
  assert.throws(() => scoreCoverageSamples({ one: sample, two: sample }, ids), /overlap/)
})
