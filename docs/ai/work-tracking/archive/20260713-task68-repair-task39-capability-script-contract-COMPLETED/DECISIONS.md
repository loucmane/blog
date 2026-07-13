# Task 68 Repair Task 39 Capability Script Contract - Decisions

## Purpose
Record decisions before implementation, including options considered, rationale, and evidence.

## Decisions
- 2026-07-13 - Use Aegis-native current work as the portable workflow authority for this task. Taskmaster and Serena remain optional unless explicitly required.
- 2026-07-13 - Keep the root package script unchanged and make the checker default to the exact ordered modes `unit` and `browser`; preserve explicit single-mode calls for CI and diagnostics.
- 2026-07-13 - Fail closed if the root command omits either mode, and update only the two trusted-file digests in `config/runtime.json`.

## Progress Log
- **2026-07-13 01:21 CEST** - [S:20260713|W:task68-repair-task39-capability-script-contract|H:aegis:kickoff|E:.aegis/state/current-work.json] Decisions log initialized by Aegis kickoff.
- **2026-07-13 01:22 CEST** - [S:20260713|W:task68-repair-task39-capability-script-contract|H:agent:scope|E:docs/ai/work-tracking/active/20260713-task68-repair-task39-capability-script-contract-ACTIVE/FINDINGS.md] Confirmed Task 68 scope: repair only the root test:capability command and its deterministic contract so both unit and browser modes execute; preserve all package versions, lockfile bytes, product code, CI workflows, Aegis runtime/authority, deployment, secrets, completed Task 39 archive, and user-owned .codex. Record post-merge reproduction: pnpm test:capability exited 2 because check-test-capability.mjs requires a mode while explicit unit and browser checks both passed. Taskmaster 0.43.1 also normalized historical ID representation during supported task creation; retain no semantic task changes beyond Task 68 and prove graph equivalence. authority=standing-grant:sota-magazine-2026-autonomy-v2
