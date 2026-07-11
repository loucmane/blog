# Task 65 Guarantee post-merge CI after controlled auto-merge - Findings

## Purpose
Record discoveries, gaps, risks, failed assumptions, and evidence-backed observations for Task 65.

## Findings
- 2026-07-11 - Task 52 PR 25 merged through the trusted workflow-token path at `6c769dd362ac5e11178935c08354bd97dc8be501`, but GitHub attached no `push:main` CI run or check suite to the merge commit after a propagation delay.
- 2026-07-11 - GitHub documents that `GITHUB_TOKEN`-created events suppress recursive workflow runs except `workflow_dispatch`, `repository_dispatch`, and specific approval-gated pull-request events. The absence was therefore deterministic, not a transient GitHub delay.
- 2026-07-11 - `repository_dispatch` uses the merge job's existing `contents:write`; `workflow_dispatch` would broaden the job to `actions:write`, while a PAT or GitHub App token would add unnecessary secret and identity management.
- 2026-07-11 - The repository's scoped `scripts/codex-task` helper could not import `aegis_foundation` in the current shell. Task 65's projection was generated into a temporary directory with supported `task-master generate`, and only `task_065.md` was copied into the worktree.

## Progress Log
- **2026-07-11 17:45 CEST** - [S:20260711|W:task65-post-merge-ci-verification|H:aegis:kickoff|E:.aegis/state/current-work.json] Findings log initialized by Aegis kickoff.
- **2026-07-11 17:46 CEST** - [S:20260711|W:task65-post-merge-ci-verification|H:agent:scope|E:docs/ai/work-tracking/active/20260711-task65-post-merge-ci-verification-ACTIVE/FINDINGS.md] Task 65 is limited to trusted exact-merge post-merge CI dispatch plus deterministic/adversarial workflow tests; no product, package, lockfile, Aegis runtime, authority, deployment, or secret changes. authority=standing-grant:sota-magazine-2026-autonomy-v2 plus explicit owner approval for this workflow-governance correction.
