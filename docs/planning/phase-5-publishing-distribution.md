---
schema: gc.build.plan.v1
workflow:
  id: blog-gwe
  formula: gct-project-planning
methodology:
  pack: planning-base
  name: planning-base-plan
producer:
  formula: gct-project-planning
  stage: plan
  attempt: 1
status: draft
title: Phase 5 Publishing and Distribution Implementation Plan
scope: implementation plan derived from the Phase 5 requirements artifact at PRD.md
effective: 2026-08-04
baseline_commit: 7d8b8f4
interaction_mode: autonomous
correction:
  round: 3
  bead: blog-gwe.2
  source: blog-1jw correction-round acceptance hold (US-06 owner surface was API-and-script only)
  scope: plan artifact only; PRD.md and .taskmaster/docs/prd.txt are unchanged by this correction
  preserves: every accepted round-2 correction
trace:
  upstream:
    - path: PRD.md
      hash: sha256:32e43701a52bfbcd8a573139f37c2566b4a9f246fa80cf2840807c18f0996cac
      note: requirements artifact produced by the requirements stage of this workflow (status draft)
      ids:
        - US-01
        - US-02
        - US-03
        - US-04
        - US-05
        - US-06
        - US-07
        - US-08
        - US-09
        - US-10
        - US-11
        - US-12
        - US-13
        - US-14
        - US-15
        - TS-01
        - TS-02
        - TS-03
        - TS-04
        - TS-05
        - TS-06
        - TS-07
        - TS-08
        - TS-09
        - TS-10
        - TS-11
        - TS-12
        - TS-13
        - TS-14
        - TS-15
        - TS-16
        - BR-01
        - BR-02
        - BR-03
        - BR-04
        - BR-05
        - BR-06
        - BR-07
        - BR-08
        - BR-09
        - BR-10
        - BR-11
        - BR-12
        - BR-13
        - BR-14
        - BR-15
        - AC-01
        - AC-02
        - AC-03
        - AC-04
        - AC-05
        - AC-06
        - AC-07
        - AC-08
        - AC-09
        - AC-10
        - AC-11
        - AC-12
        - AC-13
        - AC-14
        - AC-15
        - AC-16
        - AC-17
        - AC-18
        - OQ-01
        - OQ-02
        - OQ-03
        - OQ-04
        - OQ-05
        - OQ-06
        - OQ-07
        - OQ-08
        - OQ-09
        - OQ-10
    - path: .taskmaster/docs/prd.txt
      hash: sha256:b946fffbf27f4ab7bec3be6414cbbf05f37c0fb496b4fc3749745052ac7ef49a
      note: frozen canonical product truth; read-only, unchanged by this stage
    - path: docs/migration/2026-foundation-roadmap.md
      hash: sha256:9300e7fb8a07a56352e5219c2eb9dc1c0cd27b2095563567ec5eee7481d83928
      note: Phase 5 outcome bullets and phase gate
    - path: docs/architecture/content-persistence-foundation.md
      hash: sha256:ad58ff21a154e380a6a7f937182ee7a5a313765c09064951a6a9e5336fe567d4
      note: Task 42 boundaries, delivery-slice convention, and explicit deferrals to Task 45
    - path: packages/web/src/server/content/ports.ts
      hash: sha256:f6380b5b91eb48f9e4700592cfc230854d0ef5904e128ee3c9fcaf0ed79deea2
      note: existing port surface this plan extends (SearchProjection is write-only today)
    - path: packages/web/src/server/content/service.ts
      hash: sha256:b8fad2614ddb19ffa90be4504b845ec9fba547d7b2342f19ffaaf3a16ae5fd32
      note: publication transitions and outbox emission this plan consumes
    - path: packages/web/src/server/database/schema.ts
      hash: sha256:02173c4dd69390fa604405a99c2cedce094e01f24e48d1aaff96c424c13e05b5
      note: current table inventory, including article_search_documents
    - path: packages/web/migrations/0001_content_foundation.sql
      hash: sha256:e4589dcc7f992e799d7acc0b16154e9f1258a290570f26bd11c6d8fedfd07e75
      note: migration and rollback conventions this plan follows
  coverage:
    - id: US-01
      status: covered
    - id: US-02
      status: covered
    - id: US-03
      status: covered
    - id: US-04
      status: covered
    - id: US-05
      status: covered
    - id: US-06
      status: covered
    - id: US-07
      status: covered
    - id: US-08
      status: covered
    - id: US-09
      status: covered
    - id: US-10
      status: covered
    - id: US-11
      status: covered
    - id: US-12
      status: covered
    - id: US-13
      status: covered
    - id: US-14
      status: covered
    - id: US-15
      status: covered
    - id: TS-01
      status: covered
    - id: TS-02
      status: covered
    - id: TS-03
      status: covered
    - id: TS-04
      status: covered
    - id: TS-05
      status: covered
    - id: TS-06
      status: covered
    - id: TS-07
      status: covered
    - id: TS-08
      status: covered
    - id: TS-09
      status: covered
    - id: TS-10
      status: covered
    - id: TS-11
      status: covered
    - id: TS-12
      status: covered
    - id: TS-13
      status: covered
    - id: TS-14
      status: covered
    - id: TS-15
      status: covered
    - id: TS-16
      status: covered
    - id: BR-01
      status: covered
    - id: BR-02
      status: covered
    - id: BR-03
      status: covered
    - id: BR-04
      status: covered
    - id: BR-05
      status: covered
    - id: BR-06
      status: covered
    - id: BR-07
      status: covered
    - id: BR-08
      status: covered
    - id: BR-09
      status: covered
    - id: BR-10
      status: covered
    - id: BR-11
      status: covered
    - id: BR-12
      status: covered
    - id: BR-13
      status: covered
    - id: BR-14
      status: covered
    - id: BR-15
      status: covered
    - id: AC-01
      status: covered
    - id: AC-02
      status: covered
    - id: AC-03
      status: covered
    - id: AC-04
      status: covered
    - id: AC-05
      status: covered
    - id: AC-06
      status: covered
    - id: AC-07
      status: covered
    - id: AC-08
      status: covered
    - id: AC-09
      status: covered
    - id: AC-10
      status: covered
    - id: AC-11
      status: covered
    - id: AC-12
      status: covered
    - id: AC-13
      status: covered
    - id: AC-14
      status: covered
    - id: AC-15
      status: covered
    - id: AC-16
      status: covered
    - id: AC-17
      status: covered
    - id: AC-18
      status: covered
    - id: OQ-01
      status: deferred
      rationale: PRD authority is an owner decision. This plan treats PRD.md as derived and leaves docs/README.md and .taskmaster/docs/prd.txt untouched, so no slice depends on the answer.
    - id: OQ-02
      status: deferred
      rationale: Email provider selection belongs to a Phase 5 ADR written by the stack-research-adr path. Slice S9 binds the EmailSender port, outbox usage, retry budget, and idempotency, and ships a console adapter, so provider choice changes one adapter file only.
    - id: OQ-03
      status: deferred
      rationale: Analytics provider and consent-surface choice belongs to an ADR plus the owner privacy stance. Slice S10 ships the identifier-free first-party sink that requires no consent banner; a provider that needs consent would add a banner slice that this plan does not size.
    - id: OQ-04
      status: deferred
      rationale: Confirmed versus single opt-in is a jurisdictional decision for the owner. Slice S8 implements confirmed opt-in because it is the reducible option; dropping to single opt-in later removes one job type without a schema change.
    - id: OQ-05
      status: covered
    - id: OQ-06
      status: covered
    - id: OQ-07
      status: covered
    - id: OQ-08
      status: covered
    - id: OQ-09
      status: covered
    - id: OQ-10
      status: covered
