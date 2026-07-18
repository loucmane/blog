# Content and Persistence Foundation

**Status:** Task 42 implementation contract

**Effective:** 2026-07-17

## Purpose

Task 42 replaces the framework-only content fixture with an application-owned content and
persistence boundary. It implements the canonical data model needed by later owner and reader
tasks without building the complete editor, public magazine, authentication system, or
production deployment.

## Domain Invariants

- Article identity is stable and independent from mutable titles and slugs.
- Canonical bodies are versioned structured JSON; stored HTML and Markdown are never trusted
  canonical data.
- Revisions are immutable. An article points separately to its current draft revision and its
  published revision.
- A published article always references exactly one immutable revision. Draft work may continue
  while an older revision remains public.
- Autosaves use optimistic concurrency and idempotency keys. A conflict preserves both sides.
- Scheduling references a validated revision and an idempotent publication job. External side
  effects use an outbox and cannot reverse a committed publication transition.
- Slug changes retain redirect history. Ordinary deletion is recoverable; permanent deletion is
  outside this task.
- Media originals use immutable object keys and application-owned SHA-256 integrity. Renditions
  remain rebuildable derivatives.
- Audit records contain safe references and metadata, not copied draft bodies or secrets.
- Search indexes only approved public text. Draft exclusion and ranking ship with Task 45, while
  Task 42 owns deterministic text extraction and the PostgreSQL index boundary.
- Export is versioned and lossless for the implemented domain. Import into an empty store must
  recreate identities, relationships, checksums, revisions, redirects, and audit provenance.

## Application Boundaries

Task 42 adds app-local modules beneath `packages/web/src/server/content` and
`packages/web/src/server/database`:

1. **Document contract:** strict versioned envelope, allow-listed nodes and attributes, safe URL
   validation, unknown-node quarantine, migration registry, and deterministic plain-text export.
2. **Domain model:** articles, revisions, autosaves, publishing transitions, taxonomy, redirects,
   media, jobs, outbox events, and audit events.
3. **Ports:** content repository, transaction boundary, original-object store, clock, identifier
   source, and search projection.
4. **PostgreSQL adapter:** reviewable SQL migrations, Drizzle schema projection, parameterized
   queries, transaction-scoped lifecycle operations, and explicit connection ownership.
5. **Media adapter:** S3-compatible original upload/read/delete operations with SHA-256 metadata;
   no provider identifier becomes the product identity.
6. **Portability:** deterministic export manifest, strict import validation, collision refusal,
   and restore verification summaries.

## Implemented Task 42 Map

- `packages/web/src/server/content/document.ts`: structured JSON validation, migration,
  quarantine, and public-text extraction.
- `packages/web/src/server/content/service.ts`: revisions, autosave, publication, scheduling,
  outbox, audit, redirects, and recoverable deletion.
- `packages/web/src/server/database/postgres-content-repository.ts`: parameterized,
  transaction-scoped PostgreSQL adapter.
- `packages/web/migrations/0001_content_foundation.sql`: reviewed canonical schema;
  `.down.sql` is the empty-store rollback artifact.
- `packages/web/src/server/content/media.ts` and
  `packages/web/src/server/database/s3-original-object-store.ts`: app-owned originals and
  checksums.
- `packages/web/src/server/content/portability.ts` and `backup.ts`: strict export/import,
  media manifests, backup plans, and restore equivalence.
- `packages/web/src/server/content/runtime-selection.ts` and `reader.ts`: explicit backend,
  preview, and published-revision boundaries without implicit fixture fallback.

## Database Contract

The initial migration creates publication settings, authors, articles, immutable article
revisions, autosaves, taxonomies, article-taxonomy links, slug redirects, media assets and
renditions, reusable blocks and revisions, publishing jobs, outbox events, and audit events.

Constraints enforce allowed lifecycle states, unique active slugs, immutable revision numbering,
idempotency keys, valid focal points, non-negative byte sizes, SHA-256 shape, and published-pointer
integrity where PostgreSQL can enforce it locally. Cross-table lifecycle invariants execute inside
one transaction and are covered by integration tests.

Reviewable SQL is the migration authority. Drizzle is a typed query projection and schema-drift
tool; `drizzle-kit push` is not an accepted production migration path.

## Temporary Framework Fixture Bridge

Task 40's fixture remains available only through an explicit test/development adapter while Task
42 proves the new repository. Production selection fails closed without PostgreSQL configuration.
Task 44 owns removal of the fixture from reader routes before public launch. Task 43 may use the
same explicit adapter for owner-workflow browser fixtures. The bridge must never silently activate
because a production database is unavailable.

## Reversible Delivery Slices

1. Exact dependency and migration tooling adoption.
2. Pure document/domain contracts and fixtures.
3. SQL migration plus PostgreSQL repository and transaction tests.
4. Media-original, search-projection, and publication-outbox ports.
5. Export/import and backup/restore verification.
6. Explicit framework adapter integration without editor or reader redesign.

Each slice is independently reviewable. Before production data exists, rollback is a code and
migration revert against an empty Task 42 database. After data exists, rollback requires the
versioned export or logical backup plus a verified restore; abandoning canonical data is never a
rollback.

## Acceptance Evidence

- Frozen install is idempotent and all lockfile changes map to declared Task 42 dependencies.
- Document validation rejects malformed, unsafe, future-version, and unknown-node input without
  losing the original payload.
- Autosave conflicts, stale publication, duplicate requests, duplicate jobs, and retry paths fail
  safely and preserve recoverable work.
- Initial and repeated migrations pass on empty and populated PostgreSQL 18.4 databases; a forced
  failure leaves no partial migration.
- Complete export/re-import into a clean database preserves stable IDs, revisions, relationships,
  redirects, media metadata/checksums, and audit provenance.
- Logical dump/restore plus media-manifest verification demonstrates usable recovered data.
- Standard unit, browser, accessibility, security, build, smoke, Taskmaster, Aegis, witness,
  guard, secret, and diff gates pass without claiming live-provider or production proof.

## Explicitly Deferred

- Tiptap owner editor UI, autosave browser integration, and manual screen-reader protocol: Task 43.
- Owner authentication and recovery: Task 59 and the owner-workflow program.
- Public magazine layouts and complete persistence-backed reader experience: Task 44.
- Search ranking, filters, feeds, newsletter, and distribution: Task 45.
- Live Neon/R2/Vercel, production scheduling, provider backup, RPO/RTO, observability, and disaster
  recovery drills: Task 46.
