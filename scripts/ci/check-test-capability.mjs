import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'))
}

function directDependency(manifest, name) {
  return Boolean(manifest.dependencies?.[name] || manifest.devDependencies?.[name])
}

function collectFiles(directory, files = []) {
  if (!fs.existsSync(directory)) return files
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.next', 'coverage'].includes(entry.name)) continue
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      collectFiles(entryPath, files)
    } else {
      files.push(path.relative(root, entryPath).split(path.sep).join('/'))
    }
  }
  return files
}

export function loadCapabilitySources() {
  const tasks = readJson('.taskmaster/tasks/tasks.json').master.tasks
  const files = [
    ...collectFiles(path.join(root, 'packages')),
    ...collectFiles(path.join(root, 'tests')),
    ...['playwright.config.ts', 'vitest.config.ts', 'tsconfig.test.json'].filter((file) =>
      fs.existsSync(path.join(root, file)),
    ),
  ]
  const testFiles = matchingFiles(files, /(?:^|\/)[^/]+\.(?:test|spec)\.[cm]?[jt]sx?$/)
  return {
    capabilities: readJson('config/ci/verification-capabilities.json'),
    configs: Object.fromEntries(
      ['playwright.config.ts', 'vitest.config.ts'].map((file) => [
        file,
        fs.readFileSync(path.join(root, file), 'utf8'),
      ]),
    ),
    files,
    manifests: {
      root: readJson('package.json'),
      web: readJson('packages/web/package.json'),
    },
    task39: tasks.find((task) => String(task.id) === '39'),
    testSources: Object.fromEntries(
      testFiles.map((file) => [file, fs.readFileSync(path.join(root, file), 'utf8')]),
    ),
  }
}

function matchingFiles(files, pattern) {
  return files.filter((file) => pattern.test(file))
}

const deniedTestModifiers = new Set([
  'fail',
  'fails',
  'fixme',
  'only',
  'runIf',
  'skip',
  'skipIf',
  'todo',
])

export const criticalBrowserJourneys = Object.freeze([
  'serves the reader shell and enforces the accessibility baseline',
  'keeps the theme chooser operable from the keyboard',
  'preserves forced-colors focus and reduced-motion behavior',
])
export const capabilityModes = Object.freeze(['unit', 'browser'])
export const capabilityCommand = 'node scripts/ci/check-test-capability.mjs'
export const expectedBrowserProjects = Object.freeze(['desktop-chromium', 'mobile-chromium'])
export const criticalUnitContracts = Object.freeze([
  {
    file: 'packages/web/src/components/theme-menu.test.tsx',
    title: 'applies a selected color theme from the keyboard-accessible menu',
  },
  {
    file: 'packages/web/src/lib/framework-content.test.ts',
    title: 'lists only published stories on reader surfaces',
  },
  {
    file: 'packages/web/src/lib/request-security.test.ts',
    title: 'binds short-lived preview credentials and browser scope to one slug and purpose',
  },
  {
    file: 'packages/web/src/lib/security-headers.test.ts',
    title: 'emits the complete baseline header set',
  },
  {
    file: 'packages/web/src/lib/site-url.test.ts',
    title: 'keeps build-time canonical and server runtime origins as separate contracts',
  },
  {
    file: 'packages/web/src/utils/color-converter.test.ts',
    title: 'rejects missing or nonnumeric channels',
  },
])

function calleeSegments(expression) {
  if (ts.isIdentifier(expression)) return [expression.text]
  if (ts.isPropertyAccessExpression(expression)) {
    return [...calleeSegments(expression.expression), expression.name.text]
  }
  if (
    ts.isElementAccessExpression(expression) &&
    expression.argumentExpression &&
    ts.isStringLiteralLike(expression.argumentExpression)
  ) {
    return [...calleeSegments(expression.expression), expression.argumentExpression.text]
  }
  if (ts.isCallExpression(expression)) return calleeSegments(expression.expression)
  return []
}

export function analyzeTestSource(source, file = 'test.ts') {
  const scriptKind = /\.[cm]?[jt]sx$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, scriptKind)
  const activeTitles = new Set()
  const disabledCalls = new Set()

  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      const segments = calleeSegments(node.expression)
      const denied = segments.filter((segment) => deniedTestModifiers.has(segment))
      if (denied.length > 0) {
        disabledCalls.add(segments.join('.'))
      }

      const rootName = segments[0]
      const title = node.arguments[0]
      if (
        ['it', 'test'].includes(rootName) &&
        !segments.includes('describe') &&
        denied.length === 0 &&
        title &&
        ts.isStringLiteralLike(title)
      ) {
        activeTitles.add(title.text)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)

  return {
    activeTitles: [...activeTitles].sort(),
    disabledCalls: [...disabledCalls].sort(),
  }
}

export function resolveCapabilityModes(mode) {
  if (mode === undefined) return [...capabilityModes]
  return capabilityModes.includes(mode) ? [mode] : []
}

export function capabilityModesForCommand(command) {
  if (command === capabilityCommand) return resolveCapabilityModes(undefined)
  for (const mode of capabilityModes) {
    if (command === `${capabilityCommand} ${mode}`) return [mode]
  }
  return []
}

