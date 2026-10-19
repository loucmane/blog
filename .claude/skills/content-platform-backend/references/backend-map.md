# Content Platform Backend Map

Ground truth for `content-platform-backend`, written against the Task 58 baseline. Re-read the
cited file before relying on any detail. When code and this map disagree, the code is the
evidence and the map is stale; report the drift.

## Module Map

| Path | Responsibility |
| --- | --- |
| `packages/web/src/server/content/domain.ts` | Entities; article, job, and outbox statuses; slug normalization (2–180 portable characters) |
| `packages/web/src/server/content/document.ts` | Versioned document contract, allow-listed nodes and marks, URL rules, quarantine, migration registry, public-text extraction |
| `packages/web/src/server/content/service.ts` | `ContentService` lifecycle transitions with idempotency, optimistic versions, outbox, and audit |
| `packages/web/src/server/content/ports.ts` | `ContentRepository`, `ContentTransaction`, object and variant stores, search projection, clock, identifiers |
| `packages/web/src/server/content/reader.ts` | Reader visibility rule, published-story loading, preview loading |
| `packages/web/src/server/content/sections.ts` | Idempotent section terms and article links (used by the lab seed today) |
| `packages/web/src/server/content/errors.ts` | Stable error codes that the API boundary maps to responses |
| `packages/web/src/server/content/media.ts` | `MediaOriginalService`, original validation, checksum object keys |
| `packages/web/src/server/content/media-variant-rules.ts` | Variant widths, formats, encoding revision, pixel limit |
| `packages/web/src/server/content/media-variants.ts` | Measurement, signature checks, rendering, and the variant cache service |
| `packages/web/src/server/content/portability.ts` | Portable bundle export, inspection, import, media verification |
| `packages/web/src/server/content/backup.ts` | Logical backup and restore command plans, restore verification |
| `packages/web/src/server/content/runtime-selection.ts` | Fail-closed content backend selection |
| `packages/web/src/server/content/in-memory-repository.ts` | In-memory repository used when the owner fixture is configured |
| `packages/web/src/server/database/postgres-content-repository.ts` | Transaction-scoped PostgreSQL adapter, row locks, job claims, publication version |
| `packages/web/src/server/database/exclusive-postgres-session.ts` | Dedicated bounded session for repository-wide exclusive work |
| `packages/web/src/server/database/migrations.ts` | Migration discovery, SHA-256 checksums, transactional apply |
| `packages/web/src/server/database/schema.ts` | Drizzle projection of the reviewed SQL, for typed queries and drift checks only |
| `packages/web/src/server/database/postgres-search-projection.ts` | Search document upsert and removal |
| `packages/web/src/server/database/s3-original-object-store.ts` | S3-compatible originals with SHA-256 checksums and metadata |
| `packages/web/src/server/database/s3-media-variant-store.ts` | S3-compatible variant cache under `variants/` |
| `packages/web/src/server/owner/api.ts` | `withOwner`, `assertOwnerMutationRequest`, `readOwnerJson`, `ownerErrorResponse` |
| `packages/web/src/server/owner/contracts.ts` | Strict request contracts for story actions and media metadata |
| `packages/web/src/server/owner/document.ts` | Owner document construction and `publicationReadiness` |
| `packages/web/src/server/owner/schedule.ts` | Local date-time and time-zone resolution for schedules |
| `packages/web/src/server/owner/publication-worker.ts` | Batch runner for due publication jobs |
| `packages/web/src/server/owner/runtime.ts` | Runtime wiring of repository, object stores, and services |
| `packages/web/src/server/owner/workspace.ts` | Owner read models for stories, revisions, autosaves, audit, and media |
| `packages/web/src/server/lab/seed.ts` | Idempotent Reader Lab seed through the content services under an exclusive lock |
| `packages/web/src/server/lab/media.ts` | Seed-only media creation that reserves the row before writing the object |
| `packages/web/src/server/lab/limits.ts` | Run, storage, statement, lock, and cleanup deadlines for the seed |
| `packages/web/src/server/lab/environment.mjs` | `labSeedAllowed`: hosted Preview or unmarked local development only |
| `packages/web/migrations/` | Reviewed forward SQL and paired `.down.sql` files |
| `packages/web/scripts/migrate.mjs` | Dry-run-first migration command with fixed, credential-free messages |

