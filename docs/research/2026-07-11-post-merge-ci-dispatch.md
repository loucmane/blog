# Trusted Post-Merge CI Dispatch

**Task:** 65
**Authority:** `standing-grant:sota-magazine-2026-autonomy-v2` plus explicit
owner approval for this workflow-governance correction
**Status:** attended governance change

## Finding

Task 52 pull request 25 passed all four protected checks and was squash-merged
by the controlled auto-merge workflow at reviewed head
`08ff7c0b0c5bd4d8e4e83710390f56ddef210852`. The resulting main commit was
`6c769dd362ac5e11178935c08354bd97dc8be501`, but GitHub created no `push`-event
CI run for that commit.

This is expected GitHub behavior rather than event propagation delay. GitHub
documents that events created with a repository `GITHUB_TOKEN` do not start
new workflow runs, except for `workflow_dispatch`, `repository_dispatch`, and
specific approval-gated pull-request events:

- [GITHUB_TOKEN workflow-run behavior](https://docs.github.com/en/actions/concepts/security/github_token#when-github_token-triggers-workflow-runs)
- [Triggering a workflow from another workflow](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow#triggering-a-workflow-from-a-workflow)

The Task 52 merge was performed with `${{ github.token }}`, so its resulting
main update could not satisfy the ordinary `push:main` verification path.

## Decision

After a successful exact-head squash merge, the trusted auto-merge workflow
creates a `repository_dispatch` event named `post-controlled-auto-merge-ci`.
GitHub documents that creating this event requires repository `contents:write`,
which the isolated merge job already needs, and that the event always starts a
workflow even when created with `GITHUB_TOKEN`:

- [Create a repository dispatch event](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event)
- [Repository dispatch workflow semantics](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#repository_dispatch)

`workflow_dispatch` was rejected because its REST endpoint requires
`actions:write`. A personal access token or GitHub App token was rejected
because this repository does not need a persistent secret or broader identity
solely to bridge this documented event rule.

## Trust Boundary

Before dispatch, the privileged workflow re-fetches the merged pull request and
requires all of the following:

1. GitHub reports the pull request merged;
2. its recorded head is the exact reviewed head;
3. its source repository is this repository;
4. its base is the protected default branch;
5. its merge commit identifier is a valid Git object SHA; and
6. that merge commit is identical to or an ancestor of current protected main.

The dispatch payload contains only the merge SHA, pull-request number, and
reviewed head SHA. The receiving CI workflow is loaded from protected default
branch. Its first job checks out only the event-defined protected-main commit,
loads the pull request as inert API data, and validates the payload through
trusted `scripts/ci/post-merge-context.mjs`. It also proves locally that the
requested merge commit is an ancestor of the event's main commit. Only after
that proof do downstream jobs check out and execute the exact merge commit.

The dispatch path references no repository or environment secret, adds no token
permission, executes no pull-request branch or artifact, and fails closed for
malformed input, forks, moved heads, unmerged pull requests, unexpected bases,
merge mismatches, or commits not reachable from protected main.

## Verification Semantics

The post-merge run executes the normal workspace, governance, and gitleaks jobs
against the exact squash commit. Dependency review remains a pull-request-only
check because it requires a pull-request delta and already passed before merge.
The existing required check names and branch-protection rules do not change.
Repository-dispatched runs use their trusted GitHub run identifier for
concurrency, so a later merge cannot cancel an earlier commit's exact
post-merge verification. Pull-request and ordinary main-push runs retain their
existing ref-based cancellation behavior.

Dispatch occurs after the irreversible GitHub merge operation because the
squash commit does not exist beforehand. A dispatch or post-merge CI failure
therefore cannot undo the merge. It instead makes the controlled merge workflow
or resulting CI run visibly fail and requires attended remediation. The four
pre-merge protected checks remain the enforcement boundary for admitting the
commit to main.

## Canary And Rollback

Task 65 itself changes trusted workflow behavior and must merge through an
attended review. After merge, a separate non-behavioral canary must prove that:

- controlled auto-merge dispatches one post-merge CI event;
- the run resolves the exact squash commit;
- trusted-main context validation succeeds;
- workspace, governance, and gitleaks jobs pass; and
- no extra branch, secret, token permission, or PR-controlled code path is used.

Rollback is an attended revert of Task 65's two workflow changes, trusted
context evaluator, tests, and this decision record. That restores the previous
pre-merge-only behavior without changing product code, dependencies, Aegis
runtime, authority, branch protection, deployment, or data.
