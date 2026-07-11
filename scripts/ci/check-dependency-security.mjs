import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const severities = ['critical', 'high', 'moderate', 'low', 'info']

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

export function evaluateAudit(payload, auditExitCode = 0) {
  const summary = summarizeAudit(payload)
  const errors = []

  if (auditExitCode !== 0 && summary.total === 0) {
    errors.push(`pnpm audit exited ${auditExitCode} without reporting a vulnerability`)
  }
  if (summary.total > 0) {
    errors.push(`dependency policy requires zero known vulnerabilities; found ${summary.total}`)
  }

  return {
    ...summary,
    auditExitCode,
    errors,
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

  const report = {
    ...evaluateAudit(payload, result.status ?? 1),
    generatedAt: new Date().toISOString(),
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
