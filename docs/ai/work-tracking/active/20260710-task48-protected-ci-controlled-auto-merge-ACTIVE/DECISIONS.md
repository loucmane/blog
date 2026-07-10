# Task 48 Bootstrap Protected CI and Controlled Auto-Merge - Decisions

## Purpose
Record decisions before implementation, including options considered, rationale, and evidence.

## Decisions
- 2026-07-10 - Use Aegis-native current work as the portable workflow authority for this task. Taskmaster and Serena remain optional unless explicitly required.
- 2026-07-10 - Keep the first Task 48 pull request to read-only CI bootstrap and supporting deterministic governance checks; do not include auto-merge or repository-rule mutations.
- 2026-07-10 - Pin CI to the currently committed Node 22 and pnpm 9 baseline. Runtime modernization remains Task 38.
- 2026-07-10 - Treat the first workflow pull request as a security boundary that requires attended human merge approval even if every check passes.
- 2026-07-10 - Apply `authority=standing-grant:sota-magazine-2026-autonomy-v1`; the full non-expansive policy remains in `docs/ai/AEGIS_AUTONOMY_GRANT.md`.
- 2026-07-10 - Use current stable full-SHA action pins rather than copying HP-Fetcher's older major tags.
- 2026-07-10 - Aggregate stage outcomes only after every available diagnostic stage runs; intermediate `continue-on-error` never weakens the final failing gate.
- 2026-07-10 - Use explicit unsupported-capability contracts for missing test surfaces. Task 39 owns replacement and the contracts fail when capability changes, preventing a permanent silent skip.
- 2026-07-10 - Retain the exact legacy drift baseline rather than adding missing legacy templates or retiring scaffolding during this goal.
- 2026-07-10 - Assign the temporary UI ESLint, cmdk React-type, unsupported-test, and legacy-drift bridges to Tasks 39 or 47 with explicit removal deadlines in the CI bootstrap research record.
- 2026-07-10 - Continue Task 48 on fresh branch `feat/task-48-controlled-auto-merge`; preserve the merged and published bootstrap branch without history rewriting.
- 2026-07-10 - Keep global auto-merge workflow permissions empty and grant only `contents: write` plus `pull-requests: write` to the isolated merge job.
- 2026-07-10 - Execute policy code checked out explicitly from protected `main`, never from the pull-request head, and reject fork heads before any write operation.
- 2026-07-10 - Require the explicit `auto-merge` label, exact required checks from `github-actions`, a complete file inventory, a current branch, and an unchanged head SHA. Deny workflow, authority, Aegis, secret, deployment, migration, destructive, and branch-protection paths.
- 2026-07-10 - Use squash plus `--delete-branch` and `--match-head-commit`; do not use administrator bypass, native auto-labeling, merge commits, rebase, or force/history operations.

## Progress Log
- **2026-07-10 00:50 CEST** - [S:20260710|W:task48-protected-ci-controlled-auto-merge|H:aegis:kickoff|E:.aegis/state/current-work.json] Decisions log initialized by Aegis kickoff.
- **2026-07-10 00:51 CEST** - [S:20260710|W:task48-protected-ci-controlled-auto-merge|H:standing-grant:sota-magazine-2026-autonomy-v1:task48-scope|E:docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/FINDINGS.md] Confirmed the attended CI-bootstrap boundary, baseline constraints, separate auto-merge delivery, and operator authority before implementation

<!-- AEGIS:BEGIN generated-sweh-projection -->
<!-- AEGIS:projection-state {"event_count": 17, "last_event_id": "c9bb44ee95064f7a9162be36de67eeeb", "schema": "legacy-shadow-sweh-projection-v1"} -->
- **2026-07-10 12:25 CEST** - [S:20260710|W:task48-protected-ci-controlled-auto-merge|H:task-master:set-status|E:.taskmaster/tasks/tasks.json] Reaffirmed Task 48 in-progress status after delivery projection so session and tracker retain Taskmaster evidence

## Generated S:W:H:E Projection

_Generated from the passive Aegis ledger. Human-authored content outside this block is preserved._

