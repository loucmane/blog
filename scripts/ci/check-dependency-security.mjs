import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const severities = ['critical', 'high', 'moderate', 'low', 'info']
const exceptionFields = [
  'advisory',
  'module',
  'versions',
  'allowedPathPrefix',
  'devOnly',
  'expires',
  'reason',
  'approvedBy',
  'approvedOn',
]
const maxExceptions = 3
// pnpm stops recording paths for a finding at 100 (MAX_PATHS_PER_FINDING).
const pnpmPathLimit = 100

export function summarizeAudit(payload) {
  const sourceCounts = payload?.metadata?.vulnerabilities
  if (!sourceCounts || typeof sourceCounts !== 'object') {
    throw new Error('pnpm audit payload is missing metadata.vulnerabilities')
  }

  const counts = Object.fromEntries(severities.map(severity => {
    const value = sourceCounts[severity] ?? 0
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`pnpm audit returned an invalid ${severity} count`)
    }
    return [severity, value]
  }))
  const advisories = Object.values(payload.advisories ?? {})
    .map(advisory => ({
      id: advisory.id,
      moduleName: advisory.module_name,
      patchedVersions: advisory.patched_versions,
      severity: advisory.severity,
      vulnerableVersions: advisory.vulnerable_versions,
    }))
    .sort((left, right) =>
      `${left.severity}:${left.moduleName}:${left.id}`.localeCompare(
        `${right.severity}:${right.moduleName}:${right.id}`,
      ),
    )

  return {
    advisories,
    counts,
    total: Object.values(counts).reduce((sum, count) => sum + count, 0),
  }
}

function parseDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const day = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(day.getTime()) && day.toISOString().startsWith(value) ? day : null
}

function isText(value) {
  return typeof value === 'string' && value.trim() !== ''
}

function exceptionProblems(exception) {
  if (!exception || typeof exception !== 'object' || Array.isArray(exception)) {
    return ['must be an object']
  }
  const problems = [
    ...exceptionFields
      .filter(field => !Object.hasOwn(exception, field))
      .map(field => `is missing ${field}`),
    ...Object.keys(exception)
      .filter(field => !exceptionFields.includes(field))
      .map(field => `has unknown field ${field}`),
  ]
  if (problems.length > 0) return problems

  const { advisory, allowedPathPrefix, versions } = exception
  const expires = parseDay(exception.expires)
  const approvedOn = parseDay(exception.approvedOn)
  if (typeof advisory !== 'string' || !/^GHSA(?:-[0-9a-z]{4}){3}$/.test(advisory)) {
    problems.push('advisory must be a GHSA id as pnpm reports it, such as GHSA-vfj7-8cjw-p6xm')
  }
  if (!isText(exception.module)) problems.push('module must name a package')
  if (
    !Array.isArray(versions) ||
    versions.length === 0 ||
    new Set(versions).size !== versions.length ||
    !versions.every(version => typeof version === 'string' && /^\d+\.\d+\.\d+$/.test(version))
  ) {
    problems.push('versions must list unique exact x.y.z versions')
  }
  if (typeof allowedPathPrefix !== 'string' || !/^[^>\s]+(?:>[^>\s]+)+>$/.test(allowedPathPrefix)) {
    problems.push('allowedPathPrefix must name an importer and a dependency and end with ">"')
  }
  if (exception.devOnly !== true) {
    problems.push('devOnly must be true; only dev-only exceptions are supported')
  }
  if (!expires) problems.push('expires must be a YYYY-MM-DD date')
  if (!approvedOn) problems.push('approvedOn must be a YYYY-MM-DD date')
  else if (expires && approvedOn >= expires) problems.push('approvedOn must be before expires')
  if (!isText(exception.reason)) problems.push('reason must explain the exception')
  if (!isText(exception.approvedBy)) problems.push('approvedBy must name the approver')
  return problems
}

function exceptionLabel(exception) {
  return `${exception.advisory} exception for ${exception.module}`
}

function exceptionListErrors(exceptions, now) {
  if (!Array.isArray(exceptions)) return ['dependencySecurityExceptions must be an array']

  const errors = []
  if (exceptions.length > maxExceptions) {
    const count = exceptions.length
    errors.push(
      `dependencySecurityExceptions has ${count} entries; at most ${maxExceptions} are allowed`,
    )
  }
  const seen = new Set()
  exceptions.forEach((exception, index) => {
    const label = `dependencySecurityExceptions[${index}]`
    const problems = exceptionProblems(exception)
    errors.push(...problems.map(problem => `${label} ${problem}`))
    if (problems.length > 0) return

    const key = `${exception.advisory} for ${exception.module}`
    if (seen.has(key)) errors.push(`${label} duplicates ${key}`)
    seen.add(key)
    // An exception lapses at 00:00 UTC on its expires date.
    if (now >= parseDay(exception.expires)) {
      errors.push(
        `${exceptionLabel(exception)} expired on ${exception.expires}; remove or re-approve it`,
      )
    }
  })
  return errors
}

