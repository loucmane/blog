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