Route handlers under `packages/web/src/app/api/` call into these modules. They are not on this
skill's automatic review route; invoke the skill explicitly when a handler change moves a
server boundary.

## Canonical And Derived Data

| Class | Tables and objects | Rule |
| --- | --- | --- |
| Canonical content | `articles`, `article_revisions`, `article_autosaves`, `authors`, `publication_settings`, `taxonomies`, `article_taxonomies`, `slug_redirects`, `reusable_blocks`, `reusable_block_revisions`, `media_assets` rows, and original objects under `originals/` | Back up, export, and never delete as a side effect |
| Canonical workflow records | `publishing_jobs`, `outbox_events`, `audit_events` | Exported for provenance; never rewritten to hide history |
| Operational state | `content_schema_migrations`, `content_publication_state`, `idempotency_records` | Not in the portable bundle; the target database's migrations create the ledger and counter, and idempotency keys start empty |
| Owner authentication | `owner_users`, `owner_sessions`, `owner_accounts`, `owner_verifications`, `owner_passkeys` (0002) | Covered by logical database backups, excluded from portable exports; handling rules belong to the security skill |
| Derived | `article_search_documents`, variants under `variants/`, `media_renditions` rows, reader caches | Rebuildable; never the only copy of anything |

`media_renditions` rows travel in the portable bundle and its media manifest, but the current
variant pipeline stores variants only in the variant store and records no rows; only the
portable import writes `media_renditions` today.

## Editorial Content Domain Model

- **Identity.** Articles, revisions, media, jobs, and events carry app-owned string ids. The
  owner API creates `article-` plus a UUID on the server, and the slug is derived from the
  title; neither the title nor the slug is identity.
- **Slugs.** `normalizeSlug` and `assertValidSlug` produce lowercase hyphenated slugs of 2 to
  180 characters. `articles_active_slug_key` keeps active slugs unique among non-deleted
  articles. `changeSlug` writes a `slug_redirects` row (unique `from_slug`, never equal to
  `to_slug`); it has no owner route today.
- **Revision pointers.** `current_draft_revision_id`, `published_revision_id`, and
  `scheduled_revision_id` use deferrable composite foreign keys onto
  `article_revisions (article_id, id)`, so a pointer can only reference a revision of the same
  article. `CHECK` constraints require a revision and time for `published` and `scheduled`,
  and a `pre_delete_status` whenever `deleted_at` is set.
- **Immutable revisions.** Revisions are insert-only with unique `(article_id, revision_number)`.
  Restoring an old revision runs `saveDraft` with its document and creates a new revision.
- **Documents.** The envelope is `{ articleId, document, migrationProvenance, schemaVersion,
  title }` with `CURRENT_CONTENT_DOCUMENT_VERSION = 4` and a 2,000,000-byte limit. Nodes and
  marks are allow-listed; links accept only `http`, `https`, and `mailto`; embeds accept only
  HTTPS YouTube and Vimeo hosts; images need alt text, a credit, and a focal point. Unknown
  nodes are quarantined with the original payload, newer versions are refused as
  `future_version`, and the registry migrates v1 to v4 one step at a time, recording
  provenance. The document `articleId` must match its article.
- **Versions.** `articles.version` is an optimistic counter that every mutation increments.
  `saveArticle(article, expectedVersion)` updates only the expected version; otherwise it
  raises `ContentConflictError` carrying the current article and revision.
