# Task 43 Implement Owner Publishing Foundation - Decisions

## Purpose
Record decisions before implementation, including options considered, rationale, and evidence.

## Decisions
- 2026-07-18 - Use Aegis-native current work as the portable workflow authority for this task. Taskmaster and Serena remain optional unless explicitly required.
- 2026-07-18 - Use `authority=standing-grant:sota-magazine-2026-autonomy-v2`; grant path `docs/ai/AEGIS_AUTONOMY_GRANT.md`, verified digest `89ac60905034896537c3a4d794bf22a5d1fc0ccdab926ae93977c6ffc550e095`.
- 2026-07-18 - Build a focused owner foundation, not the complete dashboard: protected shell, one complete story journey, autosave/recovery/conflict behavior, responsive preview, lifecycle controls, revision restore, media metadata workflow, and authentication/passkey boundaries.
- 2026-07-18 - Keep the canonical document envelope, lifecycle, revisions, audit, and persistence application-owned. Tiptap is an editing adapter only; Better Auth is an identity adapter only.
- 2026-07-18 - Pin the Task 37-proven Tiptap `3.27.3` line rather than adopting three-day-old `3.28.0`; pin stable Better Auth/passkey `1.6.23`; reject Better Auth `1.7` prereleases.
- 2026-07-18 - Permit explicit fixture adapters only outside production for deterministic unit/browser journeys. Production owner content and authentication fail closed when PostgreSQL, secrets, or trusted origin configuration are absent.
- 2026-07-18 - Keep reviewable hand-authored SQL as migration authority. Generated auth schema may inform the migration, but no runtime auto-migration or `drizzle-kit push` is allowed.
- 2026-07-18 - Serialize fixture-repository transactions and inspections rather than weakening optimistic concurrency assertions; production PostgreSQL already provides the required transactional isolation.
- 2026-07-18 - Use stable internal content error codes in addition to classes because Next.js server chunking can duplicate class identities. Continue returning only plain-language owner errors and bounded conflict evidence.
- 2026-07-18 - Migrate stored legacy documents at repository and portable-bundle read boundaries, preserving provenance and quarantining future or malformed content rather than rewriting historical rows implicitly.
- 2026-07-18 - Lock the PostgreSQL article row before allocating a revision number so concurrent saves deterministically produce one commit and one recoverable optimistic conflict.
- 2026-07-18 - Treat scheduling as a pending update, not an immediate reader withdrawal. Preserve the live published revision, store timezone and previous status on the job, provide an explicit cancel-schedule transition, and process due jobs through a bearer-protected server runner.
- 2026-07-18 - Snapshot title and summary with every new immutable revision; legacy revisions retain an honest absence rather than fabricated historical metadata.
- 2026-07-18 - Keep human assistive-technology review attended and explicit. Automated checks must pass first but cannot be relabeled as screen-reader proof.
- 2026-07-18 - Keep publication lifecycle feedback distinct from background autosave feedback. A delayed save may update persistence state but must not erase the outcome of an explicit publish, schedule, cancel, unpublish, delete, or restore action before the owner edits again.
- 2026-07-18 - Treat the editor's dirty generation at lifecycle-click time as a persistence barrier. Publish, schedule, unpublish, delete, restore, and related transitions must wait through that generation and abort rather than act on a stale revision when persistence fails.
- 2026-07-18 - Verify portable-bundle integrity against the exact incoming wire representation before applying backward-compatible defaults. Normalization is a read adapter and must never change the bytes whose digest established trust.
- 2026-07-18 - Serialize PostgreSQL idempotency by operation/key with transaction-scoped advisory locks before replay lookup or mutation; exact-key retries are one logical operation even when they arrive concurrently.
- 2026-07-18 - Suppress autosave for programmatic server-copy and revision-restore loads. The restore transaction is already durable and must not manufacture a redundant revision.
- 2026-07-18 - Treat `0002_owner_auth.down.sql` as a development rollback mechanism, not a production data-preservation guarantee. Production rollback requires verified backup/restore or forward recovery under Task 46.
- 2026-07-18 - Keep a scheduled article reader-visible only when its active job proves the pre-schedule state was `published`; a retained historical pointer alone never grants reader visibility.
- 2026-07-18 - Fail legacy publication-job normalization toward privacy: infer `published` and `unpublished` only from those explicit article states, otherwise use `draft`.
- 2026-07-18 - Use article→publication-job lock order for lifecycle and completion transactions. Completion first reads only the job's immutable article identity, then locks the article and exact job, revalidates identity, ownership, and lease, and transitions both atomically. `SKIP LOCKED` claimers may retry after the active transaction releases the row.
- 2026-07-18 - Permit the owner fixture only when `NODE_ENV=test`, the origin is loopback, and the fixture token is strong. Browser verification uses a production build with an explicit test runtime and one worker; production deployment mode remains fail closed.
- 2026-07-18 - Save dirty work before revision restore and make the restored server revision the new persisted editor snapshot; never rely on a local recovery timestamp to preserve work the owner asked to replace.
- 2026-07-18 - Treat revision restore as a guarded mutation interval: disable owner editing and lifecycle controls while the request is active, suppress Tiptap update emission when toggling editability, and resave any newer generation that still arrives through a non-UI path. A scheduled article is valid only with exactly one matching pending/claimed job in service and portable data.
- 2026-07-18 - Treat scheduled article metadata and its sole active job as one integrity unit. Reader visibility and lifecycle mutations fail closed unless article status, scheduled revision, run time, and job identity agree exactly.
- 2026-07-18 - Retain a lifecycle idempotency key across transport-uncertain failures and replace it only after a confirmed success or a materially different action. Preview and lifecycle controls must first drain the exact dirty generation and remain non-editable until the operation reaches a stable outcome.
- 2026-07-18 - Require plain-language confirmation plus a bounded audit reason before unpublish. Omit `aria-pressed` from one-shot toolbar actions; reserve it for true toggle state.
- 2026-07-18 - Classify deterministic publication-job corruption as terminal `superseded` state, but leave unexpected completion failures claimed with their incremented attempt and lease so they remain explicit retries. Process each claimed job independently so one retry cannot starve later due work.
- 2026-07-18 - Expose the structured editor as an ARIA multiline textbox and disable media mutation controls during preview, lifecycle, and revision-restore barriers.