// pnpm 11 infers patched_versions from vulnerable_versions; it does not report a release.
// A `<=x.y.z` bound names the last affected version, which is how an advisory with no
// patched release reads, so the `>=x.y.(z+1)` that pnpm infers from it is not a known fix.
function patchedReleaseProblem(advisory, versions) {
  const patched = String(advisory.patched_versions ?? '').trim()
  if (patched === '' || patched === '<0.0.0') return null

  const vulnerable = String(advisory.vulnerable_versions ?? '').trim()
  const lastAffected = vulnerable.match(/(?:^|\s)<=\s*(\d+)\.(\d+)\.(\d+)$/)
  const [major, minor, patch] = lastAffected ? lastAffected.slice(1).map(Number) : []
  if (!lastAffected || patched !== `>=${major}.${minor}.${patch + 1}`) {
    return `the advisory reports patched versions ${patched} (vulnerable ${vulnerable}); upgrade`
  }
  const patchedListing = versions.find(version => {
    const [listedMajor, listedMinor, listedPatch] = version.split('.').map(Number)
    return (listedMajor - major || listedMinor - minor || listedPatch - patch) > 0
  })
  return patchedListing
    ? `listed version ${patchedListing} satisfies the patched range ${patched}`
    : null
}

function exceptionViolations(advisory, exception) {
  const findings = Array.isArray(advisory.findings) ? advisory.findings : []
  if (findings.length === 0) return ['pnpm audit reported no findings to verify']

  const violations = []
  for (const finding of findings) {
    const name = `${exception.module}@${finding?.version}`
    const paths = Array.isArray(finding?.paths) ? finding.paths : []
    if (!exception.versions.includes(finding?.version)) {
      violations.push(`${name} is not a listed version`)
    }
    if (exception.devOnly && finding?.dev !== true) {
      violations.push(`${name} is reachable outside devDependencies`)
    }
    if (paths.length === 0) violations.push(`${name} has no paths to verify`)
    if (paths.length >= pnpmPathLimit) {
      violations.push(`${name} lists ${paths.length} paths, pnpm's cap, so others may be missing`)
    }
    for (const findingPath of paths) {
      if (typeof findingPath !== 'string' || !findingPath.startsWith(exception.allowedPathPrefix)) {
        violations.push(`path ${findingPath} is outside ${exception.allowedPathPrefix}`)
      }
    }
  }
  const patchProblem = patchedReleaseProblem(advisory, exception.versions)
  if (patchProblem) violations.push(patchProblem)
  return violations
}

export function evaluateAudit(
  payload,
  auditExitCode = 0,
  { exceptions = [], now = new Date() } = {},
) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new Error('evaluateAudit needs a valid now date')
  }
  const summary = summarizeAudit(payload)
  const errors = []

  if (auditExitCode !== 0 && summary.total === 0) {
    errors.push(`pnpm audit exited ${auditExitCode} without reporting a vulnerability`)
  }

  const exceptionErrors = exceptionListErrors(exceptions, now)
  errors.push(...exceptionErrors)
  const usableExceptions = exceptionErrors.length === 0 ? exceptions : []
  const excepted = []
  for (const advisory of Object.values(payload.advisories ?? {})) {
    const exception = usableExceptions.find(
      entry =>
        entry.advisory === advisory.github_advisory_id && entry.module === advisory.module_name,
    )
    if (!exception) continue

    const violations = exceptionViolations(advisory, exception)
    if (violations.length > 0) {
      const label = exceptionLabel(exception)
      errors.push(...violations.map(violation => `${label} does not apply: ${violation}`))
      continue
    }
    excepted.push({
      advisory: exception.advisory,
      approvedBy: exception.approvedBy,
      approvedOn: exception.approvedOn,
      expires: exception.expires,
      id: advisory.id,
      module: exception.module,
      paths: advisory.findings.flatMap(finding => finding.paths),
      reason: exception.reason,
      severity: advisory.severity,
      versions: advisory.findings.map(finding => finding.version),
    })
  }

  const unexcepted = severities.map(
    severity =>
      summary.counts[severity] - excepted.filter(entry => entry.severity === severity).length,
  )
  if (unexcepted.some(count => count < 0)) {
    errors.push('pnpm audit counts do not account for every excepted advisory')
  }
  const remaining = unexcepted.reduce((sum, count) => sum + Math.max(count, 0), 0)
  if (remaining > 0) {
    errors.push(
      `dependency policy allows no vulnerabilities outside approved exceptions; found ${remaining}`,
    )
  }

  return {
    ...summary,
    auditExitCode,
    errors,
    excepted,
    policy: {
      critical: 0,
      high: 0,
      info: 0,
      low: 0,
      moderate: 0,
    },
    status: errors.length === 0 ? 'passed' : 'failed',
  }
}

function main() {
  const runtime = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'config/runtime.json'), 'utf8'),
  )
  const result = spawnSync('pnpm', ['audit', '--json'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  })

  if (result.error) {
    throw result.error
  }

  let payload
  try {
    payload = JSON.parse(result.stdout)
  } catch (error) {
    throw new Error(
      `pnpm audit did not return JSON: ${error.message}; stderr=${result.stderr.trim()}`,
    )
  }

  const now = new Date()
  const report = {
    ...evaluateAudit(payload, result.status ?? 1, {
      exceptions: runtime.dependencySecurityExceptions ?? [],
      now,
    }),
    generatedAt: now.toISOString(),
  }
  const artifactDirectory = path.join(process.cwd(), 'ci-artifacts')
  fs.mkdirSync(artifactDirectory, { recursive: true })
  fs.writeFileSync(
    path.join(artifactDirectory, 'dependency-security.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  )
  console.log(JSON.stringify(report, null, 2))

  if (report.status !== 'passed') {
    process.exitCode = 1
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null
if (invokedPath && import.meta.url === pathToFileURL(invokedPath).href) {
  main()
}
