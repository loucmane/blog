# Task ID: 71

**Title:** Refresh Aegis Runtime for Portable Codex Hook Trust

**Status:** done

**Dependencies:** 70 ✓

**Priority:** high

**Description:** Refresh the Blog's installer-managed Aegis runtime from stable source 144bd446 to 420006a so strict verification uses the tracked portable Codex hook-trust contract in clean worktrees.

**Details:**

Run the supported update preview and apply only with zero conflicts, manual-review paths, unsafe paths, and non-managed paths. Limit changes to the nine reviewed managed Aegis/Codex governance assets, preserve advisory enforcement and unrelated hook registrations, run strict verification and repository governance checks, and deliver through a separate attended PR. Do not modify product code, packages, lockfiles, Task 42 evidence, deployment, secrets, or branch protection.

**Test Strategy:**

No test strategy provided.
