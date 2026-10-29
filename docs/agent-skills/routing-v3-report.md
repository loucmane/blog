# Routing v3: contextual shared paths

**Accepted by the predeclared held-out bar: keep revision.** Accept only if held-out recall and precision do not drop; undefined rates do not pass.

Shared layout/page paths require affirmative metadata or distribution context for SEO review. The document validator requires domain context separately for backend data, block contracts and sanitization. Framework configuration requires security/privacy context for security review. Dedicated paths and standalone task-text matching retain their previous behavior. Multiple justified domains can still match.

Held-out denominators: 8 PRs × 12 skills = 96 binary decisions; 16 expected positives, 80 expected negatives. Selected scopes: v2 22, v3 22.

| Measurement | Frozen v2 | Candidate v3 |
| --- | --- | --- |
| truePositives | 15 | 15 |
| falsePositives | 7 | 7 |
| falseNegatives | 1 | 1 |
| trueNegatives | 73 | 73 |
| Precision: TP/(TP+FP) | 15/22 (68.2%) | 15/22 (68.2%) |
| Recall: TP/(TP+FN) | 15/16 (93.8%) | 15/16 (93.8%) |
| False-positive rate | 7/80 (8.8%) | 7/80 (8.8%) |
| False-negative rate | 1/16 (6.3%) | 1/16 (6.3%) |
| Exact-match PRs | 4/8 | 4/8 |

| PR | Expected | Selected v2 | Selected v3 | v3 FP | v3 FN |
| --- | --- | --- | --- | --- | --- |
| #80 | security-identity-privacy | content-platform-backend, editorial-blocks, reader-frontend, security-identity-privacy | content-platform-backend, editorial-blocks, reader-frontend, security-identity-privacy | content-platform-backend, editorial-blocks, reader-frontend | none |
| #89 | content-platform-backend, editorial-blocks, quality-reliability-observability, reader-frontend, security-identity-privacy, seo-distribution | content-platform-backend, editorial-blocks, quality-reliability-observability, reader-frontend, security-identity-privacy, seo-distribution | content-platform-backend, editorial-blocks, quality-reliability-observability, reader-frontend, security-identity-privacy, seo-distribution | none | none |
| #98 | security-identity-privacy | stack-research-adr | stack-research-adr | stack-research-adr | security-identity-privacy |
| #113 | quality-reliability-observability, reader-frontend | quality-reliability-observability, reader-frontend | quality-reliability-observability, reader-frontend | none | none |
| #117 | editorial-blocks, quality-reliability-observability, reader-frontend | editorial-blocks, owner-publishing-ux, quality-reliability-observability, reader-frontend | editorial-blocks, owner-publishing-ux, quality-reliability-observability, reader-frontend | owner-publishing-ux | none |
| #120 | content-platform-backend | content-platform-backend | content-platform-backend | none | none |
| #132 | security-identity-privacy | quality-reliability-observability, release-witness, security-identity-privacy | quality-reliability-observability, release-witness, security-identity-privacy | quality-reliability-observability, release-witness | none |
| #134 | quality-reliability-observability | quality-reliability-observability | quality-reliability-observability | none | none |

## Original five PRs (reference only)

These five PRs informed the revision and do not decide acceptance. Labels are unchanged. Across 5 PRs and 60 decisions, v3 has 9 TP, 6 FP, 0 FN and 45 TN. Precision 9/15 (60.0%); recall 9/9 (100.0%).

| PR | Expected | Selected v3 | FP | FN |
| --- | --- | --- | --- | --- |
| #130 | quality-reliability-observability, reader-frontend | owner-publishing-ux, quality-reliability-observability, reader-frontend | owner-publishing-ux | none |
| #128 | content-platform-backend | content-platform-backend, owner-publishing-ux | owner-publishing-ux | none |
| #125 | security-identity-privacy | content-platform-backend, security-identity-privacy | content-platform-backend | none |
| #123 | cross-agent-skill-platform, quality-reliability-observability | cross-agent-skill-platform, owner-publishing-ux, quality-reliability-observability, reader-frontend, release-witness | owner-publishing-ux, reader-frontend, release-witness | none |
| #118 | editorial-blocks, quality-reliability-observability, reader-frontend | editorial-blocks, quality-reliability-observability, reader-frontend | none | none |

## Method and limits

Eight real merged PRs were selected for diverse behavior from the coordinator-exported candidates, excluding the original five. Five have one expected skill. The same worker inspected their diffs and trigger contracts and sealed the expected labels before any routing. Labels were visible during implementation: this is a held-out prediction sample, not an independent blind review, random sample, or population accuracy estimate. No advice-usefulness review was performed.

Label freeze: 2026-10-29T17:26:53.211824+00:00. Candidate freeze: 2026-10-29T17:42:41.979610+00:00. Both routers were measured once for the initial comparison. Subsequent --check executions only replay the sealed candidate and labels; no held-out-driven tuning or relabelling is permitted.

7 held-out false positives and 1 false negatives remain. Context is inferred from title/body phrases, not parsed diffs: boilerplate, negation and historical mentions can still introduce noise. Dedicated broad reader/backend paths can still over-select on sanitization-only changes. The small sample does not exercise every conditional route; paired synthetic fixtures cover layout recovery/metadata and document sanitization/block-contract distinctions. Passing the non-regression bar does not establish that all overlap is justified. All selections remain advisory and non-blocking.

## Frozen evidence and replay

The [v2 snapshot](baseline-v2/freeze.json) preserves the router, map, catalog and every historical report hash input. Original forward-* and routing-v2-* artifacts retain their bytes. The [held-out freeze](heldout-freeze.json) seals [inputs](heldout-inputs.json), [labels](heldout-labels.json) and [diff evidence](heldout-diff-evidence.json); its routersRun=false field records the time of freezing, not the current execution state.

The [v3 freeze](routing-v3-freeze.json) seals exact copies of the candidate router/map/catalog plus the evaluator, scorer and paired fixtures before predictions. Keeping a candidate copy makes a rejected revision replayable after reverting live routes. The [v3 results](routing-v3-results.json) include both held-out per-skill counts and per-case match reasons, original-five reference results and SHA-256 provenance. --check also verifies that live router/map bytes agree with the keep/revert decision.

- `node scripts/agent-skills/evaluate-forward.mjs --check` replays v1.
- `node scripts/agent-skills/evaluate-forward.mjs --routing-v2 --check` replays frozen v2.
- `node scripts/agent-skills/evaluate-forward.mjs --routing-v3 --check` replays this comparison.
