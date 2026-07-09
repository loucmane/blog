# Target Deployment Platform

**Status:** Provisional; blocked on deployment spike

**Updated:** 2026-07-09

## Initial Managed Topology

- **Application:** Next.js on Vercel Pro.
- **Database:** Neon PostgreSQL 18 candidate.
- **Media originals:** Cloudflare R2 through S3-compatible APIs.
- **Image delivery:** Next image handling plus optional Cloudflare Images adapter; Sharp fallback.
- **Email:** Resend adapter.
- **Analytics:** Umami, self-hosted or managed after privacy/cost review.
- **Observability:** OpenTelemetry server instrumentation with a configurable exporter; optional Sentry errors.
- **Scheduling:** database-authoritative publishing records plus a proven worker/cron trigger.

This topology prioritizes low operational burden for one owner. It is not accepted until the spike proves a portable Node deployment and independent data restore.

## Environment Model

| Environment | Purpose | Data policy |
| --- | --- | --- |
| Local | Development and deterministic tests | Seeded synthetic data; local PostgreSQL/S3-compatible service |
| Preview | Pull-request review and migration rehearsal | Isolated database/schema and media prefix; no production subscriber data |
| Production | Owner publishing and public magazine | Canonical data, restricted access, audited changes |

Secrets are environment-specific. Preview must not receive production write credentials.

## Deployment Sequence

1. Verify clean commit and frozen install.
2. Run typecheck, lint, tests, package builds, production build, browser smoke, and relevant accessibility checks.
3. Create or verify backup before destructive migration.
4. Apply reviewed database migrations with an explicit migration identity.
5. Deploy application with immutable source revision metadata.
6. Run health and smoke checks against the exact deployed revision.
7. Verify owner sign-in, draft access, public read path, media, scheduling worker, and telemetry redaction as applicable.
8. Promote traffic only after gates pass.
9. Record deployment and rollback evidence.

## Portability Requirements

- Application builds and starts in a standard Node environment outside Vercel.
- Domain code does not import Vercel, Neon, R2, Resend, Umami, or exporter SDKs directly.
- PostgreSQL migrations and logical dumps run with standard tools.
- Media originals copy through S3-compatible clients and retain checksums.
- Provider configuration is documented and reproducible.
- DNS, redirects, scheduled jobs, and cache behavior have provider-exit runbooks.

## Rollback

- Application rollback deploys the last known-good immutable revision.
- Backward-incompatible database changes use expand/migrate/contract sequencing; application rollback remains possible during the compatibility window.
- A failed provider integration is disabled or switched through its adapter without corrupting canonical data.
- Data rollback uses verified restore or forward repair, never an unexamined destructive reset.

## Cost Governance

Before production, document monthly low/normal/high estimates for Vercel, Neon, R2/Images, Resend, analytics, observability, backup storage, and domains. Configure budget alerts where available. Provider pricing references are maintained in the [stack matrix](../research/2026-07-stack-decision-matrix.md).

## Acceptance Evidence

- Vercel preview and production-like deployment;
- Node/container fallback deployment;
- database migration and restore log;
- media copy and checksum comparison;
- worker/scheduler timing and failure evidence;
- environment isolation review;
- cost envelope;
- rollback rehearsal.
