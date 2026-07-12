---
session_id: 2026-07-13-001-task68-repair-task39-capability-script-contract
work_context: task68-repair-task39-capability-script-contract
handler_target: .aegis/state/current-work.json
task_ids: [68]
branch_policy: feature-required
evidence_summary:
  - docs/ai/work-tracking/archive/20260713-task68-repair-task39-capability-script-contract-COMPLETED/
  - .aegis/state/current-work.json
  - sessions/2026/07/2026-07-13-001-task68-repair-task39-capability-script-contract.md
  - plans/2026-07-13-task68-repair-task39-capability-script-contract.md
plan_version: v1
emergency_bypass: false
---

# Plan - Task 68 Repair Task 39 Capability Script Contract

## Header
- **Session ID (S)**: 2026-07-13-001-task68-repair-task39-capability-script-contract
- **Work Context (W)**: task68-repair-task39-capability-script-contract
- **Handler Target (H)**: .aegis/state/current-work.json
- **Task IDs**: 68
- **Branch Policy**: feature-required
- **Evidence Summary (E)**: docs/ai/work-tracking/archive/20260713-task68-repair-task39-capability-script-contract-COMPLETED/, .aegis/state/current-work.json, sessions/2026/07/2026-07-13-001-task68-repair-task39-capability-script-contract.md, plans/2026-07-13-task68-repair-task39-capability-script-contract.md
- **Plan Version**: v1
- **Emergency Bypass**: false
- **Authority**: `standing-grant:sota-magazine-2026-autonomy-v2` from `docs/ai/AEGIS_AUTONOMY_GRANT.md`, with Aegis-native workflow state in `.aegis/state/current-work.json`
- **Optional Integrations**: Taskmaster and Serena may be used when present, but are not required for READY unless this task marks them required.

## Plan Table
| Step ID | Description | Evidence | Status |
| --- | --- | --- | --- |
| plan-step-scope | Confirm task scope, constraints, expected outputs, and affected files before implementation | docs/ai/work-tracking/archive/20260713-task68-repair-task39-capability-script-contract-COMPLETED/FINDINGS.md; docs/ai/work-tracking/archive/20260713-task68-repair-task39-capability-script-contract-COMPLETED/DECISIONS.md | completed |
| plan-step-implement | Make only task-scoped changes and record implementation notes | docs/ai/work-tracking/archive/20260713-task68-repair-task39-capability-script-contract-COMPLETED/IMPLEMENTATION.md; changed files; scripts/ci/check-test-capability.mjs | completed |
| plan-step-verify | Run verification, capture reports, and update handoff state | docs/ai/work-tracking/archive/20260713-task68-repair-task39-capability-script-contract-COMPLETED/reports/repair-task39-capability-script-contract/; docs/ai/work-tracking/archive/20260713-task68-repair-task39-capability-script-contract-COMPLETED/HANDOFF.md; docs/ai/work-tracking/archive/20260713-task68-repair-task39-capability-script-contract-COMPLETED/TRACKER.md; docs/ai/work-tracking/archive/20260713-task68-repair-task39-capability-script-contract-COMPLETED/reports/repair-task39-capability-script-contract/task-verification.md; .aegis/reports/verification-report.json | completed |
| plan-step-emergency | Optional - only if a bypass is explicitly authorized | Waiver plus post-mortem note in docs/ai/work-tracking/archive/20260713-task68-repair-task39-capability-script-contract-COMPLETED/DECISIONS.md and docs/ai/work-tracking/archive/20260713-task68-repair-task39-capability-script-contract-COMPLETED/FINDINGS.md | n/a |

## Scope
- `.aegis/state/current-work.json`
- `sessions/2026/07/2026-07-13-001-task68-repair-task39-capability-script-contract.md`
- `plans/2026-07-13-task68-repair-task39-capability-script-contract.md`
- `docs/ai/work-tracking/archive/20260713-task68-repair-task39-capability-script-contract-COMPLETED/`
- `docs/ai/work-tracking/archive/20260713-task68-repair-task39-capability-script-contract-COMPLETED/reports/repair-task39-capability-script-contract/`
- Task 68 only

## Goals
- [x] Make the root capability verification command executable and complete
- [x] Add deterministic regression coverage for both required capability modes
- [x] Preserve package versions lockfile workflow trust boundaries and completed Task 39 evidence

## Branch Policy
- Working branch: `feat/task-68-repair-task39-capability-script-contract`
- Persistent work should happen on a branch containing `task-68`.

## Amendments & Versioning
- 2026-07-13 - Task 68 kickoff created by Aegis.
- 2026-07-13 - `aegis log` updated `plan-step-scope` to `completed` with evidence `docs/ai/work-tracking/active/20260713-task68-repair-task39-capability-script-contract-ACTIVE/FINDINGS.md`.
- 2026-07-13 - `aegis log` updated `plan-step-implement` to `completed` with evidence `scripts/ci/check-test-capability.mjs`.
- 2026-07-13 - `aegis log` updated `plan-step-verify` to `completed` with evidence `docs/ai/work-tracking/active/20260713-task68-repair-task39-capability-script-contract-ACTIVE/reports/repair-task39-capability-script-contract/task-verification.md`.
- 2026-07-13 - `aegis log` updated `plan-step-verify` to `completed` with evidence `.aegis/reports/verification-report.json`.

## Continuation & Handoff
- Next owner: project owner
- Context reload steps:
  1. Read `sessions/current` and this plan.
  2. Read `.aegis/state/current-work.json`.
  3. Read `docs/ai/work-tracking/archive/20260713-task68-repair-task39-capability-script-contract-COMPLETED/TRACKER.md` and `docs/ai/work-tracking/archive/20260713-task68-repair-task39-capability-script-contract-COMPLETED/HANDOFF.md`.
  4. Run Aegis readiness/verify commands before mutation.
- Outstanding risks/todos: keep Taskmaster and Serena optional unless explicitly enabled for this task.

## Conflict & Scope Declaration
- Related plans: none recorded at kickoff.
- Gate cross-check: Aegis readiness must stay aligned with the task branch, current session, current plan, active work-tracking folder, and `.aegis/state/current-work.json`.

## Evidence Checklist
- [x] Aegis current work state exists
- [x] Session and plan current pointers exist
- [x] Completed work-tracking archive exists
- [x] Scope notes recorded before implementation
- [x] Implementation notes recorded after changes
- [x] Verification evidence stored under `docs/ai/work-tracking/archive/20260713-task68-repair-task39-capability-script-contract-COMPLETED/reports/repair-task39-capability-script-contract/`
- [x] Handoff updated before closeout
- Progress entries must use `[S:2026-07-13-001-task68-repair-task39-capability-script-contract|W:task68-repair-task39-capability-script-contract|H:<handler>|E:<evidence>]` so session, work, handler, and evidence are traceable.

## Emergency Bypass Protocol
- No bypass authorized.
- Any bypass must be explicitly authorized by the user, recorded in DECISIONS.md, and followed by verification evidence.
