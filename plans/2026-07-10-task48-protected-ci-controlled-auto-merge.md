---
session_id: 2026-07-10-001-task48-protected-ci-controlled-auto-merge
work_context: task48-protected-ci-controlled-auto-merge
handler_target: .aegis/state/current-work.json
task_ids: [48]
branch_policy: feature-required
evidence_summary:
  - docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/
  - .aegis/state/current-work.json
  - sessions/2026/07/2026-07-10-001-task48-protected-ci-controlled-auto-merge.md
  - plans/2026-07-10-task48-protected-ci-controlled-auto-merge.md
plan_version: v1
emergency_bypass: false
---

# Plan - Task 48 Bootstrap Protected CI and Controlled Auto-Merge

## Header
- **Session ID (S)**: 2026-07-10-001-task48-protected-ci-controlled-auto-merge
- **Work Context (W)**: task48-protected-ci-controlled-auto-merge
- **Handler Target (H)**: .aegis/state/current-work.json
- **Task IDs**: 48
- **Branch Policy**: feature-required
- **Evidence Summary (E)**: docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/, .aegis/state/current-work.json, sessions/2026/07/2026-07-10-001-task48-protected-ci-controlled-auto-merge.md, plans/2026-07-10-task48-protected-ci-controlled-auto-merge.md
- **Plan Version**: v1
- **Emergency Bypass**: false
- **Authority**: Aegis-native workflow state (`.aegis/state/current-work.json`)
- **Operator Authority**: `docs/ai/AEGIS_AUTONOMY_GRANT.md`; `authority=standing-grant:sota-magazine-2026-autonomy-v1`
- **Optional Integrations**: Taskmaster and Serena may be used when present, but are not required for READY unless this task marks them required.

## Plan Table
| Step ID | Description | Evidence | Status |
| --- | --- | --- | --- |
| plan-step-scope | Confirm task scope, constraints, expected outputs, and affected files before implementation | docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/FINDINGS.md; docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/DECISIONS.md | completed |
| plan-step-implement | Make only task-scoped changes and record implementation notes | docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/IMPLEMENTATION.md; changed files; .github/workflows/ci.yml | completed |
| plan-step-verify | Run verification, capture reports, and update handoff state | docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/reports/protected-ci-controlled-auto-merge/; docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/HANDOFF.md; docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/TRACKER.md; docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/reports/protected-ci-controlled-auto-merge/task-verification.md; .aegis/reports/verification-report.json | completed |
| plan-step-protect-main | Apply the attended exact-check branch-protection policy and verify every field | GitHub branch protection API; Aegis operator-authority ledger event `6970437b0c914d10aa6051046c27b25c` | completed |
| plan-step-auto-merge | Implement the separately reviewed controlled auto-merge workflow and deterministic policy tests | .github/workflows/auto-merge.yml; scripts/ci/auto-merge-policy.mjs; tests/ci/ | completed |
| plan-step-auto-merge-verify | Run local and hosted workflow, policy, governance, security, and Aegis verification | docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/reports/protected-ci-controlled-auto-merge/auto-merge-verification.md; .aegis/reports/verification-report.json; .aegis/reports/witness-report.json | in-progress |
| plan-step-canary | After attended merge approval, prove the workflow on a documentation-only labeled canary | GitHub canary pull request and delivery evidence; docs/research/2026-07-10-controlled-auto-merge-canary.md | in-progress |
| plan-step-emergency | Optional - only if a bypass is explicitly authorized | Waiver plus post-mortem note in docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/DECISIONS.md and docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/FINDINGS.md | n/a |

## Scope
- `.aegis/state/current-work.json`
- `.github/workflows/auto-merge.yml`
- `.github/workflows/ci.yml`
- `scripts/ci/auto-merge-policy.mjs`
- `tests/ci/`
- `docs/research/2026-07-10-controlled-auto-merge.md`
- `.taskmaster/tasks/tasks.json`
- `sessions/2026/07/2026-07-10-001-task48-protected-ci-controlled-auto-merge.md`
- `plans/2026-07-10-task48-protected-ci-controlled-auto-merge.md`
- `docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/`
- `docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/reports/protected-ci-controlled-auto-merge/`
- Task 48 only

## Goals
- [x] Bootstrap read-only CI on the committed Node 22 and pnpm 9 baseline.
- [x] Protect public main using exact successful GitHub check names after attended workflow review.
- [ ] Add controlled auto-merge separately and prove it with a documentation-only canary.

## Branch Policy
- Working branch: `feat/task-48-controlled-auto-merge`
- Persistent work should happen on a branch containing `task-48`.

