import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AUTO_MERGE_CHECK_NAME,
  REQUIRED_CHECKS,
  classifyPullRequest,
  evaluatePackageScripts,
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

test('allows a documentation-only pull request without an opt-in label', () => {
  const result = classifyPullRequest({
    files: ['docs/product/vision.md', 'README.md'],
    labels: ['documentation'],
  })

  assert.equal(result.decision, 'allow')
  assert.deepEqual(result.reasons, [])
})

test('allows cataloged domain-skill paths while protecting the control skill', () => {
  const allowed = classifyPullRequest({
    files: [
      '.claude/skills/stack-research-adr/SKILL.md',
      '.claude/skills/stack-research-adr/agents/openai.yaml',
      '.agents/skills/stack-research-adr',
      'config/agent-skills/catalog.yaml',
      'tests/agent-skills/stack-research-adr.test.mjs',
    ],
  })
  const protectedControl = classifyPullRequest({
    files: ['.claude/skills/cross-agent-skill-platform/SKILL.md'],
  })

  assert.equal(allowed.decision, 'allow')
  assert.deepEqual(allowed.reasons, [])
  assert.equal(protectedControl.decision, 'deny')
  assert.ok(
    protectedControl.reasons.some(
      (reason) => reason.category === 'aegis-retirement',
    ),
  )
})

const deniedPaths = [
  ['.github/workflows/release.yml', 'workflow-permissions'],
  ['scripts/ci/auto-merge-policy.mjs', 'ci-governance'],
  ['config/ci/verification-capabilities.json', 'ci-governance'],
  ['packages/web/tsconfig.json', 'ci-governance'],
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
    const result = classifyPullRequest({ files: [path] })

    assert.equal(result.decision, 'deny')
    assert.ok(
      result.reasons.some(
        (reason) => reason.category === category && reason.path === path,
      ),
    )
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
    const result = classifyPullRequest({ files: [path] })

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
    labels: ['manual-merge'],
  })

  assert.equal(result.decision, 'deny')
  assert.ok(result.reasons.some((reason) => reason.category === 'manual-merge'))
})

test('fails closed when the file list is empty or malformed', () => {
  const empty = classifyPullRequest({ files: [] })
  const malformed = classifyPullRequest({ files: ['../outside'] })

  assert.equal(empty.decision, 'deny')
  assert.ok(
    empty.reasons.some(
      (reason) => reason.category === 'empty-or-incomplete-file-list',
    ),
  )
  assert.equal(malformed.decision, 'deny')
  assert.ok(
    malformed.reasons.some((reason) => reason.category === 'invalid-path'),
  )
})

test('requires real applicable test capabilities for behavior-changing paths', () => {
  const unsupported = classifyPullRequest({
    files: [{ filename: 'packages/web/src/app/page.tsx', status: 'modified' }],
    test_capabilities: { unit: 'unsupported', browser: 'unsupported' },
  })
  const supported = classifyPullRequest({
    files: [{ filename: 'packages/web/src/app/page.tsx', status: 'modified' }],
    test_capabilities: { unit: 'supported', browser: 'supported' },
  })
  const publicAsset = classifyPullRequest({
    files: [{ filename: 'packages/web/public/hero.jpg', status: 'added' }],
    test_capabilities: { unit: 'unsupported', browser: 'unsupported' },
  })
  const futureAppTree = classifyPullRequest({
    files: [{ filename: 'apps/editor/app/page.tsx', status: 'added' }],
    test_capabilities: { unit: 'unsupported', browser: 'unsupported' },
  })

  assert.equal(unsupported.decision, 'deny')
  assert.deepEqual(
    unsupported.reasons.filter(
      (reason) => reason.category === 'insufficient-test-capability',
    ),
    [
      {
        capability: 'unit',
        category: 'insufficient-test-capability',
        path: 'packages/web/src/app/page.tsx',
      },
      {
        capability: 'browser',
        category: 'insufficient-test-capability',
        path: 'packages/web/src/app/page.tsx',
      },
    ],
  )
  assert.equal(supported.decision, 'allow')
  assert.equal(publicAsset.decision, 'deny')
  assert.equal(futureAppTree.decision, 'deny')
})

