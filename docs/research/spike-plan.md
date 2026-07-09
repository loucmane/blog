# Foundation Spike Plan

**Status:** Approved scope is required before execution

**Updated:** 2026-07-09

**Program:** Task 33

## Purpose

Validate the architecture assumptions most expensive to reverse. Spikes produce decision evidence, fixtures, measurements, and explicit pass/fail conclusions. They are not an excuse to smuggle unverified prototype code into production.

## Common Protocol

Each spike must:

1. start from synchronized `main` on its own Taskmaster task branch after the planning PR merges;
2. state the hypothesis, binding criteria, time box, allowed dependencies, and non-goals before implementation;
3. use representative committed fixtures that contain no secrets or personal data;
4. record exact runtime/package versions and commands;
5. distinguish product acceptance from developer convenience;
6. capture failures and limitations, not only the happy path;
7. keep production code only through a separately reviewed implementation task after the decision is accepted;
8. remove disposable spike code or place retained evidence under a clearly named research path;
9. update the relevant ADR to accepted, rejected, or superseded;
10. require explicit human approval before merging any production dependency or architecture change.

## Spike A: Editor Round-Trip, Rendering, and Export

### Hypothesis

Tiptap OSS can provide the required owner editing foundation while the application retains a stable, versioned, portable document model.

### Fixture

One representative article containing headings, paragraphs, ordered/unordered lists, quote, pull quote, callout, links, image, gallery, captions, credits, alt text, focal points, allow-listed embed with fallback, and reusable editorial block.

### Pass Criteria

- Load JSON, edit every block type, serialize, reload, and compare semantic equality without loss.
- Render the same document on the server without a browser editor instance.
- Reject unsupported attributes and scripts; sanitize embeds through structural allow-listing.
- Extract deterministic plain text for search, feeds, and accessibility fallbacks.
- Produce lossless versioned JSON export and re-import it to equivalent content.
- Produce readable convenience HTML/Markdown while documenting any lossy conversion.
- Preserve an unknown node in quarantine or migration error state rather than dropping it.
- Complete keyboard-only core editing and automated accessibility checks; document manual screen-reader findings.
- Keep the reader renderer free of editor runtime code.

### Fail Conditions

Any silent document loss, dependence on paid cloud history for required revisions, unsafe stored-HTML rendering, inaccessible core operation, or inability to own migrations rejects the candidate.

### Alternatives on Failure

Run the same fixture and criteria against Lexical, then BlockNote if licensing/export constraints are acceptable. Plate is evaluated only if its abstraction cost is justified by measured implementation savings.

## Spike B: Document Schema Migration

### Hypothesis

Application-owned document versions can evolve safely across custom-block changes.

### Scenarios

- rename and reshape a callout node;
- split image metadata from media identity;
- add required gallery layout metadata;
- encounter an unknown future node;
- interrupt and retry a batch migration.

### Pass Criteria

- Deterministic one-version-at-a-time migration registry.
- Dry run reports counts, affected revisions, and unknown nodes.
- Re-running produces no further mutation or corruption.
- Originals remain available for rollback or forward repair.
- Transaction boundaries prevent partially published schema versions.
- Export/import preserves schema metadata and migration provenance.
- Fixture rendering remains semantically and visually equivalent.

## Spike C: Autosave, Conflict, and Recovery

### Hypothesis

A one-owner workflow can provide robust recovery without introducing premature real-time collaboration.

### Scenarios

- normal debounced save;
- offline typing and reconnect;
- expired session during edit;
- two tabs editing the same draft;
- browser crash before server acknowledgement;
- publish while a newer local recovery buffer exists;
- server error and retry.

### Pass Criteria

- Visible save state reflects acknowledged server state.
- Optimistic concurrency prevents silent overwrite.
- Conflicts preserve both versions and offer understandable resolution.
- Client recovery data is bounded, versioned, and removed after safe acknowledgement.
- Immutable revision creation is separate from autosave compaction.
- No retry creates duplicate revisions or publication transitions.
- Owner-facing errors state whether work is safe and what to do next.

## Spike D: Scheduled Publishing and Side Effects

### Hypothesis

Database-authoritative scheduling plus an idempotent worker can publish reliably on the selected managed platform.

### Scenarios

- publish at a UTC instant derived from owner time zone;
- daylight-saving transition;
- duplicate worker claim;
- worker crash before and after state transition;
- delayed wake-up/compute suspension;
- cache invalidation, search update, feed update, social card, and email failure;
- reschedule and cancel immediately before due time.

### Pass Criteria

- One public transition for one intended event.
- Publication transaction does not duplicate external effects.
- Retries and leases recover from interruption.
- Email/analytics/card failures do not unpublish a valid article.
- Owner sees scheduled, processing, succeeded, and actionable partial-failure states.
- Maximum observed schedule delay is measured against an accepted service target.
- Job records remain understandable and recoverable if pg-boss is replaced.

## Spike E: Database, Media, Deployment, and Restore

### Hypothesis

Next.js on Vercel with Neon PostgreSQL and R2 can minimize operations while preserving a tested Node/PostgreSQL/S3 exit path.

### Pass Criteria

- Apply migrations to empty and populated PostgreSQL 18 databases.
- Exercise pooled application connections and dedicated migration/worker connections.
- Upload original media, verify checksum, generate rendition, and restore to a second S3-compatible endpoint.
- Deploy preview and production configurations with isolated secrets/data.
- Run the application through a documented Node server or container outside Vercel.
- Create logical database and media-manifest backups without provider consoles.
- Restore into an isolated environment, compare counts/checksums, render fixture articles, and authenticate a test owner.
- Measure restore duration and recovered data age against provisional RPO/RTO.
- Record expected low/normal/high monthly costs and alert thresholds.

### Fail Conditions

Failure to restore outside the original provider, unrecoverable media originals, undocumented proprietary data dependencies, or owner-facing operations requiring routine hosting-console work rejects the deployment combination.

## Evidence Outputs

Each spike stores:

- decision summary and pass/fail table;
- package/runtime/provider versions;
- committed fixtures and checksums;
- commands and environment assumptions;
- automated test output and manual verification notes;
- accessibility/performance/security findings;
- cost and lock-in observations;
- retained-code inventory or deletion confirmation;
- ADR update and next Taskmaster action;
- Aegis ledger event plus readable S:W:H:E projection.
