import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  evaluateRuntimeContract,
  loadRuntimeSources,
} from '../../scripts/ci/check-runtime-contract.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const checkerPath = path.join(root, 'scripts/ci/check-runtime-contract.mjs')

function sources() {
  const value = loadRuntimeSources()
  return {
    ...value,
    ciTrustedFiles: structuredClone(value.ciTrustedFiles),
    packageJson: structuredClone(value.packageJson),
    packageJsons: structuredClone(value.packageJsons),
    runtime: structuredClone(value.runtime),
    workflows: value.workflows.map((workflow) => ({ ...workflow })),
  }
}

function replaceCiWorkflow(value, search, replacement) {
  value.ciWorkflow = value.ciWorkflow.replace(search, replacement)
  value.workflows = value.workflows.map((workflow) =>
    workflow.path === '.github/workflows/ci.yml'
      ? { ...workflow, source: value.ciWorkflow }
      : workflow,
  )
}

test('accepts the canonical static runtime projections', () => {
  assert.deepEqual(evaluateRuntimeContract(sources()), [])
})

test('rejects developer and package engine drift', () => {
  const nvm = sources()
  nvm.nvmrc = '22.23.1\n'
  assert.match(evaluateRuntimeContract(nvm).join('\n'), /\.nvmrc/)

  const engines = sources()
  engines.packageJson.engines.node = '>=22'
  assert.match(evaluateRuntimeContract(engines).join('\n'), /engines\.node/)
})

test('rejects pnpm version, integrity, and script drift', () => {
  const manager = sources()
  manager.packageJson.packageManager = 'pnpm@11.11.0'
  assert.match(evaluateRuntimeContract(manager).join('\n'), /packageManager/)

  const scripts = sources()
  scripts.packageJson.scripts.build = 'echo bypass'
  scripts.packageJsons['package.json'].scripts.build = 'echo bypass'
  assert.match(evaluateRuntimeContract(scripts).join('\n'), /package scripts/)
})

test('rejects workspace script or dependency declaration drift', () => {
  const scripts = sources()
  scripts.packageJsons['packages/web/package.json'].scripts.build = 'echo bypass'
  assert.match(evaluateRuntimeContract(scripts).join('\n'), /workspace package scripts/)

  const dependencies = sources()
  dependencies.packageJsons['packages/web/package.json'].dependencies['framer-motion'] = '^99.0.0'
  assert.match(evaluateRuntimeContract(dependencies).join('\n'), /dependency declarations/)

  const bundled = sources()
  bundled.packageJsons['packages/web/package.json'].bundleDependencies = ['next']
  assert.match(evaluateRuntimeContract(bundled).join('\n'), /manifest semantics/)
})

test('rejects legacy pnpm settings and incomplete override migration', () => {
  const packageSettings = sources()
  packageSettings.packageJson.pnpm = { overrides: {} }
  assert.match(evaluateRuntimeContract(packageSettings).join('\n'), /pnpm 11 settings/)

  const workspace = sources()
  workspace.workspace = workspace.workspace.replace(/\noverrides:[\s\S]*/, '\n')
  assert.match(evaluateRuntimeContract(workspace).join('\n'), /security overrides/)
})

test('rejects missing, broad, unresolved, or additional dependency build approvals', () => {
  const missing = sources()
  missing.workspace = missing.workspace.replace("  'sharp@0.34.5': true\n", '')
  assert.match(evaluateRuntimeContract(missing).join('\n'), /allowBuilds/)

  const broad = sources()
  broad.workspace = broad.workspace.replace("  'sharp@0.34.5': true", '  sharp: true')
  assert.match(evaluateRuntimeContract(broad).join('\n'), /allowBuilds/)

  const unresolved = sources()
  unresolved.workspace = unresolved.workspace.replace(
    "  'sharp@0.34.5': true",
    '  sharp: set this to true or false',
  )
  assert.match(evaluateRuntimeContract(unresolved).join('\n'), /allowBuilds/)

  const additional = sources()
  additional.workspace = additional.workspace.replace(
    '\noverrides:',
    "\n  'esbuild@1.0.0': true\n\noverrides:",
  )
  assert.match(evaluateRuntimeContract(additional).join('\n'), /allowBuilds/)
})

