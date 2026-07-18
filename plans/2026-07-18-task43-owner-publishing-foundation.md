---
session_id: 2026-07-18-001-task43-owner-publishing-foundation
work_context: task43-owner-publishing-foundation
handler_target: .aegis/state/current-work.json
task_ids: [43]
branch_policy: feature-required
evidence_summary:
  - docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/
  - .aegis/state/current-work.json
  - sessions/2026/07/2026-07-18-001-task43-owner-publishing-foundation.md
  - plans/2026-07-18-task43-owner-publishing-foundation.md
plan_version: v1
emergency_bypass: false
---

# Plan - Task 43 Implement Owner Publishing Foundation

## Header
- **Session ID (S)**: 2026-07-18-001-task43-owner-publishing-foundation
- **Work Context (W)**: task43-owner-publishing-foundation
- **Handler Target (H)**: .aegis/state/current-work.json
- **Task IDs**: 43
- **Branch Policy**: feature-required
- **Evidence Summary (E)**: docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/, .aegis/state/current-work.json, sessions/2026/07/2026-07-18-001-task43-owner-publishing-foundation.md, plans/2026-07-18-task43-owner-publishing-foundation.md
- **Plan Version**: v1
- **Emergency Bypass**: false
- **Authority**: `standing-grant:sota-magazine-2026-autonomy-v2`; see `docs/ai/AEGIS_AUTONOMY_GRANT.md` (SHA-256 `89ac60905034896537c3a4d794bf22a5d1fc0ccdab926ae93977c6ffc550e095`) and Aegis-native workflow state (`.aegis/state/current-work.json`)
- **Optional Integrations**: Taskmaster and Serena may be used when present, but are not required for READY unless this task marks them required.

## Plan Table
| Step ID | Description | Evidence | Status |
| --- | --- | --- | --- |
| plan-step-scope | Confirm task scope, constraints, expected outputs, and affected files before implementation | docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/FINDINGS.md; docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/DECISIONS.md | completed |
| plan-step-implement | Make only task-scoped changes and record implementation notes | docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/IMPLEMENTATION.md; changed files | completed |
| plan-step-verify | Run verification, capture reports, and update handoff state | docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/reports/owner-publishing-foundation/verification.md; docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/HANDOFF.md; docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/TRACKER.md; .aegis/reports/verification-report.json | completed |
| plan-step-emergency | Optional - only if a bypass is explicitly authorized | docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/DECISIONS.md; docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/FINDINGS.md | n/a |

## Scope
- `package.json`, `pnpm-lock.yaml`, and `packages/web/package.json` only for exact Task 43 editor, authentication, and scheduling dependencies
- `packages/web/src/app/owner/`, `packages/web/src/app/api/owner/`, and the Better Auth route under `packages/web/src/app/api/auth/`
- Task 43 owner components, editor adapters, authentication/session boundaries, content-runtime adapter, and focused tests under `packages/web/`
- One reversible owner-auth migration pair following Task 42's reviewable-SQL authority
- Task 43 browser and accessibility journeys under `tests/e2e/`
- Task 43 architecture/decision documentation and scoped verification evidence
- `.aegis/state/current-work.json`
- `sessions/2026/07/2026-07-18-001-task43-owner-publishing-foundation.md`
- `plans/2026-07-18-task43-owner-publishing-foundation.md`
- `docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/`
- `docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/reports/owner-publishing-foundation/`
- Task 43 only

## Explicit Non-Goals
- Public magazine templates and fixture removal (Task 44)
- Search, feeds, newsletter, social cards, and distribution (Task 45)
- Production credentials, deployment, live-provider enrollment, and production recovery drills (Task 46)
- CI workflow, Aegis runtime, enforcement, authority, hooks, branch protection, or merge-policy changes
- A complete multi-user editorial dashboard

## Goals
- [x] Deliver a secure owner-operated publishing foundation for a nontechnical magazine owner
- [x] Integrate authoring autosave recovery preview scheduling publishing revisions and media through Task 42 boundaries
- [x] Prove accessibility resilience security reversibility and complete delivery evidence

## Branch Policy
- Working branch: `feat/task-43-owner-publishing-foundation`
- Persistent work should happen on a branch containing `task-43`.

## Amendments & Versioning
- 2026-07-18 - Task 43 kickoff created by Aegis.
- 2026-07-18 - v2: reconciled Task 43 against the canonical PRD, Task 42 boundaries, Task 37 spikes, owner-publishing UX contract, and standing grant.
- 2026-07-18 - `aegis log` updated `plan-step-scope` to `completed` with evidence `docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/FINDINGS.md`.
- 2026-07-18 - v3: completed the owner workspace, authentication, structured editing, recovery, media, lifecycle, migration, and verification workstreams without expanding into Tasks 44-46.
- 2026-07-18 - `aegis log` updated `plan-step-implement` to `completed` with evidence `docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/IMPLEMENTATION.md`.
- 2026-07-18 - `aegis log` updated `plan-step-verify` to `completed` with evidence `docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/reports/owner-publishing-foundation/verification.md`.
- 2026-07-18 - `aegis log` updated `plan-step-verify` to `completed` with evidence `.aegis/reports/verification-report.json`.

## Continuation & Handoff
- Next owner: project owner
- Context reload steps:
  1. Read `sessions/current` and this plan.
  2. Read `.aegis/state/current-work.json`.
  3. Read `docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/TRACKER.md` and `docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/HANDOFF.md`.
  4. Run Aegis readiness/verify commands before mutation.
- Outstanding risks/todos: production credential enrollment, live recovery delivery, and provider restore drills remain Task 46; public reader templates remain Task 44.

## Conflict & Scope Declaration
- Related plans: none recorded at kickoff.
- Gate cross-check: Aegis readiness must stay aligned with the task branch, current session, current plan, active work-tracking folder, and `.aegis/state/current-work.json`.

## Evidence Checklist
- [x] Aegis current work state exists
- [x] Session and plan current pointers exist
- [x] Active work-tracking folder exists
- [x] Scope notes recorded before implementation
- [x] Implementation notes recorded after changes
- [x] Verification evidence stored under `docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/reports/owner-publishing-foundation/`
- [x] Handoff updated before closeout
- Progress entries must use `[S:2026-07-18-001-task43-owner-publishing-foundation|W:task43-owner-publishing-foundation|H:<handler>|E:<evidence>]` so session, work, handler, and evidence are traceable.

## Emergency Bypass Protocol
- No bypass authorized.
- Any bypass must be explicitly authorized by the user, recorded in DECISIONS.md, and followed by verification evidence.

<!-- AEGIS:BEGIN generated-sweh-projection -->
<!-- AEGIS:projection-state {"event_count": 0, "last_event_id": null, "schema": "legacy-shadow-sweh-projection-v1"} -->

## Generated S:W:H:E Projection

_Generated from the passive Aegis ledger. Human-authored content outside this block is preserved._

- No projectable ledger events found.

<!-- AEGIS:END generated-sweh-projection -->
