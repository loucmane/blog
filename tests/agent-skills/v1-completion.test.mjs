import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import {
  checkV1Completion,
  renderCompletionReport,
  runCompletion,
} from '../../scripts/agent-skills/check-v1-completion.mjs'
import {
  baselineV1Paths,
  baselineV2Paths,
  evaluateForward,
  evaluateRoutingV2,
} from '../../scripts/agent-skills/evaluate-forward.mjs'
import { buildAegisIngestCommand } from '../../scripts/agent-skills/lib.mjs'

const repository = fileURLToPath(new URL('../../', import.meta.url))
const readJson = (root, name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'))
const writeJson = (root, name, value) =>
  fs.writeFileSync(path.join(root, name), `${JSON.stringify(value, null, 2)}\n`)
const editJson = (root, name, mutate) => {
  const value = readJson(root, name)
  mutate(value)
  writeJson(root, name, value)
}

function fixture(t) {
  // Managed lanes cannot use /work or home scratch. Keep ephemeral fixtures
  // in the admitted worktree, never in the machine-wide temporary directory.
  const root = fs.mkdtempSync(path.join(repository, 'tests/agent-skills/.v1-completion-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const files = [
    '.gitignore',
    '.prettierignore',
    'package.json',
    '.github/workflows/ci.yml',
    'config/agent-skills',
    'schemas/agent-skills',
    'docs/agent-skills',
    'tests/agent-skills/fixtures',
    'scripts/agent-skills/routing.mjs',
    'scripts/agent-skills/evaluate-forward.mjs',
    'scripts/agent-skills/evaluation.mjs',
  ]
  const catalog = readJson(repository, 'config/agent-skills/catalog.yaml')
  for (const skill of catalog.skills) {
    files.push(skill.entrypoint, `.claude/skills/${skill.id}/agents/openai.yaml`)
  }
  for (const name of files) {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true })
    fs.cpSync(path.join(repository, name), path.join(root, name), { recursive: true })
  }
  fs.mkdirSync(path.join(root, '.agents/skills'), { recursive: true })
  for (const skill of catalog.skills) {
    fs.symlinkSync(`../../.claude/skills/${skill.id}`, path.join(root, skill.codexLink))
  }
  return root
}

const criterion = (root, id) => checkV1Completion({ root }).criteria.find((row) => row.id === id)

function refreshFreeze(root, name) {
  editJson(root, 'docs/agent-skills/forward-freeze.json', (value) => {
    value.sha256[name] = createHash('sha256')
      .update(fs.readFileSync(path.join(root, name)))
      .digest('hex')
  })
}

test('all seven mechanical criteria pass on the complete offline fixture', (t) => {
  const root = fixture(t)
  const result = checkV1Completion({ root })
  assert.deepEqual(
    result.criteria.map(({ id, status }) => [id, status]),
    ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => [id, 'pass']),
  )
  assert.equal(result.v1Complete, true)
  assert.equal(result.reviewOutputs.accepted, 10)
  assert.equal(result.dogfood.cases, 5)
  assert.deepEqual(checkV1Completion({ root }), result)
  assert.match(renderCompletionReport(result), /v1 complete: yes/)
})

for (const [name, change, reason] of [
  [
    'absolute link',
    (root, link) => {
      fs.unlinkSync(link)
      fs.symlinkSync(path.join(root, '.claude/skills/reader-frontend'), link)
    },
    /must be relative/,
  ],
  [
    'broken link',
    (_root, link) => {
      fs.unlinkSync(link)
      fs.symlinkSync('../../.claude/skills/missing', link)
    },
    /canonical|ENOENT/,
  ],
  [
    'copied directory',
    (_root, link) => {
      fs.unlinkSync(link)
      fs.mkdirSync(link)
    },
    /must be a symlink/,
  ],
  [
    'missing entrypoint',
    (root) => {
      fs.unlinkSync(path.join(root, '.claude/skills/reader-frontend/SKILL.md'))
    },
    /ENOENT/,
  ],
]) {
  test(`criterion a rejects ${name}`, (t) => {
    const root = fixture(t)
    change(root, path.join(root, '.agents/skills/reader-frontend'))
    const row = criterion(root, 'a')
    assert.equal(row.status, 'fail')
    assert.match(row.detail, reason)
    assert.equal(checkV1Completion({ root }).v1Complete, false)
  })
}

