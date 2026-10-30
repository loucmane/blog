# Persisted output and real-change routing coverage

Classification: internal project documentation. Measurement only; all routing remains advisory and non-blocking. No routes were changed.

12 registered skills have persisted schema-valid examples. Across all four samples, 8/12 skills have an expected positive. Remaining positive-label gaps: gas-city-coordinator, magazine-product-discovery, release-witness, stack-research-adr. These gaps remain open; there is no approved exception or claim of complete capability coverage.

## Heldout3 prediction

The eight labels were sealed at 2026-10-30T15:43:32Z before prediction. The first measurement used the unchanged live router, verified byte-identical to the frozen v4 router/map/catalog. Replays use that snapshot.

Denominators: 8 PRs × 12 skills = 96 binary decisions; 17 expected positives, 79 expected negatives, 12 selected scopes.

| Metric | Result |
| --- | --- |
| TP / FP / FN / TN | 9 / 3 / 8 / 76 |
| Precision TP/(TP+FP) | 9/12 = 75.0% |
| Recall TP/(TP+FN) | 9/17 = 52.9% |
| False-positive rate FP/(FP+TN) | 3/79 = 3.8% |
| False-negative rate FN/(TP+FN) | 8/17 = 47.1% |
| Exact matches | 2/8 |
| PRs missing at least one expected scope | 5/8 |

| PR | Expected | Selected | False positives | False negatives |
| --- | --- | --- | --- | --- |
| #75 | content-platform-backend, owner-publishing-ux | content-platform-backend, security-identity-privacy | security-identity-privacy | owner-publishing-ux |
| #76 | cross-agent-skill-platform | cross-agent-skill-platform | none | none |
| #79 | content-platform-backend, quality-reliability-observability | content-platform-backend | none | quality-reliability-observability |
| #82 | cross-agent-skill-platform | cross-agent-skill-platform, release-witness, seo-distribution | release-witness, seo-distribution | none |
| #88 | quality-reliability-observability, reader-frontend | none | none | quality-reliability-observability, reader-frontend |
| #90 | owner-publishing-ux, reader-frontend, security-identity-privacy | none | none | owner-publishing-ux, reader-frontend, security-identity-privacy |
| #100 | editorial-blocks, quality-reliability-observability, reader-frontend | editorial-blocks, reader-frontend | none | quality-reliability-observability |
| #114 | editorial-blocks, quality-reliability-observability, reader-frontend | editorial-blocks, quality-reliability-observability, reader-frontend | none | none |

## Per-skill counts across four samples

All columns use the same frozen v4 router. The original five, heldout and heldout2 are previously seen reference cases, not new holdouts. Their original reports and labels are unchanged. Aggregate denominator: 29 distinct PRs × 12 skills = 348 decisions; each skill has 29 decisions. Each cell below is TP / FP / FN / TN.

