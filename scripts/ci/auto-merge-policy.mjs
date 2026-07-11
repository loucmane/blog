#!/usr/bin/env node

import fs from 'node:fs'

export const REQUIRED_CHECKS = Object.freeze([
  'workspace · install · typecheck · lint · tests · build',
  'governance · Taskmaster · Aegis · guards',
  'security · dependency review',
  'security · gitleaks',
])

export const AUTO_MERGE_CHECK_NAME = 'controlled auto-merge'
export const AEGIS_FOUNDATION_MANIFEST_PATH =
  '.aegis/foundation-manifest.json'

const DENY_LABELS = new Map([
  ['authority-change', 'operator-authority'],
  ['aegis-retirement', 'aegis-retirement'],
  ['branch-protection', 'branch-protection'],
  ['ci-governance', 'ci-governance'],
  ['database-migration', 'migration'],
  ['deployment', 'production-deployment'],
  ['destructive', 'destructive-operation'],
  ['high-risk', 'high-risk'],
  ['manual-merge', 'manual-merge'],
  ['production-deployment', 'production-deployment'],
  ['secrets', 'secret-material'],
  ['security', 'security-sensitive'],
  ['workflow-permissions', 'workflow-permissions'],
])

const AEGIS_PROTECTED_PATHS = new Set([
  'AGENTS.md',
  'CLAUDE.md',
  'CODEX.md',
  'docs/ai/AEGIS_AUTONOMY_GRANT.md',
])

const CI_CONTROL_FILES = new Set([
  '.gitleaksignore',
  '.gitleaks.toml',
  '.npmrc',
])

const PROTECTED_AGENT_SKILL_PREFIXES = Object.freeze([
  '.agents/skills/cross-agent-skill-platform',
  '.claude/skills/cross-agent-skill-platform',
])

const DEPLOYMENT_FILES = new Set([
  'Dockerfile',
  'Procfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  'fly.toml',
  'netlify.toml',
  'render.yaml',
  'vercel.json',
  'wrangler.toml',
])

const DEPLOYMENT_SEGMENTS = new Set([
  '.netlify',
  '.vercel',
  'ansible',
  'deploy',
  'deployment',
  'helm',
  'infra',
  'infrastructure',
  'k8s',
  'kubernetes',
  'pulumi',
  'terraform',
])

const SECRET_EXTENSIONS = new Set([
  '.jks',
  '.kdbx',
  '.key',
  '.keystore',
  '.p12',
  '.pem',
  '.pfx',
])

function normalizeLabel(label) {
  if (typeof label === 'string') {
    return label.trim().toLowerCase()
  }
  if (label && typeof label === 'object' && typeof label.name === 'string') {
    return label.name.trim().toLowerCase()
  }
  return ''
}