---

# Phase 5 Implementation Plan: Publishing and Distribution Foundation

**Program:** Task 33 — SOTA 2026 Magazine Foundation
**Increment:** Phase 5 of `docs/migration/2026-foundation-roadmap.md` (Taskmaster Task 45)
**Requirements:** `PRD.md` (this workflow, requirements stage, status `draft`)
**Baseline:** `7d8b8f4` on `agent/blog-0034-phase-5-prd-planning`

This plan is a workflow-produced draft. It is not owner-approved, and it does not authorize any
merge. Every slice below still lands through the canonical delivery gates with explicit human merge
approval.

## Summary

Phase 5 turns a committed publication into something findable — search, related stories, feeds,
sitemap, canonical URLs, structured data, social cards, newsletter, analytics, and operational
visibility — without letting any of that touch the publication path. The design principle that
decides every question below: **canonical publication is synchronous and app-owned; distribution is
asynchronous, derived, and rebuildable.**

The work lands as **fifteen independently reversible delivery slices — S1–S14 plus S6a**, the author
linkage that two later slices depend on. The delivery unit is one slice, one PR (AC-17), so S6a is
sized, reviewed, and merged on its own rather than folded into S5. Most slices ship a port, an
in-memory implementation with tests, a PostgreSQL or HTTP adapter, and a route where one is
user-visible; S6a is schema and repository only. **Five** SQL migrations (`0002`–`0006`) extend
`packages/web/migrations/` following the reviewed `0001_content_foundation.sql` convention, each
with a paired `.down.sql` and each owned by exactly one slice.

The single most important structural addition is **S2, the outbox dispatcher**. Task 42 already
writes outbox events (`cache.revalidate`, `search.upsert`, `article.published`,
`article.unpublished`, `article.deleted`) inside the publication transaction, but nothing in the
application consumes them — `completeOutboxEvent` is exercised only by `service.test.ts`. Every
external side effect in this phase (index writes, email, cache invalidation, card warming) is a
handler behind that dispatcher, which is what makes the Phase 5 outage-isolation gate (AC-02)
achievable rather than aspirational.

Three findings from reading the current code change the shape of the work and are called out as
plan-stage decisions below: authors are **not** linked to articles today, `changeSlug` emits **no**
outbox event, and the outbox status enum has **no** retry or dead-letter state. Each needs a small,
reviewed addition before the surfaces that depend on it can be correct.

This plan resolves the three open questions the requirements assigned to the implementation-plan
stage (OQ-08 reader-surface boundary, OQ-09 unpublished URL status, OQ-10 latency reference
dataset), plus the four questions left inside the requirements Example Mapping. Four questions
remain owner- or ADR-owned and are listed with the assumption each slice runs on.

## Current System

Facts below were read at `7d8b8f4`; hashes for each source file are in `trace.upstream`.