test('rejects lockfile format and exact override key or value drift', () => {
  const format = sources()
  format.lockfile = format.lockfile.replace("lockfileVersion: '9.0'", "lockfileVersion: '10.0'")
  assert.match(evaluateRuntimeContract(format).join('\n'), /lockfileVersion/)

  const overrides = sources()
  overrides.lockfile = overrides.lockfile.replace('  yaml@>=2.0.0 <2.8.3: 2.9.0\n', '')
  assert.match(evaluateRuntimeContract(overrides).join('\n'), /security overrides/)

  const value = sources()
  value.workspace = value.workspace.replace(
    "  'ajv@>=6.0.0 <6.14.0': 6.14.0",
    "  'ajv@>=6.0.0 <6.14.0': 6.13.0",
  )
  assert.match(evaluateRuntimeContract(value).join('\n'), /security overrides/)

  const bytes = sources()
  bytes.lockfile += '\n# unexpected drift\n'
  assert.match(evaluateRuntimeContract(bytes).join('\n'), /zero-drift digest/)
})

test('rejects CI Node, pnpm, and enforcement drift', () => {
  const node = sources()
  replaceCiWorkflow(node, 'node-version: 24.18.0', 'node-version: 22.23.1')
  assert.match(evaluateRuntimeContract(node).join('\n'), /every CI node-version/)

  const pnpm = sources()
  replaceCiWorkflow(pnpm, 'version: 11.11.0', 'version: 11.12.0')
  assert.match(evaluateRuntimeContract(pnpm).join('\n'), /install pnpm/)

  const enforcement = sources()
  replaceCiWorkflow(
    enforcement,
    'RUNTIME_CONTRACT: ${{ steps.runtime_contract.outcome }}',
    'RUNTIME_CONTRACT: success',
  )
  assert.match(evaluateRuntimeContract(enforcement).join('\n'), /structurally enforce/)

  const accessibilityStage = sources()
  replaceCiWorkflow(
    accessibilityStage,
    'ACCESSIBILITY_BASELINE: ${{ steps.accessibility_baseline.outcome }}',
    'ACCESSIBILITY_BASELINE: success',
  )
  assert.match(evaluateRuntimeContract(accessibilityStage).join('\n'), /structurally enforce/)

  const accessibilityPolicy = sources()
  accessibilityPolicy.ciTrustedFiles['scripts/ci/check-accessibility-baseline.mjs'] +=
    '\n// bypass\n'
  assert.match(
    evaluateRuntimeContract(accessibilityPolicy).join('\n'),
    /trusted CI support file scripts\/ci\/check-accessibility-baseline\.mjs/,
  )

  const skippedJob = sources()
  replaceCiWorkflow(skippedJob, '  workspace:\n    name:', '  workspace:\n    if: false\n    name:')
  assert.match(evaluateRuntimeContract(skippedJob).join('\n'), /workspace job envelope/)

  const ignoredJobFailure = sources()
  replaceCiWorkflow(
    ignoredJobFailure,
    '  workspace:\n    name:',
    '  workspace:\n    continue-on-error: true\n    name:',
  )
  assert.match(evaluateRuntimeContract(ignoredJobFailure).join('\n'), /workspace job envelope/)

  const injectedNodeOptions = sources()
  replaceCiWorkflow(
    injectedNodeOptions,
    'permissions:\n  contents: read',
    'env:\n  NODE_OPTIONS: --require ./scripts/ci/bypass.cjs\n\npermissions:\n  contents: read',
  )
  assert.match(evaluateRuntimeContract(injectedNodeOptions).join('\n'), /workflow root envelope/)

  const injectedDefaults = sources()
  replaceCiWorkflow(
    injectedDefaults,
    'permissions:\n  contents: read',
    'defaults:\n  run:\n    shell: ./scripts/ci/bypass.sh {0}\n\npermissions:\n  contents: read',
  )
  assert.match(evaluateRuntimeContract(injectedDefaults).join('\n'), /workflow root envelope/)

  const injectedBashEnv = sources()
  replaceCiWorkflow(
    injectedBashEnv,
    "  workspace:\n    name: workspace · install · typecheck · lint · tests · build\n    needs: context\n    runs-on: ubuntu-latest\n    env:\n      BASH_ENV: ''",
    '  workspace:\n    name: workspace · install · typecheck · lint · tests · build\n    needs: context\n    runs-on: ubuntu-latest\n    env:\n      BASH_ENV: ./scripts/ci/bypass.sh',
  )
  assert.match(evaluateRuntimeContract(injectedBashEnv).join('\n'), /workspace job envelope/)

  const inheritedRuntimeShell = sources()
  replaceCiWorkflow(
    inheritedRuntimeShell,
    "      - name: Runtime contract\n        id: runtime_contract\n        if: always() && steps.runtime_bootstrap.outcome == 'success'\n        continue-on-error: true\n        shell: bash\n        env:\n          RUNTIME_YAML_MODULE: ${{ runner.temp }}/runtime-contract-parser/package/dist/index.js\n        run: node scripts/ci/check-runtime-contract.mjs",
    "      - name: Runtime contract\n        id: runtime_contract\n        if: always() && steps.runtime_bootstrap.outcome == 'success'\n        continue-on-error: true\n        env:\n          RUNTIME_YAML_MODULE: ${{ runner.temp }}/runtime-contract-parser/package/dist/index.js\n        run: node scripts/ci/check-runtime-contract.mjs",
  )
  assert.match(evaluateRuntimeContract(inheritedRuntimeShell).join('\n'), /runtime-contract step/)

  const unsafeBootstrap = sources()
  replaceCiWorkflow(
    unsafeBootstrap,
    'test "$integrity" = "sha512-2AvhNX3mb8zd6Zy7INTtSpl1F15HW6Wnqj0srWlkKLcpYl/gMIMJiyuGq2KeI2YFxUPjdlB+3Lc10seMLtL4cA=="',
    'test -n "$integrity"',
  )
  assert.match(evaluateRuntimeContract(unsafeBootstrap).join('\n'), /runtime bootstrap step/)

  const untrustedRegistry = sources()
  replaceCiWorkflow(
    untrustedRegistry,
    'export NPM_CONFIG_REGISTRY=https://registry.npmjs.org/',
    'export NPM_CONFIG_REGISTRY=https://packages.example.invalid/',
  )
  assert.match(evaluateRuntimeContract(untrustedRegistry).join('\n'), /runtime bootstrap step/)

  const untrustedParserPath = sources()
  replaceCiWorkflow(
    untrustedParserPath,
    'RUNTIME_YAML_MODULE: ${{ runner.temp }}/runtime-contract-parser/package/dist/index.js',
    'RUNTIME_YAML_MODULE: ./node_modules/yaml/dist/index.js',
  )
  assert.match(evaluateRuntimeContract(untrustedParserPath).join('\n'), /runtime-contract step/)

  const missingModuleEnvironment = { ...process.env, GITHUB_ACTIONS: 'true' }
  delete missingModuleEnvironment.RUNTIME_YAML_MODULE
  const missingModuleResult = spawnSync(process.execPath, [checkerPath], {
    cwd: root,
    encoding: 'utf8',
    env: missingModuleEnvironment,
  })
  assert.notEqual(missingModuleResult.status, 0)
  assert.match(
    `${missingModuleResult.stdout}\n${missingModuleResult.stderr}`,
    /RUNTIME_YAML_MODULE is required in GitHub Actions/,
  )

  const parserAttackRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'task38-runtime-parser-'))
  try {
    const executionMarker = path.join(parserAttackRoot, 'executed')
    const maliciousModule = path.join(parserAttackRoot, 'malicious.mjs')
    fs.writeFileSync(
      maliciousModule,
      `import fs from 'node:fs'; fs.writeFileSync(${JSON.stringify(executionMarker)}, 'executed')\n`,
    )
    const absoluteLocalResult = spawnSync(process.execPath, [checkerPath], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        RUNNER_TEMP: parserAttackRoot,
        RUNTIME_YAML_MODULE: maliciousModule,
      },
    })
    assert.notEqual(absoluteLocalResult.status, 0)
    assert.match(
      `${absoluteLocalResult.stdout}\n${absoluteLocalResult.stderr}`,
      /canonical trusted-runner parser path/,
    )
    assert.equal(fs.existsSync(executionMarker), false)

    const symlinkedModule = path.join(
      parserAttackRoot,
      'runtime-contract-parser/package/dist/index.js',
    )
    fs.mkdirSync(path.dirname(symlinkedModule), { recursive: true })
    fs.symlinkSync(maliciousModule, symlinkedModule)
    const symlinkResult = spawnSync(process.execPath, [checkerPath], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        RUNNER_TEMP: parserAttackRoot,
        RUNTIME_YAML_MODULE: symlinkedModule,
      },
    })
    assert.notEqual(symlinkResult.status, 0)
    assert.match(`${symlinkResult.stdout}\n${symlinkResult.stderr}`, /regular file, not a symlink/)
    assert.equal(fs.existsSync(executionMarker), false)
  } finally {
    fs.rmSync(parserAttackRoot, { force: true, recursive: true })
  }

  const extraPreRuntimeStep = sources()
  replaceCiWorkflow(
    extraPreRuntimeStep,
    '      - name: Bootstrap runtime contract parser',
    '      - name: Poison runner state\n        shell: bash\n        run: echo bypass >> "$GITHUB_PATH"\n\n      - name: Bootstrap runtime contract parser',
  )
  assert.match(evaluateRuntimeContract(extraPreRuntimeStep).join('\n'), /workflow semantics/)

  const redirectedStandardEvent = sources()
  redirectedStandardEvent.ciTrustedFiles['scripts/ci/post-merge-context.mjs'] =
    redirectedStandardEvent.ciTrustedFiles['scripts/ci/post-merge-context.mjs'].replace(
      'checkout_ref: reasons.length === 0 ? githubSha : null',
      "checkout_ref: reasons.length === 0 ? '0000000000000000000000000000000000000000' : null",
    )
  assert.match(evaluateRuntimeContract(redirectedStandardEvent).join('\n'), /post-merge-context/)

  const repositoryCodeBeforeResolver = sources()
  replaceCiWorkflow(
    repositoryCodeBeforeResolver,
    '      - name: Resolve the exact verification commit',
    '      - name: Execute repository code before trust resolution\n        shell: bash\n        run: node scripts/ci/check-runtime-contract.mjs\n\n      - name: Resolve the exact verification commit',
  )
  assert.match(
    evaluateRuntimeContract(repositoryCodeBeforeResolver).join('\n'),
    /resolve the trusted commit before any repository-controlled execution/,
  )

  const lockfileCacheBeforeResolver = sources()
  replaceCiWorkflow(
    lockfileCacheBeforeResolver,
    '      - name: Resolve the exact verification commit',
    '      - uses: pnpm/action-setup@0ebf47130e4866e96fce0953f49152a61190b271\n        with:\n          version: 11.11.0\n          run_install: false\n\n      - name: Resolve the exact verification commit',
  )
  assert.match(
    evaluateRuntimeContract(lockfileCacheBeforeResolver).join('\n'),
    /resolve the trusted commit before any repository-controlled execution/,
  )

  const automaticContextCache = sources()
  replaceCiWorkflow(
    automaticContextCache,
    '          package-manager-cache: false',
    '          package-manager-cache: true',
  )
  assert.match(
    evaluateRuntimeContract(automaticContextCache).join('\n'),
    /resolve the trusted commit before any repository-controlled execution/,
  )
})

