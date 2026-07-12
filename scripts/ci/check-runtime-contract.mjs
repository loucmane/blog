#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const trustedRuntimeYaml = Object.freeze({
  moduleRelativePath: 'package/dist/index.js',
  packageRelativePath: 'package',
  parserDirectoryName: 'runtime-contract-parser',
  tarballIntegrity:
    'sha512-2AvhNX3mb8zd6Zy7INTtSpl1F15HW6Wnqj0srWlkKLcpYl/gMIMJiyuGq2KeI2YFxUPjdlB+3Lc10seMLtL4cA==',
  tarballName: 'yaml-2.9.0.tgz',
  treeSha256: '78762e79d00fae948c123abae639ebd34970e5f4d44df664ec566a91077cb8b1',
})

function runtimeParserTreeDigest(packageRoot) {
  const hash = crypto.createHash('sha256')
  const separator = Buffer.from([0])
  const writeField = (value) => {
    hash.update(String(value))
    hash.update(separator)
  }
  const walk = (directory) => {
    const entries = fs
      .readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0))
    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name)
      const relativePath = path.relative(packageRoot, absolutePath).split(path.sep).join('/')
      if (entry.isDirectory()) {
        writeField('D')
        writeField(relativePath)
        walk(absolutePath)
      } else if (entry.isFile()) {
        const bytes = fs.readFileSync(absolutePath)
        const mode = fs.statSync(absolutePath).mode & 0o777
        writeField('F')
        writeField(relativePath)
        writeField(mode.toString(8))
        writeField(bytes.length)
        hash.update(bytes)
      } else {
        throw new Error(`trusted runtime parser contains unsupported entry ${relativePath}`)
      }
    }
  }
  walk(packageRoot)
  return hash.digest('hex')
}

function requireDirectory(absolutePath, label) {
  const stat = fs.lstatSync(absolutePath)
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new Error(`${label} must be a real directory, not a symlink or other object`)
  }
}

function requireRegularFile(absolutePath, label) {
  const stat = fs.lstatSync(absolutePath)
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error(`${label} must be a regular file, not a symlink or other object`)
  }
}

function resolveRuntimeYamlModule() {
  const configuredModule = process.env.RUNTIME_YAML_MODULE?.trim()
  if (!configuredModule) {
    if (process.env.GITHUB_ACTIONS === 'true') {
      throw new Error('RUNTIME_YAML_MODULE is required in GitHub Actions')
    }
    return 'yaml'
  }

  const runnerTemp = process.env.RUNNER_TEMP?.trim()
  if (!runnerTemp || !path.isAbsolute(runnerTemp)) {
    throw new Error('RUNNER_TEMP must be an absolute trusted-runner path')
  }
  const parserRoot = path.join(runnerTemp, trustedRuntimeYaml.parserDirectoryName)
  const packageRoot = path.join(parserRoot, trustedRuntimeYaml.packageRelativePath)
  const expectedModule = path.join(parserRoot, trustedRuntimeYaml.moduleRelativePath)
  const tarballPath = path.join(parserRoot, trustedRuntimeYaml.tarballName)
  if (configuredModule !== expectedModule) {
    throw new Error('RUNTIME_YAML_MODULE must equal the canonical trusted-runner parser path')
  }

  requireDirectory(parserRoot, 'runtime parser directory')
  requireDirectory(packageRoot, 'runtime parser package')
  requireDirectory(path.dirname(expectedModule), 'runtime parser distribution directory')
  requireRegularFile(expectedModule, 'runtime parser module')
  requireRegularFile(tarballPath, 'runtime parser tarball')

  const runnerTempReal = fs.realpathSync(runnerTemp)
  const parserRootReal = fs.realpathSync(parserRoot)
  const moduleReal = fs.realpathSync(expectedModule)
  if (
    path.dirname(parserRootReal) !== runnerTempReal ||
    moduleReal !== path.join(parserRootReal, trustedRuntimeYaml.moduleRelativePath)
  ) {
    throw new Error(
      'runtime parser realpath must remain inside the canonical trusted-runner directory',
    )
  }

  const tarballIntegrity = `sha512-${crypto
    .createHash('sha512')
    .update(fs.readFileSync(tarballPath))
    .digest('base64')}`
  if (tarballIntegrity !== trustedRuntimeYaml.tarballIntegrity) {
    throw new Error('runtime parser tarball integrity does not match the pinned official artifact')
  }
  if (runtimeParserTreeDigest(packageRoot) !== trustedRuntimeYaml.treeSha256) {
    throw new Error('runtime parser package tree does not match the pinned official artifact')
  }
  return pathToFileURL(moduleReal).href
}