**What exists (Task 42, merged in #39).**

- Domain and service: `packages/web/src/server/content/service.ts` owns `publish`, scheduled
  publish completion, `unpublish`, `changeSlug`, `softDelete`/restore, and `completeOutboxEvent`,
  all inside `repository.transaction(...)` with optimistic version checks and idempotency records.
- Outbox: `publicationOutbox()` (service.ts:624) writes three events per publication —
  `cache.revalidate`, `search.upsert`, `article.published` — plus `article.unpublished` and
  `article.deleted` on their transitions. `OutboxEvent` carries `attempts`, `lastError`, and
  `status` from `outboxStatuses = ['completed', 'failed', 'pending']`.
- Search write side: the `SearchProjection` port (`content/ports.ts:97`) has only
  `upsertPublishedArticle` and `removeArticle`. `PostgresSearchProjection`
  (`database/postgres-search-projection.ts`) upserts into `article_search_documents`, whose
  `document` column is a `GENERATED ALWAYS AS ... STORED` `tsvector` with `setweight(title,'A') ||
  setweight(search_text,'B')` under the `english` configuration, indexed with GIN
  (`migrations/0001_content_foundation.sql:231`).
- Text extraction: `extractContentText()` (`content/document.ts:683`) is the deterministic
  single source of indexed text; documents are validated at version 3 with quarantine on unknown
  nodes, and `mediaImage` is a known node type.
- Portability: `content/portability.ts` exports `PORTABLE_CONTENT_FORMAT` /
  `PORTABLE_CONTENT_VERSION = 1`, a Zod-validated bundle, and `canonicalJson()` for stable output.
- Persistence: 17 tables in `database/schema.ts`, applied by `database/migrations.ts` with an
  advisory lock, a `content_schema_migrations` ledger, and a checksum guard that rejects edited
  applied SQL. Files matching `^\d{4}_[a-z0-9_]+\.sql$` are applied; `*.down.sql` is intentionally
  excluded from the apply path.
- Routes: only `app/api/preview`, `app/api/revalidate`, `app/stories/[slug]`,
  `app/preview/stories/[slug]`, and the marketing/mockup pages exist.
- Gates: `.github/workflows/ci.yml` runs runtime contract, frozen install, typecheck, dependency
  security policy, lint, formatting, unit and integration tests, package and production builds,
  Playwright plus the accessibility-baseline ratchet, production smoke, and a governance job.

**Gaps this phase must close.**

1. **No query side.** `SearchProjection` cannot answer a query, and no `pg_trgm` extension or
   trigram index exists, so fuzzy matching (BR-06) has no support in the schema today.
2. **No dispatcher.** No application code claims, executes, retries, or completes outbox events.
   Without it, every distribution effect would have to run inline in the publish transaction —
   exactly the coupling the requirements forbid.
3. **No retry state.** `outboxStatuses` has no `retrying`/dead-letter member and the table has no
   `next_attempt_at`, so backoff and an attempt budget (BR-10) cannot be represented.
4. **Slug changes are silent.** `changeSlug` (service.ts:447) writes the `SlugRedirect` and an
   audit event but emits **no** outbox event, so nothing can invalidate caches, refresh the search
   row's slug, or re-render feeds after a slug change (BR-04).
5. **Authors are unlinked.** The `authors` table exists but no column or join table connects an
   author to an article or revision, so schema.org `Person` (AC-05) and the author signal in
   related stories (TS-03) have no data source.
6. **No subscriber domain.** No subscriber, consent, or subscription-history tables, no email port,
   no adapter.
7. **No telemetry or health.** No structured logger, correlation id, analytics sink, Web Vitals
   endpoint, health check, or job-status projection.
8. **Prototype leftovers.** `packages/web/src/types/analytics.ts` and `types/donor.ts` carry no
   product authority and must not be mistaken for Phase 5 contracts.

## Proposed Implementation

Every slice follows the same internal shape, matching the Task 42 convention: **port → in-memory
implementation → unit tests → PostgreSQL/HTTP adapter → integration test → route or command**. No
provider type appears in domain code (AC-01); adapters are selected through explicit configuration
in the style of `content/runtime-selection.ts`, which fails closed rather than defaulting to a
fixture.

New server modules live under `packages/web/src/server/{discovery,distribution,subscriptions,
email,analytics,observability,outbox}/`. Route handlers live under `packages/web/src/app/**`.

### S1 — Search query port and PostgreSQL adapter

*Requirements:* TS-01, BR-06, part of AC-01. *Depends on:* nothing.

- Add `SearchQuery` to `content/ports.ts` (kept beside `SearchProjection`, which stays write-only):
  `search(input: { query: string; limit: number; offset: number }): Promise<SearchResultPage>` with
  `SearchResultPage = { readonly items: readonly SearchHit[]; readonly total: number }` and
  `SearchHit = { articleId, slug, title, snippet, rank }`.
- `server/discovery/search-service.ts` normalizes and length-caps the query, rejects control
  characters, and applies the empty-state contract; `server/discovery/in-memory-search.ts` gives the
  test double used by every downstream slice.
- `database/postgres-search-query.ts` ranks with `ts_rank_cd(document, websearch_to_tsquery('english', $1))`
  and falls back to `similarity(title, $1) > 0.3` when the tsquery yields no rows, so a typo still
  returns results. `ts_headline` produces the snippet from `search_text` only — never from a draft
  revision.
- Migration `0002_search_query_support.sql` (+ `.down.sql`): `CREATE EXTENSION IF NOT EXISTS pg_trgm`,
  a `gin_trgm_ops` index on `article_search_documents.title`, and a covering index on
  `published_at DESC`. A preflight in the migration raises a clear error if the extension cannot be
  created, which is the concrete answer to OQ-06.
- Because `article_search_documents` only ever receives published rows (S2 enforces this), no draft
  text is reachable through search by construction, not by filtering.
- *Rollback:* drop the extension-dependent index and the query adapter; the write side and Task 42
  behavior are untouched.

### S2 — Outbox dispatcher, index lifecycle, and reindex

*Requirements:* TS-02, BR-02, BR-03, BR-05, AC-02. *Depends on:* S1.

- `server/outbox/dispatcher.ts` claims pending events with `FOR UPDATE SKIP LOCKED`, executes the
  registered handler, and records the outcome through the existing `completeOutboxEvent` path.
  Handlers are a registry keyed by event `type`. Each claimed event is executed and recorded in its
  **own transaction inside a per-event boundary**, so no single event — failing, unsupported, or
  slow — can abort the batch or stall unrelated events behind it.
- **Unsupported event types fail visibly, not silently.** A `type` with no registered handler is
  never dropped or quietly skipped. It is recorded as failed with
  `lastError = 'unsupported event type: <type>'`, dead-lettered immediately with `dead_lettered_at`
  set — retrying an unregistered type cannot succeed, so it does not consume the retry budget — and
  surfaced through the S11 owner job view as *needs attention* with the maintainer view carrying the
  type name. The dispatcher then continues with the remaining events in the batch. This is the
  concrete guarantee that an unsupported type produces owner-visible evidence rather than a silent
  gap, and never blocks unrelated events.
- Handlers introduced here: `search.upsert` (load the published revision, `extractContentText`,
  upsert), `article.unpublished` and `article.deleted` (`removeArticle`), `cache.revalidate`
  (existing revalidate route logic), and `article.slug-changed` (new, see below).
- **Emit on slug change:** add one `saveOutbox(..., 'article.slug-changed', ...)` call to
  `service.changeSlug` carrying `fromSlug` and `toSlug`. This is a three-line service change with a
  new unit test; it is the smallest correct fix for gap 4 and is required by BR-04.
- **Retry state:** migration `0003_outbox_retry_state.sql` (+ `.down.sql`) adds
  `next_attempt_at timestamptz`, `dead_lettered_at timestamptz`, and widens the status check
  constraint; `outboxStatuses` gains `dead_letter`. Backoff schedule is 1 min → 5 min → 30 min →
  2 h → 12 h; after the fifth failure the event is dead-lettered and becomes owner-visible through
  S11. *(This is the plan's answer to the requirements' "what attempt budget?" question.)*
- **Idempotency at the adapter boundary (BR-03):** every handler derives its key from
  `outbox_event.id`; the email adapter passes it as the provider idempotency key, the search upsert
  is naturally idempotent through `ON CONFLICT`, and card generation is keyed by
  `articleId:revisionId`.
- **Full reindex:** `server/discovery/reindex.ts` streams published articles into a shadow table
  `article_search_documents_rebuild`, then swaps it in one transaction, so there is **no degraded
  search window** — the plan's answer to the requirements' "online rebuild?" question.
- Invocation: a `/api/internal/outbox/drain` route handler guarded by a shared secret plus a
  `pnpm --filter web outbox:drain` script. Managed scheduling belongs to Task 46; this phase only
  guarantees the dispatcher is correct and callable.
- *Rollback:* stop calling the drain entry point; events accumulate as `pending` and no canonical
  state changes.

### S3 — Canonical URL and redirect resolution

*Requirements:* TS-05, BR-04, AC-07. *Depends on:* nothing (S4–S7 depend on it).

- `server/distribution/canonical.ts` is the single source of every public URL
  (`canonicalArticleUrl(slug)`, `canonicalSectionUrl`, `absolute(path)`), reading the site origin
  from configuration. Feeds, sitemap, structured data, and cards call it; no other module builds a
  URL by hand.
- `server/distribution/slug-resolution.ts` resolves a requested path to one of four outcomes:
  `current` (render), `redirect` (308 to the canonical slug, following the `slug_redirects` chain
  with a visited-set so a chained rename cannot loop), `gone` (410), or `unknown` (404).
- Chain resolution collapses `a → b → c` to a single 308 to `c` and is covered by an explicit
  no-loop test (AC-07).
- Delivery mechanism: `packages/web/src/middleware.ts` on the **Node** middleware runtime, so the
  resolver can reach PostgreSQL through the existing pool; results are cached in-process with a
  short TTL keyed by slug. If the Node middleware runtime turns out to be unavailable on the
  deployment target, the fallback is a rewrite to a `/stories/gone` route handler that sets the 410
  status. This fallback is tracked as risk R-3 with a one-day spike as the first task of the slice.
- *Rollback:* remove the middleware; `stories/[slug]` returns to its current 404-only behavior.

### S4 — Feeds, sitemap, robots, and index hygiene

*Requirements:* TS-04, TS-08, BR-01, BR-15, AC-04. *Depends on:* S3.

- `server/distribution/feed.ts` and `sitemap.ts` are pure functions from a list of published
  projections to a serialized document, so both are unit-testable without a database and stable
  across repeated generation for unchanged input (AC-04).
- Routes: `app/feed.xml/route.ts` (RSS 2.0; Atom only if it costs one extra serializer),
  `app/sitemap.xml/route.ts` (index) plus `app/sitemaps/[page]/route.ts`,
  `app/robots.txt/route.ts`.
- **Pagination thresholds (BR-15):** the feed serves the newest 50 items with
  `rel="next"`/`rel="prev"` links into a dated archive; the sitemap index splits into pages of
  5,000 URLs. Both numbers are published constants in `distribution/limits.ts` and asserted by test.
- Ordering is `published_at DESC, article_id ASC` so output is deterministic under equal
  timestamps.
- Caching: `Cache-Control: public, s-maxage=300, stale-while-revalidate=86400`, invalidated through
  the `cache.revalidate` and `article.slug-changed` handlers.
- Hygiene: `robots.txt` disallows `/preview`, `/api`, and owner routes; those routes additionally
  send `X-Robots-Tag: noindex, nofollow` per response, so a leaked link is excluded twice (BR-01).
- *Rollback:* delete the route files; nothing else reads them.

### S6a — Author linkage

*Requirements:* part of TS-06 and TS-03. *Depends on:* nothing. *Delivery:* its own PR, landing in
wave 2 alongside S3, because both S5 and S6 read the link it creates.

- Migration `0004_article_authors.sql` (+ `.down.sql`) adds
  `article_authors (article_id, author_id, position, PRIMARY KEY (article_id, author_id))`,
  mirroring the `article_taxonomies` shape, with repository reads and an `AuthorProfile` projection.
- Writing that link from the editor belongs to Task 43; this phase seeds it in fixtures and every
  consumer tolerates an empty set — S5 omits `author` rather than emitting a placeholder Person, and
  S6 scores a shared author at zero.
- It is schema and repository only: no port, no route, no user-visible surface.
- *Rollback:* drop the join table; nothing canonical references it, and both consumers already
  handle the empty case.

### S5 — Structured data

*Requirements:* TS-06, AC-05. *Depends on:* S3, S6a.

- `server/distribution/structured-data.ts` emits `Article`, `Person`, `BreadcrumbList`, and the
  publication `Organization` as a server-rendered JSON-LD `<script>` built from canonical fields —
  never parsed out of stored HTML (the content model is structured JSON, so there is no HTML to
  parse).
- `Person` is populated from the S6a `AuthorProfile` projection; with no linked author the `author`
  field is omitted entirely.
- Validation test asserts required fields are populated and that no field is sourced outside
  canonical storage.
- *Rollback:* remove the JSON-LD component; S6a's `article_authors` is untouched and still serves S6.

### S6 — Related stories

*Requirements:* TS-03, BR-07, OQ-07. *Depends on:* S6a, S1.

- `server/discovery/related.ts` scores candidates with documented, configuration-driven weights:
  shared taxonomy term `3.0` each (capped at three terms), shared `taxonomies.kind = 'section'`
  term `2.0`, shared author `1.0`, recency `0.5 × exp(-age_days / 45)`.
- Ties break on `published_at DESC, article_id ASC`, so the set is deterministic for a given corpus
  state (BR-07). The current article and every non-public article are excluded in SQL, not in the
  view layer.
- When no signal matches, the fallback is the most recent articles in the same section, then
  site-wide recency; the empty case returns an empty list rather than an error.
- Weights live in `discovery/related-weights.ts` so the owner's editorial preference (OQ-07) is a
  configuration change, not a code change.
- *Rollback:* callers fall back to recency; no schema change to revert.

### S7 — Social cards and pre-publication preview

*Requirements:* TS-07, US-07, AC-03, AC-06, OQ-05. *Depends on:* S3.

- `app/api/cards/[articleId]/[revisionId]/route.ts` generates the image **on demand**, keyed by
  article id **and** revision id so a given revision always yields the same bytes (AC-06), with a
  long-lived immutable cache header and a warm-on-publish handler in the dispatcher.
- **The public card route serves published revisions only.** It resolves the requested revision
  through the same publication state the reader routes use; a draft, scheduled, previewed,
  unpublished, or soft-deleted revision returns **404** rather than an image. Drafts are therefore
  absent from the public card route by construction, and it registers with the shared AC-03
  exclusion helper like every other distribution surface. It is the only publicly reachable card
  route this slice ships.
- **Private pre-publication preview (US-07).** `app/api/preview/cards/[articleId]/[revisionId]/route.ts`
  renders the card for the *draft* revision behind the existing `app/api/preview` token boundary —
  the same guard the `app/preview/stories/[slug]` route already uses. It responds
  `Cache-Control: private, no-store` with `X-Robots-Tag: noindex, nofollow`, is disallowed in
  `robots.txt` under `/preview` and `/api` (S4), and is never warmed, cached at the edge, or linked
  from a public page.
- The owner sees that preview in context: `app/preview/stories/[slug]` gains a social-preview panel
  showing the rendered card next to the title and description exactly as they will appear when the
  link is shared, so the check happens **before** publishing. The panel is minimal and accessible per
  the S14 boundary — the designed presentation stays with Task 44.
- An unauthenticated or expired-token request to the preview card route returns 404, not 401, so it
  reveals nothing about whether an unpublished article exists.
- Cover selection is deterministic and runs **after** the route has authorized a revision: each
  route resolves which revision it is allowed to render — the public route the currently published
  one, the preview route the draft one behind its token — and only then does the shared renderer
  read the **validated document of that selected revision**, taking the first `mediaImage` node and
  resolving it through `MediaAsset` (`originalKey`, `focalX`, `focalY`, `alt`). The renderer never
  chooses a revision itself and never reaches past the one handed to it, so authorization is not
  something the image layer can bypass. If there is no `mediaImage`, the layout falls back to a
  typographic card. Any generation error serves the static default card and records a
  maintainer-visible warning — a card failure can never fail a publish or a page request.
- Because both routes render the same revision through the same code path, the preview is the real
  artifact rather than an approximation: a revision previewed before publication produces
  **byte-identical** output when that same revision is later published (see Verification).
- Card URLs appear in Open Graph and Twitter meta on `stories/[slug]`, always on the canonical URL.
- *Rollback:* point the meta tags at the static default; delete both card routes and the preview
  panel. No canonical state is involved either way.

### S8 — Subscriber, consent, and subscription routes

*Requirements:* TS-09, BR-08, BR-09, AC-08, OQ-04. *Depends on:* S2.

- Migration `0005_subscribers_consent.sql` (+ `.down.sql`) adds `subscribers`
  (app-generated `id` as primary key — never a provider identifier — `email_canonical` unique,
  `status`, timestamps), `subscriber_consents` (`consent_text_version`, `source`, `granted_at`,
  `withdrawn_at`), and `subscription_events` (append-only history).
- `server/subscriptions/service.ts` implements confirmed (double) opt-in: submitting the form
  stores a **pending** subscriber plus a consent record and queues
  `email.subscription-confirm` through the outbox in the same transaction (BR-08).
- Tokens are single-use, hashed at rest, and scoped to one action; unsubscribe is a **one-step,
  no-login** confirmation that deactivates the subscription and appends the withdrawal to consent
  history rather than deleting it (BR-09).
- Routes: `app/api/subscriptions/route.ts` (POST, rate-limited per IP and per address),
  `app/subscriptions/confirm/route.ts`, `app/subscriptions/unsubscribe/route.ts`.
- Enumeration safety: the POST response is identical for new, pending, and already-confirmed
  addresses.
- *Rollback:* the down migration drops the three tables; because nothing canonical references them,
  reverting costs only subscriber data, which the S12 export can preserve first.

### S9 — Email adapter through the outbox

*Requirements:* TS-10, BR-10, OQ-02. *Depends on:* S2, S8.

- `server/email/ports.ts` defines `EmailSender.send(message: OutboundEmail, idempotencyKey: string):
  Promise<EmailSendResult>`, where `OutboundEmail` carries recipient, subject, text and HTML bodies,
  and a list-unsubscribe header.
- Two adapters ship: `ConsoleEmailSender` (development and tests, records to a log) and one HTTP
  provider adapter selected by an ADR (OQ-02). The provider name appears only in the adapter file
  and configuration.
- The sender is invoked **only** from dispatcher handlers (`email.subscription-confirm`,
  `email.issue`), never from a request path or the publish transaction, so a provider outage
  produces a retrying job and nothing else (BR-10).
- Newsletter templates stay minimal — enough to prove delivery through the adapter, per the
  requirements' out-of-scope line.
- *Rollback:* switch configuration back to the console adapter; queued events stay pending.

### S10 — Analytics sink and Web Vitals

*Requirements:* TS-11, TS-12, BR-11, AC-10, AC-15, OQ-03. *Depends on:* S2.

- `server/analytics/ports.ts` defines `AnalyticsSink.record(event: AnalyticsEvent): Promise<void>`
  with a first-party, cookieless, identifier-free default adapter that aggregates counts per
  route pattern and day into `analytics_page_views_daily`. No IP address, no user agent string, no
  cross-site identifier is stored.
- `app/api/vitals/route.ts` accepts `navigator.sendBeacon` payloads for LCP, INP, and CLS at a 10%
  client sample, validated with Zod and aggregated to p75 per route pattern per day in
  `web_vitals_daily` (migration `0006_distribution_telemetry.sql` with its `.down.sql`).
- A shared `redactEventPayload()` strips query strings, tokens, addresses, and any field not on an
  allowlist before anything is written; the allowlist is the test surface for AC-10.
- Collection is disabled by construction on `/preview/**` and owner routes: the beacon component is
  not rendered there, and the route handler rejects those route patterns server-side as well.
- Prototype leftovers `types/analytics.ts` and `types/donor.ts` are deleted in this slice so the
  only analytics contract in the tree is the new port.
- *Rollback:* set the sink to the no-op adapter; drop the two aggregate tables.

### S11 — Observability, health, and publishing-job visibility

*Requirements:* TS-13, TS-14, BR-12, AC-11, AC-12. *Depends on:* S2.

- `server/observability/logger.ts` emits structured JSON with a correlation id taken from an
  inbound request header or generated per request, propagated through dispatcher handlers so a
  publish and its downstream jobs share one id. `redact()` removes draft bodies, tokens, email
  addresses, and signed media URLs; it is a pure function with its own test table.
- `app/api/health/route.ts` reports database, search, email adapter, and job-queue status with a
  per-check timeout and no secret leakage; degraded is distinguished from down.
- `server/observability/jobs.ts` projects `publishing_jobs` and `outbox_events` into an
  owner-readable view — *waiting to send*, *sending*, *sent*, *waiting to retry*, *needs attention*
  — and a maintainer view carrying attempts, last error, and next attempt time (AC-12).
- Every dead-lettered event reaches *needs attention* with a plain-language reason, including the
  S2 unsupported-type case ("this site does not know how to handle this kind of job yet"); the
  maintainer view carries the raw event type and `lastError`. A dead letter is never invisible, and
  because dispatch is per-event it never suppresses the rest of the queue.
- *Rollback:* remove the routes; the logger degrades to the framework default.

### S12 — Export, erasure, and owner privacy operations

*Requirements:* TS-15, US-06, BR-14, AC-09. *Depends on:* S8, S11.

- Extend `content/portability.ts` to `PORTABLE_CONTENT_VERSION = 2`, adding `subscribers`,
  `consents`, `subscriptionEvents`, and `redirects` sections. The reader accepts version 1 bundles
  and fills the new sections as empty, so older exports stay importable.
- `subscriptions/erasure.ts` implements erasure that removes personal fields (address, name,
  tokens) while retaining an anonymized consent trail — subscriber id, consent text version,
  granted and withdrawn timestamps — which is exactly the BR-14 proof-of-unsubscribe requirement.
- Round-trip test: export → empty database → import → deep-equal on canonical JSON, extended from
  the existing `portability.test.ts` pattern.

**Owner-operable surface (US-06).** Export and erasure are not library functions only, and not a
terminal task either: the owner answers a privacy request in a browser, without a developer.

- `subscriptions/owner-operations.ts` exposes three operations in owner language:
  **how many people subscribed** — counts by state (confirmed, waiting to confirm, unsubscribed) plus
  the newest-subscription date, aggregates only, no addresses listed; **export one subscriber** —
  everything held about one address as a portable version 2 bundle, including consent history;
  **delete one subscriber** — the `erasure.ts` path above, with a plain-language confirmation of what
  is removed and what anonymized trail is retained and why.
- One module, three entry points, no second implementation: the projection module above, routes under
  `app/api/owner/subscribers/{summary,export,erase}/route.ts`, and paired maintainer scripts
  `pnpm --filter web subscribers:summary|export|erase`. Delivery matches the S11 job view.
- **The owner page — `app/owner/subscribers/page.tsx`.** One server-rendered screen, no terminal and
  no build step. It opens with the counts written as a sentence the owner can read aloud — *"142
  people are subscribed, 6 are waiting to confirm, 11 have unsubscribed; the newest joined on
  3 August 2026"* — and carries two labelled forms beneath it: **export one subscriber** (type an
  address, receive the version 2 bundle as a downloaded file) and **delete one subscriber** (type the
  address, then type it a second time to confirm, with the retained anonymized trail explained on the
  page *before* the button is pressed). The page lists no addresses, so opening it exposes nothing;
  every action calls the same operations module the routes and scripts call.
