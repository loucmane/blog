import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { validateReviewResult } from '../../scripts/agent-skills/lib.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const json = (file) => JSON.parse(read(file))
const inputs = json('docs/agent-skills/advice-v2-inputs.json')
const cases = [
  {
    number: 130,
    skill: 'seo-distribution',
    gate: '### Scope gate',
    next: '### In-scope review',
    domain: 'url/discovery semantics',
    reference: 'references/output-contract.md',
    owner: 'reader-frontend',
  },
  {
    number: 128,
    skill: 'owner-publishing-ux',
    gate: '### 0. Confirm Review Scope',
    next: '### 1. Frame The Owner Context',
    domain: 'owner intent, state transition, feedback or recovery journey',
    reference: 'references/scope-abstention.md',
    owner: 'content-platform-backend',
  },
]

for (const item of cases) {
  const example = json(
    `tests/agent-skills/examples/scope-abstention/pr-${item.number}-${item.skill}.json`,
  )
  const directory = `.claude/skills/${item.skill}`

  test(`${item.skill}: checks scope before substantive review`, () => {
    const skill = read(`${directory}/SKILL.md`)
    const start = skill.indexOf(item.gate)
    const end = skill.indexOf(item.next)
    assert.ok(start >= 0 && end > start)
    const gate = skill.slice(start, end).toLowerCase().replace(/\s+/g, ' ')
    for (const rule of [
      'diff and directly affected contracts',
      item.domain,
      'file path or task-text keyword alone',
      'design request',
      'not-applicable',
      'findings: []',
      'summary plus evidence',
      'do not invent findings',
      'handoff',
      item.owner,
      'subjective: true',
      'blocking: false',
      'evidence gap rather than claim scope is absent',
    ]) {
      // Explicit scope-gate contract requested by the bead, not a behavioral score.
      assert.ok(gate.includes(rule), `missing scope rule: ${rule}`)
    }
    assert.ok(gate.includes(item.reference))
  })

  test(`${item.skill}: keeps the real-change example an evidenced abstention`, () => {
    const input = inputs.cases.find(({ number }) => number === item.number)
    assert.deepEqual(validateReviewResult(example), [])
    assert.equal(example.skill, item.skill)
    assert.equal(example.headSha, input.merge)
    assert.equal(example.mode, 'advisory')
    assert.equal(example.verdict, 'not-applicable')
    assert.deepEqual(example.findings, [])
    assert.ok(example.summary.toLowerCase().includes(item.domain))
    assert.ok(example.summary.includes('Illustrative static review'))
    assert.ok(example.evidence.some(({ path: file }) => file.endsWith('advice-v2-inputs.json')))
    assert.ok(example.evidence.some(({ path: file }) => input.files.includes(file)))
    for (const evidence of example.evidence) {
      assert.equal(evidence.kind, 'file')
      assert.ok(fs.existsSync(path.join(root, evidence.path)))
    }
    assert.ok(validateReviewResult({ ...example, evidence: [] }).length > 0)
  })

  test(`${item.skill}: output excerpts compose into advisory results`, () => {
    const reference = read(`${directory}/${item.reference}`)
    const excerpts = [...reference.matchAll(/```json\n([\s\S]*?)\n```/g)].map((match) =>
      JSON.parse(match[1]),
    )
    assert.equal(excerpts.length, 2)
    const [abstention, handoff] = excerpts
    assert.equal(abstention.verdict, 'not-applicable')
    assert.deepEqual(abstention.findings, [])
    assert.deepEqual(validateReviewResult({ ...example, ...abstention }), [])
    assert.equal(handoff.category, 'handoff')
    assert.equal(handoff.severity, 'info')
    assert.equal(handoff.subjective, true)
    assert.equal(handoff.blocking, false)
    assert.ok(handoff.message.includes(item.owner))
    const result = { ...example, verdict: 'pass', findings: [handoff] }
    assert.deepEqual(validateReviewResult(result), [])
    const promoted = { ...result, findings: [{ ...handoff, blocking: true }] }
    assert.ok(
      validateReviewResult(promoted).some((error) =>
        error.includes('cannot make a subjective finding blocking'),
      ),
    )
  })
}

test('blind bundle preserves two complete patches and all six assigned assessments', () => {
  assert.equal(inputs.schemaVersion, 1)
  assert.deepEqual(
    inputs.cases.map(({ number }) => number),
    [130, 128],
  )
  assert.deepEqual(
    inputs.cases.map(({ selectedSkills }) => selectedSkills),
    [
      [
        'reader-frontend',
        'seo-distribution',
        'owner-publishing-ux',
        'quality-reliability-observability',
      ],
      ['content-platform-backend', 'owner-publishing-ux'],
    ],
  )
  for (const item of inputs.cases) {
    assert.deepEqual(Object.keys(item).sort(), [
      'diff',
      'diffCommand',
      'files',
      'merge',
      'number',
      'selectedSkills',
    ])
    assert.match(item.merge, /^[a-f0-9]{40}$/)
    assert.equal(
      item.diffCommand,
      `git --no-optional-locks show --format= --no-ext-diff --no-color ${item.merge}`,
    )
    const paths = [...item.diff.matchAll(/^diff --git a\/(.+) b\/(.+)$/gm)].map((match) => {
      assert.equal(match[1], match[2])
      return match[2]
    })
    assert.deepEqual(paths, item.files)
    assert.ok(item.diff.endsWith('\n'))
    assert.ok(!item.diff.includes('tokens truncated'))
  }
})
