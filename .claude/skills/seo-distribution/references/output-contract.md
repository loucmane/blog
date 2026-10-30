# SEO and distribution review output

Give a concise human review and a JSON wrapper valid against
`schemas/agent-skills/review-result.schema.json`. Store generated results beneath
`reports/agent-skills/` only within the active task's write scope. The fixture at
`tests/agent-skills/fixtures/seo-distribution.json` is synthetic contract data, not a crawl,
feed parse, redirect check or observation of a failing origin test.

## Scope disposition

Apply the skill's scope gate before producing substantive distribution advice.
An abstention is an assessment of applicability, not a passing distribution audit.
Use `verdict: not-applicable` with `findings: []`; explain what changed and which
distribution surfaces did not, citing the reviewed diff and affected contracts in
top-level evidence. Do not run the remaining surface inventory merely to fill a
review. Missing evidence is an `evidence-gap`, not proof of absent scope.

These are field excerpts for the JSON wrapper below, not complete review results:

```json
{
  "verdict": "not-applicable",
  "summary": "The inspected diff changes reader typography only; canonical URLs, metadata and distribution behavior are unchanged. This is a scope abstention, not distribution verification.",
  "findings": []
}
```

If another skill owns the changed behavior and a next review is useful, a scoped
handoff may replace abstention. Name the owner and boundary in an informational
finding; use `pass` for this info-only wrapper and state that it is a handoff only,
not substantive distribution advice or verification. Keep it subjective and
non-blocking; the handoff grants no dispatch or implementation authority.

```json
{
  "id": "reader-presentation-handoff",
  "severity": "info",
  "category": "handoff",
  "message": "Hand the changed typography to reader-frontend for readability and responsive layout review; no distribution behavior changed.",
  "subjective": true,
  "blocking": false,
  "evidence": ["The reviewed diff changes reader typography only."]
}
```

Replace illustrative text with observed evidence. Keep the original skill
selection and historical usefulness counts unchanged; neither an abstention nor
a handoff retroactively removes an assessment or proves new advice usable.

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

Blocking findings must use a deterministic category from
`scripts/agent-skills/routing.mjs` `blockingEligibleCategories`; the shared validator
and ingestion reject other blocking categories. Use `test` for failed canonical-origin,
redirect, feed or indexing assertions and `schema` for failed structured-data validation.
Keep the specific distribution concern in the message and evidence; topic categories
stay non-blocking.

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
