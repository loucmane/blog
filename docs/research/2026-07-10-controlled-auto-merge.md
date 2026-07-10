# Controlled Auto-Merge Design

**Task:** 48 — Bootstrap Protected CI and Controlled Auto-Merge
**Continuation branch:** `feat/task-48-controlled-auto-merge`
**Authority:** `standing-grant:sota-magazine-2026-autonomy-v1`

## Protected Main Baseline

PR #9 merged the read-only CI bootstrap at head `3611d55e2f8bee581e86b80cc45621a804e9469e` and merge commit `4a6f03e954a19e73a2f6c7514815dc4dea50f65a`. Its four pull-request checks passed with these exact names:

- `workspace · install · typecheck · lint · tests · build`
- `governance · Taskmaster · Aegis · guards`
- `security · dependency review`
- `security · gitleaks`

The project owner explicitly approved protection for `main`. GitHub's protection API was applied and read back with strict required checks, pull requests required, zero approving reviews, resolved conversations, linear history, administrator enforcement, force pushes disabled, and branch deletion disabled. Repository visibility, secrets, deployments, environments, and production settings were not changed.

## Reference and Adaptation

The implementation preserves the race-handling and direct check-run inspection proven by `/home/loucmane/dev/hpfetcher/.github/workflows/auto-merge.yml`. It does not copy HP-Fetcher application paths, worker setup, Clerk secrets, D1 migrations, `.dev.vars`, split lockfiles, or Vite variables.

The blog adaptation adds repository-specific fail-closed policy classification, exact protected checks, same-repository head enforcement, trusted-default-branch execution, head-SHA matching, and tests for allow and deny behavior.

## Trigger Model

Two triggers close both label/check orderings:

1. `workflow_run` after the `CI` workflow completes for a pull request. If the explicit label already exists, the workflow evaluates the completed head.
2. `pull_request_target:labeled` when `auto-merge` is added after checks may already have completed. If checks are still pending, it exits without merging and lets the later `workflow_run` retry.

Concurrency is keyed by repository and pull-request head SHA without cancellation. Duplicate trigger races are safe because the pull request and exact head are re-read immediately before merge.

## Permissions and Trust Boundary

The workflow has no top-level permissions. Its single merge job requests only:

- `contents: write`
- `pull-requests: write`

The labeled privileged path deliberately uses `pull_request_target` because GitHub loads that workflow definition from the base repository's default branch rather than the pull-request merge commit. The original `pull_request:labeled` design was rejected because a same-repository pull request could change its own write-capable workflow definition before labeling. GitHub's security guidance permits this design only while the privileged job avoids checking out, downloading, or executing pull-request-controlled code or artifacts ([GitHub: securely using `pull_request_target`](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target)).

The job checks out only `${{ github.event.repository.default_branch }}` into `trusted`, with credentials persistence disabled, and executes only `trusted/scripts/ci/auto-merge-policy.mjs`. It never checks out a pull-request head or merge ref, fetches pull-request code, downloads pull-request artifacts, installs packages, or runs builds/tests from pull-request content. Pull-request metadata and API payloads are treated only as untrusted data. The workflow uses the event-scoped `github.token`; no repository or environment secret is referenced. Fork pull requests are explicitly rejected before any write operation.

## Eligibility Contract

An eligible pull request must:

- be open and non-draft;
- target `main`;
- originate from `loucmane/blog`, not a fork;
- carry the explicit `auto-merge` label;
- have a complete changed-file inventory;
- pass the deterministic path and label policy;
- have the four exact required checks completed successfully by `github-actions`;
- be current with protected `main`;
- retain the same head SHA and label through the final pre-merge read.

The workflow excludes its own `controlled auto-merge` check from direct check-run evaluation. It never adds a label. The merge command uses `--match-head-commit`, squash merge, and `--delete-branch`; branch deletion therefore targets only the successfully merged pull request's same-repository head branch.

## Mandatory Deny Classes

The classifier rejects workflow or permission files, CI/policy/test-control files, dependency and toolchain manifests, secret-shaped files, production deployment and infrastructure files, migrations, destructive operational scripts, branch-protection or ruleset files, Aegis-managed/authority surfaces, malformed paths, incomplete inventories, and explicit manual/high-risk labels.

The path classifier is intentionally conservative. A denied pull request remains available for attended human review and merge; denial only removes autonomous merge eligibility.

## Verification

`tests/ci/auto-merge-policy.test.mjs` covers documentation-only allow behavior, every mandatory deny class, malformed or empty inventories, exact-check success, missing/pending deferral, failed or wrong-app denial, pagination, duplicate check reruns, and own-check exclusion.

`tests/ci/auto-merge-workflow.test.mjs` proves both triggers, the label path's exclusive `pull_request_target:labeled` contract, exact permissions, explicit trusted-default-branch checkout, absence of pull-request checkout/fetch/artifact/package execution, trusted-only policy execution, no secret reference, direct check-run inspection, fork refusal, SHA matching, squash-only merge, pull-request branch deletion, and no auto-label command.

The existing governance check runs both test files, so the required `governance · Taskmaster · Aegis · guards` context fails when the policy or workflow contract regresses.

## Rollback and Canary

Rollback is a reviewed revert of the auto-merge workflow, policy script, tests, CI contract step, package script, and this document. Removing the workflow disables autonomous merges without changing product code, dependencies, the lockfile, protected-main settings, secrets, data, or deployment state.

This workflow-permission pull request must receive attended owner approval and must not merge itself. After that merge, a separate documentation-only canary pull request will receive the existing `auto-merge` label manually. Task 48 remains open until the canary proves label/check race handling, squash merge, branch deletion, protected-main enforcement, and synchronized local `main`.