test('rejects commented runtime commands and a weakened enforcement loop', () => {
  const runtimeStep = sources()
  replaceCiWorkflow(
    runtimeStep,
    `      - name: Runtime contract\n        id: runtime_contract\n        if: always() && steps.runtime_bootstrap.outcome == 'success'\n        continue-on-error: true\n        shell: bash\n        env:\n          RUNTIME_YAML_MODULE: \${{ runner.temp }}/runtime-contract-parser/package/dist/index.js\n        run: ${runtimeStep.runtime.ci.runtimeStep.command}`,
    `      - name: Runtime contract\n        id: runtime_contract\n        if: always() && steps.runtime_bootstrap.outcome == 'success'\n        continue-on-error: true\n        shell: bash\n        env:\n          RUNTIME_YAML_MODULE: \${{ runner.temp }}/runtime-contract-parser/package/dist/index.js\n        # run: ${runtimeStep.runtime.ci.runtimeStep.command}\n        run: echo bypass`,
  )
  assert.match(evaluateRuntimeContract(runtimeStep).join('\n'), /parsed structure/)

  const skippedRuntime = sources()
  replaceCiWorkflow(
    skippedRuntime,
    "        if: always() && steps.runtime_bootstrap.outcome == 'success'",
    '        if: false',
  )
  assert.match(evaluateRuntimeContract(skippedRuntime).join('\n'), /parsed structure/)

  const enforcement = sources()
  const expectedLoop = `for stage in ${enforcement.runtime.ci.enforcementStep.requiredStages.join(' ')}; do`
  replaceCiWorkflow(
    enforcement,
    expectedLoop,
    `# ${expectedLoop}\n          for stage in INSTALL DEPENDENCY_SECURITY TYPECHECK LINT UNIT_TESTS BROWSER_TESTS BUILD PRODUCTION_SMOKE; do`,
  )
  assert.match(evaluateRuntimeContract(enforcement).join('\n'), /structurally enforce/)

  const skippedEnforcement = sources()
  replaceCiWorkflow(
    skippedEnforcement,
    '      - name: Enforce workspace results\n        if: always()',
    '      - name: Enforce workspace results\n        if: false',
  )
  assert.match(evaluateRuntimeContract(skippedEnforcement).join('\n'), /structurally enforce/)

  const earlyExit = sources()
  replaceCiWorkflow(earlyExit, '          failed=0', '          exit 0\n          failed=0')
  assert.match(evaluateRuntimeContract(earlyExit).join('\n'), /structurally enforce/)

  const ignoredFailure = sources()
  replaceCiWorkflow(
    ignoredFailure,
    '      - name: Enforce workspace results\n        if: always()\n        shell: bash\n        env:',
    '      - name: Enforce workspace results\n        if: always()\n        continue-on-error: true\n        shell: bash\n        env:',
  )
  assert.match(evaluateRuntimeContract(ignoredFailure).join('\n'), /structurally enforce/)
})