## Progress Log
- **2026-07-18 11:31 CEST** - [S:20260718|W:task43-owner-publishing-foundation|H:aegis:kickoff|E:.aegis/state/current-work.json] Decisions log initialized by Aegis kickoff.
- **2026-07-18 11:39 CEST** - [S:2026-07-18-001-task43-owner-publishing-foundation|W:task43-owner-publishing-foundation|H:agent:scope|E:docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/DECISIONS.md] Locked the independently reversible Task 43 implementation boundary before source edits.
- **2026-07-18 11:39 CEST** - [S:20260718|W:task43-owner-publishing-foundation|H:agent:scope|E:docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/FINDINGS.md] Confirmed Task 43 owner publishing scope before implementation under standing-grant:sota-magazine-2026-autonomy-v2
- **2026-07-18 12:51 CEST** - [S:2026-07-18-001-task43-owner-publishing-foundation|W:task43-owner-publishing-foundation|H:agent:implementation|E:packages/web/src/server/content/in-memory-repository.ts] Recorded the concurrency and cross-bundle error-boundary decisions.
- **2026-07-18 13:42 CEST** - [S:2026-07-18-001-task43-owner-publishing-foundation|W:task43-owner-publishing-foundation|H:agent:independent-review|E:docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/DECISIONS.md] Recorded the reviewed migration, row-lock, scheduling, revision-snapshot, and accessibility-boundary decisions.
- **2026-07-18 14:30 CEST** - [S:2026-07-18-001-task43-owner-publishing-foundation|W:task43-owner-publishing-foundation|H:agent:review-remediation|E:docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/DECISIONS.md] Recorded the second-round lifecycle barrier, raw-wire integrity, idempotency-lock, restore, and production rollback decisions.
- **2026-07-18 15:04 CEST** - [S:2026-07-18-001-task43-owner-publishing-foundation|W:task43-owner-publishing-foundation|H:agent:review-remediation|E:docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/DECISIONS.md] Recorded final visibility, lease, portability, fixture-runtime, restore, and accessibility decisions.
- **2026-07-18 16:10 CEST** - [S:2026-07-18-001-task43-owner-publishing-foundation|W:task43-owner-publishing-foundation|H:agent:review-remediation|E:docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/DECISIONS.md] Recorded exact schedule integrity, retry-stable lifecycle, preview barrier, auditable unpublish, and toolbar semantics decisions.
- **2026-07-18 16:33 CEST** - [S:2026-07-18-001-task43-owner-publishing-foundation|W:task43-owner-publishing-foundation|H:agent:independent-review|E:packages/web/src/server/owner/publication-worker.ts] Recorded terminal-corruption/retry-state, per-job batch isolation, and complete accessibility-freeze decisions.
- **2026-07-18 15:29 CEST** - [S:2026-07-18-001-task43-owner-publishing-foundation|W:task43-owner-publishing-foundation|H:agent:review-remediation|E:docs/ai/work-tracking/active/20260718-task43-owner-publishing-foundation-ACTIVE/DECISIONS.md] Recorded the guarded restore interval, exact active-job invariant, and consistent article→job lock order.
- **2026-07-18 14:00 CEST** - [S:2026-07-18-001-task43-owner-publishing-foundation|W:task43-owner-publishing-foundation|H:agent:browser-regression|E:packages/web/src/components/owner/story-editor.tsx] Recorded lifecycle-message precedence after the full mobile browser matrix exposed an autosave feedback race.

<!-- AEGIS:BEGIN generated-sweh-projection -->
<!-- AEGIS:projection-state {"event_count": 0, "last_event_id": null, "schema": "legacy-shadow-sweh-projection-v1"} -->

## Generated S:W:H:E Projection

_Generated from the passive Aegis ledger. Human-authored content outside this block is preserved._

- No projectable ledger events found.

<!-- AEGIS:END generated-sweh-projection -->
