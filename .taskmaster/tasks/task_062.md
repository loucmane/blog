# Task ID: 62

**Title:** Prove project-wide evidence-authorized delivery canary

**Status:** in-progress

**Dependencies:** 61 ✓

**Priority:** high

**Description:** Run a same-repository non-behavioral canary after Task 61 lands and prove that the trusted workflow evaluates it without an auto-merge label, waits for all required exact-head evidence, squash-merges it automatically, deletes only its task branch, synchronizes main, and advances to the next dependency-ready task without a chat approval.

**Details:**

The canary must be a real Taskmaster/Aegis-scoped PR with a harmless documentation-only change. Capture the CI run, controlled-auto-merge decision, exact head, merge commit, branch deletion, local-main synchronization, Aegis delivery state, and next-task continuation. Include negative confirmation that manual-merge/high-risk labels and prohibited paths remain denied. If any automatic step fails, leave Task 62 blocked with the exact workflow evidence and do not bypass the protected path.

**Test Strategy:**

No test strategy provided.
