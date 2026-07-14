# Task ID: 69

**Title:** Support Attended Aegis Witness Review for Test Deletions

**Status:** done

**Dependencies:** 48 ✓

**Priority:** high

**Description:** Allow the required governance check to distinguish deletion-only Aegis witness escalations from integrity failures while preserving mandatory exact-head attended merge review.

**Details:**

Implement a blog-local, deterministic wrapper policy in scripts/ci/check-aegis.py. Treat a CI witness result as review-required but check-passing only when every check except diff_accounting passes, every diff path is accounted for, the sole failure is a nonempty exact set of normalized deleted test paths, and the escalation set matches exactly. Preserve fail-closed behavior for malformed reports, unaccounted paths, missing verification, task drift, scope failures, or any additional failure. Do not modify the managed Aegis witness asset. Prove the existing trusted auto-merge classifier still denies removed or renamed-away tests, so the PR can merge only after explicit exact-head owner approval through the normal protected path. Add focused adversarial tests and complete Taskmaster/Aegis evidence.

**Test Strategy:**

No test strategy provided.
