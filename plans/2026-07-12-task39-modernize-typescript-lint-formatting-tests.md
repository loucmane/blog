---
session_id: 2026-07-12-001-task39-modernize-typescript-lint-formatting-tests
work_context: task39-modernize-typescript-lint-formatting-tests
handler_target: .aegis/state/current-work.json
task_ids: [39]
branch_policy: feature-required
evidence_summary:
  - docs/ai/work-tracking/archive/20260712-task39-modernize-typescript-lint-formatting-tests-COMPLETED/
  - .aegis/state/current-work.json
  - sessions/2026/07/2026-07-12-001-task39-modernize-typescript-lint-formatting-tests.md
  - plans/2026-07-12-task39-modernize-typescript-lint-formatting-tests.md
plan_version: v1
emergency_bypass: false
---

# Plan - Task 39 Modernize TypeScript Lint Formatting and Tests

## Header
- **Session ID (S)**: 2026-07-12-001-task39-modernize-typescript-lint-formatting-tests
- **Work Context (W)**: task39-modernize-typescript-lint-formatting-tests
- **Handler Target (H)**: .aegis/state/current-work.json
- **Task IDs**: 39
- **Branch Policy**: feature-required
- **Evidence Summary (E)**: docs/ai/work-tracking/archive/20260712-task39-modernize-typescript-lint-formatting-tests-COMPLETED/, .aegis/state/current-work.json, sessions/2026/07/2026-07-12-001-task39-modernize-typescript-lint-formatting-tests.md, plans/2026-07-12-task39-modernize-typescript-lint-formatting-tests.md
- **Plan Version**: v1
- **Emergency Bypass**: false
- **Authority**: `standing-grant:sota-magazine-2026-autonomy-v2` from `docs/ai/AEGIS_AUTONOMY_GRANT.md`, bounded by Aegis-native workflow state (`.aegis/state/current-work.json`)
- **Optional Integrations**: Taskmaster and Serena may be used when present, but are not required for READY unless this task marks them required.

## Plan Table
| Step ID | Description | Evidence | Status |
| --- | --- | --- | --- |
| plan-step-scope | Confirm task scope, constraints, expected outputs, and affected files before implementation | docs/ai/work-tracking/archive/20260712-task39-modernize-typescript-lint-formatting-tests-COMPLETED/FINDINGS.md; docs/ai/work-tracking/archive/20260712-task39-modernize-typescript-lint-formatting-tests-COMPLETED/DECISIONS.md | completed |
| plan-step-implement | Make only task-scoped changes and record implementation notes | docs/ai/work-tracking/archive/20260712-task39-modernize-typescript-lint-formatting-tests-COMPLETED/IMPLEMENTATION.md; changed files; docs/decisions/0006-typescript-quality-tooling-foundation.md | completed |
| plan-step-verify | Run verification, capture reports, and update handoff state | docs/ai/work-tracking/archive/20260712-task39-modernize-typescript-lint-formatting-tests-COMPLETED/reports/modernize-typescript-lint-formatting-tests/; docs/ai/work-tracking/archive/20260712-task39-modernize-typescript-lint-formatting-tests-COMPLETED/HANDOFF.md; docs/ai/work-tracking/archive/20260712-task39-modernize-typescript-lint-formatting-tests-COMPLETED/TRACKER.md; docs/ai/work-tracking/archive/20260712-task39-modernize-typescript-lint-formatting-tests-COMPLETED/reports/modernize-typescript-lint-formatting-tests/task-verification.md; .aegis/reports/verification-report.json | completed |
| plan-step-emergency | Optional - only if a bypass is explicitly authorized | docs/ai/work-tracking/archive/20260712-task39-modernize-typescript-lint-formatting-tests-COMPLETED/DECISIONS.md; docs/ai/work-tracking/archive/20260712-task39-modernize-typescript-lint-formatting-tests-COMPLETED/FINDINGS.md | n/a |

