import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AUTO_MERGE_CHECK_NAME,
  REQUIRED_CHECKS,
  classifyPullRequest,
  evaluateRequiredChecks,
} from '../../scripts/ci/auto-merge-policy.mjs'


function successfulCheck(name, overrides = {}) {
  return {
    app: { slug: 'github-actions' },
    completed_at: '2026-07-10T10:00:00Z',
    conclusion: 'success',
    id: 100,
    name,
    started_at: '2026-07-10T09:59:00Z',
    status: 'completed',
    ...overrides,
  }
}


test('allows an explicitly labeled documentation-only pull request', () => {
  const result = classifyPullRequest({
    files: ['docs/product/vision.md', 'README.md'],
    labels: ['documentation', 'auto-merge'],
  })

  assert.equal(result.decision, 'allow')
  assert.deepEqual(result.reasons, [])
})


test('requires the explicit auto-merge label', () => {
  const result = classifyPullRequest({ files: ['README.md'], labels: ['documentation'] })

  assert.equal(result.decision, 'deny')
  assert.deepEqual(result.reasons, [
    { category: 'missing-auto-merge-label', label: 'auto-merge' },
  ])
})


const deniedPaths = [
  ['.github/workflows/release.yml', 'workflow-permissions'],
  ['scripts/ci/auto-merge-policy.mjs', 'ci-governance'],
  ['packages/web/package.json', 'ci-governance'],
  ['config/secrets/production.json', 'secret-material'],
  ['infra/production/main.tf', 'production-deployment'],
  ['database/migrations/0001_drop_table.sql', 'migration'],
  ['scripts/ops/destroy-preview.sh', 'destructive-operation'],
  ['config/branch-protection.json', 'branch-protection'],
  ['.aegis/contract.md', 'aegis-retirement'],
  ['docs/ai/AEGIS_AUTONOMY_GRANT.md', 'aegis-retirement'],
]

for (const [path, category] of deniedPaths) {
  test(`denies ${category} path ${path}`, () => {
    const result = classifyPullRequest({ files: [path], labels: ['auto-merge'] })

    assert.equal(result.decision, 'deny')
    assert.ok(result.reasons.some((reason) => reason.category === category && reason.path === path))
  })
}


test('denies changes to workflow and CI enforcement surfaces', () => {
  const protectedPaths = [
    '.github/workflows/auto-merge.yml',
    '.github/workflows/ci.yml',
    'scripts/ci/auto-merge-policy.mjs',
    'tests/ci/auto-merge-workflow.test.mjs',
  ]

  for (const path of protectedPaths) {
    const result = classifyPullRequest({ files: [path], labels: ['auto-merge'] })

    assert.equal(result.decision, 'deny')
    assert.ok(
      result.reasons.some(
        (reason) =>
          ['workflow-permissions', 'ci-governance'].includes(reason.category) &&
          reason.path === path,
      ),
    )
  }
})


test('deny labels override otherwise safe paths', () => {
  const result = classifyPullRequest({
    files: ['docs/release-notes.md'],
    labels: ['auto-merge', 'manual-merge'],
  })

  assert.equal(result.decision, 'deny')
  assert.ok(result.reasons.some((reason) => reason.category === 'manual-merge'))
})


test('fails closed when the file list is empty or malformed', () => {
  const empty = classifyPullRequest({ files: [], labels: ['auto-merge'] })
  const malformed = classifyPullRequest({ files: ['../outside'], labels: ['auto-merge'] })

  assert.equal(empty.decision, 'deny')
  assert.ok(empty.reasons.some((reason) => reason.category === 'empty-or-incomplete-file-list'))
  assert.equal(malformed.decision, 'deny')
  assert.ok(malformed.reasons.some((reason) => reason.category === 'invalid-path'))
})


test('allows only when every exact required check is green from GitHub Actions', () => {
  const result = evaluateRequiredChecks({
    check_runs: [
      ...REQUIRED_CHECKS.map((name, index) => successfulCheck(name, { id: index + 1 })),
      successfulCheck(AUTO_MERGE_CHECK_NAME, {
        conclusion: null,
        id: 999,
        status: 'in_progress',
      }),
    ],
    excluded_names: [AUTO_MERGE_CHECK_NAME],
    required: REQUIRED_CHECKS,
  })

  assert.equal(result.decision, 'allow')
  assert.ok(result.checks.every((check) => check.state === 'success'))
})


test('defers when a required check is missing or pending', () => {
  const missing = evaluateRequiredChecks({
    check_runs: REQUIRED_CHECKS.slice(0, -1).map(successfulCheck),
    required: REQUIRED_CHECKS,
  })
  const pending = evaluateRequiredChecks({
    check_runs: REQUIRED_CHECKS.map((name) =>
      successfulCheck(name, name === REQUIRED_CHECKS[0] ? { conclusion: null, status: 'queued' } : {}),
    ),
    required: REQUIRED_CHECKS,
  })

  assert.equal(missing.decision, 'defer')
  assert.ok(missing.checks.some((check) => check.state === 'missing'))
  assert.equal(pending.decision, 'defer')
  assert.ok(pending.checks.some((check) => check.state === 'pending'))
})


test('denies failed checks and checks from an unexpected app', () => {
  const failed = evaluateRequiredChecks({
    check_runs: REQUIRED_CHECKS.map((name) =>
      successfulCheck(name, name === REQUIRED_CHECKS[0] ? { conclusion: 'failure' } : {}),
    ),
    required: REQUIRED_CHECKS,
  })
  const wrongApp = evaluateRequiredChecks({
    check_runs: REQUIRED_CHECKS.map((name) =>
      successfulCheck(name, name === REQUIRED_CHECKS[0] ? { app: { slug: 'untrusted-app' } } : {}),
    ),
    required: REQUIRED_CHECKS,
  })

  assert.equal(failed.decision, 'deny')
  assert.ok(failed.checks.some((check) => check.state === 'failed'))
  assert.equal(wrongApp.decision, 'deny')
  assert.ok(wrongApp.checks.some((check) => check.state === 'wrong-app'))
})


test('uses the newest duplicate check run instead of a stale success', () => {
  const runs = REQUIRED_CHECKS.map((name) => successfulCheck(name, { id: 10 }))
  runs.push(
    successfulCheck(REQUIRED_CHECKS[0], {
      completed_at: '2026-07-10T10:05:00Z',
      conclusion: 'failure',
      id: 11,
    }),
  )

  const result = evaluateRequiredChecks({ check_runs: runs, required: REQUIRED_CHECKS })

  assert.equal(result.decision, 'deny')
  assert.equal(result.checks.find((check) => check.name === REQUIRED_CHECKS[0])?.id, 11)
})


test('flattens paginated check-run responses', () => {
  const midpoint = 2
  const result = evaluateRequiredChecks({
    pages: [
      { check_runs: REQUIRED_CHECKS.slice(0, midpoint).map(successfulCheck) },
      { check_runs: REQUIRED_CHECKS.slice(midpoint).map(successfulCheck) },
    ],
    required: REQUIRED_CHECKS,
  })

  assert.equal(result.decision, 'allow')
})
