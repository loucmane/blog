# Skill review ingestion into Beads and worklogs

Beads is the active task authority. `scripts/agent-skills/ingest-result.mjs` plans a Beads receipt and an append-only worklog entry. It defaults to a dry run. Only the coordinator runs `--execute` on the host after reviewing the plan and evidence.

Run from the repository root with the pinned Node 24 runtime:

```bash
node scripts/agent-skills/ingest-result.mjs reports/agent-skills/review.json --bead blog-example
```

The JSON output contains `status: "dry-run"`, `gcArgv` (the exact update argument array), `metadataKey`, `receipt`, `summary`, `deterministicReceipts`, and `worklog.path` / `worklog.entry`. Dry runs verify cited deterministic receipts but do not execute checks, call Gas City, create directories, or write either sink. The caller must supply `--bead`; an old invocation without it is rejected.

| Argument                 | Meaning                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| `<result.json>`          | Existing regular result file beneath `reports/agent-skills/`.                                   |
| `--bead <id>`            | Required destination bead ID.                                                                   |
| `--worklog <path>`       | Optional destination beneath `docs/worklog/`; defaults to `docs/worklog/<bead>.md`.             |
| `--city <absolute-path>` | Explicit routing override; defaults to `/home/loucmane/gascity/city`.                           |
| `--rig <name>`           | Explicit routing override; defaults to `blog`.                                                  |
| `--dry-run`              | Optional alias for the default. Cannot be combined with `--execute`.                            |
| `--execute`              | Coordinator-only host operation: read the prior receipt, update Beads, then append the worklog. |

Result and worklog paths may be repository-relative or absolute within their respective roots. Symlink traversal, non-regular destinations, control characters and paths outside those roots are rejected; existing hard-linked worklogs are also rejected. Unknown, repeated, conflicting and missing CLI options are errors.

## Receipt and routing

The update argv has this shape; each displayed placeholder is one argument, without shell interpretation:

```text
/home/loucmane/gascity/bin/gc --city /home/loucmane/gascity/city --rig blog bd update <bead> --append-notes <summary> --set-metadata <key>=<compact-json>
```

The metadata key is `skills.review.<skill>.<reviewId>` with every hyphen replaced by an underscore, because Beads only accepts keys matching `^[a-zA-Z_][a-zA-Z0-9_./]*$`. Two review IDs that differ only in `-` versus `_` share a key; execution compares the stored `skill` and `reviewId` exactly and refuses such a collision. Its compact JSON value contains:

- `skill`, `reviewId`, `headSha`, and `mode` (`advisory`);
- `findings.bySeverity` (`info`, `warning`, `error`), `findings.blocking`, and `findings.advisory` (all non-blocking findings);
- `evidence`, the repository-relative result file path;
- `sha256`, the SHA-256 of the exact result file bytes, including whitespace.

The note and Markdown entry identify the bead, skill, review ID, head, verdict, counts, evidence path and hash. The entry is classified as internal project evidence. Existing worklog bytes are preserved. Free-form review summaries and finding messages remain in the result artifact rather than being copied into Beads or the worklog. Review the artifact for the standing vault content restrictions before host execution; this tool is not a content sanitizer.

Every Gas City call uses the absolute executable, explicit city and rig arguments, `shell: false`, and an environment containing only:

```text
GC_HOME=/home/loucmane/gascity/home
PATH=/home/loucmane/gascity/bin:/usr/local/bin:/usr/bin:/bin
```

No inherited `BEADS_*`, `GC_*`, credentials, or other environment entries are forwarded or printed. Commands have a 30-second timeout. A missing executable, nonzero exit, timeout, unreadable JSON response or unexpected bead identity stops execution.

## Duplicate and retry behavior

Execution first calls the same explicitly routed `gc ... bd show <bead> --json`. It accepts one bead object or a one-element array, checks the returned bead ID and metadata, then looks up the review key:

