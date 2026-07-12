import assert from 'node:assert/strict'
import test from 'node:test'

import {
  analyzeTestSource,
  criticalBrowserJourneys,
  criticalUnitContracts,
  evaluateCapability,
  expectedBrowserProjects,
  loadCapabilitySources,
} from '../../scripts/ci/check-test-capability.mjs'

function cloneSources() {
  return structuredClone(loadCapabilitySources())
}

test('accepts the committed unit and integration capability', () => {
  assert.equal(evaluateCapability('unit', cloneSources()).status, 'supported')
})

test('accepts the committed browser and accessibility capability', () => {
  assert.equal(evaluateCapability('browser', cloneSources()).status, 'supported')
})

test('denies a removed unit command', () => {
  const sources = cloneSources()
  delete sources.manifests.root.scripts.test

  assert.match(evaluateCapability('unit', sources).errors.join('\n'), /rootTestRunsVitest/)
})

test('denies a removed direct test dependency', () => {
  const sources = cloneSources()
  delete sources.manifests.root.devDependencies.vitest

  assert.match(evaluateCapability('unit', sources).errors.join('\n'), /vitestDirect/)
})

test('denies a missing representative package suite', () => {
  const sources = cloneSources()
  sources.files = sources.files.filter((file) => !file.startsWith('packages/backend/'))

  for (const file of Object.keys(sources.testSources)) {
    if (file.startsWith('packages/backend/')) delete sources.testSources[file]
  }

  assert.match(evaluateCapability('unit', sources).errors.join('\n'), /backendTestsActive/)
})

test('denies a browser-like backend environment and missing DOM environment declaration', () => {
  const sources = cloneSources()
  sources.configs['vitest.config.ts'] = sources.configs['vitest.config.ts'].replace(
    "environment: 'node'",
    "environment: 'jsdom'",
  )
  sources.testSources['packages/ui/src/components/Button/Button.test.tsx'] = sources.testSources[
    'packages/ui/src/components/Button/Button.test.tsx'
  ].replace('// @vitest-environment jsdom', '')

  const errors = evaluateCapability('unit', sources).errors.join('\n')
  assert.match(errors, /vitestDefaultsToNode/)
  assert.match(errors, /domTestsDeclareJsdom/)
})

test('denies skipped unit or browser suites', () => {
  const unit = cloneSources()
  unit.testSources['packages/ui/src/components/Button/Button.test.tsx'] = unit.testSources[
    'packages/ui/src/components/Button/Button.test.tsx'
  ].replace("it('exposes", "it.skip('exposes")
  assert.match(evaluateCapability('unit', unit).errors.join('\n'), /noDisabledUnitTests/)

  const browser = cloneSources()
  browser.testSources['tests/e2e/homepage.spec.ts'] = browser.testSources[
    'tests/e2e/homepage.spec.ts'
  ].replace("test('serves", "test.skip('serves")
  assert.match(evaluateCapability('browser', browser).errors.join('\n'), /noDisabledBrowserTests/)
})

test('denies fixme, chained skip, conditional, focused, expected-failure, and runtime skips', () => {
  for (const disabledCall of [
    "test.fixme('disabled', () => {})",
    "it.concurrent.skip('disabled', () => {})",
    "test.skipIf(true)('disabled', () => {})",
    "describe.only('focused', () => {})",
    "test.fail('expected failure', () => {})",
    'testInfo.skip()',
  ]) {
    const sources = cloneSources()
    sources.testSources['tests/e2e/homepage.spec.ts'] += `\n${disabledCall}\n`
    assert.match(
      evaluateCapability('browser', sources).errors.join('\n'),
      /noDisabledBrowserTests/,
      disabledCall,
    )
  }
})

test('recognizes active matrix tests without treating their data call as a test', () => {
  assert.deepEqual(
    analyzeTestSource("test.each([1, 2])('runs %s', (value) => value)").activeTitles,
    ['runs %s'],
  )
})

test('requires both named critical browser journeys', () => {
  assert.deepEqual(criticalBrowserJourneys, [
    'serves the reader shell and enforces the accessibility baseline',
    'keeps the theme chooser operable from the keyboard',
  ])
  const sources = cloneSources()
  sources.testSources['tests/e2e/homepage.spec.ts'] = sources.testSources[
    'tests/e2e/homepage.spec.ts'
  ].replace(criticalBrowserJourneys[0], 'serves a renamed shell')

  assert.match(
    evaluateCapability('browser', sources).errors.join('\n'),
    /criticalBrowserJourneysActive/,
  )
})

test('requires the exact browser project contract and every named unit foundation', () => {
  assert.deepEqual(expectedBrowserProjects, ['desktop-chromium', 'mobile-chromium'])
  assert.equal(criticalUnitContracts.length, 6)

  const sources = cloneSources()
  const contract = criticalUnitContracts[0]
  sources.testSources[contract.file] = sources.testSources[contract.file].replace(
    contract.title,
    'renamed server environment check',
  )
  assert.match(evaluateCapability('unit', sources).errors.join('\n'), /criticalUnitContractsActive/)
})

test('denies an ineffective Playwright test directory', () => {
  const sources = cloneSources()
  sources.configs['playwright.config.ts'] = sources.configs['playwright.config.ts'].replace(
    "testDir: './tests/e2e'",
    "testDir: './tests/empty'",
  )

  assert.match(evaluateCapability('browser', sources).errors.join('\n'), /playwrightTargetsE2e/)
})

test('denies a removed Playwright configuration', () => {
  const sources = cloneSources()
  sources.files = sources.files.filter((file) => file !== 'playwright.config.ts')

  assert.match(evaluateCapability('browser', sources).errors.join('\n'), /playwrightConfigPresent/)
})

test('denies an unsupported declaration or inactive owner task', () => {
  const sources = cloneSources()
  sources.capabilities.browser = 'unsupported'
  sources.task39.status = 'pending'

  const errors = evaluateCapability('browser', sources).errors.join('\n')
  assert.match(errors, /capabilityDeclaredSupported/)
  assert.match(errors, /task39Lifecycle/)
})
