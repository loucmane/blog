# Owner-Operated CMS-less Magazine Foundation

**Status:** Provisional architecture; acceptance requires documented spikes

**Updated:** 2026-07-09

## Decision Summary

Use a single full-stack React application for the public magazine and protected owner workspace. Store canonical editorial data, versioned documents, revisions, scheduling, subscribers, and audit history in app-owned PostgreSQL. Store original media in S3-compatible object storage. Render allow-listed structured content on the server. Place provider-specific services behind narrow adapters and maintain versioned export/import plus independent backups.

The initial target is Next.js rather than a separate Vite application. Vite remains part of evaluated alternatives and may be used only if a later accepted architecture gives it a distinct, non-overlapping role.

## Why This Is “No CMS”

The product does not outsource its editorial model or owner workflow to WordPress, Sanity, Contentful, or another traditional external CMS. The application owns:

- content and media identities;
- document schema and migrations;
- draft, autosave, revision, preview, schedule, publish, and unpublish behavior;
- taxonomy, SEO/social metadata, redirects, and audit history;
- export/import and recovery contracts.

Managed infrastructure is allowed when it stores data through portable protocols and replaceable adapters. “No CMS” does not mean the owner edits repository files.

## System Context

```text
Owner browser ───────┐
                    ├─> Full-stack magazine application ─> PostgreSQL
Reader browser ──────┘                 │                  └> job/schedule records
                                      ├─> S3-compatible media originals
                                      ├─> image delivery adapter
                                      ├─> email delivery adapter
                                      ├─> analytics adapter
                                      └─> observability exporter
```

## Application Boundaries

### Public Magazine

- server-rendered and cached reader routes;
- home, sections, articles, authors, taxonomies, search, feeds, sitemap, and social cards;
- structured content renderer with no editor bundle;
- SEO metadata, redirects, and structured data;
- newsletter capture and privacy controls.

### Owner Workspace

- protected dashboard and settings;
- block editor, metadata, media library, preview, revision history, and publishing controls;
- clear autosave, recovery, validation, scheduling, and failure states;
- export/import and operational status appropriate for the owner.

### Domain and Data Layer

- typed domain services for articles, revisions, media, taxonomy, publishing, search, subscribers, and audit;
- relational transactions for invariants;
- versioned document migration registry;
- runtime validation at browser, provider, job, and import boundaries.

### Async Work

- database-authoritative publication intent;
- idempotent scheduled publishing and retryable side effects;
- media processing, social cards, search updates, email, and exports run outside the publication transaction where possible;
- observable deduplication and failure states.

## Canonical and Derived Data

| Canonical | Derived and rebuildable |
| --- | --- |
| articles and workflow state | rendered HTML |
| immutable revisions | search vectors/indexes |
| structured document JSON | image renditions |
| taxonomies and redirects | feeds and sitemaps |
| media originals and metadata | social cards |
| subscribers and consent | analytics aggregates |
| audit and publishing records | caches |

## Content Rendering Safety

The editor library does not define trust. Stored documents pass schema validation and render through an application-owned map of supported nodes. Embeds use an allow-list, constrained attributes, semantic fallback, and restrictive content security policy. Unknown nodes remain recoverable and visibly fail validation rather than disappearing.

## Portability Boundaries

### Database

Use standard PostgreSQL features and migration files. Avoid provider-only data APIs in core domain code. Maintain logical export and tested restore independent of managed point-in-time recovery.

### Media

Use S3-compatible operations for originals. Persist stable app IDs, object keys, checksums, and rights metadata. Treat transformation URLs and CDN caches as disposable.

### Authentication

Store user/session/passkey records in the application database through a self-hosted authentication library. Do not make a hosted identity provider the only recovery path.

### Email, Analytics, and Observability

Expose domain-level ports. Provider payloads and IDs stay in adapter records. The core publication transaction does not depend synchronously on these services.

### Deployment

