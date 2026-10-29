# Skill suite v1 completion and post-v1 gaps

**v1 complete: yes**

This verdict covers the seven accepted criteria for the registered project skill suite. A missing or uncheckable criterion prevents completion. It is not approval to promote subjective findings, merge, publish externally, or execute a workflow.

Generated offline by `node scripts/agent-skills/check-v1-completion.mjs` from the current files and [gap proposals](v1-gaps.json). [Machine-readable verdict](v1-completion.json). No clock, model call or network lookup is used. Managed Gas City skills are governed by the existing Git-ignore-aware platform validator.

| ID | Criterion | Status | Evidence and detail | Proposed gaps |
| --- | --- | --- | --- | --- |
| a | Every registered skill has a canonical SKILL.md and a resolving relative Codex link. | pass | 12 registered skills have canonical entrypoints and resolving relative Codex links. Unregistered entries are checked by criterion b. Evidence: `config/agent-skills/catalog.yaml`, `.claude/skills/`, `.agents/skills/` | [gap-capability-coverage](#gap-capability-coverage), [gap-platform-host-evidence](#gap-platform-host-evidence) |
| b | The catalog and routing/review map validate through the existing platform contract. | pass | 12 skills, 12 routes and 0 upstream lock entries validate. Evidence: `node scripts/agent-skills/validate-platform.mjs`, `scripts/agent-skills/lib.mjs`, `scripts/agent-skills/routing.mjs`, `config/agent-skills/catalog.yaml`, `config/agent-skills/review-map.yaml` | [gap-platform-host-evidence](#gap-platform-host-evidence) |
| c | Recorded structured review outputs are accepted by the review-result ingestion contract. | pass | 10 recorded per-skill envelopes pass validation and in-memory Beads/worklog ingestion planning through buildBeadsIngestPlan. 5 forward containers are evaluation/provenance records, not ingestible per-skill envelopes; embedded blind advice passes the evaluation contract. The dry run used a synthetic bead ID; no Gas City call or evidence write was made. Skills without a persisted envelope: cross-agent-skill-platform, gas-city-coordinator. Evidence: `tests/agent-skills/fixtures/`, `node scripts/agent-skills/validate-review-result.mjs <result.json>`, `node scripts/agent-skills/ingest-result.mjs reports/agent-skills/<result>.json --bead <id>`, `scripts/agent-skills/lib.mjs`, `docs/agent-skills/forward-blind-review.json`, `docs/agent-skills/forward-results.json` | [gap-unusable-advice](#gap-unusable-advice), [gap-capability-coverage](#gap-capability-coverage), [gap-current-ingestion-sink](#gap-current-ingestion-sink), [gap-review-schema-parity](#gap-review-schema-parity), [gap-deterministic-evidence](#gap-deterministic-evidence) |
| d | Five distinct real-PR dogfood records reproduce through evaluate-forward.mjs. | pass | Five frozen coordinator-supplied merged PRs (#130, #128, #125, #123, #118) reproduce predictions, advice coverage, metrics and provenance. Real-PR identity relies on the recorded offline source; no network attestation or new human review is claimed. Evidence: `docs/agent-skills/forward-inputs.json`, `docs/agent-skills/forward-labels.json`, `docs/agent-skills/forward-freeze.json`, `docs/agent-skills/forward-blind-review.json`, `docs/agent-skills/forward-results.json`, `node scripts/agent-skills/evaluate-forward.mjs --check` | [gap-quality-routing-misses](#gap-quality-routing-misses), [gap-broad-path-overlap](#gap-broad-path-overlap), [gap-task-text-noise](#gap-task-text-noise), [gap-unusable-advice](#gap-unusable-advice), [gap-capability-coverage](#gap-capability-coverage), [gap-completion-ci](#gap-completion-ci) |
| e | Published routing and review measurements match the machine-readable forward results. | pass | The complete published Markdown report equals the shared renderer output, including all routing counts, rates, misses and advice findings. Criterion d separately checks the underlying measurements against replay. Evidence: `docs/agent-skills/forward-report.md`, `docs/agent-skills/forward-results.json`, `scripts/agent-skills/evaluation.mjs` | [gap-quality-routing-misses](#gap-quality-routing-misses), [gap-broad-path-overlap](#gap-broad-path-overlap), [gap-task-text-noise](#gap-task-text-noise), [gap-unusable-advice](#gap-unusable-advice), [gap-completion-ci](#gap-completion-ci) |
| f | Blocking eligibility is restricted to deterministic allowlists; subjective findings remain advisory. | pass | Catalog check IDs, routing check classes, route policy and recorded subjective findings respect the deterministic/advisory boundary. Deterministic fixture examples may block; their synthetic evidence does not claim those checks ran. Human truthfulness and live enforcement are outside this static check. Evidence: `config/agent-skills/catalog.yaml`, `config/agent-skills/review-map.yaml`, `scripts/agent-skills/routing.mjs`, `scripts/agent-skills/lib.mjs`, `tests/agent-skills/fixtures/`, `docs/agent-skills/forward-blind-review.json`, `docs/agent-skills/forward-results.json` | [gap-review-schema-parity](#gap-review-schema-parity), [gap-deterministic-evidence](#gap-deterministic-evidence) |
| g | Post-v1 gaps are explicit and every incomplete criterion links to a proposed gap. | pass | 10 proposed gaps; every incomplete criterion links to at least one proposal. Evidence: `docs/agent-skills/v1-gaps.json`, `docs/agent-skills/v1-completion-report.md` | [gap-completion-ci](#gap-completion-ci) |

## Measurement and capability limits

The frozen 5-PR report records 7 true positives, 9 false positives, 2 false negatives and 42 true negatives: precision 43.8%, recall 77.8%, exact matches 0/5. The quality-reliability-observability misses are #130, #118. Broad-path overlaps and task-text noise are documented revision candidates. Unusable advice: 2/16 assessments, with 2 findings (seo-distribution on #130; owner-publishing-ux on #128). 7 of 9 extra selections still produced usable adjacent-scope advice under the blind reviewer’s judgment. These are revision inputs, not subjective blocking gates. See [the measured report](forward-report.md).

Criterion c checks the validator and buildBeadsIngestPlan in memory, without calling Gas City or writing evidence. It proves contract acceptance, not a live Beads receipt or worklog append. Forward metadata, routing and advice containers use the evaluation contract; they are not silently converted into per-skill review-result envelopes. Recorded PR provenance and blind review are preserved evidence, not independently reattested by this offline run. The gap proposals below preserve the historical v1 record, including the ingestion migration proposal; their inclusion does not assert that each proposal remains open.

## Post-v1 gaps

10 proposals for coordinator review and later Beads creation. No Beads or Taskmaster tasks were created by this check.

<a id="gap-quality-routing-misses"></a>
### Route quality reviews for accessibility contracts and font-cache verification

ID: gap-quality-routing-misses. Type: bug. Priority: P1. Criteria: d, e.

The frozen evaluation misses quality-reliability-observability on PR #130 (recovery coverage/Suspense regression) and #118 (font digest, cache and browser assertions). Recall is 77.8%; two of five PRs miss an expected scope.

Acceptance criteria:

- Add independently labelled positive fixtures for the #130 and #118 changed-test patterns and negative fixtures for adjacent presentation-only changes.
- A reviewed routing revision selects quality-reliability-observability for both cases without dropping other required scopes.
- Publish a new frozen evaluation with explicit denominators and changed false-positive/false-negative counts; retain the original five-PR artifacts unchanged.

Evidence: `docs/agent-skills/forward-results.json#cases`, `docs/agent-skills/forward-labels.json`, `config/agent-skills/review-map.yaml`.

<a id="gap-broad-path-overlap"></a>
### Reduce incidental skill selection from broad path routes

ID: gap-broad-path-overlap. Type: bug. Priority: P2. Criteria: d, e.

Precision is 43.8% (7 TP / 16 selections), with nine false positives. Shared layout, document and reader paths can select domains whose behavior did not change. SEO selected on PR #130 is the clearest unusable path-only result. Seven of nine extra selections were still considered useful, so blanket removal of overlaps is not justified.

Acceptance criteria:

- Add paired fixtures for layout recovery versus metadata changes and document sanitization versus block-contract changes.
- Review route scope using actual changed behavior and preserve justified cross-domain overlap.
- Measure precision and recall on a separately labelled evaluation before accepting the revision; do not relabel the historical sample to improve its score.

Evidence: `docs/agent-skills/forward-report.md`, `docs/agent-skills/forward-blind-review.json#cases`, `scripts/agent-skills/routing.mjs`.

<a id="gap-task-text-noise"></a>
### Separate task intent from boilerplate and historical mentions in text routing

ID: gap-task-text-noise. Type: bug. Priority: P2. Criteria: d, e.

The router matches the full PR title/body. PR #128 selects owner-publishing-ux from the backend word revisions; #123 contains historical skill mentions. Whole-text exclusions can also hide relevant intent in mixed or negated prose.

Acceptance criteria:

- Add fixtures for verification boilerplate, historical references, backend revisions and mixed or negated exclusions.
- Document the reviewed input-section and exclusion semantics, with explicit routing evidence for each selection.
- Re-evaluate independently labelled real PRs and publish the changes to false positives and missed routes without changing the frozen baseline.

Evidence: `docs/agent-skills/forward-inputs.json`, `docs/agent-skills/forward-blind-review.json`, `docs/agent-skills/lifecycle.md`, `scripts/agent-skills/routing.mjs`.

<a id="gap-unusable-advice"></a>
### Make off-scope review advice an explicit abstention or handoff

ID: gap-unusable-advice. Type: task. Priority: P2. Criteria: c, d, e.

Two of sixteen assessments (12.5%) produced unusable advice, with two findings: seo-distribution on #130 has no URL/discovery change; owner-publishing-ux on #128 has no owner intent, state transition, feedback or recovery journey. Skill edits are outside this lane.

Acceptance criteria:

- Add review-output examples for both findings that state why the scope is absent and avoid inventing a product journey or distribution change.
- Distinguish not-applicable or a scoped handoff from substantive review advice while retaining original selection and usefulness counts.
- Collect new blind advice and record usefulness as subjective, advisory evidence; no review score becomes blocking.

Evidence: `docs/agent-skills/forward-report.md#Advice findings`, `docs/agent-skills/forward-blind-review.json`, `.claude/skills/seo-distribution/SKILL.md`, `.claude/skills/owner-publishing-ux/SKILL.md`.

<a id="gap-capability-coverage"></a>
### Extend persisted output and real-change coverage across all registered skills

ID: gap-capability-coverage. Type: task. Priority: P2. Criteria: a, c, d.

The suite has twelve registered skills but ten persisted per-skill review fixtures. cross-agent-skill-platform has an in-test synthetic result; gas-city-coordinator lacks a persisted review-result example. Five retrospective PRs cannot establish every capability, model/provider behavior or future routing accuracy. File presence proves implementation structure, not prose quality.

Acceptance criteria:

- Inventory every catalog skill, canonical source, relative link, capability and persisted review-result example; resolve missing examples or document an approved exception.
- Add schema-valid persisted output examples for the platform and coordinator skills, and retain traceable per-skill envelopes for actual forward reviews without inventing timestamps or review identities.
- Publish a prospective, independently labelled sample spanning skills absent from the first sample; separate routing accuracy, advice usefulness and any provider comparison.

Evidence: `config/agent-skills/catalog.yaml`, `tests/agent-skills/fixtures/`, `tests/agent-skills/review-result.test.mjs`, `docs/agent-skills/forward-results.json#perSkill`.

<a id="gap-current-ingestion-sink"></a>
### Replace legacy Aegis review ingestion with the current Beads and worklog contract

ID: gap-current-ingestion-sink. Type: feature. Priority: P1. Criteria: c.

The command builder still produces ./.aegis/bin/aegis log, while active project coordination freezes Aegis and makes Beads authoritative. Dry-run contract acceptance does not demonstrate delivery to an active evidence sink. This checker deliberately performs no ingestion.

Acceptance criteria:

- Approve and document a Beads/worklog ingestion destination with explicit skill, review ID, head SHA and durable evidence references.
- Preserve validation, advisory classification and duplicate/retry behavior, with tests for rejection before any evidence write.
- Demonstrate one authorized end-to-end ingestion receipt on the host without mutating historical Aegis or Taskmaster state; revise affected skill guidance in a separately admitted lane.

Evidence: `AGENTS.md#Active Project Coordination`, `scripts/agent-skills/ingest-result.mjs`, `scripts/agent-skills/lib.mjs#buildAegisIngestCommand`, `.claude/skills/cross-agent-skill-platform/SKILL.md`.

<a id="gap-review-schema-parity"></a>
### Align runtime review-result validation with the published JSON schema

ID: gap-review-schema-parity. Type: bug. Priority: P2. Criteria: c, f.

The runtime validator does not reject extra fields inside evidence items although the schema sets additionalProperties:false there. Conversely, the runtime rejects subjective blocking findings while the JSON schema does not express that conditional rule. A passed fixture is not proof that both contracts reject the same malformed inputs.

Acceptance criteria:

- Add a shared valid/invalid corpus covering evidence extra properties, timestamp format and subjective blocking combinations.
- Make schema and runtime decisions agree, preserving the stricter advisory boundary and intentional compatibility behavior.
- Ensure ingestion uses the aligned contract and documents which checks validate structure versus evidence truth.

Evidence: `schemas/agent-skills/review-result.schema.json`, `scripts/agent-skills/lib.mjs#validateReviewResult`, `tests/agent-skills/review-result.test.mjs`.

<a id="gap-deterministic-evidence"></a>
### Bind blocking-eligible findings to verified deterministic check receipts

ID: gap-deterministic-evidence. Type: feature. Priority: P2. Criteria: c, f.

Static policy and subjective:true guards are enforceable, but a finding can currently assert subjective:false and blocking:true without a registered executed check or trustworthy receipt. Synthetic deterministic fixture examples do not establish live enforcement. The completion checker independently pins the four v1 check IDs; it does not adjudicate arbitrary claims of determinism.

Acceptance criteria:

- Define a reviewed mapping from deterministic check identity to permitted finding classes and head-bound execution receipts.
- Reject promotion based only on a caller-supplied subjective:false label, an arbitrary category, or an unverified command string.
- Test forged, missing and stale receipts along with legitimate deterministic failures; keep every subjective finding advisory.

Evidence: `config/agent-skills/catalog.yaml#policy`, `scripts/agent-skills/routing.mjs#blockingEligibleCategories`, `scripts/agent-skills/lib.mjs#validateReviewResult`, `docs/agent-skills/lifecycle.md`.

<a id="gap-platform-host-evidence"></a>
### Make platform validation evidence reproducible in managed workers and host checks

ID: gap-platform-host-evidence. Type: task. Priority: P2. Criteria: a, b.

The Git-ignore-aware validator needs a working subprocess to distinguish managed runtime skills from unregistered project skills. The initial worker invocation stalled in that probe. A timeout now preserves the unresolved diagnostics; a host run must resolve them before completion can be asserted.

Acceptance criteria:

- Run the existing validator on the exact reviewed worktree on the host and retain its full skills/routes summary and any unregistered-entry diagnostics.
- Add a bounded regression for an unavailable or unresponsive Git probe and document which checks managed workers can reproduce.
- If worker support is changed, preserve Git-ignore and tracked-path semantics; do not skip unknown skills or turn missing evidence into a pass. Regenerate the completion artifacts from verified inputs.

Evidence: `scripts/agent-skills/lib.mjs#gitIgnoredPaths`, `tests/agent-skills/platform.test.mjs`, `docs/worklog/blog-0055.2.md`.

<a id="gap-completion-ci"></a>
### Add an approved freshness check for completion and forward evidence

ID: gap-completion-ci. Type: task. Priority: P3. Criteria: d, e, g.

The checker is a manual command in this lane. Its new test file is discovered by the existing agent-skills test glob, but regeneration/freshness checking of the real completion artifacts is not wired into package scripts or CI. Proposed gaps also need coordinator review and actual Beads filing.

Acceptance criteria:

- After review, add explicit forward replay and completion --check commands to the appropriate CI stage without treating subjective quality metrics as thresholds.
- Demonstrate that altered measurements, missing PRs, stale Markdown, absent gap declarations and unlinked incomplete criteria are rejected.
- Review these proposals, create accepted Beads with evidence and dependencies, and record their IDs without updating frozen Taskmaster files. Preserve the original evaluation when producing a revised baseline.

Evidence: `scripts/agent-skills/check-v1-completion.mjs`, `docs/agent-skills/v1-gaps.json`, `package.json#scripts.ci:agent-skills`, `.github/workflows/ci.yml`.

## Reproduction

- Use Node 24.18.0. `node scripts/agent-skills/check-v1-completion.mjs` writes both completion artifacts, including an incomplete verdict when evidence is missing.
- `node scripts/agent-skills/check-v1-completion.mjs --check` compares both artifacts without writing. Exit 0 requires both a complete verdict and current artifacts; exit 1 means incomplete or stale evidence; exit 2 means invalid arguments.
- `node --test tests/agent-skills/v1-completion.test.mjs` exercises positive and negative mechanical fixtures. `node scripts/agent-skills/evaluate-forward.mjs --check` reproduces the frozen evaluation.
- Run `node scripts/agent-skills/validate-platform.mjs` on the host if criterion b cannot obtain Git ignore evidence. A subprocess timeout or permission refusal is missing verification, never a successful platform check.

The checker is not added to package scripts or CI in this change. Its gap manifest is reviewed input; mechanical coverage cannot prove that every future qualitative gap has been discovered.