- **Autosaves.** Each `saveDraft` writes an `article_autosaves` row whose idempotency key is
  unique per article.
- **Taxonomy.** `taxonomies.kind` is `category`, `section`, or `tag`, unique by kind and slug;
  a story's primary section is its section link with the lowest position.
- **Reusable blocks.** Versioned like articles, with their own revisions and a deferrable
  current-revision foreign key; they are exported and imported.
- **Audit.** `audit_events` hold safe references and small metadata (ids, slugs, statuses, the
  unpublish reason), never draft bodies or secrets.
- **Deletion.** Ordinary deletion is soft (`deleted_at` plus `pre_delete_status`). Permanent
  deletion and retention are not designed yet.

## Lifecycle State Machine

All lifecycle methods live in `ContentService` (`packages/web/src/server/content/service.ts`).

| Operation (idempotency operation) | From | To | Guards | Same-transaction effects |
| --- | --- | --- | --- | --- |
| `createArticle` (`article.create`) | none | `draft`, revision 1 | document identity matches, valid slug | audit `article.created` |
| `saveDraft` (`article.save-draft`) | any, not deleted | unchanged | expected version; document migrates and validates | new revision, autosave row, version + 1, audit `article.draft-saved` |
| `publish` (`article.publish`) | any, not deleted | `published` | expected version; revision is the current draft; route also requires `publicationReadiness` | cancels pending and claimed jobs, publication version, outbox `cache.revalidate`, `search.upsert`, `article.published`, audit |
| `schedulePublication` (`article.schedule`) | any, not deleted | `scheduled` | expected version; current draft revision; future `runAt` | keeps `previousStatus` (from the active job when rescheduling), cancels earlier jobs, inserts a pending job, publication version, audit `article.scheduled` |
| `cancelScheduledPublication` (`article.cancel-schedule`) | `scheduled` | the job's `previousStatus` | exactly one active job matching `scheduledRevisionId` and `scheduledAt` | cancels jobs, publication version, audit `article.schedule-cancelled` |
| `claimDuePublication` | job `pending`, or `claimed` with an expired lease | job `claimed` | `run_at` due; lease of at least one second | `attempt` + 1, `claimed_by`, `lease_until` |
| `completeScheduledPublication` | `scheduled` with a claimed job | `published`, job `completed` | caller owns the lease; completion inside the lease window; one active job; schedule still matches | publication version, the same outbox events as `publish`, audit `article.scheduled-publish-completed`. Other outcomes stay separate. Already `completed`: the job is returned unchanged with `duplicate: true`. Job not `claimed` by the caller, or a completion time that is invalid or outside the lease window: `InvalidContentTransitionError`, nothing is written, and the job keeps its status, so a claimed job is retryable once its lease expires (the runner reports it in `retryJobIds`); this path never supersedes. Only stale state supersedes, after the lease checks pass: when the job's article changed between the first read and the lock, the article is missing, it lacks exactly this one active job (then every active job is superseded), it is no longer `scheduled` at the job's revision and time, or that revision is missing or belongs to another article, the job becomes `superseded`, the publication version advances, and the call reports `duplicate: true` without publishing |
| `unpublish` (`article.unpublish`) | `published` or `scheduled` | `unpublished` | expected version; reason of 1 to 1,000 characters | cancels jobs, publication version, outbox `article.unpublished`, audit with the reason |
| `changeSlug` (`article.change-slug`) | any, not deleted | unchanged | expected version; new valid slug that differs | redirect row, publication version, audit `article.slug-changed` |
| `softDelete` (`article.soft-delete`) | any; already deleted returns unchanged | `draft` stays `draft`, others become `unpublished`, `deleted_at` set | expected version | keeps `pre_delete_status`, cancels jobs, publication version, outbox `article.deleted`, audit |
| `restore` (`article.restore`) | deleted | `draft` if it was a draft, otherwise `unpublished` | expected version | publication version, audit `article.restored`; never straight back to public |

