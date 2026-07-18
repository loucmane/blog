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
<!-- AEGIS:projection-state {"event_count": 11, "last_event_id": "235ee5780e394f9a9ed7517d90cea6bc", "schema": "legacy-shadow-sweh-projection-v1"} -->
- **2026-07-18 10:46 CEST** - [S:20260718|W:task42-content-persistence-foundation|H:agent:verification|E:.aegis/reports/verification-report.json] Recorded strict Task 42 verification evidence after Task 71 reconciliation
- **2026-07-18 10:48 CEST** - [S:20260718|W:task42-content-persistence-foundation|H:agent:verification|E:docs/ai/work-tracking/active/20260717-task42-content-persistence-foundation-ACTIVE/reports/content-persistence-foundation/task-verification.md] Recorded complete Task 42 verification matrix and delivery-time gates

## Generated S:W:H:E Projection

_Generated from the passive Aegis ledger. Human-authored content outside this block is preserved._

- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:bd7410e27ba...] Session began via compact.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:1a4ab2250ec...] Session began via compact.
- [S:2026-07-17-001-task42-content-persistence-foundation W:task-42-content-persistence-foundation H:witness E:ledger:ae93d7375a7...] Delivery witness FAIL recorded at 7871ecc; report: .aegis/reports/witness-report.json.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:task-truth E:ledger:9a57279aeb2...] Task truth recorded for task truth: changed.
- [S:2026-07-18-002-task71-refresh-aegis-hook-trust-runtime-closeout W:task-71-refresh-aegis-hook-trust-runtime-closeout H:scope E:ledger:772fbbc0a38...] Scope recorded for 71. Paths: .aegis/foundation-manifest.json, .plan_state/sync.log, .taskmaster/tasks/task_071.md.
- [S:2026-07-18-002-task71-refresh-aegis-hook-trust-runtime-closeout W:task-71-refresh-aegis-hook-trust-runtime-closeout H:witness E:ledger:1b6f207afa9...] Delivery witness PASS recorded at 8185180; report: .aegis/reports/witness-report.json.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:delivery E:ledger:11504cecd3b...] Delivery state recorded: Bash.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:delivery E:ledger:ea2284fd382...] Delivery state recorded: Bash.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:delivery E:ledger:54e5c2dcc03...] Delivery state recorded: Bash.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:delivery E:ledger:eb8f546842a...] Delivery state recorded: Bash.
- [S:2026-07-17-001-task42-content-persistence-foundation W:task-42-content-persistence-foundation H:witness E:ledger:235ee5780e3...] Delivery witness FAIL recorded at ba32cd5; report: .aegis/reports/witness-report.json.

<!-- AEGIS:END generated-sweh-projection -->
