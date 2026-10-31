# Routing v5: recover omitted review surfaces

Classification: internal project documentation. All routing remains advisory and non-blocking.

**Accepted by the predeclared heldout4 bar: keep revision.** Accept only if held-out recall strictly rises and precision does not drop; undefined rates do not pass.

The candidate adds Reader Lab design and preview presentation paths, owner workspace pages and explicit owner-error wording, dedicated concurrency recovery and capture helpers, and lab security paths requiring affirmative guard/session/origin context. The v4 text parser, catalog and skill contracts are unchanged. The plan was recorded from heldout3 before selecting heldout4; synthetic positive and neighboring negative fixtures guided implementation.

Heldout4: 8 PRs × 12 skills = 96 decisions; 14 expected positives, 82 expected negatives.

| Measurement | Frozen v4 | Candidate v5 |
| --- | --- | --- |
| TP / FP / FN / TN | 8 / 4 / 6 / 78 | 10 / 4 / 4 / 78 |
| Selected scopes | 12 | 14 |
| Precision TP/(TP+FP) | 8/12 (66.7%) | 10/14 (71.4%) |
| Recall TP/(TP+FN) | 8/14 (57.1%) | 10/14 (71.4%) |
| False-positive rate FP/(FP+TN) | 4/82 (4.9%) | 4/82 (4.9%) |
| False-negative rate FN/(TP+FN) | 6/14 (42.9%) | 4/14 (28.6%) |
| Exact matches | 2/8 | 2/8 |

| PR | Expected | Selected v4 | False positives | False negatives |
| --- | --- | --- | --- | --- |
| #77 | cross-agent-skill-platform | cross-agent-skill-platform, owner-publishing-ux, security-identity-privacy | owner-publishing-ux, security-identity-privacy | none |
| #81 | content-platform-backend, reader-frontend | content-platform-backend, reader-frontend, security-identity-privacy | security-identity-privacy | none |
| #83 | quality-reliability-observability, reader-frontend | quality-reliability-observability, reader-frontend | none | none |
| #92 | content-platform-backend | content-platform-backend | none | none |
| #108 | quality-reliability-observability | reader-frontend | reader-frontend | quality-reliability-observability |
| #115 | quality-reliability-observability, reader-frontend | reader-frontend | none | quality-reliability-observability |
| #121 | owner-publishing-ux, quality-reliability-observability, reader-frontend | none | none | owner-publishing-ux, quality-reliability-observability, reader-frontend |
| #122 | quality-reliability-observability, reader-frontend | reader-frontend | none | quality-reliability-observability |

| PR | Expected | Selected v5 | False positives | False negatives |
| --- | --- | --- | --- | --- |
| #77 | cross-agent-skill-platform | cross-agent-skill-platform, owner-publishing-ux, security-identity-privacy | owner-publishing-ux, security-identity-privacy | none |
| #81 | content-platform-backend, reader-frontend | content-platform-backend, reader-frontend, security-identity-privacy | security-identity-privacy | none |
| #83 | quality-reliability-observability, reader-frontend | quality-reliability-observability, reader-frontend | none | none |
| #92 | content-platform-backend | content-platform-backend | none | none |
| #108 | quality-reliability-observability | quality-reliability-observability, reader-frontend | reader-frontend | none |
| #115 | quality-reliability-observability, reader-frontend | reader-frontend | none | quality-reliability-observability |
| #121 | owner-publishing-ux, quality-reliability-observability, reader-frontend | reader-frontend | none | owner-publishing-ux, quality-reliability-observability |
| #122 | quality-reliability-observability, reader-frontend | reader-frontend | none | quality-reliability-observability |