test('criterion b reuses platform checks for an unregistered skill directory', (t) => {
  const root = fixture(t)
  fs.mkdirSync(path.join(root, '.claude/skills/unregistered-skill'))
  const row = criterion(root, 'b')
  assert.notEqual(row.status, 'pass')
  assert.match(row.detail, /unregistered canonical skill directory: unregistered-skill/)
})

test('criterion b reuses routing validation for unknown routes and missing lifecycle criteria', (t) => {
  const root = fixture(t)
  editJson(root, 'config/agent-skills/review-map.yaml', (v) => v.routes[0].skills.push('unknown'))
  editJson(root, 'config/agent-skills/catalog.yaml', (v) => delete v.skills[0].lifecycle.promotion)
  const row = criterion(root, 'b')
  assert.equal(row.status, 'fail')
  assert.match(row.detail, /unknown/)
  assert.match(row.detail, /lifecycle.promotion/)
})

test('malformed catalog is recorded without losing the remaining criteria', (t) => {
  const root = fixture(t)
  fs.writeFileSync(path.join(root, 'config/agent-skills/catalog.yaml'), '{')
  const result = checkV1Completion({ root })
  assert.equal(result.criteria.length, 7)
  assert.equal(result.v1Complete, false)
  assert.equal(result.criteria.find((row) => row.id === 'b').status, 'fail')
})

test('criterion c rejects malformed review fixtures through the shared contract', (t) => {
  const root = fixture(t)
  editJson(root, 'tests/agent-skills/fixtures/reader-frontend.json', (v) => {
    delete v.reviewResult.headSha
  })
  const row = criterion(root, 'c')
  assert.equal(row.status, 'fail')
  assert.match(row.detail, /headSha/)
})

test('criterion c cannot pass on an empty review-output collection', (t) => {
  const root = fixture(t)
  for (const name of fs.readdirSync(path.join(root, 'tests/agent-skills/fixtures'))) {
    editJson(root, `tests/agent-skills/fixtures/${name}`, (v) => delete v.reviewResult)
  }
  assert.equal(criterion(root, 'c').status, 'fail')
})

test('criterion c checks additional forward review envelopes instead of skipping them', (t) => {
  const root = fixture(t)
  const review = readJson(root, 'tests/agent-skills/fixtures/reader-frontend.json').reviewResult
  writeJson(root, 'docs/agent-skills/forward-review-example.json', review)
  assert.equal(criterion(root, 'c').status, 'pass')
  review.mode = 'enforced'
  writeJson(root, 'docs/agent-skills/forward-review-example.json', review)
  assert.equal(criterion(root, 'c').status, 'fail')
})

test('in-memory ingestion planning matches file ingestion without executing the sink', (t) => {
  const root = fixture(t)
  const result = readJson(root, 'tests/agent-skills/fixtures/reader-frontend.json').reviewResult
  const resultPath = 'reports/agent-skills/example.json'
  fs.mkdirSync(path.join(root, 'reports/agent-skills'), { recursive: true })
  writeJson(root, resultPath, result)
  assert.deepEqual(
    buildAegisIngestCommand({ root, resultPath, result }),
    buildAegisIngestCommand({ root, resultPath }),
  )
  assert.throws(
    () => buildAegisIngestCommand({ root, resultPath: 'outside.json', result }),
    /beneath reports/,
  )
  assert.throws(
    () => buildAegisIngestCommand({ root, resultPath, result: { ...result, mode: 'enforced' } }),
    /advisory/,
  )
})

