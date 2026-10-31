import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  loadDeterministicChecks,
  runDeterministicCheck,
  verifyBlockingReceipts,
} from '../../scripts/agent-skills/receipts.mjs'
import { parseCheckArgs } from '../../scripts/agent-skills/run-check.mjs'
import { blockingEligibleCategories } from '../../scripts/agent-skills/routing.mjs'

const repository = fileURLToPath(new URL('../../', import.meta.url))
const registryPath = 'config/agent-skills/deterministic-checks.json'
const headSha = '0123456789abcdef0123456789abcdef01234567'
const checkId = 'agent-skills-platform'
const receiptPath = `reports/agent-skills/receipts/${checkId}-${headSha}.json`
const checkArgv = ['node', 'scripts/agent-skills/validate-platform.mjs']

function fixture(t) {
  const root = fs.mkdtempSync(path.join(repository, 'tests/agent-skills/.receipts-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  fs.mkdirSync(path.join(root, 'config/agent-skills'), { recursive: true })
  fs.copyFileSync(path.join(repository, registryPath), path.join(root, registryPath))
  return root
}

function injectedRun({ status = 1, heads = [headSha, headSha], dirty = ['', ''], outcome } = {}) {
  const calls = []
  let headIndex = 0
  let statusIndex = 0
  let clockIndex = 0
  return {
    calls,
    now: () => new Date(`2026-10-30T16:00:0${clockIndex++}.000Z`),
    runner(command, args, options) {
      calls.push({ argv: [command, ...args], options })
      if (command === 'git') {
        return {
          status: 0,
          stdout: args.includes('rev-parse') ? `${heads[headIndex++]}\n` : dirty[statusIndex++],
          stderr: '',
        }
      }
      return (
        outcome ?? {
          status,
          stdout: Buffer.from('check output\n'),
          stderr: Buffer.from('check diagnostic\n'),
        }
      )
    },
  }
}

function review(reference = `receipt:${receiptPath}`) {
  return {
    headSha,
    findings: [
      {
        id: 'schema',
        subjective: false,
        blocking: true,
        category: 'schema',
        evidence: [reference],
      },
    ],
  }
}

function writeReceipt(root, receipt) {
  fs.writeFileSync(path.join(root, receiptPath), JSON.stringify(receipt))
}

test('the shipped registry maps existing package commands to permitted categories', () => {
  const checks = loadDeterministicChecks(repository)
  const { scripts } = JSON.parse(fs.readFileSync(path.join(repository, 'package.json'), 'utf8'))
  assert.deepEqual(Object.keys(checks).sort(), [
    'agent-skills-ci',
    'agent-skills-platform',
    'format-check',
    'lint',
    'typecheck',
    'unit-capability',
  ])
  for (const check of Object.values(checks)) {
    assert.ok(check.categories.every((category) => blockingEligibleCategories.includes(category)))
    if (check.argv[0] === 'pnpm') assert.ok(Object.hasOwn(scripts, check.argv[1]))
    else
      assert.ok(
        Object.values(scripts).some((script) =>
          script.split(' && ').includes(check.argv.join(' ')),
        ),
      )
  }
  assert.deepEqual(checks['unit-capability'].argv, ['pnpm', 'test:capability', 'unit'])
})

test('runner records a completed failure, exact argv, Git head, timestamps and output digest', (t) => {
  const root = fixture(t)
  const fake = injectedRun()
  const result = runDeterministicCheck(checkId, { root, ...fake })
  assert.equal(result.path, receiptPath)
  assert.deepEqual(result.receipt, {
    schemaVersion: 1,
    checkId,
    argv: checkArgv,
    headSha,
    cleanTree: true,
    exitCode: 1,
    startedAt: '2026-10-30T16:00:00.000Z',
    finishedAt: '2026-10-30T16:00:01.000Z',
    outputSha256: createHash('sha256').update('check output\ncheck diagnostic\n').digest('hex'),
  })
  const bytes = fs.readFileSync(path.join(root, receiptPath))
  assert.deepEqual(JSON.parse(bytes), result.receipt)
  assert.deepEqual(
    fake.calls.map(({ argv }) => argv),
    [
      ['git', '--no-optional-locks', 'rev-parse', '--verify', 'HEAD'],
      ['git', '--no-optional-locks', 'status', '--porcelain=v1', '--untracked-files=all'],
      checkArgv,
      ['git', '--no-optional-locks', 'rev-parse', '--verify', 'HEAD'],
      ['git', '--no-optional-locks', 'status', '--porcelain=v1', '--untracked-files=all'],
    ],
  )
  for (const { options } of fake.calls) {
    assert.equal(options.cwd, root)
    assert.equal(options.shell, false)
    assert.deepEqual(options.stdio, ['ignore', 'pipe', 'pipe'])
    assert.equal(options.killSignal, 'SIGKILL')
    assert.equal(options.maxBuffer, 8 * 1024 * 1024)
    assert.deepEqual(options.env, {
      PATH: `${path.dirname(process.execPath)}:/home/loucmane/.local/bin:/usr/local/bin:/usr/bin:/bin`,
      CI: 'true',
      LANG: 'C',
      LC_ALL: 'C',
      TZ: 'UTC',
      COREPACK_ENABLE_NETWORK: '0',
      NODE_DISABLE_COMPILE_CACHE: '1',
    })
  }
  assert.equal(fake.calls[2].options.timeout, loadDeterministicChecks(root)[checkId].timeoutMs)
  assert.equal(fake.calls[0].options.timeout, 10000)
  assert.deepEqual(verifyBlockingReceipts(review(), { root }), [
    {
      findingId: 'schema',
      path: receiptPath,
      checkId,
      cleanTree: true,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    },
  ])
})

for (const dirty of [
  [' M changed.mjs\n', ''],
  ['', '?? new-file\n'],
]) {
  test(`dirty state before/after execution is retained: ${JSON.stringify(dirty)}`, (t) => {
    const root = fixture(t)
    const fake = injectedRun({ dirty })
    assert.equal(runDeterministicCheck(checkId, { root, ...fake }).receipt.cleanTree, false)
    assert.equal(verifyBlockingReceipts(review(), { root })[0].cleanTree, false)
  })
}

test('a passing run is recorded but cannot support a blocking finding', (t) => {
  const root = fixture(t)
  assert.equal(
    runDeterministicCheck(checkId, { root, ...injectedRun({ status: 0 }) }).receipt.exitCode,
    0,
  )
  assert.throws(() => verifyBlockingReceipts(review(), { root }), /completed nonzero/)
})

test('unknown checks and CLI overrides cannot execute arbitrary commands', (t) => {
  const root = fixture(t)
  const fake = injectedRun()
  assert.throws(() => runDeterministicCheck('arbitrary-command', { root, ...fake }), /Unregistered/)
  assert.deepEqual(fake.calls, [])
  assert.equal(parseCheckArgs([checkId]), checkId)
  for (const args of [
    [],
    ['--help'],
    [checkId, 'node'],
    [checkId, '--argv', 'something'],
    ['../script'],
    [`${checkId}\n`],
  ]) {
    assert.throws(() => parseCheckArgs(args), /usage:/)
  }
})

for (const [label, mutate] of [
  [
    'argv is a shell string',
    (v) => {
      v.argv = 'node arbitrary.mjs'
    },
  ],
  [
    'argv is empty',
    (v) => {
      v.argv = []
    },
  ],
  [
    'control characters',
    (v) => {
      v.argv = ['node\nscript']
    },
  ],
  [
    'subjective category',
    (v) => {
      v.categories = ['design']
    },
  ],
  [
    'empty categories',
    (v) => {
      v.categories = []
    },
  ],
  [
    'unbounded timeout',
    (v) => {
      v.timeoutMs = 0
    },
  ],
]) {
  test(`invalid registry is refused before execution: ${label}`, (t) => {
    const root = fixture(t)
    const registry = JSON.parse(fs.readFileSync(path.join(root, registryPath), 'utf8'))
    mutate(registry.checks[checkId])
    fs.writeFileSync(path.join(root, registryPath), JSON.stringify(registry))
    const fake = injectedRun()
    assert.throws(
      () => runDeterministicCheck(checkId, { root, ...fake }),
      /Invalid deterministic check/,
    )
    assert.deepEqual(fake.calls, [])
  })
}

for (const outcome of [
  { error: Object.assign(new Error('synthetic timeout'), { code: 'ETIMEDOUT' }), status: null },
  { error: Object.assign(new Error('synthetic spawn error'), { code: 'ENOENT' }), status: null },
  { error: Object.assign(new Error('synthetic truncated output'), { code: 'ENOBUFS' }), status: 1 },
  { signal: 'SIGKILL', status: null },
  { status: 1, stdout: null, stderr: '' },
]) {
  test(`incomplete execution cannot produce failure evidence: ${outcome.error?.code ?? outcome.signal ?? 'missing output'}`, (t) => {
    const root = fixture(t)
    assert.throws(
      () => runDeterministicCheck(checkId, { root, ...injectedRun({ outcome }) }),
      /did not complete/,
    )
    assert.equal(fs.existsSync(path.join(root, 'reports')), false)
  })
}

test('a moved or unreadable Git head cannot produce a receipt', (t) => {
  const root = fixture(t)
  for (const heads of [[headSha, 'f'.repeat(40)], [''], [headSha, '']]) {
    assert.throws(() => runDeterministicCheck(checkId, { root, ...injectedRun({ heads }) }), /head/)
    assert.equal(fs.existsSync(path.join(root, 'reports')), false)
  }
  assert.throws(
    () =>
      runDeterministicCheck(checkId, {
        root,
        runner: () => ({ status: 128, stdout: '', stderr: 'synthetic git error' }),
      }),
    /Cannot establish Git/,
  )
})

test('an existing check/head receipt is preserved without re-executing the check', (t) => {
  const root = fixture(t)
  runDeterministicCheck(checkId, { root, ...injectedRun() })
  const before = fs.readFileSync(path.join(root, receiptPath), 'utf8')
  const second = injectedRun()
  assert.throws(() => runDeterministicCheck(checkId, { root, ...second }), /already exists/)
  assert.equal(
    second.calls.some(({ argv }) => argv[0] !== 'git'),
    false,
  )
  assert.equal(fs.readFileSync(path.join(root, receiptPath), 'utf8'), before)
})

for (const [label, mutate, reason] of [
  [
    'forged argv',
    (v) => {
      v.argv = ['node', 'unregistered.mjs']
    },
    /argv mismatch/,
  ],
  [
    'stale head',
    (v) => {
      v.headSha = 'f'.repeat(40)
    },
    /headSha is stale/,
  ],
  [
    'unregistered check',
    (v) => {
      v.checkId = 'unregistered'
    },
    /Unregistered/,
  ],
  [
    'missing exit code',
    (v) => {
      delete v.exitCode
    },
    /completed nonzero/,
  ],
  [
    'string exit code',
    (v) => {
      v.exitCode = '1'
    },
    /completed nonzero/,
  ],
  [
    'signal exit',
    (v) => {
      v.exitCode = null
    },
    /completed nonzero/,
  ],
  [
    'missing dirty state',
    (v) => {
      delete v.cleanTree
    },
    /execution metadata/,
  ],
  [
    'invalid hash',
    (v) => {
      v.outputSha256 = ''
    },
    /execution metadata/,
  ],
  [
    'hash with newline',
    (v) => {
      v.outputSha256 += '\n'
    },
    /execution metadata/,
  ],
  [
    'invalid time',
    (v) => {
      v.startedAt = '2026-02-30T00:00:00.000Z'
    },
    /execution metadata/,
  ],
  [
    'time reversed',
    (v) => {
      v.finishedAt = '2026-10-29T00:00:00.000Z'
    },
    /execution metadata/,
  ],
  [
    'incomplete execution marker',
    (v) => {
      v.signal = 'SIGKILL'
    },
    /execution metadata/,
  ],
]) {
  test(`verification refuses ${label}`, (t) => {
    const root = fixture(t)
    const { receipt } = runDeterministicCheck(checkId, { root, ...injectedRun() })
    mutate(receipt)
    writeReceipt(root, receipt)
    assert.throws(() => verifyBlockingReceipts(review(), { root }), reason)
  })
}

test('missing receipt, missing citation and mismatched category are refused', (t) => {
  const root = fixture(t)
  assert.throws(() => verifyBlockingReceipts(review(), { root }), /ENOENT/)
  assert.throws(
    () => verifyBlockingReceipts(review('command: node check.mjs'), { root }),
    /requires.*receipt/,
  )
  runDeterministicCheck(checkId, { root, ...injectedRun() })
  const value = review()
  value.findings[0].category = 'security'
  assert.throws(() => verifyBlockingReceipts(value, { root }), /does not permit category security/)
})

test('all blocking findings and all cited receipts must verify', (t) => {
  const root = fixture(t)
  runDeterministicCheck(checkId, { root, ...injectedRun() })
  const value = review()
  value.findings.push({ ...value.findings[0], id: 'other', evidence: ['command: unchecked'] })
  assert.throws(() => verifyBlockingReceipts(value, { root }), /other requires/)
  value.findings.pop()
  value.findings[0].evidence.push(`receipt:reports/agent-skills/receipts/unknown-${headSha}.json`)
  assert.throws(() => verifyBlockingReceipts(value, { root }), /ENOENT/)
})

test('advisory findings need neither receipts nor a registry; subjective findings cannot block', (t) => {
  const root = fixture(t)
  fs.unlinkSync(path.join(root, registryPath))
  const value = review('receipt:an-unverified-advisory-reference')
  value.findings[0].subjective = true
  value.findings[0].blocking = false
  assert.deepEqual(verifyBlockingReceipts(value, { root }), [])
  value.findings[0].blocking = true
  assert.throws(() => verifyBlockingReceipts(value, { root }), /not eligible/)
})

test('paths cannot escape the receipt directory or substitute another receipt identity', (t) => {
  const root = fixture(t)
  runDeterministicCheck(checkId, { root, ...injectedRun() })
  for (const reference of [
    'receipt:/absolute.json',
    'receipt:../../elsewhere.json',
    `receipt:reports/agent-skills/receipts/../${checkId}-${headSha}.json`,
    `receipt:reports/agent-skills/receipts/${checkId}-${headSha}.json\n`,
  ])
    assert.throws(() => verifyBlockingReceipts(review(reference), { root }), /receipt path/)
  const otherPath = receiptPath.replace(checkId, 'other-check')
  fs.copyFileSync(path.join(root, receiptPath), path.join(root, otherPath))
  assert.throws(() => verifyBlockingReceipts(review(`receipt:${otherPath}`), { root }), /filename/)
})

for (const location of ['reports', 'reports/agent-skills/receipts', receiptPath, registryPath]) {
  test(`receipt readers and writers refuse a symlink at ${location}`, (t) => {
    const root = fixture(t)
    runDeterministicCheck(checkId, { root, ...injectedRun() })
    const outside = path.join(root, 'outside')
    fs.renameSync(path.join(root, location), outside)
    fs.symlinkSync(outside, path.join(root, location))
    assert.throws(() => verifyBlockingReceipts(review(), { root }), /symlinks/)
    const fake = injectedRun()
    assert.throws(() => runDeterministicCheck(checkId, { root, ...fake }), /symlinks/)
    assert.equal(
      fake.calls.some(({ argv }) => argv[0] !== 'git'),
      false,
    )
  })
}