- Missing key: check worklog writability, run one update containing both note and metadata, then append the planned Markdown. Return `status: "ingested"`.
- Same key and same SHA-256: return `status: "already ingested"`; perform no Beads update, directory creation or worklog append. This remains a no-op even if the worklog was removed or a different worklog path was requested.
- Same key and different or missing SHA-256, or malformed stored receipt: refuse. Preserve both sinks. Corrected review content needs a new review ID after coordinator review.

Run host ingestion serially for a bead. The read-before-update contract is not an atomic compare-and-swap and does not protect against simultaneous processes racing on the same key.

The sinks are not a shared transaction. If the update succeeds and the append fails, the command reports that Beads recorded the receipt and names the worklog requiring coordinator reconciliation. An equal-hash retry deliberately does not repair the log. The coordinator must inspect the stored receipt and existing log, then append only the missing planned entry. A timeout may leave an uncertain update result; inspect Beads before retrying. Do not delete or rewrite historical receipts as automatic recovery.

## Validation versus evidence truth

Before any Gas City command or evidence write, ingestion parses the result and calls the existing `validateReviewResult`. Subjective findings cannot block, and blocking categories must be in `blockingEligibleCategories` from `routing.mjs`. Eligible non-blocking findings remain non-blocking; counts do not promote advice into enforcement.

Both dry-run and execute ingestion also require each blocking finding to cite `receipt:reports/agent-skills/receipts/<checkId>-<headSha>.json` in its own evidence array. Every cited receipt must name a registered deterministic check, permit the finding's category, match the registered argv and review head, and record a completed nonzero exit. Missing, malformed, stale or inconsistent receipts are refused before any Gas City call. Non-blocking findings require no receipt. `deterministicReceipts` lists the verified finding/check IDs, paths, receipt hashes and clean-tree flags, including dirty runs. This gate uses the same parsed review bytes that the plan hashes. See [deterministic check receipts](deterministic-receipts.md) for the registry, host runner, paths and execution contract.

These are consistency checks, not cryptographic attestation or proof that a finding is accurate. The host runner records Git's head and dirty state; ingestion compares that recorded head to the supplied review head without executing Git itself. A dirty receipt remains dirty evidence, and the coordinator must inspect the actual diagnostic and trusted provenance. Keep ignored review and deterministic receipt artifacts, plus the reviewed plan, in durable storage; hashes do not preserve those files. Do not commit generated review artifacts.

For the authorized host demonstration, use a reviewed result describing actual evidence, inspect the dry-run JSON, and then invoke the same command with `--execute`. Read back the metadata and note, inspect the appended worklog, and verify the result bytes against the recorded SHA-256. Repeat the identical execution to demonstrate `already ingested` with no additional note or append. Record this host receipt on the task before accepting completion.

## Offline completion checks

V1 completion criterion c validates recorded review envelopes through `buildBeadsIngestPlan` in memory with a synthetic bead ID. Its optional `result` input serializes the envelope as indented JSON plus a newline, applies the same validation and path checks, and builds a plan without requiring a result file, writing evidence, or calling Gas City. The plan hash describes that serialization; it is not a receipt for a persisted artifact.

`buildBeadsIngestPlan` is a structural planning API and does not verify deterministic execution receipts, even with a file-backed result. `ingestReviewResult` rejects the in-memory `result` option, including for a CLI dry run. Ingestion always reads and hashes the actual result file bytes and verifies receipts for blocking findings. Only the coordinator runs `node scripts/agent-skills/ingest-result.mjs reports/agent-skills/<result>.json --bead <id> --execute` on the host. The command without `--execute` remains a dry run.

The deprecated Aegis builder has been removed. Do not mutate frozen Aegis or Taskmaster state. The completion report and injected-runner tests demonstrate contract acceptance, not a live ingestion receipt. The v1 gap manifest is preserved as historical proposals rather than a current open-work list.
