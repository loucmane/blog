import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import { blockingEligibleCategories } from './routing.mjs'

const registryPath = 'config/agent-skills/deterministic-checks.json'
const receiptsRoot = 'reports/agent-skills/receipts'
const checkIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const headPattern = /^[0-9a-f]{40}$/
const hashPattern = /^[0-9a-f]{64}$/
const receiptFields = [
  'schemaVersion',
  'checkId',
  'argv',
  'headSha',
  'cleanTree',
  'exitCode',
  'startedAt',
  'finishedAt',
  'outputSha256',
]
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')

// Both readers and writers reject links in every repository-relative component.
// The repository itself is the trusted root; receipts never select arbitrary files.
function checkedPath(root, relativePath, { writable = false } = {}) {
  let current = root
  const parts = relativePath.split('/')
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part)
    let stat
    try {
      stat = fs.lstatSync(current)
    } catch (error) {
      if (writable && error.code === 'ENOENT') continue
      throw error
    }
    if (stat.isSymbolicLink()) throw new Error('Deterministic evidence must not traverse symlinks')
    if (index < parts.length - 1 ? !stat.isDirectory() : !stat.isFile()) {
      throw new Error('Deterministic evidence must name a regular file beneath directories')
    }
  }
  return current
}

export function loadDeterministicChecks(root = process.cwd()) {
  const registry = JSON.parse(fs.readFileSync(checkedPath(root, registryPath), 'utf8'))
  if (
    registry?.schemaVersion !== 1 ||
    !record(registry.checks) ||
    !Object.keys(registry.checks).length
  ) {
    throw new Error('Invalid deterministic check registry')
  }
  for (const [id, check] of Object.entries(registry.checks)) {
    if (
      !checkIdPattern.test(id) ||
      id.trim() !== id ||
      !record(check) ||
      !Array.isArray(check.argv) ||
      check.argv.length === 0 ||
      check.argv.some((arg) => typeof arg !== 'string' || !arg || /[\x00-\x1f\x7f]/.test(arg)) ||
      !Array.isArray(check.categories) ||
      check.categories.length === 0 ||
      check.categories.some((category) => !blockingEligibleCategories.includes(category)) ||
      new Set(check.categories).size !== check.categories.length ||
      !Number.isSafeInteger(check.timeoutMs) ||
      check.timeoutMs < 1 ||
      check.timeoutMs > 3600000
    )
      throw new Error(`Invalid deterministic check registration: ${id}`)
  }
  return registry.checks
}

function receiptPath(checkId, headSha) {
  return `${receiptsRoot}/${checkId}-${headSha}.json`
}

function validTime(value) {
  return (
    typeof value === 'string' &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  )
}

// Called only after structural review validation. It neither executes a check
// nor promotes any advisory finding. All cited receipts must be consistent.
export function verifyBlockingReceipts(result, { root = process.cwd() } = {}) {
  const blocking = result.findings.filter((finding) => finding.blocking)
  if (!blocking.length) return []
  for (const finding of blocking) {
    if (finding.subjective || !blockingEligibleCategories.includes(finding.category)) {
      throw new Error(`Finding ${finding.id} is not eligible to block`)
    }
    if (!finding.evidence.some((evidence) => evidence.startsWith('receipt:'))) {
      throw new Error(`Blocking finding ${finding.id} requires a deterministic receipt:<path>`)
    }
  }
  const checks = loadDeterministicChecks(root)
  const verified = []
  for (const finding of blocking) {
    const references = [
      ...new Set(finding.evidence.filter((value) => value.startsWith('receipt:'))),
    ]
    for (const reference of references) {
      const relativePath = reference.slice('receipt:'.length)
      if (
        /[\x00-\x1f\x7f]/.test(relativePath) ||
        !/^reports\/agent-skills\/receipts\/[a-z0-9-]+-[0-9a-f]{40}\.json$/.test(relativePath)
      ) {
        throw new Error(`Invalid deterministic receipt path for finding ${finding.id}`)
      }
      const bytes = fs.readFileSync(checkedPath(root, relativePath))
      const receipt = JSON.parse(bytes.toString('utf8'))
      if (
        !record(receipt) ||
        receipt.schemaVersion !== 1 ||
        typeof receipt.checkId !== 'string' ||
        !checkIdPattern.test(receipt.checkId) ||
        !Object.hasOwn(checks, receipt.checkId)
      )
        throw new Error(`Unregistered deterministic check in receipt for ${finding.id}`)
      const check = checks[receipt.checkId]
      if (!check.categories.includes(finding.category)) {
        throw new Error(
          `Receipt check ${receipt.checkId} does not permit category ${finding.category}`,
        )
      }
      if (receipt.headSha !== result.headSha)
        throw new Error('Deterministic receipt headSha is stale')
      if (relativePath !== receiptPath(receipt.checkId, receipt.headSha)) {
        throw new Error('Deterministic receipt filename does not match its checkId and headSha')
      }
      if (!isDeepStrictEqual(receipt.argv, check.argv))
        throw new Error('Deterministic receipt argv mismatch')
      if (!Number.isInteger(receipt.exitCode) || receipt.exitCode < 1 || receipt.exitCode > 255) {
        throw new Error('Blocking receipt requires a completed nonzero exit code')
      }
      if (
        Object.keys(receipt).some((key) => !receiptFields.includes(key)) ||
        typeof receipt.cleanTree !== 'boolean' ||
        typeof receipt.outputSha256 !== 'string' ||
        receipt.outputSha256.length !== 64 ||
        !hashPattern.test(receipt.outputSha256) ||
        !validTime(receipt.startedAt) ||
        !validTime(receipt.finishedAt) ||
        Date.parse(receipt.finishedAt) < Date.parse(receipt.startedAt)
      )
        throw new Error('Malformed deterministic receipt execution metadata')
      verified.push({
        findingId: finding.id,
        path: relativePath,
        sha256: sha256(bytes),
        checkId: receipt.checkId,
        cleanTree: receipt.cleanTree,
      })
    }
  }
  return verified
}

