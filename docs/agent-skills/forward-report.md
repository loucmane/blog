# Five-PR skill routing evaluation

This offline replay uses five real merged PRs selected to span reader accessibility, portability, sanitization, skill infrastructure and font performance. Expected scopes were labelled before the shared router ran on these PRs. A separate agent received the PR inputs and frozen router, without labels or scorer results, and applied each selected skill to the local diff. This is retrospective dogfood, not a prospective or statistically representative estimate of future accuracy.

Across 5 PRs and 60 binary PR/skill decisions: **7 true positives, 9 false positives, 2 false negatives, 42 true negatives**. Precision 43.8%; recall 77.8%. False-positive rate 17.6%; false-negative rate 22.2%.

Exact matches: 0/5. Missed routing (at least one expected skill absent): 2/5; wholly missed (no skill selected): 0/5. Unusable advice: 2/16 selected-skill assessments (12.5%), with 2 findings. Advice usefulness is the blind reviewer's subjective assessment, not a deterministic correctness guarantee.

| PR | Expected | Selected | False positives | False negatives |
| --- | --- | --- | --- | --- |
| #130 | quality-reliability-observability, reader-frontend | owner-publishing-ux, reader-frontend, seo-distribution | owner-publishing-ux, seo-distribution | quality-reliability-observability |
| #128 | content-platform-backend | content-platform-backend, owner-publishing-ux | owner-publishing-ux | none |
| #125 | security-identity-privacy | content-platform-backend, editorial-blocks, security-identity-privacy | content-platform-backend, editorial-blocks | none |
| #123 | cross-agent-skill-platform, quality-reliability-observability | cross-agent-skill-platform, owner-publishing-ux, quality-reliability-observability, reader-frontend, release-witness | owner-publishing-ux, reader-frontend, release-witness | none |
| #118 | editorial-blocks, quality-reliability-observability, reader-frontend | editorial-blocks, reader-frontend, security-identity-privacy | security-identity-privacy | quality-reliability-observability |

## Advice findings

- PR #130, seo-distribution: The route matches app/layout.tsx because that file also owns metadata, but the actual diff only wraps children in ReaderRecoveryScope and adds null-rendering recovery markers. SEO workflow steps concern URL/discovery semantics that this patch does not change, so applying them yields no substantive distribution recommendation for this PR. Evidence: `.claude/skills/seo-distribution/SKILL.md#Review workflow`, `.claude/skills/seo-distribution/references/code-map.md#Existing surfaces`, `d67f2a4901e27c68890f5f59febe1e14eb605bb1:packages/web/src/app/layout.tsx#RootLayout diff`, `d67f2a4901e27c68890f5f59febe1e14eb605bb1:packages/web/src/reader/components/failure-boundary.tsx#ReaderRecoveryMarker`.
- PR #128, owner-publishing-ux: The only routing evidence is the PR-body word revisions. The complete two-file diff adds backend collection validation and repository-isolation tests. Owner-publishing-ux requires an owner intent, state transition, feedback and recovery journey; none is changed or specified here, so applying that workflow would invent an owner surface. Evidence: `.claude/skills/owner-publishing-ux/SKILL.md#Trigger Contract`, `.claude/skills/owner-publishing-ux/references/owner-publishing-ux-output-contract.md#Revisions And Destructive Actions`, `40ff98db88acfb543bccfc1e2a0a5de7eb52aaa1:packages/web/src/server/content/portability.ts#inspectPortableContentBundle`, `40ff98db88acfb543bccfc1e2a0a5de7eb52aaa1:packages/web/src/server/content/portability.test.ts`.

## Interpretation and limits

The fixed labels and blind reviewer use distinct judgments: 7 of 9 selections outside the expected set still yielded usable adjacent-scope advice. Those remain false positives under the original labels; they are not relabelled after seeing output. The reviewer also recorded possible missing scopes separately in the blind artifact. This disagreement makes label scope a follow-up discussion, not evidence that all extra advice is wrong.

Path routes intentionally preserve overlaps; broad paths can select a skill whose domain did not change. Task-text matching uses existing trigger vocabulary over the title and full body, so verification boilerplate, historical references and whole-text exclusions can introduce noise or hide relevant scopes. The frozen routes were not tuned to these outcomes. Treat misses and unusable guidance as revision candidates; rerun a new labelled evaluation after any routing change.

All findings remain advisory and non-blocking. Skill selection grants no execution, merge or deployment authority. Only independently verified deterministic checks in the catalog allowlist are blocking-eligible; a subjective review score never becomes a gate.

Precision = TP/(TP+FP); recall = TP/(TP+FN); false-positive rate = FP/(FP+TN); false-negative rate = FN/(TP+FN). The denominator is the full registered skill set for each PR, not only selected skills. Unusable-advice rate counts unusable selected-skill assessments; the finding count is reported separately. Zero denominators are null in JSON, never invented zero measurements.

Evidence: [fixed labels](forward-labels.json), [PR inputs](forward-inputs.json), [freeze digests](forward-freeze.json), [blind advice and routing](forward-blind-review.json), [machine-readable results](forward-results.json). Per-skill counts in the results expose skills absent from this small sample. No model provider comparison or exhaustive security, accessibility, browser or performance audit was performed.

Reproduce offline with `node scripts/agent-skills/evaluate-forward.mjs --check`; omit `--check` to regenerate the results and this report. Hash checks refuse changed inputs, labels or routing rules. Human advice is preserved as recorded evidence, not regenerated by the deterministic scorer.