| Skill | Expected | v4 TP / FP / FN / TN | v5 TP / FP / FN / TN |
| --- | --- | --- | --- |
| content-platform-backend | 2 | 2 / 0 / 0 / 6 | 2 / 0 / 0 / 6 |
| cross-agent-skill-platform | 1 | 1 / 0 / 0 / 7 | 1 / 0 / 0 / 7 |
| editorial-blocks | 0 | 0 / 0 / 0 / 8 | 0 / 0 / 0 / 8 |
| gas-city-coordinator | 0 | 0 / 0 / 0 / 8 | 0 / 0 / 0 / 8 |
| magazine-product-discovery | 0 | 0 / 0 / 0 / 8 | 0 / 0 / 0 / 8 |
| owner-publishing-ux | 1 | 0 / 1 / 1 / 6 | 0 / 1 / 1 / 6 |
| quality-reliability-observability | 5 | 1 / 0 / 4 / 3 | 2 / 0 / 3 / 3 |
| reader-frontend | 5 | 4 / 1 / 1 / 2 | 5 / 1 / 0 / 2 |
| release-witness | 0 | 0 / 0 / 0 / 8 | 0 / 0 / 0 / 8 |
| security-identity-privacy | 0 | 0 / 2 / 0 / 6 | 0 / 2 / 0 / 6 |
| seo-distribution | 0 | 0 / 0 / 0 / 8 | 0 / 0 / 0 / 8 |
| stack-research-adr | 0 | 0 / 0 / 0 / 8 | 0 / 0 / 0 / 8 |

## forward — previously seen, reference only

5 PRs × 12 skills = 60 decisions. TP / FP / FN / TN: 9 / 4 / 0 / 47. Precision 9/13 (69.2%); recall 9/9 (100.0%). These unchanged labels do not decide acceptance.

| PR | Expected | Selected v5 | False positives | False negatives |
| --- | --- | --- | --- | --- |
| #130 | quality-reliability-observability, reader-frontend | quality-reliability-observability, reader-frontend | none | none |
| #128 | content-platform-backend | content-platform-backend | none | none |
| #125 | security-identity-privacy | content-platform-backend, security-identity-privacy | content-platform-backend | none |
| #123 | cross-agent-skill-platform, quality-reliability-observability | cross-agent-skill-platform, owner-publishing-ux, quality-reliability-observability, reader-frontend, release-witness | owner-publishing-ux, reader-frontend, release-witness | none |
| #118 | editorial-blocks, quality-reliability-observability, reader-frontend | editorial-blocks, quality-reliability-observability, reader-frontend | none | none |

## heldout — previously seen, reference only

8 PRs × 12 skills = 96 decisions. TP / FP / FN / TN: 15 / 6 / 1 / 74. Precision 15/21 (71.4%); recall 15/16 (93.8%). These unchanged labels do not decide acceptance.

| PR | Expected | Selected v5 | False positives | False negatives |
| --- | --- | --- | --- | --- |
| #80 | security-identity-privacy | content-platform-backend, editorial-blocks, reader-frontend, security-identity-privacy | content-platform-backend, editorial-blocks, reader-frontend | none |
| #89 | content-platform-backend, editorial-blocks, quality-reliability-observability, reader-frontend, security-identity-privacy, seo-distribution | content-platform-backend, editorial-blocks, quality-reliability-observability, reader-frontend, security-identity-privacy, seo-distribution | none | none |
| #98 | security-identity-privacy | stack-research-adr | stack-research-adr | security-identity-privacy |
| #113 | quality-reliability-observability, reader-frontend | quality-reliability-observability, reader-frontend | none | none |
| #117 | editorial-blocks, quality-reliability-observability, reader-frontend | editorial-blocks, quality-reliability-observability, reader-frontend | none | none |
| #120 | content-platform-backend | content-platform-backend | none | none |
| #132 | security-identity-privacy | quality-reliability-observability, release-witness, security-identity-privacy | quality-reliability-observability, release-witness | none |
| #134 | quality-reliability-observability | quality-reliability-observability | none | none |

## heldout2 — previously seen, reference only

8 PRs × 12 skills = 96 decisions. TP / FP / FN / TN: 13 / 2 / 2 / 79. Precision 13/15 (86.7%); recall 13/15 (86.7%). These unchanged labels do not decide acceptance.

