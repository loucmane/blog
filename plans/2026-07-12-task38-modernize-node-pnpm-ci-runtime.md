---
session_id: 2026-07-12-001-task38-modernize-node-pnpm-ci-runtime
work_context: task38-modernize-node-pnpm-ci-runtime
handler_target: .aegis/state/current-work.json
task_ids: [38]
branch_policy: feature-required
evidence_summary:
  - docs/ai/work-tracking/archive/20260712-task38-modernize-node-pnpm-ci-runtime-COMPLETED/
  - .aegis/state/current-work.json
  - sessions/2026/07/2026-07-12-001-task38-modernize-node-pnpm-ci-runtime.md
  - plans/2026-07-12-task38-modernize-node-pnpm-ci-runtime.md
plan_version: v1
emergency_bypass: false
---

# Plan - Task 38 Modernize Node pnpm and CI Runtime

## Header
- **Session ID (S)**: 2026-07-12-001-task38-modernize-node-pnpm-ci-runtime
- **Work Context (W)**: task38-modernize-node-pnpm-ci-runtime
- **Handler Target (H)**: .aegis/state/current-work.json
- **Task IDs**: 38
- **Branch Policy**: feature-required
- **Evidence Summary (E)**: docs/ai/work-tracking/archive/20260712-task38-modernize-node-pnpm-ci-runtime-COMPLETED/, .aegis/state/current-work.json, sessions/2026/07/2026-07-12-001-task38-modernize-node-pnpm-ci-runtime.md, plans/2026-07-12-task38-modernize-node-pnpm-ci-runtime.md
- **Plan Version**: v1
- **Emergency Bypass**: false
- **Authority**: Aegis-native workflow state (`.aegis/state/current-work.json`) plus `authority=standing-grant:sota-magazine-2026-autonomy-v2`; reload `AGENTS.md` and `docs/ai/AEGIS_AUTONOMY_GRANT.md` before workflow decisions.
- **Optional Integrations**: Taskmaster and Serena may be used when present, but are not required for READY unless this task marks them required.

## Plan Table
| Step ID | Description | Evidence | Status |
| --- | --- | --- | --- |
| plan-step-scope | Confirm task scope, constraints, expected outputs, and affected files before implementation | docs/ai/work-tracking/archive/20260712-task38-modernize-node-pnpm-ci-runtime-COMPLETED/FINDINGS.md; docs/ai/work-tracking/archive/20260712-task38-modernize-node-pnpm-ci-runtime-COMPLETED/DECISIONS.md | completed |
| plan-step-implement | Make only task-scoped changes and record implementation notes | docs/ai/work-tracking/archive/20260712-task38-modernize-node-pnpm-ci-runtime-COMPLETED/IMPLEMENTATION.md; changed files; docs/decisions/0003-node-pnpm-runtime-foundation.md | completed |
| plan-step-verify | Run verification, capture reports, and update handoff state | docs/ai/work-tracking/archive/20260712-task38-modernize-node-pnpm-ci-runtime-COMPLETED/reports/modernize-node-pnpm-ci-runtime/; docs/ai/work-tracking/archive/20260712-task38-modernize-node-pnpm-ci-runtime-COMPLETED/HANDOFF.md; docs/ai/work-tracking/archive/20260712-task38-modernize-node-pnpm-ci-runtime-COMPLETED/TRACKER.md; docs/ai/work-tracking/archive/20260712-task38-modernize-node-pnpm-ci-runtime-COMPLETED/reports/modernize-node-pnpm-ci-runtime/task-verification.md; .aegis/reports/verification-report.json | completed |
| plan-step-emergency | Optional - only if a bypass is explicitly authorized | Waiver plus post-mortem note in docs/ai/work-tracking/archive/20260712-task38-modernize-node-pnpm-ci-runtime-COMPLETED/DECISIONS.md and docs/ai/work-tracking/archive/20260712-task38-modernize-node-pnpm-ci-runtime-COMPLETED/FINDINGS.md | n/a |