- **No new auth surface.** The page and its routes sit behind the *same* shared server-side secret
  that already guards `/api/internal/outbox/drain`. The owner pastes that one secret into an unlock
  field; the existing guard checks it and returns a short-lived `HttpOnly`, `SameSite=Strict`, secure
  cookie carrying a signed marker — not the secret itself — that the same guard accepts in place of
  the header, plus a *lock* control that clears it. No account, no password store, no user record, no
  second credential: the browser is simply a third way to present the one secret Phase 5 already has.
  Task 59 replaces that boundary with real owner login and re-hosts this page behind it; the
  operations module and routes do not change when it does. This phase still adds no owner login.
- The page sends `noindex` and `no-store` and is outside analytics collection by the S10 owner-route
  rule. It works without client JavaScript (plain form posts), is single-column and usable on a
  phone, and meets the S14 accessibility bar — labelled controls, visible WCAG 2.2 AA focus rings,
  results and errors announced through a polite live region. Presentation stays plain; Task 44 owns
  design.
- Every export and erasure appends an audit record and emits a structured S11 log line with the
  address redacted, so the action is evidenced without re-exposing the personal data — identically
  whether it came from the page, a route, or a script.
- Erasure is confirmed explicitly (the address is typed back), is idempotent, and reports plainly
  when the address is unknown — *"no subscriber with that address; nothing was deleted"* — rather
  than failing silently.