export function evaluateCapability(mode, sources) {
  if (!['unit', 'browser'].includes(mode)) {
    return {
      errors: ['mode must be unit or browser'],
      mode,
      requirements: {},
      status: 'failed',
    }
  }

  const { capabilities, configs, files, manifests, task39, testSources } = sources
  const testAnalyses = Object.fromEntries(
    Object.entries(testSources).map(([file, source]) => [file, analyzeTestSource(source, file)]),
  )
  const activeSuite = (prefix) =>
    Object.entries(testAnalyses)
      .filter(([file]) => file.startsWith(prefix))
      .some(([, analysis]) => analysis.activeTitles.length > 0)
  const hasNoDisabledTests = (prefix) =>
    Object.entries(testAnalyses)
      .filter(([file]) => file.startsWith(prefix))
      .every(([, analysis]) => analysis.disabledCalls.length === 0)
  const requirements = {
    task39Lifecycle: ['in-progress', 'done'].includes(task39?.status),
    rootCapabilityCommandRunsAllModes:
      capabilityModesForCommand(manifests.root.scripts?.['test:capability']).join(',') ===
      capabilityModes.join(','),
  }

  if (mode === 'unit') {
    Object.assign(requirements, {
      capabilityDeclaredSupported: capabilities.unit === 'supported',
      rootTestRunsVitest:
        manifests.root.scripts?.test ===
        'vitest run --reporter=default --reporter=json --outputFile.json=ci-artifacts/vitest-results.json && node scripts/ci/check-test-results.mjs unit ci-artifacts/vitest-results.json',
      coverageRunsVitest:
        manifests.root.scripts?.['test:coverage'] ===
        'vitest run --coverage --reporter=default --reporter=json --outputFile.json=ci-artifacts/vitest-results.json && node scripts/ci/check-test-results.mjs unit ci-artifacts/vitest-results.json',
      qualityContractRuns:
        manifests.root.scripts?.['test:quality-contract'] ===
        'node --test tests/ci/accessibility-baseline.test.mjs tests/ci/eslint-contract.test.mjs tests/ci/test-capability.test.mjs tests/ci/test-results.test.mjs',
      vitestDirect: directDependency(manifests.root, 'vitest'),
      coverageDirect: directDependency(manifests.root, '@vitest/coverage-v8'),
      testingLibraryDirect: directDependency(manifests.root, '@testing-library/react'),
      jsdomDirect: directDependency(manifests.root, 'jsdom'),
      vitestConfigPresent: files.includes('vitest.config.ts'),
      vitestDefaultsToNode: /environment:\s*['"]node['"]/.test(configs['vitest.config.ts']),
      testTypecheckPresent: files.includes('tsconfig.test.json'),
      appLocalDesignSystemTestsActive: activeSuite('packages/web/src/components/'),
      webTestsActive: activeSuite('packages/web/'),
      criticalUnitContractsActive: criticalUnitContracts.every(({ file, title }) =>
        testAnalyses[file]?.activeTitles.includes(title),
      ),
      domTestsDeclareJsdom: Object.entries(testSources)
        .filter(([file]) => /\.(?:jsx|tsx)$/.test(file))
        .every(([, source]) => /^\/\/ @vitest-environment jsdom\s/m.test(source)),
      noDisabledUnitTests: hasNoDisabledTests('packages/'),
    })
  } else {
    const browserTitles = new Set(
      Object.entries(testAnalyses)
        .filter(([file]) => file.startsWith('tests/e2e/'))
        .flatMap(([, analysis]) => analysis.activeTitles),
    )
    Object.assign(requirements, {
      capabilityDeclaredSupported: capabilities.browser === 'supported',
      browserScriptRunsPlaywright:
        manifests.root.scripts?.['test:browser'] ===
        'playwright test && node scripts/ci/check-test-results.mjs browser ci-artifacts/playwright-results.json',
      browserInstallIsExplicit:
        manifests.root.scripts?.['test:browser:install'] ===
        'playwright install --with-deps chromium',
      playwrightDirect: directDependency(manifests.root, '@playwright/test'),
      axeDirect: directDependency(manifests.root, '@axe-core/playwright'),
      playwrightConfigPresent: files.includes('playwright.config.ts'),
      playwrightTargetsE2e: /testDir:\s*['"]\.\/tests\/e2e['"]/.test(
        configs['playwright.config.ts'],
      ),
      playwrightForbidsOnly: /forbidOnly:\s*Boolean\(process\.env\.CI\)/.test(
        configs['playwright.config.ts'],
      ),
      browserTestsActive: activeSuite('tests/e2e/'),
      criticalBrowserJourneysActive: criticalBrowserJourneys.every((title) =>
        browserTitles.has(title),
      ),
      noDisabledBrowserTests: hasNoDisabledTests('tests/e2e/'),
    })
  }

  const errors = Object.entries(requirements)
    .filter(([, passed]) => !passed)
    .map(([requirement]) => `missing supported ${mode} capability: ${requirement}`)

  return {
    errors,
    mode,
    ownerTask: capabilities.ownerTask,
    requirements,
    status: errors.length === 0 ? 'supported' : 'failed',
    task39: task39 ? { id: String(task39.id), status: task39.status } : null,
  }
}

function main() {
  const requestedMode = process.argv[2]
  const modes = resolveCapabilityModes(requestedMode)
  if (modes.length === 0) {
    console.error('Usage: node scripts/ci/check-test-capability.mjs <unit|browser>')
    process.exit(2)
  }

  const sources = loadCapabilitySources()
  const reports = modes.map((mode) => evaluateCapability(mode, sources))
  fs.mkdirSync(path.join(root, 'ci-artifacts'), { recursive: true })
  for (const report of reports) {
    fs.writeFileSync(
      path.join(root, 'ci-artifacts', `${report.mode}-test-capability.json`),
      `${JSON.stringify(report, null, 2)}\n`,
    )
  }

  const combined = {
    reports,
    status: reports.every((report) => report.errors.length === 0) ? 'supported' : 'failed',
  }
  console.log(JSON.stringify(reports.length === 1 ? reports[0] : combined, null, 2))
  if (combined.status === 'failed') process.exitCode = 1
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
