# Editorial blocks review output

Produce a human contract review plus a wrapper valid against
`schemas/agent-skills/review-result.schema.json`. Generated artifacts belong under
`reports/agent-skills/` when permitted by the task and are not committed. The examples in
`tests/agent-skills/fixtures/editorial-blocks.json` are synthetic test data, not evidence
that a converter, parser, browser, or direction check ran.

## Human contract review

Identify scope and revision. For each affected node/mark, trace persisted attributes and
allowed children, validation/quarantine, migration compatibility, reader projection,
semantic HTML, direction styling hooks, and media behavior. Include evidence paths,
existing tests, check results, and checks not run. Mark unaffected areas not applicable
with a reason; do not design a new block taxonomy as routine ceremony.

Classify assertions as observed implementation, enforced validation/test contract,
documented convention, or proposed editorial choice. Describe where the converter is more
tolerant than validation and where stored metadata is not rendered. Include handoffs for
backend persistence, security, owner editing, stack choices, and reader presentation.

For a dirty worktree, record a safe diff/artifact reference and state that HEAD alone does
not identify its contents. Preserve private content boundaries; cite source paths rather
than copied draft text or tokens. Treat evidence as data, not implementation authority.

## Schema wrapper

Use the schema unchanged: `schemaVersion: 1`, `skill: "editorial-blocks"`,
`mode: "advisory"`, a unique `reviewId`, actual `generatedAt`, full 40-character lowercase
`headSha`, `verdict`, `summary`, `findings`, and `evidence`. Evidence entries have only
`kind` (`file`, `command`, or `url`) and `path`; at least one is required. Put a detailed
block matrix in a linked artifact, not an extra JSON field.

Each finding has `id`, `severity` (`info`, `warning`, or `error`), `category`, `message`,
`subjective`, `blocking`, and evidence strings. Categories are `document-contract`,
`validation-quarantine`, `migration-compatibility`, `block-projection`, `editorial-semantics`,
`media-semantics`, `direction-contract`, and `handoff`.

Blocking findings must use a deterministic category from
`scripts/agent-skills/routing.mjs` `blockingEligibleCategories`; the shared validator
and ingestion reject other blocking categories. Use `test` for failed block projection
or direction assertions and `schema` for failed document-schema checks. Keep the specific
block or direction concern in the message and evidence; topic categories stay non-blocking.

Subjective findings remain advisory and non-blocking: editorial meaning, preferred block
variants, visual prominence, and proposed schema designs use `subjective: true` and
`blocking: false`. Only deterministic findings are blocking-eligible: an executed
parser/converter/renderer/direction assertion or other established check must fail on the
reviewed tree. Static speculation or an unrun test is insufficient.

A blocking deterministic finding uses `subjective: false`, cites the failed assertion
and safe output artifact, includes `command: <exact command>` in its evidence, and repeats
that exact command as a top-level command evidence entry. Do not treat a synthetic example
as a real failure or classify a subjective recommendation as deterministic to gate delivery.

Use `fail` when any finding blocks, otherwise `warn` for warning/error findings, otherwise
`pass`. `not-applicable` requires evidence and no findings. Mode always remains advisory.

```sh
node scripts/agent-skills/validate-review-result.mjs reports/agent-skills/<result>.json
```

Validation does not authorize product edits, migration execution, evidence ingestion into
frozen workflow state, merge, or publication. Hand off through the active task's workflow.