## Scope
- `.nvmrc` and the selected canonical developer runtime-version projection
- `.npmrc` removal and supported pnpm 11 enforcement in `pnpm-workspace.yaml`
- `package.json` runtime and package-manager declarations without script changes
- `pnpm-lock.yaml` only for explained package-manager metadata changes
- `.github/workflows/ci.yml` only for the explicitly authorized runtime/version/action-pin slice
- deterministic Task 38 runtime-contract tests and supporting documentation
- `.aegis/state/current-work.json`
- `sessions/2026/07/2026-07-12-001-task38-modernize-node-pnpm-ci-runtime.md`
- `plans/2026-07-12-task38-modernize-node-pnpm-ci-runtime.md`
- `docs/ai/work-tracking/archive/20260712-task38-modernize-node-pnpm-ci-runtime-COMPLETED/`
- `docs/ai/work-tracking/archive/20260712-task38-modernize-node-pnpm-ci-runtime-COMPLETED/reports/modernize-node-pnpm-ci-runtime/`
- Task 38 only

## Explicit Exclusions
- Preserve the user-owned untracked `.codex/` directory byte-for-byte and never stage it.
- Do not change product code, React, Next.js, TypeScript, ESLint, Prettier, Tailwind, shadcn/ui, Vitest, Playwright, application dependencies, auto-merge policy, workflow triggers or permissions, trusted-ref resolution, secrets, deployment, Aegis managed assets, enforcement, authority, hooks, or manifest.
- Do not run generic Aegis repair, delivery sync, Task 67 closeout, or Task 67 repair.

## Goals
- [x] Select and pin the current optimal supported runtime from primary-source evidence
- [x] Prove local and CI runtime parity with reproducible frozen installs
- [x] Preserve CI trust boundaries, least privilege, reversibility, and complete evidence

## Branch Policy
- Working branch: `feat/task-38-modernize-node-pnpm-ci-runtime`
- Persistent work should happen on a branch containing `task-38`.

## Amendments & Versioning
- 2026-07-12 - Task 38 kickoff created by Aegis.
- 2026-07-12 - `aegis log` updated `plan-step-scope` to `completed` with evidence `docs/ai/work-tracking/archive/20260712-task38-modernize-node-pnpm-ci-runtime-COMPLETED/FINDINGS.md`.
- 2026-07-12 - `aegis log` updated `plan-step-implement` to `completed` with evidence `docs/decisions/0003-node-pnpm-runtime-foundation.md`.
- 2026-07-12 - `aegis log` updated `plan-step-verify` to `completed` with evidence `docs/ai/work-tracking/archive/20260712-task38-modernize-node-pnpm-ci-runtime-COMPLETED/reports/modernize-node-pnpm-ci-runtime/task-verification.md`.
- 2026-07-12 - `aegis log` updated `plan-step-verify` to `completed` with evidence `.aegis/reports/verification-report.json`.

## Continuation & Handoff
- Next owner: project owner
- Context reload steps:
  1. Read `sessions/current` and this plan.
  2. Read `.aegis/state/current-work.json`.
  3. Read `docs/ai/work-tracking/archive/20260712-task38-modernize-node-pnpm-ci-runtime-COMPLETED/TRACKER.md` and `docs/ai/work-tracking/archive/20260712-task38-modernize-node-pnpm-ci-runtime-COMPLETED/HANDOFF.md`.
  4. Run Aegis readiness/verify commands before mutation.
- Outstanding risks/todos: integrate independent review verdicts, complete deterministic closeout, and require hosted exact-head checks before the explicitly authorized Task 38 merge.

## Conflict & Scope Declaration
- Related plans: none recorded at kickoff.
- Gate cross-check: Aegis readiness must stay aligned with the task branch, current session, current plan, active work-tracking folder, and `.aegis/state/current-work.json`.

