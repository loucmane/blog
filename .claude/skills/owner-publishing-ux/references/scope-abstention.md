# Owner publishing scope disposition

Use this output after the review scope gate finds no changed owner intent, state
transition, feedback or recovery journey. It replaces the full journey artifact
for an off-scope change; an abstention does not claim the owner experience passed
review. If evidence is incomplete, describe the missing evidence and next check
instead of concluding that no owner surface changed.

Retain the required wrapper fields from
`schemas/agent-skills/review-result.schema.json`: `schemaVersion`, `reviewId`,
`skill` (`owner-publishing-ux`), `mode` (`advisory`), `verdict`, `summary`,
`generatedAt`, `headSha`, `findings`, and `evidence`. Use the reviewed revision,
an actual timestamp and safe top-level evidence for the diff and affected
contracts. The following JSON excerpts illustrate fields within that wrapper;
they are not complete review results or observations of a particular revision.

## Abstention

```json
{
  "verdict": "not-applicable",
  "summary": "The inspected diff changes backend query organization without changing an owner action, state transition, feedback or recovery journey. No owner journey is specified or changed, so this is a scope abstention.",
  "findings": []
}
```

Explain both the actual changed behavior and the absent owner consequence.
Do not invent journey cards, owner needs, policies or recovery requirements to
fill the full review contract. A backend filename alone cannot prove absence:
trace an owner-visible effect if the evidence supports one.

## Scoped handoff

When another skill owns the change and a next review is useful, use an info-only
`pass` wrapper whose summary explicitly says handoff only, not owner UX approval.
Use this finding shape, replacing the illustrative text with observed evidence:

```json
{
  "id": "backend-query-handoff",
  "severity": "info",
  "category": "handoff",
  "message": "Hand the changed query organization to content-platform-backend for repository consistency review; no owner journey changes are evidenced.",
  "subjective": true,
  "blocking": false,
  "evidence": ["The inspected diff changes backend query organization only."]
}
```

A handoff is a bounded routing suggestion, not substantive owner-journey advice
or permission to dispatch, implement or change authority. Subjective findings
remain advisory and non-blocking. Preserve the original selection and historical
usefulness counts; an abstention or handoff does not remove a selected assessment
or establish that a later reviewer found its advice usable.