| Skill | v1 five (5) | heldout (8) | heldout2 (8) | heldout3 (8) | All (29) | Aggregate recall |
| --- | --- | --- | --- | --- | --- | --- |
| content-platform-backend | 1 / 1 / 0 / 3 | 2 / 1 / 0 / 5 | 2 / 0 / 0 / 6 | 2 / 0 / 0 / 6 | 7 / 2 / 0 / 20 | 7/7 (100.0%) |
| cross-agent-skill-platform | 1 / 0 / 0 / 4 | 0 / 0 / 0 / 8 | 1 / 0 / 0 / 7 | 2 / 0 / 0 / 6 | 4 / 0 / 0 / 25 | 4/4 (100.0%) |
| editorial-blocks | 1 / 0 / 0 / 4 | 2 / 1 / 0 / 5 | 1 / 0 / 0 / 7 | 2 / 0 / 0 / 6 | 6 / 1 / 0 / 22 | 6/6 (100.0%) |
| gas-city-coordinator | 0 / 0 / 0 / 5 | 0 / 0 / 0 / 8 | 0 / 0 / 0 / 8 | 0 / 0 / 0 / 8 | 0 / 0 / 0 / 29 | 0/0 (undefined (no denominator)) |
| magazine-product-discovery | 0 / 0 / 0 / 5 | 0 / 0 / 0 / 8 | 0 / 0 / 0 / 8 | 0 / 0 / 0 / 8 | 0 / 0 / 0 / 29 | 0/0 (undefined (no denominator)) |
| owner-publishing-ux | 0 / 1 / 0 / 4 | 0 / 0 / 0 / 8 | 0 / 0 / 0 / 8 | 0 / 0 / 2 / 6 | 0 / 1 / 2 / 26 | 0/2 (0.0%) |
| quality-reliability-observability | 3 / 0 / 0 / 2 | 4 / 1 / 0 / 3 | 5 / 0 / 0 / 3 | 1 / 0 / 3 / 4 | 13 / 1 / 3 / 12 | 13/16 (81.3%) |
| reader-frontend | 2 / 1 / 0 / 2 | 3 / 1 / 0 / 4 | 3 / 0 / 0 / 5 | 2 / 0 / 2 / 4 | 10 / 2 / 2 / 15 | 10/12 (83.3%) |
| release-witness | 0 / 1 / 0 / 4 | 0 / 1 / 0 / 7 | 0 / 1 / 0 / 7 | 0 / 1 / 0 / 7 | 0 / 4 / 0 / 25 | 0/0 (undefined (no denominator)) |
| security-identity-privacy | 1 / 0 / 0 / 4 | 3 / 0 / 1 / 4 | 1 / 0 / 2 / 5 | 0 / 1 / 1 / 6 | 5 / 1 / 4 / 19 | 5/9 (55.6%) |
| seo-distribution | 0 / 0 / 0 / 5 | 1 / 0 / 0 / 7 | 0 / 0 / 0 / 8 | 0 / 1 / 0 / 7 | 1 / 1 / 0 / 27 | 1/1 (100.0%) |
| stack-research-adr | 0 / 0 / 0 / 5 | 0 / 1 / 0 / 7 | 0 / 1 / 0 / 7 | 0 / 0 / 0 / 8 | 0 / 2 / 0 / 27 | 0/0 (undefined (no denominator)) |

## Selection and remaining gaps

The 39 supplied candidates were screened before routing. Owner UX was previously absent and is now expected for #75 (upload validation/error recovery) and #90 (private comparison workflow). Cross-agent-skill-platform already had positives in #123 and #127. New #76 and #82 probe domain-name noise. #88 tests a design document; #79, #100 and #114 broaden recovery, rendering and browser-measurement combinations.

- **magazine-product-discovery:** The pool offers Reader Lab specifications and implementations, not owner/reader discovery or product requirements reconciliation. PR 88 open design questions do not establish discovery.
- **stack-research-adr:** No candidate makes a technology comparison or ADR decision. Font selection and references to existing PostgreSQL requirements are not stack research.
- **gas-city-coordinator:** PR 76 fixes skill-platform discovery for Gas City installations; it does not plan dispatch or reconcile Beads work. Other candidates only mention coordinator activity in review history.
- **release-witness:** PR 82 authors the skill rather than applying it to a release. Routine host-check prose in the other candidates is not a release-evidence deliverable.

Further samples need actual product discovery, technology decisions, native work coordination and release-evidence deliverables. A synthetic fixture or negative decision does not fill those positive-label gaps. No synthetic change was substituted for a real PR.

## Evidence limits and replay

Labels were assigned from diffs and trigger contracts by the same worker that implemented this measurement, before seeing predictions. They are independent of router output, but there was no independent second labeller or blind review. The purposive sample is prospective only with respect to prediction: its changes were already merged. It is not a population accuracy estimate, model/provider comparison or advice-usefulness assessment. A positive skill label does not test every catalog capability.

The [inventory](coverage-inventory.md) records canonical paths, relative Codex links, capabilities, examples and expected-positive PRs. The [selection](heldout3-selection.json), [diff evidence](heldout3-diff-evidence.json), [labels](heldout3-labels.json), [inputs](heldout3-inputs.json) and [freeze](heldout3-freeze.json) retain provenance. The [results](coverage-results.json) include all denominators, per-skill counts and router match reasons. Freeze flags describe sealing time, not present execution state.

Existing actual per-skill envelopes remain unchanged in `advice-v2-review.json`; their exact references and identities are indexed in the results. The older `forward-blind-review.json` remains a partial advice bundle. The two new persisted fixtures are explicitly synthetic and do not invent historical reviews. This measurement adds no advice scores or review identities.

- `node scripts/agent-skills/coverage-inventory.mjs --check` verifies the live inventory.
- `node scripts/agent-skills/evaluate-forward.mjs --coverage --check` replays frozen coverage.
- Existing v1/v2/v3/v4 replay commands retain their historical outputs.