test('fails closed when a test file is removed', () => {
  const result = classifyPullRequest({
    files: [
      { filename: 'packages/web/src/article.test.tsx', status: 'removed' },
    ],
    test_capabilities: { unit: 'supported', browser: 'supported' },
  })

  assert.equal(result.decision, 'deny')
  assert.ok(result.reasons.some((reason) => reason.category === 'test-removal'))
})

test('classifies both sides of a rename and denies missing rename provenance', () => {
  const protectedRename = classifyPullRequest({
    files: [
      {
        filename: 'docs/retired-ci.md',
        previous_filename: '.github/workflows/ci.yml',
        status: 'renamed',
      },
    ],
  })
  const testRename = classifyPullRequest({
    files: [
      {
        filename: 'docs/article-example.tsx',
        previous_filename: 'tests/helpers/article-fixture.ts',
        status: 'renamed',
      },
    ],
    test_capabilities: { unit: 'supported', browser: 'supported' },
  })
  const missingPreviousPath = classifyPullRequest({
    files: [{ filename: 'docs/unknown-origin.md', status: 'renamed' }],
  })

  assert.equal(protectedRename.decision, 'deny')
  assert.ok(
    protectedRename.reasons.some(
      (reason) =>
        reason.category === 'workflow-permissions' &&
        reason.path === '.github/workflows/ci.yml',
    ),
  )
  assert.equal(testRename.decision, 'deny')
  assert.ok(
    testRename.reasons.some(
      (reason) =>
        reason.category === 'test-removal' &&
        reason.path === 'tests/helpers/article-fixture.ts',
    ),
  )
  assert.equal(missingPreviousPath.decision, 'deny')
  assert.ok(
    missingPreviousPath.reasons.some(
      (reason) => reason.category === 'invalid-previous-path',
    ),
  )
})

test('allows dependency-only manifest changes only when scripts remain trusted', () => {
  const unsupportedCapability = classifyPullRequest({
    files: [{ filename: 'packages/web/package.json', status: 'modified' }],
    test_capabilities: { unit: 'unsupported', browser: 'unsupported' },
  })
  const supportedCapability = classifyPullRequest({
    files: [{ filename: 'packages/web/package.json', status: 'modified' }],
    test_capabilities: { unit: 'supported', browser: 'supported' },
  })
  const unchanged = evaluatePackageScripts({
    entries: [
      {
        path: 'package.json',
        base: { scripts: { test: 'pnpm -r test' } },
        head: {
          scripts: { test: 'pnpm -r test' },
          dependencies: { react: '19.2.0' },
        },
      },
    ],
  })
  const changed = evaluatePackageScripts({
    entries: [
      {
        path: 'package.json',
        base: { scripts: { test: 'pnpm -r test' } },
        head: { scripts: { test: 'true' } },
      },
    ],
  })

  assert.equal(unsupportedCapability.decision, 'deny')
  assert.equal(supportedCapability.decision, 'allow')
  assert.equal(unchanged.decision, 'allow')
  assert.equal(changed.decision, 'deny')
  assert.equal(changed.results[0].state, 'scripts-changed')
})

test('allows only when every exact required check is green from GitHub Actions', () => {
  const result = evaluateRequiredChecks({
    check_runs: [
      ...REQUIRED_CHECKS.map((name, index) =>
        successfulCheck(name, { id: index + 1 }),
      ),
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
      successfulCheck(
        name,
        name === REQUIRED_CHECKS[0]
          ? { conclusion: null, status: 'queued' }
          : {},
      ),
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
      successfulCheck(
        name,
        name === REQUIRED_CHECKS[0] ? { conclusion: 'failure' } : {},
      ),
    ),
    required: REQUIRED_CHECKS,
  })
  const wrongApp = evaluateRequiredChecks({
    check_runs: REQUIRED_CHECKS.map((name) =>
      successfulCheck(
        name,
        name === REQUIRED_CHECKS[0] ? { app: { slug: 'untrusted-app' } } : {},
      ),
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

  const result = evaluateRequiredChecks({
    check_runs: runs,
    required: REQUIRED_CHECKS,
  })

  assert.equal(result.decision, 'deny')
  assert.equal(
    result.checks.find((check) => check.name === REQUIRED_CHECKS[0])?.id,
    11,
  )
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
