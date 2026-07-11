---
session_id: 2026-07-11-001-task65-post-merge-ci-verification
work_context: task65-post-merge-ci-verification
handler_target: .aegis/state/current-work.json
task_ids: [65]
branch_policy: feature-required
evidence_summary:
  - docs/ai/work-tracking/archive/20260711-task65-post-merge-ci-verification-COMPLETED/
  - .aegis/state/current-work.json
  - sessions/2026/07/2026-07-11-001-task65-post-merge-ci-verification.md
  - plans/2026-07-11-task65-post-merge-ci-verification.md
plan_version: v1
emergency_bypass: false
---

# Plan - Task 65 Guarantee post-merge CI after controlled auto-merge

## Header
- **Session ID (S)**: 2026-07-11-001-task65-post-merge-ci-verification
- **Work Context (W)**: task65-post-merge-ci-verification
- **Handler Target (H)**: .aegis/state/current-work.json
- **Task IDs**: 65
- **Branch Policy**: feature-required
- **Evidence Summary (E)**: docs/ai/work-tracking/archive/20260711-task65-post-merge-ci-verification-COMPLETED/, .aegis/state/current-work.json, sessions/2026/07/2026-07-11-001-task65-post-merge-ci-verification.md, plans/2026-07-11-task65-post-merge-ci-verification.md
- **Plan Version**: v1
- **Emergency Bypass**: false
- **Authority**: `standing-grant:sota-magazine-2026-autonomy-v2` plus explicit owner approval for this workflow-governance correction; Aegis workflow state remains `.aegis/state/current-work.json`
- **Optional Integrations**: Taskmaster and Serena may be used when present, but are not required for READY unless this task marks them required.

## Plan Table
| Step ID | Description | Evidence | Status |
| --- | --- | --- | --- |
| plan-step-scope | Confirm task scope, constraints, expected outputs, and affected files before implementation | docs/ai/work-tracking/archive/20260711-task65-post-merge-ci-verification-COMPLETED/FINDINGS.md; docs/ai/work-tracking/archive/20260711-task65-post-merge-ci-verification-COMPLETED/DECISIONS.md | completed |
| plan-step-implement | Make only task-scoped changes and record implementation notes | docs/ai/work-tracking/archive/20260711-task65-post-merge-ci-verification-COMPLETED/IMPLEMENTATION.md; changed files; scripts/ci/post-merge-context.mjs | completed |
| plan-step-verify | Run verification, capture reports, and update handoff state | docs/ai/work-tracking/archive/20260711-task65-post-merge-ci-verification-COMPLETED/reports/post-merge-ci-verification/; docs/ai/work-tracking/archive/20260711-task65-post-merge-ci-verification-COMPLETED/HANDOFF.md; docs/ai/work-tracking/archive/20260711-task65-post-merge-ci-verification-COMPLETED/TRACKER.md; docs/ai/work-tracking/archive/20260711-task65-post-merge-ci-verification-COMPLETED/reports/post-merge-ci-verification/task-verification.md; .aegis/reports/verification-report.json | completed |
| plan-step-emergency | Optional - only if a bypass is explicitly authorized | docs/ai/work-tracking/archive/20260711-task65-post-merge-ci-verification-COMPLETED/DECISIONS.md; docs/ai/work-tracking/archive/20260711-task65-post-merge-ci-verification-COMPLETED/FINDINGS.md | n/a |

## Scope
- `.github/workflows/auto-merge.yml`
- `.github/workflows/ci.yml`
- `scripts/ci/post-merge-context.mjs`
- `tests/ci/auto-merge-workflow.test.mjs`
- `docs/research/2026-07-11-post-merge-ci-dispatch.md`
- `docs/research/2026-07-11-evidence-authorized-delivery.md`
- `.aegis/state/current-work.json`
- `sessions/2026/07/2026-07-11-001-task65-post-merge-ci-verification.md`
- `plans/2026-07-11-task65-post-merge-ci-verification.md`
- `docs/ai/work-tracking/archive/20260711-task65-post-merge-ci-verification-COMPLETED/`
- `docs/ai/work-tracking/archive/20260711-task65-post-merge-ci-verification-COMPLETED/reports/post-merge-ci-verification/`
- Task 65 Taskmaster projection and evidence only

## Goals
- [x] Dispatch trusted CI for the exact controlled auto-merge squash commit without executing PR-controlled code or weakening existing merge controls.
- [x] Prove the behavior with deterministic and adversarial workflow contract tests, then deliver it in an attended governance PR.

## Branch Policy
- Working branch: `feat/task-65-post-merge-ci-verification`
- Persistent work should happen on a branch containing `task-65`.

## Amendments & Versioning
- 2026-07-11 - Task 65 kickoff created by Aegis.
- 2026-07-11 - `aegis log` updated `plan-step-scope` to `completed` with evidence `docs/ai/work-tracking/active/20260711-task65-post-merge-ci-verification-ACTIVE/FINDINGS.md`.
- 2026-07-11 - `aegis log` updated `plan-step-implement` to `completed` with evidence `scripts/ci/post-merge-context.mjs`.
- 2026-07-11 - `aegis log` updated `plan-step-verify` to `completed` with evidence `docs/ai/work-tracking/active/20260711-task65-post-merge-ci-verification-ACTIVE/reports/post-merge-ci-verification/task-verification.md`.
- 2026-07-11 - `aegis log` updated `plan-step-verify` to `completed` with evidence `.aegis/reports/verification-report.json`.

## Continuation & Handoff
- Next owner: project owner
- Context reload steps:
  1. Read `sessions/current` and this plan.
  2. Read `.aegis/state/current-work.json`.
  3. Read `docs/ai/work-tracking/archive/20260711-task65-post-merge-ci-verification-COMPLETED/TRACKER.md` and `docs/ai/work-tracking/archive/20260711-task65-post-merge-ci-verification-COMPLETED/HANDOFF.md`.
  4. Run Aegis readiness/verify commands before mutation.
- Outstanding risks/todos: attended workflow PR merge and a separate live post-merge dispatch canary.

## Conflict & Scope Declaration
- Related plans: none recorded at kickoff.
- Gate cross-check: Aegis completed state must stay aligned with the task branch, current session, current plan, archived work-tracking folder, and `.aegis/state/current-work.json`.

## Evidence Checklist
- [x] Aegis current work state exists
- [x] Session and plan current pointers exist
- [x] Archived work-tracking folder exists
- [x] Scope notes recorded before implementation
- [x] Implementation notes recorded after changes
- [x] Verification evidence stored under `docs/ai/work-tracking/archive/20260711-task65-post-merge-ci-verification-COMPLETED/reports/post-merge-ci-verification/`
- [x] Handoff updated before closeout
- Progress entries must use `[S:2026-07-11-001-task65-post-merge-ci-verification|W:task65-post-merge-ci-verification|H:<handler>|E:<evidence>]` so session, work, handler, and evidence are traceable.

## Emergency Bypass Protocol
- No bypass authorized.
- Any bypass must be explicitly authorized by the user, recorded in DECISIONS.md, and followed by verification evidence.