export function runDeterministicCheck(
  checkId,
  { root = process.cwd(), runner = spawnSync, now = () => new Date() } = {},
) {
  root = path.resolve(root)
  const checks = loadDeterministicChecks(root)
  if (!Object.hasOwn(checks, checkId))
    throw new Error(`Unregistered deterministic check: ${checkId}`)
  const check = checks[checkId]
  const options = {
    cwd: root,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: check.timeoutMs,
    killSignal: 'SIGKILL',
    maxBuffer: 8 * 1024 * 1024,
    env: {
      PATH: `${path.dirname(process.execPath)}:/home/loucmane/.local/bin:/usr/local/bin:/usr/bin:/bin`,
      CI: 'true',
      LANG: 'C',
      LC_ALL: 'C',
      TZ: 'UTC',
      COREPACK_ENABLE_NETWORK: '0',
      NODE_DISABLE_COMPILE_CACHE: '1',
    },
  }
  const completed = (outcome) => {
    if (
      !outcome ||
      outcome.error ||
      outcome.signal ||
      !Number.isInteger(outcome.status) ||
      outcome.status < 0 ||
      outcome.status > 255 ||
      ![outcome.stdout, outcome.stderr].every(
        (value) => typeof value === 'string' || Buffer.isBuffer(value),
      )
    )
      throw new Error('Check execution did not complete; no deterministic receipt written')
    return outcome
  }
  const git = (args) => {
    const outcome = completed(
      runner('git', ['--no-optional-locks', ...args], { ...options, timeout: 10000 }),
    )
    if (outcome.status !== 0) throw new Error('Cannot establish Git head and clean-tree state')
    return outcome.stdout.toString('utf8')
  }
  const head = () => {
    const value = git(['rev-parse', '--verify', 'HEAD']).trim()
    if (!headPattern.test(value)) throw new Error('Cannot establish a valid Git head SHA')
    return value
  }
  const clean = () => git(['status', '--porcelain=v1', '--untracked-files=all']).length === 0
  const headSha = head()
  const cleanBefore = clean()
  const relativePath = receiptPath(checkId, headSha)
  const destination = checkedPath(root, relativePath, { writable: true })
  if (fs.existsSync(destination))
    throw new Error(`Deterministic receipt already exists: ${relativePath}`)
  const startedAt = now().toISOString()
  const outcome = completed(runner(check.argv[0], check.argv.slice(1), options))
  const finishedAt = now().toISOString()
  if (head() !== headSha) throw new Error('Git head changed during the check; no receipt written')
  const cleanAfter = clean()
  const receipt = {
    schemaVersion: 1,
    checkId,
    argv: check.argv,
    headSha,
    cleanTree: cleanBefore && cleanAfter,
    exitCode: outcome.status,
    startedAt,
    finishedAt,
    outputSha256: createHash('sha256').update(outcome.stdout).update(outcome.stderr).digest('hex'),
  }
  checkedPath(root, relativePath, { writable: true })
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  // Exclusive creation preserves an existing receipt if another run raced us.
  fs.writeFileSync(destination, `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx' })
  return { path: relativePath, receipt }
}