test('criterion d rejects four PRs even with refreshed input digests', (t) => {
  const root = fixture(t)
  editJson(root, 'docs/agent-skills/forward-inputs.json', (v) => v.cases.pop())
  refreshFreeze(root, 'docs/agent-skills/forward-inputs.json')
  const row = criterion(root, 'd')
  assert.equal(row.status, 'fail')
  assert.match(row.detail, /five|5/)
})

test('criterion d rejects duplicate PR identities even with refreshed input digests', (t) => {
  const root = fixture(t)
  editJson(root, 'docs/agent-skills/forward-inputs.json', (v) => {
    v.cases[1] = v.cases[0]
  })
  refreshFreeze(root, 'docs/agent-skills/forward-inputs.json')
  assert.equal(criterion(root, 'd').status, 'fail')
})

test('criterion d requires recorded real-PR provenance as well as replayable predictions', (t) => {
  const root = fixture(t)
  editJson(root, 'docs/agent-skills/forward-inputs.json', (v) => delete v.cases[0].mergedAt)
  refreshFreeze(root, 'docs/agent-skills/forward-inputs.json')
  const row = criterion(root, 'd')
  assert.equal(row.status, 'fail')
  assert.match(row.detail, /mergedAt/)
})

test('criterion d detects changed frozen inputs and missing freeze coverage', (t) => {
  const root = fixture(t)
  editJson(root, 'docs/agent-skills/forward-inputs.json', (v) => {
    v.cases[0].title += ' changed'
  })
  assert.match(criterion(root, 'd').detail, /frozen input changed/)
  editJson(root, 'docs/agent-skills/forward-freeze.json', (v) => {
    v.sha256 = {}
  })
  assert.equal(criterion(root, 'd').status, 'fail')
})

test('criterion d uses the evaluator with the supplied fixture root', (t) => {
  const root = fixture(t)
  assert.equal(evaluateForward({ root: pathToFileURL(`${root}/`) }).metrics.cases, 5)
  editJson(root, 'docs/agent-skills/forward-results.json', (v) => {
    v.metrics.truePositives += 1
  })
  assert.equal(criterion(root, 'd').status, 'fail')
})

test('v1 and v2 replay are isolated from live routes', (t) => {
  const root = fixture(t),
    url = pathToFileURL(`${root}/`)
  const before = evaluateForward({ root: url })
  const v2Before = evaluateRoutingV2({ root: url })
  // Revert only the live map to v1: both frozen evaluations must stay unchanged.
  fs.copyFileSync(
    path.join(root, baselineV1Paths['config/agent-skills/review-map.yaml']),
    path.join(root, 'config/agent-skills/review-map.yaml'),
  )
  assert.deepEqual(evaluateForward({ root: url }), before)
  const revised = evaluateRoutingV2({ root: url })
  assert.deepEqual(revised, v2Before)
  assert.equal(revised.metrics.falseNegatives, 0)
  assert.equal(criterion(root, 'd').status, 'pass')
  assert.equal(criterion(root, 'e').status, 'pass')
})

for (const [original, snapshot] of Object.entries(baselineV1Paths)) {
  test(`frozen replay rejects missing, changed and unpinned snapshot: ${original}`, (t) => {
    const root = fixture(t),
      url = pathToFileURL(`${root}/`)
    const target = path.join(root, snapshot),
      bytes = fs.readFileSync(target)
    fs.appendFileSync(target, '\n')
    assert.throws(() => evaluateForward({ root: url }), /frozen input changed/)
    assert.equal(criterion(root, 'd').status, 'fail')
    fs.unlinkSync(target)
    assert.throws(() => evaluateForward({ root: url }), /ENOENT/)
    fs.writeFileSync(target, bytes)
    editJson(root, 'docs/agent-skills/forward-freeze.json', (v) => delete v.sha256[original])
    assert.throws(() => evaluateForward({ root: url }), /missing frozen digest/)
  })
}