| PR | Expected | Selected v5 | False positives | False negatives |
| --- | --- | --- | --- | --- |
| #84 | content-platform-backend | content-platform-backend | none | none |
| #91 | editorial-blocks, quality-reliability-observability, reader-frontend, security-identity-privacy | editorial-blocks, quality-reliability-observability, reader-frontend | none | security-identity-privacy |
| #112 | quality-reliability-observability, reader-frontend | quality-reliability-observability, reader-frontend | none | none |
| #119 | security-identity-privacy | security-identity-privacy, stack-research-adr | stack-research-adr | none |
| #124 | quality-reliability-observability | quality-reliability-observability | none | none |
| #126 | content-platform-backend, quality-reliability-observability, security-identity-privacy | content-platform-backend, quality-reliability-observability, release-witness | release-witness | security-identity-privacy |
| #127 | cross-agent-skill-platform | cross-agent-skill-platform | none | none |
| #129 | quality-reliability-observability, reader-frontend | quality-reliability-observability, reader-frontend | none | none |

## heldout3 — previously seen, reference only

8 PRs × 12 skills = 96 decisions. TP / FP / FN / TN: 17 / 3 / 0 / 76. Precision 17/20 (85.0%); recall 17/17 (100.0%). These unchanged labels do not decide acceptance.

| PR | Expected | Selected v5 | False positives | False negatives |
| --- | --- | --- | --- | --- |
| #75 | content-platform-backend, owner-publishing-ux | content-platform-backend, owner-publishing-ux, security-identity-privacy | security-identity-privacy | none |
| #76 | cross-agent-skill-platform | cross-agent-skill-platform | none | none |
| #79 | content-platform-backend, quality-reliability-observability | content-platform-backend, quality-reliability-observability | none | none |
| #82 | cross-agent-skill-platform | cross-agent-skill-platform, release-witness, seo-distribution | release-witness, seo-distribution | none |
| #88 | quality-reliability-observability, reader-frontend | quality-reliability-observability, reader-frontend | none | none |
| #90 | owner-publishing-ux, reader-frontend, security-identity-privacy | owner-publishing-ux, reader-frontend, security-identity-privacy | none | none |
| #100 | editorial-blocks, quality-reliability-observability, reader-frontend | editorial-blocks, quality-reliability-observability, reader-frontend | none | none |
| #114 | editorial-blocks, quality-reliability-observability, reader-frontend | editorial-blocks, quality-reliability-observability, reader-frontend | none | none |

## Method and limits

Eight purposively selected unused PRs were labelled from local merged diffs and canonical trigger contracts before either prediction. The same worker labelled and implemented; labels were visible during revision. This is not an independent blind review, a random sample or a population accuracy estimate. Route changes were planned from heldout3 and tested with synthetic fixtures; heldout4 was not used for tuning.

Labels frozen: 2026-10-30T17:01:20Z. Candidate frozen: 2026-10-30T17:06:50Z. The initial measurement ran each frozen router once per heldout4 PR, receiving only paths and title/body. Subsequent --check executions are deterministic replays, not new trials. No retuning or relabelling followed the first measurement.

Positive-label gaps across all five samples: gas-city-coordinator, magazine-product-discovery, release-witness, stack-research-adr. No synthetic fixture fills these real-change gaps. A small purposive sample cannot establish general accuracy; broad path rules, unfamiliar wording and lexical negation remain limitations. Advice usefulness and provider comparisons were not measured.

All earlier artifacts remain byte-identical. Historical v4 report wording about live disposition describes its original publication: v4 --check now validates its snapshots and recorded outputs alone, as v1-v3 do. Coverage --check still uses frozen v4. Only v5 --check enforces the current accepted/rejected live disposition.

The [label freeze](heldout4-freeze.json) pins inputs, labels, selection, diff evidence, v4 baseline, prior samples and historical artifacts. The [candidate freeze](routing-v5-freeze.json) pins snapshots and the label freeze. Build digests are provenance, not a requirement that future live evaluators stay unchanged. [Results](routing-v5-results.json) include all case matches and per-skill denominators. The [worklog](../worklog/blog-n4y6.12.md) records the diagnosis, red-first fixtures and freeze chronology.

- `node scripts/agent-skills/evaluate-forward.mjs --routing-v5 --check` replays v5 and verifies live disposition.
- Earlier replays: `--check`, `--routing-v2 --check`, `--routing-v3 --check`, `--routing-v4 --check`, `--coverage --check`.
