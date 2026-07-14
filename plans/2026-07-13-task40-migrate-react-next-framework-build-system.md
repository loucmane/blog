---
session_id: 2026-07-14-001-task40-migrate-react-next-framework-build-system
work_context: task40-migrate-react-next-framework-build-system
handler_target: .aegis/state/current-work.json
task_ids: [40]
branch_policy: feature-required
evidence_summary:
  - docs/ai/work-tracking/archive/20260713-task40-migrate-react-next-framework-build-system-COMPLETED/
  - .aegis/state/current-work.json
  - sessions/2026/07/2026-07-14-001-task40-migrate-react-next-framework-build-system.md
  - plans/2026-07-13-task40-migrate-react-next-framework-build-system.md
plan_version: v1
emergency_bypass: false
---

# Plan - Task 40 Migrate React Framework and Build System

## Header
- **Session ID (S)**: 2026-07-14-001-task40-migrate-react-next-framework-build-system
- **Work Context (W)**: task40-migrate-react-next-framework-build-system
- **Handler Target (H)**: .aegis/state/current-work.json
- **Task IDs**: 40
- **Branch Policy**: feature-required
- **Evidence Summary (E)**: docs/ai/work-tracking/archive/20260713-task40-migrate-react-next-framework-build-system-COMPLETED/, .aegis/state/current-work.json, sessions/2026/07/2026-07-14-001-task40-migrate-react-next-framework-build-system.md, plans/2026-07-13-task40-migrate-react-next-framework-build-system.md
- **Plan Version**: v1
- **Emergency Bypass**: false
- **Authority**: Aegis-native workflow state (`.aegis/state/current-work.json`)
- **Optional Integrations**: Taskmaster and Serena may be used when present, but are not required for READY unless this task marks them required.

## Plan Table
| Step ID | Description | Evidence | Status |
| --- | --- | --- | --- |
| plan-step-scope | Confirm task scope, constraints, expected outputs, and affected files before implementation | docs/ai/work-tracking/archive/20260713-task40-migrate-react-next-framework-build-system-COMPLETED/FINDINGS.md; docs/ai/work-tracking/archive/20260713-task40-migrate-react-next-framework-build-system-COMPLETED/DECISIONS.md; docs/decisions/0005-use-nextjs-16-for-unified-magazine-framework.md | completed |
| plan-step-implement | Make only task-scoped changes and record implementation notes | docs/ai/work-tracking/archive/20260713-task40-migrate-react-next-framework-build-system-COMPLETED/IMPLEMENTATION.md; changed files | completed |
| plan-step-verify | Run verification, capture reports, and update handoff state | docs/ai/work-tracking/archive/20260713-task40-migrate-react-next-framework-build-system-COMPLETED/reports/migrate-react-next-framework-build-system/; docs/ai/work-tracking/archive/20260713-task40-migrate-react-next-framework-build-system-COMPLETED/HANDOFF.md; docs/ai/work-tracking/archive/20260713-task40-migrate-react-next-framework-build-system-COMPLETED/TRACKER.md; .aegis/reports/verification-report.json | completed |
| plan-step-emergency | Optional - only if a bypass is explicitly authorized | docs/ai/work-tracking/archive/20260713-task40-migrate-react-next-framework-build-system-COMPLETED/DECISIONS.md; docs/ai/work-tracking/archive/20260713-task40-migrate-react-next-framework-build-system-COMPLETED/FINDINGS.md | n/a |

## Scope
- `.aegis/state/current-work.json`
- `sessions/2026/07/2026-07-13-001-task40-migrate-react-next-framework-build-system.md`
- `plans/2026-07-13-task40-migrate-react-next-framework-build-system.md`
- `docs/ai/work-tracking/archive/20260713-task40-migrate-react-next-framework-build-system-COMPLETED/`
- `docs/ai/work-tracking/archive/20260713-task40-migrate-react-next-framework-build-system-COMPLETED/reports/migrate-react-next-framework-build-system/`
- Task 40 only

## Goals
- [x] Revalidate and exact-pin the stable Next.js and React production target from primary sources
- [x] Migrate reader, owner, preview, metadata, cache, image, CSP, and portable Node behavior without beginning Task 41
- [x] Prove the framework migration with deterministic unit, browser, accessibility, performance, build, smoke, rollback, and delivery evidence

## Branch Policy
- Working branch: `feat/task-40-migrate-react-next-framework-build-system`
- Persistent work should happen on a branch containing `task-40`.

