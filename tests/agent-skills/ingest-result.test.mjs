import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import * as library from '../../scripts/agent-skills/lib.mjs'
import { parseIngestionArgs } from '../../scripts/agent-skills/ingest-result.mjs'
import { blockingEligibleCategories } from '../../scripts/agent-skills/routing.mjs'

const repository = fileURLToPath(new URL('../../', import.meta.url))
const bead = 'blog-n4y6.6'
const resultPath = 'reports/agent-skills/receipt.json'
const route = [
  '/home/loucmane/gascity/bin/gc',
  '--city',
  '/home/loucmane/gascity/city',
  '--rig',
  'blog',
]

function validResult() {
  return {
    schemaVersion: 1,
    reviewId: 'ingestion-review.1',
    skill: 'cross-agent-skill-platform',
    mode: 'advisory',
    verdict: 'warn',
    summary: 'Synthetic review for ingestion contract tests.',
    generatedAt: '2026-10-29T14:00:00Z',
    headSha: '0123456789abcdef0123456789abcdef01234567',
    findings: [
      {
        id: 'layout',
        severity: 'warning',
        category: 'design',
        message: 'Subjective advice.',
        subjective: true,
        blocking: false,
        evidence: ['synthetic observation'],
      },
      {
        id: 'schema',
        severity: 'error',
        category: 'schema',
        message: 'Synthetic deterministic finding.',
        subjective: false,
        blocking: true,
        evidence: ['synthetic schema check'],
      },
      {
        id: 'test',
        severity: 'info',
        category: 'test',
        message: 'Informational check.',
        subjective: false,
        blocking: false,
        evidence: ['synthetic test'],
      },
    ],
    evidence: [{ kind: 'command', path: 'synthetic check; not executed' }],
  }
}

