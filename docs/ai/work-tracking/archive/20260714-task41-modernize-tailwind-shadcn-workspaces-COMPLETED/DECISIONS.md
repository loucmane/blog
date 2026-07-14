# Task 41 Modernize Tailwind shadcn and Workspace Boundaries - Decisions

## Purpose
Record decisions before implementation, including options considered, rationale, and evidence.

## Decisions
- 2026-07-14 - Use Aegis-native current work as the portable workflow authority for this task. Taskmaster and Serena remain optional unless explicitly required.
- 2026-07-14 - Use `docs/ai/AEGIS_AUTONOMY_GRANT.md` and `standing-grant:sota-magazine-2026-autonomy-v2` as the operator authority; Aegis current-work remains workflow state and neither surface broadens the other.
- 2026-07-14 - Implement ADR 0005's app-local design-system direction if current primary evidence and compatibility checks continue to support it: Tailwind 4 CSS-first styling, owned app-local components, stable Base UI for selected new/migrated primitives, and an explicit time-bounded Radix bridge rather than a big-bang primitive rewrite.
- 2026-07-14 - Remove `packages/ui`, `packages/backend`, and stale `packages/shared` projections only after import inventory, replacement behavior, package/test-capability contracts, builds, browser journeys, accessibility checks, and rollback evidence prove each boundary is obsolete.
- 2026-07-14 - Preserve the Task 40 public framework behavior and representative magazine layouts while replacing stale token/theme plumbing. Task 41 does not implement content storage, owner publishing, distribution, or deployment.
- 2026-07-14 - Pin the exact stable styling chain documented in ADR 0005: Tailwind/PostCSS `4.3.2`, typography `0.5.20`, Base UI `1.6.0`, next-themes `0.4.6`, tailwind-merge `3.6.0`, tw-animate-css `1.4.0`, lucide-react `1.24.0`, and clsx `2.1.1`. No prerelease or generated shadcn payload is accepted.
- 2026-07-14 - Use Base UI only for the representative app-local theme menu. Delete the unconsumed Radix/demo component inventory rather than translating it wholesale, and add future primitives only with an actual owner or reader consumer plus focused tests.
- 2026-07-14 - Support system, light, and dark as product themes. Treat reduced motion and forced colors as independent accessibility behavior instead of preserving the obsolete gentle/high-contrast product modes.
- 2026-07-14 - Collapse the workspace to root plus `packages/web`; remove the unconsumed Express backend, shared type, standalone UI package, exposed component-demo routes, and duplicate toolchains. Tasks 42+ will introduce only architecture-approved product boundaries.
- 2026-07-15 - Reconcile the published Task 41 branch through a separate clean worktree and a normal merge from current main. Do not reset, stash, restore, or inspect the dirty live worktree; preserve its owner-managed Aegis rollout and `.codex/` state. Keep main's Task 69 dependency and Task 70 managed-runtime tree while changing no Task 41 implementation decision.

## Progress Log
- **2026-07-14 17:20 CEST** - [S:20260714|W:task41-modernize-tailwind-shadcn-workspaces|H:aegis:kickoff|E:.aegis/state/current-work.json] Decisions log initialized by Aegis kickoff.
- **2026-07-14 17:23 CEST** - [S:20260714|W:task41-modernize-tailwind-shadcn-workspaces|H:agent:scope-decision|E:docs/decisions/0005-app-local-design-system.md] Selected the reversible app-local cutover boundary and explicit no-big-bang primitive migration rule pending exact registry evidence; authority=standing-grant:sota-magazine-2026-autonomy-v2.
- **2026-07-14 17:49 CEST** - [S:20260714|W:task41-modernize-tailwind-shadcn-workspaces|H:agent:stack-decision|E:docs/decisions/0005-app-local-design-system.md] Accepted the exact stable package chain, app-local ownership, CSS-first Tailwind 4 configuration, Base UI representative primitive, and two-importer workspace boundary; authority=standing-grant:sota-magazine-2026-autonomy-v2.
- **2026-07-15 00:18 CEST** - [S:20260714|W:task41-modernize-tailwind-shadcn-workspaces|H:agent:reconciliation-decision|E:git:79cf385] Chose a non-rewriting merge continuation so PR #34 preserves published history, receives Tasks 69/70 intact, and excludes the live worktree's uncommitted infrastructure state; authority=standing-grant:sota-magazine-2026-autonomy-v2.

<!-- AEGIS:BEGIN generated-sweh-projection -->
<!-- AEGIS:projection-state {"event_count": 8, "last_event_id": "5f72a30d17e84565b1e350e9af5ab141", "schema": "legacy-shadow-sweh-projection-v1"} -->

## Generated S:W:H:E Projection

_Generated from the passive Aegis ledger. Human-authored content outside this block is preserved._

- [S:2026-07-14-001-task41-modernize-tailwind-shadcn-workspaces W:task-41-modernize-tailwind-shadcn-workspaces H:scope E:ledger:57b486fe50d...] Scope recorded for 41. Paths: package.json, pnpm-workspace.yaml, pnpm-lock.yaml.
- [S:2026-07-14-001-task41-modernize-tailwind-shadcn-workspaces W:task-41-modernize-tailwind-shadcn-workspaces H:witness E:ledger:6230052eef9...] Delivery witness PASS recorded at d3c5b16; report: .aegis/reports/witness-report.json.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:2ac11e8be41...] Session began via compact.
- [S:2026-07-14-001-task41-modernize-tailwind-shadcn-workspaces W:task-41-modernize-tailwind-shadcn-workspaces H:scope E:ledger:30f3b7335ec...] Scope recorded for 41. Paths: package.json, pnpm-workspace.yaml, pnpm-lock.yaml.
- [S:2026-07-14-001-task41-modernize-tailwind-shadcn-workspaces W:task-41-modernize-tailwind-shadcn-workspaces H:scope E:ledger:3c0305bf4f9...] Scope recorded for 41. Paths: package.json, pnpm-workspace.yaml, pnpm-lock.yaml.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:7d51ab07a70...] Session began via compact.
- [S:2026-07-14-001-task41-modernize-tailwind-shadcn-workspaces W:task-41-modernize-tailwind-shadcn-workspaces H:witness E:ledger:70c72564efd...] Delivery witness FAIL recorded at 504fea6; report: .aegis/reports/witness-report.json.
- [S:2026-07-14-001-task41-modernize-tailwind-shadcn-workspaces W:task-41-modernize-tailwind-shadcn-workspaces H:scope E:ledger:5f72a30d17e...] Scope recorded for 41. Paths: package.json, pnpm-workspace.yaml, pnpm-lock.yaml.

<!-- AEGIS:END generated-sweh-projection -->
