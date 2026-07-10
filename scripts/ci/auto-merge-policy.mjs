#!/usr/bin/env node

import fs from 'node:fs'

export const AUTO_MERGE_LABEL = 'auto-merge'

export const REQUIRED_CHECKS = Object.freeze([
  'workspace · install · typecheck · lint · tests · build',
  'governance · Taskmaster · Aegis · guards',
  'security · dependency review',
  'security · gitleaks',
])

export const AUTO_MERGE_CHECK_NAME = 'controlled auto-merge'

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
  '.node-version',
  '.npmrc',
  '.nvmrc',
  '.tool-versions',
  'package-lock.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'turbo.json',
  'yarn.lock',
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
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    return null
  }
  return normalized
}

function pathExtension(path) {
  const filename = path.split('/').at(-1) ?? ''
  const dot = filename.lastIndexOf('.')
  return dot >= 0 ? filename.slice(dot).toLowerCase() : ''
}

function classifyPath(path) {
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
    CI_CONTROL_FILES.has(lower) ||
    filename === 'package.json' ||
    /^(eslint|jest|next|playwright|prettier|tsup|turbo|vite|vitest)\.config\./i.test(filename) ||
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
    /(^|[-_.])(credential|private[-_]?key|secret|token)([-_.]|$)/i.test(filename) ||
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
    ['db', 'database', 'ops', 'scripts'].some((segment) => segments.includes(segment)) &&
    /(^|[-_.])(delete|destroy|drop|purge|reset|truncate|wipe)([-_.]|$)/i.test(filename)
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

  if (
    lower.startsWith('.aegis/') ||
    lower.startsWith('.agents/') ||
    lower.startsWith('.claude/') ||
    AEGIS_PROTECTED_PATHS.has(path) ||
    /^scripts\/(aegis|codex)([-_/]|$)/i.test(path)
  ) {
    categories.add('aegis-retirement')
  }

  return [...categories].sort()
}

export function classifyPullRequest(input = {}) {
  const files = Array.isArray(input.files) ? input.files : []
  const labels = Array.isArray(input.labels)
    ? [...new Set(input.labels.map(normalizeLabel).filter(Boolean))].sort()
    : []
  const reasons = []

  if (!labels.includes(AUTO_MERGE_LABEL)) {
    reasons.push({ category: 'missing-auto-merge-label', label: AUTO_MERGE_LABEL })
  }

  for (const label of labels) {
    const category = DENY_LABELS.get(label)
    if (category) {
      reasons.push({ category, label })
    }
  }

  if (files.length === 0) {
    reasons.push({ category: 'empty-or-incomplete-file-list' })
  }

  const normalizedFiles = []
  for (const rawPath of files) {
    const path = normalizePath(rawPath)
    if (!path) {
      reasons.push({ category: 'invalid-path', path: String(rawPath) })
      continue
    }
    normalizedFiles.push(path)
    for (const category of classifyPath(path)) {
      reasons.push({ category, path })
    }
  }

  return {
    decision: reasons.length === 0 ? 'allow' : 'deny',
    files: [...new Set(normalizedFiles)].sort(),
    labels,
    reasons,
  }
}

function flattenCheckRuns(input) {
  if (Array.isArray(input.check_runs)) {
    return input.check_runs
  }
  if (!Array.isArray(input.pages)) {
    return []
  }
  return input.pages.flatMap((page) => (Array.isArray(page?.check_runs) ? page.check_runs : []))
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
  return candidateTimestamp > currentTimestamp ||
    (candidateTimestamp === currentTimestamp && candidateId > currentId)
}

export function evaluateRequiredChecks(input = {}) {
  const required = Array.isArray(input.required) && input.required.length > 0
    ? [...new Set(input.required.map(String))]
    : [...REQUIRED_CHECKS]
  const excludedNames = new Set(
    Array.isArray(input.excluded_names)
      ? input.excluded_names.map(String)
      : [AUTO_MERGE_CHECK_NAME],
  )
  const requiredAppSlug = String(input.required_app_slug ?? 'github-actions')
  const runs = flattenCheckRuns(input).filter(
    (check) => check && typeof check === 'object' && !excludedNames.has(String(check.name ?? '')),
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

  const denied = checks.filter((check) => ['failed', 'wrong-app'].includes(check.state))
  const deferred = checks.filter((check) => ['missing', 'pending'].includes(check.state))
  const decision = denied.length > 0 ? 'deny' : deferred.length > 0 ? 'defer' : 'allow'

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
    throw new Error('usage: auto-merge-policy.mjs <classify|checks> --input <json-file>')
  }
  return JSON.parse(fs.readFileSync(argv[inputIndex + 1], 'utf8'))
}

const invokedPath = process.argv[1] ? new URL(`file://${process.argv[1]}`).href : ''
if (import.meta.url === invokedPath) {
  try {
    const command = process.argv[2]
    const input = parseCliInput(process.argv.slice(3))
    const result = command === 'classify'
      ? classifyPullRequest(input)
      : command === 'checks'
        ? evaluateRequiredChecks(input)
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
