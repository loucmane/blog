---
session_id: 2026-07-14-001-task41-modernize-tailwind-shadcn-workspaces
work_context: task41-modernize-tailwind-shadcn-workspaces
handler_target: .aegis/state/current-work.json
task_ids: [41]
branch_policy: feature-required
evidence_summary:
  - docs/ai/work-tracking/archive/20260714-task41-modernize-tailwind-shadcn-workspaces-COMPLETED/
  - .aegis/state/current-work.json
  - sessions/2026/07/2026-07-14-001-task41-modernize-tailwind-shadcn-workspaces.md
  - plans/2026-07-14-task41-modernize-tailwind-shadcn-workspaces.md
plan_version: v1
emergency_bypass: false
---

# Plan - Task 41 Modernize Tailwind shadcn and Workspace Boundaries

## Header
- **Session ID (S)**: 2026-07-14-001-task41-modernize-tailwind-shadcn-workspaces
- **Work Context (W)**: task41-modernize-tailwind-shadcn-workspaces
- **Handler Target (H)**: .aegis/state/current-work.json
- **Task IDs**: 41
- **Branch Policy**: feature-required
- **Evidence Summary (E)**: docs/ai/work-tracking/archive/20260714-task41-modernize-tailwind-shadcn-workspaces-COMPLETED/, .aegis/state/current-work.json, sessions/2026/07/2026-07-14-001-task41-modernize-tailwind-shadcn-workspaces.md, plans/2026-07-14-task41-modernize-tailwind-shadcn-workspaces.md
- **Plan Version**: v1
- **Emergency Bypass**: false
- **Authority**: `standing-grant:sota-magazine-2026-autonomy-v2`; reload `AGENTS.md` and `docs/ai/AEGIS_AUTONOMY_GRANT.md` before workflow, PR, or merge decisions. Aegis-native workflow state remains `.aegis/state/current-work.json`.
- **Optional Integrations**: Taskmaster and Serena may be used when present, but are not required for READY unless this task marks them required.

## Plan Table
| Step ID | Description | Evidence | Status |
| --- | --- | --- | --- |
| plan-step-scope | Confirm task scope, constraints, expected outputs, and affected files before implementation | docs/ai/work-tracking/archive/20260714-task41-modernize-tailwind-shadcn-workspaces-COMPLETED/FINDINGS.md; docs/ai/work-tracking/archive/20260714-task41-modernize-tailwind-shadcn-workspaces-COMPLETED/DECISIONS.md | completed |
| plan-step-implement | Make only task-scoped changes and record implementation notes | docs/ai/work-tracking/archive/20260714-task41-modernize-tailwind-shadcn-workspaces-COMPLETED/IMPLEMENTATION.md; packages/web/src/components/theme-menu.tsx | completed |
| plan-step-verify | Run verification, capture reports, and update handoff state | docs/ai/work-tracking/archive/20260714-task41-modernize-tailwind-shadcn-workspaces-COMPLETED/reports/modernize-tailwind-shadcn-workspaces/task-verification.md; .aegis/reports/verification-report.json; docs/ai/work-tracking/archive/20260714-task41-modernize-tailwind-shadcn-workspaces-COMPLETED/HANDOFF.md; docs/ai/work-tracking/archive/20260714-task41-modernize-tailwind-shadcn-workspaces-COMPLETED/TRACKER.md | completed |
| plan-step-emergency | Optional - only if a bypass is explicitly authorized | docs/ai/work-tracking/archive/20260714-task41-modernize-tailwind-shadcn-workspaces-COMPLETED/DECISIONS.md; docs/ai/work-tracking/archive/20260714-task41-modernize-tailwind-shadcn-workspaces-COMPLETED/FINDINGS.md | n/a |

## Scope
- `.aegis/state/current-work.json`
- `sessions/2026/07/2026-07-14-001-task41-modernize-tailwind-shadcn-workspaces.md`
- `plans/2026-07-14-task41-modernize-tailwind-shadcn-workspaces.md`
- `docs/ai/work-tracking/archive/20260714-task41-modernize-tailwind-shadcn-workspaces-COMPLETED/`
- `docs/ai/work-tracking/archive/20260714-task41-modernize-tailwind-shadcn-workspaces-COMPLETED/reports/modernize-tailwind-shadcn-workspaces/`
- `docs/decisions/0005-app-local-design-system.md` and Task 41 research evidence
- `package.json`, `pnpm-workspace.yaml`, and `pnpm-lock.yaml` only for the accepted Task 41 package/workspace migration
- `packages/web/` app-local tokens, styles, owned components, theme behavior, configuration, and focused tests
- `packages/ui/` and `packages/backend/` only after complete consumer and replacement proof supports removal
- deterministic non-workflow contracts that describe the changed package, accessibility, and workspace surface
- `.taskmaster/tasks/tasks.json` and `.taskmaster/tasks/task_041.md`
- Task 41 only

