# Release witness output

Deliver a human verification record and a JSON review wrapper valid against
`schemas/agent-skills/review-result.schema.json`. Generated files belong beneath
`reports/agent-skills/` only if the task allows that write. The fixture at
`tests/agent-skills/fixtures/release-witness.json` is synthetic, not release approval or an
observed test failure. Keep confidential artifacts out of the report.

## Verification record

Lead with the release scope, exact revision/artifact and readiness limits. A dirty worktree
requires a diff or content artifact reference alongside HEAD. Record PR head, CI tested
commit and deployed revision separately when relevant; do not imply they are identical.

Use one row per check with these columns:

| Check/scope | Exact command and cwd | Execution context and revision | Exit status and result counts | Evidence artifact/run identity | Limitation or next action |
| --- | --- | --- | --- | --- | --- |
| Name the actual assertion or suite | Preserve filters and flags; redact secrets without hiding meaningful scope | Worker, host or CI; tool versions and relevant browser/fixture | Passed/failed/skipped/todo/cancelled/flaky as supported by the runner, with units | Safe path or run URL, timestamp and attempt | Not run, unavailable or not applicable requires a reason; never silently record zero |

Distinguish unit tests of check machinery, application tests, browser tests, security audit,
baseline comparison, build and smoke. Name checks not run even when everything that did run
passed. Preserve initial failures and reruns. If blocked by sandbox/network/tooling, say what
the coordinator must run; do not claim host or CI success without evidence. PR evidence
should use this same scope and counts, even if condensed to a few sentences.

For rollback readiness record the last known-good app revision, database/migration
compatibility, backup identity and verified restore reference, media integrity, jobs/cache
recovery, trigger/owner and post-rollback checks. Mark each as documented, rehearsed,
observed or unknown. Link measurements for RPO/RTO; do not convert targets into guarantees.

## JSON wrapper and findings

Use exactly `schemaVersion` (1), `reviewId`, `skill` (`release-witness`), `mode` (`advisory`),
`verdict`, `summary`, `generatedAt`, `headSha`, `findings`, `evidence`. Supply an actual
timestamp, full lowercase 40-character commit SHA and at least one top-level evidence item
with `kind` (`file`, `command`, `url`) and `path`. Link the verification record as file
evidence; do not add `testCounts`, `rollbackReady` or other undeclared wrapper fields.

Findings require `id`, `severity` (`info`, `warning`, `error`), `category`, `message`,
`subjective`, `blocking`, `evidence` strings. Categories include `test-results`,
`verification-integrity`, `security-signal`, `accessibility-signal`, `rollback-readiness`,
`evidence-gap`, `handoff`.

Blocking findings must use a deterministic category from
`scripts/agent-skills/routing.mjs` `blockingEligibleCategories`; the shared validator
and ingestion reject other blocking categories. Use `test` for failed tests or test-result
validation, `security` for failed security checks, `accessibility` for failed accessibility
checks, and `health` for failed health or smoke checks. Keep the release concern in the
message and evidence; topic categories stay non-blocking.

Subjective findings remain advisory and non-blocking (`subjective: true`, `blocking: false`).
Only deterministic findings are blocking-eligible (`subjective: false`): cite an executed
check, the accepted rule it violated and safe output at the reviewed revision. A false
verification claim needs both the claim and contradictory runner/artifact evidence;
unavailable evidence alone is not proof of fabrication. A missing artifact can block only
when a deterministic check proves an explicit required-artifact contract was violated.

For each blocking finding include `command: <exact command>` in finding evidence and a
matching top-level command entry plus the safe result artifact. A schema-valid report
does not prove any command executed. The current validator enforces shape and the
subjective/blocking boundary; the reviewer must reconcile command output and verdict.

Use `fail` if any finding blocks, otherwise `warn` for warning/error findings, otherwise
`pass`; `not-applicable` needs evidence and no findings. Mode remains advisory.

```sh
node scripts/agent-skills/validate-review-result.mjs reports/agent-skills/<result>.json
```

The report is not implementation authority. A green report is not merge or deployment
permission. Use the authorized Beads/worklog handoff; do not repair or ingest into frozen
Taskmaster/Aegis state and do not execute rollback from this reporting workflow.
