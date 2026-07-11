# Controlled Post-Merge CI Canary

**Task:** 66 — Prove controlled post-merge CI dispatch canary

**Authority:** `standing-grant:sota-magazine-2026-autonomy-v2`

**Scope:** documentation, Taskmaster projection, and Aegis delivery evidence only

## Purpose

This pull request is the first live canary for the trusted post-merge verification
path installed by Task 65. It intentionally changes no product code, package or
lockfile, workflow, permission, Aegis runtime, operator authority, deployment, or
secret surface.

The canary succeeds only when the existing controlled auto-merge workflow:

1. evaluates the exact same-repository pull-request head against protected
   `main`;
2. observes every required pull-request check as successful;
3. classifies the complete changed-file inventory as non-behavioral and eligible;
4. squash-merges without an administrative bypass;
5. deletes only the merged canary branch;
6. dispatches `post-controlled-auto-merge-ci` for the exact squash commit; and
7. the trusted CI workflow resolves and verifies that exact protected-main
   commit without executing pull-request-controlled code.

Post-merge success is not pre-claimed in this document. The GitHub run, resolved
merge SHA, check results, branch deletion, and synchronized-main state must be
recorded as delivery evidence after the workflow reaches a terminal result.

## Task 65 Merge Baseline

- Reviewed Task 65 head: `d1683e17630b455c7d694d7e582e7963097e26c3`
- Protected squash merge: `5410f6ddc392b4edee2510522d4cc15783c96852`
- Reviewed and merged tree: `6ca50b57e196aeeb8358d4b090d8f6f6218df03c`
- Main-push CI run: <https://github.com/loucmane/blog/actions/runs/29164263379>

The first workspace attempt failed in typecheck and build with an existing mixed
React type-surface error: the web app uses React 19 types while the shared UI
package declares React 18 development types. The identical tree passed its pull
request run, passed a fresh local archived-tree install/typecheck, and passed one
bounded rerun of the failed main workspace job. Run attempt 2 completed
successfully without source changes, dependency changes, lockfile changes,
suppression, skipped checks, or weakened enforcement.

This environment-sensitive baseline defect remains real evidence for the later
test/tooling and React modernization tasks. The canary does not fix or conceal it.

## Fail-Closed Expectations

The canary must stop without manual fallback if any of these conditions occurs:

- the pull-request head moves after verification;
- the branch is a fork, is out of date, or does not target protected `main`;
- a required check is absent, pending, or unsuccessful;
- a review conversation is unresolved;
- the changed-file inventory is incomplete or contains a prohibited path;
- the controlled workflow denies the pull request;
- the repository dispatch payload, merged pull request, ancestry proof, or exact
  merge SHA does not agree; or
- any post-merge workspace, governance, or gitleaks job fails.

Dependency review remains a pull-request-only required check. The dispatched
post-merge run must preserve that explicit skip while independently running the
workspace, governance, and gitleaks verification jobs against the exact merge.

## Rollback

The canary itself is reversible by reverting its documentation and task-evidence
commit through a protected pull request. A canary failure does not authorize a
manual merge, workflow bypass, workflow edit, force operation, or rollback of
unrelated Task 65 behavior.