- Slice shape is unchanged: the page ships inside S12's single PR and introduces no migration and no
  table. *Rollback:* version 2 export is additive; reverting the reader still parses version 1. The
  page, routes, and scripts are read-mostly additions that can be removed without touching subscriber
  data, and deleting the page leaves the routes and scripts working.

### S13 — Rebuild command

*Requirements:* TS-16, BR-13, AC-13. *Depends on:* S1, S2, S4, S7.

- `packages/web/scripts/rebuild-derived.mjs`, wired as root script `distribution:rebuild`,
  following the `test:content:integration` script convention.
- It truncates only derived stores (`article_search_documents`, card cache, feed/sitemap cache) and
  rebuilds them from canonical revisions through the same handler code the dispatcher uses — no
  second implementation, and **no canonical write**, asserted by a post-run checksum over the
  canonical tables (BR-13).
- The integration test empties derived state and asserts equivalence after rebuild.
- *Rollback:* the script is additive and read-only against canonical data.

### S14 — Minimal accessible discovery UI

*Requirements:* AC-14, US-12, OQ-08. *Depends on:* S1, S8.

- Scope boundary (OQ-08): this phase ships `app/search/page.tsx` and a subscription form as
  **minimal, unstyled-but-accessible** components using the existing `packages/ui` primitives.
  Art direction, layout, and the finished magazine presentation stay with Task 44.