Reader visibility (`packages/web/src/server/content/reader.ts`): readers see
`publishedRevisionId` only when the article is not deleted, its status is `published` or
`scheduled`, `publishedAt` and `publishedRevisionId` are set, and, for `scheduled`, exactly one
active job exists whose `previousStatus` is `published` and which matches the schedule. A
scheduled update to a live story keeps the old revision public until completion; a scheduled
first publication stays private. Preview loads the current draft revision of a non-deleted
article.

Transition checklist:

- one `repository.transaction` per operation; the idempotency record is replayed first under
  `lockIdempotency` (`pg_advisory_xact_lock(hashtext(operation), hashtext(key))`), then the
  article is locked with `getArticleForUpdate`;
- the expected version is checked before any write; a conflict reaches the owner as HTTP 409
  with the current article and revision, and the owner's attempted copy stays recoverable;
- the stored idempotency result makes a retry return the first answer instead of repeating
  the transition;
- `recordPublicationChange()` runs whenever reader-visible state changes; the adapter advances
  `content_publication_state.version` once, last, in the same commit;
- status lists stay identical in `domain.ts`, the SQL `CHECK` constraints, the portable bundle
  schemas, and the reader visibility rule.

## APIs And Server Boundaries

Layering: route handler in `packages/web/src/app/api/**/route.ts`, owner helper in
`packages/web/src/server/owner/api.ts`, service (`ContentService`, `MediaOriginalService`,
`OwnerWorkspaceService`, `SectionService`), port in `packages/web/src/server/content/ports.ts`,
adapter in `packages/web/src/server/database/`.

Owner boundary (`packages/web/src/app/api/owner/stories/route.ts`,
`packages/web/src/app/api/owner/stories/[id]/route.ts`,
`packages/web/src/app/api/owner/stories/[id]/actions/route.ts`,
`packages/web/src/app/api/owner/media/route.ts`):

- `withOwner` resolves the owner session first and answers 401 with a fixed message; the
  session rules themselves belong to the security skill;
- mutations call `assertOwnerMutationRequest`, which compares the request origin with the site
  URL;
- `readOwnerJson` requires `application/json`, caps bodies at `maxOwnerJsonBytes`
  (2,100,000 bytes), and parses a strict contract from
  `packages/web/src/server/owner/contracts.ts`;
- every story mutation carries an `idempotencyKey` of 8 to 200 characters and, once the story
  exists, an `expectedVersion`; media upload takes neither, so each upload creates a new media
  identity;
- `ownerErrorResponse` picks the status from the error's class or stable `code`, and every
  response is `private, no-store`:
  - fixed fallback messages, which never echo the error: 404 for a missing item, 503 when the
    owner workspace is not configured, and 500 for anything unclassified, whose message points
    the owner to the local recovery copy; driver, SQL, and connection text therefore never
    reaches the owner;
  - forwarded expected-error messages: 401 sends the `OwnerAccessError` message (one sign-in
    prompt today); 409 sends the `ContentConflictError` message with `conflict.article` and
    `conflict.currentRevision`, the server's current state only; 422 sends the message of a
    transition, document-validation, duplicate-slug, or Zod error through `errorMessage`,
    which falls back to a fixed message only when the error has no string message;
  - the attempted content is held by the client, not returned by the server: the response
    never includes the error's `attemptedDocument`, and the editor keeps the owner's copy in
    `localStorage` (`packages/web/src/components/owner/story-editor.tsx`);
- lifecycle actions call `expirePublicReader()` (`packages/web/src/reader/cache.ts`) after any
  change readers may see.

Internal and public boundaries:

- `packages/web/src/app/api/internal/publication-jobs/route.ts` checks a bearer token in
  constant time, answers 404 to a wrong token, accepts the test clock header only with the
  owner fixture, runs `runDuePublicationJobs`, and expires reader caches when jobs ran;