const yamlModule = resolveRuntimeYamlModule()
const { isAlias, isMap, isScalar, parseDocument, visit } = await import(yamlModule)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const trustedCiFilePaths = [
  'scripts/ci/check-accessibility-baseline.mjs',
  'scripts/ci/check-runtime-contract.mjs',
  'scripts/ci/check-test-capability.mjs',
  'scripts/ci/check-test-results.mjs',
  'scripts/ci/post-merge-context.mjs',
  'tests/ci/accessibility-baseline.test.mjs',
  'tests/ci/eslint-contract.test.mjs',
  'tests/ci/runtime-contract.test.mjs',
  'tests/ci/security-hotfix.test.mjs',
  'tests/ci/test-capability.test.mjs',
  'tests/ci/test-results.test.mjs',
]

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nestedValue]) => [key, stableValue(nestedValue)]),
  )
}

function stableObject(value) {
  return stableValue(value ?? {})
}

function digest(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

export function scriptsDigest(scripts) {
  return digest(JSON.stringify(stableObject(scripts)))
}

export function packageScriptsDigest(packageJsons) {
  return digest(
    JSON.stringify(
      stableObject(
        Object.fromEntries(
          Object.entries(packageJsons).map(([packagePath, packageJson]) => [
            packagePath,
            packageJson.scripts ?? {},
          ]),
        ),
      ),
    ),
  )
}

export function dependencyDeclarationsDigest(packageJsons) {
  const fields = [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
    'peerDependenciesMeta',
  ]
  return digest(
    JSON.stringify(
      stableObject(
        Object.fromEntries(
          Object.entries(packageJsons).map(([packagePath, packageJson]) => [
            packagePath,
            Object.fromEntries(fields.map((field) => [field, packageJson[field] ?? {}])),
          ]),
        ),
      ),
    ),
  )
}

export function packageManifestSemanticsDigest(packageJsons) {
  return digest(
    JSON.stringify(
      stableObject(
        Object.fromEntries(
          Object.entries(packageJsons).map(([packagePath, packageJson]) => {
            const semantics = structuredClone(packageJson)
            delete semantics.scripts
            if (packagePath === 'package.json') {
              delete semantics.engines
              delete semantics.packageManager
              delete semantics.pnpm
            }
            return [packagePath, semantics]
          }),
        ),
      ),
    ),
  )
}

export function packageManagerDeclaration(runtime) {
  return `pnpm@${runtime.pnpm.version}+${runtime.pnpm.integrityAlgorithm}.${runtime.pnpm.integrityHex}`
}

function stripComment(source) {
  let singleQuoted = false
  let doubleQuoted = false
  let escaped = false

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    if (escaped) {
      escaped = false
      continue
    }
    if (character === '\\' && doubleQuoted) {
      escaped = true
      continue
    }
    if (character === "'" && !doubleQuoted) singleQuoted = !singleQuoted
    if (character === '"' && !singleQuoted) doubleQuoted = !doubleQuoted
    if (
      character === '#' &&
      !singleQuoted &&
      !doubleQuoted &&
      (index === 0 || /\s/.test(source[index - 1]))
    ) {
      return source.slice(0, index).trimEnd()
    }
  }
  return source.trimEnd()
}

