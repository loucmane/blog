# Task 64 Verification

**Task:** 64 — Permit Verification-Only Aegis Manifest Diffs in Autonomous Delivery
**Branch:** `feat/task-64-manifest-verification-diff-policy`
**Authority:** `standing-grant:sota-magazine-2026-autonomy-v2`

## Scope

This task changes only the trusted controlled-auto-merge workflow and policy,
focused policy/workflow tests, Taskmaster and Aegis evidence, and delivery
documentation. It does not change product code, package manifests, the
lockfile, Aegis runtime assets, enforcement, operator authority, secrets,
deployment, migrations, or data.

## Results

| Gate | Result | Evidence |
| --- | --- | --- |
| Frozen install | Pass | `pnpm install --frozen-lockfile`; lockfile unchanged |
| Typecheck | Pass | `pnpm typecheck` |
| Dependency regression | Pass | `pnpm test:security-hotfix` |
| Dependency audit | Pass | `pnpm security:audit`; zero advisories at every severity |
| Lint | Pass | `pnpm lint` |
| Unit capability | Pass, unsupported tracked | `pnpm test:capability unit`; Task 39 remains owner |
| Browser capability | Pass, unsupported tracked | `pnpm test:capability browser`; Task 39 remains owner |
| Package/application build | Pass | `pnpm build` |
| Production web smoke | Pass | `pnpm test:smoke:web`; HTTP 200 |
| Auto-merge policy | Pass | 45 policy assertions, including the exact PR #19 timestamp-only regression fixture and 14 adversarial manifest cases |
| Privileged workflow contract | Pass | 13 workflow trust-boundary assertions |
| Workflow syntax | Pass | checksum-verified official `actionlint` 1.7.12 against `.github/workflows/auto-merge.yml` |
| Skill platform | Pass | 3 skills, 3 routes, 4 test files |
| Taskmaster CI | Pass | 32 tasks, 71 dependencies, zero errors |
| Taskmaster health | Pass | 32 tasks, 3 subtasks, zero invalid references |
| Taskmaster dependency validation | Pass | 71 references valid |
| Aegis capsule | Pass | `pnpm ci:aegis` |
| Aegis strict verification | Pass | 31 checks, zero required failures, one expected advisory-mode warning |
| Aegis brief | Pass | `aegis brief --check` |
| Aegis CI witness | Pass before closeout; final-head rerun required after commit | scope, diff accounting, done-flip containment, delegated CI |
| Legacy guard | Pass | five completed-state regressions, S:W:H:E validation, expected 16-item drift baseline |
| Secret scan | Pass | checksum-verified official `gitleaks` 8.30.1 staged scan; no leaks |
| Diff integrity | Pass | `git diff --check` |

## Environment-Limited Checks

- The dependency audit's nested `pnpm audit` process was denied by the sandbox;
  the exact command passed with approved network access and zero advisories.
- The web smoke could not bind loopback inside the sandbox; the exact command
  passed with approved loopback access and returned HTTP 200.
- `actionlint` and `gitleaks` were not preinstalled. Their official release
  archives and checksums were downloaded to `/tmp`, checksum-verified, and run
  without adding repository packages or tools. Protected GitHub CI remains the
  authoritative hosted check.

## Policy Proof

- Eligibility requires an in-place modification of exactly
  `.aegis/foundation-manifest.json`.
- Protected `main` supplies the evaluator and base manifest.
- GitHub supplies the exact pull-request-head manifest as inert JSON.
- The head timestamp must be valid RFC 3339 and strictly advance.
- Canonical JSON after removing only `verification.last_verified_at` must be
  identical.
- Both initial and final policy evaluations require an explicitly complete
  changed-file inventory.
- Missing evidence, any other manifest mutation, and every other Aegis path
  remain denied.
- The privileged job still checks out no pull-request code or artifact,
  executes only trusted policy code, and retains exactly `contents: write` and
  `pull-requests: write`.

## Delivery Boundary

Task 64 changes the write-capable workflow and trusted merge policy. Its pull
request must remain attended and must not receive autonomous merge treatment.
Rollback is a reviewed revert of the Task 64 commit.