test('rejects mutable or unexpected action references', () => {
  const mutable = sources()
  mutable.workflows[0].source = mutable.workflows[0].source.replace(/@[0-9a-f]{40}/, '@v1')
  assert.match(evaluateRuntimeContract(mutable).join('\n'), /full 40-character commit SHA/)

  const unexpected = sources()
  unexpected.workflows[0].source = unexpected.workflows[0].source.replace(
    /actions\/checkout@[0-9a-f]{40}/,
    'actions/cache@0000000000000000000000000000000000000000',
  )
  assert.match(evaluateRuntimeContract(unexpected).join('\n'), /action allowlist/)

  const duplicateApprovedAction = sources()
  replaceCiWorkflow(
    duplicateApprovedAction,
    '      - name: Bootstrap runtime contract parser',
    `      - uses: actions/checkout@${duplicateApprovedAction.runtime.actions['actions/checkout'].sha}\n        with:\n          persist-credentials: false\n\n      - name: Bootstrap runtime contract parser`,
  )
  assert.match(evaluateRuntimeContract(duplicateApprovedAction).join('\n'), /workflow semantics/)

  const flowStyle = sources()
  flowStyle.workflows.push({
    path: '.github/workflows/flow.yml',
    source: `name: Flow\non: push\njobs: {check: {runs-on: ubuntu-latest, steps: [{uses: actions/cache@0000000000000000000000000000000000000000}]}}\n`,
  })
  assert.match(evaluateRuntimeContract(flowStyle).join('\n'), /action allowlist/)

  const escapedKey = sources()
  escapedKey.workflows[0].source = escapedKey.workflows[0].source.replace(
    /uses: actions\/checkout@[0-9a-f]{40}/,
    '"\\u0075ses": actions/cache@0000000000000000000000000000000000000000',
  )
  assert.match(evaluateRuntimeContract(escapedKey).join('\n'), /action allowlist/)

  const alias = sources()
  alias.workflows.push({
    path: '.github/workflows/alias.yml',
    source: `name: Alias\non: push\njobs:\n  check:\n    runs-on: ubuntu-latest\n    steps:\n      - &action\n        uses: actions/cache@0000000000000000000000000000000000000000\n      - *action\n`,
  })
  assert.match(
    evaluateRuntimeContract(alias).join('\n'),
    /aliases are not supported|anchors are not supported/,
  )
})

