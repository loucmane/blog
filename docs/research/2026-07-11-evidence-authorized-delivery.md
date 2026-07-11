# Evidence-Authorized Autonomous Delivery

**Task:** 61
**Authority:** `standing-grant:sota-magazine-2026-autonomy-v2`
**Status:** bootstrap governance change

## Decision

The blog uses unattended squash merge as the default for ordinary,
Taskmaster-backed, same-repository pull requests. Authorization is earned by
the exact-head evidence chain, not by an attended chat message or a positive
`auto-merge` label.

The trusted workflow runs from protected `main`, never checks out or executes
pull-request code, and requires all of the following before merge:

1. the pull request is open, non-draft, same-repository, and targets `main`;
2. the complete changed-file inventory is available;
3. the exact head has not moved and is current with protected `main`;
4. GitHub reports the pull request CLEAN and mergeable;
5. no deny label or prohibited risk/path category is present;
6. every exact required check succeeded on that head from GitHub Actions;
7. applicable test capabilities are real and declared supported by trusted
   `config/ci/verification-capabilities.json`;
8. changed package manifests preserve trusted test/build scripts;
9. policy, labels, file inventory, mergeability, and checks are fetched and
   evaluated again immediately before merge;
10. the merge uses squash, exact-head matching, and deletes only the merged
    task branch.

## Risk Model

Automatically eligible after applicable checks:

- documentation, plans, Taskmaster projections, and Aegis task evidence;
- registered domain skills and their deterministic fixtures;
- ordinary application source, tests, and reversible refactors once the real
  applicable test capabilities are supported;
- dependency and lockfile changes once applicable tests are supported and
  package scripts remain identical to trusted `main`.
- `.aegis/foundation-manifest.json` only when trusted semantic comparison
  proves the sole change is a valid, monotonic
  `verification.last_verified_at` update.

Attended by exception:

- CI workflows, merge policy, verification-control scripts/configuration, and
  branch protection;
- operator authority, Aegis enforcement/runtime, agent hooks/settings/entry
  points, and the cross-agent control skill;
- secrets, production deployment/data, irreversible migrations, destructive
  operations, force-pushes, and history rewriting;
- pull requests carrying `manual-merge`, `high-risk`, or another deny label.

## Test Honesty

The current unit and browser steps are explicit unsupported-capability bridges;
they do not prove product behavior. Therefore trusted main declares both
capabilities `unsupported`, and the merge classifier denies unattended product
source and dependency changes that require them. Task 39 owns replacing those
bridges with real Vitest/integration/Playwright/accessibility execution and then
changing the protected capability declaration to `supported` in the same
attended verification-control PR.

This prevents a green job from being misrepresented as evidence that tests ran.
Documentation and domain-skill PRs can still merge autonomously because their
applicable deterministic suites are already real and enforced.

## Package-Script Integrity

Dependency updates must be possible without making the proof system mutable by
the same pull request. The privileged workflow may retrieve a changed
`package.json` as inert JSON data, but it never executes it. A trusted policy
compares its `scripts` object to the protected-main manifest. Dependency,
engine, and package-manager fields may change after applicable capabilities are
supported; script changes remain attended.

## Verification-Only Aegis Manifest Exception

Task 64 narrows one false-stop case without weakening the default Aegis deny
boundary. The privileged workflow loads its evaluator and the base manifest
only from protected `main` and never checks out or executes pull-request
content. An independent review identified that GitHub's
[Contents API can return a symlink target's content](https://docs.github.com/en/rest/repos/contents#get-repository-content),
so content equality alone is insufficient proof of the protected path's Git
object type.

The remediated workflow resolves the trusted-base and exact-head commits
through GitHub's Git Database APIs, traverses the root and `.aegis` trees one
level at a time, and rejects every response unless it is explicitly
non-truncated. GitHub documents the distinct file, executable, tree, submodule,
and symlink modes and recommends non-recursive subtree traversal when a tree is
truncated in its [Git Trees API](https://docs.github.com/en/rest/git/trees#get-a-tree).
Both revisions must contain exactly one `.aegis` tree entry and exactly one
`foundation-manifest.json` entry with `type=blob` and `mode=100644`. Only then
does the workflow retrieve each manifest by the verified blob SHA through the
[Git Blobs API](https://docs.github.com/en/rest/git/blobs#get-a-blob), validate
the response SHA, encoding, decoded size, and JSON object shape, and pass the
inert values to trusted policy code.

The exception applies only to an in-place modification of
`.aegis/foundation-manifest.json`. Both documents must be valid JSON objects,
both timestamps must be valid RFC 3339 values, the head timestamp must advance,
and neither timestamp may be later than trusted runner evaluation time plus a
documented five-minute clock skew. A protected-main timestamp already beyond
that bound fails closed for attended recovery. Canonical comparison after removing only
`verification.last_verified_at` must be equal. Missing evidence, a stale or
unchanged timestamp, added/removed/renamed manifests, or any other key or value
change remains attended. Every other `.aegis/` path remains denied.

The policy result is included in both initial and final file-policy evaluation.
The Task 64 pull request itself remains attended because it changes the trusted
workflow and policy. Rollback is a reviewed revert of Task 64, which restores
the prior deny-all behavior for `.aegis/foundation-manifest.json` without
changing Aegis runtime state, authority, enforcement, product code, packages,
or data.

## Bootstrap And Canary

Task 61 necessarily modifies the workflow and authority that decide whether it
may merge, so it is the final bootstrap-governance exception authorized by the
owner's 2026-07-11 instruction. After it lands, run a same-repository,
non-behavioral canary without an `auto-merge` label. The canary passes only if:

- all required checks run on its exact head;
- the trusted workflow classifies it automatically;
- it squash-merges without a fresh chat approval;
- only its feature branch is deleted;
- local `main` can synchronize cleanly; and
- the agent advances to the next dependency-ready task without stopping at a
  merge prompt.
