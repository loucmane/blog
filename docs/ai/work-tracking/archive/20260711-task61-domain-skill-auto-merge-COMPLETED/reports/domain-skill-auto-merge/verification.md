# Task 61 Verification

Date: 2026-07-11 CEST

## Direct Policy And Security Tests

- `pnpm ci:auto-merge-policy` — PASS
  - 25 classifier/check/package-integrity assertions
  - 12 privileged-workflow trust-boundary assertions
- `pnpm ci:agent-skills` — PASS
  - platform validation passed
  - 17 skill-platform and review-contract tests passed
- extracted privileged shell body with `bash -n` — PASS
- parsed `.github/workflows/auto-merge.yml` as YAML — PASS
- Prettier check for every modified JavaScript/YAML/JSON policy surface — PASS

The negative corpus proves denial for workflow/CI policy, capability contract,
verification configuration, secrets, deployment, migrations, destructive
operations, branch protection, Aegis/authority, deny labels, malformed paths,
test removal, unsupported applicable test capability, package-script changes,
missing/pending/failed/wrong-app checks, stale duplicate checks, forks,
incomplete inventories, stale heads, non-clean mergeability, unresolved review
threads, and changes-requested reviews.

Rename provenance is classified on both sides. Renaming a protected workflow or
test into an apparently harmless destination remains denied, and a renamed file
without a valid `previous_filename` fails closed.

## Repository Verification

- `pnpm install --frozen-lockfile` — PASS; lockfile unchanged
- `pnpm typecheck` — PASS
- `pnpm lint` — PASS with pre-existing warnings only
- `pnpm build` — PASS with pre-existing Rollup, Browserslist, and lint warnings
- `pnpm ci:taskmaster` — PASS; 30 tasks, 67 valid dependency references
- `pnpm ci:aegis` — PASS
- `pnpm ci:guard` — PASS after recording required Taskmaster/date evidence and
  plan synchronization; the 16 legacy canonical-document findings remain the
  accepted Task 47 baseline
- `aegis verify --strict` — PASS; 30 checks, zero required failures, zero
  warnings, one optional unsupported MCP-memory check
- Aegis CI witness against `origin/main` — PASS
- `git diff --check` — PASS

## Test-Capability Truth

- `pnpm test:capability unit` — PASS as `unsupported-tracked`, owned by Task 39
- `pnpm test:capability browser` — PASS as `unsupported-tracked`, owned by Task 39
- `pnpm test` — FAILS on the pre-existing baseline because the UI package calls
  `jest` without a direct installed test runner

This failure is not hidden or waived. It is the reason trusted main declares
unit and browser capabilities `unsupported`. The new merge classifier refuses
unattended behavior-changing product and dependency changes until Task 39
installs real applicable suites and updates the protected capability contract.
Task 61 itself is covered by its direct policy/workflow/skill-platform tests,
which all pass.

## Remaining Proof

GitHub must still validate the committed exact head through all four protected
checks. After the bootstrap governance PR merges, a non-behavioral canary must
prove label-free classification, autonomous squash merge, branch deletion,
main synchronization, and continuation to the next dependency-ready task.