function fixture(t, result = validResult()) {
  const root = fs.mkdtempSync(path.join(repository, 'tests/agent-skills/.ingest-result-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  fs.mkdirSync(path.join(root, 'reports/agent-skills'), { recursive: true })
  const bytes = `${JSON.stringify(result, null, 2)}\n`
  fs.writeFileSync(path.join(root, resultPath), bytes)
  return { root, bead, resultPath, bytes }
}

const corpusRoot = path.join(repository, 'tests/agent-skills/review-result-corpus')
for (const name of fs.readdirSync(corpusRoot).filter((name) => name.endsWith('.json')).sort()) {
  const entry = JSON.parse(fs.readFileSync(path.join(corpusRoot, name), 'utf8'))
  test(`ingestion honors the shared corpus: ${name}`, (t) => {
    const input = fixture(t, entry.result)
    if (entry.valid) {
      const plan = library.buildBeadsIngestPlan(input)
      assert.equal(plan.receipt.reviewId, entry.result.reviewId)
    } else {
      const calls = []
      const runner = (...args) => {
        calls.push(args)
        throw new Error('invalid envelope reached the command runner')
      }
      assert.throws(() => library.ingestReviewResult({ ...input, execute: true, runner }))
      assert.deepEqual(calls, [], entry.reason)
    }
    assert.equal(fs.existsSync(path.join(input.root, 'docs')), false)
  })
}

test('plans an explicitly routed Beads update and append-only worklog receipt', (t) => {
  const input = fixture(t)
  const plan = library.buildBeadsIngestPlan(input)
  const sha256 = createHash('sha256').update(input.bytes).digest('hex')
  const receipt = {
    skill: 'cross-agent-skill-platform',
    reviewId: 'ingestion-review.1',
    headSha: validResult().headSha,
    mode: 'advisory',
    findings: { bySeverity: { info: 1, warning: 1, error: 1 }, blocking: 1, advisory: 2 },
    evidence: resultPath,
    sha256,
  }
  assert.deepEqual(plan.receipt, receipt)
  assert.equal(plan.metadataKey, 'skills.review.cross_agent_skill_platform.ingestion_review.1')
  // The live Beads store rejects any other key shape.
  assert.match(plan.metadataKey, /^[a-zA-Z_][a-zA-Z0-9_./]*$/)
  assert.deepEqual(plan.gcArgv, [
    ...route,
    'bd',
    'update',
    bead,
    '--append-notes',
    plan.summary,
    '--set-metadata',
    `${plan.metadataKey}=${JSON.stringify(receipt)}`,
  ])
  assert.equal(plan.worklog.path, `docs/worklog/${bead}.md`)
  assert.match(plan.worklog.entry, /Classification: internal project evidence/)
  assert.match(plan.worklog.entry, /Mode: advisory/)
  assert.ok(plan.worklog.entry.includes(sha256))
  assert.ok(plan.worklog.entry.includes(validResult().headSha))
  assert.equal(fs.existsSync(path.join(input.root, 'docs')), false)
})

function recordingRunner(record = { id: bead, metadata: {} }) {
  const calls = []
  return {
    calls,
    runner(command, args, options) {
      calls.push({ argv: [command, ...args], options })
      return { status: 0, stdout: args[5] === 'show' ? JSON.stringify(record) : '' }
    },
  }
}

test('defaults to a side-effect-free dry run, including the explicit dry-run alias', (t) => {
  const input = fixture(t)
  const fake = recordingRunner()
  for (const flags of [[], ['--dry-run']]) {
    const options = parseIngestionArgs([resultPath, '--bead', bead, ...flags])
    const result = library.ingestReviewResult({ ...options, root: input.root, runner: fake.runner })
    assert.equal(result.status, 'dry-run')
    assert.deepEqual(JSON.parse(JSON.stringify(result)).gcArgv, result.gcArgv)
  }
  assert.deepEqual(fake.calls, [])
  assert.equal(fs.existsSync(path.join(input.root, 'docs')), false)
})

test('ingestion cannot substitute an in-memory result for recorded file bytes', (t) => {
  const input = fixture(t)
  const fake = recordingRunner()
  for (const execute of [false, true]) {
    for (const result of [undefined, validResult()]) {
      assert.throws(
        () => library.ingestReviewResult({ ...input, result, execute, runner: fake.runner }),
        /requires file-backed evidence/,
      )
    }
  }
  assert.deepEqual(fake.calls, [])
  assert.equal(fs.existsSync(path.join(input.root, 'docs')), false)
  assert.equal(fs.readFileSync(path.join(input.root, resultPath), 'utf8'), input.bytes)
})

test('executes show then update without a shell or inherited environment and appends exact Markdown', (t) => {
  const input = fixture(t)
  const fake = recordingRunner([{ id: bead, metadata: {} }])
  const log = path.join(input.root, `docs/worklog/${bead}.md`)
  fs.mkdirSync(path.dirname(log), { recursive: true })
  fs.writeFileSync(log, '# Existing worklog\n\nKeep this history byte for byte.')
  const before = fs.readFileSync(log, 'utf8')
  const plan = library.buildBeadsIngestPlan(input)
  const outcome = library.ingestReviewResult({ ...input, execute: true, runner: fake.runner })
  assert.equal(outcome.status, 'ingested')
  assert.deepEqual(
    fake.calls.map(({ argv }) => argv),
    [[...route, 'bd', 'show', bead, '--json'], plan.gcArgv],
  )
  for (const { options } of fake.calls) {
    assert.deepEqual(options, {
      cwd: input.root,
      shell: false,
      encoding: 'utf8',
      timeout: 30000,
      killSignal: 'SIGKILL',
      env: {
        GC_HOME: '/home/loucmane/gascity/home',
        PATH: '/home/loucmane/gascity/bin:/usr/local/bin:/usr/bin:/bin',
      },
    })
  }
  assert.equal(fs.readFileSync(log, 'utf8'), before + plan.worklog.entry)
  assert.equal(
    plan.worklog.entry,
    [
      '',
      '',
      '### Skill review: cross-agent-skill-platform / ingestion-review.1',
      '',
      'Classification: internal project evidence.',
      '',
      `- Bead: \` ${bead} \``,
      '- Review ID: ` ingestion-review.1 `',
      `- Head SHA: \` ${validResult().headSha} \``,
      '- Mode: advisory; verdict: warn',
      '- Findings: info=1, warning=1, error=1; blocking=1, advisory=2',
      `- Evidence: \` ${resultPath} \``,
      `- Result SHA-256: \` ${plan.receipt.sha256} \``,
      `- Beads metadata: \` ${plan.metadataKey} \``,
      '- This receipt records validated structure and supplied claims; it does not verify evidence truth.',
      '',
    ].join('\n'),
  )
})

test('creates the default worklog only after a successful update', (t) => {
  const input = fixture(t)
  const fake = recordingRunner()
  const result = library.ingestReviewResult({
    ...input,
    execute: true,
    runner: (...args) => {
      assert.equal(fs.existsSync(path.join(input.root, 'docs')), false)
      return fake.runner(...args)
    },
  })
  assert.equal(
    fs.readFileSync(path.join(input.root, result.worklog.path), 'utf8'),
    result.worklog.entry,
  )
})

test('accepts explicit city, rig and worklog overrides as individual arguments', (t) => {
  const input = fixture(t)
  const options = parseIngestionArgs([
    resultPath,
    '--bead',
    bead,
    '--city',
    '/srv/city with spaces',
    '--rig',
    'review-rig',
    '--worklog',
    'docs/worklog/reviews/custom.md',
    '--execute',
  ])
  const fake = recordingRunner()
  const result = library.ingestReviewResult({ ...options, root: input.root, runner: fake.runner })
  assert.deepEqual(fake.calls[0].argv.slice(0, 5), [
    route[0],
    '--city',
    '/srv/city with spaces',
    '--rig',
    'review-rig',
  ])
  assert.equal(result.worklog.path, 'docs/worklog/reviews/custom.md')
  assert.equal(
    fs.readFileSync(path.join(input.root, result.worklog.path), 'utf8'),
    result.worklog.entry,
  )
})

for (const [name, change, reason] of [
  [
    'invalid schema',
    (v) => {
      v.mode = 'enforced'
    },
    /mode must remain advisory/,
  ],
  [
    'subjective blocking finding',
    (v) => {
      v.findings[0].blocking = true
    },
    /subjective finding blocking/,
  ],
  [
    'unknown blocking category',
    (v) => {
      v.findings[1].category = 'editorial-taste'
    },
    /deterministic allowlisted category/,
  ],
  [
    'missing head SHA',
    (v) => {
      delete v.headSha
    },
    /headSha/,
  ],
]) {
  test(`rejects ${name} before any command or worklog write`, (t) => {
    const review = validResult()
    change(review)
    const input = fixture(t, review)
    const fake = recordingRunner()
    assert.throws(
      () => library.ingestReviewResult({ ...input, execute: true, runner: fake.runner }),
      reason,
    )
    assert.deepEqual(fake.calls, [])
    assert.equal(fs.existsSync(path.join(input.root, 'docs')), false)
  })
}

test('accepts each existing deterministic category without promoting advisory findings', (t) => {
  const input = fixture(t)
  for (const category of blockingEligibleCategories) {
    const review = validResult()
    review.findings[1].category = category
    fs.writeFileSync(path.join(input.root, resultPath), JSON.stringify(review))
    assert.equal(library.buildBeadsIngestPlan(input).receipt.findings.blocking, 1)
    review.findings[1].blocking = false
    fs.writeFileSync(path.join(input.root, resultPath), JSON.stringify(review))
    assert.equal(library.buildBeadsIngestPlan(input).receipt.findings.blocking, 0)
  }
})

for (const [name, override, reason] of [
  ['missing bead', { bead: undefined }, /--bead/],
  ['option-like bead', { bead: '--all' }, /--bead/],
  ['outside result', { resultPath: 'outside.json' }, /beneath reports\/agent-skills/],
  [
    'result traversal',
    { resultPath: 'reports/agent-skills/../outside.json' },
    /beneath reports\/agent-skills/,
  ],
  [
    'reports sibling',
    { resultPath: 'reports/agent-skills-other/file.json' },
    /beneath reports\/agent-skills/,
  ],
  ['worklog traversal', { worklog: 'docs/worklog/../../.aegis/log.md' }, /beneath docs\/worklog/],
  ['worklog control character', { worklog: 'docs/worklog/new\nentry.md' }, /control characters/],
  ['option-like rig', { rig: '--all' }, /--rig/],
  ['relative city', { city: 'elsewhere' }, /--city/],
]) {
  test(`rejects ${name} without running commands or creating a worklog`, (t) => {
    const input = fixture(t)
    const fake = recordingRunner()
    assert.throws(
      () =>
        library.ingestReviewResult({ ...input, ...override, execute: true, runner: fake.runner }),
      reason,
    )
    assert.deepEqual(fake.calls, [])
    assert.equal(fs.existsSync(path.join(input.root, 'docs')), false)
  })
}

test('rejects invalid JSON before invoking the runner', (t) => {
  const input = fixture(t)
  fs.writeFileSync(path.join(input.root, resultPath), '{')
  const fake = recordingRunner()
  assert.throws(
    () => library.ingestReviewResult({ ...input, execute: true, runner: fake.runner }),
    SyntaxError,
  )
  assert.deepEqual(fake.calls, [])
  assert.equal(fs.existsSync(path.join(input.root, 'docs')), false)
})

for (const location of ['result', 'reports root', 'worklog', 'worklog parent']) {
  test(`rejects a symlink at the ${location} before invoking the runner`, (t) => {
    const input = fixture(t)
    const outside = path.join(input.root, 'outside')
    fs.mkdirSync(outside)
    fs.writeFileSync(path.join(outside, 'file'), input.bytes)
    if (location === 'result') {
      fs.unlinkSync(path.join(input.root, resultPath))
      fs.symlinkSync(path.join(outside, 'file'), path.join(input.root, resultPath))
    } else if (location === 'reports root') {
      fs.renameSync(path.join(input.root, 'reports'), path.join(outside, 'reports'))
      fs.symlinkSync(path.join(outside, 'reports'), path.join(input.root, 'reports'))
    } else {
      fs.mkdirSync(path.join(input.root, 'docs/worklog'), { recursive: true })
      if (location === 'worklog')
        fs.symlinkSync(path.join(outside, 'file'), path.join(input.root, `docs/worklog/${bead}.md`))
      else {
        fs.rmdirSync(path.join(input.root, 'docs/worklog'))
        fs.symlinkSync(outside, path.join(input.root, 'docs/worklog'))
      }
    }
    const fake = recordingRunner()
    assert.throws(
      () => library.ingestReviewResult({ ...input, execute: true, runner: fake.runner }),
      /symlinks/,
    )
    assert.deepEqual(fake.calls, [])
    assert.equal(fs.readFileSync(path.join(outside, 'file'), 'utf8'), input.bytes)
  })
}

test('same-byte duplicate receipts are no-ops for object and string metadata', (t) => {
  const input = fixture(t)
  const plan = library.buildBeadsIngestPlan(input)
  for (const prior of [plan.receipt, JSON.stringify(plan.receipt)]) {
    const fake = recordingRunner({ id: bead, metadata: { [plan.metadataKey]: prior } })
    const result = library.ingestReviewResult({ ...input, execute: true, runner: fake.runner })
    assert.equal(result.status, 'already ingested')
    assert.deepEqual(
      fake.calls.map(({ argv }) => argv),
      [[...route, 'bd', 'show', bead, '--json']],
    )
    assert.equal(fs.existsSync(path.join(input.root, 'docs')), false)
  }
})

test('duplicate receipt with changed bytes refuses even when the parsed JSON is identical', (t) => {
  const input = fixture(t)
  const plan = library.buildBeadsIngestPlan(input)
  fs.appendFileSync(path.join(input.root, resultPath), '\n')
  const fake = recordingRunner({ id: bead, metadata: { [plan.metadataKey]: plan.receipt } })
  assert.throws(
    () => library.ingestReviewResult({ ...input, execute: true, runner: fake.runner }),
    /receipt conflict/,
  )
  assert.equal(fake.calls.length, 1)
  assert.equal(fs.existsSync(path.join(input.root, 'docs')), false)
})

test('a review ID that encodes to an existing key is refused, not treated as a duplicate', (t) => {
  const input = fixture(t)
  const plan = library.buildBeadsIngestPlan(input)
  const review = validResult()
  review.reviewId = 'ingestion_review.1'
  fs.writeFileSync(path.join(input.root, resultPath), JSON.stringify(review))
  const colliding = library.buildBeadsIngestPlan(input)
  assert.equal(colliding.metadataKey, plan.metadataKey)
  const prior = { ...plan.receipt, sha256: colliding.receipt.sha256 }
  const fake = recordingRunner({ id: bead, metadata: { [plan.metadataKey]: prior } })
  assert.throws(
    () => library.ingestReviewResult({ ...input, execute: true, runner: fake.runner }),
    /receipt conflict/,
  )
  assert.equal(fake.calls.length, 1)
  assert.equal(fs.existsSync(path.join(input.root, 'docs')), false)
})

test('only an identical stored receipt counts as already ingested', (t) => {
  const input = fixture(t)
  const plan = library.buildBeadsIngestPlan(input)
  const { findings: _findings, ...withoutFindings } = plan.receipt
  for (const prior of [
    withoutFindings,
    { ...plan.receipt, skill: 'cross_agent_skill_platform' },
    { ...plan.receipt, headSha: '0'.repeat(40) },
    { ...plan.receipt, evidence: 'reports/agent-skills/other.json' },
    { ...plan.receipt, extra: true },
  ]) {
    const fake = recordingRunner({ id: bead, metadata: { [plan.metadataKey]: prior } })
    assert.throws(
      () => library.ingestReviewResult({ ...input, execute: true, runner: fake.runner }),
      /receipt conflict/,
    )
    assert.equal(fake.calls.length, 1)
    assert.equal(fs.existsSync(path.join(input.root, 'docs')), false)
  }
})

test('a non-string stderr keeps the failure diagnostic', (t) => {
  const input = fixture(t)
  const runner = () => ({ status: 2, stdout: '', stderr: Object.create(null) })
  assert.throws(
    () => library.ingestReviewResult({ ...input, execute: true, runner }),
    /did not complete successfully \(2\); inspect the bead/,
  )
})

test('a different review ID has its own receipt key', (t) => {
  const input = fixture(t)
  const plan = library.buildBeadsIngestPlan(input)
  const review = validResult()
  review.reviewId = 'ingestion-review.2'
  fs.writeFileSync(path.join(input.root, resultPath), JSON.stringify(review))
  const fake = recordingRunner({ id: bead, metadata: { [plan.metadataKey]: plan.receipt } })
  const result = library.ingestReviewResult({ ...input, execute: true, runner: fake.runner })
  assert.equal(result.status, 'ingested')
  assert.notEqual(result.metadataKey, plan.metadataKey)
})

test('unreadable or ambiguous bead state never becomes permission to update', (t) => {
  const input = fixture(t)
  const plan = library.buildBeadsIngestPlan(input)
  for (const record of [
    null,
    [],
    [{ id: bead }, { id: bead }],
    { id: 'blog-other' },
    { id: bead, metadata: null },
    { id: bead, metadata: [] },
    { id: bead, metadata: { [plan.metadataKey]: '{' } },
    { id: bead, metadata: { [plan.metadataKey]: null } },
  ]) {
    const fake = recordingRunner(record)
    assert.throws(() =>
      library.ingestReviewResult({ ...input, execute: true, runner: fake.runner }),
    )
    assert.equal(fake.calls.length, 1)
    assert.equal(fs.existsSync(path.join(input.root, 'docs')), false)
  }
})

for (const operation of ['show', 'update']) {
  test(`a nonzero ${operation} result never appends a worklog`, (t) => {
    const input = fixture(t)
    const fake = recordingRunner()
    const runner = (command, args, options) => {
      const result = fake.runner(command, args, options)
      return args[5] === operation
        ? {
            status: 1,
            stdout: '',
            stderr: 'noise\nError: validation failed: invalid metadata key\n',
          }
        : result
    }
    assert.throws(
      () => library.ingestReviewResult({ ...input, execute: true, runner }),
      /did not complete successfully \(1\): Error: validation failed: invalid metadata key;/,
    )
    assert.equal(fake.calls.length, operation === 'show' ? 1 : 2)
    assert.equal(fs.existsSync(path.join(input.root, 'docs')), false)
  })
}

test('spawn errors and interrupted commands are reported without an append', (t) => {
  const input = fixture(t)
  for (const outcome of [
    { error: new Error('synthetic EPERM') },
    { status: null, signal: 'SIGKILL' },
    { status: 0, stdout: '' },
  ]) {
    assert.throws(() =>
      library.ingestReviewResult({ ...input, execute: true, runner: () => outcome }),
    )
    assert.equal(fs.existsSync(path.join(input.root, 'docs')), false)
  }
})

test('an append error after update requires explicit coordinator reconciliation', (t) => {
  const input = fixture(t)
  const fake = recordingRunner()
  const runner = (command, args, options) => {
    const result = fake.runner(command, args, options)
    if (args[5] === 'update')
      fs.writeFileSync(path.join(input.root, 'docs'), 'synthetic obstruction')
    return result
  }
  assert.throws(
    () => library.ingestReviewResult({ ...input, execute: true, runner }),
    /Beads receipt recorded.*Coordinator must reconcile.*retry writes nothing/,
  )
  assert.equal(fake.calls.length, 2)
})

test('shell syntax in a filename stays data and review prose is not copied to sinks', (t) => {
  const review = validResult()
  review.summary = 'Untrusted prose\n$(do-not-run) `extra`'
  const input = fixture(t, review)
  const unusual = 'reports/agent-skills/receipt;$(do-not-run)`extra`.json'
  fs.renameSync(path.join(input.root, resultPath), path.join(input.root, unusual))
  const fake = recordingRunner()
  const result = library.ingestReviewResult({
    ...input,
    resultPath: unusual,
    execute: true,
    runner: fake.runner,
  })
  assert.equal(fake.calls[1].options.shell, false)
  assert.equal(fake.calls[1].argv.length, 12)
  assert.equal(result.summary.includes('\n'), false)
  assert.equal(result.summary.includes('Untrusted prose'), false)
  assert.ok(result.worklog.entry.includes('`` ' + unusual + ' ``'))
})

test('CLI rejects missing, unknown, duplicate and conflicting arguments', () => {
  for (const args of [
    [],
    [resultPath],
    [resultPath, '--bead'],
    [resultPath, '--unknown'],
    [resultPath, '--bead', bead, '--execute', '--dry-run'],
    [resultPath, '--bead', bead, '--bead', bead],
    [resultPath, '--bead', bead, '--execute', '--execute'],
    [resultPath, '--bead', bead, 'extra.json'],
    [resultPath, '--bead', bead, '--worklog', '--execute'],
  ])
    assert.throws(() => parseIngestionArgs(args))
})
