# Controlled Auto-Merge Canary

**Task:** 48 — Bootstrap Protected CI and Controlled Auto-Merge
**Authority:** `standing-grant:sota-magazine-2026-autonomy-v1`
**Risk class:** Documentation-only canary

## Purpose

This inert document is the single functional payload used to prove the repository's controlled auto-merge path after the reviewed workflow reached protected `main`.

## Required Observations

The canary is successful only when GitHub evidence proves that:

1. all four protected required checks pass for the exact canary head;
2. the authenticated project owner applies the existing `auto-merge` label manually;
3. the privileged labeled run uses the workflow definition and policy script from protected default-branch `main`;
4. the policy receives a complete file inventory and classifies every changed path as eligible;
5. the merge matches the exact canary head, uses squash without administrator bypass, and deletes only the merged canary branch; and
6. local `main` fast-forwards to the resulting merge commit with a clean working tree.

## Non-Goals

- No product, package, workflow, permission, secret, deployment, migration, branch-protection, or Aegis-runtime change.
- No automatic label application.
- No claim that subjective or LLM-produced findings are merge blockers.

The workflow run, check results, merge SHA, branch deletion, and Aegis delivery evidence are recorded during Task 48 closeout after the canary merges.