- `packages/web/src/app/api/internal/lab-seed/route.ts` requires `labSeedAllowed`, a strong
  bearer token, and media storage on Preview, and answers 409 while another seed holds the
  lock;
- `packages/web/src/app/api/revalidate/route.ts` serves changes made outside the content
  services: it advances the publication version before expiring caches;
- `packages/web/src/app/api/media/[id]/route.ts` serves an original or an allow-listed variant
  only while a publicly visible revision references the image, answers storage failures with a
  logged 500 rather than a 404 that would look like revocation, and redirects to the original
  when no variant can be made.

Runtime wiring (`packages/web/src/server/owner/runtime.ts`): PostgreSQL is required unless the
owner fixture is configured; media storage needs bucket and region together and credentials
as a pair. `packages/web/src/server/content/runtime-selection.ts` refuses the framework fixture
in production and never falls back to it when a database is unavailable.

Boundary checklist:

- business rules live in services; handlers stay thin and never run SQL or object-store calls;
- new inputs get a strict contract and byte limits before parsing;
- errors expose stable codes; unexpected failures use fixed messages, forwarded expected-error
  messages stay owner-safe, and driver, SQL, or connection text never reaches the owner;
- cache headers and reader-cache expiry match the visibility change;
- access, origin, token, and secret checks are verified to exist and fail closed; their design
  is handed off to the security skill.

## Database Schema And Reversible Migrations

Schema by migration:

- `packages/web/migrations/0001_content_foundation.sql`: publication settings, authors,
  articles, revisions, autosaves, taxonomies and links, slug redirects, media assets and
  renditions, reusable blocks and revisions, publishing jobs, outbox events, audit events,
  idempotency records, and `article_search_documents`;
- `packages/web/migrations/0002_owner_auth.sql`: owner authentication tables, plus
  `publishing_jobs.previous_status` and `time_zone`, and revision `title` and `dek`;
- `packages/web/migrations/0003_publication_version.sql`: the single-row
  `content_publication_state` counter;
- `packages/web/migrations/0004_media_asset_animation.sql`: nullable `media_assets.animated`.

Constraint highlights: status `CHECK` lists; slug format checks; the partial unique index on
active slugs; deferrable composite revision foreign keys; claimed jobs require an owner and a
lease; SHA-256 shape checks; focal points between 0 and 1; non-negative byte sizes; JSONB
object checks; no `CREATE EXTENSION`.

Convention:

- Forward files in `packages/web/migrations/` are named `NNNN_name.sql` in a gap-free
  four-digit sequence. `readContentMigrations` loads only names matching
  `^\d{4}_[a-z0-9_]+\.sql$`, so the paired `NNNN_name.down.sql` files are never applied by the
  runner.
- The ledger `content_schema_migrations (id, checksum, applied_at)` pins the SHA-256 of every
  applied file. `applyContentMigrations` (`packages/web/src/server/database/migrations.ts`)
  takes `pg_advisory_xact_lock(hashtext('magazine-content-migrations'))`, re-validates history
  under the lock, applies every pending file and its ledger row in one transaction, and rolls
  back completely on any failure.
- Never edit an applied migration: the runner refuses checksum drift, unknown recorded
  migrations, and ordering gaps. Fix forward with a new number.
- Down files reverse dependency order, guard with `IF EXISTS`, drop added constraints before
  their tables, and delete their own ledger row (0002 to 0004).
  `packages/web/migrations/0001_content_foundation.down.sql` is the empty-store rollback
  artifact and does not delete its ledger row; confirm the full-rollback procedure whenever it
  changes.
- Data-preserving shape changes: add measured facts as nullable columns (0004), or add,
  backfill, then constrain inside one migration (0002 adds `previous_status`, backfills it from
  `articles`, then sets `NOT NULL` and a `CHECK`).