function unquote(value) {
  const trimmed = value.trim()
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"')))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function parseMappingEntry(source) {
  const match = source.match(/^\s*(?:'([^']+)'|"([^"]+)"|([^:]+?))\s*:\s*(.*?)\s*$/)
  if (!match) return null
  return {
    key: (match[1] ?? match[2] ?? match[3]).trim(),
    value: unquote(match[4]),
  }
}

export function topLevelMapping(source, section) {
  const lines = source.split(/\r?\n/)
  const starts = lines
    .map((line, index) => ({ index, line: stripComment(line) }))
    .filter(({ line }) => line === `${section}:`)
  if (starts.length === 0) return {}
  if (starts.length !== 1) throw new Error(`${section} must appear exactly once`)

  const mapping = {}
  for (const rawLine of lines.slice(starts[0].index + 1)) {
    const line = stripComment(rawLine)
    if (!line.trim()) continue
    if (/^[^\s]/.test(line)) break
    if (!line.startsWith('  ') || line.startsWith('    ')) {
      throw new Error(`${section} must be a flat two-space mapping`)
    }
    const entry = parseMappingEntry(line.slice(2))
    if (!entry) throw new Error(`${section} contains an invalid mapping entry`)
    if (Object.hasOwn(mapping, entry.key)) {
      throw new Error(`${section} contains duplicate key ${entry.key}`)
    }
    mapping[entry.key] = entry.value
  }
  return stableObject(mapping)
}

function topLevelScalar(source, key) {
  const entries = source
    .split(/\r?\n/)
    .map(stripComment)
    .filter((line) => line && !/^\s/.test(line))
    .map(parseMappingEntry)
    .filter((entry) => entry?.key === key)
  if (entries.length !== 1) throw new Error(`${key} must appear exactly once`)
  return entries[0].value
}

function toPlainYaml(value) {
  if (value instanceof Map) {
    const object = Object.create(null)
    for (const [key, nestedValue] of value.entries()) {
      if (typeof key !== 'string') throw new Error('workflow mapping keys must be strings')
      Object.defineProperty(object, key, {
        configurable: true,
        enumerable: true,
        value: toPlainYaml(nestedValue),
        writable: true,
      })
    }
    return object
  }
  if (Array.isArray(value)) return value.map(toPlainYaml)
  return value
}

function parseWorkflow(source) {
  const document = parseDocument(source, {
    prettyErrors: false,
    schema: 'core',
    strict: true,
    uniqueKeys: true,
    version: '1.2',
  })
  const issues = [...document.errors, ...document.warnings]
  if (issues.length > 0) throw new Error(issues.map((issue) => issue.message).join('; '))

  visit(document, {
    Node(_key, node) {
      if (isAlias(node)) throw new Error('workflow YAML aliases are not supported')
      if (node.anchor) throw new Error('workflow YAML anchors are not supported')
      if (node.tag) throw new Error('workflow YAML explicit tags are not supported')
    },
    Pair(_key, pair) {
      if (!isScalar(pair.key) || typeof pair.key.value !== 'string') {
        throw new Error('workflow mapping keys must be plain scalar strings')
      }
      if (pair.key.value === '<<') {
        throw new Error('workflow YAML merge keys are not supported')
      }
    },
  })
  if (!isMap(document.contents)) throw new Error('workflow must contain one top-level mapping')

  return toPlainYaml(document.toJS({ mapAsMap: true, maxAliasCount: 0 }))
}

export function workflowSemanticsDigest(source) {
  return digest(JSON.stringify(stableObject(parseWorkflow(source))))
}

function workflowSteps(workflow) {
  return Object.values(workflow.jobs ?? {}).flatMap((job) =>
    Array.isArray(job.steps) ? job.steps : [],
  )
}

function parseActionReference(value) {
  const separator = value.lastIndexOf('@')
  if (separator <= 0) return { action: value, ref: '' }
  return { action: value.slice(0, separator), ref: value.slice(separator + 1) }
}

