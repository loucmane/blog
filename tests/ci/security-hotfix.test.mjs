import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

import {
  evaluateAudit,
  summarizeAudit,
} from '../../scripts/ci/check-dependency-security.mjs'
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
  assert.throws(
    () => summarizeAudit({ metadata: {} }),
    /missing metadata\.vulnerabilities/,
  )
  assert.match(
    evaluateAudit(auditPayload({ critical: 0 }), 2).errors[0],
    /exited 2/,
  )
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

  assert.match(workflow, /^      - name: Dependency security policy$/m)
  assert.match(workflow, /^        id: dependency_security$/m)
  assert.match(workflow, /pnpm test:security-hotfix/)
  assert.match(workflow, /pnpm security:audit/)
  assert.match(workflow, /^      - name: Production web smoke$/m)
  assert.match(workflow, /^        id: production_smoke$/m)
  assert.match(workflow, /pnpm test:smoke:web/)
  assert.match(workflow, /INSTALL DEPENDENCY_SECURITY TYPECHECK/)
  assert.match(workflow, /BUILD PRODUCTION_SMOKE/)
})