## Goals
- [x] Select and pin the current optimal supported styling and owned-component foundation from primary-source evidence
- [x] Preserve intentional design behavior accessibility and visual quality while removing obsolete workspace boundaries
- [x] Prove a reversible migration with deterministic contracts browser evidence and complete Taskmaster Aegis handoff

## Branch Policy
- Working branch: `feat/task-41-modernize-tailwind-shadcn-workspaces`
- Persistent work should happen on a branch containing `task-41`.

## Amendments & Versioning
- 2026-07-14 - Task 41 kickoff created by Aegis.
- 2026-07-15 - Reconciled the completed Task 41 branch with `origin/main` at `e258426` in an isolated continuation worktree. Preserved main's Tasks 69/70 and managed runtime, retained Task 41's completed archive and pointers, and revalidated the complete product and protected-CI-equivalent matrix without touching the owner-managed live worktree or its `.codex/` state.

## Continuation & Handoff
- Next owner: project owner
- Context reload steps:
  1. Read `sessions/current` and this plan.
  2. Read `.aegis/state/current-work.json`.
  3. Read `docs/ai/work-tracking/archive/20260714-task41-modernize-tailwind-shadcn-workspaces-COMPLETED/TRACKER.md` and `docs/ai/work-tracking/archive/20260714-task41-modernize-tailwind-shadcn-workspaces-COMPLETED/HANDOFF.md`.
  4. Run Aegis readiness/verify commands before mutation.
- Outstanding risks/todos: keep Taskmaster and Serena optional unless explicitly enabled for this task.

## Conflict & Scope Declaration
- Related plans: none recorded at kickoff.
- Gate cross-check: Aegis readiness must stay aligned with the task branch, current session, current plan, active work-tracking folder, and `.aegis/state/current-work.json`.

## Evidence Checklist
- [x] Aegis current work state exists
- [x] Session and plan current pointers exist
- [x] Active work-tracking folder exists
- [x] Scope notes recorded before implementation
- [x] Implementation notes recorded after changes
- [x] Verification evidence stored under `docs/ai/work-tracking/archive/20260714-task41-modernize-tailwind-shadcn-workspaces-COMPLETED/reports/modernize-tailwind-shadcn-workspaces/`
- [x] Handoff updated before closeout
- Progress entries must use `[S:2026-07-14-001-task41-modernize-tailwind-shadcn-workspaces|W:task41-modernize-tailwind-shadcn-workspaces|H:<handler>|E:<evidence>]` so session, work, handler, and evidence are traceable.

## Emergency Bypass Protocol
- No bypass authorized.
- Any bypass must be explicitly authorized by the user, recorded in DECISIONS.md, and followed by verification evidence.

<!-- AEGIS:BEGIN generated-sweh-projection -->
<!-- AEGIS:projection-state {"event_count": 8, "last_event_id": "5f72a30d17e84565b1e350e9af5ab141", "schema": "legacy-shadow-sweh-projection-v1"} -->

## Generated S:W:H:E Projection

_Generated from the passive Aegis ledger. Human-authored content outside this block is preserved._

- [S:2026-07-14-001-task41-modernize-tailwind-shadcn-workspaces W:task-41-modernize-tailwind-shadcn-workspaces H:scope E:ledger:57b486fe50d...] Scope recorded for 41. Paths: package.json, pnpm-workspace.yaml, pnpm-lock.yaml.
- [S:2026-07-14-001-task41-modernize-tailwind-shadcn-workspaces W:task-41-modernize-tailwind-shadcn-workspaces H:witness E:ledger:6230052eef9...] Delivery witness PASS recorded at d3c5b16; report: .aegis/reports/witness-report.json.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:2ac11e8be41...] Session began via compact.
- [S:2026-07-14-001-task41-modernize-tailwind-shadcn-workspaces W:task-41-modernize-tailwind-shadcn-workspaces H:scope E:ledger:30f3b7335ec...] Scope recorded for 41. Paths: package.json, pnpm-workspace.yaml, pnpm-lock.yaml.
- [S:2026-07-14-001-task41-modernize-tailwind-shadcn-workspaces W:task-41-modernize-tailwind-shadcn-workspaces H:scope E:ledger:3c0305bf4f9...] Scope recorded for 41. Paths: package.json, pnpm-workspace.yaml, pnpm-lock.yaml.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:7d51ab07a70...] Session began via compact.
- [S:2026-07-14-001-task41-modernize-tailwind-shadcn-workspaces W:task-41-modernize-tailwind-shadcn-workspaces H:witness E:ledger:70c72564efd...] Delivery witness FAIL recorded at 504fea6; report: .aegis/reports/witness-report.json.
- [S:2026-07-14-001-task41-modernize-tailwind-shadcn-workspaces W:task-41-modernize-tailwind-shadcn-workspaces H:scope E:ledger:5f72a30d17e...] Scope recorded for 41. Paths: package.json, pnpm-workspace.yaml, pnpm-lock.yaml.

<!-- AEGIS:END generated-sweh-projection -->
