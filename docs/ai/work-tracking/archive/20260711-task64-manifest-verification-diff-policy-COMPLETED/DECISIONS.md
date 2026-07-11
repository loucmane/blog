# Task 64 Permit Verification-Only Aegis Manifest Diffs in Autonomous Delivery - Decisions

## Purpose
Record decisions before implementation, including options considered, rationale, and evidence.

## Decisions
- 2026-07-11 - Use Aegis-native current work as the portable workflow authority for this task. Taskmaster and Serena remain optional unless explicitly required.
- 2026-07-11 - Initial implementation executed the evaluator only from protected `main` and retrieved the exact pull-request-head manifest as inert JSON through GitHub's Contents API; independent review superseded the Contents API data source because it can dereference in-repository symlinks.
- 2026-07-11 - Require both manifests to be JSON objects with valid RFC 3339 timestamps, require the head timestamp to advance, remove only `verification.last_verified_at`, and compare every remaining value through canonical JSON ordering.
- 2026-07-11 - Keep missing evidence, added/removed/renamed manifests, unchanged or stale timestamps, all other manifest changes, and every other `.aegis/` path denied.
- 2026-07-11 - Treat Task 64 as attended governance because it changes the write-capable workflow and its trusted policy; no autonomous merge applies to this pull request.
- 2026-07-11 - Require non-recursive Git Database traversal for both protected-main and exact-head trees, reject truncated or malformed responses, require unique `.aegis` and manifest entries with `type=blob` and `mode=100644`, and fetch content only by the resulting verified blob SHA.
- 2026-07-11 - Bind semantic evaluation to `new Date().toISOString()` inside trusted CLI code and allow at most five minutes of forward clock skew; PR data cannot provide or widen the trusted evaluation time.

## Progress Log
- **2026-07-11 12:14 CEST** - [S:20260711|W:task64-manifest-verification-diff-policy|H:aegis:kickoff|E:.aegis/state/current-work.json] Decisions log initialized by Aegis kickoff.
- **2026-07-11 12:14 CEST** - [S:20260711|W:task64-manifest-verification-diff-policy|H:agent:scope|E:docs/ai/work-tracking/active/20260711-task64-manifest-verification-diff-policy-ACTIVE/FINDINGS.md] Scope confirmed: trusted semantic comparison may allow only verification.last_verified_at in foundation-manifest; all other Aegis and governance mutations remain denied; implementation is policy, tests, documentation, and task evidence only; authority=standing-grant:sota-magazine-2026-autonomy-v2
- **2026-07-11 13:40 CEST** - [S:20260711|W:task64-manifest-verification-diff-policy|H:independent-review:decision|E:.github/workflows/auto-merge.yml] Replaced Contents API trust with unique regular-blob Git Database proof and bounded semantic time before any autonomous allowance.