function actionReferences(workflows) {
  return workflows.flatMap(({ path: workflowPath, source }) => {
    const workflow = parseWorkflow(source)
    if (!workflow.jobs || typeof workflow.jobs !== 'object') {
      throw new Error(`${workflowPath} must contain a jobs mapping`)
    }
    const references = []
    for (const [jobName, job] of Object.entries(workflow.jobs)) {
      if (job.uses) {
        if (typeof job.uses !== 'string') {
          throw new Error(`${workflowPath}:${jobName} uses must be a string`)
        }
        references.push({
          ...parseActionReference(job.uses),
          location: `${workflowPath}:${jobName}`,
        })
      }
      for (const [stepIndex, step] of (job.steps ?? []).entries()) {
        if (step.uses) {
          if (typeof step.uses !== 'string') {
            throw new Error(`${workflowPath}:${jobName}:steps:${stepIndex} uses must be a string`)
          }
          references.push({
            ...parseActionReference(step.uses),
            location: `${workflowPath}:${jobName}:steps:${stepIndex}`,
          })
        }
      }
    }
    const parsedUsesCount = countMappingKey(workflow, 'uses')
    if (parsedUsesCount !== references.length) {
      throw new Error(`${workflowPath} contains an unsupported or ambiguous uses mapping`)
    }
    return references
  })
}

function countMappingKey(value, key) {
  if (Array.isArray(value)) {
    return value.reduce((total, nestedValue) => total + countMappingKey(nestedValue, key), 0)
  }
  if (!value || typeof value !== 'object') return 0
  return Object.entries(value).reduce(
    (total, [nestedKey, nestedValue]) =>
      total + (nestedKey === key ? 1 : 0) + countMappingKey(nestedValue, key),
    0,
  )
}

function parseNpmrc(source) {
  const values = {}
  const duplicates = new Set()
  for (const rawLine of source.split(/\r?\n/)) {
    const line = stripComment(rawLine).trim()
    if (!line) continue
    const separator = line.indexOf('=')
    if (separator <= 0) continue
    const key = line.slice(0, separator).trim()
    const value = line.slice(separator + 1).trim()
    if (Object.hasOwn(values, key)) duplicates.add(key)
    values[key] = value
  }
  return { duplicates, values }
}

function isAuthOrRegistryNpmrcKey(key) {
  return (
    key === 'registry' ||
    /^@[^:]+:registry$/.test(key) ||
    key.startsWith('//') ||
    ['_auth', '_authToken', '_password', 'always-auth', 'email', 'username'].includes(key)
  )
}

function mappingOrError(source, section, label, errors) {
  try {
    return topLevelMapping(source, section)
  } catch (error) {
    errors.push(`${label}: ${error.message}`)
    return {}
  }
}