## Amendments & Versioning
- 2026-07-10 - Task 48 kickoff created by Aegis.
- 2026-07-10 - `aegis log` updated `plan-step-scope` to `completed` with evidence `docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/FINDINGS.md`.
- 2026-07-10 - `aegis log` updated `plan-step-implement` to `completed` with evidence `.github/workflows/ci.yml`.
- 2026-07-10 - `aegis log` updated `plan-step-verify` to `completed` with evidence `docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/reports/protected-ci-controlled-auto-merge/task-verification.md`.
- 2026-07-10 - `aegis log` updated `plan-step-verify` to `completed` with evidence `.aegis/reports/verification-report.json`.
- 2026-07-10 - PR #9 merged, protected `main` was applied and verified, Task 48 was set in-progress through Taskmaster, and work continued on fresh branch `feat/task-48-controlled-auto-merge` under `authority=standing-grant:sota-magazine-2026-autonomy-v1`.
- 2026-07-10 - `aegis log` updated `plan-step-auto-merge` to `completed` with evidence `.github/workflows/auto-merge.yml`.
- 2026-07-10 - `aegis log` updated `plan-step-auto-merge-verify` to `in-progress` with evidence `.aegis/reports/verification-report.json`.
- 2026-07-10 - `aegis log` updated `plan-step-auto-merge-verify` to `in-progress` with evidence `.aegis/reports/witness-report.json`.
- 2026-07-10 - `aegis log` updated `plan-step-auto-merge-verify` to `in-progress` with evidence `docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/reports/protected-ci-controlled-auto-merge/auto-merge-verification.md`.
- 2026-07-10 - `aegis log` updated `plan-step-canary` to `in-progress` with evidence `docs/research/2026-07-10-controlled-auto-merge-canary.md`.

## Continuation & Handoff
- Next owner: project owner
- Context reload steps:
  1. Read root `AGENTS.md`, `docs/ai/AEGIS_AUTONOMY_GRANT.md`, and verify the latest ledger-recorded grant digest.
  2. Read `sessions/current` and this plan.
  3. Read `.aegis/state/current-work.json`.
  4. Read `docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/TRACKER.md` and `docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/HANDOFF.md`.
  5. Run Aegis readiness/verify commands before mutation.
- Outstanding risks/todos: keep Taskmaster and Serena optional unless explicitly enabled for this task.

## Conflict & Scope Declaration
- Related plans: none recorded at kickoff.
- Gate cross-check: Aegis readiness must stay aligned with the task branch, current session, current plan, active work-tracking folder, and `.aegis/state/current-work.json`.

## Evidence Checklist
- [x] Aegis current work state exists
- [x] Session and plan current pointers exist
- [x] Active work-tracking folder exists
- [ ] Scope notes recorded before implementation
- [ ] Implementation notes recorded after changes
- [ ] Verification evidence stored under `docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/reports/protected-ci-controlled-auto-merge/`
- [ ] Handoff updated before closeout
- Progress entries must use `[S:2026-07-10-001-task48-protected-ci-controlled-auto-merge|W:task48-protected-ci-controlled-auto-merge|H:<handler>|E:<evidence>]` so session, work, handler, and evidence are traceable.

## Emergency Bypass Protocol
- No bypass authorized.
- Any bypass must be explicitly authorized by the user, recorded in DECISIONS.md, and followed by verification evidence.

<!-- AEGIS:BEGIN generated-sweh-projection -->
<!-- AEGIS:projection-state {"event_count": 20, "last_event_id": "24d1841aa7b54d1db3dac5fbd4b79e42", "schema": "legacy-shadow-sweh-projection-v1"} -->

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
- [S:2026-07-10-001-task48-protected-ci-controlled-auto-merge W:task-48-protected-ci-controlled-auto-merge H:delivery E:ledger:86b189a0d39...] Delivery state recorded: pr_open for PR #10 at 1cf557a92c8e132....
- [S:2026-07-10-001-task48-protected-ci-controlled-auto-merge W:task-48-protected-ci-controlled-auto-merge H:scope E:ledger:bb214df3ac5...] Scope recorded for 48. Paths: docs/research/2026-07-10-controlled-auto-merge-canary.md, docs/ai/work-tracking/active/20260710-task48-protected-ci-c..., plans/2026-07-10-task48-protected-ci-controlled-auto-merge.....
- [S:2026-07-10-001-task48-protected-ci-controlled-auto-merge W:task-48-protected-ci-controlled-auto-merge H:delivery E:ledger:24d1841aa7b...] Delivery state recorded: pr_merged for PR #10 at 5a345df073862bb....

<!-- AEGIS:END generated-sweh-projection -->
