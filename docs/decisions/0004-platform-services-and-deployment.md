# ADR 0004: Use Portable Managed Services Behind App-Owned Adapters

**Status:** Accepted service-boundary architecture; live provider adoption remains conditional

**Date:** 2026-07-09

**Task:** 33; validated locally by Task 37 on 2026-07-13

## Context

One nontechnical owner needs low operational burden, while content, media, authentication, backups, and exports must remain portable. Building every infrastructure service is unnecessary; allowing vendors to own canonical product state is unacceptable.

## Decision

Provisionally use:

- Better Auth with database-backed sessions and passkeys for owner authentication;
- Cloudflare R2 through the S3 API for media originals;
- Next image delivery plus optional Cloudflare Images, with Sharp fallback;
- PostgreSQL full-text search first;
- database-authoritative scheduling with a pg-boss worker candidate;
- Resend for delivery while subscribers and consent remain app-owned;
- Umami for privacy-conscious analytics;
- OpenTelemetry for server traces/metrics with pluggable exporter and optional Sentry error reporting;
- Vercel Pro for the initial application deployment;
- Neon PostgreSQL as the initial managed database candidate;
- managed recovery plus independent encrypted logical database and media backups.

Every service is accessed through a product-level port. Provider IDs and payloads stay in adapter records. Publication success cannot depend synchronously on email, analytics, search, card generation, or observability.

## Rationale

- Better Auth supports database-owned authentication. [Database integration](https://better-auth.com/docs/concepts/database)
- R2 exposes S3-compatible operations and inexpensive storage with free direct egress. [R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- OpenTelemetry server traces/metrics are stable and vendor-neutral; browser instrumentation remains experimental. [JavaScript status](https://opentelemetry.io/docs/languages/js/)
- Next.js documents self-hosting, so Vercel can be an operational default without becoming the only run target. [Self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- Neon uses standard PostgreSQL and documents backup/restore windows. [Backups](https://neon.com/docs/manage/backups)

## Task 37 Validation

The service-boundary architecture passed local, provider-independent proof:

- PostgreSQL 18.4 migration, pg-boss schema 37, two-worker claim competition,
  transactional enqueue rollback, logical dump, and isolated restore;
- application-owned SHA-256 for an original and Sharp rendition, retained in object metadata
  and PostgreSQL, then copied and reverified on a second S3-compatible endpoint;
- a digest-pinned Next 16.2.10 production build serving static reader, dynamic private preview,
  and health routes through a generic Node server;
- database-authoritative publication and outbox models that keep email/search/card failures
  from reversing a valid public transition.

The exact evidence is in `docs/research/task-37-architecture-spike-results.md`.

No Neon, R2, Vercel, or production credential was used. Provider-specific pooling,
scale-to-zero, multipart/checksum, custom-domain cache, PITR/snapshot, preview isolation,
multi-instance cache, billing, full export, and hosted restore criteria remain Tasks 42/46
gates. These gaps keep provider adoption conditional without blocking portable domain and
adapter implementation.

## Consequences

- Provider pricing and limits require a documented monthly envelope and alerts.
- A managed provider snapshot is not the independent backup.
- The owner UI must communicate service failures without exposing provider terminology.
- Worker behavior under managed database connection limits and compute suspension must be proven.
- Browser telemetry uses Web Vitals and deliberate error reporting instead of broad experimental OTel instrumentation.
- Preview and production environments require separate credentials and data isolation.

## Alternatives

- Fully self-hosted infrastructure: rejected initially because it transfers operations to the maintainer/owner.
- Vercel-owned data/media only: rejected because it raises exit cost and couples canonical state to the app host.
- Hosted auth vendors: rejected initially for account/data lock-in and recurring per-user complexity.
- External search: deferred until PostgreSQL relevance or scale is measured insufficient.
- Host cron as source of truth: rejected; the database stores publication intent and idempotency state.

## Acceptance Gates

1. Owner auth enrollment, session expiry, authorization, recovery, and audit.
2. Media upload, checksum, metadata, export, restore to another S3 endpoint, and transformation fallback.
3. Duplicate/crashed scheduled jobs do not duplicate publication or side effects.
4. Managed PostgreSQL connection, migration, dump, restore, and provider-to-local recovery.
5. Vercel preview/production isolation and Node-container fallback deployment.
6. Email, analytics, and telemetry can be disabled without blocking publication.
7. Backup drill meets agreed RPO/RTO and verifies record/media checksums.
8. Cost envelope and provider-exit runbooks are reviewed.

## Rollback

Each provider adapter and deployment integration lands separately after its contract tests. Before production data exists, revert the adapter PR. After production data exists, use export/restore and DNS/config rollback procedures; never “rollback” by abandoning canonical data at a provider.
