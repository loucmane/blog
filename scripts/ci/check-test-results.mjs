#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  criticalBrowserJourneys,
  criticalUnitContracts,
  expectedBrowserProjects,
} from './check-test-capability.mjs'

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function evaluateVitestResults(report) {
  if (!isObject(report)) return ['Vitest results must be an object']
  const errors = []
  if (report.success !== true) errors.push('Vitest results must report success')
  if (!Number.isInteger(report.numTotalTests) || report.numTotalTests < 1) {
    errors.push('Vitest results must contain at least one test')
  }
  if (report.numFailedTests !== 0) errors.push('Vitest results must have zero failed tests')
  if (report.numPendingTests !== 0) errors.push('Vitest results must have zero skipped tests')
  if (report.numTodoTests !== 0) errors.push('Vitest results must have zero todo tests')
  if (report.numPassedTests !== report.numTotalTests) {
    errors.push('every Vitest test must pass')
  }
  if (!Array.isArray(report.testResults) || report.testResults.length === 0) {
    errors.push('Vitest results must include test files')
  } else {
    for (const testFile of report.testResults) {
      if (testFile.status !== 'passed') errors.push('every Vitest test file must pass')
      if (!Array.isArray(testFile.assertionResults) || testFile.assertionResults.length === 0) {
        errors.push('every Vitest test file must include assertions')
        continue
      }
      if (testFile.assertionResults.some((assertion) => assertion.status !== 'passed')) {
        errors.push('every Vitest assertion must pass without skip or todo status')
      }
    }
    for (const { file, title } of criticalUnitContracts) {
      const matchingFiles = report.testResults.filter((testFile) =>
        testFile.name?.split('\\').join('/').endsWith(`/${file}`),
      )
      if (matchingFiles.length !== 1) {
        errors.push(`critical Vitest contract ${file} must run exactly once`)
        continue
      }
      const matchingAssertions = matchingFiles[0].assertionResults.filter(
        (assertion) => assertion.title === title,
      )
      if (matchingAssertions.length !== 1 || matchingAssertions[0].status !== 'passed') {
        errors.push(`critical Vitest contract ${file}: ${title} must pass exactly once`)
      }
    }
  }
  return [...new Set(errors)]
}

function collectPlaywrightSpecs(suites, specs = []) {
  if (!Array.isArray(suites)) return specs
  for (const suite of suites) {
    if (Array.isArray(suite.specs)) specs.push(...suite.specs)
    collectPlaywrightSpecs(suite.suites, specs)
  }
  return specs
}

export function evaluatePlaywrightResults(report, { requireForbidOnly = true } = {}) {
  if (!isObject(report)) return ['Playwright results must be an object']
  const errors = []
  const projects = Array.isArray(report.config?.projects)
    ? report.config.projects.map((project) => project.name).filter(Boolean)
    : []
  if (projects.length === 0) errors.push('Playwright results must identify configured projects')
  if (JSON.stringify(projects) !== JSON.stringify(expectedBrowserProjects)) {
    errors.push('Playwright results must use the exact reviewed project inventory')
  }
  if (requireForbidOnly && report.config?.forbidOnly !== true) {
    errors.push('Playwright must forbid focused tests')
  }
  if (!isObject(report.stats)) {
    errors.push('Playwright results must include aggregate statistics')
  } else {
    if (report.stats.expected < 1) errors.push('Playwright must execute at least one expected test')
    if (report.stats.skipped !== 0) errors.push('Playwright results must have zero skipped tests')
    if (report.stats.unexpected !== 0) {
      errors.push('Playwright results must have zero unexpected tests')
    }
    if (report.stats.flaky !== 0) errors.push('Playwright results must have zero flaky tests')
  }
  if (!Array.isArray(report.errors) || report.errors.length !== 0) {
    errors.push('Playwright results must have zero runner errors')
  }

  const specs = collectPlaywrightSpecs(report.suites)
  if (specs.length === 0) errors.push('Playwright results must contain executed specs')
  for (const spec of specs) {
    if (spec.ok !== true) errors.push('every Playwright spec must pass')
    for (const test of spec.tests ?? []) {
      if (test.status !== 'expected') {
        errors.push('every Playwright test must finish with expected status')
      }
      if (!Array.isArray(test.results) || test.results.length === 0) {
        errors.push('every Playwright test must contain a runner result')
      } else if (test.results.some((result) => result.status !== 'passed')) {
        errors.push('every Playwright runner attempt must pass')
      }
    }
  }

  for (const title of criticalBrowserJourneys) {
    for (const projectName of projects) {
      const matches = specs.flatMap((spec) =>
        spec.title === title
          ? (spec.tests ?? []).filter((test) => test.projectName === projectName)
          : [],
      )
      if (matches.length !== 1) {
        errors.push(`critical browser journey ${title} must run exactly once in ${projectName}`)
      }
    }
  }
  return [...new Set(errors)]
}

function main() {
  const mode = process.argv[2]
  const reportPath = process.argv[3]
  if (!['browser', 'unit'].includes(mode) || !reportPath) {
    console.error('Usage: node scripts/ci/check-test-results.mjs <unit|browser> <report.json>')
    process.exit(2)
  }

  let report
  try {
    report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
  } catch (error) {
    console.error(`Unable to parse ${mode} test results: ${error.message}`)
    process.exit(1)
  }
  const errors =
    mode === 'unit'
      ? evaluateVitestResults(report)
      : evaluatePlaywrightResults(report, { requireForbidOnly: process.env.CI === 'true' })
  console.log(
    JSON.stringify(
      {
        errors,
        mode,
        report: path.normalize(reportPath),
        status: errors.length === 0 ? 'passed' : 'failed',
      },
      null,
      2,
    ),
  )
  if (errors.length > 0) process.exitCode = 1
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
