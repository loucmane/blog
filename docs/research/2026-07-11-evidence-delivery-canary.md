# Evidence-Authorized Delivery Canary

**Task:** 62
**Authority:** `standing-grant:sota-magazine-2026-autonomy-v2`
**Status:** awaiting protected CI and autonomous delivery

## Purpose

This documentation-only change is the positive canary for the project-wide
delivery policy introduced by Task 61. It deliberately carries no
`auto-merge` label. The trusted default-branch workflow, rather than pull
request code or a chat confirmation, must decide whether the exact head may be
squash-merged.

## Required Positive Evidence

The canary passes only if all of the following are observed on GitHub:

1. The pull request is same-repository, non-draft, targets `main`, and has a
   complete changed-file inventory.
2. The four exact required checks pass on the unchanged head SHA.
3. GitHub reports the pull request CLEAN and mergeable with no unresolved
   review thread or changes-requested review.
4. The controlled workflow classifies every path from trusted `main`, does not
   execute pull request code, and merges without a positive label.
5. The merge is squash-only with exact-head matching.
6. Only the merged task branch is deleted.
7. Remote `main` contains the canary and passes its push-triggered CI run.
8. The next Task 62 evidence slice begins without asking for merge approval.

## Required Negative Evidence

Task 61's protected policy tests remain the negative canary. They must continue
to deny manual/high-risk labels, CI or workflow control changes, operator
authority and Aegis changes, secrets, deployment, migrations, destructive
operations, branch protection, test removal or rename-away, malformed rename
provenance, stale heads, incomplete inventories, untrusted check apps, failed
checks, unsupported applicable product-test capabilities, and changed package
scripts.

## Completion Rule

This document does not claim success in advance. After the autonomous merge,
Task 62 must record the actual pull request, exact head, workflow run, squash
commit, branch-deletion result, main synchronization, and next-step behavior in
its Aegis evidence before the task is marked done.
