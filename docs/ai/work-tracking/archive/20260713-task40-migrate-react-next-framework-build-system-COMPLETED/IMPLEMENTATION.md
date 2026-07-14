# Task 40 Migrate React Framework and Build System - Implementation Notes

## Planned Workstreams
- Revalidate and exact-pin the stable Next.js and React production target from primary sources
- Migrate reader, owner, preview, metadata, cache, image, CSP, and portable Node behavior without beginning Task 41
- Prove the framework migration with deterministic unit, browser, accessibility, performance, build, smoke, rollback, and delivery evidence

## Implementation Notes
- 2026-07-14 - Exact-pinned Next.js `16.2.10`, React/React DOM `19.2.7`, and framework-bound React types. Removed the unused SVGR/Webpack dependency path and aligned the workspace peer graph on one React runtime.
- 2026-07-14 - Replaced the stale Next configuration with the stable Next 16 Turbopack path, top-level typed routes, the generic `next start` deployment baseline, and same-origin security headers.
- 2026-07-14 - Added deterministic magazine fixtures, metadata, static reader routes, isolated draft preview, preview disable, authenticated revalidation, cache tags, and local image assets without introducing Task 42 persistence work.
- 2026-07-14 - Added unit, framework-contract, browser, accessibility, and production-smoke coverage. The browser suite verifies reader SSR, metadata, image behavior, no editor resources, protected preview, invalidation authorization, keyboard operation, and zero serious/critical Axe findings.
- 2026-07-14 - Preserved the concurrent owner-authorized managed Aegis rollout byte-for-byte as pre-existing infrastructure and kept every rollout path outside the Task 40 staging inventory.
- 2026-07-14 - Hardened preview and cache boundaries after independent review:
  POST-only preview authorization, constant-shape token comparison, a
  slug-bound expiring HMAC scope cookie, trusted-origin redirects,
  private/no-referrer headers, immediate tag expiry, normalized bounded cache
  keys, and fixed-fixture route closure.
- 2026-07-14 - Made browser verification self-contained by rebuilding with its
  explicit loopback canonical origin. Added initial static HTML, dynamic preview
  HTML, malformed-route, cache, header, and 150 kB document-budget assertions.

## Progress Log
- **2026-07-13 16:38 CEST** - [S:20260713|W:task40-migrate-react-next-framework-build-system|H:aegis:kickoff|E:.aegis/state/current-work.json] Implementation log initialized by Aegis kickoff.
- **2026-07-14 08:18 CEST** - [S:20260714|W:task40-migrate-react-next-framework-build-system|H:agent:implementation|E:docs/ai/work-tracking/active/20260713-task40-migrate-react-next-framework-build-system-ACTIVE/IMPLEMENTATION.md] Completed the exact-pinned Next 16/React 19.2 migration, framework behavior contracts, and task-scoped test foundation while preserving the separate managed-runtime rollout unstaged. authority=standing-grant:sota-magazine-2026-autonomy-v2
- **2026-07-14 14:46 CEST** - [S:20260714|W:task40-migrate-react-next-framework-build-system|H:agent:review-remediation|E:packages/web/src/app/api/preview/route.ts] Implemented the independent-review preview, redirect, cache, origin, and acceptance-evidence remediations without changing packages, lockfiles, workflows, Aegis runtime, authority, deployment, or Task 41 scope. authority=standing-grant:sota-magazine-2026-autonomy-v2

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
