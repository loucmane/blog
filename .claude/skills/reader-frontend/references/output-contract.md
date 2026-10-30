# Reader frontend review output

Deliver a concise human review and a JSON wrapper valid against
`schemas/agent-skills/review-result.schema.json`. Store generated artifacts under
`reports/agent-skills/` only when the active task permits it; do not commit generated reports.
The fixture in `tests/agent-skills/fixtures/reader-frontend.json` is synthetic contract data,
not evidence of a browser run, contrast failure, or performance measurement.

## Human evidence

Record scope, reviewed revision, route/direction, viewport, theme, content fixture,
anonymous or signed-in context, and evidence limitations. Cover typography/layout, visual
integrity, accessibility, media semantics, and performance, marking each reviewed, a gap,
or not applicable with a reason. Separate observed code/test behavior, documented contracts,
design judgments, and unresolved choices.

For measurements, name the tool/browser version, production build, cache conditions, exact
command, metric units, route identity, result artifact, and accepted threshold source.
Include checks not run. A dirty worktree needs a safe diff/artifact reference alongside HEAD;
HEAD alone does not identify the reviewed changes. Keep screenshots of private drafts and
credential-bearing reports out of shared evidence.

## Schema wrapper

Use exactly the schema fields: `schemaVersion` (1), `reviewId`, `skill` (`reader-frontend`),
`mode` (`advisory`), `verdict`, `summary`, `generatedAt`, `headSha`, `findings`, `evidence`.
Use an actual timestamp, the full 40-character lowercase commit SHA, and at least one safe
top-level evidence entry (`kind` of `file`, `command`, or `url`, plus `path`). Put extra
measurement tables in a linked file; do not invent wrapper fields such as `visualScore`.

Each finding needs `id`, `severity` (`info`, `warning`, or `error`), `category`, `message`,
`subjective`, `blocking`, and an array of evidence strings. Categories are
`typography-layout`, `visual-integrity`, `accessibility`, `contrast`, `media-semantics`,
`performance-budget`, `measurement-gap`, and `handoff`.

Blocking findings must use a deterministic category from
`scripts/agent-skills/routing.mjs` `blockingEligibleCategories`; the shared validator
and ingestion reject other blocking categories. Use `accessibility` for failed contrast
or accessibility checks, `performance-budget` for failed accepted budget checks, `test`
for other failed contract tests, and `critical-browser` for failed critical browser checks.
Keep specific visual concerns in the message and evidence; topic categories stay non-blocking.

Subjective findings remain advisory and non-blocking: set `subjective: true`,
`blocking: false` for taste, reading comfort, preferred crops, proposed budgets, and
unverified concerns. Only deterministic findings are blocking-eligible:

- Contrast failure: cite the actual foreground/background, theme, computed ratio,
  existing helper/test and contract threshold. The helper does not measure photographs.
- Accessibility or contract failure: cite the executed assertion, tested state, result,
  and reviewed tree. A suspected issue or absent screenshot is a gap, not a failed test.
- Performance-budget failure: cite an accepted budget, comparable measured value and
  the check that failed. The present Lighthouse harness has no score/budget gate; a low
  score alone is not a blocking finding. A harness identity failure means measurements
  are unusable, not that a particular performance threshold was exceeded.

A reproduced deterministic failure sets `subjective: false`; if blocking, include
`command: <exact command>` in finding evidence and repeat the command in top-level evidence
as `{ "kind": "command", "path": "<exact command>" }`. Include a safe output artifact.
Never represent a synthetic example or check that did not run as an observed failure.

Use `fail` if any finding blocks, otherwise `warn` for warning/error findings, otherwise
`pass`. `not-applicable` requires evidence and no findings. The mode remains advisory.

```sh
node scripts/agent-skills/validate-review-result.mjs reports/agent-skills/<result>.json
```

Validation is not implementation authority, publication approval, or permission to ingest
into frozen workflow state. Use the active project's authorized handoff.