Optimize the initial managed deployment for a one-owner operation while preserving a documented Node-container path and tested data migration. Hosting convenience is not allowed to redefine canonical content.

## Current-to-Target Reconciliation

| Existing area | Classification | Direction |
| --- | --- | --- |
| Next.js App Router shell | Useful foundation | Upgrade and simplify after baseline |
| React components and themes | Useful foundation | App-local owned design system; preserve system/light/dark and accessibility mechanics |
| shared UI package | Superseded | Removed after proving one consumer and replacing its useful behavior app-locally |
| Express backend demo | Superseded | Removed; Task 42 adds accepted full-stack domain boundaries instead of preserving a placeholder |
| MDX/Git content plan | Obsolete requirement | Replace with database-backed structured content |
| animal/donation configuration | Stale terminology | Remove in scoped migration |
| current tests | Existing defect | Establish real unit/integration/browser coverage |
| CI/deployment | Missing capability | Add reproducible CI and managed/portable deploy paths |

## Alternatives Considered

### File-backed MDX with Custom Owner UI

- **Owner experience:** Can appear friendly, but every save must safely serialize files, handle concurrent edits, media, previews, builds, and deployment.
- **Complexity:** deceptively high because the app must become a Git/file transaction system.
- **Portability:** source files are portable, but rich block round-trip is lossy or constrained.
- **Deployment:** requires writable durable storage or repository automation, plus rebuild coordination.
- **Risk:** couples normal publishing to infrastructure semantics and makes autosave/scheduling/revisions awkward.
- **Decision:** reject as canonical storage; offer Markdown/HTML only as convenience exports.

### App-owned SQLite

- **Owner experience:** strong for a single instance.
- **Complexity:** low locally, but durable multi-region/serverless writes and backup coordination become deployment-specific.
- **Portability:** excellent as a file when quiesced and copied correctly.
- **Deployment:** best on a stateful host; awkward with the preferred managed serverless front end.
- **Risk:** architecture may prematurely bind deployment to one writable volume or hosted SQLite vendor.
- **Decision:** retain as a possible local/spike tool, not the production target.

### App-owned PostgreSQL

- **Owner experience:** transparent; supports reliable workflow and search.
- **Complexity:** moderate but standard, with transactions, JSONB, full-text search, scheduling tables, and mature backups.
- **Portability:** strong through standard SQL, dumps, and multiple providers.
- **Deployment:** works with managed or self-hosted Node deployments.
- **Risk:** requires disciplined migrations and independent backup testing.
- **Decision:** provisional selection.

### Repo-backed Content with Pull-request Automation

- **Owner experience:** UI can hide Git until conflicts, credentials, CI failures, or repository permissions surface.
- **Complexity:** high distributed workflow across app, GitHub, CI, previews, and deployment.
- **Portability:** repository history is portable, but workflow depends on GitHub behavior.
- **Deployment:** every publication becomes a code delivery event.
- **Risk:** violates the owner requirement during exactly the failure cases where clarity matters most.
- **Decision:** reject for normal publishing; Git remains the code delivery mechanism only.

## Framework Position

Next.js is the provisional full-stack target because the current repository already uses it and the product needs reader SSR/caching, protected editing, preview, on-demand invalidation, images, metadata, and one coherent deployment. React Router framework mode and Astro are credible alternatives; TanStack Start remains release-candidate software; plain Vite does not itself provide the full server product contract. See ADR 0001 and the stack matrix.

## Verification Required Before Acceptance

1. Editor JSON round-trip, custom-block rendering, sanitization, export, and re-import.
2. Document schema migration with unknown-node and rollback behavior.
3. Autosave conflict, interruption, recovery, and revision promotion.
4. Scheduled publishing idempotency and cache/search/feed side effects.
5. Database backup/restore and provider-to-local migration.
6. Media original upload, checksum, export, restore, and transformation fallback.
7. Managed deployment plus documented portable Node deployment.

Production implementation may begin only after the relevant spike acceptance criteria pass or the ADR records a deliberate, approved exception.
