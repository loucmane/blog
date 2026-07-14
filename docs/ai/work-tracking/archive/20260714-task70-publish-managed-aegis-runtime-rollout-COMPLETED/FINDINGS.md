# Task 70 Publish Owner-Authorized Managed Aegis Runtime Rollout - Findings

## Purpose
Record discoveries, gaps, risks, failed assumptions, and evidence-backed observations for Task 70.

## Findings
- 2026-07-14 - The approved rollout contains 14 exact managed paths. Thirteen content-hashed assets match the installed manifest, including `.codex/hooks.json` at SHA-256 `3334c040bd46a92bd542d53e2919a43b14ba1bf001fa79883a5385dc5ba487d5`; the manifest records source commit `144bd4463dcec9c326b023ff53b45aa71660727e` and a passing strict verification at `2026-07-14T16:27:19Z` in the original worktree.
- 2026-07-14 - The active upstream source advanced from the approved commit to `655e971de063f6da511b801d7e01deeea6f86352`. An unqualified dry-run proposes seven newer managed changes, so Task 70 did not apply it.
- 2026-07-14 - A read-only archive of `144bd4463dcec9c326b023ff53b45aa71660727e` still produces three path-sensitive preview changes (`.aegis/bin/aegis`, `.aegis/runtime.env`, and `.aegis/foundation-manifest.json`) because the updater embeds the temporary source-root path. No preview changes were applied.
- 2026-07-14 - Strict verification of the clean isolated worktree passes 41 of 42 checks and fails only `codex.hook_trust_guidance`. The verifier reads required guidance solely from ignored `.aegis/reports/install-report.json`; a clean checkout therefore cannot satisfy the required check from tracked runtime assets. Current upstream `655e971` retains the same dependency.
- 2026-07-14 - This is an upstream reproducibility defect, not a managed-asset mismatch. Task 70 must not commit generated reports, inject ignored Aegis state, hot-patch the verifier, or consume the seven newer managed changes without separate authority.
- 2026-07-14 - A disposable `655e971` prototype proved the minimal upstream correction: derive exact-hash trust guidance from the tracked `codex.hook_trust` manifest gate and fail closed when that gate is missing, duplicated, or altered. The real Task 70 checkout then passed all 42 strict checks with zero required failures and no install report.
- 2026-07-14 - Upstream PR `loucmane/codex-starter-pack#283` merged as `589bf62669f074a417ad844bd3ef95e71ec28e96`. Verification through that exact clean source passed all 42 strict checks and reported `codex.hook_trust_guidance.source=manifest_gate` without an install report.
- 2026-07-14 - All 41 checksum-bearing managed files match the tracked manifest. The delivered runtime remains the approved `144bd4463dcec9c326b023ff53b45aa71660727e` rollout; the merged-source preview proposes nine distinct managed updates with zero conflicts and zero manual reviews, and none were applied.
- 2026-07-14 - Final Aegis closeout passed with zero required failures, zero warnings, and no pending events. The pre-commit witness correctly remains non-authoritative until a committed head exists because its Git diff contains no uncommitted Taskmaster done flip.

## Progress Log
- **2026-07-14 19:15 CEST** - [S:20260714|W:task70-publish-managed-aegis-runtime-rollout|H:aegis:kickoff|E:.aegis/state/current-work.json] Findings log initialized by Aegis kickoff.
- **2026-07-14 19:15 CEST** - [S:20260714|W:task70-publish-managed-aegis-runtime-rollout|H:agent:scope|E:docs/ai/work-tracking/active/20260714-task70-publish-managed-aegis-runtime-rollout-ACTIVE/FINDINGS.md] Confirmed Task 70 is limited to the exact owner-authorized installer-managed rollout; Tasks 41 and 69 remain preserved, incidental Taskmaster state and all unrelated .codex paths are excluded; authority=explicit-user-approval
