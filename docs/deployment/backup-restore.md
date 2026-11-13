# Backup, Restore, and Export Contract

**Status:** Canonical requirements; implementation provisional

**Updated:** 2026-11-13

## Task 42 Foundation

Task 42 implements provider-independent logical backup command plans, strict portable
content export/import, media manifests with application-owned SHA-256, and deterministic restore
comparison. Its isolated Docker drill proves PostgreSQL 18.4 custom-format dump/restore and
S3-compatible original copying without production credentials or data. Hosted-provider PITR,
independent encrypted retention and production RPO/RTO evidence remain Task 46. The local
repeatable drill below implements blog-0046.1; its measurements describe the isolated fixture,
not the recovery time or backup freshness of a managed deployment.

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

## Repeatable Local Drill

Run the automated drill on every change through the CI content-integration stage, at least
monthly as an operator rehearsal, and before a destructive migration. Keep the JSON result
with the release's recovery evidence. A maintainer owns this procedure; the magazine owner
does not run database commands.

The complete disposable fixture, PostgreSQL 18 tools, S3-compatible services and planted
failure cases run with this repository-root command on a Docker-capable host:

```sh
pnpm test:content:integration
```

The integration runner discovers `restore-drill.integration.test.ts` automatically. It runs
the same `runRestoreDrill` implementation and operator command wrapper, using the PostgreSQL
tools in the Compose container. No production credentials or data are required. Integration
test targets are removed by the test harness after assertions.

For a separately prepared, **synthetic and isolated** local source, install PostgreSQL 18
`pg_dump` and `pg_restore` on the operator's PATH and use Node 24. Prepare a database with
the repository's reviewed migrations, synthetic content, revisions, published and scheduled
stories, redirects, subscribers/consent and audit rows, plus its media-original bucket.
The database role needs read access to the source and permission to create the target database;
the local S3 credentials need source list/get and target create/list/put/get permissions.
Keep application servers and workers disconnected from the target throughout the drill.

Supply configuration through stdin, using a private file outside Git (mode `0600`). This
command does not use `DATABASE_URL` or the application's media environment variables. Replace
the angle-bracket placeholders with credentials for the disposable local services only:

```json
{
  "isolated": true,
  "source": {
    "databaseUrl": "postgresql://drill:<local-password>@127.0.0.1:25442/restore_drill_source_fixture",
    "objects": {
      "endpoint": "http://127.0.0.1:27042",
      "bucket": "restore-drill-source-fixture",
      "region": "us-east-1",
      "accessKeyId": "<local-access-id>",
      "secretAccessKey": "<local-secret>"
    }
  },
  "target": {
    "databaseUrl": "postgresql://drill:<local-password>@127.0.0.1:25442/restore_drill_target_20261113",
    "objects": {
      "endpoint": "http://127.0.0.1:27043",
      "bucket": "restore-drill-target-20261113",
      "region": "us-east-1",
      "accessKeyId": "<local-access-id>",
      "secretAccessKey": "<local-secret>"
    }
  }
}
```

```sh
pnpm --filter web restore:drill --evidence /absolute/private/recovery/drill-20261113.json < /absolute/private/recovery/local-drill.json
```

The evidence directory must already exist and the evidence file must be new. The command
reserves the file with mode `0600` before accessing services, writes and syncs the result,
and exits zero only for a passed drill. It never overwrites prior evidence. Pick new target
database and bucket names for every run. Names must start with `restore_drill_source_` /
`restore_drill_target_` for databases and `restore-drill-source-` / `restore-drill-target-`
for buckets, followed by 1–32 lowercase letters, digits and underscores (databases) or
hyphens (buckets). Only literal `127.0.0.1` and `::1` endpoints are accepted; connection URL
query parameters, remote addresses and existing targets are refused. Do not use port forwards
to a shared or production service. The isolated acknowledgement describes a real prerequisite.

The command performs these checks:

