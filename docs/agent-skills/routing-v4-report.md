# Routing v4: task intent and contextual noise

**Accepted by the predeclared heldout2 bar: keep revision.** Accept only if held-out recall and precision do not drop; undefined rates do not pass.

The router extracts affirmative clauses from task prose. It ignores verification/review/history sections, fences, quotes and comments; scopes exclusions to one clause; and requires owner context for generic owner-UX words such as revisions, validation and recovery. Dedicated path routing is unchanged. Shared-path context also uses the filtered affirmative clauses. Full lexical semantics and limitations are documented beside taskIntentUnits in the router snapshot.

Heldout2 denominators: 8 PRs × 12 skills = 96 binary decisions; 15 expected positives and 81 expected negatives. Selected: v3 18, v4 15.

| Measurement | Frozen v3 | Candidate v4 | Change |
| --- | --- | --- | --- |
| truePositives | 13 | 13 | 0 |
| falsePositives | 5 | 2 | -3 |
| falseNegatives | 2 | 2 | 0 |
| trueNegatives | 76 | 79 | 3 |
| exactMatches | 2 | 5 | 3 |
| missedRoutingCases | 2 | 2 | 0 |
| whollyMissedCases | 0 | 0 | 0 |
| Precision TP/(TP+FP) | 13/18 (72.2%) | 13/15 (86.7%) | 14.4% points |
| Recall TP/(TP+FN) | 13/15 (86.7%) | 13/15 (86.7%) | 0.0% points |
| False-positive rate FP/(FP+TN) | 5/81 (6.2%) | 2/81 (2.5%) | |
| False-negative rate FN/(TP+FN) | 2/15 (13.3%) | 2/15 (13.3%) | |

| PR | Selected v3 | Selected v4 | Removed | Added |
| --- | --- | --- | --- | --- |
| #84 | content-platform-backend | content-platform-backend | none | none |
| #91 | editorial-blocks, quality-reliability-observability, reader-frontend | editorial-blocks, quality-reliability-observability, reader-frontend | none | none |
| #112 | owner-publishing-ux, quality-reliability-observability, reader-frontend | quality-reliability-observability, reader-frontend | owner-publishing-ux | none |
| #119 | security-identity-privacy, stack-research-adr | security-identity-privacy, stack-research-adr | none | none |
| #124 | quality-reliability-observability | quality-reliability-observability | none | none |
| #126 | content-platform-backend, quality-reliability-observability, release-witness | content-platform-backend, quality-reliability-observability, release-witness | none | none |
| #127 | cross-agent-skill-platform, owner-publishing-ux | cross-agent-skill-platform | owner-publishing-ux | none |
| #129 | owner-publishing-ux, quality-reliability-observability, reader-frontend | quality-reliability-observability, reader-frontend | owner-publishing-ux | none |

| PR | Expected | Selected v4 | False positives | False negatives |
| --- | --- | --- | --- | --- |
| #84 | content-platform-backend | content-platform-backend | none | none |
| #91 | editorial-blocks, quality-reliability-observability, reader-frontend, security-identity-privacy | editorial-blocks, quality-reliability-observability, reader-frontend | none | security-identity-privacy |
| #112 | quality-reliability-observability, reader-frontend | quality-reliability-observability, reader-frontend | none | none |
| #119 | security-identity-privacy | security-identity-privacy, stack-research-adr | stack-research-adr | none |
| #124 | quality-reliability-observability | quality-reliability-observability | none | none |
| #126 | content-platform-backend, quality-reliability-observability, security-identity-privacy | content-platform-backend, quality-reliability-observability, release-witness | release-witness | security-identity-privacy |
| #127 | cross-agent-skill-platform | cross-agent-skill-platform | none | none |
| #129 | quality-reliability-observability, reader-frontend | quality-reliability-observability, reader-frontend | none | none |

## Original five PRs — previously seen, reference only

These cases do not decide acceptance. Across 5 PRs and 60 decisions: 9 TP, 4 FP, 0 FN, 47 TN. Precision 9/13 (69.2%); recall 9/9 (100.0%). Labels are unchanged.

