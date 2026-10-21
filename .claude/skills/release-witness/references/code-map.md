# Release evidence code map

Snapshot: Task 54 starting commit `efd9166e3e73c485991df47c5ca02693f4d3246e`.
Inspect these files at the reviewed revision before using their commands or assumptions.
This map describes configured checks, not successful executions of them.
The unit-step example and dependency-review job below were rechecked against local
`origin/main` at `28935cce6f6a22140ec6b3b33bfa2c6105159c30` on 2026-10-21;
other entries retain the original snapshot scope.

## Existing checks

| Source | What it establishes and what it does not |
| --- | --- |
| `.github/workflows/ci.yml` and `scripts/ci/post-merge-context.mjs` | The context job resolves a trusted checkout_ref and accessibility baseline_ref. PR, push and controlled post-merge dispatch have different revision/predecessor contracts. Record the resolved SHA and run identity instead of assuming a green PR run tested the deployed artifact. |
| `.github/workflows/ci.yml` workspace job | Collects outcomes for runtime bootstrap/contract, frozen install, dependency security, typecheck, lint, format, unit/coverage tests, build, browser installation, baseline ratchet, browser tests and production smoke. Many steps continue-on-error to collect evidence; Enforce workspace results requires every listed outcome to be success. A skipped prerequisite-dependent check is not success. |
| `.github/workflows/ci.yml` governance job | Checks skill platform, policy/workflow contracts, frozen Taskmaster/Aegis archive integrity, native coordination and legacy guard. Those historical integrity checks do not restore Taskmaster/Aegis as active workflow authority. Failure artifacts are uploaded conditionally; an absent artifact is not proof of a passing run. |
| `.github/workflows/ci.yml` secret-scan job | Standard events use a pinned Gitleaks action; trusted dispatch uses a checksum-verified CLI. A workflow definition is not evidence that either scan ran for a particular candidate. |
| `.github/workflows/ci.yml` dependency-review job | Runs only for pull_request events and uses the pinned dependency-review action with fail-on-severity set to moderate. This PR dependency-change review is separate from the workspace dependency audit; it does not run on push or dispatch, and its configuration is not proof of execution. |
| `.github/workflows/auto-merge.yml` and `scripts/ci/auto-merge-policy.mjs` | Uses policy from the protected default branch, checks candidate identity and file inventory, validates check runs, rechecks PR state and matches the head commit when merging. It then dispatches post-merge CI with the merge SHA and reviewed head SHA. Existing automation does not grant this skill permission to label, merge or dispatch. |
| `scripts/ci/check-test-capability.mjs` | Checks supported unit/browser capability, scripts, critical test inventory and disabled modifiers. Expected browser projects are desktop-chromium and mobile-chromium. This static source/config validation does not run those tests. It reads a historical Task 39 lifecycle field; do not update frozen state to satisfy it. |
| `scripts/ci/check-test-results.mjs` | Vitest requires positive total, success, zero failed/pending/todo, all passed, nonempty assertion files and critical contracts exactly once. Playwright requires exact project inventory, executed specs, zero skipped/unexpected/flaky and runner errors, passing attempts and critical journeys once per project. CLI requires forbidOnly when CI is exactly true. Passing retries do not erase failed attempts under this contract. |
| `scripts/ci/check-accessibility-baseline.mjs` | Reads exact Git objects and compares the protected predecessor baseline; forbids new or rewritten accepted serious-violation fingerprints and metadata/project drift. Bootstrap uses an exact digest. This is an anti-regression check, not an accessibility audit. |
| `scripts/ci/check-dependency-security.mjs` | Runs pnpm audit JSON, validates counts and reviewed exceptions, and uses registry version evidence when evaluating exceptions. No unexcepted vulnerabilities at any severity are allowed. An unavailable audit or version lookup is not a zero-vulnerability result; offline unit fixtures do not replace it. |
| `scripts/ci/web-production-smoke.mjs` | Starts a local production Next server and requests `/`; asserts HTTP 200, text/html, a body length of at least 512 characters and html delimiters. The report separately records byte length. It does not establish owner sign-in, publication, full reader journeys, deployed health or rollback success. |
| `package.json` | test/test:coverage and test:browser chain runners to their result validators. ci:agent-skills chains platform validation to Node contract tests. Inspect exact scripts before using a shorthand command as evidence. |

`tests/ci/test-results.test.mjs`, `tests/ci/test-capability.test.mjs`,
`tests/ci/accessibility-baseline.test.mjs`, `tests/ci/security-hotfix.test.mjs`,
`tests/ci/auto-merge-policy.test.mjs` and `tests/ci/auto-merge-workflow.test.mjs`
exercise the verification machinery. Their pass counts are distinct from application tests,
browser journeys or a live vulnerability scan.

## Worked example: an overstated CI label

The step named **Unit and integration tests** runs `pnpm test:capability unit`,
`pnpm test:quality-contract`, and `pnpm test:coverage`. The default Vitest configuration
excludes `*.integration.test.ts`; database integration selection requires
`TASK42_CONTENT_INTEGRATION=1`, which the separate `test:content:integration` runner
sets. This CI step does not invoke that runner. Report the commands and their actual
results, with database integration execution unproven by this step, even if the step
is green. Bead `blog-ued4` tracks the CI gap; the label alone is not coverage evidence.

## Deployment and recovery: requirements versus proof

- `docs/deployment/target-platform.md` is explicitly provisional and blocked on a deployment
  spike. It describes immutable application rollback, expand/migrate/contract compatibility,
  verified restore or forward repair, and deployment evidence. Do not claim this topology
  is accepted or a rollback rehearsal happened because the runbook exists.
- `docs/deployment/backup-restore.md` distinguishes the Task 42 isolated drill from Task 46
  hosted-provider PITR, independent encrypted retention, recurring drills and production
  RPO/RTO evidence. The 24-hour RPO and four-hour RTO are provisional launch targets.
  Inspect a drill's actual artifacts before reporting measured recovery or data usability.
- `docs/deployment/reader-lab-preview.md` is a Reader Lab preview procedure. Preview evidence
  is scoped to its environment and synthetic content, not production launch acceptance.

## PR and host handoff

Local history records scoped verification prose (for example `40ec2a7`, PR 72, distinguishes
host checks from real Docker lifecycle exercises). The latest eight commit bodies at the
snapshot do not provide a uniform Verification section, and Git history does not necessarily
retain the full PR description. Obtain the actual PR/run artifact when needed; do not invent
counts or quote a historical result as current evidence. No remote access is necessary to
report that limitation.

The route overlaps security on workflow files, dependency-security checks and security-hotfix
tests, and backend on backup/restore documentation. Those overlaps request distinct reviews,
not multiple independent executions of the same check. Choose checks proportionate to the
change and within execution scope. For result review, use existing outputs from the matching
run, not stale files left behind by an earlier successful attempt:

```sh
node scripts/ci/check-test-results.mjs unit ci-artifacts/vitest-results.json
node scripts/ci/check-test-results.mjs browser ci-artifacts/playwright-results.json
```

These examples validate supplied reports; they do not run Vitest or Playwright themselves.
