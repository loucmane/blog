---
schema: gc.build.requirements.v1
workflow:
  id: blog-t0v
  formula: planning-base
methodology:
  pack: planning-base
  name: planning-base-requirements
producer:
  formula: planning-base
  stage: requirements
  attempt: 1
status: draft
title: Phase 5 Publishing and Distribution Foundation
scope: repository root requirements artifact derived from the frozen canonical PRD
effective: 2026-08-03
baseline_commit: 0f05f0f
interaction_mode: autonomous
trace:
  upstream:
    - path: .taskmaster/docs/prd.txt
      hash: sha256:b946fffbf27f4ab7bec3be6414cbbf05f37c0fb496b4fc3749745052ac7ef49a
      note: frozen canonical product truth, preserved byte-for-byte and not modified by this stage
      ids:
        - PRD-5.6-SLUG-REDIRECTS
        - PRD-6.2-DISCOVERY
        - PRD-6.3-SEO-SOCIAL
        - PRD-6.4-NEWSLETTER
        - PRD-7.1-DERIVATIVES
        - PRD-7.3-EXPORT
        - PRD-8-SEARCH-OBSERVABILITY
        - PRD-9.1-ACCESSIBILITY
        - PRD-9.2-PERFORMANCE
        - PRD-10-SECURITY-PRIVACY
        - PRD-11-ADAPTERS
        - PRD-13-DELIVERY-GATES
    - path: docs/migration/2026-foundation-roadmap.md
      hash: sha256:9300e7fb8a07a56352e5219c2eb9dc1c0cd27b2095563567ec5eee7481d83928
      note: Phase 5 outcome, bullets, and gate
      ids:
        - P5-SEARCH-RELATED
        - P5-FEEDS-SEO
        - P5-NEWSLETTER
        - P5-ANALYTICS-VITALS
        - P5-OBSERVABILITY
        - P5-GATE
    - path: docs/product/nonfunctional-requirements.md
      hash: sha256:71565ce8f76af5da07cf710ef44506833aa513f92dd7e05a8dda84936ddcc4fb
      note: canonical quality contract
      ids:
        - NFR-PRIVACY
        - NFR-PORTABILITY
        - NFR-OPERABILITY
        - NFR-RELIABILITY
    - path: docs/architecture/content-persistence-foundation.md
      hash: sha256:ad58ff21a154e380a6a7f937182ee7a5a313765c09064951a6a9e5336fe567d4
      note: merged Task 42 boundaries this phase builds on
      ids:
        - T42-SEARCH-PROJECTION-PORT
        - T42-OUTBOX-EVENTS
        - T42-SLUG-REDIRECT-HISTORY
        - T42-DEFERRED-TO-45
    - path: docs/README.md
      hash: sha256:46be3d0fc5dfbb64fd75f5a686f50ddd24b580a6e8ec7d3d0cf632f0603bd902
      note: documentation truth map that currently points product requirements at the frozen canonical PRD
      ids:
        - DOC-TRUTH-MAP
  coverage:
    - id: PRD-5.6-SLUG-REDIRECTS
      status: covered
    - id: PRD-6.2-DISCOVERY
      status: covered
    - id: PRD-6.3-SEO-SOCIAL
      status: covered
    - id: PRD-6.4-NEWSLETTER
      status: covered
    - id: PRD-7.1-DERIVATIVES
      status: covered
    - id: PRD-7.3-EXPORT
      status: covered
    - id: PRD-8-SEARCH-OBSERVABILITY
      status: covered
    - id: PRD-9.1-ACCESSIBILITY
      status: covered
    - id: PRD-9.2-PERFORMANCE
      status: covered
    - id: PRD-10-SECURITY-PRIVACY
      status: covered
    - id: PRD-11-ADAPTERS
      status: deferred
      rationale: Phase 5 owns the email, analytics, observability, and search adapter contracts only. Managed deployment topology, environment separation, provider provisioning, and RPO/RTO drills stay in Phase 6 (Task 46).
    - id: PRD-13-DELIVERY-GATES
      status: covered
    - id: P5-SEARCH-RELATED
      status: covered
    - id: P5-FEEDS-SEO
      status: covered
    - id: P5-NEWSLETTER
      status: covered
    - id: P5-ANALYTICS-VITALS
      status: covered
    - id: P5-OBSERVABILITY
      status: covered
    - id: P5-GATE
      status: covered
    - id: NFR-PRIVACY
      status: covered
    - id: NFR-PORTABILITY
      status: covered
    - id: NFR-OPERABILITY
      status: covered
    - id: NFR-RELIABILITY
      status: covered
    - id: T42-SEARCH-PROJECTION-PORT
      status: covered
    - id: T42-OUTBOX-EVENTS
      status: covered
    - id: T42-SLUG-REDIRECT-HISTORY
      status: covered
    - id: T42-DEFERRED-TO-45
      status: covered
    - id: DOC-TRUTH-MAP
      status: covered
