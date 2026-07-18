# Task 71 Refresh Aegis Runtime for Portable Codex Hook Trust - Decisions

## Purpose
Record decisions before implementation, including options considered, rationale, and evidence.

## Decisions
- 2026-07-15 - Use Aegis-native current work as the portable workflow authority for this task. Taskmaster and Serena remain optional unless explicitly required.
- 2026-07-15 - Operate under the project owner's explicit approval for this exact managed-runtime rollout plus `standing-grant:sota-magazine-2026-autonomy-v2`; the authority document remains unmodified at `docs/ai/AEGIS_AUTONOMY_GRANT.md`.
- 2026-07-15 - Apply only when the final preview retains zero conflicts, manual-review paths, unsafe paths, and non-managed paths and identifies stable source `420006a61049d38f46616ebeee7a5e9a8460196b`.
- 2026-07-15 - Preserve advisory enforcement and structurally preserve every unrelated `.codex/hooks.json` registration. Do not inspect or modify any other `.codex` path.
- 2026-07-15 - Deliver the managed rollout as a separate attended governance PR. Do not auto-merge because Aegis runtime, hook, schema, and governance paths are protected.
- 2026-07-15 - Do not modify product code, package manifests, lockfiles, workflows, Task 42 evidence, deployment, secrets, branch protection, or operator authority.
- 2026-07-15 - Continue the existing dedicated Task 71 envelope rather than create an overlapping rollout task. Advance only to pinned stable source `197dc31537f8a6b289b04fb0cc69d244943359ff` after the zero-conflict metadata-only preview.
- 2026-07-15 - Do not export Taskmaster context to a third-party provider merely to rewrite the task description. Preserve the unchanged Taskmaster record and use repository-local Task 71 evidence for this explicitly authorized continuation.
- 2026-07-15 - Configure Remote Control project trust only after the tracked runtime PR merges and main is synchronized. Use the supported Aegis trust interface against `/home/loucmane/codex/.codex/remote-control`, preserve unrelated host-local settings, and require idempotence.
- 2026-07-15 - Treat normal Codex project trust, Remote Control project trust, tracked hook-review guidance, and actual client-local exact-definition hook trust as four distinct states. Never copy hook hashes or claim `/hooks` approval; stop at that attended boundary.

## Progress Log
- **2026-07-15 14:27 CEST** - [S:20260715|W:task71-refresh-aegis-hook-trust-runtime|H:aegis:kickoff|E:.aegis/state/current-work.json] Decisions log initialized by Aegis kickoff.
- **2026-07-15 14:29 CEST** - [S:20260715|W:task71-refresh-aegis-hook-trust-runtime|H:agent:scope|E:docs/ai/work-tracking/active/20260715-task71-refresh-aegis-hook-trust-runtime-ACTIVE/FINDINGS.md] Confirmed the explicit nine-path managed-runtime scope and attended delivery boundary

<!-- AEGIS:BEGIN generated-sweh-projection -->
<!-- AEGIS:projection-state {"event_count": 12, "last_event_id": "f389a8f80d9e40d5b6b85e8e67e452fc", "schema": "legacy-shadow-sweh-projection-v1"} -->

## Generated S:W:H:E Projection

_Generated from the passive Aegis ledger. Human-authored content outside this block is preserved._

- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:f19b5bb242d...] Session began via compact.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:7589845bc43...] Session began via compact.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:task-truth E:ledger:f738c845048...] Task truth recorded for task truth: changed.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:task-truth E:ledger:99ac79e37d5...] Task truth recorded for task truth: changed.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:task-truth E:ledger:bf83b311741...] Task truth recorded for task truth: changed.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:task-truth E:ledger:09eb6d3e168...] Task truth recorded for task truth: changed.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:feddd0e74ed...] Session began via resume.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:efe60053d93...] Session began via resume.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:ed333be5818...] Session began via resume.
- [S:2026-07-15-001-task71-refresh-aegis-hook-trust-runtime W:task-71-refresh-aegis-hook-trust-runtime H:witness E:ledger:37ff249a315...] Delivery witness FAIL recorded at 6e6fa16; report: .aegis/reports/witness-report.json.
- [S:2026-07-15-001-task71-refresh-aegis-hook-trust-runtime W:task-71-refresh-aegis-hook-trust-runtime H:scope E:ledger:1cfefc77801...] Scope recorded for 71. Paths: .aegis/bin/aegis, .aegis/foundation-manifest.json, .claude/scripts/gate_lib.py.
- [S:2026-07-15-001-task71-refresh-aegis-hook-trust-runtime W:task-71-refresh-aegis-hook-trust-runtime H:witness E:ledger:f389a8f80d9...] Delivery witness PASS recorded at 6e6fa16; report: .aegis/reports/witness-report.json.

<!-- AEGIS:END generated-sweh-projection -->