- Projection alignment: `packages/web/src/server/database/schema.ts` declares every column the
  SQL creates or adds, and `packages/web/src/server/database/migrations.test.ts` enforces that
  alignment and the down-file ledger deletes for 0002 to 0004. Reviewed SQL is the migration
  authority; `drizzle-kit push` is not a migration path.
- Portability coupling: a new canonical column also enters the bundle schemas in
  `packages/web/src/server/content/portability.ts`, parsed as optional for older bundles and
  normalized on import, as `animated`, `previousStatus`, and `timeZone` already are.
- Command: `node packages/web/scripts/migrate.mjs` is a dry run. Applying requires
  `--apply --environment preview` or `--apply --environment production`, and production
  signals require the production flag. It never prints `DATABASE_URL` and reports only fixed
  messages. This skill never runs `--apply`.
- Rollback (`docs/architecture/content-persistence-foundation.md`): before data exists,
  rollback is a code and migration revert against an empty database; after data exists, it
  needs the versioned export or a logical backup plus a verified restore. Abandoning canonical
  data is never a rollback.

## Media Storage, Processing, Ownership, And Failure Handling

Owner upload (`packages/web/src/app/api/owner/media/route.ts`, then `MediaOriginalService.store`
in `packages/web/src/server/content/media.ts`):

1. The declared `content-length` and the file size are bounded by `MAX_MEDIA_ORIGINAL_BYTES`
   (50 MiB) plus multipart overhead; metadata must pass `ownerMediaMetadataSchema`, which
   requires alt text and a credit.
2. `measureMediaOriginal` reads only the header after checking that the bytes carry the
   declared type's signature, and records the orientation-corrected size and whether the image
   is animated.
3. Allowed originals are AVIF, GIF, JPEG, PNG, and WebP. The SHA-256 of the bytes forms the
   immutable key `originals/{mediaId}/{sha256}`.
4. `putOriginal` (`packages/web/src/server/database/s3-original-object-store.ts`) sends
   `ChecksumSHA256` and `application-sha256` metadata; the acknowledgement must match bytes,
   type, key, and checksum, and `verifyOriginal` re-reads and re-hashes the object.
5. Only then is the `media_assets` row written. If that transaction throws, the original is
   deleted.

The Reader Lab seed (`packages/web/src/server/lab/media.ts`) uses the opposite order: it
reserves the row with `createMediaAssetIfAbsent`, writes and verifies the object inside the
transaction, and never deletes an original after an uncertain commit, so a retry reuses the
identity.

Ownership: the app id and checksum are the product identity; no provider identifier is.
`saveMediaAsset` updates only editorial metadata (alt text, caption, credit, focal point) when
key, checksum, bytes, and type are unchanged, and otherwise refuses the write. Nothing deletes
originals when a story is deleted, and no orphan sweep exists today.

Variants (`packages/web/src/server/content/media-variant-rules.ts`,
`packages/web/src/server/content/media-variants.ts`):

- widths 320, 640, 960, 1280, and 1920; AVIF and WebP plus a JPEG or PNG fallback; GIF
  originals get none;
- keys `variants/{mediaId}/{sha256}/v{revision}/{width}.{format}` with `mediaVariantRevision`
  of 2; advance it whenever encoding changes;
- refused before decoding on a signature mismatch, animation, or more than 8192 × 8192 pixels;
  a 20-second render timeout; two concurrent renders per process; duplicate requests share one
  render;
- the variant store is a cache: a failed read renders again, and a failed write still serves.

Media checklist:

- canonical first: originals are written and verified before any row points at them, or a
  reserved row lets retries reuse the identity;
- every failure leaves either no row or a row whose object exists, and compensation never
  deletes an object whose row may already have committed;
- variants and renditions can be deleted at any time without loss;
- size, type, signature, pixel, and time limits apply before decoding untrusted bytes; upload
  security itself is handed off;
- backups inventory originals by id, key, bytes, type, and checksum, and report missing and
  orphaned objects.

