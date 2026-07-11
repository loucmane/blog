# Task ID: 67

**Title:** Support Gitleaks on trusted post-merge dispatch

**Status:** done

**Dependencies:** 66 ✓

**Priority:** high

**Description:** Remediate the repository_dispatch incompatibility exposed by Task 66 without weakening secret scanning.

**Details:**

Keep the immutable-SHA-pinned gitleaks/gitleaks-action path for push and pull_request. Add a separate repository_dispatch path using an immutable-version-pinned official Gitleaks CLI artifact with published checksum verification. Scan exactly needs.context.outputs.checkout_ref after trusted-context validation, preserve fetch-depth 0 and existing configuration/history coverage, fail closed on malformed dispatch context, and never execute PR-controlled code or artifacts. Add deterministic workflow-contract tests for both paths and run the complete workflow, governance, workspace, Taskmaster, Aegis, guard, secret-scan, and diff verification matrix. Scope changes to CI/workflow tests, Taskmaster, planning, and Aegis evidence; no product, package-version, lockfile, runtime, authority, deployment, or secret changes. Task 66 remains complete and archived.

**Test Strategy:**

No test strategy provided.
