# Task 65 Guarantee post-merge CI after controlled auto-merge - Decisions

## Purpose
Record decisions before implementation, including options considered, rationale, and evidence.

## Decisions
- 2026-07-11 - Use Aegis-native current work as the portable workflow authority for this task. Taskmaster and Serena remain optional unless explicitly required.
- 2026-07-11 - Use `repository_dispatch:post-controlled-auto-merge-ci` after the exact squash merge. Preserve merge-job permissions at only `contents:write` and `pull-requests:write`; do not introduce `actions:write`, a PAT, a GitHub App secret, or PR-controlled execution.
- 2026-07-11 - Resolve dispatch payloads in a read-only CI context job loaded from protected main. Require merged same-repository PR metadata, exact reviewed head and merge SHA, protected-main base, and local merge ancestry before downstream jobs execute the exact merge commit.
- 2026-07-11 - Treat post-merge CI as supplemental evidence after an irreversible merge. Dispatch or verification failure must remain visible and attended; it must never be represented as a branch-protection check that ran before merge.

## Progress Log
- **2026-07-11 17:45 CEST** - [S:20260711|W:task65-post-merge-ci-verification|H:aegis:kickoff|E:.aegis/state/current-work.json] Decisions log initialized by Aegis kickoff.
- **2026-07-11 17:46 CEST** - [S:20260711|W:task65-post-merge-ci-verification|H:agent:scope|E:docs/ai/work-tracking/active/20260711-task65-post-merge-ci-verification-ACTIVE/FINDINGS.md] Task 65 is limited to trusted exact-merge post-merge CI dispatch plus deterministic/adversarial workflow tests; no product, package, lockfile, Aegis runtime, authority, deployment, or secret changes. authority=standing-grant:sota-magazine-2026-autonomy-v2 plus explicit owner approval for this workflow-governance correction.