## Background Jobs And Scheduling

- **Schedule input.** The owner sends a local date-time and an IANA time zone.
  `resolveScheduledPublication` (`packages/web/src/server/owner/schedule.ts`) rejects
  incomplete, nonexistent, ambiguous, or past times and stores the instant; the job keeps the
  zone.
- **Jobs.** `publishing_jobs` statuses are `pending`, `claimed`, `completed`, `cancelled`, and
  `superseded`; `(article_id, idempotency_key)` is unique; claimed rows require `claimed_by`
  and `lease_until`.
- **Claim.** `claimDuePublicationJob` takes the oldest due job with `FOR UPDATE SKIP LOCKED`,
  including claimed jobs whose lease expired, and increments `attempt`.
- **Completion.** `completeScheduledPublication` locks the article, then the job; treats an
  already completed job as a duplicate; requires a current lease owned by the caller;
  supersedes jobs that no longer match the article; then publishes the scheduled revision with
  outbox events and audit.
- **Runner.** `runDuePublicationJobs` (`packages/web/src/server/owner/publication-worker.ts`)
  processes 1 to 100 jobs per call (default 25) with 30-second leases. A failed completion stays
  claimed until its lease expires and is reported in `retryJobIds`. There is no attempt ceiling
  and no terminal failed status.
- **Trigger.** An external scheduler must call
  `packages/web/src/app/api/internal/publication-jobs/route.ts`; production cadence is Task 46.
- **Outbox.** Transactions write `cache.revalidate`, `search.upsert`, and `article.published`
  on publish and scheduled completion, `article.unpublished` on unpublish, and
  `article.deleted` on soft delete. `completeOutboxEvent` records completion or failure with an
  attempt count. At the Task 58 baseline nothing outside the content and database modules reads
  or completes outbox events; route handlers expire reader caches directly. Confirm a
  dispatcher exists before relying on any outbox side effect.
- **Exclusive work.** `ContentRepository.tryExclusive` takes a session advisory lock without
  waiting, on a dedicated session with statement, lock, idle-transaction, and cleanup limits,
  and cannot nest. The Reader Lab seed (`packages/web/src/server/lab/seed.ts`) uses it with the
  deadlines in `packages/web/src/server/lab/limits.ts`.

Job checklist:

- intent is a database row committed with the transition, never an in-memory timer;
- claims are leased, skip locked rows, and survive worker death;
- completion re-validates ownership, the lease, and current article state, and is idempotent;
- stale or duplicate work is superseded, not executed;
- retries are bounded or reach a terminal state an operator can see;
- a backlog of old events is drained or expired deliberately before a dispatcher first ships;
- outbox consumers tolerate duplicate delivery.

## Search Indexing

- `article_search_documents` (0001) holds one row per article with a generated `tsvector`:
  title at weight A and `search_text` at weight B, `english` configuration, GIN index.
- `PostgresSearchProjection` (`packages/web/src/server/database/postgres-search-projection.ts`)
  upserts published text and removes rows.
- `extractContentText` (`packages/web/src/server/content/document.ts`) deterministically joins
  the title, text nodes, image alt text, captions, credits, and embed titles and fallbacks.
- At the Task 58 baseline no runtime path calls the projection and no reader query reads the
  table; ranking, filters, and draft exclusion belong to Task 45.
- Rules: index only the published revision's text; remove on unpublish and soft delete through
  the same delivery path as upserts; rebuild from published revisions after a restore; never
  index drafts, autosaves, or scheduled first publications.

## Portable Import And Export

- **Bundle** (`packages/web/src/server/content/portability.ts`): format
  `owner-operated-magazine-content`, version 1, `exportedAt`, the canonical collections sorted
  by id, a media manifest of `original` and `rendition` objects with key, bytes, and SHA-256,
  and a SHA-256 `digest` over canonical JSON.
