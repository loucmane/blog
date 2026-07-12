# Task 39 Modernize TypeScript Lint Formatting and Tests - Decisions

## Purpose
Record decisions before implementation, including options considered, rationale, and evidence.

## Decisions
- 2026-07-12 - Use Aegis-native current work as the portable workflow authority for this task. Taskmaster and Serena remain optional unless explicitly required.
- 2026-07-12 - Select TypeScript `6.0.3`, not TypeScript 7, because the supported typescript-eslint chain requires the TypeScript programmatic API and declares support below 6.1.
- 2026-07-12 - Use one root ESLint 10 flat config and one exact Prettier baseline; preserve public `any` contracts under a file-scoped Task 42 bridge instead of silently breaking callback variance or generic defaults.
- 2026-07-12 - Use Vitest/Vite only for tests; keep Next as the sole production framework until Task 40.
- 2026-07-12 - Make test support evidence-based: representative named unit contracts, exact browser projects/journeys, AST deny-path detection, machine-readable zero-skip results, coverage thresholds, and production smoke.
- 2026-07-12 - Permit existing contrast debt only through an exact removal-only Git-blob ratchet; every CI event must provide a trusted predecessor and exact head.

## Progress Log
- **2026-07-12 19:29 CEST** - [S:20260712|W:task39-modernize-typescript-lint-formatting-tests|H:aegis:kickoff|E:.aegis/state/current-work.json] Decisions log initialized by Aegis kickoff.
- **2026-07-12 19:29 CEST** - [S:20260712|W:task39-modernize-typescript-lint-formatting-tests|H:agent:scope|E:docs/ai/work-tracking/active/20260712-task39-modernize-typescript-lint-formatting-tests-ACTIVE/FINDINGS.md] Confirmed Task 39 scope from synchronized main after Task 38 merge 96dba9a; preserved user-owned untracked .codex/; limited work to supported stable TypeScript, ESLint flat config, Prettier, Vitest, Testing Library, Playwright, axe, honest capability contracts, and directly related package/config/test evidence; excluded Task 40 framework/React migration, Task 41 Tailwind/shadcn/workspace migration, product features, deployment, secrets, branch protection, Aegis runtime/manifest/authority, and auto-merge policy. Recorded post-merge Aegis dogfood: strict verification and witness on main failed only completed-task branch/scope alignment while GitHub proved merged PR #29 and green main CI. authority=standing-grant:sota-magazine-2026-autonomy-v2