## Evidence Checklist
- [x] Aegis current work state exists
- [x] Session and plan current pointers exist
- [x] Active work-tracking folder exists
- [x] Scope notes recorded before implementation
- [x] Implementation notes recorded after changes
- [x] Verification evidence stored under `docs/ai/work-tracking/archive/20260712-task38-modernize-node-pnpm-ci-runtime-COMPLETED/reports/modernize-node-pnpm-ci-runtime/`
- [x] Handoff updated before closeout
- Progress entries must use `[S:2026-07-12-001-task38-modernize-node-pnpm-ci-runtime|W:task38-modernize-node-pnpm-ci-runtime|H:<handler>|E:<evidence>]` so session, work, handler, and evidence are traceable.

## Emergency Bypass Protocol
- No bypass authorized.
- Any bypass must be explicitly authorized by the user, recorded in DECISIONS.md, and followed by verification evidence.

<!-- AEGIS:BEGIN generated-sweh-projection -->
<!-- AEGIS:projection-state {"event_count": 25, "last_event_id": "0c5190e9690f49fdadb5cea718aaef07", "schema": "legacy-shadow-sweh-projection-v1"} -->

## Generated S:W:H:E Projection

_Generated from the passive Aegis ledger. Human-authored content outside this block is preserved._

- [S:2026-07-10-001-task48-protected-ci-controlled-auto-merge W:task-48-protected-ci-controlled-auto-merge H:delivery E:ledger:86b189a0d39...] Delivery state recorded: pr_open for PR #10 at 1cf557a92c8e132....
- [S:2026-07-10-001-task48-protected-ci-controlled-auto-merge W:task-48-protected-ci-controlled-auto-merge H:scope E:ledger:bb214df3ac5...] Scope recorded for 48. Paths: docs/research/2026-07-10-controlled-auto-merge-canary.md, docs/ai/work-tracking/active/20260710-task48-protected-ci-c..., plans/2026-07-10-task48-protected-ci-controlled-auto-merge.....
- [S:2026-07-10-001-task48-protected-ci-controlled-auto-merge W:task-48-protected-ci-controlled-auto-merge H:delivery E:ledger:24d1841aa7b...] Delivery state recorded: pr_merged for PR #10 at 5a345df073862bb....
- [S:2026-07-10-001-task48-protected-ci-controlled-auto-merge W:task-48-protected-ci-controlled-auto-merge H:scope E:ledger:070a32fa48a...] Scope recorded for 48. Paths: docs/ai/work-tracking/active/20260710-task48-protected-ci-c..., .taskmaster/tasks/**, .plan_state/**.
- [S:2026-07-10-001-task48-protected-ci-controlled-auto-merge W:task-48-protected-ci-controlled-auto-merge H:delivery E:ledger:0321a47226a...] Delivery state recorded: pr_merged for PR #11 at e26daabfb6a6e36....
- [S:2026-07-10-001-task48-protected-ci-controlled-auto-merge W:task-48-protected-ci-controlled-auto-merge H:delivery E:ledger:0488508e884...] Delivery state recorded: pr_merged for PR #12 at 3565b2998e2250a....
- [S:2026-07-10-001-task56-aegis-managed-runtime-refresh W:task-56-aegis-managed-runtime-refresh H:scope E:ledger:02c9e7baecc...] Scope recorded for 56.
- [S:2026-07-10-001-task56-aegis-managed-runtime-refresh W:task-56-aegis-managed-runtime-refresh H:delivery E:ledger:1223862e374...] Delivery state recorded: pr_draft for PR #16 at 02e5d8de3d7434c....
- [S:2026-07-10-001-task57-v1-cross-agent-skill-system-roadmap W:task-57-v1-cross-agent-skill-system-roadmap H:delivery E:ledger:e486a2b8c7e...] Delivery state recorded: pr_draft for PR #17 at fd455ab75081154....
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

<!-- AEGIS:END generated-sweh-projection -->
