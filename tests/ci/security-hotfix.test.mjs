import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import test from 'node:test'

import { evaluateAudit, summarizeAudit } from '../../scripts/ci/check-dependency-security.mjs'
import { validateHtmlResponse } from '../../scripts/ci/web-production-smoke.mjs'

function auditPayload(vulnerabilities, advisories = {}) {
  return { advisories, metadata: { vulnerabilities } }
}

test('dependency policy accepts only a zero-vulnerability audit', () => {
  const payload = auditPayload({
    critical: 0,
    high: 0,
    info: 0,
    low: 0,
    moderate: 0,
  })

  assert.equal(evaluateAudit(payload).status, 'passed')
  assert.equal(evaluateAudit(payload).total, 0)
})

test('dependency policy fails on any advisory severity', () => {
  const payload = auditPayload(
    { critical: 0, high: 1, info: 0, low: 0, moderate: 0 },
    {
      1: {
        id: 1,
        module_name: 'example',
        patched_versions: '>=2.0.0',
        severity: 'high',
        vulnerable_versions: '<2.0.0',
      },
    },
  )
  const report = evaluateAudit(payload, 1)

  assert.equal(report.status, 'failed')
  assert.equal(report.total, 1)
  assert.equal(report.advisories[0].moduleName, 'example')
})

test('dependency policy rejects malformed and inconsistent audit results', () => {
  assert.throws(() => summarizeAudit({ metadata: {} }), /missing metadata\.vulnerabilities/)
  assert.match(evaluateAudit(auditPayload({ critical: 0 }), 2).errors[0], /exited 2/)
})

const noVulnerabilities = { critical: 0, high: 0, info: 0, low: 0, moderate: 0 }
const auditDate = new Date('2026-10-05T12:00:00Z')
const expiryDate = new Date('2026-11-04T00:00:00Z')
const bracesPath = '.>@next/eslint-plugin-next>fast-glob>micromatch>braces'
const bracesReason =
  'No patched braces release exists (first_patched_version null). Reachable only via the dev-time @next/eslint-plugin-next lint plugin; never shipped to the site.'

function bracesException(fields = {}) {
  return {
    advisory: 'GHSA-vfj7-8cjw-p6xm',
    module: 'braces',
    versions: ['3.0.3'],
    allowedPathPrefix: '.>@next/eslint-plugin-next>',
    devOnly: true,
    expires: '2026-11-04',
    reason: bracesReason,
    approvedBy: 'operator',
    approvedOn: '2026-10-05',
    ...fields,
  }
}

// Mirrors pnpm 11 `audit --json`: patched_versions is inferred from vulnerable_versions.
function bracesAudit({
  counts = { ...noVulnerabilities, high: 1 },
  findings = [{ dev: true, paths: [bracesPath], version: '3.0.3' }],
  patched = '>=3.0.4',
  vulnerable = '<=3.0.3',
} = {}) {
  return auditPayload(counts, {
    1240992: {
      findings,
      github_advisory_id: 'GHSA-vfj7-8cjw-p6xm',
      id: 1240992,
      module_name: 'braces',
      patched_versions: patched,
      severity: 'high',
      vulnerable_versions: vulnerable,
    },
  })
}

function evaluateWithExceptions(
  payload,
  { exceptions = [bracesException()], now = auditDate } = {},
) {
  const auditExitCode = Object.keys(payload.advisories).length > 0 ? 1 : 0
  return evaluateAudit(payload, auditExitCode, { exceptions, now })
}

test('dependency exceptions pass only an approved advisory and keep it visible', () => {
  const report = evaluateWithExceptions(bracesAudit())

  assert.equal(report.status, 'passed')
  assert.deepEqual(report.errors, [])
  assert.equal(report.total, 1)
  assert.deepEqual(report.excepted, [
    {
      advisory: 'GHSA-vfj7-8cjw-p6xm',
      approvedBy: 'operator',
      approvedOn: '2026-10-05',
      expires: '2026-11-04',
      id: 1240992,
      module: 'braces',
      paths: [bracesPath],
      reason: bracesReason,
      severity: 'high',
      versions: ['3.0.3'],
    },
  ])
  assert.equal(evaluateWithExceptions(bracesAudit(), { exceptions: [] }).status, 'failed')
  assert.equal(evaluateWithExceptions(auditPayload(noVulnerabilities)).status, 'passed')
})