test('a rewritten snapshot digest cannot certify code other than the loaded frozen router', (t) => {
  const root = fixture(t),
    snapshot = baselineV1Paths['scripts/agent-skills/routing.mjs']
  fs.appendFileSync(path.join(root, snapshot), '\n// rewritten fixture\n')
  editJson(root, 'docs/agent-skills/forward-freeze.json', (v) => {
    v.sha256['scripts/agent-skills/routing.mjs'] = createHash('sha256')
      .update(fs.readFileSync(path.join(root, snapshot)))
      .digest('hex')
  })
  assert.throws(
    () => evaluateForward({ root: pathToFileURL(`${root}/`) }),
    /loaded baseline module/,
  )
})

test('v2 ignores live mutations and refuses changed or unpinned snapshot inputs', (t) => {
  const root = fixture(t),
    url = pathToFileURL(`${root}/`)
  const before = evaluateRoutingV2({ root: url })
  editJson(root, 'config/agent-skills/catalog.yaml', (v) => v.skills.pop())
  fs.appendFileSync(path.join(root, 'scripts/agent-skills/routing.mjs'), '\n')
  assert.deepEqual(evaluateRoutingV2({ root: url }), before)
  const manifestPath = 'docs/agent-skills/baseline-v2/freeze.json'
  const manifest = readJson(root, manifestPath)
  for (const [original, snapshot] of Object.entries(baselineV2Paths)) {
    const target = path.join(root, snapshot),
      bytes = fs.readFileSync(target)
    fs.appendFileSync(target, '\n')
    assert.throws(() => evaluateRoutingV2({ root: url }), /v2 snapshot changed/)
    fs.writeFileSync(target, bytes)
    editJson(root, manifestPath, (v) => delete v.files[original])
    assert.throws(() => evaluateRoutingV2({ root: url }), /missing v2 snapshot/)
    writeJson(root, manifestPath, manifest)
  }
  const original = 'scripts/agent-skills/routing.mjs',
    snapshot = baselineV2Paths[original]
  fs.appendFileSync(path.join(root, snapshot), '\n')
  editJson(root, manifestPath, (v) => {
    v.files[original].sha256 = createHash('sha256')
      .update(fs.readFileSync(path.join(root, snapshot)))
      .digest('hex')
  })
  assert.throws(() => evaluateRoutingV2({ root: url }), /loaded snapshot module/)
})

test('criterion e rejects both Markdown drift and metrics drift', (t) => {
  const root = fixture(t)
  const reportPath = path.join(root, 'docs/agent-skills/forward-report.md')
  const original = fs.readFileSync(reportPath, 'utf8')
  fs.writeFileSync(reportPath, original.replace('43.8%', '99.0%'))
  assert.equal(criterion(root, 'e').status, 'fail')
  fs.writeFileSync(reportPath, original)
  editJson(root, 'docs/agent-skills/forward-results.json', (v) => {
    v.metrics.precision = 0.99
  })
  assert.equal(criterion(root, 'e').status, 'fail')
})

