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
// A registry version: x.y.z, an optional prerelease after "-", optional build metadata after "+".
const publishedVersionPattern = /^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/

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

// The vulnerable range must be one comparator set with a single x.y.z upper bound, such as
// "<=3.0.3" or ">=2.0.0 <2.0.3". Any other shape cannot bound a fix, so it yields null.
function vulnerableUpperBound(range) {
  const comparators = String(range ?? '')
    .trim()
    .replace(/([<>]=?)\s+/g, '$1')
    .split(/\s+/)
    .map(comparator => comparator.match(/^([<>]=?)(\d+)\.(\d+)\.(\d+)$/))
  const upper = comparators.filter(comparator => comparator?.[1].startsWith('<'))
  if (comparators.includes(null) || upper.length !== 1) return null
  const [, operator, ...version] = upper[0]
  return { inclusive: operator === '<=', version: version.map(Number) }
}

function compareVersions(left, right) {
  return left[0] - right[0] || left[1] - right[1] || left[2] - right[2]
}

// Advisory text does not change when a fix ships, and pnpm 11 infers patched_versions from
// vulnerable_versions, so neither proves that no fix exists. The registry does: no published
// release (prereleases aside) may lie above the advisory's vulnerable range.
function publishedReleaseProblem(advisory, moduleName, publishedVersions) {
  const unconfirmed = `cannot confirm that no patched ${moduleName} release exists`
  const range = advisory.vulnerable_versions
  const bound = vulnerableUpperBound(range)
  if (!bound) {
    const shown = JSON.stringify(range)
    return `${unconfirmed}: vulnerable range ${shown} has no single x.y.z upper bound`
  }

  let versions
  try {
    versions = publishedVersions(moduleName)
  } catch (error) {
    return `${unconfirmed}: ${error?.message ?? error}`
  }
  if (!Array.isArray(versions) || versions.length === 0) {
    return `${unconfirmed}: the registry returned no versions`
  }
  const releases = []
  for (const version of versions) {
    const match = typeof version === 'string' && version.match(publishedVersionPattern)
    if (!match) {
      return `${unconfirmed}: the registry listed an unreadable version ${JSON.stringify(version)}`
    }
    // A prerelease is not a fix to upgrade to.
    if (!match[4]) releases.push({ parts: match.slice(1, 4).map(Number), version })
  }
  const [fix] = releases
    .filter(release => {
      const order = compareVersions(release.parts, bound.version)
      return bound.inclusive ? order > 0 : order >= 0
    })
    .sort((left, right) => compareVersions(left.parts, right.parts))
  if (!fix) return null
  return (
    `${moduleName} ${fix.version} is published outside the vulnerable range ${range}; ` +
    'upgrade instead of excepting'
  )
}

function exceptionViolations(advisory, exception, publishedVersions) {
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
  const releaseProblem = publishedReleaseProblem(advisory, exception.module, publishedVersions)
  if (releaseProblem) violations.push(releaseProblem)
  return violations
}

// Without a registry lookup no exception can show that a fix is unpublished, so it fails closed.
function missingVersionLookup() {
  throw new Error('no published-version lookup was provided')
}

export function evaluateAudit(
  payload,
  auditExitCode = 0,
  { exceptions = [], now = new Date(), publishedVersions = missingVersionLookup } = {},
) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new Error('evaluateAudit needs a valid now date')
  }
  if (typeof publishedVersions !== 'function') {
    throw new Error('evaluateAudit needs a publishedVersions function')
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

    const violations = exceptionViolations(advisory, exception, publishedVersions)
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

export function fetchPublishedVersions(moduleName, run = spawnSync) {
  const command = `pnpm view ${moduleName} versions`
  const result = run('pnpm', ['view', moduleName, 'versions', '--json'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  })

  if (result.error) {
    throw result.error
  }
  if (result.status !== 0) {
    // pnpm 11 `view --json` prints its own errors as JSON on stdout, not stderr.
    const detail = (result.stderr.trim() || result.stdout.trim()).replace(/\s+/g, ' ')
    throw new Error(`${command} exited ${result.status}: ${detail}`)
  }

  let versions
  try {
    versions = JSON.parse(result.stdout)
  } catch (error) {
    throw new Error(`${command} did not return JSON: ${error.message}`, { cause: error })
  }
  // npm-style view prints a bare string for a package with a single version.
  return typeof versions === 'string' ? [versions] : versions
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
      publishedVersions: fetchPublishedVersions,
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
