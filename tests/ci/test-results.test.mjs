import assert from 'node:assert/strict'
import test from 'node:test'

import {
  evaluatePlaywrightResults,
  evaluateVitestResults,
} from '../../scripts/ci/check-test-results.mjs'
import {
  criticalUnitContracts,
  expectedBrowserProjects,
} from '../../scripts/ci/check-test-capability.mjs'

function vitestReport() {
  const testResults = criticalUnitContracts.map(({ file, title }) => ({
    assertionResults: [{ status: 'passed', title }],
    name: `/workspace/${file}`,
    status: 'passed',
  }))
  return {
    numFailedTests: 0,
    numPassedTests: testResults.length,
    numPendingTests: 0,
    numTodoTests: 0,
    numTotalTests: testResults.length,
    success: true,
    testResults,
  }
}

function playwrightReport() {
  const projects = expectedBrowserProjects
  const titles = [
    'serves the reader shell and enforces the accessibility baseline',
    'keeps the theme chooser operable from the keyboard',
  ]
  return {
    config: {
      forbidOnly: true,
      projects: projects.map((name) => ({ name })),
    },
    errors: [],
    stats: { expected: 4, flaky: 0, skipped: 0, unexpected: 0 },
    suites: [
      {
        specs: projects.flatMap((projectName) =>
          titles.map((title) => ({
            ok: true,
            tests: [{ projectName, results: [{ status: 'passed' }], status: 'expected' }],
            title,
          })),
        ),
      },
    ],
  }
}

test('accepts complete passing Vitest results', () => {
  assert.deepEqual(evaluateVitestResults(vitestReport()), [])
})

test('denies skipped, todo, failed, empty, or malformed Vitest results', () => {
  for (const mutate of [
    (report) => (report.numPendingTests = 1),
    (report) => (report.numTodoTests = 1),
    (report) => (report.numFailedTests = 1),
    (report) => (report.numTotalTests = 0),
    (report) => (report.testResults[0].assertionResults[0].status = 'pending'),
    (report) => (report.testResults[0].name = '/workspace/packages/moved.test.ts'),
  ]) {
    const report = vitestReport()
    mutate(report)
    assert.notDeepEqual(evaluateVitestResults(report), [])
  }
  assert.notDeepEqual(evaluateVitestResults(null), [])
})

test('accepts complete passing Playwright results for every critical journey', () => {
  assert.deepEqual(evaluatePlaywrightResults(playwrightReport()), [])
})

test('denies skipped, flaky, failed, focused, or incomplete Playwright results', () => {
  for (const mutate of [
    (report) => (report.stats.skipped = 1),
    (report) => (report.stats.flaky = 1),
    (report) => (report.stats.unexpected = 1),
    (report) => (report.config.forbidOnly = false),
    (report) => (report.config.projects[0].name = 'unreviewed-browser'),
    (report) => (report.suites[0].specs[0].ok = false),
    (report) => (report.suites[0].specs[0].tests[0].status = 'skipped'),
    (report) => (report.suites[0].specs[0].tests[0].results[0].status = 'failed'),
    (report) => report.suites[0].specs.shift(),
  ]) {
    const report = playwrightReport()
    mutate(report)
    assert.notDeepEqual(evaluatePlaywrightResults(report), [])
  }
  assert.notDeepEqual(evaluatePlaywrightResults(null), [])
})