## Amendments & Versioning
- 2026-07-13 - Task 40 kickoff created by Aegis.
- 2026-07-13 - `aegis log` updated `plan-step-scope` to `completed` with evidence `docs/decisions/0005-use-nextjs-16-for-unified-magazine-framework.md`.
- 2026-07-14 - Continued Task 40 through the supported session helper and reused the original task plan and ACTIVE work-tracking folder.
- 2026-07-14 - Completed the framework migration implementation; final delivery verification remains in progress.
- 2026-07-14 - `aegis log` updated `plan-step-verify` to `completed` with evidence `.aegis/reports/verification-report.json`.
- 2026-07-14 - Stable Aegis runtime `144bd4463dcec9c326b023ff53b45aa71660727e` made the preserved advisory-only queue non-blocking; strict verification and final closeout passed with zero required failures or warnings.
- 2026-07-14 - Taskmaster Task 40 was marked done, its single generated projection was refreshed, and the work-tracking envelope was archived.
- 2026-07-14 - Independent implementation and adversarial reviews were completed. Preview, redirect, cache, canonical-origin, initial-HTML, local document-budget, and archive-consistency findings were remediated and reverified; deployed provider preview and p75 Web Vitals remain Task 46 gates.

## Continuation & Handoff
- Next owner: project owner
- Context reload steps:
  1. Read `sessions/current` and this plan.
  2. Read `.aegis/state/current-work.json`.
  3. Read `docs/ai/work-tracking/archive/20260713-task40-migrate-react-next-framework-build-system-COMPLETED/TRACKER.md` and `docs/ai/work-tracking/archive/20260713-task40-migrate-react-next-framework-build-system-COMPLETED/HANDOFF.md`.
  4. Revalidate the exact Task 40 commit and hosted checks before delivery.
- Outstanding risks/todos: keep the separate owner-authorized managed Aegis rollout unstaged; Task 41 owns the remaining design-system/workspace boundary.

## Conflict & Scope Declaration
- Related plans: none recorded at kickoff.
- Gate cross-check: Aegis readiness must stay aligned with the task branch, current session, current plan, active work-tracking folder, and `.aegis/state/current-work.json`.

## Evidence Checklist
- [x] Aegis current work state exists
- [x] Session and plan current pointers exist
- [x] Completed work-tracking folder is archived
- [x] Scope notes recorded before implementation
- [x] Implementation notes recorded after changes
- [x] Verification evidence stored under `docs/ai/work-tracking/archive/20260713-task40-migrate-react-next-framework-build-system-COMPLETED/reports/migrate-react-next-framework-build-system/`
- [x] Handoff updated before closeout
- Progress entries must use `[S:2026-07-14-001-task40-migrate-react-next-framework-build-system|W:task40-migrate-react-next-framework-build-system|H:<handler>|E:<evidence>]` so session, work, handler, and evidence are traceable.

## Emergency Bypass Protocol
- No bypass authorized.
- Any bypass must be explicitly authorized by the user, recorded in DECISIONS.md, and followed by verification evidence.

<!-- AEGIS:BEGIN generated-sweh-projection -->
<!-- AEGIS:projection-state {"event_count": 6, "last_event_id": "24f30c91403544fe82fa7df384ee0c3e", "schema": "legacy-shadow-sweh-projection-v1"} -->

## Generated S:W:H:E Projection

_Generated from the passive Aegis ledger. Human-authored content outside this block is preserved._

- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-40-migrate-react-next-framework-build-system H:session E:ledger:2d46fc883f1...] Session began via compact.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-40-migrate-react-next-framework-build-system H:session E:ledger:eafebcf10a0...] Session began via compact.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-40-migrate-react-next-framework-build-system H:session E:ledger:8ac1563216d...] Session began via compact.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-40-migrate-react-next-framework-build-system H:task-truth E:ledger:ebcbe0fe6f9...] Task truth recorded for task truth: changed.
- [S:2026-07-13-001-task40-migrate-react-next-framework-build-system W:task-40-migrate-react-next-framework-build-system H:scope E:ledger:e783a9fd48b...] Scope recorded for 40. Paths: .plan_state/sync.log, .prettierignore, .taskmaster/tasks/task_040.md.
- [S:2026-07-13-001-task40-migrate-react-next-framework-build-system W:task-40-migrate-react-next-framework-build-system H:witness E:ledger:24f30c91403...] Delivery witness PASS recorded at 4f80ab9; report: .aegis/reports/witness-report.json.

<!-- AEGIS:END generated-sweh-projection -->
