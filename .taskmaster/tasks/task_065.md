# Task ID: 65

**Title:** Guarantee post-merge CI after controlled auto-merge

**Status:** done

**Dependencies:** 52 ✓, 64 ✓

**Priority:** high

**Description:** Ensure controlled auto-merge explicitly launches trusted CI for the exact squash merge commit because pushes created with github.token do not produce a push-triggered workflow run.

**Details:**

Add a protected-default-branch post-merge verification dispatch with least privilege, exact merge-SHA binding, fail-closed validation, adversarial workflow contract tests, and evidence that the merged commit receives deterministic CI without executing PR-controlled code. Preserve all existing auto-merge trust-boundary, branch-protection, and deny-path controls. Do not change product code, packages, lockfiles, Aegis runtime, authority, deployment, or secrets.

**Test Strategy:**

No test strategy provided.
