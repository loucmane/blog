# Task 61 Implement project-wide evidence-authorized autonomous delivery - Decisions

## Purpose
Record decisions before implementation, including options considered, rationale, and evidence.

## Decisions
- 2026-07-11 - Use Aegis-native current work as the portable workflow authority for this task. Taskmaster and Serena remain optional unless explicitly required.
- 2026-07-11 - Default ordinary same-repository task PRs to autonomous squash merge after exact-head evidence passes; use deny labels and exceptional risk categories as opt-outs.
- 2026-07-11 - Never treat an unsupported test bridge as proof. Product/dependency auto-merge remains fail-closed until Task 39 installs applicable real tests and updates the protected capability contract.
- 2026-07-11 - Permit dependency-field updates only when trusted-main comparison proves package scripts unchanged; script and verification-control changes remain attended.

## Progress Log
- **2026-07-11 00:05 CEST** - [S:20260711|W:task61-domain-skill-auto-merge|H:aegis:kickoff|E:.aegis/state/current-work.json] Decisions log initialized by Aegis kickoff.
- **2026-07-11 00:06 CEST** - [S:20260711|W:task61-domain-skill-auto-merge|H:agent:scope|E:docs/ai/work-tracking/active/20260711-task61-domain-skill-auto-merge-ACTIVE/FINDINGS.md] Confirmed scope: permit controlled auto-merge for registered domain-skill paths and authorize the label while preserving all non-skill authority protections.