| PR | Expected | Selected v4 | False positives | False negatives |
| --- | --- | --- | --- | --- |
| #130 | quality-reliability-observability, reader-frontend | quality-reliability-observability, reader-frontend | none | none |
| #128 | content-platform-backend | content-platform-backend | none | none |
| #125 | security-identity-privacy | content-platform-backend, security-identity-privacy | content-platform-backend | none |
| #123 | cross-agent-skill-platform, quality-reliability-observability | cross-agent-skill-platform, owner-publishing-ux, quality-reliability-observability, reader-frontend, release-witness | owner-publishing-ux, reader-frontend, release-witness | none |
| #118 | editorial-blocks, quality-reliability-observability, reader-frontend | editorial-blocks, quality-reliability-observability, reader-frontend | none | none |

## Previous held-out eight PRs — previously seen, reference only

These cases do not decide acceptance. Across 8 PRs and 96 decisions: 15 TP, 6 FP, 1 FN, 74 TN. Precision 15/21 (71.4%); recall 15/16 (93.8%). Labels are unchanged.

| PR | Expected | Selected v4 | False positives | False negatives |
| --- | --- | --- | --- | --- |
| #80 | security-identity-privacy | content-platform-backend, editorial-blocks, reader-frontend, security-identity-privacy | content-platform-backend, editorial-blocks, reader-frontend | none |
| #89 | content-platform-backend, editorial-blocks, quality-reliability-observability, reader-frontend, security-identity-privacy, seo-distribution | content-platform-backend, editorial-blocks, quality-reliability-observability, reader-frontend, security-identity-privacy, seo-distribution | none | none |
| #98 | security-identity-privacy | stack-research-adr | stack-research-adr | security-identity-privacy |
| #113 | quality-reliability-observability, reader-frontend | quality-reliability-observability, reader-frontend | none | none |
| #117 | editorial-blocks, quality-reliability-observability, reader-frontend | editorial-blocks, quality-reliability-observability, reader-frontend | none | none |
| #120 | content-platform-backend | content-platform-backend | none | none |
| #132 | security-identity-privacy | quality-reliability-observability, release-witness, security-identity-privacy | quality-reliability-observability, release-witness | none |
| #134 | quality-reliability-observability | quality-reliability-observability | none | none |

## Method, evidence and limits

Eight real merged PRs were chosen from 47 coordinator-exported unused candidates to span different skill combinations. All carry verification prose; several reference earlier work. Labels were assigned from local merged diffs and catalog trigger contracts before either prediction, then frozen. The same worker labelled and implemented: labels were visible during revision. This is not an independent blind review, a random sample, or a population accuracy estimate. No advice-usefulness assessment was performed.

Label freeze: 2026-10-30T14:27:40.962706+00:00. Candidate freeze: 2026-10-30T14:36:07.180801+00:00. Both routers ran once for the initial heldout2 measurement. Later --check calls replay the sealed inputs and candidate without retuning or relabelling.

2 false positives and 2 false negatives remain on heldout2. Per-skill counts and every match reason are in the JSON. Broad path matches remain possible false positives; text matching does not parse diffs or understand arbitrary grammar. It can miss intent expressed only in ignored sections, indirect context, or unfamiliar wording. Clause-local exclusions deliberately retain independently stated domains. Passing this bar does not prove perfect routing or generalization. All routes remain advisory and non-blocking.

The [labels](heldout2-labels.json), [inputs](heldout2-inputs.json) and [label freeze](heldout2-freeze.json) precede the [candidate freeze](routing-v4-freeze.json), which pins the router, map and catalog snapshots. The [results](routing-v4-results.json) contain both predictions, denominators and reference samples. Evaluator/scorer/fixture digests record build provenance; snapshot and sample hashes govern replay. Freeze flags describe the time of sealing, not current execution state.

All v1/v2/v3 artifacts retain their original bytes. Historical v3 report wording about checking the live disposition describes its original publication; its replay now verifies frozen snapshots only, as v1/v2 do. v4 --check verifies its recorded results and the current keep/revert disposition.

- `node scripts/agent-skills/evaluate-forward.mjs --check` replays v1.
- `node scripts/agent-skills/evaluate-forward.mjs --routing-v2 --check` replays v2.
- `node scripts/agent-skills/evaluate-forward.mjs --routing-v3 --check` replays v3.
- `node scripts/agent-skills/evaluate-forward.mjs --routing-v4 --check` replays v4 and verifies live disposition.
