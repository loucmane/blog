# Task 64 Permit Verification-Only Aegis Manifest Diffs in Autonomous Delivery - Findings

## Purpose
Record discoveries, gaps, risks, failed assumptions, and evidence-backed observations for Task 64.

## Findings
- 2026-07-11 - The trusted classifier denied every `.aegis/` path, so Aegis verification's timestamp-only manifest update caused a false attended stop even when every other manifest value was unchanged.
- 2026-07-11 - A safe exception requires two independent controls: trusted semantic comparison of protected-main and exact-head JSON, plus the existing path classifier requiring an in-place `modified` status and matching trusted result.
- 2026-07-11 - `actionlint` and `gitleaks` were not preinstalled. Checksum-verified official release binaries ran from `/tmp` without repository installation; workflow syntax and staged secret scanning passed locally, while protected GitHub CI remains authoritative.
- 2026-07-11 - The exact PR #19 delta changed only `verification.last_verified_at` from `2026-07-10T22:47:33Z` to `2026-07-10T23:28:37Z`; it is now the positive fixture, with malformed, missing, runtime, managed-asset, enforcement, authority, verification, deletion, and nested-field adversarial cases denied.
- 2026-07-11 - Independent review found that GitHub's Contents API may dereference an in-repository symlink, so the exact protected path must be proven as a unique non-executable regular Git blob before semantic content can be trusted.
- 2026-07-11 - Independent review found that unbounded future timestamps could permanently force later legitimate verification timestamps to fail monotonicity. Trusted runner time plus five minutes is now the maximum accepted head or base timestamp; an already-future base requires attended recovery.

## Progress Log
- **2026-07-11 12:14 CEST** - [S:20260711|W:task64-manifest-verification-diff-policy|H:aegis:kickoff|E:.aegis/state/current-work.json] Findings log initialized by Aegis kickoff.
- **2026-07-11 12:14 CEST** - [S:20260711|W:task64-manifest-verification-diff-policy|H:agent:scope|E:docs/ai/work-tracking/active/20260711-task64-manifest-verification-diff-policy-ACTIVE/FINDINGS.md] Scope confirmed: trusted semantic comparison may allow only verification.last_verified_at in foundation-manifest; all other Aegis and governance mutations remain denied; implementation is policy, tests, documentation, and task evidence only; authority=standing-grant:sota-magazine-2026-autonomy-v2
- **2026-07-11 13:40 CEST** - [S:20260711|W:task64-manifest-verification-diff-policy|H:independent-review:findings|E:docs/ai/work-tracking/archive/20260711-task64-manifest-verification-diff-policy-COMPLETED/FINDINGS.md] Recorded protected-path object-mode and future-timestamp denial-of-service findings without reopening or replacing Task 64.
