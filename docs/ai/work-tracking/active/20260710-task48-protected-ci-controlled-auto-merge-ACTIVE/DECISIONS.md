# Task 48 Bootstrap Protected CI and Controlled Auto-Merge - Decisions

## Purpose
Record decisions before implementation, including options considered, rationale, and evidence.

## Decisions
- 2026-07-10 - Use Aegis-native current work as the portable workflow authority for this task. Taskmaster and Serena remain optional unless explicitly required.
- 2026-07-10 - Keep the first Task 48 pull request to read-only CI bootstrap and supporting deterministic governance checks; do not include auto-merge or repository-rule mutations.
- 2026-07-10 - Pin CI to the currently committed Node 22 and pnpm 9 baseline. Runtime modernization remains Task 38.
- 2026-07-10 - Treat the first workflow pull request as a security boundary that requires attended human merge approval even if every check passes.
- 2026-07-10 - Apply `authority=standing-grant:sota-magazine-2026-autonomy-v1`; the full non-expansive policy remains in `docs/ai/AEGIS_AUTONOMY_GRANT.md`.
- 2026-07-10 - Use current stable full-SHA action pins rather than copying HP-Fetcher's older major tags.
- 2026-07-10 - Aggregate stage outcomes only after every available diagnostic stage runs; intermediate `continue-on-error` never weakens the final failing gate.
- 2026-07-10 - Use explicit unsupported-capability contracts for missing test surfaces. Task 39 owns replacement and the contracts fail when capability changes, preventing a permanent silent skip.
- 2026-07-10 - Retain the exact legacy drift baseline rather than adding missing legacy templates or retiring scaffolding during this goal.
- 2026-07-10 - Assign the temporary UI ESLint, cmdk React-type, unsupported-test, and legacy-drift bridges to Tasks 39 or 47 with explicit removal deadlines in the CI bootstrap research record.

## Progress Log
- **2026-07-10 00:50 CEST** - [S:20260710|W:task48-protected-ci-controlled-auto-merge|H:aegis:kickoff|E:.aegis/state/current-work.json] Decisions log initialized by Aegis kickoff.
- **2026-07-10 00:51 CEST** - [S:20260710|W:task48-protected-ci-controlled-auto-merge|H:standing-grant:sota-magazine-2026-autonomy-v1:task48-scope|E:docs/ai/work-tracking/active/20260710-task48-protected-ci-controlled-auto-merge-ACTIVE/FINDINGS.md] Confirmed the attended CI-bootstrap boundary, baseline constraints, separate auto-merge delivery, and operator authority before implementation