## Scope
- `.aegis/state/current-work.json`
- `sessions/2026/07/2026-07-12-001-task39-modernize-typescript-lint-formatting-tests.md`
- `plans/2026-07-12-task39-modernize-typescript-lint-formatting-tests.md`
- `docs/ai/work-tracking/archive/20260712-task39-modernize-typescript-lint-formatting-tests-COMPLETED/`
- `docs/ai/work-tracking/archive/20260712-task39-modernize-typescript-lint-formatting-tests-COMPLETED/reports/modernize-typescript-lint-formatting-tests/`
- Task 39 only

## Goals
- [x] Select supported stable TypeScript lint formatting and test tooling from primary-source evidence
- [x] Replace unsupported test bridges with real deterministic unit integration browser and accessibility foundations
- [x] Preserve product framework and CI trust boundaries through a reversible separately reviewed migration

## Branch Policy
- Working branch: `feat/task-39-modernize-typescript-lint-formatting-tests`
- Persistent work should happen on a branch containing `task-39`.

## Amendments & Versioning
- 2026-07-12 - Task 39 kickoff created by Aegis.
- 2026-07-12 - `aegis log` updated `plan-step-scope` to `completed` with evidence now archived at `docs/ai/work-tracking/archive/20260712-task39-modernize-typescript-lint-formatting-tests-COMPLETED/FINDINGS.md`.
- 2026-07-12 - `aegis log` updated `plan-step-implement` to `completed` with evidence `docs/decisions/0006-typescript-quality-tooling-foundation.md`.
- 2026-07-12 - `aegis log` updated `plan-step-verify` to `completed` with evidence now archived at `docs/ai/work-tracking/archive/20260712-task39-modernize-typescript-lint-formatting-tests-COMPLETED/reports/modernize-typescript-lint-formatting-tests/task-verification.md`.
- 2026-07-12 - `aegis log` updated `plan-step-verify` to `completed` with evidence `.aegis/reports/verification-report.json`.

## Continuation & Handoff
- Next owner: project owner
- Context reload steps:
  1. Read `sessions/current` and this plan.
  2. Read `.aegis/state/current-work.json`.
  3. Read `docs/ai/work-tracking/archive/20260712-task39-modernize-typescript-lint-formatting-tests-COMPLETED/TRACKER.md` and `docs/ai/work-tracking/archive/20260712-task39-modernize-typescript-lint-formatting-tests-COMPLETED/HANDOFF.md`.
  4. Run Aegis readiness/verify commands before mutation.
- Outstanding risks/todos: hosted CI remains pending until a committed PR head exists; Task 40 owns Next/React warnings, Task 41 owns visual/accessibility debt, and Task 42 owns removal of the legacy public-type bridge.

## Conflict & Scope Declaration
- Related plans: none recorded at kickoff.
- Gate cross-check: Aegis readiness must stay aligned with the task branch, current session, current plan, active work-tracking folder, and `.aegis/state/current-work.json`.

## Evidence Checklist
- [x] Aegis current work state exists
- [x] Session and plan current pointers exist
- [x] Active work-tracking folder exists
- [x] Scope notes recorded before implementation
- [x] Implementation notes recorded after changes
- [x] Verification evidence stored under `docs/ai/work-tracking/archive/20260712-task39-modernize-typescript-lint-formatting-tests-COMPLETED/reports/modernize-typescript-lint-formatting-tests/`
- [x] Handoff updated before closeout
- Progress entries must use `[S:2026-07-12-001-task39-modernize-typescript-lint-formatting-tests|W:task39-modernize-typescript-lint-formatting-tests|H:<handler>|E:<evidence>]` so session, work, handler, and evidence are traceable.

## Emergency Bypass Protocol
- No bypass authorized.
- Any bypass must be explicitly authorized by the user, recorded in DECISIONS.md, and followed by verification evidence.
