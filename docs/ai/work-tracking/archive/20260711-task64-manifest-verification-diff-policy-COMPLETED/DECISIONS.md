# Task 64 Permit Verification-Only Aegis Manifest Diffs in Autonomous Delivery - Decisions

## Purpose
Record decisions before implementation, including options considered, rationale, and evidence.

## Decisions
- 2026-07-11 - Use Aegis-native current work as the portable workflow authority for this task. Taskmaster and Serena remain optional unless explicitly required.
- 2026-07-11 - Execute the evaluator only from protected `main`; retrieve the exact pull-request-head manifest as inert JSON through GitHub's contents API and never check out or execute pull-request content.
- 2026-07-11 - Require both manifests to be JSON objects with valid RFC 3339 timestamps, require the head timestamp to advance, remove only `verification.last_verified_at`, and compare every remaining value through canonical JSON ordering.
- 2026-07-11 - Keep missing evidence, added/removed/renamed manifests, unchanged or stale timestamps, all other manifest changes, and every other `.aegis/` path denied.
- 2026-07-11 - Treat Task 64 as attended governance because it changes the write-capable workflow and its trusted policy; no autonomous merge applies to this pull request.

## Progress Log
- **2026-07-11 12:14 CEST** - [S:20260711|W:task64-manifest-verification-diff-policy|H:aegis:kickoff|E:.aegis/state/current-work.json] Decisions log initialized by Aegis kickoff.
- **2026-07-11 12:14 CEST** - [S:20260711|W:task64-manifest-verification-diff-policy|H:agent:scope|E:docs/ai/work-tracking/active/20260711-task64-manifest-verification-diff-policy-ACTIVE/FINDINGS.md] Scope confirmed: trusted semantic comparison may allow only verification.last_verified_at in foundation-manifest; all other Aegis and governance mutations remain denied; implementation is policy, tests, documentation, and task evidence only; authority=standing-grant:sota-magazine-2026-autonomy-v2
