# Discovery Output Contract

Use both outputs. Keep them repository-portable and independent of a specific agent UI.

## Product Discovery Brief

```markdown
# <Decision Title>

## Decision

- Product question:
- Discovery mode: frame | reconcile | decide | review
- Affected owner/reader:
- Decision deadline:
- Reversibility:

## Evidence

| Evidence | Kind | Source | Confidence | Implication |
| -------- | ---- | ------ | ---------- | ----------- |

## Product Frame

- Priority audience:
- Priority jobs:
- Editorial promise:
- Owner outcome:
- Reader outcome:
- Success signals:
- Non-goals:

## Options

| Option | Evidence fit | Owner impact | Reader impact | Reversibility | Risk |
| ------ | ------------ | ------------ | ------------- | ------------- | ---- |

## Recommendation

- Recommended option:
- Why now:
- Rejected alternatives:
- What would change the decision:

## Assumptions

| ID  | Assumption | Confidence | Consequence if wrong | Validation |
| --- | ---------- | ---------- | -------------------- | ---------- |

## Open Questions

| ID  | Question | Owner | Why it matters | Next evidence source |
| --- | -------- | ----- | -------------- | -------------------- |

## Risks And Experiments

| Risk | Earliest signal | Cheapest experiment | Decision enabled |
| ---- | --------------- | ------------------- | ---------------- |
```

## Advisory Review Result

The JSON wrapper must validate against
`schemas/agent-skills/review-result.schema.json`. Replace the example identifiers,
timestamp, SHA, messages, and evidence paths.

Represent discovery concepts through finding categories because the shared result schema
does not permit skill-specific top-level properties:

- `assumption` — `subjective: true`, `blocking: false`;
- `open-question` — `subjective: true`, `blocking: false`;
- `product-decision` — normally `subjective: true`, `blocking: false`;
- `evidence-gap` — classify subjectivity honestly and keep non-blocking during v1 dogfood;
- `experiment` — `subjective: true`, `blocking: false`.

```json
{
  "schemaVersion": 1,
  "reviewId": "task50-product-discovery",
  "skill": "magazine-product-discovery",
  "mode": "advisory",
  "verdict": "warn",
  "summary": "The product direction is decision-ready with one assumption and one open question.",
  "generatedAt": "2026-01-01T00:00:00Z",
  "headSha": "0000000000000000000000000000000000000000",
  "findings": [
    {
      "id": "assumption-owner-cadence",
      "severity": "info",
      "category": "assumption",
      "message": "The initial workflow assumes one owner publishes weekly.",
      "subjective": true,
      "blocking": false,
      "evidence": ["Owner cadence has not yet been observed."]
    },
    {
      "id": "question-reader-priority",
      "severity": "warning",
      "category": "open-question",
      "message": "The priority reader segment still needs owner confirmation.",
      "subjective": true,
      "blocking": false,
      "evidence": ["docs/product/discovery.md"]
    }
  ],
  "evidence": [
    {
      "kind": "file",
      "path": "docs/product/discovery.md"
    }
  ]
}
```

Validate generated results before ingestion:

```bash
node scripts/agent-skills/validate-review-result.mjs reports/agent-skills/<result>.json
node scripts/agent-skills/ingest-result.mjs reports/agent-skills/<result>.json --dry-run
```