- **Inspection**: strict schemas, the digest check, duplicate ids, relationship checks
  (revision pointers, schedule and job consistency, autosaves, taxonomy links, renditions,
  reusable blocks), migration and validation of every revision document, and an exact match
  between the manifest and media metadata.
- **Import** refuses an invalid bundle and any non-empty store (`ImportCollisionError`), writes
  everything in one transaction in dependency order, and advances the publication version.
  Documents are stored as exported and migrated when read.
- **Media**: `verifyPortableMedia` re-hashes every manifest object through the object store.
- **Not exported**: owner authentication tables, idempotency records, the migration ledger,
  and the publication version.
- **Compatibility**: older bundles that lack `animated`, `previousStatus`, or `timeZone` are
  accepted and normalized; a new canonical field follows the same pattern or bumps
  `PORTABLE_CONTENT_VERSION` with a migration path.

## Backup And Recovery

- **Plans** (`packages/web/src/server/content/backup.ts`): `pg_dump --format=custom --no-owner
  --no-privileges --file` and `pg_restore --exit-on-error --no-owner --no-privileges`, each
  with an absolute path; the connection comes from the `DATABASE_URL` environment key, never
  from arguments.
- **Verification**: `verifyRestoredContent` compares a canonical fingerprint of the data and
  media manifest, reports entity counts, and fails on any media failure.
- **Contract** (`docs/deployment/backup-restore.md`): provisional RPO of 24 hours and RTO of
  four hours; provider point-in-time recovery does not replace independent encrypted backups;
  originals are inventoried and copied with checksums; renditions are rebuildable; a failed
  restore is a production-readiness blocker; secrets, reset tokens, signed URLs, and keys never
  enter portable exports; a restore drill applies only documented forward migrations.
- **Ownership**: live providers, recurring drills, and RPO and RTO evidence are Task 46;
  drills as an operational gate are Task 60. This skill reviews designs and recovery logic and
  never runs a backup or restore against real data.

## Failure Catalog

| Failure | Where it is handled today | Review question |
| --- | --- | --- |
| Duplicate request or retry | idempotency records replayed under an advisory transaction lock | Does each new mutation use an operation-scoped key and return the stored result? |
| Stale expected version | `ContentConflictError`, HTTP 409 with the current article and revision | Do both versions stay recoverable? |
| Concurrent transitions | `getArticleForUpdate` row lock plus the version check | Is the article locked before reading the state that decides the transition? |
| Uncertain commit | `PostgresContentRepository.transaction` rethrows after a failed `COMMIT` | Does any compensation, such as deleting an object, assume the commit failed? |
| Object written, row missing | `MediaOriginalService.store` deletes the original after a failed row write | Can a crash between the two leave an orphan, and does an inventory report it? |
| Row committed, object missing | `verifyPortableMedia` and backup inventories | Is a missing original found before readers meet a broken image? |
| Worker dies mid-job | lease expiry and re-claim with `SKIP LOCKED` | Is completion still idempotent after a re-claim? |
| Poison job | retried after every lease, no ceiling | Who sees a job that never completes? |
| Schedule edited or superseded | `superseded` jobs and the single-active-job invariant | Can two active jobs exist for one article? |
| Outbox backlog | pending events with no dispatcher yet | What happens to old events when delivery starts? |
| Invalid stored document | migration registry and quarantine | Does the read path fail safely without discarding the payload? |
| Interrupted migration | single-transaction apply under an advisory lock | Can anyone observe a partial schema? |
| Edited applied migration | checksum-drift refusal | Is the fix a new forward migration? |
| Import into a populated store | `ImportCollisionError` | Is a merge import being invented without a design? |
| Restore mismatch | `verifyRestoredContent` and media checksum failures | Is the restore declared failed instead of partially accepted? |
| Exclusive work overruns | `LabSeedLimits` deadlines and session limits | Is long-running work bounded and its lock released? |
