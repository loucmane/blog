# Skill lifecycle and routing contract

The catalog is the validated lifecycle registry for all twelve project-owned skills. Each entry has explicit promotion, revision and retirement criteria tied to its capabilities. `validate-platform.mjs` checks those criteria through the same configuration validator used by the router. Managed Gas City skills remain outside this project-owned catalog.

| Status    | Automatic selection | Transition evidence                                                                                                                                                       |
| --------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| candidate | No                  | Scope and handoffs agreed; canonical source, relative link, provenance and deterministic checks valid; positive, negative and ambiguous fixtures present.                 |
| active    | Yes                 | Project owner accepts activation after a labelled real-change evaluation records routing and advice quality. A green schema or test run alone does not approve promotion. |
| retired   | No                  | Project owner records obsolete, duplicate or persistently unusable scope, replacement or uncovered responsibility, caller migration and retained historical evidence.     |

Revision is required when a reproduced false positive, false negative, missed route, unusable recommendation or stale repository reference is found. Record the failing example, repair scope or guidance, rerun deterministic checks and collect a new evaluation before accepting the revision. Severity and frequency inform the owner's priority decision; a five-case sample is not a universal acceptance threshold. Retire only after checking whether revision or consolidation can preserve useful coverage. Historical evaluations remain unchanged; a new evaluation receives its own inputs, labels and digests.

Every skill's criteria are enforced for presence and structure, not automatically adjudicated by prose matching. Lifecycle changes do not broaden operator boundaries for merge, publication, credentials or authority. Advisory findings remain non-blocking in every lifecycle state. Only deterministic schema, link, script, test, build, typecheck, lint, security, accessibility, performance-budget, health and critical-browser checks are blocking-eligible. Eligibility requires actual check evidence under the existing gate policy; a skill's opinion or a low evaluation score is never sufficient.

Run `corepack pnpm ci:agent-skills` for configuration validation and all skill tests. No package scripts or dependency declarations were changed for this work.

## Deterministic router

`node scripts/agent-skills/route-skills.mjs input.json` accepts `{"paths":["packages/web/src/reader/blocks.ts"],"taskText":"Review node and mark types."}` and returns selected skill IDs and per-route evidence in stable order. It performs no dispatch, code execution, model invocation or network request. Empty input yields an empty selection. Malformed configuration or input fails closed.

Paths are repository-relative, with an optional leading `./`; Windows separators normalize to `/`. Absolute paths, traversal and empty segments are refused. Only `*` and `**` are glob operators: `*` stays within a segment, `**` spans slashes, and Next route brackets are literal. The matcher preserves the existing review-map semantics; `a/**/b` requires the two written slashes.

Text phrases are case-insensitive, whitespace-normalized and bounded by word boundaries. The initial vocabulary comes from the existing per-skill trigger fixtures; platform and coordinator phrases are explicit additions in the review map. For each route, at least one include phrase and no exclude phrase must occur. An exclusion anywhere in the task text suppresses that route's text match, including in mixed or negated prose; this is a known deterministic limitation. It does not cancel a changed-file match. Paths and eligible text matches are unioned, deduplicated and sorted; no first-match precedence hides overlapping skills. Only active skills select automatically.

The fixtures exercise positive, negative and ambiguous paths and text for every catalog skill, exact selected sets, exclusions, path normalization, literal brackets, phrase boundaries, input validation, lifecycle inactivity and order invariance. They prove this router's behavior, not a model's ability to interpret arbitrary prose. Full PR bodies deliberately remain input in the five-PR replay; historical skill mentions and verification boilerplate may therefore introduce false positives.

## Evaluation evidence

See [the five-PR report](forward-report.md). Labels are separate from both inputs and blind predictions. The blind reviewer receives only inputs, frozen routing rules and relevant skill sources; the scorer joins fixed labels afterwards. Both routing errors and advice usefulness remain visible. The evaluator validates complete, unique PR identities and advice coverage, checks merge identities and digests, reproduces predictions and checks the report against its machine-readable source. It refuses missing evidence rather than treating it as zero findings.