- [S:unknown W:task-obs-20260709-201621-sota-magazine-reviv... H:scope E:ledger:17dd2f29dd5...] Scope recorded for obs-20260709-201621-sota-magazine-revival-dogfood. Paths: docs/**, plans/**, sessions/**.
- [S:2026-07-09-001-obs-20260709-201621-sota-magazine-revival-dogfood W:observe-sota-magazine-revival-dogfood H:scope E:ledger:9119244a00d...] Scope recorded for obs-20260709-201621-sota-magazine-revival-dogfood. Paths: docs/**, plans/**, sessions/**.
- [S:2026-07-09-001-obs-20260709-201621-sota-magazine-revival-dogfood W:observe-sota-magazine-revival-dogfood H:scope E:ledger:a51384dc8ad...] Scope recorded for aegis-dogfood-6. Paths: .aegis/**, .claude/**, AGENTS.md.
- [S:2026-07-09-001-obs-20260709-201621-sota-magazine-revival-dogfood W:observe-sota-magazine-revival-dogfood H:witness E:ledger:65bc73b60da...] Delivery witness PASS recorded at 6b65901; report: .aegis/reports/witness-report.json.
- [S:2026-07-09-001-obs-20260709-201621-sota-magazine-revival-dogfood W:observe-sota-magazine-revival-dogfood H:delivery E:ledger:0f58ed16ff1...] Delivery state recorded: pr_draft for PR #6 at 6b65901e7d56934....
- [S:2026-07-09-001-task33-sota-magazine-foundation W:task-33-sota-magazine-foundation H:scope E:ledger:c5a17f51e88...] Scope recorded for 33. Paths: .taskmaster/docs/**, .taskmaster/tasks/**, .taskmaster/reports/**.
- [S:2026-07-09-001-task33-sota-magazine-foundation W:task-33-sota-magazine-foundation H:delivery E:ledger:fe913b0865d...] Delivery state recorded: pr_draft for PR #7 at 5969d2ce3ef3222....
- [S:2026-07-09-001-task33-sota-magazine-foundation W:task-33-sota-magazine-foundation H:delivery E:ledger:9d1289f72a6...] Delivery state recorded: pr_merged for PR #7 at 251341edc535040....
- [S:2026-07-09-001-task36-frozen-pre-upgrade-baseline W:task-36-frozen-pre-upgrade-baseline H:scope E:ledger:5acd2d761d6...] Scope recorded for 36. Paths: .aegis/foundation-manifest.json, .taskmaster/tasks/**, docs/ai/work-tracking/**.
- [S:2026-07-09-001-task36-frozen-pre-upgrade-baseline W:task-36-frozen-pre-upgrade-baseline H:witness E:ledger:62985519d1d...] Delivery witness PASS recorded at 9f804a1; report: .aegis/reports/witness-report.json.
- [S:2026-07-09-001-task36-frozen-pre-upgrade-baseline W:task-36-frozen-pre-upgrade-baseline H:scope E:ledger:bb8126e4309...] Scope recorded for 36. Paths: .aegis/foundation-manifest.json, .taskmaster/tasks/**, docs/ai/AEGIS_AUTONOMY_GRANT.md.
- [S:2026-07-09-001-task36-frozen-pre-upgrade-baseline W:task-36-frozen-pre-upgrade-baseline H:witness E:ledger:60478e8aa89...] Delivery witness FAIL recorded at 9f804a1; report: .aegis/reports/witness-report.json.
- [S:2026-07-09-001-task36-frozen-pre-upgrade-baseline W:task-36-frozen-pre-upgrade-baseline H:delivery E:ledger:e0a34f8f470...] Delivery state recorded: pr_draft for PR #8 at 77fb50d68b67345....
- [S:2026-07-10-001-task48-protected-ci-controlled-auto-merge W:task-48-protected-ci-controlled-auto-merge H:delivery E:ledger:e12f7147e8d...] Delivery state recorded: pr_merged for PR #9 at 3611d55e2f8bee5....
- [S:2026-07-10-001-task48-protected-ci-controlled-auto-merge W:task-48-protected-ci-controlled-auto-merge H:scope E:ledger:e51e5469a17...] Scope recorded for 48. Paths: .github/workflows/auto-merge.yml, scripts/ci/**, tests/ci/**.
- [S:2026-07-10-001-task48-protected-ci-controlled-auto-merge W:task-48-protected-ci-controlled-auto-merge H:witness E:ledger:7c22859bb75...] Delivery witness PASS recorded at 4a6f03e; report: .aegis/reports/witness-report.json.
- [S:2026-07-10-001-task48-protected-ci-controlled-auto-merge W:task-48-protected-ci-controlled-auto-merge H:scope E:ledger:c9bb44ee950...] Scope recorded for 48. Paths: .aegis/foundation-manifest.json, .github/workflows/auto-merge.yml, .github/workflows/ci.yml.

<!-- AEGIS:END generated-sweh-projection -->
