# Routing v2: recovery and font verification

The live quality route now includes recovery coverage, Suspense retry regression, font digest and URL contracts, framework cache contracts, direction browser tests and the shared cold-font browser spec. Other routes and task-text matching are unchanged. Presentation-only negatives are labelled separately in the routing fixtures.

**The same five PRs informed this revision. This is not an independent sample or a generalization estimate.** Their original expected labels are unchanged; the author knew the v1 misses. Fixture labels were written before executing the revised router. This is a routing-only comparison: no new blind review or advice-usefulness assessment was performed.

Denominators: 5 PRs × 12 registered skills = 60 binary decisions; 9 expected positives and 51 expected negatives. Selected scopes: v1 16, v2 18.

| Measurement | v1 | v2 | Change (v2 − v1) |
| --- | --- | --- | --- |
| truePositives | 7 | 9 | +2 |
| falsePositives | 9 | 9 | 0 |
| falseNegatives | 2 | 0 | -2 |
| trueNegatives | 42 | 42 | 0 |
| Precision: TP/(TP+FP) | 7/16 (43.8%) | 9/18 (50.0%) | +6.3 percentage points |
| Recall: TP/(TP+FN) | 7/9 (77.8%) | 9/9 (100.0%) | +22.2 percentage points |
| False-positive rate: FP/(FP+TN) | 9/51 (17.6%) | 9/51 (17.6%) | 0 percentage points |
| False-negative rate: FN/(TP+FN) | 2/9 (22.2%) | 0/9 (0.0%) | -22.2 percentage points |
| PRs missing an expected scope | 2/5 | 0/5 | -2 |
| Exact-match PRs | 0/5 | 0/5 | 0 |

| PR | Expected | Selected in v2 | Added | Removed | False positives | False negatives |
| --- | --- | --- | --- | --- | --- | --- |
| #130 | quality-reliability-observability, reader-frontend | owner-publishing-ux, quality-reliability-observability, reader-frontend, seo-distribution | quality-reliability-observability | none | owner-publishing-ux, seo-distribution | none |
| #128 | content-platform-backend | content-platform-backend, owner-publishing-ux | none | none | owner-publishing-ux | none |
| #125 | security-identity-privacy | content-platform-backend, editorial-blocks, security-identity-privacy | none | none | content-platform-backend, editorial-blocks | none |
| #123 | cross-agent-skill-platform, quality-reliability-observability | cross-agent-skill-platform, owner-publishing-ux, quality-reliability-observability, reader-frontend, release-witness | none | none | owner-publishing-ux, reader-frontend, release-witness | none |
| #118 | editorial-blocks, quality-reliability-observability, reader-frontend | editorial-blocks, quality-reliability-observability, reader-frontend, security-identity-privacy | quality-reliability-observability | none | security-identity-privacy | none |

The two quality misses are corrected without dropping any previously selected scope. The nine existing false positives remain; broader route precision and task-text noise are separate gaps. Additional unseen cases are required to measure generalization. All selections remain advisory and non-blocking.

## Frozen evidence and reproduction

The [v2 JSON](routing-v2-results.json) freezes SHA-256 digests for the live router, map, catalog, evaluator, scorer, labelled fixtures and original evaluation evidence. It includes per-skill counts and exact routing reasons. `--check` recomputes these digests and all results and rejects drift; omit it only when intentionally publishing a new reviewed measurement.

The [v1 freeze](forward-freeze.json), [inputs](forward-inputs.json), [labels](forward-labels.json), [blind review](forward-blind-review.json), [results](forward-results.json) and [report](forward-report.md) retain their original bytes. v1 now loads the exact original [router](baseline-v1/routing.mjs), [map](baseline-v1/review-map.yaml) and [catalog](baseline-v1/catalog.yaml), verified against the original freeze keys; historical provenance still uses those original keys.

- `node scripts/agent-skills/evaluate-forward.mjs --check` reproduces v1.
- `node scripts/agent-skills/evaluate-forward.mjs --routing-v2 --check` reproduces this comparison.
- `node scripts/agent-skills/check-v1-completion.mjs --check` verifies the completion contract, including the frozen replay.
