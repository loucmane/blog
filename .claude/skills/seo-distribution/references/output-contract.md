# SEO and distribution review output

Give a concise human review and a JSON wrapper valid against
`schemas/agent-skills/review-result.schema.json`. Store generated results beneath
`reports/agent-skills/` only within the active task's write scope. The fixture at
`tests/agent-skills/fixtures/seo-distribution.json` is synthetic contract data, not a crawl,
feed parse, redirect check or observation of a failing origin test.

## Human evidence

Identify revision, public origin (without secrets), routes, publication state and evidence
source. A dirty worktree needs a safe diff or artifact reference alongside HEAD. For each
affected surface record implemented/planned/unverified, observed behavior, accepted contract,
check/result and limitation. Cite planned work by bead ID. Include checks not run and why.
Record actual response status, Location, canonical, metadata or parser errors when available;
source inspection and proposed tests must not masquerade as HTTP verification.

## JSON wrapper

Use exactly `schemaVersion` (1), `reviewId`, `skill` (`seo-distribution`), `mode` (`advisory`),
`verdict`, `summary`, `generatedAt`, `headSha`, `findings`, `evidence`. Use an actual timestamp,
a full lowercase 40-character SHA and at least one safe top-level evidence entry with
`kind` (`file`, `command`, `url`) and `path`. Put surface inventories in a linked file rather
than inventing schema fields.

Each finding needs `id`, `severity` (`info`, `warning`, `error`), `category`, `message`,
`subjective`, `blocking`, and evidence strings. Suggested categories: `canonical-url`,
`slug-redirect`, `structured-data`, `social-card`, `feed-sitemap`, `index-hygiene`,
`distribution-design`, `evidence-gap`, `handoff`.

Subjective findings remain advisory and non-blocking (`subjective: true`, `blocking: false`).
Only deterministic findings are blocking-eligible (`subjective: false`): cite the accepted
rule and reproducing command for an incorrect/missing canonical or robots directive,
parser failure or test failure. Include `command: <exact command>` in finding evidence,
repeat it as a top-level command entry and link safe output. A gap or a suspicion is not
a reproduced failure. A missing planned endpoint alone does not establish a regression.

Use `fail` when any finding blocks, otherwise `warn` for warning/error findings, otherwise
`pass`; `not-applicable` needs evidence and no findings. The mode stays advisory. Schema
validation checks the wrapper, not the truth of its claims or whether commands ran.

```sh
node scripts/agent-skills/validate-review-result.mjs reports/agent-skills/<result>.json
```

Validated evidence is not implementation authority or approval to publish, send newsletters,
merge, change indexing policy or ingest into frozen Aegis state. Use the active handoff.