test('dependency exceptions fail once expired', () => {
  const lastValidMoment = new Date(expiryDate.getTime() - 1)
  assert.equal(evaluateWithExceptions(bracesAudit(), { now: lastValidMoment }).status, 'passed')

  for (const payload of [bracesAudit(), auditPayload(noVulnerabilities)]) {
    const report = evaluateWithExceptions(payload, { now: expiryDate })
    assert.equal(report.status, 'failed')
    assert.deepEqual(report.excepted, [])
    assert.match(
      report.errors.join('\n'),
      /GHSA-vfj7-8cjw-p6xm exception for braces expired on 2026-11-04/,
    )
  }
})

test('dependency exceptions fail on any path outside the prefix or outside dev', () => {
  const productionPath = 'packages__web>next>fast-glob>micromatch>braces'
  for (const [findings, message] of [
    [
      [{ dev: false, paths: [bracesPath, productionPath], version: '3.0.3' }],
      /path packages__web>next>fast-glob>micromatch>braces is outside \.>@next\/eslint-plugin-next>/,
    ],
    [
      [{ dev: true, paths: ['.>@next/eslint-plugin-next-fork>braces'], version: '3.0.3' }],
      /outside/,
    ],
    [[{ dev: false, paths: [bracesPath], version: '3.0.3' }], /reachable outside devDependencies/],
    [[{ dev: true, paths: Array(100).fill(bracesPath), version: '3.0.3' }], /100 paths/],
    [[{ dev: true, paths: [], version: '3.0.3' }], /no paths/],
    [[], /no findings/],
  ]) {
    const report = evaluateWithExceptions(bracesAudit({ findings }))
    assert.equal(report.status, 'failed')
    assert.deepEqual(report.excepted, [])
    assert.match(report.errors.join('\n'), message)
  }
})

test('dependency exceptions fail on a version that is not listed', () => {
  const report = evaluateWithExceptions(
    bracesAudit({
      findings: [
        { dev: true, paths: [bracesPath], version: '3.0.3' },
        { dev: true, paths: ['.>@next/eslint-plugin-next>micromatch>braces'], version: '3.0.2' },
      ],
    }),
  )

  assert.equal(report.status, 'failed')
  assert.match(report.errors.join('\n'), /braces@3\.0\.2 is not a listed version/)
})

test('dependency exceptions fail once the advisory reports a patched release', () => {
  const missingPatch = bracesAudit()
  delete missingPatch.advisories[1240992].patched_versions
  for (const payload of [
    missingPatch,
    bracesAudit({ patched: '<0.0.0' }),
    bracesAudit({ patched: '' }),
    bracesAudit({ patched: null }),
  ]) {
    assert.equal(evaluateWithExceptions(payload).status, 'passed')
  }

  const fixedRelease = evaluateWithExceptions(bracesAudit({ vulnerable: '<3.0.4' }))
  assert.equal(fixedRelease.status, 'failed')
  assert.match(fixedRelease.errors.join('\n'), /reports patched versions >=3\.0\.4/)

  const otherRange = evaluateWithExceptions(bracesAudit({ patched: '>=4.0.0' }))
  assert.equal(otherRange.status, 'failed')
  assert.match(otherRange.errors.join('\n'), /reports patched versions >=4\.0\.0/)

  const listedPatch = evaluateWithExceptions(bracesAudit(), {
    exceptions: [bracesException({ versions: ['3.0.3', '3.0.4'] })],
  })
  assert.equal(listedPatch.status, 'failed')
  assert.match(
    listedPatch.errors.join('\n'),
    /listed version 3\.0\.4 satisfies the patched range >=3\.0\.4/,
  )
})

