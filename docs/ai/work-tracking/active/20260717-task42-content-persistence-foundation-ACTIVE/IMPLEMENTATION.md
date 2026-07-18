# Task 42 Implement Content and Persistence Foundation - Implementation Notes

## Planned Workstreams
- Implement the accepted app-owned content revision and publishing-state foundations
- Establish reversible PostgreSQL media search audit export and import boundaries
- Prove data integrity restore portability security and rollback behavior

## Implementation Notes
- 2026-07-17 - Added a strict, versioned structured-document contract with allow-listed nodes and marks, URL/provider validation, migration registry, future/unknown-node quarantine, original-payload preservation, deterministic text extraction, and adversarial tests.
- 2026-07-17 - Added stable article identity, immutable revisions, optimistic autosave conflicts, idempotency, draft/published pointer separation, scheduling leases, publish/unpublish, slug redirects, recoverable deletion, audit metadata, and transactional outbox behavior.
- 2026-07-17 - Added a reviewable PostgreSQL 18 migration and rollback artifact covering settings, authors, articles, revisions, autosaves, taxonomy, redirects, media, reusable blocks, publishing jobs, outbox, audit, idempotency, and public search projection.
- 2026-07-17 - Added a Drizzle ORM typed projection plus deterministic SQL-to-projection checks; migrations use checksums, an advisory lock, one transaction, replay verification, and fail-closed checksum drift.
- 2026-07-17 - Added node-postgres transaction/repository behavior, `FOR UPDATE SKIP LOCKED` job claiming, parameterized search projection, and an explicit runtime selector that never falls back to fixture content in production.
- 2026-07-17 - Added S3-compatible original-object storage with app-owned SHA-256, immutable keys, metadata verification, failure compensation, content-type restrictions, and in-memory test adapter.
- 2026-07-17 - Added strict portable export/import with canonical hashing, relationship verification, media manifests, empty-store collision refusal, plus standard PostgreSQL backup/restore plans and recovery comparison.
- 2026-07-17 - Added an opt-in Docker drill using immutable PostgreSQL 18.4 and VersityGW image digests. It proves migrations, rollback, search, S3 checksums, `pg_dump`/`pg_restore`, and restored portable equivalence.
- 2026-07-17 - Kept public routes on the explicitly named Task 40 framework fixture. Task 42 provides reader/preview and backend-selection boundaries; Tasks 43/44 own owner UI and public-route adoption.
- 2026-07-17 - Updated the Task 38 runtime-contract projections for the exact Task 42 manifest/script/lockfile bytes without changing versions, workflow semantics, or action pins.
- 2026-07-17 - Replaced conditional integration-test skipping with fail-closed environment requirements while retaining explicit opt-in file selection.

## Progress Log
- **2026-07-17 21:54 CEST** - [S:20260717|W:task42-content-persistence-foundation|H:aegis:kickoff|E:.aegis/state/current-work.json] Implementation log initialized by Aegis kickoff.
- **2026-07-17 23:06 CEST** - [S:20260717|W:task42-content-persistence-foundation|H:agent:implementation|E:packages/web/src/server/content/service.ts] Completed Task 42 implementation slices without modifying product presentation, CI workflows, Aegis runtime, authority, or production systems

<!-- AEGIS:BEGIN generated-sweh-projection -->
<!-- AEGIS:projection-state {"event_count": 19, "last_event_id": "ae93d7375a7b43f59bc952e60e937507", "schema": "legacy-shadow-sweh-projection-v1"} -->
- **2026-07-17 23:23 CEST** - [S:20260717|W:task42-content-persistence-foundation|H:agent:verification|E:docs/ai/work-tracking/active/20260717-task42-content-persistence-foundation-ACTIVE/reports/content-persistence-foundation/task-verification.md] Recorded complete Task 42 verification matrix and delivery-time gates
- **2026-07-17 23:23 CEST** - [S:20260717|W:task42-content-persistence-foundation|H:agent:verification|E:.aegis/reports/verification-report.json] Recorded final pre-closeout strict verification evidence

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
