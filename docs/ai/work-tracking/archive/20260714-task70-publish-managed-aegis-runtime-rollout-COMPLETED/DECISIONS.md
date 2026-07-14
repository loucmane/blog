# Task 70 Publish Owner-Authorized Managed Aegis Runtime Rollout - Decisions

## Purpose
Record decisions before implementation, including options considered, rationale, and evidence.

## Decisions
- 2026-07-14 - Use Aegis-native current work as the portable workflow authority for this task. Taskmaster and Serena remain optional unless explicitly required.
- 2026-07-14 - Preserve the owner-approved `144bd446` rollout exactly; do not apply the seven-path `655e971` preview because that is a different managed-runtime update.
- 2026-07-14 - Keep verification fail-closed. Do not commit ignored install reports or manufacture hook-trust state merely to satisfy strict verification in a clean checkout.
- 2026-07-14 - Preserve the active Task 69 identity by registering its existing definition through supported Taskmaster commands before allocating Task 70; copy no Task 69 implementation or evidence into this branch.
- 2026-07-14 - Use merged upstream `589bf62669f074a417ad844bd3ef95e71ec28e96` only as the clean verification authority. Do not apply its nine-path managed update preview or replace any approved `144bd446` rollout byte in Task 70.
- 2026-07-14 - Complete Task 70 after merged-source strict verification, manifest hash parity, deterministic handoff repair, clean final closeout, and Taskmaster reconciliation. Delivery remains attended because the PR changes managed Aegis and agent-governance paths.

## Progress Log
- **2026-07-14 19:15 CEST** - [S:20260714|W:task70-publish-managed-aegis-runtime-rollout|H:aegis:kickoff|E:.aegis/state/current-work.json] Decisions log initialized by Aegis kickoff.
- **2026-07-14 19:15 CEST** - [S:20260714|W:task70-publish-managed-aegis-runtime-rollout|H:agent:scope|E:docs/ai/work-tracking/active/20260714-task70-publish-managed-aegis-runtime-rollout-ACTIVE/FINDINGS.md] Confirmed Task 70 is limited to the exact owner-authorized installer-managed rollout; Tasks 41 and 69 remain preserved, incidental Taskmaster state and all unrelated .codex paths are excluded; authority=explicit-user-approval