export function evaluateRuntimeContract(sources, actual = null) {
  const {
    ciWorkflow,
    ciTrustedFiles,
    lockfile,
    npmrc,
    nvmrc,
    packageJson,
    packageJsons,
    runtime,
    workflows,
    workspace,
  } = sources
  const errors = []
  const expectedPackageManager = packageManagerDeclaration(runtime)

  if (nvmrc.trim() !== runtime.node.version) {
    errors.push(`.nvmrc must equal Node ${runtime.node.version}`)
  }
  if (packageJson.engines?.node !== runtime.node.engine) {
    errors.push(`package.json engines.node must equal ${runtime.node.engine}`)
  }
  if (packageJson.engines?.pnpm !== runtime.pnpm.engine) {
    errors.push(`package.json engines.pnpm must equal ${runtime.pnpm.engine}`)
  }
  if (packageJson.packageManager !== expectedPackageManager) {
    errors.push('package.json packageManager must match the canonical pnpm version and integrity')
  }
  if ('pnpm' in packageJson) {
    errors.push('pnpm 11 settings must live in pnpm-workspace.yaml, not package.json')
  }
  if (scriptsDigest(packageJson.scripts) !== runtime.rootScriptsSha256) {
    errors.push('root package scripts changed outside the Task 38 contract')
  }
  const npmSettings = parseNpmrc(npmrc)
  for (const removedKey of [
    'engine-strict',
    'package-manager-strict',
    'package-manager-strict-version',
  ]) {
    if (Object.hasOwn(npmSettings.values, removedKey)) {
      errors.push(`pnpm 11 setting ${removedKey} must not remain in .npmrc`)
    }
  }
  if (npmSettings.duplicates.size > 0) {
    errors.push('.npmrc must not contain shadowed settings')
  }
  const unsupportedNpmrcKeys = Object.keys(npmSettings.values).filter(
    (key) => !isAuthOrRegistryNpmrcKey(key),
  )
  if (unsupportedNpmrcKeys.length > 0) {
    errors.push(
      `.npmrc is auth/registry-only under pnpm 11; move ${unsupportedNpmrcKeys.join(', ')}`,
    )
  }

  const lockfileVersion = lockfile.match(/^lockfileVersion:\s*['"]?([^'"\s]+)['"]?$/m)?.[1]
  if (lockfileVersion !== runtime.pnpm.lockfileVersion) {
    errors.push(`pnpm-lock.yaml lockfileVersion must equal ${runtime.pnpm.lockfileVersion}`)
  }
  if (digest(lockfile) !== runtime.lockfileSha256) {
    errors.push('pnpm-lock.yaml bytes must match the canonical zero-drift digest')
  }
  if (digest(workspace) !== runtime.workspaceFileSha256) {
    errors.push('pnpm-workspace.yaml bytes must match the canonical zero-drift digest')
  }
  if (packageScriptsDigest(packageJsons) !== runtime.packageScriptsSha256) {
    errors.push('workspace package scripts changed outside the Task 38 contract')
  }
  if (dependencyDeclarationsDigest(packageJsons) !== runtime.dependencyDeclarationsSha256) {
    errors.push('workspace dependency declarations changed outside the Task 38 contract')
  }
  if (packageManifestSemanticsDigest(packageJsons) !== runtime.packageManifestSemanticsSha256) {
    errors.push('workspace package manifest semantics changed outside the Task 38 contract')
  }
  for (const [key, expectedValue] of Object.entries(runtime.pnpm.workspaceSettings)) {
    try {
      if (topLevelScalar(workspace, key) !== expectedValue) {
        errors.push(`pnpm-workspace.yaml ${key} must equal ${expectedValue}`)
      }
    } catch (error) {
      errors.push(`pnpm-workspace.yaml ${error.message}`)
    }
  }
  const workspaceOverrides = mappingOrError(
    workspace,
    'overrides',
    'invalid pnpm-workspace.yaml overrides',
    errors,
  )
  const lockfileOverrides = mappingOrError(
    lockfile,
    'overrides',
    'invalid pnpm-lock.yaml overrides',
    errors,
  )
  if (
    JSON.stringify(workspaceOverrides) !== JSON.stringify(stableObject(runtime.securityOverrides))
  ) {
    errors.push('pnpm-workspace.yaml security overrides must exactly match the canonical contract')
  }
  if (
    JSON.stringify(lockfileOverrides) !== JSON.stringify(stableObject(runtime.securityOverrides))
  ) {
    errors.push('pnpm-lock.yaml security overrides must exactly match the canonical contract')
  }
  const workspaceAllowedBuilds = mappingOrError(
    workspace,
    'allowBuilds',
    'invalid pnpm-workspace.yaml allowBuilds',
    errors,
  )
  const expectedAllowedBuilds = stableObject(
    Object.fromEntries(
      Object.entries(runtime.allowedBuilds).map(([name, version]) => [
        `${name}@${version}`,
        'true',
      ]),
    ),
  )
  if (JSON.stringify(workspaceAllowedBuilds) !== JSON.stringify(expectedAllowedBuilds)) {
    errors.push('pnpm allowBuilds must exactly match the canonical version-pinned approvals')
  }

  let parsedCi = { jobs: {} }
  try {
    parsedCi = parseWorkflow(ciWorkflow)
  } catch (error) {
    errors.push(`CI workflow YAML contract is invalid: ${error.message}`)
  }
  let actualWorkflowSemantics = {}
  try {
    actualWorkflowSemantics = Object.fromEntries(
      workflows.map((workflow) => [workflow.path, workflowSemanticsDigest(workflow.source)]),
    )
  } catch (error) {
    errors.push(`workflow semantic inventory is invalid: ${error.message}`)
  }
  if (
    JSON.stringify(stableObject(actualWorkflowSemantics)) !==
    JSON.stringify(stableObject(runtime.ci.workflowSemanticsSha256))
  ) {
    errors.push('workflow semantics and action topology must match the canonical digests')
  }
  if (
    JSON.stringify(Object.keys(ciTrustedFiles).sort()) !==
    JSON.stringify(Object.keys(runtime.ci.trustedFileSha256).sort())
  ) {
    errors.push('trusted CI support file inventory must exactly match the canonical contract')
  }
  for (const [trustedPath, expectedDigest] of Object.entries(runtime.ci.trustedFileSha256)) {
    if (digest(ciTrustedFiles[trustedPath] ?? '') !== expectedDigest) {
      errors.push(`trusted CI support file ${trustedPath} must match its canonical digest`)
    }
  }
  const ciSteps = workflowSteps(parsedCi)
  const ciWorkflowEnvelope = Object.fromEntries(
    Object.entries(parsedCi).filter(([key]) => key !== 'jobs'),
  )
  if (
    JSON.stringify(stableObject(ciWorkflowEnvelope)) !==
    JSON.stringify(stableObject(runtime.ci.workflowEnvelope))
  ) {
    errors.push('CI workflow root envelope must exactly match the canonical controls')
  }
  const contextContract = runtime.ci.contextJob
  const contextJob = parsedCi.jobs?.[contextContract.job]
  const contextJobEnvelope =
    contextJob && typeof contextJob === 'object'
      ? Object.fromEntries(Object.entries(contextJob).filter(([key]) => key !== 'steps'))
      : null
  const contextSteps = Array.isArray(contextJob?.steps) ? contextJob.steps : []
  const expectedContextCheckout = {
    name: contextContract.checkout.name,
    uses: `actions/checkout@${runtime.actions['actions/checkout'].sha}`,
    with: contextContract.checkout.with,
  }
  const expectedContextRuntime = {
    uses: `actions/setup-node@${runtime.actions['actions/setup-node'].sha}`,
    with: contextContract.runtime.with,
  }
  const contextResolver = contextSteps[2]
  const contextResolverEnvelope =
    contextResolver && typeof contextResolver === 'object'
      ? Object.fromEntries(Object.entries(contextResolver).filter(([key]) => key !== 'run'))
      : null
  if (
    !contextJob ||
    contextSteps.length !== contextContract.stepCount ||
    JSON.stringify(stableObject(contextJobEnvelope)) !==
      JSON.stringify(stableObject(contextContract.envelope)) ||
    JSON.stringify(stableObject(contextSteps[0])) !==
      JSON.stringify(stableObject(expectedContextCheckout)) ||
    JSON.stringify(stableObject(contextSteps[1])) !==
      JSON.stringify(stableObject(expectedContextRuntime)) ||
    JSON.stringify(stableObject(contextResolverEnvelope)) !==
      JSON.stringify(stableObject(contextContract.resolver.envelope)) ||
    digest(contextResolver?.run ?? '') !== contextContract.resolver.runSha256
  ) {
    errors.push(
      'CI context job must resolve the trusted commit before any repository-controlled execution',
    )
  }
  const setupNodeSteps = ciSteps.filter(
    (step) => step.uses && parseActionReference(step.uses).action === 'actions/setup-node',
  )
  const nodeVersions = setupNodeSteps.map((step) => step.with['node-version'])
  if (
    nodeVersions.length !== runtime.ci.setupNodeCount ||
    nodeVersions.some((version) => version !== runtime.node.version)
  ) {
    errors.push(`every CI node-version must equal ${runtime.node.version}`)
  }
  const pnpmSteps = ciSteps.filter(
    (step) => step.uses && parseActionReference(step.uses).action === 'pnpm/action-setup',
  )
  const pnpmVersions = pnpmSteps.map((step) => step.with.version)
  if (
    pnpmVersions.length !== runtime.ci.pnpmSetupCount ||
    pnpmVersions.some((version) => version !== runtime.pnpm.version)
  ) {
    errors.push(
      `CI must install pnpm ${runtime.pnpm.version} exactly ${runtime.ci.pnpmSetupCount} times`,
    )
  }
  const workspaceJob = parsedCi.jobs?.[runtime.ci.workspaceJob.job]
  const workspaceJobEnvelope =
    workspaceJob && typeof workspaceJob === 'object'
      ? Object.fromEntries(Object.entries(workspaceJob).filter(([key]) => key !== 'steps'))
      : null
  if (
    !workspaceJob ||
    !Array.isArray(workspaceJob.steps) ||
    JSON.stringify(stableObject(workspaceJobEnvelope)) !==
      JSON.stringify(stableObject(runtime.ci.workspaceJob.envelope))
  ) {
    errors.push('CI workspace job envelope must exactly match the canonical controls')
  }
  const bootstrapJob = parsedCi.jobs?.[runtime.ci.bootstrapStep.job]
  const bootstrapSteps =
    bootstrapJob?.steps.filter((step) => step.id === runtime.ci.bootstrapStep.id) ?? []
  const bootstrapStep = bootstrapSteps[0]
  const expectedBootstrapStep = {
    'continue-on-error': runtime.ci.bootstrapStep.continueOnError,
    id: runtime.ci.bootstrapStep.id,
    name: runtime.ci.bootstrapStep.name,
    run: `${runtime.ci.bootstrapStep.runLines.join('\n')}\n`,
    shell: runtime.ci.bootstrapStep.shell,
  }
  if (runtime.ci.bootstrapStep.condition !== null) {
    expectedBootstrapStep.if = runtime.ci.bootstrapStep.condition
  }
  if (
    bootstrapSteps.length !== 1 ||
    JSON.stringify(stableObject(bootstrapStep)) !==
      JSON.stringify(stableObject(expectedBootstrapStep))
  ) {
    errors.push(
      'CI runtime bootstrap step must exactly match the pinned-parser canonical structure',
    )
  }
  const runtimeJob = parsedCi.jobs?.[runtime.ci.runtimeStep.job]
  const runtimeSteps =
    runtimeJob?.steps.filter((step) => step.id === runtime.ci.runtimeStep.id) ?? []
  const runtimeStep = runtimeSteps[0]
  const expectedRuntimeStep = {
    'continue-on-error': runtime.ci.runtimeStep.continueOnError,
    env: runtime.ci.runtimeStep.env,
    id: runtime.ci.runtimeStep.id,
    name: runtime.ci.runtimeStep.name,
    run: runtime.ci.runtimeStep.command,
    shell: runtime.ci.runtimeStep.shell,
  }
  if (runtime.ci.runtimeStep.condition !== null) {
    expectedRuntimeStep.if = runtime.ci.runtimeStep.condition
  }
  if (
    runtimeSteps.length !== 1 ||
    JSON.stringify(stableObject(runtimeStep)) !== JSON.stringify(stableObject(expectedRuntimeStep))
  ) {
    errors.push('CI runtime-contract step must exactly match the canonical parsed structure')
  }
  const enforcementJob = parsedCi.jobs[runtime.ci.enforcementStep.job]
  const enforcementSteps =
    enforcementJob?.steps.filter((step) => step.name === runtime.ci.enforcementStep.name) ?? []
  const enforcementStep = enforcementSteps[0]
  const expectedEnforcementStep = {
    env: runtime.ci.enforcementStep.env,
    if: runtime.ci.enforcementStep.condition,
    name: runtime.ci.enforcementStep.name,
    run: `${runtime.ci.enforcementStep.runLines.join('\n')}\n`,
    shell: runtime.ci.enforcementStep.shell,
  }
  if (
    enforcementSteps.length !== 1 ||
    JSON.stringify(stableObject(enforcementStep)) !==
      JSON.stringify(stableObject(expectedEnforcementStep))
  ) {
    errors.push('CI must structurally enforce the exact runtime-contract outcome and stage set')
  }

  let references = []
  try {
    references = actionReferences(workflows)
  } catch (error) {
    errors.push(`workflow action inventory is invalid: ${error.message}`)
  }
  for (const { action, location, ref } of references) {
    if (!/^[0-9a-f]{40}$/.test(ref)) {
      errors.push(`${action} at ${location} must be pinned to a full 40-character commit SHA`)
      continue
    }
    const expected = runtime.actions[action]?.sha
    if (!expected) {
      errors.push(`${action} at ${location} is not in the canonical action allowlist`)
    } else if (ref !== expected) {
      errors.push(`${action} must remain pinned to ${expected}`)
    }
  }
  for (const action of Object.keys(runtime.actions)) {
    if (!references.some((reference) => reference.action === action)) {
      errors.push(`missing expected action reference: ${action}`)
    }
  }

  if (actual) {
    if (actual.node !== runtime.node.version) {
      errors.push(`active Node must equal ${runtime.node.version}`)
    }
    if (actual.pnpm !== runtime.pnpm.version) {
      errors.push(`active pnpm must equal ${runtime.pnpm.version}`)
    }
    if (actual.corepack !== runtime.corepack.version) {
      errors.push(`active Corepack must equal ${runtime.corepack.version}`)
    }
  }

  return errors
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

export function loadRuntimeSources() {
  const workflowDirectory = path.join(root, '.github/workflows')
  const workflows = fs
    .readdirSync(workflowDirectory)
    .filter((name) => /\.ya?ml$/.test(name))
    .sort()
    .map((name) => ({
      path: `.github/workflows/${name}`,
      source: read(`.github/workflows/${name}`),
    }))
  const packagePaths = [
    'package.json',
    ...fs
      .readdirSync(path.join(root, 'packages'))
      .map((name) => `packages/${name}/package.json`)
      .filter((relativePath) => fs.existsSync(path.join(root, relativePath)))
      .sort(),
  ]
  const packageJsons = Object.fromEntries(
    packagePaths.map((relativePath) => [relativePath, JSON.parse(read(relativePath))]),
  )
  const ciTrustedFiles = Object.fromEntries(
    trustedCiFilePaths.map((relativePath) => [relativePath, read(relativePath)]),
  )
  return {
    ciWorkflow: read('.github/workflows/ci.yml'),
    ciTrustedFiles,
    lockfile: read('pnpm-lock.yaml'),
    npmrc: fs.existsSync(path.join(root, '.npmrc')) ? read('.npmrc') : '',
    nvmrc: read('.nvmrc'),
    packageJson: JSON.parse(read('package.json')),
    packageJsons,
    runtime: JSON.parse(read('config/runtime.json')),
    workflows,
    workspace: read('pnpm-workspace.yaml'),
  }
}

function commandVersion(command) {
  const result = spawnSync(command, ['--version'], { encoding: 'utf8' })
  if (result.error || result.status !== 0) return null
  return result.stdout.trim().replace(/^v/, '')
}

function main() {
  const verifyActive = process.argv.includes('--verify-active')
  const actual = verifyActive
    ? {
        corepack: commandVersion('corepack'),
        node: process.version.replace(/^v/, ''),
        pnpm: commandVersion('pnpm'),
      }
    : null
  const sources = loadRuntimeSources()
  const errors = evaluateRuntimeContract(sources, actual)
  const report = {
    actual,
    errors,
    expected: {
      allowedBuilds: sources.runtime.allowedBuilds,
      corepack: sources.runtime.corepack.version,
      node: sources.runtime.node.version,
      packageManager: packageManagerDeclaration(sources.runtime),
      pnpm: sources.runtime.pnpm.version,
    },
    status: errors.length === 0 ? 'passed' : 'failed',
  }
  console.log(JSON.stringify(report, null, 2))
  if (errors.length > 0) process.exitCode = 1
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
