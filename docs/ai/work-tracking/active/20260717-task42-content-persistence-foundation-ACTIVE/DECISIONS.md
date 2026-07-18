# Task 42 Implement Content and Persistence Foundation - Decisions

## Purpose
Record decisions before implementation, including options considered, rationale, and evidence.

## Decisions
- 2026-07-17 - Use Aegis-native current work as the portable workflow authority for this task. Taskmaster and Serena remain optional unless explicitly required.
- 2026-07-17 - Implement Task 42 inside `packages/web` with app-owned domain and provider ports; do not recreate backend or shared packages.
- 2026-07-17 - Use hand-authored reviewable SQL as migration authority with Drizzle ORM 0.45.2 as the typed runtime projection and node-postgres 8.22.0 for pooled transactions. Do not install Drizzle Kit 0.31.10: its current stable graph introduces deprecated `@esbuild-kit` tooling and affected `esbuild` 0.18.20. Replace generation with deterministic SQL-to-projection contract tests.
- 2026-07-17 - Use Zod 4.4.3 for strict document/import validation and AWS SDK S3 client 3.1085.0 behind the media-original port. Retain 3.1085.0 instead of same-day 3.1090.0 because the selected version passed Task 37 and has one week of registry soak.
- 2026-07-17 - Keep the Task 40 fixture only as an explicit test/development adapter. Production selection must fail closed without PostgreSQL; Task 44 removes the fixture before public launch.
- 2026-07-17 - Defer Tiptap owner UI, authentication, complete public reader wiring, search ranking, and live provider/deployment drills to Tasks 43, 59, 44, 45, and 46 respectively.
- 2026-07-17 - Advance only the five Task 38 canonical digests derived from Task 42 package scripts, dependency declarations, package semantics, and lockfile bytes. Keep all runtime versions, workflow semantics, immutable actions, trust boundaries, and pnpm workspace settings unchanged.
- 2026-07-17 - Keep the real persistence drill opt-in through Vitest file selection, but never represent it as a disabled test. Missing integration environment is a hard failure whenever that suite is selected.

## Progress Log
- **2026-07-17 21:54 CEST** - [S:20260717|W:task42-content-persistence-foundation|H:aegis:kickoff|E:.aegis/state/current-work.json] Decisions log initialized by Aegis kickoff.
- **2026-07-17 21:56 CEST** - [S:20260717|W:task42-content-persistence-foundation|H:agent:scope|E:docs/ai/work-tracking/active/20260717-task42-content-persistence-foundation-ACTIVE/FINDINGS.md] Confirmed Task 42 content and persistence foundation scope, dependency readiness, preserved primary checkout, and standing-grant authority before implementation

<!-- AEGIS:BEGIN generated-sweh-projection -->
<!-- AEGIS:projection-state {"event_count": 19, "last_event_id": "ae93d7375a7b43f59bc952e60e937507", "schema": "legacy-shadow-sweh-projection-v1"} -->

## Generated S:W:H:E Projection

_Generated from the passive Aegis ledger. Human-authored content outside this block is preserved._

- [S:2026-07-15-001-task71-refresh-aegis-hook-trust-runtime W:task-71-refresh-aegis-hook-trust-runtime H:witness E:ledger:37ff249a315...] Delivery witness FAIL recorded at 6e6fa16; report: .aegis/reports/witness-report.json.
- [S:2026-07-15-001-task71-refresh-aegis-hook-trust-runtime W:task-71-refresh-aegis-hook-trust-runtime H:scope E:ledger:1cfefc77801...] Scope recorded for 71. Paths: .aegis/bin/aegis, .aegis/foundation-manifest.json, .claude/scripts/gate_lib.py.
- [S:2026-07-15-001-task71-refresh-aegis-hook-trust-runtime W:task-71-refresh-aegis-hook-trust-runtime H:witness E:ledger:f389a8f80d9...] Delivery witness PASS recorded at 6e6fa16; report: .aegis/reports/witness-report.json.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:delivery E:ledger:71210f744ea...] Delivery state recorded: Bash.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:84b84167be6...] Session began via compact.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:40058918f91...] Session began via resume.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:9b26f97ef54...] Session began via resume.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:e8eeb808a9e...] Session began via resume.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:2499d60ec16...] Session began via resume.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:b62bc0cf89f...] Session began via resume.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:cdef777736a...] Session began via resume.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:834fd0bc1f6...] Session began via resume.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:90e8f4e798a...] Session began via resume.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:543e7b1d08d...] Session began via resume.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:b7970d667e4...] Session began via compact.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:task-truth E:ledger:74559cffc5c...] Task truth recorded for task truth: changed.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:bd7410e27ba...] Session began via compact.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:1a4ab2250ec...] Session began via compact.
- [S:2026-07-17-001-task42-content-persistence-foundation W:task-42-content-persistence-foundation H:witness E:ledger:ae93d7375a7...] Delivery witness FAIL recorded at 7871ecc; report: .aegis/reports/witness-report.json.

<!-- AEGIS:END generated-sweh-projection -->