- Search results announce their count through a polite live region, the empty and error states are
  reachable by keyboard, focus is never trapped in the results region, and every control has a
  visible focus ring at WCAG 2.2 AA contrast.
- Playwright plus axe cover the search page (results, empty, error) and the subscription form
  (idle, invalid address, submitted), extending `tests/e2e/` and the accessibility-baseline
  ratchet in `tests/e2e/accessibility-baseline.json`.
- *Rollback:* remove two routes; the machine-readable surfaces are unaffected.

### Migrations introduced

Five migrations, one owning slice each. No slice introduces a migration that is not listed here.

| Migration | Owning slice | Adds | Reversal |
| --- | --- | --- | --- |
| `0002_search_query_support` | S1 | `pg_trgm`, trigram index on title, published-at index | drop indexes and extension |
| `0003_outbox_retry_state` | S2 | `next_attempt_at`, `dead_lettered_at`, widened status constraint | drop columns, restore constraint |
| `0004_article_authors` | S6a | `article_authors` join table | drop table |
| `0005_subscribers_consent` | S8 | `subscribers`, `subscriber_consents`, `subscription_events` | drop tables |
| `0006_distribution_telemetry` | S10 | `analytics_page_views_daily`, `web_vitals_daily` | drop tables |

Each file is paired with a `.down.sql`, is applied through the existing checksum-guarded
`applyContentMigrations`, and is never edited after it has been applied anywhere.

### Delivery slices at a glance

Fifteen slices, fifteen PRs, five migrations: S1 (`0002`), S2 (`0003`), S3, S4, S6a (`0004`), S5,
S6, S7, S8 (`0005`), S9, S10 (`0006`), S11, S12, S13, S14. Slice numbering is a delivery label, not
a merge order — the merge order is the wave table under *Sequencing And Dependencies*, where S6a
lands in wave 2 with S3 because S5 and S6 both read the author link.

## Non-Goals

- Finished reader design, layouts, and art direction (Task 44 / Phase 4). This phase ships services,
  machine-readable routes, and the minimum accessible UI needed to prove them.
- Owner editor UI, autosave browser integration, and owner authentication (Tasks 43 and 59) — this
  phase reads the author link but does not build the UI that writes it. The operational owner
  surfaces it does ship — the S11 job view, the S12 subscriber page, and the S7 preview panel — are
  plain, browser-reachable, and guarded by the existing shared secret rather than a login of their
  own; designed presentation belongs to Task 44 and real owner login to Task 59, which re-hosts them
  without changing their modules or routes.
- Managed deployment topology, environment separation, provider provisioning, scheduled execution
  of the dispatcher, cost envelope, RPO/RTO drills, and disaster recovery (Task 46 / Phase 6).
- Replacing PostgreSQL search with an external engine; no measurement justifies it.
- Paid subscriptions, paywalls, membership, comments, moderation, and multi-author permissions.
- Cross-site advertising, retargeting identifiers, and third-party marketing tags.
- Newsletter template design beyond what proves delivery through the adapter.
- Editing, promoting, or superseding `.taskmaster/docs/prd.txt`, and any change to the
  `docs/README.md` truth map (AC-18 keeps the canonical file at mode `0444` and sha256
  `b946fff…ef49a`).
- Removing the Task 42 framework-fixture bridge from reader routes (owned by Task 44).

## Verification

**Gate commands** (AC-16), run in this order and all required green before review:

`pnpm install --frozen-lockfile` → `pnpm typecheck` → `pnpm lint` → `pnpm format:check` →
`pnpm security:audit` → `pnpm test` → `pnpm test:content:integration` → `pnpm build` →
`pnpm test:browser` → `pnpm test:smoke:web`, plus the governance job
(`pnpm ci:taskmaster`, `pnpm ci:aegis`, `pnpm ci:guard`, `pnpm ci:agent-skills`). Merge requires a
reviewed PR and explicit human approval on a clean working tree.

**The two Phase 5 gate tests.**

