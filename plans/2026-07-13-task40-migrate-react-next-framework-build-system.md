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
<!-- AEGIS:projection-state {"event_count": 25, "last_event_id": "01551cbe17ca4a128335019be177321f", "schema": "legacy-shadow-sweh-projection-v1"} -->

## Generated S:W:H:E Projection

_Generated from the passive Aegis ledger. Human-authored content outside this block is preserved._

- [S:2026-07-10-001-task50-magazine-product-discovery-skill W:task-50-magazine-product-discovery-skill H:scope E:ledger:7d0a851fe7e...] Scope recorded for 50. Paths: .aegis/foundation-manifest.json, .agents/skills/magazine-product-discovery, .claude/skills/magazine-product-discovery/**.
- [S:2026-07-10-001-task50-magazine-product-discovery-skill W:task-50-magazine-product-discovery-skill H:witness E:ledger:d1b09690eb8...] Delivery witness PASS recorded at ce6ed9b; report: .aegis/reports/witness-report.json.
- [S:2026-07-11-001-task51-stack-research-adr-skill W:task-51-stack-research-adr-skill H:scope E:ledger:81b1c8a2c15...] Scope recorded for 51. Paths: .claude/skills/stack-research-adr/**, .agents/skills/stack-research-adr, config/agent-skills/catalog.yaml.
- [S:2026-07-11-001-task51-stack-research-adr-skill W:task-51-stack-research-adr-skill H:witness E:ledger:af407cfbc27...] Delivery witness PASS recorded at d685898; report: .aegis/reports/witness-report.json.
- [S:2026-07-11-001-task51-stack-research-adr-skill W:task-51-stack-research-adr-skill H:delivery E:ledger:68fc6a604e0...] Delivery state recorded: pr_draft for PR #19 at 76a7cc5a07cada6....
- [S:2026-07-11-001-task51-stack-research-adr-skill W:task-51-stack-research-adr-skill H:witness E:ledger:8cb836ef6c7...] Delivery witness PASS recorded at fec1d7d; report: .aegis/reports/witness-report.json.
- [S:2026-07-11-001-task51-stack-research-adr-skill W:task-51-stack-research-adr-skill H:delivery E:ledger:d439b53bb04...] Delivery state recorded: pr_draft for PR #19 at fec1d7d7216c8d3....
- [S:2026-07-11-001-task51-stack-research-adr-skill W:task-51-stack-research-adr-skill H:witness E:ledger:73f11dea994...] Delivery witness PASS recorded at e00eda1; report: .aegis/reports/witness-report.json.
- [S:2026-07-11-001-task51-stack-research-adr-skill W:task-51-stack-research-adr-skill H:witness E:ledger:efae1d3c127...] Delivery witness PASS recorded at 51ba5ee; report: .aegis/reports/witness-report.json.
- [S:2026-07-11-001-task67-gitleaks-repository-dispatch W:task-67-gitleaks-repository-dispatch H:witness E:ledger:73ce8d53238...] Delivery witness FAIL recorded at e8ccfa9; report: .aegis/reports/witness-report.json.
- [S:2026-07-11-001-task67-gitleaks-repository-dispatch W:task-67-gitleaks-repository-dispatch H:scope E:ledger:20845d7c6ef...] Scope recorded for 67. Paths: .aegis/foundation-manifest.json, .github/workflows/ci.yml, .plan_state/sync.log.
- [S:2026-07-11-001-task67-gitleaks-repository-dispatch W:task-67-gitleaks-repository-dispatch H:witness E:ledger:a941592c398...] Delivery witness PASS recorded at e8ccfa9; report: .aegis/reports/witness-report.json.
- [S:2026-07-12-001-task38-modernize-node-pnpm-ci-runtime W:task-38-modernize-node-pnpm-ci-runtime H:scope E:ledger:bdd9a0cd1bf...] Scope recorded for 38. Paths: .github/workflows/ci.yml, .nvmrc, config/runtime.json.
- [S:2026-07-12-001-task38-modernize-node-pnpm-ci-runtime W:task-38-modernize-node-pnpm-ci-runtime H:witness E:ledger:35a36cbd2e1...] Delivery witness PASS recorded at 81511aa; report: .aegis/reports/witness-report.json.
- [S:2026-07-12-001-task38-modernize-node-pnpm-ci-runtime W:task-38-modernize-node-pnpm-ci-runtime H:scope E:ledger:5db7bd6b7bb...] Scope recorded for 38. Paths: .github/workflows/ci.yml, .npmrc, .nvmrc.
- [S:2026-07-12-001-task38-modernize-node-pnpm-ci-runtime W:task-38-modernize-node-pnpm-ci-runtime H:scope E:ledger:0c5190e9690...] Scope recorded for 38. Paths: .github/workflows/ci.yml, .npmrc, .nvmrc.
- [S:2026-07-12-001-task38-modernize-node-pnpm-ci-runtime W:task-38-modernize-node-pnpm-ci-runtime H:witness E:ledger:c7dd9c53f3f...] Delivery witness FAIL recorded at ffbf892; report: .aegis/reports/witness-report.json.
- [S:2026-07-12-001-task38-modernize-node-pnpm-ci-runtime W:task-38-modernize-node-pnpm-ci-runtime H:scope E:ledger:4df2911d6d8...] Scope recorded for 38. Paths: .github/workflows/ci.yml, .npmrc, .nvmrc.
- [S:2026-07-12-001-task38-modernize-node-pnpm-ci-runtime W:task-38-modernize-node-pnpm-ci-runtime H:witness E:ledger:9bf3b756070...] Delivery witness PASS recorded at ffbf892; report: .aegis/reports/witness-report.json.
- [S:2026-07-13-001-task37-validate-high-risk-architecture-spikes W:task-37-validate-high-risk-architecture-spikes H:witness E:ledger:f288ca09835...] Delivery witness PASS recorded at beea815; report: .aegis/reports/witness-report.json.
- [S:2026-07-13-001-task37-validate-high-risk-architecture-spikes W:task-37-validate-high-risk-architecture-spikes H:witness E:ledger:b72ec5f18b8...] Delivery witness FAIL recorded at e59c9cc; report: .aegis/reports/witness-report.json.
- [S:2026-07-13-001-task37-validate-high-risk-architecture-spikes W:task-37-validate-high-risk-architecture-spikes H:scope E:ledger:3af8b644a23...] Scope recorded for 37. Paths: .plan_state/sync.log, .taskmaster/tasks/task_037.md, .taskmaster/tasks/tasks.json.
- [S:2026-07-13-001-task37-validate-high-risk-architecture-spikes W:task-37-validate-high-risk-architecture-spikes H:witness E:ledger:0c07d788bd7...] Delivery witness PASS recorded at e59c9cc; report: .aegis/reports/witness-report.json.
- [S:2026-07-13-001-task37-validate-high-risk-architecture-spikes W:task-37-validate-high-risk-architecture-spikes H:witness E:ledger:4150072e0e0...] Delivery witness PASS recorded at 7aa9fa7; report: .aegis/reports/witness-report.json.
- [S:2026-07-13-001-task40-migrate-react-next-framework-build-system W:task-40-migrate-react-next-framework-build-system H:scope E:ledger:01551cbe17c...] Scope recorded for 40. Paths: package.json, pnpm-lock.yaml, config/runtime.json.

<!-- AEGIS:END generated-sweh-projection -->