---

# Product Requirements: Phase 5 Publishing and Distribution Foundation

**Program:** Task 33 — SOTA 2026 Magazine Foundation
**Increment:** Phase 5 of `docs/migration/2026-foundation-roadmap.md` (Taskmaster Task 45)
**Baseline:** `0f05f0f` after "feat: implement content and persistence foundation (#39)"

## Authority Note

This file is the repository-root requirements artifact for the current planning workflow. It
derives from, and does not replace, the frozen canonical PRD at `.taskmaster/docs/prd.txt`
(sha256 `b946fff…ef49a`), which remains read-only and byte-identical. Where this document and the
canonical PRD disagree, the canonical PRD wins and this document is defective. Promotion of
`PRD.md` to canonical status would require an owner decision plus an update to the truth map in
`docs/README.md`; that decision is recorded as an open question, not assumed here.

## Problem Statement

The magazine has canonical content and persistence (Task 42, merged in #39): versioned structured
documents, immutable revisions, publication transitions, slug-redirect history, media originals
with checksums, an outbox for external side effects, a `SearchProjection` port, and a PostgreSQL
adapter. Nothing yet turns a published revision into something a reader, a search engine, a feed
client, or a subscriber can find.

Concretely, the repository has no site search, no related-story signal, no RSS or sitemap route,
no canonical-URL or redirect resolution at the edge of the app, no structured data, no social-card
generation, no subscriber or consent model, no email adapter, no analytics, no Web Vitals
collection, and no publishing-job or health visibility. The only distribution-adjacent files in
`packages/web` are prototype leftovers (`src/types/analytics.ts`, `src/types/donor.ts`) that carry
no product authority.

The risk this phase must eliminate is coupling. If discovery, feeds, cards, email, or analytics are
implemented as inline side effects of publishing, then a provider outage, a rate limit, or a
malformed template can block or corrupt a publication that has already been committed — and the
owner, who is nontechnical, would have to interpret an infrastructure failure to understand why
their article did not go live. Phase 5 therefore delivers distribution as portable, rebuildable,
asynchronous boundaries around canonical publication, not as part of it.

## W6H

- **Who:** the nontechnical owner (publishes and must never operate providers), the reader (finds
  and receives stories), the future contributor (inherits the same distribution contracts), and the
  maintainer/operator (rebuilds derivatives, diagnoses failures, proves privacy behavior).
- **What:** app-owned foundations for search and related stories, RSS, sitemap, canonical URLs and
  redirects, structured data, social cards, newsletter consent and delivery, privacy-conscious
  analytics and Web Vitals, and server observability with publishing-job visibility.
- **Why:** to satisfy canonical PRD sections 6.2, 6.3, 6.4, 8, and the Phase 5 gate — service
  outages must not corrupt or block canonical publication, and data export plus privacy controls
  must pass — while keeping every derived artifact rebuildable and every provider replaceable.
- **When:** now, after the content and persistence foundation (Task 42) and in parallel with owner
  publishing (Task 43) and the public magazine (Task 44); before production hardening (Task 46).
  Reader presentation of these foundations lands with Task 44; Phase 5 owns the services and their
  machine-readable routes.
- **Where:** app-local modules under `packages/web/src/server/**` (ports, services, adapters) plus
  route handlers under `packages/web/src/app/**` for feeds, sitemap, robots, search, subscription,
  vitals ingestion, and health. SQL migrations extend `packages/web/migrations/`.
- **Which:** PostgreSQL-backed full-text and fuzzy search (no external engine unless measured scale
  proves otherwise), the existing outbox for all external side effects, S3-compatible originals for
  media referenced by cards, and adapter interfaces for email, analytics, and observability with
  concrete provider selection deferred to ADRs.
- **How:** each concern ships as an independently reversible slice — port, in-memory
  implementation, tests, PostgreSQL/HTTP adapter, route — gated by frozen install, typecheck, lint,
  unit/integration tests, build, Playwright smoke, accessibility checks, and a reviewed PR with
  explicit human merge approval.

## User Stories

**Owner**

- **US-01** As the owner, I want a published article to appear in site search, the RSS feed, and the
  sitemap without me doing anything, so that distribution is a consequence of publishing.
- **US-02** As the owner, I want publishing to succeed and say so plainly even when email, analytics,
  or card generation is failing, so that infrastructure problems never look like my mistake.
- **US-03** As the owner, I want a plain-language view of publishing jobs and their outcomes
  (queued, sent, failed, retrying), so that I can tell whether the newsletter for a story went out.
- **US-04** As the owner, I want a changed slug to keep old links working, so that I can fix a
  headline without breaking anything a reader already shared.
- **US-05** As the owner, I want unpublishing a story to remove it from search, feeds, sitemap, and
  social previews promptly, so that "not public" means not discoverable.
- **US-06** As the owner, I want to see how many people subscribed and to export or delete a
  subscriber on request, so that I can answer a privacy request without a developer.
- **US-07** As the owner, I want a story's social preview to look correct before I publish, so that
  I am not surprised by what appears when the link is shared.

**Reader**

- **US-08** As a reader, I want to search published stories by words in the title, dek, and body and
  get useful results despite a typo, so that I can find a story I half-remember.
- **US-09** As a reader, I want related stories at the end of an article chosen from visible
  editorial signals, so that the next thing I read is genuinely related.
- **US-10** As a reader, I want to subscribe to the newsletter with a clear consent statement and an
  accessible form, and to unsubscribe in one step, so that my inbox stays under my control.
- **US-11** As a reader, I want to follow the magazine by RSS, so that I do not need an account or
  an email address.
- **US-12** As a reader using a screen reader or keyboard only, I want search, subscription, and
  their result and error states to be announced and operable, so that discovery is not sighted-only.

**Maintainer**

- **US-13** As a maintainer, I want every derived artifact (search index, feed, sitemap, card,
  related-story set) rebuildable from canonical data with one documented command, so that a
  corrupted derivative is never a data-loss event.
- **US-14** As a maintainer, I want structured logs, trace correlation, and health signals for
  database, search, email, and jobs — with drafts, tokens, and email addresses redacted — so that I
  can diagnose failures without exfiltrating content or personal data.
- **US-15** As a maintainer, I want to replace the email or analytics provider by writing one
  adapter, so that no vendor holds the only copy of subscriber or consent data.

## Technical Stories

- **TS-01 Search service:** extend the existing `SearchProjection` port with a query side backed by
  PostgreSQL full-text search plus trigram fuzziness; deterministic text extraction already exists
  in `content/document.ts` and must remain the single source of indexed text.
- **TS-02 Index lifecycle:** drive index upsert and removal exclusively from committed publication
  transitions and the `search.upsert` outbox event; expose an idempotent full-reindex path.
- **TS-03 Related stories:** compute candidates from taxonomy overlap, section, author, and recency
  with documented, testable weights; exclude the current article and anything not currently public.
- **TS-04 Feed and sitemap generation:** serve RSS (and Atom if cheap) and an XML sitemap from
  published revisions only, with stable ordering, pagination above a documented item threshold, and
  correct cache/revalidation headers.
- **TS-05 Canonical URL and redirect resolution:** resolve `SlugRedirect` history to permanent
  redirects, emit one canonical URL per resource, and keep feeds, sitemap, structured data, and
  cards on the canonical form.
- **TS-06 Structured data:** emit schema.org `Article`, `Person`, `BreadcrumbList`, and publication
  entities from canonical fields, generated server-side, never from stored HTML.
- **TS-07 Social cards:** deterministic image generation keyed by article id and revision, cached
  and rebuildable, falling back to a static default on failure; never blocking a publish.
- **TS-08 Robots and index hygiene:** exclude drafts, previews, owner routes, and API routes from
  indexing at both robots and per-response levels.
- **TS-09 Subscriber model:** app-owned subscriber, consent, and subscription-history tables with
  confirmed opt-in, tokenized confirm/unsubscribe links, and no provider identifier as primary key.
- **TS-10 Email adapter:** an `EmailSender` port plus one provider adapter, invoked only from outbox
  processing with retry, backoff, dead-lettering, and idempotency keys.
- **TS-11 Analytics adapter:** an `AnalyticsSink` port with a cookieless, identifier-free default;
  no collection on preview or owner routes.
- **TS-12 Web Vitals:** client beacon for LCP, INP, and CLS with sampling, aggregated to p75, with
  no URL query secrets or personal identifiers retained.
- **TS-13 Observability:** structured logging with request/trace correlation, redaction of draft
  bodies, tokens, email addresses, and signed media URLs; health checks for database, search, email
  adapter, and job queue.
- **TS-14 Publishing-job visibility:** a queryable job/outbox status projection with owner-facing
  plain language and maintainer-facing detail.
- **TS-15 Export and privacy operations:** extend the versioned export in `content/portability.ts`
  with subscribers, consent history, and redirects; add subscriber export and erasure that preserve
  proof-of-unsubscribe without retaining unnecessary personal data.
- **TS-16 Rebuild command:** one documented script that rebuilds search index, feeds, sitemap, and
  cards from canonical storage into an empty derived state.

## Behavior Requirements

- **BR-01** Given a draft, scheduled, or soft-deleted article, when search, feeds, sitemap,
  structured data, or card routes are requested, then it is absent from all of them.
- **BR-02** Given a publication transition commits, when any distribution adapter is unavailable,
  then the publication remains committed, the article is publicly readable, and the failed side
  effect is retried from the outbox without a second publication record.
- **BR-03** Given an outbox event is retried, when the same event is delivered more than once, then
  no duplicate email, feed entry, index row, or analytics event is produced (idempotency key
  enforced at the adapter boundary).
- **BR-04** Given an article slug changes, when a reader requests the previous path, then the app
  responds with a permanent redirect to the current canonical URL, and only the canonical URL
  appears in feeds, sitemap, and structured data.
- **BR-05** Given an article is unpublished, when the next request or rebuild occurs, then it is
  removed from the search index, feed, and sitemap, and its URL no longer renders public content.
- **BR-06** Given a reader searches, when the query contains a typo or partial word, then ranked
  results are returned from published content only, with a documented empty state; no draft text,
  autosave, or preview content is ever reachable through search.
- **BR-07** Given an article page, when related stories are computed, then the set is deterministic
  for a given corpus state, excludes the current article and non-public articles, and degrades to
  recency within the same section when no signal matches.
- **BR-08** Given a visitor submits the subscription form, when the address is accepted, then a
  pending subscriber and a consent record (timestamp, source, consent text version) are stored
  app-side, and a confirmation request is queued through the outbox.
- **BR-09** Given a subscriber follows an unsubscribe link, when the token is valid, then the
  subscription is deactivated in one step without login, and the unsubscribe event is retained as
  consent history.
- **BR-10** Given the email provider is down or rate-limited, when confirmation or issue delivery is
  attempted, then delivery retries with backoff, becomes visible as a failed job after the
  documented attempt budget, and never mutates canonical article state.
- **BR-11** Given analytics or Web Vitals collection is enabled, when any event is recorded, then it
  contains no cross-site advertising identifier, no article draft text, no email address, and no
  secret query parameter; preview and owner routes emit nothing.
- **BR-12** Given a server error, publishing-job failure, or slow request, when it is logged, then
  the log carries a correlation id and redacts draft bodies, tokens, addresses, and signed URLs.
- **BR-13** Given the derived stores are emptied, when the rebuild command runs against canonical
  storage, then search, feeds, sitemap, and cards are reconstructed to an equivalent state with no
  canonical write.
- **BR-14** Given an owner data request, when subscriber export or erasure runs, then the export is
  versioned and re-importable, and erasure removes personal data while preserving that consent was
  given and later withdrawn.
- **BR-15** Given the sitemap or feed exceeds the documented item threshold, when it is served, then
  it paginates according to the published contract rather than emitting an unbounded document.

## Example Mapping

**Rule: distribution never blocks publication**

- Example: Email provider returns 503 during publish. Article is public within the same request;
  newsletter job shows "waiting to retry"; no error surfaces in the owner publish confirmation.
- Example: Card generation throws on a malformed cover image. Publish succeeds; the default card is
  served; a maintainer-visible warning is recorded.
- Question: what attempt budget and retry window before a job is marked failed to the owner?

**Rule: only public content is discoverable**

- Example: An article moves draft → published → unpublished. Search returns it only in the middle
  state; the feed and sitemap match.
- Example: A preview link is crawled. It is excluded by robots and per-response directives and
  produces no analytics event.
- Question: does an unpublished URL return 404 or 410, and does that differ for previously indexed
  URLs?

**Rule: derived data is rebuildable, canonical data is owned**

- Example: The search table is dropped. The rebuild command restores it from stored revisions with
  identical results; no canonical row is written.
- Example: The provider account for email is closed. Subscribers, consent, and history are exported
  from the app database and re-imported against a new adapter.
- Question: is the search index rebuild expected to run online, or is a brief degraded-search window
  acceptable?

**Rule: consent is app-owned and provable**

- Example: A subscriber confirms, then unsubscribes a year later. Both events remain in history with
  the consent text version shown at signup.
- Example: A subscriber requests erasure. Personal fields are removed; the anonymized consent trail
  survives.
- Question: is confirmed (double) opt-in required for the owner's jurisdiction, or is single opt-in
  with recorded evidence acceptable?

**Rule: discovery is accessible and fast**

- Example: A keyboard-only reader tabs to the search field, submits, and hears the result count
  announced; no result region traps focus.
- Example: A search response on a warm cache stays within the documented server latency budget on
  the reference dataset.
- Question: what corpus size is the reference dataset for the latency budget?

## Acceptance Criteria

- **AC-01** Search, related stories, feeds, sitemap, canonical/redirect resolution, structured data,
  social cards, newsletter consent plus email adapter, analytics, Web Vitals, observability, and
  publishing-job visibility all exist behind documented ports with at least one adapter each, and no
  provider type appears in domain code.
- **AC-02** An automated test proves BR-02 and BR-03: with every external adapter forced to fail,
  publication still commits, the article is publicly readable, and retried events produce no
  duplicates. This is the Phase 5 gate on outage isolation.
- **AC-03** An automated test proves BR-01, BR-05, and BR-06: no draft, scheduled, preview, or
  soft-deleted content is reachable through any distribution surface, before or after unpublish.
- **AC-04** Feed and sitemap output validates against their specifications, uses canonical URLs, is
  stable across repeated generation for unchanged input, and paginates above the documented
  threshold.
- **AC-05** Emitted structured data validates for `Article`, `Person`, and `BreadcrumbList` with
  required fields populated from canonical storage only.
- **AC-06** Social-card generation is deterministic for a given article revision, cached,
  rebuildable, and falls back without failing a request.
- **AC-07** Redirect history from `SlugRedirect` resolves to permanent redirects, and a test covers
  a chained slug change without a redirect loop.
- **AC-08** Subscriber, consent, and subscription-history schemas are app-owned with reviewed SQL
  migrations plus a rollback artifact, matching the Task 42 migration conventions.
- **AC-09** The versioned export includes subscribers, consent history, and redirects, and a
  re-import into an empty store reproduces them; subscriber erasure passes BR-14. This is the Phase 5
  gate on export and privacy controls.
- **AC-10** Analytics and Web Vitals collection passes a redaction test asserting no identifiers,
  addresses, draft text, or secrets in payloads, and asserting zero collection on preview and owner
  routes.
- **AC-11** Health endpoints report database, search, email adapter, and job-queue status, and
  structured logs carry correlation ids with redaction verified by test.
- **AC-12** A publishing-job view lists queued, running, succeeded, failed, and retrying jobs in
  owner-readable language with a maintainer detail view.
- **AC-13** The documented rebuild command reconstructs all derived artifacts from canonical storage
  into an empty derived state, verified in CI or by a repeatable scripted run.
- **AC-14** Reader-facing discovery surfaces introduced in this phase pass automated axe checks plus
  documented keyboard and screen-reader verification (WCAG 2.2 AA), including search results, empty
  and error states, and the subscription form.
- **AC-15** Reader routes touched by this phase ship no editor code, respect the page-type budgets
  recorded with the phase, and record p75 LCP/INP/CLS instrumentation even though field validation
  belongs to Phase 6.
- **AC-16** Delivery follows the canonical gate list: task-scoped branch from clean `main`, frozen
  install, typecheck, lint, unit and integration tests, package and production build, Playwright
  smoke where runnable, responsive and accessibility verification for UI, clean working tree, and a
  reviewed PR merged only with explicit human approval.
- **AC-17** Each concern lands as an independently reversible slice with its own rollback note; no
  slice requires abandoning canonical data to revert.
- **AC-18** `.taskmaster/docs/prd.txt` is unchanged (sha256 `b946fff…ef49a`) and mode `0444` at the
  end of the phase, and `docs/README.md` is updated only if the owner promotes `PRD.md`.

## Out Of Scope

- Complete reader page design, layouts, and art direction (Task 44 / Phase 4) — this phase provides
  services and machine-readable routes, not the finished magazine UI.
- Owner editor UI, autosave browser integration, and owner authentication (Tasks 43 and 59).
- Managed deployment topology, environment separation, provider provisioning, cost envelope,
  RPO/RTO measurement, restore drills, and disaster recovery (Task 46 / Phase 6).
- Replacing PostgreSQL search with an external search engine; permitted only if measured scale
  proves it necessary, which is not established.
- Paid subscriptions, paywalls, membership, comments, moderation, and multi-author roles or
  permissions.
- Cross-site advertising, retargeting identifiers, and third-party marketing tags.
- Newsletter template design beyond the minimum needed to prove delivery through the adapter.
- Editing, rewriting, or superseding the frozen canonical PRD, and retirement of Aegis legacy
  scaffolding.
- Removing the Task 42 fixture bridge from reader routes (owned by Task 44).

## Open Questions

Recorded rather than asked: this workflow runs in autonomous interaction mode. Each item states the
assumption used to keep planning unblocked, the impact if the assumption is wrong, and who decides.

- **OQ-01 PRD authority.** `docs/README.md` names `.taskmaster/docs/prd.txt` as canonical, and this
  workflow writes `PRD.md` at the repository root. *Assumption:* `PRD.md` is a derived,
  workflow-scoped artifact; the frozen file stays canonical. *Impact if wrong:* the truth map and
  this header need one editorial correction, not a content rewrite. *Decides:* owner.
- **OQ-02 Email provider.** *Assumption:* one provider adapter is selected by a Phase 5 ADR using
  primary-source research; requirements only bind the port, outbox usage, and idempotency.
  *Impact if wrong:* adapter implementation cost shifts, not the contract. *Decides:* ADR.
- **OQ-03 Analytics provider and consent surface.** *Assumption:* cookieless, identifier-free
  collection, so no consent banner is required. *Impact if wrong:* a consent gate and its
  accessibility work enter scope. *Decides:* ADR plus owner privacy stance.
- **OQ-04 Opt-in model.** *Assumption:* confirmed (double) opt-in with stored consent evidence.
  *Impact if wrong:* the confirmation flow and one job type could be dropped. *Decides:* owner.
- **OQ-05 Social-card runtime.** *Assumption:* on-demand deterministic generation with caching and a
  static fallback, rather than build-time generation. *Impact if wrong:* generation moves into the
  build and the rebuild command changes. *Decides:* ADR.
- **OQ-06 Search configuration.** *Assumption:* PostgreSQL full-text search with an English
  configuration plus `pg_trgm` fuzziness, available on the managed target. *Impact if wrong:*
  fuzziness needs an alternative strategy. *Decides:* verification against the managed provider.
- **OQ-07 Related-story weights.** *Assumption:* taxonomy overlap ranks above section, then author,
  then recency, with weights tunable in configuration. *Impact if wrong:* weight table changes; the
  determinism and exclusion rules do not. *Decides:* owner editorial preference.
- **OQ-08 Reader surface boundary.** *Assumption:* Phase 5 ships machine-readable routes and minimal
  unstyled UI for search and subscription; presentation lands with Task 44. *Impact if wrong:* UI
  scope and visual review move into this phase. *Decides:* implementation-plan stage.
- **OQ-09 Unpublished URL status.** *Assumption:* previously published URLs return 410 and other
  unknown URLs return 404. *Impact if wrong:* one route behavior and its test change. *Decides:*
  implementation-plan stage.
- **OQ-10 Latency and budget reference dataset.** *Assumption:* budgets are set against a seeded
  corpus of roughly 500 articles. *Impact if wrong:* the numeric budget in AC-15 is restated.
  *Decides:* implementation-plan stage.

## Upstream Coverage Matrix

| ID | Status | Where addressed |
| --- | --- | --- |
| PRD-5.6-SLUG-REDIRECTS | covered | TS-05, BR-04, AC-07 |
| PRD-6.2-DISCOVERY | covered | US-08, US-09, US-11, TS-01, TS-03, TS-04, BR-06, BR-07, AC-01, AC-04 |
| PRD-6.3-SEO-SOCIAL | covered | TS-06, TS-07, TS-08, BR-04, AC-05, AC-06 |
| PRD-6.4-NEWSLETTER | covered | US-10, TS-09, TS-10, BR-08, BR-09, BR-10, AC-08 |
| PRD-7.1-DERIVATIVES | covered | TS-16, BR-13, AC-13 |
| PRD-7.3-EXPORT | covered | TS-15, BR-14, AC-09 |
| PRD-8-SEARCH-OBSERVABILITY | covered | TS-01, TS-11, TS-12, TS-13, TS-14, BR-11, BR-12, AC-10, AC-11, AC-12 |
| PRD-9.1-ACCESSIBILITY | covered | US-12, AC-14 |
| PRD-9.2-PERFORMANCE | covered | TS-12, AC-15 |
| PRD-10-SECURITY-PRIVACY | covered | TS-13, TS-15, BR-11, BR-12, BR-14, AC-10 |
| PRD-11-ADAPTERS | deferred | Out Of Scope, deferred to Task 46 |
| PRD-13-DELIVERY-GATES | covered | AC-16, AC-17 |
| P5-SEARCH-RELATED | covered | TS-01, TS-02, TS-03, AC-01 |
| P5-FEEDS-SEO | covered | TS-04, TS-05, TS-06, TS-07, TS-08, AC-04, AC-05, AC-06 |
| P5-NEWSLETTER | covered | TS-09, TS-10, AC-08 |
| P5-ANALYTICS-VITALS | covered | TS-11, TS-12, AC-10, AC-15 |
| P5-OBSERVABILITY | covered | TS-13, TS-14, AC-11, AC-12 |
| P5-GATE | covered | AC-02, AC-09 |
| NFR-PRIVACY | covered | BR-11, BR-14, AC-10, OQ-03, OQ-04 |
| NFR-PORTABILITY | covered | TS-10, TS-11, TS-15, US-15, AC-01, AC-09 |
| NFR-OPERABILITY | covered | TS-13, TS-14, AC-11, AC-12 |
| NFR-RELIABILITY | covered | BR-02, BR-03, BR-13, AC-02, AC-13 |
| T42-SEARCH-PROJECTION-PORT | covered | TS-01, TS-02 |
| T42-OUTBOX-EVENTS | covered | TS-02, TS-10, BR-02, BR-03 |
| T42-SLUG-REDIRECT-HISTORY | covered | TS-05, BR-04 |
| T42-DEFERRED-TO-45 | covered | Problem Statement, Technical Stories |
| DOC-TRUTH-MAP | covered | Authority Note, AC-18, OQ-01 |