- *Outage isolation (AC-02, BR-02, BR-03).* `outbox/dispatcher.outage.integration.test.ts` forces
  every external adapter — email, analytics, card generation, cache revalidation — to throw, then
  publishes. Assertions: the publication row is committed, the article is publicly readable in the
  same request, each failed event is retried from the outbox, and replaying every event a second
  time produces no duplicate email, feed entry, index row, or analytics record. The same suite seeds
  one event with an unsupported `type` in a batch of healthy events and asserts that it is
  dead-lettered with a recorded reason, appears in the owner job view as *needs attention*, consumes
  no retry attempts, and that **every other event in the batch still completes**.
- *Export and privacy (AC-09, BR-14).* `portability.subscribers.integration.test.ts` exports a
  populated store, imports into an empty database, deep-equals the canonical JSON, then runs erasure
  and asserts personal fields are gone while the anonymized consent trail survives.

**Evidence mapping.**

| Acceptance | Verification | Artifact |
| --- | --- | --- |
| AC-01 | port/adapter unit suites per slice; a lint rule forbidding provider imports under `server/content/**` | `pnpm test` |
| AC-02 | outage-isolation integration test | `pnpm test:content:integration` |
| AC-03 | draft/scheduled/preview/soft-deleted exclusion across search, feed, sitemap, structured data, and the public card route; the private preview card route is the single token-gated exception, asserted to stay unreachable without a valid preview token | `pnpm test` |
| AC-04 | feed and sitemap schema validation, repeat-generation stability, pagination threshold | `pnpm test` |
| AC-05 | JSON-LD required-field validation for Article, Person, BreadcrumbList | `pnpm test` |
| AC-06 | byte-stable card output per revision, including a preview-then-publish test that renders one revision through the preview route, publishes that same revision, renders it through the public route, and asserts the two responses are byte-identical; cache hit; fallback on forced failure | `pnpm test` |
| AC-07 | chained slug redirect resolves to one 308 with no loop | `pnpm test` |
| AC-08 | migration apply/rollback on empty and populated databases | `pnpm test:content:integration` |
| AC-09 | export/import round trip plus erasure | `pnpm test:content:integration` |
| AC-10 | redaction allowlist test; zero collection asserted on preview and owner routes | `pnpm test` |
| AC-11 | health-check states and correlation-id propagation with redaction | `pnpm test` |
| AC-12 | job projection renders every state in owner language and maintainer detail | `pnpm test` |
| AC-13 | derived stores emptied, rebuilt, canonical checksum unchanged | `pnpm test:content:integration` |
| AC-14 | axe plus keyboard flows on search and subscription | `pnpm test:browser` |
| AC-15 | no editor code in reader bundles; budgets asserted against the reference corpus | `pnpm build`, `pnpm test:browser` |
| AC-16 | full gate list on a task-scoped branch from clean `main` | CI workflow |
| AC-17 | each slice merges independently with its rollback note recorded in the PR | review record |
| AC-18 | sha256 and mode assertion on `.taskmaster/docs/prd.txt` | `pnpm ci:guard` |
| US-06 | subscriber counts by state, single-subscriber export bundle, erasure confirmation and idempotency, redacted audit line, and one shared operations module behind page, routes, and scripts; owner page reachable only with the existing shared secret, shows counts and no addresses, downloads a bundle, refuses erasure until the address is typed back, reports an unknown address plainly, and passes axe plus a keyboard-only flow | `pnpm test`, `pnpm test:content:integration`, `pnpm test:browser` |
| US-07 | preview card renders the draft revision only with a valid preview token, sends `no-store` and `noindex`, returns 404 without a token, and the public card route returns 404 for that same unpublished revision; cover selection reads only the revision the route authorized; what the owner previewed is what publishing serves, asserted byte-for-byte with AC-06 | `pnpm test` |

**Performance budgets** measured against the OQ-10 reference corpus (500 published articles, 20
authors, 40 taxonomy terms, deterministic seed): search API p95 ≤ 200 ms server time warm; related
stories ≤ 100 ms; feed and sitemap page ≤ 300 ms; card generation ≤ 800 ms cold and ≤ 50 ms cached.
Field validation of LCP/INP/CLS belongs to Phase 6; this phase only instruments and records p75.

## Decisions Made At This Stage

The requirements assigned three open questions to this stage and left four questions inside Example
Mapping. All seven are resolved here, followed by the design decisions this plan makes on its own
authority.

- **OQ-08 reader surface boundary.** Phase 5 ships machine-readable routes plus minimal accessible
  UI for search and subscription only (S14). Presentation lands with Task 44.
- **OQ-09 unpublished URL status.** A URL that was previously published and is now unpublished or
  soft-deleted returns **410 Gone**; a slug in redirect history returns **308**; anything else
  returns **404** (S3).
- **OQ-10 latency reference dataset.** 500 published articles with 20 authors and 40 taxonomy terms
  from a deterministic seed, with the budgets listed under Verification.
- **Retry budget before a job is "failed" to the owner.** Five attempts with 1 m / 5 m / 30 m / 2 h /
  12 h backoff, then dead-lettered and shown as *needs attention* (S2, S11).
- **Online reindex.** The rebuild writes to a shadow table and swaps in one transaction, so there is
  no degraded-search window (S2).
- **Cover image source for cards.** The first `mediaImage` node in the validated document of the
  revision the route authorized — the published revision for the public route, the draft revision
  for the token-guarded preview route — with a typographic fallback and no schema change. Selecting
  after authorization, rather than from "the published document", is what lets preview and publish
  share one renderer and still keep drafts off the public route (S7).
- **Pre-publication card preview.** The owner checks the social preview through a private,
  `no-store`, token-guarded preview card route and a panel on the existing preview page; the public
  card route serves published revisions only and returns 404 for anything else, so adding the
  preview does not put drafts on a public route (S7).
- **Unsupported outbox event types.** Recorded as failed, dead-lettered immediately without
  consuming the retry budget, and shown to the owner as *needs attention*; per-event dispatch means
  the rest of the batch still runs. Silent skipping was rejected because it hides a real gap (S2, S11).
- **Owner privacy operations.** Subscriber counts, single-subscriber export, and erasure ship as an
  operable surface in S12 — a browser page for the owner plus the routes and scripts it shares — not
  as library functions the owner cannot reach, and not as a terminal-only task. The page reuses the
  existing shared-secret boundary rather than introducing a second credential; real owner login stays
  with Task 59.
- **Author linkage.** Added as the `article_authors` join table, delivered as its own slice and PR
  (S6a) because schema.org `Person` and the related-story author signal have no data source without
  it and two slices depend on it.

## Sequencing And Dependencies

| Wave | Slices | Rationale |
| --- | --- | --- |
| 1 | S1, S2 (with the `changeSlug` outbox emission and retry-state migration) | everything asynchronous depends on the dispatcher |
| 2 | S3, S6a | canonical URLs and author linkage are prerequisites for four surfaces |
| 3 | S4, S5, S6, S7 | independent of each other once waves 1–2 land |
| 4 | S8, S9 | subscriber schema before the email adapter that serves it |
| 5 | S10, S11 | telemetry and operations over a working dispatcher |
| 6 | S12, S13, S14 | export, rebuild, and UI verify the finished set |