function normalizePath(path) {
  if (typeof path !== 'string' || path.includes('\0')) {
    return null
  }
  const normalized = path.replaceAll('\\', '/').replace(/^\.\//, '').trim()
  if (!normalized || normalized.startsWith('/')) {
    return null
  }
  const segments = normalized.split('/')
  if (
    segments.some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    return null
  }
  return normalized
}

function pathExtension(path) {
  const filename = path.split('/').at(-1) ?? ''
  const dot = filename.lastIndexOf('.')
  return dot >= 0 ? filename.slice(dot).toLowerCase() : ''
}

function isTestPath(path) {
  return (
    /(?:^|\/)(?:__tests__|tests?|specs?)(?:\/|$)/i.test(path) ||
    /(?:^|\/)[^/]+\.(?:test|spec)\.[^/]+$/i.test(path) ||
    /(?:^|\/)(?:test_[^/]+|[^/]+_test)\.[^/]+$/i.test(path)
  )
}

function isDomainSkillPath(path) {
  const lower = path.toLowerCase()
  const underSkillRoot =
    lower.startsWith('.agents/skills/') || lower.startsWith('.claude/skills/')
  if (!underSkillRoot) return false
  return !PROTECTED_AGENT_SKILL_PREFIXES.some(
    (prefix) => lower === prefix || lower.startsWith(`${prefix}/`),
  )
}

function requiredTestCapabilities(path) {
  const lower = path.toLowerCase()
  if (lower === 'pnpm-lock.yaml' || lower === 'package.json') {
    return ['unit', 'browser']
  }
  if (/\.(?:md|mdx|txt)$/i.test(lower)) return []
  if (lower.startsWith('packages/web/') || lower.startsWith('packages/ui/')) {
    return ['unit', 'browser']
  }
  if (
    lower.startsWith('packages/backend/') ||
    lower.startsWith('packages/shared/')
  ) {
    return ['unit']
  }
  if (lower.startsWith('apps/')) return ['unit', 'browser']
  return []
}

function normalizeFile(rawFile) {
  const filename = typeof rawFile === 'string' ? rawFile : rawFile?.filename
  const path = normalizePath(filename)
  if (!path) return null
  const status =
    typeof rawFile === 'object'
      ? String(rawFile?.status ?? '').toLowerCase()
      : ''
  const previousPath =
    status === 'renamed' ? normalizePath(rawFile?.previous_filename) : null
  return {
    path,
    previousPath,
    status,
  }
}

function classifyPath(path, options = {}) {
  const lower = path.toLowerCase()
  const segments = lower.split('/')
  const filename = segments.at(-1) ?? ''
  const categories = new Set()

  if (
    lower.startsWith('.github/workflows/') ||
    lower.startsWith('.github/actions/') ||
    lower === '.github/dependabot.yml' ||
    lower === '.github/dependabot.yaml' ||
    lower === '.github/codeowners'
  ) {
    categories.add('workflow-permissions')
  }

  if (
    lower.startsWith('scripts/ci/') ||
    lower.startsWith('tests/ci/') ||
    lower.startsWith('config/ci/') ||
    CI_CONTROL_FILES.has(lower) ||
    /^(eslint|jest|next|playwright|prettier|tsup|turbo|vite|vitest)\.config\./i.test(
      filename,
    ) ||
    /^tsconfig(?:\..+)?\.json$/i.test(filename)
  ) {
    categories.add('ci-governance')
  }

  if (
    segments.some(
      (segment) =>
        segment === '.env' ||
        segment.startsWith('.env.') ||
        segment === 'credentials' ||
        segment === 'secrets',
    ) ||
    /(^|[-_.])(credential|private[-_]?key|secret|token)([-_.]|$)/i.test(
      filename,
    ) ||
    SECRET_EXTENSIONS.has(pathExtension(path))
  ) {
    categories.add('secret-material')
  }

  if (
    DEPLOYMENT_FILES.has(path.split('/').at(-1) ?? '') ||
    segments.some((segment) => DEPLOYMENT_SEGMENTS.has(segment))
  ) {
    categories.add('production-deployment')
  }

  if (
    segments.includes('migrations') ||
    segments.includes('migration') ||
    /(^|[-_.])migration(s)?([-_.]|$)/i.test(filename)
  ) {
    categories.add('migration')
  }

  if (
    ['db', 'database', 'ops', 'scripts'].some((segment) =>
      segments.includes(segment),
    ) &&
    /(^|[-_.])(delete|destroy|drop|purge|reset|truncate|wipe)([-_.]|$)/i.test(
      filename,
    )
  ) {
    categories.add('destructive-operation')
  }

  if (
    lower.startsWith('.github/rulesets/') ||
    lower.includes('branch-protection') ||
    lower.includes('branch_protection')
  ) {
    categories.add('branch-protection')
  }

  const verifiedFoundationManifest =
    path === AEGIS_FOUNDATION_MANIFEST_PATH &&
    options.allowFoundationManifest === true

  if (
    (lower.startsWith('.aegis/') && !verifiedFoundationManifest) ||
    (lower.startsWith('.agents/') && !isDomainSkillPath(lower)) ||
    (lower.startsWith('.claude/') && !isDomainSkillPath(lower)) ||
    AEGIS_PROTECTED_PATHS.has(path) ||
    /^scripts\/(aegis|codex)([-_/]|$)/i.test(path)
  ) {
    categories.add('aegis-retirement')
  }

  return [...categories].sort()
}

function isJsonValue(value) {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return true
  }
  if (Array.isArray(value)) {
    return value.every(isJsonValue)
  }
  if (typeof value !== 'object') {
    return false
  }
  return Object.values(value).every(isJsonValue)
}

function isJsonObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`
  }
  if (isJsonObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function isRfc3339Timestamp(value) {
  if (typeof value !== 'string') return false
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/,
  )
  if (!match) return false

  const [, year, month, day, hour, minute, second] = match.map(Number)
  const localDate = new Date(0)
  localDate.setUTCFullYear(year, month - 1, day)
  localDate.setUTCHours(hour, minute, second, 0)

  return (
    localDate.getUTCFullYear() === year &&
    localDate.getUTCMonth() === month - 1 &&
    localDate.getUTCDate() === day &&
    Number.isFinite(Date.parse(value))
  )
}

function withoutVerificationTimestamp(manifest) {
  const copy = structuredClone(manifest)
  delete copy.verification.last_verified_at
  return copy
}

export function evaluateAegisManifestVerification(input = {}) {
  const entries = Array.isArray(input.entries) ? input.entries : []
  const results = []

  for (const entry of entries) {
    const path = normalizePath(entry?.path)
    const base = entry?.base
    const head = entry?.head
    let state = 'verification-timestamp-only'

    if (path !== AEGIS_FOUNDATION_MANIFEST_PATH) {
      state = path ? 'unexpected-path' : 'invalid-path'
    } else if (!isJsonObject(base) || !isJsonObject(head)) {
      state = 'missing-or-invalid-manifest'
    } else if (!isJsonValue(base) || !isJsonValue(head)) {
      state = 'non-json-manifest-value'
    } else if (
      !isJsonObject(base.verification) ||
      !isJsonObject(head.verification) ||
      !Object.hasOwn(base.verification, 'last_verified_at') ||
      !Object.hasOwn(head.verification, 'last_verified_at')
    ) {
      state = 'missing-verification-timestamp'
    } else {
      const baseTimestamp = base.verification.last_verified_at
      const headTimestamp = head.verification.last_verified_at
      if (
        !isRfc3339Timestamp(baseTimestamp) ||
        !isRfc3339Timestamp(headTimestamp)
      ) {
        state = 'invalid-verification-timestamp'
      } else if (headTimestamp === baseTimestamp) {
        state = 'unchanged-verification-timestamp'
      } else if (Date.parse(headTimestamp) <= Date.parse(baseTimestamp)) {
        state = 'non-monotonic-verification-timestamp'
      } else if (
        canonicalJson(withoutVerificationTimestamp(base)) !==
        canonicalJson(withoutVerificationTimestamp(head))
      ) {
        state = 'protected-manifest-values-changed'
      }
    }

    results.push({ path, state })
  }

  return {
    decision: results.every(
      (result) => result.state === 'verification-timestamp-only',
    )
      ? 'allow'
      : 'deny',
    results,
  }
}

function acceptedAegisManifestPaths(evidence) {
  if (evidence?.decision !== 'allow' || !Array.isArray(evidence.results)) {
    return new Set()
  }
  return new Set(
    evidence.results
      .filter(
        (result) =>
          result?.path === AEGIS_FOUNDATION_MANIFEST_PATH &&
          result?.state === 'verification-timestamp-only',
      )
      .map((result) => result.path),
  )
}

export function classifyPullRequest(input = {}) {
  const files = Array.isArray(input.files) ? input.files : []
  const labels = Array.isArray(input.labels)
    ? [...new Set(input.labels.map(normalizeLabel).filter(Boolean))].sort()
    : []
  const reasons = []
  const acceptedManifestPaths = acceptedAegisManifestPaths(
    input.aegis_manifest_verification,
  )

  for (const label of labels) {
    const category = DENY_LABELS.get(label)
    if (category) {
      reasons.push({ category, label })
    }
  }

  if (input.file_inventory_complete !== true) {
    reasons.push({ category: 'empty-or-incomplete-file-list' })
  }

  if (files.length === 0) {
    reasons.push({ category: 'empty-or-incomplete-file-list' })
  }

  const normalizedFiles = []
  for (const rawFile of files) {
    const file = normalizeFile(rawFile)
    if (!file) {
      reasons.push({
        category: 'invalid-path',
        path: String(typeof rawFile === 'object' ? rawFile?.filename : rawFile),
      })
      continue
    }
    const { path, previousPath, status } = file
    normalizedFiles.push(path)
    if (status === 'renamed' && !previousPath) {
      reasons.push({ category: 'invalid-previous-path', path })
    }
    const classifiedPaths = previousPath ? [path, previousPath] : [path]
    for (const classifiedPath of classifiedPaths) {
      const allowFoundationManifest =
        classifiedPath === path &&
        status === 'modified' &&
        !previousPath &&
        acceptedManifestPaths.has(path)
      for (const category of classifyPath(classifiedPath, {
        allowFoundationManifest,
      })) {
        reasons.push({ category, path: classifiedPath })
      }
      for (const capability of requiredTestCapabilities(classifiedPath)) {
        if (input.test_capabilities?.[capability] !== 'supported') {
          reasons.push({
            category: 'insufficient-test-capability',
            capability,
            path: classifiedPath,
          })
        }
      }
    }
    if (
      path === AEGIS_FOUNDATION_MANIFEST_PATH &&
      !(
        status === 'modified' &&
        !previousPath &&
        acceptedManifestPaths.has(path)
      )
    ) {
      const verificationState = Array.isArray(
        input.aegis_manifest_verification?.results,
      )
        ? input.aegis_manifest_verification.results.find(
            (result) => result?.path === path,
          )?.state
        : null
      reasons.push({
        category: 'aegis-manifest-verification',
        path,
        state: verificationState ?? 'missing-or-untrusted-evidence',
      })
    }
    if (
      ['removed', 'renamed'].includes(status) &&
      isTestPath(previousPath ?? path)
    ) {
      reasons.push({ category: 'test-removal', path: previousPath ?? path })
    }
  }

  return {
    decision: reasons.length === 0 ? 'allow' : 'deny',
    files: [...new Set(normalizedFiles)].sort(),
    labels,
    reasons,
  }
}

export function evaluatePackageScripts(input = {}) {
  const entries = Array.isArray(input.entries) ? input.entries : []
  const results = []
  for (const entry of entries) {
    const path = normalizePath(entry?.path)
    let state = 'unchanged'
    if (!path || !/(?:^|\/)package\.json$/i.test(path)) {
      state = 'invalid-path'
    } else if (!entry?.base || !entry?.head) {
      state = 'missing-manifest'
    } else if (
      JSON.stringify(entry.base.scripts ?? {}) !==
      JSON.stringify(entry.head.scripts ?? {})
    ) {
      state = 'scripts-changed'
    }
    results.push({ path, state })
  }
  return {
    decision: results.every((result) => result.state === 'unchanged')
      ? 'allow'
      : 'deny',
    results,
  }
}

function flattenCheckRuns(input) {
  if (Array.isArray(input.check_runs)) {
    return input.check_runs
  }
  if (!Array.isArray(input.pages)) {
    return []
  }
  return input.pages.flatMap((page) =>
    Array.isArray(page?.check_runs) ? page.check_runs : [],
  )
}

function checkRunOrder(check) {
  const completedAt = Date.parse(check?.completed_at ?? '')
  const startedAt = Date.parse(check?.started_at ?? '')
  const timestamp = Number.isFinite(completedAt)
    ? completedAt
    : Number.isFinite(startedAt)
      ? startedAt
      : 0
  const id = Number.isSafeInteger(Number(check?.id)) ? Number(check.id) : 0
  return [timestamp, id]
}

function isNewerCheck(candidate, current) {
  const [candidateTimestamp, candidateId] = checkRunOrder(candidate)
  const [currentTimestamp, currentId] = checkRunOrder(current)
  return (
    candidateTimestamp > currentTimestamp ||
    (candidateTimestamp === currentTimestamp && candidateId > currentId)
  )
}

export function evaluateRequiredChecks(input = {}) {
  const required =
    Array.isArray(input.required) && input.required.length > 0
      ? [...new Set(input.required.map(String))]
      : [...REQUIRED_CHECKS]
  const excludedNames = new Set(
    Array.isArray(input.excluded_names)
      ? input.excluded_names.map(String)
      : [AUTO_MERGE_CHECK_NAME],
  )
  const requiredAppSlug = String(input.required_app_slug ?? 'github-actions')
  const runs = flattenCheckRuns(input).filter(
    (check) =>
      check &&
      typeof check === 'object' &&
      !excludedNames.has(String(check.name ?? '')),
  )

  const latestByName = new Map()
  for (const check of runs) {
    const name = String(check.name ?? '')
    if (!name) {
      continue
    }
    const current = latestByName.get(name)
    if (!current || isNewerCheck(check, current)) {
      latestByName.set(name, check)
    }
  }

  const checks = []
  for (const name of required) {
    const check = latestByName.get(name)
    if (!check) {
      checks.push({ name, state: 'missing' })
      continue
    }
    const status = String(check.status ?? '')
    const conclusion = String(check.conclusion ?? '')
    const appSlug = String(check.app?.slug ?? '')
    let state = 'success'
    if (appSlug !== requiredAppSlug) {
      state = 'wrong-app'
    } else if (status !== 'completed') {
      state = 'pending'
    } else if (conclusion !== 'success') {
      state = 'failed'
    }
    checks.push({
      app_slug: appSlug || null,
      conclusion: conclusion || null,
      id: check.id ?? null,
      name,
      state,
      status: status || null,
    })
  }

  const denied = checks.filter((check) =>
    ['failed', 'wrong-app'].includes(check.state),
  )
  const deferred = checks.filter((check) =>
    ['missing', 'pending'].includes(check.state),
  )
  const decision =
    denied.length > 0 ? 'deny' : deferred.length > 0 ? 'defer' : 'allow'

  return {
    decision,
    checks,
    excluded_names: [...excludedNames].sort(),
    required,
    required_app_slug: requiredAppSlug,
  }
}

function parseCliInput(argv) {
  const inputIndex = argv.indexOf('--input')
  if (inputIndex < 0 || !argv[inputIndex + 1]) {
    throw new Error(
      'usage: auto-merge-policy.mjs <classify|checks|manifests|aegis-manifest> --input <json-file>',
    )
  }
  return JSON.parse(fs.readFileSync(argv[inputIndex + 1], 'utf8'))
}

const invokedPath = process.argv[1]
  ? new URL(`file://${process.argv[1]}`).href
  : ''
if (import.meta.url === invokedPath) {
  try {
    const command = process.argv[2]
    const input = parseCliInput(process.argv.slice(3))
    const result =
      command === 'classify'
        ? classifyPullRequest(input)
        : command === 'checks'
          ? evaluateRequiredChecks(input)
          : command === 'manifests'
            ? evaluatePackageScripts(input)
            : command === 'aegis-manifest'
              ? evaluateAegisManifestVerification(input)
            : null
    if (!result) {
      throw new Error(`unsupported command: ${command ?? '<missing>'}`)
    }
    process.stdout.write(`${JSON.stringify(result)}\n`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 2
  }
}
