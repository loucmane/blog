# Task ID: 56

**Title:** Refresh Aegis Managed Runtime to Active Upstream

**Status:** done

**Dependencies:** 49 ✓

**Priority:** high

**Description:** Refresh the project-local Aegis managed runtime from manifest source commit 43e9a660c0b58f95c2f97031e16830443b40aa2e to active upstream source commit 3d051ba9937d5e88178e86067e2be4c898897263, without product or package changes.

**Details:**

Run ./.aegis/bin/aegis update --target-dir . as a preview and inspect every operation. Apply only with zero conflicts, unsafe paths, and manual-review paths, then run update --apply. Prove manifest and active source commits equal 3d051ba, compare installed managed-asset hashes to upstream, and verify strict Aegis, brief --check, legacy projections, witness, guards, Taskmaster health, secret scanning, and git diff --check while enforcement remains advisory. Record dogfood that top-level status reported current despite source and asset skew; treat runtime status plus update-preview parity as authoritative. Do not repair unrelated state, enable strict mode, retire legacy scaffolding, or change product/package code. Deliver as a separate attended PR without auto-merge.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 56.1. Retry Stable Managed Update at 432ffc7

**Status:** done
**Dependencies:** None

Retry the existing Task 56 Aegis managed-runtime refresh against stable upstream commit 432ffc7d0bed112426920eb9858b296a440b11b3, which merged fix(aegis): prevent managed update regressions (#257).

**Details:**

Preserve all prior preview, apply, failure, rollback, and upstream-handoff evidence. Follow the documented preview-first retry procedure. Apply only when managed divergence is explicitly detected or safely resolved and all safety paths are clear. Require completed-state regressions, legacy guard, strict advisory Aegis verification, brief, Taskmaster graph, final-head witness, secret scans, parity, second zero-change preview, and diff checks before closeout.
