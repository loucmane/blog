# Backup, Restore, and Export Contract

**Status:** Canonical requirements; implementation provisional

**Updated:** 2026-11-26

## Task 42 Foundation

Task 42 implements provider-independent logical backup command plans, strict portable
content export/import, media manifests with application-owned SHA-256, and deterministic restore
comparison. Its isolated Docker drill proves PostgreSQL 18.4 custom-format dump/restore and
S3-compatible original copying without production credentials or data. The independent backup
command implements blog-0046.2. Hosted-provider PITR and managed-deployment RPO/RTO evidence
remain Task 46. The repeatable drill implements blog-0046.1 and measures the isolated fixture.
blog-0046.3 records every backup and drill run and reports their age and result through the
health endpoint and the owner job view ([Health Reporting](#health-reporting)).

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

### Run The Independent Backup

Run a backup daily at 02:00 UTC, before destructive migrations, and after recovery. Use an
operator host with Node 24, PostgreSQL 18 `pg_dump`, enough memory for the archive, and a
private, existing staging directory (mode `0700`) outside Git. The source database role needs
read access to the application database. The object-store role needs only list and get access
to the source bucket. PostgreSQL uses a single exported read-only snapshot for the migration
ledger, table fingerprints, media inventory, and logical archive. Each listed original must
match the SHA-256 and size from that snapshot. A nonzero `unreferencedObjects` count reports
bucket objects absent from the snapshot's original and rendition inventories. Check whether
these are recent writes before treating them as orphans.

Keep source configuration in a private JSON file (mode `0600`) outside Git. Use a direct
database endpoint and an HTTPS object endpoint. The database URL accepts two query parameters,
each at most once, and refuses any other: `sslmode` (`disable`, `require`, `verify-ca` or
`verify-full`) and `channel_binding` (`disable`, `prefer` or `require`), which Neon's connection
strings carry. Keep a Neon URL's `sslmode=require&channel_binding=require` as Neon gives it.
Hosted connections use certificate and hostname verification, including when the configuration
requests `require`, and `channel_binding` never relaxes that. The PostgreSQL CLI uses the system
trust store and receives `channel_binding` unchanged, so with `require` `pg_dump` refuses a
server that does not bind the connection to its TLS channel. The command's node-postgres
connections, the run recorder's included, enforce `require` the same way. They authenticate only
with SCRAM-SHA-256-PLUS over TLS, and only once the server's SCRAM signature checks out. A server
that asks for a cleartext or MD5 password, offers only plain SCRAM-SHA-256, or lets the client
in without authenticating is refused before any password is sent. The command then reports
`operation_failed`, with no host, URL or driver text. With `prefer` they bind whenever the server
offers it, as Neon's does, and otherwise use plain SCRAM-SHA-256. Literal loopback endpoints
allow unencrypted connections for local fixtures, which therefore cannot ask for
`channel_binding=require`.

```json
{
  "databaseUrl": "postgresql://<backup-user>:<password>@<database-host>/<database>?sslmode=verify-full",
  "objects": {
    "endpoint": "https://<object-storage-host>",
    "bucket": "<originals-bucket>",
    "region": "<region>",
    "accessKeyId": "<read-only-access-id>",
    "secretAccessKey": "<read-only-secret>"
  }
}
```

Set `MAGAZINE_BACKUP_KEY_FILE` to the absolute path of an operator-owned regular file with
mode `0600` or `0400`. Its contents are 32 random bytes encoded as unpadded base64url, with
an optional final newline. From a private directory, this command generates a new key file
without displaying its contents or overwriting an existing key:

```sh
node --input-type=module -e 'import { randomBytes } from "node:crypto"; import { writeFileSync } from "node:fs"; writeFileSync(process.argv[1], randomBytes(32).toString("base64url") + "\n", { flag: "wx", mode: 0o600 })' /absolute/private/backup-key
```

Store an offline copy in separate custody from both the backup host and storage provider.
Losing every key copy makes its backup sets unrecoverable. To rehearse key recovery, restore
the offline key into a private file with the same permissions, point `MAGAZINE_BACKUP_KEY_FILE`
there, verify a downloaded set, and use a synthetic set for the isolated drill. Record only
the set ID, date, and outcome. Keep the previous key while any sets encrypted with it remain.
Use a separate retention directory per key when rotating.

```sh
pnpm --filter web backup:create --directory /absolute/private/backup-staging < /absolute/private/backup-source.json
pnpm --filter web backup:verify --directory '/absolute/private/backup-staging/backup-<id>'
```

Use the set directory name returned by `backup:create` in place of `backup-<id>` in these
examples. Copy the entire directory, preserving its name, to independent storage outside the
database and object-storage provider accounts. Download and verify the copy before pruning.
Keep storage access restricted and audited. The set contains `database.enc`,
`media-manifest.enc` (original keys, asset IDs that reference rights records, MIME types,
checksums, and table fingerprints), and a numbered encrypted file per original. The public
manifest records timestamps, migration identity, tool versions, and plaintext and ciphertext
sizes and SHA-256 digests. It contains no URLs, object names, credentials, or personal data.
`manifest.mac` authenticates the manifest itself. Encrypted files use AES-256-GCM in 1 MiB
chunks with per-chunk authentication and per-set derived keys. Verification also checks exact
file sizes and both digests. The PostgreSQL archive stays in memory and is capped at 256 MiB.
Schedule capacity review before reaching that limit and treat a size refusal as a backup failure.

`backup:create` records every run, success or failure, in the application database that
`DATABASE_URL` names: kind, outcome, the fixed failure code, and start and finish times. It
records nothing else. Set `DATABASE_URL` in the command's environment to the database the
backup reads, the one whose health check reports it. The URL follows the source URL's rules
above, so a Neon `DATABASE_URL` works as Neon gives it. The run is written through
node-postgres alone, as described there. Its role needs `INSERT` on `operation_runs`; the
application's own role already has it.
For a dedicated recording role, run `GRANT INSERT ON operation_runs TO <recording-role>`.
`backup:verify` and `backup:prune` record nothing. `backup:create` exits with one of three
codes:

- `0`: the set was created and its run recorded.
- `1`: the backup failed. Its failure is recorded when the database accepts it; the warning
  says when it did not.
- `3`: the set was created and kept, but its run was not recorded. The fixed warning names
  `not_configured` (no `DATABASE_URL`), `invalid_configuration`, `tls_required` or
  `operation_failed` (connection or write failure, or missing `INSERT`).

Treat `3` as a failed scheduled run. The kept set remains valid for copying and verification,
but the health check keeps reporting the previous backup until a run is recorded. Correct the
URL or the role's access, then run the backup again.

### Prune Retention

After a successful independent copy and verification, preview the prune plan and then apply it
to the private filesystem archive root. Serialize these operations with any external copy or
cleanup routine that can replace files in that root. For off-host media, follow the same
verified plan against independently stored sets.

```sh
pnpm --filter web backup:prune --directory /absolute/private/backup-archive --dry-run
pnpm --filter web backup:prune --directory /absolute/private/backup-archive
```

The command retains the newest verified set in each of the seven most recent populated UTC
days, four most recent populated UTC weeks (Monday start), and twelve most recent populated
UTC months. A set can satisfy multiple periods. The newest verified set always survives.
Only complete sets that pass verification under the configured key are eligible for deletion.
The JSON includes the kept set names, the names selected for removal, and any candidate sets
skipped with their failure codes. Skips produce a nonzero exit even if eligible older sets
were removed. An interrupted run can leave a hidden staging or quarantine directory. Review
these against the last backup result before doing any manual cleanup.

Page the operator on a failed command or when the newest independently stored verified
snapshot is older than 24 hours. Preserve the last verified sets and inspect the fixed
failure code. `invalid_key_file` calls for checking custody, path, format, and permissions.
`authentication_failed` calls for confirming the key and inspecting the storage copy.
`truncated_file` or `checksum_mismatch` calls for re-copying from a trusted verified set or
re-running the backup. Investigate `missing_object` against the source database and bucket
before retrying. Keep only redacted evidence in incident records.

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
command reads `DATABASE_URL` only to record the run in the application database. It never
reads, restores into or compares that database, and it does not use the application's media
environment variables. Replace the angle-bracket placeholders with credentials for the
disposable local services only:

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
and exits zero only for a passed drill. It never overwrites prior evidence. Once the evidence is
written, the command records the run in the database that `DATABASE_URL` names: the
outcome, the first failure code, the evidence timestamps and the measured recovery point and
time. That database's health check and owner job view then report the drill. URL and role rules
match `backup:create`. A drill that never started, because its evidence file could not be
reserved, records nothing. A drill whose evidence could not be written records a failed run with
`operation_failed`. A passed drill whose run cannot be recorded keeps its evidence and exits
`3`. A failed drill keeps exit `1` either way. Pick new target
database and bucket names for every run. Names must start with `restore_drill_source_` /
`restore_drill_target_` for databases and `restore-drill-source-` / `restore-drill-target-`
for buckets, followed by 1–32 lowercase letters, digits and underscores (databases) or
hyphens (buckets). Only literal `127.0.0.1` and `::1` endpoints are accepted; connection URL
query parameters, remote addresses and existing targets are refused. Do not use port forwards
to a shared or production service. The isolated acknowledgement describes a real prerequisite.

To rehearse recovery from an encrypted synthetic set, replace the `source` object in the drill
configuration with `{"backupDirectory":"/absolute/private/backup-staging/backup-…"}` and supply
`MAGAZINE_BACKUP_KEY_FILE` as above. Keep the target isolated and fresh. The drill verifies the
complete set before writing to the target and compares the restored rows with fingerprints
captured at backup time. Encrypted-source evidence records the set ID. Use a fresh synthetic
backup to exercise the 24-hour RPO as well as the restore.

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
  require an explicitly reviewed comparison update. A mismatch never passes automatically. The
  reviewed list in `restore-drill-postgres.ts` names one such table, `operation_runs` from
  migration 0011. A drill that restores an older ledger accepts it in the restored copy only
  while it is empty. Recorded runs are application rows, backed up and compared like any other.
- Lists the whole target bucket with pagination and checks original bytes, missing originals,
  orphaned objects and checksum or size differences. For a live fixture source it also lists
  the source bucket and recognizes renditions. For an encrypted source it authenticates the
  archived originals and uses the encrypted inventory to restore them.
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

Provider PITR, operation of the independent backup schedule, managed-scale RPO/RTO,
representative public rendering and search (step 6), and designated test-owner sign-in on a
restored copy (step 7) remain managed-deployment acceptance work under blog-0046. Provider
PITR is an additional recovery layer, not proof from this logical-restore drill. The command
validates export and persistence; a local pass does not prove reader availability, owner
authentication or a production recovery objective.

## Health Reporting

`GET /api/health` reports two checks read from the latest recorded runs, `backup` and
`restoreDrill`. The latest run of each kind is the one that finished last. Each check holds a
`status`, a `reason` from the fixed list below when it is degraded, `ageMs` once a run is
recorded, and the probe's `durationMs`. For `backup`, `ageMs` counts the milliseconds since the
latest backup started. The backup takes its snapshot just after it starts, so this age never
understates how old the recoverable point is. For `restoreDrill`, `ageMs` counts from when the
latest drill finished. Failure codes, timestamps, measurements, paths, keys, hosts, set names
and counts stay out of the body.

These checks never take the site `down`. A finding makes the overall status `degraded` and the
endpoint still answers 200, which the container health check and
`packages/web/scripts/container-smoke.mjs` accept. Both checks share one read of the runs per
request. It gives up after 1.5 seconds, inside the 2-second check limit, and PostgreSQL ends its
statement after one second. The 1.5 seconds include waiting for a connection from the
application's pool. However many health requests give up on a pool with no free connection, the
reads keep only one connection request waiting in it. When the pool frees, that connection serves
the next read, or goes back to the pool unused. A stalled database or a saturated pool therefore
leaves at most one waiting request and no running statement behind. If the runs cannot be
read, both checks are `down`: with `timeout` when the read ran out of time, and with
`unavailable` when it failed, for example before migration 0011 is applied. A latest run whose
stored row the application cannot read back makes only its own check `down` with
`unavailable`; an older run never stands in for it. Such a row could come from a later release
that recorded a failure code this one does not know. Unless the database itself is down, the
site is still only degraded. The in-memory owner test runtime has no database, so both checks
are `not_configured` there.

The backup check is `up` when the latest backup succeeded and started within the 24-hour
recovery point target. The drill check is `up` when the latest drill passed with both recovery
targets met and finished within 35 days. That cadence is the monthly drill plus a few days'
slack. Both limits are code constants (`recoveryTargets` and `restoreDrillCadenceMs`), so no
environment variable configures them.

| Check | Reason | Meaning | Operator action |
| --- | --- | --- | --- |
| `backup` | `never_run` | No `backup:create` run is recorded. | Schedule [the independent backup](#run-the-independent-backup) with `DATABASE_URL` set, and check its exit status. |
| `backup` | `last_run_failed` | The latest backup failed. | Read its fixed failure code in the command output or the maintainer details on `/owner/jobs`, apply its step under [Prune Retention](#prune-retention), then rerun the backup. |
| `backup` | `stale` | The latest backup started more than 24 hours ago. Its snapshot dates from just after that, so a restore would miss the 24-hour target even if the backup finished more recently. | Check the scheduler and the last exit status (including `3`), then run a backup now. |
| `restoreDrill` | `never_run` | No restore drill is recorded. | Run the [repeatable local drill](#repeatable-local-drill) with `DATABASE_URL` set. |
| `restoreDrill` | `last_run_failed` | The latest drill failed for a reason other than its recovery targets. | Follow [Responding To A Failed Drill](#responding-to-a-failed-drill), then rerun into new targets. |
| `restoreDrill` | `targets_missed` | The latest drill missed the 24-hour RPO or the four-hour RTO, or no longer meets them. | Correct the backup cadence (`rpo_exceeded`) or the restore path (`rto_exceeded`), then rerun the drill. |
| `restoreDrill` | `stale` | The latest drill finished more than 35 days ago. | Run this month's drill. |
| either, `down` | `timeout` | The read of the runs did not finish in time. | Check the database's load and any long-held lock on `operation_runs`. |
| either, `down` | `unavailable` | The runs could not be read, or that kind's latest stored row does not follow migration 0011. | Apply migration 0011 if it is missing. Otherwise read the logged `health.check.failed` error and inspect that kind's latest row in `operation_runs`. |

A backup's age runs from its start and a drill's from its finish. With one backup a day, the
backup check therefore reports `stale` for about the length of each run: from 24 hours after the
previous backup started until the next one is recorded. In that window a restore really would
lose more than 24 hours, because the newest snapshot is that old. To keep the check `up`, start
backups more often than every 24 hours, for example every 12 hours, or let the backup alert
tolerate the expected run time. The check reads only what the commands recorded and cannot see
the independent copy, so keep downloading and verifying copied sets as described above.

The owner job view at `/owner/jobs` shows the same states in plain language. It says when the
last backup started and when the last drill finished, the times their ages run from,
whether each worked, and the drill's recovery point and time against their targets. A run that
failed shows when it stopped. Each one that needs attention gets one next step pointing to this
runbook. A maintainer can open the stored run, including both its times and its fixed failure
code. When a run cannot be read, the page says so and still shows the publishing jobs. A failed
read is logged as `owner.jobs.recovery.failed`.

Migration 0011 adds the `operation_runs` table. Its checks admit only what the application
reads back: finite timestamps from year 0001 to year 9999, and measurements of at most
9,007,199,254,740,991 ms (`Number.MAX_SAFE_INTEGER`). The application refuses a run outside
those bounds before it writes one. Its down migration takes an
`ACCESS EXCLUSIVE` lock and refuses once any run is recorded, because the run history is
recovery evidence.

## Failure Handling

- A failed backup or stale backup raises an actionable alert: the `backup` health check
  degrades with `last_run_failed` or `stale` (see [Health Reporting](#health-reporting)).
- A failed, off-target, stale or missing restore drill degrades the `restoreDrill` check.
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
