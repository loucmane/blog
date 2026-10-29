# Skill review ingestion into Beads and worklogs

Beads is the active task authority. `scripts/agent-skills/ingest-result.mjs` plans a Beads receipt and an append-only worklog entry. It defaults to a dry run. Only the coordinator runs `--execute` on the host after reviewing the plan and evidence.

Run from the repository root with the pinned Node 24 runtime:

```bash
node scripts/agent-skills/ingest-result.mjs reports/agent-skills/review.json --bead blog-example
```

The JSON output contains `status: "dry-run"`, `gcArgv` (the exact update argument array), `metadataKey`, `receipt`, `summary`, and `worklog.path` / `worklog.entry`. Dry runs do not call Gas City, create directories, or write either sink. The caller must supply `--bead`; an old invocation without it is rejected.

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

The metadata key is `skills.review.<skill>.<reviewId>`. Its compact JSON value contains:

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

Before any Gas City command or evidence write, ingestion parses the result and calls the existing `validateReviewResult`. Subjective findings cannot block. The new ingestion boundary additionally rejects blocking categories outside `blockingEligibleCategories` from `routing.mjs`. Eligible non-blocking findings remain non-blocking; counts do not promote advice into enforcement.

These checks establish structure, containment, classification and the identity of the recorded bytes. They do not prove that a command ran, a linked artifact exists, a claimed head was checked, or a finding is accurate. The supplied `headSha` is recorded without executing Git. The coordinator must verify those claims independently. Keep the ignored `reports/agent-skills/` evidence artifact in durable storage at the recorded repository-relative location; a receipt hash does not preserve the file itself. Do not commit generated review artifacts.

For the authorized host demonstration, use a reviewed result describing actual evidence, inspect the dry-run JSON, and then invoke the same command with `--execute`. Read back the metadata and note, inspect the appended worklog, and verify the result bytes against the recorded SHA-256. Repeat the identical execution to demonstrate `already ingested` with no additional note or append. Record this host receipt on the task before accepting completion.

## Compatibility and follow-up

`buildAegisIngestCommand` remains exported with unchanged behavior and a deprecation comment because `check-v1-completion.mjs` and its tests still consume that historical planning contract. The active CLI no longer calls it. Do not execute that deprecated command or mutate frozen Aegis or Taskmaster state.

Repointing v1 completion criterion c is a follow-up. Updating the cross-agent skill guidance and catalog capability naming is separately admitted work. Neither the old completion report nor this change's injected-runner tests demonstrate a live ingestion receipt.
