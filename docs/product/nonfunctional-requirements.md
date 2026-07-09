# Nonfunctional Requirements

**Status:** Canonical quality contract

**Updated:** 2026-07-09

## Accessibility

- Target WCAG 2.2 Level AA across reader and owner experiences.
- Verify keyboard operation, focus order and visibility, semantic structure, labels, errors, contrast, zoom to 200%, text reflow, reduced motion, and screen-reader announcements.
- Require meaningful alt text workflow while allowing intentionally decorative media to be marked as such.
- Test the block editor with keyboard-only editing, common assistive technologies, and recovery/error flows.
- Combine automated axe checks with documented manual reviews; automated success alone is insufficient.

## Performance

Measure field performance at the 75th percentile and target:

- LCP <= 2.5 seconds;
- INP <= 200 milliseconds;
- CLS <= 0.1.

Reader routes must avoid editor code, unnecessary client components, blocking third-party scripts, and unbounded image payloads. Establish page-type budgets for JavaScript, CSS, fonts, media, requests, and server latency during implementation.

## Reliability and Data Integrity

- Autosave operations must tolerate retries and concurrent edits without silent overwrite.
- Publishing and scheduling must be idempotent.
- Database migrations must be versioned, reviewed, observable, and recoverable.
- Canonical data writes and publication state transitions use transactional boundaries where consistency requires them.
- Derived search, feeds, cards, and renditions must be rebuildable.
- Backup restoration and export/re-import must be exercised on a schedule before launch.

## Recovery Objectives

Provisional launch targets, to be confirmed by deployment ADR:

- canonical database recovery point objective: 24 hours maximum, with managed point-in-time recovery preferred;
- media-original recovery point objective: 24 hours maximum;
- recovery time objective: four hours for owner publishing and public read service;
- owner-visible autosave loss window: seconds, not minutes, under normal connectivity.

Provider retention is not the independent backup. Owner-controlled exports and media/database snapshots are required.

## Security

- Enforce authentication and authorization on the server for every protected read and mutation.
- Prefer phishing-resistant owner authentication and provide a tested recovery path.
- Protect sessions, cookies, state-changing requests, uploads, embeds, preview links, exports, and scheduled jobs.
- Validate structured content and render it through allow-listed server components rather than trusting stored HTML.
- Use restrictive security headers and content security policy without permanent broad unsafe exceptions.
- Scan dependencies and runtime images; apply supported security updates in controlled batches.
- Keep secrets out of source, client bundles, exports, analytics, logs, and error payloads.
- Maintain audit events for authentication, permissions, publishing, export, import, media deletion, and recovery operations.

## Privacy

- Minimize personal data and document purpose, retention, and deletion behavior.
- Record newsletter consent and unsubscribe history.
- Provide owner-operated data export and deletion workflows where applicable.
- Default analytics to privacy-conscious collection and avoid cross-site advertising identifiers.
- Redact draft content, tokens, email addresses, and media URLs with credentials from telemetry.

## Portability

- Use app-owned IDs and schemas.
- Isolate database, object storage, email, analytics, observability, scheduling, and deployment integrations behind documented boundaries.
- Preserve original media and checksums.
- Maintain a versioned lossless export and tested re-import path.
- Document a supported Node deployment outside the primary host.
- Avoid provider-only features unless the fallback and migration cost are explicit and accepted.

## Operability

- Separate local, preview, and production configuration.
- Provide structured logs, trace correlation, health checks, publishing-job visibility, and actionable alerts.
- Define service-level indicators for public availability, owner publishing, scheduled-job delay, media processing, and backup freshness.
- Maintain runbooks for failed publish, failed schedule, database restore, media restore, provider outage, credential rotation, and owner account recovery.
- Do not require the owner to execute operational runbooks.

## Maintainability

- Use strict typed boundaries and runtime validation at external inputs.
- Keep package and app boundaries only when they reduce coupling or enable an actual deployment/reuse need.
- Prefer boring, supported primitives over duplicated abstractions.
- Temporary compatibility bridges require an owner, removal task, and deadline.
- Do not suppress broad classes of type, lint, test, or security failures to pass a migration.

## Verification Gates

Every relevant delivery batch must document:

1. frozen installation result;
2. typecheck and lint result;
3. unit and integration result;
4. package and production build result;
5. Playwright smoke result where runnable;
6. responsive visual inspection for UI changes;
7. automated and manual accessibility result;
8. performance assessment;
9. migration, rollback, and clean-status result.

Existing failures are recorded as baseline defects and cannot be relabeled as successful verification.
