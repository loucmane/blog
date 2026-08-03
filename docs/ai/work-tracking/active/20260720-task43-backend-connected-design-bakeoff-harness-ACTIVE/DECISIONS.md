# Task 43 Backend-Connected Design Bakeoff Harness - Decisions

## Purpose
Record decisions before implementation, including options considered, rationale, and evidence.

## Decisions
- 2026-07-20 - Use Aegis-native current work as the portable workflow authority for this task. Taskmaster and Serena remain optional unless explicitly required.
- 2026-07-23 - Represent Folio, Contact, and Halo as bespoke finalists and the eleven earlier
  directions through one configuration-driven archive adapter with five layout families.
- 2026-07-23 - Keep one shared `OwnerApiClient`, story-document adapter, and lifecycle
  controller for every direction; visual components receive typed story state and actions only.
- 2026-07-23 - Use a grouped direction picker instead of fourteen persistent tabs so the
  owner can compare rounds without losing the top-level desk/write/reader controls.
- 2026-07-23 - Do not update Next, sharp, the lockfile, or the managed legacy guard inside
  this design task. Preserve the red gates as explicit blockers for their owning work.

## Progress Log
- **2026-07-20 11:47 CEST** - [S:20260720|W:task43-backend-connected-design-bakeoff-harness|H:aegis:kickoff|E:.aegis/state/current-work.json] Decisions log initialized by Aegis kickoff.
- **2026-07-20 11:47 CEST** - [S:20260720|W:task43-backend-connected-design-bakeoff-harness|H:agent:scope|E:docs/ai/work-tracking/active/20260720-task43-backend-connected-design-bakeoff-harness-ACTIVE/FINDINGS.md] Confirmed Task 43.1 scope: tracked owner-authenticated design lab, shared backend lifecycle, Folio Contact Halo registry, focused contract and browser tests; no package lockfile workflow Aegis runtime or unrelated product changes
- **2026-07-23 12:09 CEST** - [S:20260720|W:task43-backend-connected-design-bakeoff-harness|H:agent:verification|E:docs/ai/work-tracking/active/20260720-task43-backend-connected-design-bakeoff-harness-ACTIVE/reports/backend-connected-design-bakeoff-harness/task-verification.md] Kept out-of-scope dependency and governance failures visible instead of weakening the verification contract.

<!-- AEGIS:BEGIN generated-sweh-projection -->
<!-- AEGIS:projection-state {"event_count": 12, "last_event_id": "ded364dbc25e4384ae41fbf83d6739cc", "schema": "legacy-shadow-sweh-projection-v1"} -->

## Generated S:W:H:E Projection

_Generated from the passive Aegis ledger. Human-authored content outside this block is preserved._

- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:ee9af6599d2...] Session began via compact.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:task-truth E:ledger:aa0cce59f17...] Task truth recorded for task truth: changed.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:task-truth E:ledger:49ce24df33c...] Task truth recorded for task truth: changed.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:task-truth E:ledger:6c2e1e4a987...] Task truth recorded for task truth: changed.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:task-truth E:ledger:d9b71d0c599...] Task truth recorded for task truth: changed.
- [S:2026-07-20-001-task43-backend-connected-design-bakeoff-harness W:task-43-backend-connected-design-bakeoff-harness H:scope E:ledger:109b8a12382...] Scope recorded for 43. Paths: packages/web/src/design-lab/**, packages/web/src/components/owner/design-lab.tsx, packages/web/src/app/owner/design-lab/**.
- [S:2026-07-20-001-task43-backend-connected-design-bakeoff-harness W:task-43-backend-connected-design-bakeoff-harness H:witness E:ledger:42da6c6ffe5...] Delivery witness PASS recorded at 1c76b30; report: .aegis/reports/witness-report.json.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:9428b3289d1...] Session began via compact.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:6835c75e71e...] Session began via compact.
- [S:2026-07-20-001-task43-backend-connected-design-bakeoff-harness W:task-43-backend-connected-design-bakeoff-harness H:scope E:ledger:bfa793fa49b...] Scope recorded for 43. Paths: packages/web/src/design-lab/**, packages/web/src/components/owner/design-lab.tsx, packages/web/src/app/owner/design-lab/**.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:task-truth E:ledger:1d5ab6ed93d...] Task truth recorded for task truth: changed.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-41-modernize-tailwind-shadcn-workspaces H:session E:ledger:ded364dbc25...] Session began via compact.

<!-- AEGIS:END generated-sweh-projection -->