- Opens a read-only repeatable-read PostgreSQL snapshot. The custom-format logical dump,
  table fingerprints, migration identity and original-media manifest use that same snapshot.
  PostgreSQL 18 server and tool versions are required and recorded.
- Creates a fresh target database and bucket. It compares the restored migration ledger to
  the source and requires a gap-free prefix of the checked-in forward migrations, including
  exact SQL checksums. Unknown, edited or missing ledger entries fail. Only pending forward
  migrations run, under the existing migration lock; no down migration runs in the drill.
- Compares every application table's row count and canonical row fingerprint, including
  published revision pointers, revision bodies, redirects, schedules and leases, subscribers,
  consent and subscription history, authentication records and audit rows. This is intentionally
  strict: a forward migration that changes existing row representations or adds tables can
  require an explicitly reviewed comparison update. A mismatch never passes automatically.
- Lists the whole source and target bucket with pagination; copies and hashes original bytes;
  detects missing originals, orphaned objects and checksum/size differences. Source objects
  referenced as renditions are recognized but not copied; renditions remain rebuildable.
- Generates and validates the versioned portable content export on the restored copy,
  including subscribers and consent. Relationship validation also checks publication and
  scheduling invariants. It does not dispatch outbox work or send subscription email.

The evidence contains a generated drill identity, hashed environment identities, timestamps,
archive and manifest checksums, migration fingerprints, tool versions, per-table counts and
hashes, original-object checksums under hashed keys, export digest, named failures and targets.
It never contains the archive, export payload, subscriber email, raw object key, signed URL,
credential, connection string or driver error. Archives and exports stay in memory; the
archive is capped at 256 MiB and each PostgreSQL tool at 15 minutes, so this is a bounded
local rehearsal rather than a production backup command.

`recovery.rpoMilliseconds` is the age of the database snapshot at the end of verification;
the same snapshot identifies the recovered media manifest. It is **not** the age of the last
edited article, nor proof of an independent backup schedule. `recovery.rtoMilliseconds` uses
a monotonic clock from target creation through restore, media copy, forward migrations,
comparison, export validation and connection cleanup. It excludes creating the source fixture
and taking the dump. The JSON reports both measurements and explicit pass/fail flags against
24 hours and four hours. Missing measurements remain null, with flags false.

### Responding To A Failed Drill

Treat a nonzero exit or `status: failed` as a readiness blocker. Preserve the redacted evidence
and the isolated targets, and create a corrective task naming the failure code and stage.
Use the fixed entity name or hashed object identity to investigate inside the private fixture;
do not paste content or credentials into a task or worklog.

`row_count_mismatch` and `invariant_changed` require reconciling the restore with the source
snapshot. `missing_object`, `orphaned_object` and `checksum_mismatch` require repairing the
fixture's database/object relationship or copy path. `migration_identity_mismatch` requires
reconciling the ledger with reviewed SQL, never rewriting an applied checksum to force success.
`export_invalid` requires fixing the restored relationships. `rpo_exceeded` and `rto_exceeded`
require an operational correction and another measurement; `invalid_clock` invalidates the
measurement. `operation_failed` identifies the phase without exposing driver text. Correct
`invalid_configuration`, `unsupported_version` or `target_exists` before retrying.

Rerun into new targets and a new evidence file after the correction. A successful retry does
not erase the earlier failure. If the command cannot open or finish writing its evidence
file, its nonzero exit and fixed stderr message mean there is no complete evidence record.
Operator runs retain isolated targets for investigation; after reviewing evidence, destroy or
secure them under the standing cleanup approval boundary. Never point the running application
or worker at a restored target as part of this command.

### Managed Deployment Evidence Still Required

Provider PITR, independent encrypted backup retention (blog-0046.2), managed-scale RPO/RTO,
representative public rendering and search (step 6), and designated test-owner sign-in on a
restored copy (step 7) remain managed-deployment acceptance work under blog-0046. Provider
PITR is an additional recovery layer, not proof from this logical-restore drill. The command
validates export and persistence; a local pass does not prove reader availability, owner
authentication or a production recovery objective.

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
