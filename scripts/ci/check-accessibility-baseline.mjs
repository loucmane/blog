#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const accessibilityBaselinePath = 'tests/e2e/accessibility-baseline.json'
const gitObjectShaPattern = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/
const metadataKeys = ['ownerTask', 'reason', 'removalCriteria']

function digest(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function parseBaseline(source, label) {
  let value
  try {
    value = JSON.parse(source)
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`, { cause: error })
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object`)
  }
  const expectedKeys = [...metadataKeys, 'projects'].sort()
  const actualKeys = Object.keys(value).sort()
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    throw new Error(`${label} must contain only ${expectedKeys.join(', ')}`)
  }
  for (const key of metadataKeys) {
    if (typeof value[key] !== 'string' || value[key].trim() === '') {
      throw new Error(`${label}.${key} must be a non-empty string`)
    }
  }
  if (!value.projects || typeof value.projects !== 'object' || Array.isArray(value.projects)) {
    throw new Error(`${label}.projects must be an object`)
  }
  const projectNames = Object.keys(value.projects).sort()
  if (projectNames.length === 0) throw new Error(`${label}.projects must not be empty`)

  const normalizedProjects = {}
  for (const projectName of projectNames) {
    const entries = value.projects[projectName]
    if (!Array.isArray(entries)) {
      throw new Error(`${label}.projects.${projectName} must be an array`)
    }
    const normalized = entries.map((entry, index) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        throw new Error(`${label}.projects.${projectName}[${index}] must be an object`)
      }
      if (
        JSON.stringify(Object.keys(entry).sort()) !== JSON.stringify(['id', 'impact', 'target'])
      ) {
        throw new Error(`${label}.projects.${projectName}[${index}] has an unexpected shape`)
      }
      if (typeof entry.id !== 'string' || entry.id.trim() === '') {
        throw new Error(`${label}.projects.${projectName}[${index}].id must be a non-empty string`)
      }
      if (entry.impact !== 'serious') {
        throw new Error(`${label}.projects.${projectName}[${index}].impact must equal serious`)
      }
      if (
        !Array.isArray(entry.target) ||
        entry.target.length === 0 ||
        entry.target.some((target) => typeof target !== 'string' || target.trim() === '')
      ) {
        throw new Error(`${label}.projects.${projectName}[${index}].target must contain strings`)
      }
      return JSON.stringify({ id: entry.id, impact: entry.impact, target: entry.target })
    })
    const sorted = [...normalized].sort()
    if (new Set(sorted).size !== sorted.length) {
      throw new Error(`${label}.projects.${projectName} contains duplicate fingerprints`)
    }
    if (JSON.stringify(normalized) !== JSON.stringify(sorted)) {
      throw new Error(`${label}.projects.${projectName} fingerprints must be sorted`)
    }
    normalizedProjects[projectName] = normalized
  }

  return {
    metadata: Object.fromEntries(metadataKeys.map((key) => [key, value[key]])),
    projects: normalizedProjects,
  }
}

export function evaluateAccessibilityBaseline({ baseSource, bootstrapSha256, headSource }) {
  const errors = []
  let head
  try {
    head = parseBaseline(headSource, 'head accessibility baseline')
  } catch (error) {
    return [error.message]
  }

  if (baseSource === null) {
    if (!/^[0-9a-f]{64}$/.test(bootstrapSha256 ?? '')) {
      errors.push('bootstrap requires an exact lowercase SHA-256 digest')
    } else if (digest(headSource) !== bootstrapSha256) {
      errors.push('bootstrap accessibility baseline digest does not match the reviewed bytes')
    }
    return errors
  }

  let base
  try {
    base = parseBaseline(baseSource, 'base accessibility baseline')
  } catch (error) {
    return [error.message]
  }

  if (JSON.stringify(head.metadata) !== JSON.stringify(base.metadata)) {
    errors.push('accessibility baseline metadata must remain unchanged')
  }
  const baseProjects = Object.keys(base.projects)
  const headProjects = Object.keys(head.projects)
  if (JSON.stringify(headProjects) !== JSON.stringify(baseProjects)) {
    errors.push('accessibility baseline project inventory must remain unchanged')
    return errors
  }
  for (const projectName of baseProjects) {
    const allowed = new Set(base.projects[projectName])
    for (const fingerprint of head.projects[projectName]) {
      if (!allowed.has(fingerprint)) {
        errors.push(`accessibility baseline may not add or rewrite ${projectName} fingerprints`)
      }
    }
  }
  return errors
}