for (const [name, mutate] of [
  [
    'subjective policy promotion',
    (root) =>
      editJson(root, 'config/agent-skills/catalog.yaml', (v) => {
        v.policy.subjectiveFindings = 'blocking'
      }),
  ],
  [
    'subjective check category',
    (root) =>
      editJson(root, 'config/agent-skills/catalog.yaml', (v) => {
        v.policy.blockingEligibleCategories.push('editorial-taste')
      }),
  ],
  [
    'self-declared subjective check',
    (root) => {
      editJson(root, 'config/agent-skills/catalog.yaml', (v) =>
        v.policy.deterministicChecks.push('editorial-taste'),
      )
      editJson(root, 'config/agent-skills/review-map.yaml', (v) =>
        v.routes[0].requiredChecks.push('editorial-taste'),
      )
    },
  ],
  [
    'undeclared required check',
    (root) =>
      editJson(root, 'config/agent-skills/review-map.yaml', (v) => {
        v.routes[0].requiredChecks.push('unknown-check')
      }),
  ],
  [
    'subjective blocking fixture',
    (root) =>
      editJson(root, 'tests/agent-skills/fixtures/reader-frontend.json', (v) => {
        v.reviewResult.findings[0].blocking = true
      }),
  ],
  [
    'subjective promotion in a deterministic example',
    (root) =>
      editJson(root, 'tests/agent-skills/fixtures/reader-frontend.json', (v) => {
        v.deterministicExamples[0].finding.subjective = true
      }),
  ],
  [
    'blocking blind advice',
    (root) =>
      editJson(root, 'docs/agent-skills/forward-blind-review.json', (v) => {
        v.cases[0].advice.find((advice) => advice.findings.length).findings[0].blocking = true
      }),
  ],
]) {
  test(`criterion f rejects ${name}`, (t) => {
    const root = fixture(t)
    mutate(root)
    assert.equal(criterion(root, 'f').status, 'fail')
  })
}

test('criterion g accepts explicit no gaps only when all earlier criteria pass', (t) => {
  const root = fixture(t)
  writeJson(root, 'docs/agent-skills/v1-gaps.json', { schemaVersion: 1, none: true, gaps: [] })
  assert.equal(criterion(root, 'g').status, 'pass')
  assert.match(renderCompletionReport(checkV1Completion({ root })), /Post-v1 gaps\n\nNone/)
  fs.unlinkSync(path.join(root, '.agents/skills/reader-frontend'))
  assert.equal(criterion(root, 'g').status, 'fail')
})

test('criterion g rejects missing, empty, malformed and contradictory gap declarations', (t) => {
  const root = fixture(t)
  for (const value of [
    { schemaVersion: 1, gaps: [] },
    { schemaVersion: 1, none: false, gaps: [{ id: 'gap-incomplete' }] },
    { ...readJson(root, 'docs/agent-skills/v1-gaps.json'), none: true },
  ]) {
    writeJson(root, 'docs/agent-skills/v1-gaps.json', value)
    assert.equal(criterion(root, 'g').status, 'fail')
  }
  fs.unlinkSync(path.join(root, 'docs/agent-skills/v1-gaps.json'))
  assert.equal(criterion(root, 'g').status, 'fail')
})

test('criterion g requires a gap link for every incomplete criterion', (t) => {
  const root = fixture(t)
  editJson(root, 'docs/agent-skills/v1-gaps.json', (v) => {
    for (const gap of v.gaps) gap.criteria = ['g']
  })
  fs.unlinkSync(path.join(root, '.agents/skills/reader-frontend'))
  const result = checkV1Completion({ root })
  assert.equal(result.criteria.find((row) => row.id === 'g').status, 'fail')
  assert.match(result.criteria.find((row) => row.id === 'g').detail, /criterion a/)
})

test('generated artifacts are deterministic and check mode detects stale JSON and Markdown', (t) => {
  const root = fixture(t)
  const first = runCompletion({ root })
  assert.equal(first.v1Complete, true)
  assert.deepEqual(runCompletion({ root, check: true }), first)
  const outputPath = path.join(root, 'docs/agent-skills/v1-completion.json')
  const original = fs.readFileSync(outputPath, 'utf8')
  runCompletion({ root })
  assert.equal(fs.readFileSync(outputPath, 'utf8'), original)
  fs.appendFileSync(outputPath, ' ')
  assert.throws(() => runCompletion({ root, check: true }), /stale completion artifact/)
  runCompletion({ root })
  const reportPath = path.join(root, 'docs/agent-skills/v1-completion-report.md')
  fs.appendFileSync(reportPath, 'stale')
  assert.throws(() => runCompletion({ root, check: true }), /stale completion artifact/)
  assert.match(fs.readFileSync(reportPath, 'utf8'), /stale$/)
})