test('dependency exceptions reject malformed or excessive entries', () => {
  const clean = auditPayload(noVulnerabilities)
  const missingReason = bracesException()
  delete missingReason.reason

  for (const [exceptions, message] of [
    [{}, /must be an array/],
    [[null], /\[0\] must be an object/],
    [[missingReason], /\[0\] is missing reason/],
    [[bracesException({ owner: 'someone' })], /\[0\] has unknown field owner/],
    [[bracesException({ advisory: 'CVE-2024-4068' })], /\[0\] advisory/],
    [[bracesException({ module: '' })], /\[0\] module/],
    [[bracesException({ versions: [] })], /\[0\] versions/],
    [[bracesException({ versions: ['^3.0.3'] })], /\[0\] versions/],
    [[bracesException({ allowedPathPrefix: '.>' })], /\[0\] allowedPathPrefix/],
    [[bracesException({ devOnly: false })], /\[0\] devOnly/],
    [[bracesException({ expires: '2026-02-30' })], /\[0\] expires/],
    [[bracesException({ approvedOn: '2026-11-05' })], /\[0\] approvedOn/],
    [[bracesException({ reason: ' ' })], /\[0\] reason/],
    [[bracesException({ approvedBy: 7 })], /\[0\] approvedBy/],
    [[bracesException(), bracesException()], /\[1\] duplicates GHSA-vfj7-8cjw-p6xm/],
  ]) {
    const report = evaluateWithExceptions(clean, { exceptions })
    assert.equal(report.status, 'failed', JSON.stringify(exceptions))
    assert.match(report.errors.join('\n'), message)
  }

  const four = ['a', 'b', 'c', 'd'].map((module) => bracesException({ module }))
  assert.match(
    evaluateWithExceptions(clean, { exceptions: four }).errors.join('\n'),
    /has 4 entries; at most 3 are allowed/,
  )
  assert.equal(evaluateWithExceptions(clean, { exceptions: four.slice(0, 3) }).status, 'passed')
})

test('dependency exceptions cannot cover advisories the audit counts but does not list', () => {
  const hidden = evaluateWithExceptions(bracesAudit({ counts: { ...noVulnerabilities, high: 2 } }))
  assert.equal(hidden.status, 'failed')
  assert.match(hidden.errors.join('\n'), /outside approved exceptions; found 1/)

  const uncounted = evaluateWithExceptions(bracesAudit({ counts: noVulnerabilities }))
  assert.equal(uncounted.status, 'failed')
  assert.match(uncounted.errors.join('\n'), /counts do not account for every excepted advisory/)
})

test('the approved braces exception is pinned and covers only the current audit', () => {
  const runtime = JSON.parse(fs.readFileSync(new URL('../../config/runtime.json', import.meta.url)))
  const exceptions = runtime.dependencySecurityExceptions

  assert.deepEqual(exceptions, [bracesException()])
  assert.equal(evaluateWithExceptions(bracesAudit(), { exceptions }).status, 'passed')
  assert.equal(
    evaluateWithExceptions(bracesAudit(), { exceptions, now: expiryDate }).status,
    'failed',
  )
})

test('security-patched direct and transitive versions remain pinned', () => {
  const rootPackage = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url)))
  const webPackage = JSON.parse(
    fs.readFileSync(new URL('../../packages/web/package.json', import.meta.url)),
  )
  const workspace = fs.readFileSync(new URL('../../pnpm-workspace.yaml', import.meta.url), 'utf8')

  assert.equal(rootPackage.devDependencies['@next/eslint-plugin-next'], '16.3.8')
  assert.equal(rootPackage.devDependencies['@vitest/coverage-v8'], '4.1.11')
  assert.equal(rootPackage.devDependencies.vitest, '4.1.11')
  assert.equal(webPackage.dependencies.next, '16.3.8')
  assert.equal(webPackage.devDependencies.postcss, '8.5.23')
  assert.match(workspace, /'sharp@0\.35\.4': true/)
  assert.match(workspace, /'baseline-browser-mapping@>=2\.0\.0 <2\.11\.0': 2\.11\.0/)
  assert.match(workspace, /'brace-expansion@>=4\.0\.0 <5\.0\.12': 5\.0\.12/)
  assert.match(workspace, /'browserslist@>=4\.0\.0 <4\.28\.7': 4\.28\.7/)
  assert.match(workspace, /'nanoid@>=3\.0\.0 <3\.3\.18': 3\.3\.18/)
  assert.match(workspace, /'next@16\.3\.8>postcss': 8\.5\.23/)
  assert.match(workspace, /'next@16\.3\.8>sharp': 0\.35\.4/)
  assert.match(workspace, /'undici@>=7\.0\.0 <7\.29\.1': 7\.29\.1/)
})