test('rejects removed or shadowed pnpm settings in .npmrc', () => {
  const engine = sources()
  engine.npmrc = 'engine-strict=true\n'
  assert.match(evaluateRuntimeContract(engine).join('\n'), /must not remain/)

  const manager = sources()
  manager.npmrc = 'registry=https://registry.npmjs.org/\nregistry=https://example.invalid/\n'
  assert.match(evaluateRuntimeContract(manager).join('\n'), /shadowed settings/)

  const ignored = sources()
  ignored.npmrc = 'node-linker=hoisted\n'
  assert.match(evaluateRuntimeContract(ignored).join('\n'), /auth\/registry-only/)
})

test('rejects pnpm workspace enforcement setting drift', () => {
  for (const [setting, replacement] of [
    ['engineStrict: true', 'engineStrict: false'],
    ['nodeVersion: 24.18.0', 'nodeVersion: 22.23.1'],
    ['pmOnFail: error', 'pmOnFail: warn'],
    ['strictDepBuilds: true', 'strictDepBuilds: false'],
  ]) {
    const value = sources()
    value.workspace = value.workspace.replace(setting, replacement)
    assert.match(evaluateRuntimeContract(value).join('\n'), /pnpm-workspace\.yaml/)
  }

  const extraSetting = sources()
  extraSetting.workspace += '\ncatalogMode: strict\n'
  assert.match(evaluateRuntimeContract(extraSetting).join('\n'), /canonical zero-drift digest/)
})

test('rejects active runtime mismatches', () => {
  const actual = { corepack: '0.35.0', node: '24.18.0', pnpm: '11.11.0' }
  assert.deepEqual(evaluateRuntimeContract(sources(), actual), [])

  assert.match(
    evaluateRuntimeContract(sources(), { ...actual, pnpm: '11.12.0' }).join('\n'),
    /active pnpm/,
  )
})