All fifteen slices appear in exactly one wave above, and each is one PR with its own rollback note
(AC-17) — S6a included, which is why wave 2 carries two entries. No slice requires abandoning canonical data
to revert: before production data exists, rollback is a code and migration revert; afterwards it is
the S12 versioned export plus a verified restore.

## Risks And Rollback

- **R-1 — dispatcher scheduling is out of scope.** Phase 5 proves the dispatcher is correct and
  callable but does not schedule it in a managed environment (Task 46). *Mitigation:* the drain
  endpoint and script are documented, and the job view makes a stalled queue visible.
- **R-2 — `pg_trgm` unavailable on the managed target.** *Mitigation:* the S1 migration fails loudly
  at apply time rather than silently degrading; the fallback is prefix and `ILIKE` matching with a
  documented recall loss, recorded against OQ-06.
- **R-3 — Node middleware runtime for slug resolution.** Edge runtime cannot reach the PostgreSQL
  pool. *Mitigation:* the first task of S3 is a spike; the fallback is a rewrite to a route handler
  that sets the 410/308 status.
- **R-4 — author linkage crosses task boundaries.** `article_authors` is written by the Task 43
  editor. *Mitigation:* the table is additive, structured data omits `author` when empty, related
  scoring treats a missing author as a zero signal, and the cross-task dependency is stated in the
  S6a PR description that introduces it.
- **R-5 — email provider selection is still open (OQ-02).** *Mitigation:* the console adapter keeps
  every other slice testable and unblocked; the provider adapter is a single file.
- **R-6 — coverage-surface drift.** Distribution surfaces multiply the places a draft could leak.
  *Mitigation:* AC-03 is a single shared test helper asserting exclusion across every surface at
  once, so a new surface must register with it.
- **R-7 — the owner page is guarded by a shared secret, not a login.** A secret typed into a browser
  can be shared, or left unlocked on a device. *Mitigation:* the page shows aggregates and lists no
  addresses, the unlock cookie is short-lived, `HttpOnly`, and clearable with an explicit *lock*
  control, erasure requires the address typed back, every export and erasure is audited with the
  address redacted, and Task 59 replaces the boundary with real owner login without changing the
  operations module or its routes.

## Open Questions Carried Forward

These four remain owner- or ADR-owned. Each states the assumption the plan runs on, so no slice is
blocked.

- **OQ-01 PRD authority** — *assumption:* `PRD.md` stays derived and `.taskmaster/docs/prd.txt`
  stays canonical; no slice touches either. *Decides:* owner.
- **OQ-02 email provider** — *assumption:* one HTTP adapter chosen by a Phase 5 ADR; the port,
  outbox usage, retry budget, and idempotency are fixed here. *Decides:* ADR.
- **OQ-03 analytics provider and consent surface** — *assumption:* first-party, cookieless,
  identifier-free collection needing no consent banner. *Decides:* ADR plus owner privacy stance.
- **OQ-04 opt-in model** — *assumption:* confirmed (double) opt-in with stored consent evidence;
  reducing to single opt-in later removes one job type without a schema change. *Decides:* owner.

## Upstream Coverage Matrix

| ID | Status | Where addressed |
| --- | --- | --- |
| US-01 | covered | S1, S2 dispatcher handlers, S4 |
| US-02 | covered | S2, outage-isolation gate test |
| US-03 | covered | S11 job projection in owner language |
| US-04 | covered | S2 slug-changed event, S3 redirect resolution |
| US-05 | covered | S2 removal handlers, S4, S7 public card 404 |
| US-06 | covered | S12 owner subscriber page, plus the routes and scripts it shares |
| US-07 | covered | S7 private pre-publication card preview |
| US-08 | covered | S1 fuzzy fallback, S14 search page |
| US-09 | covered | S6 |
| US-10 | covered | S8, S14 subscription form |
| US-11 | covered | S4 feeds |
| US-12 | covered | S14 |
| US-13 | covered | S13 |
| US-14 | covered | S11 |
| US-15 | covered | S9, S10, AC-01 adapter boundary |
| TS-01 | covered | S1 |
| TS-02 | covered | S2 |
| TS-03 | covered | S6, S6a author signal |
| TS-04 | covered | S4 |
| TS-05 | covered | S3 |
| TS-06 | covered | S5, S6a |
| TS-07 | covered | S7 |
| TS-08 | covered | S4 |
| TS-09 | covered | S8 |
| TS-10 | covered | S9 |
| TS-11 | covered | S10 |
| TS-12 | covered | S10 |
| TS-13 | covered | S11 |
| TS-14 | covered | S11 |
| TS-15 | covered | S12 |
| TS-16 | covered | S13 |
| BR-01 | covered | S4, Verification AC-03 |
| BR-02 | covered | S2, outage-isolation gate test |
| BR-03 | covered | S2, outage-isolation gate test |
| BR-04 | covered | S2 slug-changed event, S3 |
| BR-05 | covered | S2 removal handlers |
| BR-06 | covered | S1 |
| BR-07 | covered | S6 |
| BR-08 | covered | S8 |
| BR-09 | covered | S8 |
| BR-10 | covered | S2 retry budget, S9 |
| BR-11 | covered | S10 |
| BR-12 | covered | S11 |
| BR-13 | covered | S13 |
| BR-14 | covered | S12 |
| BR-15 | covered | S4 pagination thresholds |
| AC-01 | covered | all slices, Verification evidence table |
| AC-02 | covered | outage-isolation gate test |
| AC-03 | covered | shared exclusion helper, R-6 |
| AC-04 | covered | S4 |
| AC-05 | covered | S5 |
| AC-06 | covered | S7 |
| AC-07 | covered | S3 |
| AC-08 | covered | S8 migrations |
| AC-09 | covered | export and privacy gate test |
| AC-10 | covered | S10 redaction allowlist |
| AC-11 | covered | S11 |
| AC-12 | covered | S11 job projection |
| AC-13 | covered | S13 |
| AC-14 | covered | S14 |
| AC-15 | covered | S10, Verification budgets |
| AC-16 | covered | Verification gate commands |
| AC-17 | covered | Sequencing And Dependencies, per-slice rollback notes |
| AC-18 | covered | Non-Goals, Verification AC-18 row |
| OQ-01 | deferred | Open Questions Carried Forward |
| OQ-02 | deferred | Open Questions Carried Forward, S9 |
| OQ-03 | deferred | Open Questions Carried Forward, S10 |
| OQ-04 | deferred | Open Questions Carried Forward, S8 |
| OQ-05 | covered | S7 on-demand generation decision |
| OQ-06 | covered | S1 extension preflight, R-2 |
| OQ-07 | covered | S6 configurable weights |
| OQ-08 | covered | S14, Decisions Made At This Stage |
| OQ-09 | covered | S3, Decisions Made At This Stage |
| OQ-10 | covered | Verification budgets, Decisions Made At This Stage |
