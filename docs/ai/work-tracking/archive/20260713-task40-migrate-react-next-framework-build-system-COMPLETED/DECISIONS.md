# Task 40 Migrate React Framework and Build System - Decisions

## Purpose
Record decisions before implementation, including options considered, rationale, and evidence.

## Decisions
- 2026-07-13 - Use Aegis-native current work as the portable workflow authority for this task. Taskmaster and Serena remain optional unless explicitly required.
- 2026-07-14 - Exact-pin Next.js `16.2.10`, React/React DOM `19.2.7`,
  `@types/react` `19.2.17`, and `@types/react-dom` `19.2.3`. These are the
  current stable registry releases, the selected Next major is Active LTS, the
  pairing is supported by Next's peer contract, and React `19.2.7` is beyond
  the patched `19.2.1` boundary for GHSA-fv66-9v8q-g76r.
- 2026-07-14 - Adopt Next 16's stable default Turbopack build path rather than
  preserving the obsolete custom Webpack chunking/SVGR configuration. No
  overlapping Vite application will be introduced; Vite remains test tooling.
  If a required SVG import appears, prefer an explicit asset/component boundary
  rather than retaining an unused global Webpack loader.
- 2026-07-14 - Preserve the owner-authorized managed Aegis rollout as
  pre-existing infrastructure state and leave every rollout path unstaged.
  Continue Task 40 with an explicit task-only staging inventory; never restore,
  remove, move, hide, inspect, or stage user-owned `.codex/`.
- 2026-07-14 - Remove `output: 'standalone'` and use the documented generic
  `next start` path as Task 40's portable Node baseline. Deployment packaging
  remains Task 46 and no provider-specific adapter is introduced here.
- 2026-07-14 - Replace the stale third-party CSP with a same-origin baseline.
  Production removes `unsafe-eval`; Next's static hydration still requires
  inline script/style compatibility until a measured nonce or hash strategy can
  preserve reader caching without making every route dynamic.
- 2026-07-14 - Treat preview credentials as write-only request data, never URL
  state. A successful POST enables Draft Mode and a separate, HttpOnly,
  five-minute HMAC scope bound to exactly one normalized slug. Redirects are
  constructed only from the configured site origin; preview responses are
  private, no-store, and no-referrer.
- 2026-07-14 - Use immediate tag expiry for publish/unpublish correctness and
  reject malformed or unknown slugs before constructing persistent cache keys.
  Keep the fixed Task 40 fixture route closed to ungenerated parameters; Task 42
  will replace this fixture boundary with the approved content store.
- 2026-07-14 - Production metadata may never fall back to localhost. Until Task
  46 proves the real canonical deployment origin, missing or invalid production
  configuration resolves to the non-routable
  `https://unconfigured.magazine.invalid` sentinel. Local production tests may
  use HTTP only on loopback.

## Progress Log
- **2026-07-13 16:38 CEST** - [S:20260713|W:task40-migrate-react-next-framework-build-system|H:aegis:kickoff|E:.aegis/state/current-work.json] Decisions log initialized by Aegis kickoff.
- **2026-07-14 07:22 CEST** - [S:20260713|W:task40-migrate-react-next-framework-build-system|H:agent:decision|E:docs/ai/work-tracking/active/20260713-task40-migrate-react-next-framework-build-system-ACTIVE/DECISIONS.md] Selected the exact current stable Next 16/React 19.2 pair and Turbopack path. The owner classified the concurrent managed-runtime rollout as pre-existing infrastructure that must remain intact and unstaged, allowing Task 40 to proceed with an explicit task-only inventory. authority=standing-grant:sota-magazine-2026-autonomy-v2
- **2026-07-14 14:46 CEST** - [S:20260714|W:task40-migrate-react-next-framework-build-system|H:agent:security-decisions|E:packages/web/src/lib/request-security.ts] Adopted POST-only, slug-bound preview authorization; trusted-origin redirects; immediate publish-state invalidation; bounded cache construction; and fail-closed production canonical metadata in response to independent review. authority=standing-grant:sota-magazine-2026-autonomy-v2

<!-- AEGIS:BEGIN generated-sweh-projection -->
<!-- AEGIS:projection-state {"event_count": 6, "last_event_id": "24f30c91403544fe82fa7df384ee0c3e", "schema": "legacy-shadow-sweh-projection-v1"} -->

## Generated S:W:H:E Projection

_Generated from the passive Aegis ledger. Human-authored content outside this block is preserved._

- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-40-migrate-react-next-framework-build-system H:session E:ledger:2d46fc883f1...] Session began via compact.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-40-migrate-react-next-framework-build-system H:session E:ledger:eafebcf10a0...] Session began via compact.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-40-migrate-react-next-framework-build-system H:session E:ledger:8ac1563216d...] Session began via compact.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-40-migrate-react-next-framework-build-system H:task-truth E:ledger:ebcbe0fe6f9...] Task truth recorded for task truth: changed.
- [S:2026-07-13-001-task40-migrate-react-next-framework-build-system W:task-40-migrate-react-next-framework-build-system H:scope E:ledger:e783a9fd48b...] Scope recorded for 40. Paths: .plan_state/sync.log, .prettierignore, .taskmaster/tasks/task_040.md.
- [S:2026-07-13-001-task40-migrate-react-next-framework-build-system W:task-40-migrate-react-next-framework-build-system H:witness E:ledger:24f30c91403...] Delivery witness PASS recorded at 4f80ab9; report: .aegis/reports/witness-report.json.

<!-- AEGIS:END generated-sweh-projection -->