test('production smoke validation requires a complete HTML response', () => {
  const validBody = `<html><body>${'rendered '.repeat(80)}</body></html>`
  assert.deepEqual(
    validateHtmlResponse({ body: validBody, contentType: 'text/html; charset=utf-8', status: 200 }),
    [],
  )
  assert.equal(
    validateHtmlResponse({ body: 'no', contentType: 'text/plain', status: 503 }).length,
    4,
  )
})

test('required CI check runs dependency policy and production smoke', () => {
  const workflow = fs.readFileSync(
    new URL('../../.github/workflows/ci.yml', import.meta.url),
    'utf8',
  )

  assert.match(workflow, /^ {6}- name: Dependency security policy$/m)
  assert.match(workflow, /^ {8}id: dependency_security$/m)
  assert.match(workflow, /pnpm test:security-hotfix/)
  assert.match(workflow, /pnpm security:audit/)
  assert.match(workflow, /^ {6}- name: Production web smoke$/m)
  assert.match(workflow, /^ {8}id: production_smoke$/m)
  assert.match(workflow, /pnpm test:smoke:web/)
  assert.match(workflow, /INSTALL DEPENDENCY_SECURITY TYPECHECK/)
  assert.match(workflow, /LINT FORMAT UNIT_TESTS/)
  assert.match(
    workflow,
    /BUILD BROWSER_INSTALL ACCESSIBILITY_BASELINE BROWSER_TESTS PRODUCTION_SMOKE/,
  )
})

test('multi-command CI stages use fail-closed shell semantics', () => {
  const workflow = fs.readFileSync(
    new URL('../../.github/workflows/ci.yml', import.meta.url),
    'utf8',
  )
  for (const [name, nextName] of [
    ['Dependency security policy', 'Lint'],
    ['Unit and integration tests', 'Package and application builds'],
    ['Playwright and accessibility', 'Production web smoke'],
  ]) {
    const start = workflow.indexOf(`      - name: ${name}\n`)
    const end = workflow.indexOf(`      - name: ${nextName}\n`, start)
    assert.notEqual(start, -1, `${name} must exist`)
    assert.notEqual(end, -1, `${nextName} must follow ${name}`)
    assert.match(workflow.slice(start, end), /set -euo pipefail/)
  }

  for (const failingIndex of [0, 1, 2]) {
    const commands = ['true', 'true', 'true']
    commands[failingIndex] = 'false'
    const result = spawnSync(
      'bash',
      ['-c', `set -euo pipefail\n{ ${commands.join('; ')}; } 2>&1 | cat`],
      { encoding: 'utf8' },
    )
    assert.notEqual(result.status, 0, `subcommand ${failingIndex + 1} must fail the stage`)
  }
})

test('CI enforces the protected-base accessibility ratchet before browser tests', () => {
  const workflow = fs.readFileSync(
    new URL('../../.github/workflows/ci.yml', import.meta.url),
    'utf8',
  )
  const ratchet = workflow.indexOf('      - name: Accessibility baseline ratchet\n')
  const browser = workflow.indexOf('      - name: Playwright and accessibility\n')

  assert.ok(ratchet > 0 && browser > ratchet)
  assert.match(
    workflow.slice(ratchet, browser),
    /BASE_REF: \$\{\{ needs\.context\.outputs\.baseline_ref \}\}/,
  )
  assert.match(
    workflow.slice(ratchet, browser),
    /HEAD_REF: \$\{\{ needs\.context\.outputs\.checkout_ref \}\}/,
  )
  assert.match(workflow.slice(ratchet, browser), /--head-ref "\$HEAD_REF"/)
  assert.match(workflow.slice(ratchet, browser), /check-accessibility-baseline\.mjs/)
  assert.match(workflow.slice(browser), /steps\.accessibility_baseline\.outcome == 'success'/)
  assert.match(
    workflow,
    /ACCESSIBILITY_BASELINE: \$\{\{ steps\.accessibility_baseline\.outcome \}\}/,
  )
  assert.match(workflow, /git merge-base --is-ancestor "\$BASELINE_REF" "\$CHECKOUT_REF"/)
})
