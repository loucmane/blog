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
| plan-step-emergency | Optional - only if a bypass is explicitly authorized | Waiver plus post-mortem note in docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/DECISIONS.md and docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/FINDINGS.md | n/a |

## Scope
- `.aegis/state/current-work.json`
- `sessions/2026/07/2026-07-10-001-task48-protected-ci-controlled-auto-merge.md`
- `plans/2026-07-10-task48-protected-ci-controlled-auto-merge.md`
- `docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/`
- `docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/reports/protected-ci-controlled-auto-merge/`
- Task 48 only

## Goals
- [ ] Bootstrap read-only CI on the committed Node 22 and pnpm 9 baseline.
- [ ] Protect public main using exact successful GitHub check names after attended workflow review.
- [ ] Add controlled auto-merge separately and prove it with a documentation-only canary.

## Branch Policy
- Working branch: `feat/task-48-protected-ci-controlled-auto-merge`
- Persistent work should happen on a branch containing `task-48`.

## Amendments & Versioning
- 2026-07-10 - Task 48 kickoff created by Aegis.
- 2026-07-10 - `aegis log` updated `plan-step-scope` to `completed` with evidence `docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/FINDINGS.md`.
- 2026-07-10 - `aegis log` updated `plan-step-implement` to `completed` with evidence `.github/workflows/ci.yml`.
- 2026-07-10 - `aegis log` updated `plan-step-verify` to `completed` with evidence `docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/reports/protected-ci-controlled-auto-merge/task-verification.md`.
- 2026-07-10 - `aegis log` updated `plan-step-verify` to `completed` with evidence `.aegis/reports/verification-report.json`.

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
