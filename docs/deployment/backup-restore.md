# Backup, Restore, and Export Contract

**Status:** Canonical requirements; implementation provisional

**Updated:** 2026-07-09

## Task 42 Foundation

Task 42 implements provider-independent logical backup command plans, strict portable
content export/import, media manifests with application-owned SHA-256, and deterministic restore
comparison. Its isolated Docker drill proves PostgreSQL 18.4 custom-format dump/restore and
S3-compatible original copying without production credentials or data. Hosted-provider PITR,
independent encrypted retention, recurring drills, and production RPO/RTO evidence remain Task 46.

## Objectives

Protect canonical content, revisions, auth records, taxonomies, redirects, subscribers/consent, audit history, scheduled work, and media originals. A backup is valid only when a restore has demonstrated usability.

Provisional launch targets:

- database and media RPO: 24 hours maximum;
- public read and owner publishing RTO: four hours;
- tighter provider point-in-time recovery is welcome but does not replace independent backups.

## Backup Layers

### Managed Recovery

Use the database provider's point-in-time recovery and object-storage durability/versioning where supported. Record plan limits and retention.

### Independent Database Backup

- Produce encrypted logical PostgreSQL exports with schema, data, migration identity, timestamp, and checksum.
- Store outside the database provider account or failure domain.
- Retain according to documented daily/weekly/monthly policy.
- Restrict and audit access; never store dumps in Git.

### Independent Media Backup

- Inventory every original object with app ID, object key, byte size, MIME type, checksum, and rights metadata reference.
- Copy originals to an independent S3-compatible target or offline archive.
- Compare checksums and report missing/orphaned objects.
- Treat renditions as rebuildable and exclude them unless recovery-time evidence justifies inclusion.

### Portable Product Export

Owner-requested export is distinct from operational backup. It packages versioned JSON entities, document schemas, relationships, redirects, media manifest, and privacy-controlled subscriber data. It must be usable without the original hosting provider.

## Restore Drill

At a defined cadence and before destructive migrations:

1. create an isolated PostgreSQL 18 database and object store;
2. restore the logical database backup;
3. copy or attach verified media originals;
4. apply only documented forward migrations;
5. compare table/entity counts, key invariants, and media checksums;
6. render representative public articles and search them;
7. authenticate a designated test owner without exposing production credentials;
8. verify redirects, schedule records, export generation, and audit readability;
9. measure recovered data age and elapsed restore time;
10. destroy or secure the isolated environment according to privacy policy;
11. record pass/fail evidence and corrective tasks.

## Failure Handling

- A failed backup or stale backup raises an actionable alert.
- A failed restore is a production-readiness blocker.
- Backup jobs are idempotent and do not lock ordinary publishing longer than the accepted window.
- Secrets, password reset tokens, signed URLs, and encryption keys are not embedded in portable exports.
- Encryption-key recovery is documented separately and tested without publishing secrets.

## Provider Exit

A provider exit uses the same restore contract:

- export standard PostgreSQL data;
- copy S3-compatible originals and verify checksums;
- recreate app configuration and adapters;
- deploy the same immutable application revision or a documented migration revision;
- validate owner and reader smoke paths before DNS cutover;
- retain the prior provider read-only until verification and approved decommissioning.

## Evidence Retention

Record backup identity, timestamps, checksums, tool versions, restore environment, verification results, RPO/RTO measurements, failures, and follow-up tasks. Do not store backup payloads or sensitive logs in the repository.
