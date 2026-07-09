# Task 33 Establish SOTA 2026 Magazine Foundation - Decisions

## Purpose
Record decisions before implementation, including options considered, rationale, and evidence.

## Decisions
- 2026-07-09 - Use Aegis-native current work as the portable workflow authority for this task. Taskmaster and Serena remain optional unless explicitly required.
- 2026-07-09 - Treat `.taskmaster/docs/prd.txt` and linked product documents as canonical; preserve the former PRD under `.taskmaster/docs/archive/` with a superseded notice.
- 2026-07-09 - Keep the first PR planning/architecture-only: no dependencies, lockfile, product source, CI, deployment, or feature implementation.
- 2026-07-09 - Provisionally retain one Next.js full-stack application rather than add a parallel Vite app; require managed and Node-hosted proof before accepting ADR 0001.
- 2026-07-09 - Use Node 24 LTS and a TypeScript 6 transition before TypeScript 7; migrate runtime, tooling, framework, styling, and workspace in separate reversible PRs.
- 2026-07-09 - Provisionally use versioned structured JSON, Tiptap OSS, PostgreSQL, and Drizzle; block production dependencies on editor/migration/autosave/restore spikes.
- 2026-07-09 - Prefer an app-local owned shadcn/Base UI design system; preserve custom behavior through audit and progressive migration before removing the standalone UI package.
- 2026-07-09 - Use managed services only behind app-owned adapters and retain independent export, backup, restore, and Node/PostgreSQL/S3 exit paths.
- 2026-07-09 - Preserve tasks 1-32 under `legacy-2025`; use canonical `master` for Task 33 and tasks 34-47. Do not close stale TWES/governance work as part of product delivery.

## Progress Log
- **2026-07-09 22:38 CEST** - [S:20260709|W:task33-sota-magazine-foundation|H:aegis:kickoff|E:.aegis/state/current-work.json] Decisions log initialized by Aegis kickoff.
- **2026-07-09 23:30 CEST** - [S:20260709|W:task33-sota-magazine-foundation|H:architecture-decisions|E:docs/decisions/] Recorded five provisional ADRs with alternatives, consequences, acceptance gates, and rollback.

<!-- AEGIS:BEGIN generated-sweh-projection -->
<!-- AEGIS:projection-state {"event_count": 5, "last_event_id": "c5a17f51e88947bda46655b552c01e0e", "schema": "legacy-shadow-sweh-projection-v1"} -->
- **2026-07-09 22:39 CEST** - [S:20260709|W:task33-sota-magazine-foundation|H:agent:scope|E:docs/ai/work-tracking/active/20260709-task33-sota-magazine-foundation-ACTIVE/FINDINGS.md] Confirmed Task 33 planning/architecture scope; package and product implementation changes are excluded from the first PR.
- **2026-07-09 23:13 CEST** - [S:20260709|W:task33-sota-magazine-foundation|H:agent:decision|E:docs/research/2026-07-stack-decision-matrix.md] Selected provisional runtime, framework, content, data, service, and deployment targets with explicit spike and rollback gates

## Generated S:W:H:E Projection

_Generated from the passive Aegis ledger. Human-authored content outside this block is preserved._

- [S:unknown W:task-obs-20260709-201621-sota-magazine-reviv... H:scope E:ledger:17dd2f29dd5...] Scope recorded for obs-20260709-201621-sota-magazine-revival-dogfood. Paths: docs/**, plans/**, sessions/**.
- [S:2026-07-09-001-obs-20260709-201621-sota-magazine-revival-dogfood W:observe-sota-magazine-revival-dogfood H:scope E:ledger:9119244a00d...] Scope recorded for obs-20260709-201621-sota-magazine-revival-dogfood. Paths: docs/**, plans/**, sessions/**.
- [S:2026-07-09-001-obs-20260709-201621-sota-magazine-revival-dogfood W:observe-sota-magazine-revival-dogfood H:scope E:ledger:a51384dc8ad...] Scope recorded for aegis-dogfood-6. Paths: .aegis/**, .claude/**, AGENTS.md.
- [S:2026-07-09-001-obs-20260709-201621-sota-magazine-revival-dogfood W:observe-sota-magazine-revival-dogfood H:delivery E:ledger:0f58ed16ff1...] Delivery event recorded: pr_draft.
- [S:2026-07-09-001-task33-sota-magazine-foundation W:task-33-sota-magazine-foundation H:scope E:ledger:c5a17f51e88...] Scope recorded for 33. Paths: .taskmaster/docs/**, .taskmaster/tasks/**, .taskmaster/reports/**.

<!-- AEGIS:END generated-sweh-projection -->