export function evaluateAccessibilityTreeEntries({ allowMissing = false, entries, label }) {
  if (!Array.isArray(entries)) return [`${label} tree entries must be an array`]
  if (entries.length === 0) {
    return allowMissing ? [] : [`${label} accessibility baseline entry is missing`]
  }
  if (entries.length !== 1) {
    return [`${label} accessibility baseline entry is ambiguous`]
  }

  const entry = entries[0]
  const errors = []
  if (!entry || typeof entry !== 'object' || entry.malformed === true) {
    return [`${label} accessibility baseline tree entry is malformed`]
  }
  if (entry.path !== accessibilityBaselinePath) {
    errors.push(`${label} accessibility baseline tree path is unexpected`)
  }
  if (entry.mode !== '100644') {
    errors.push(`${label} accessibility baseline must have Git mode 100644`)
  }
  if (entry.type !== 'blob') {
    errors.push(`${label} accessibility baseline must be a Git blob`)
  }
  if (!gitObjectShaPattern.test(entry.oid ?? '')) {
    errors.push(`${label} accessibility baseline blob identifier is invalid`)
  }
  return errors
}

function argument(name) {
  const index = process.argv.indexOf(name)
  return index === -1 ? '' : (process.argv[index + 1] ?? '')
}

function runGit(arguments_, label, { allowFailure = false } = {}) {
  const result = spawnSync('git', arguments_, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  })
  if (result.error) throw new Error(`${label}: ${result.error.message}`, { cause: result.error })
  if (!allowFailure && result.status !== 0) {
    throw new Error(`${label}: ${result.stderr.trim() || `git exited ${result.status}`}`)
  }
  return result
}

function requireCommit(ref, label) {
  if (!gitObjectShaPattern.test(ref)) throw new Error(`${label} must be an exact commit SHA`)
  runGit(['cat-file', '-e', `${ref}^{commit}`], `${label} is not an available commit`)
}

function parseTreeEntries(source) {
  return source
    .split('\0')
    .filter(Boolean)
    .map((record) => {
      const match = record.match(/^([0-9]{6}) ([^ ]+) ([0-9a-f]{40}(?:[0-9a-f]{24})?)\t(.+)$/s)
      if (!match) return { malformed: true }
      return {
        mode: match[1],
        oid: match[3],
        path: match[4],
        type: match[2],
      }
    })
}

function readBaselineAtRef(ref, label, { allowMissing = false } = {}) {
  requireCommit(ref, `${label} ref`)
  const tree = runGit(
    ['ls-tree', '-z', ref, '--', accessibilityBaselinePath],
    `failed to inspect ${label} accessibility baseline tree`,
  )
  const entries = parseTreeEntries(tree.stdout)
  const entryErrors = evaluateAccessibilityTreeEntries({ allowMissing, entries, label })
  if (entryErrors.length > 0) throw new Error(entryErrors.join('; '))
  if (entries.length === 0) return { entry: null, source: null }

  const entry = entries[0]
  const objectType = runGit(
    ['cat-file', '-t', entry.oid],
    `failed to inspect ${label} accessibility baseline object`,
  ).stdout.trim()
  if (objectType !== 'blob') throw new Error(`${label} accessibility baseline object is not a blob`)
  const source = runGit(
    ['cat-file', 'blob', entry.oid],
    `failed to read ${label} accessibility baseline blob`,
  ).stdout
  return { entry, source }
}

function main() {
  const baseRef = argument('--base-ref').trim()
  const bootstrapSha256 = argument('--bootstrap-sha256').trim()
  const headRef = argument('--head-ref').trim()
  requireCommit(baseRef, 'base ref')
  requireCommit(headRef, 'head ref')
  if (baseRef === headRef) throw new Error('base and head refs must be different commits')
  const ancestry = runGit(
    ['merge-base', '--is-ancestor', baseRef, headRef],
    'base ref must be an ancestor of head ref',
    { allowFailure: true },
  )
  if (ancestry.status !== 0) throw new Error('base ref must be an ancestor of head ref')

  const base = readBaselineAtRef(baseRef, 'base', { allowMissing: true })
  const head = readBaselineAtRef(headRef, 'head')
  const errors = evaluateAccessibilityBaseline({
    baseSource: base.source,
    bootstrapSha256,
    headSource: head.source,
  })
  const report = {
    baseRef,
    baseTreeEntry: base.entry,
    errors,
    headRef,
    headSha256: digest(head.source),
    headTreeEntry: head.entry,
    mode: base.source === null ? 'reviewed-bootstrap' : 'base-ratchet',
    status: errors.length === 0 ? 'passed' : 'failed',
  }
  console.log(JSON.stringify(report, null, 2))
  if (errors.length > 0) process.exitCode = 1
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
