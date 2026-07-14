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

## Progress Log
- **2026-07-13 16:38 CEST** - [S:20260713|W:task40-migrate-react-next-framework-build-system|H:aegis:kickoff|E:.aegis/state/current-work.json] Implementation log initialized by Aegis kickoff.
- **2026-07-14 08:18 CEST** - [S:20260714|W:task40-migrate-react-next-framework-build-system|H:agent:implementation|E:docs/ai/work-tracking/active/20260713-task40-migrate-react-next-framework-build-system-ACTIVE/IMPLEMENTATION.md] Completed the exact-pinned Next 16/React 19.2 migration, framework behavior contracts, and task-scoped test foundation while preserving the separate managed-runtime rollout unstaged. authority=standing-grant:sota-magazine-2026-autonomy-v2

<!-- AEGIS:BEGIN generated-sweh-projection -->
<!-- AEGIS:projection-state {"event_count": 25, "last_event_id": "01551cbe17ca4a128335019be177321f", "schema": "legacy-shadow-sweh-projection-v1"} -->
- **2026-07-14 14:05 CEST** - [S:20260714|W:task40-migrate-react-next-framework-build-system|H:agent:verification|E:.aegis/reports/verification-report.json] Recorded strict verification evidence

## Generated S:W:H:E Projection

_Generated from the passive Aegis ledger. Human-authored content outside this block is preserved._

- [S:2026-07-10-001-task50-magazine-product-discovery-skill W:task-50-magazine-product-discovery-skill H:scope E:ledger:7d0a851fe7e...] Scope recorded for 50. Paths: .aegis/foundation-manifest.json, .agents/skills/magazine-product-discovery, .claude/skills/magazine-product-discovery/**.
- [S:2026-07-10-001-task50-magazine-product-discovery-skill W:task-50-magazine-product-discovery-skill H:witness E:ledger:d1b09690eb8...] Delivery witness PASS recorded at ce6ed9b; report: .aegis/reports/witness-report.json.
- [S:2026-07-11-001-task51-stack-research-adr-skill W:task-51-stack-research-adr-skill H:scope E:ledger:81b1c8a2c15...] Scope recorded for 51. Paths: .claude/skills/stack-research-adr/**, .agents/skills/stack-research-adr, config/agent-skills/catalog.yaml.
- [S:2026-07-11-001-task51-stack-research-adr-skill W:task-51-stack-research-adr-skill H:witness E:ledger:af407cfbc27...] Delivery witness PASS recorded at d685898; report: .aegis/reports/witness-report.json.
- [S:2026-07-11-001-task51-stack-research-adr-skill W:task-51-stack-research-adr-skill H:delivery E:ledger:68fc6a604e0...] Delivery state recorded: pr_draft for PR #19 at 76a7cc5a07cada6....
- [S:2026-07-11-001-task51-stack-research-adr-skill W:task-51-stack-research-adr-skill H:witness E:ledger:8cb836ef6c7...] Delivery witness PASS recorded at fec1d7d; report: .aegis/reports/witness-report.json.
- [S:2026-07-11-001-task51-stack-research-adr-skill W:task-51-stack-research-adr-skill H:delivery E:ledger:d439b53bb04...] Delivery state recorded: pr_draft for PR #19 at fec1d7d7216c8d3....
- [S:2026-07-11-001-task51-stack-research-adr-skill W:task-51-stack-research-adr-skill H:witness E:ledger:73f11dea994...] Delivery witness PASS recorded at e00eda1; report: .aegis/reports/witness-report.json.
- [S:2026-07-11-001-task51-stack-research-adr-skill W:task-51-stack-research-adr-skill H:witness E:ledger:efae1d3c127...] Delivery witness PASS recorded at 51ba5ee; report: .aegis/reports/witness-report.json.
- [S:2026-07-11-001-task67-gitleaks-repository-dispatch W:task-67-gitleaks-repository-dispatch H:witness E:ledger:73ce8d53238...] Delivery witness FAIL recorded at e8ccfa9; report: .aegis/reports/witness-report.json.
- [S:2026-07-11-001-task67-gitleaks-repository-dispatch W:task-67-gitleaks-repository-dispatch H:scope E:ledger:20845d7c6ef...] Scope recorded for 67. Paths: .aegis/foundation-manifest.json, .github/workflows/ci.yml, .plan_state/sync.log.
- [S:2026-07-11-001-task67-gitleaks-repository-dispatch W:task-67-gitleaks-repository-dispatch H:witness E:ledger:a941592c398...] Delivery witness PASS recorded at e8ccfa9; report: .aegis/reports/witness-report.json.
- [S:2026-07-12-001-task38-modernize-node-pnpm-ci-runtime W:task-38-modernize-node-pnpm-ci-runtime H:scope E:ledger:bdd9a0cd1bf...] Scope recorded for 38. Paths: .github/workflows/ci.yml, .nvmrc, config/runtime.json.
- [S:2026-07-12-001-task38-modernize-node-pnpm-ci-runtime W:task-38-modernize-node-pnpm-ci-runtime H:witness E:ledger:35a36cbd2e1...] Delivery witness PASS recorded at 81511aa; report: .aegis/reports/witness-report.json.
- [S:2026-07-12-001-task38-modernize-node-pnpm-ci-runtime W:task-38-modernize-node-pnpm-ci-runtime H:scope E:ledger:5db7bd6b7bb...] Scope recorded for 38. Paths: .github/workflows/ci.yml, .npmrc, .nvmrc.
- [S:2026-07-12-001-task38-modernize-node-pnpm-ci-runtime W:task-38-modernize-node-pnpm-ci-runtime H:scope E:ledger:0c5190e9690...] Scope recorded for 38. Paths: .github/workflows/ci.yml, .npmrc, .nvmrc.
- [S:2026-07-12-001-task38-modernize-node-pnpm-ci-runtime W:task-38-modernize-node-pnpm-ci-runtime H:witness E:ledger:c7dd9c53f3f...] Delivery witness FAIL recorded at ffbf892; report: .aegis/reports/witness-report.json.
- [S:2026-07-12-001-task38-modernize-node-pnpm-ci-runtime W:task-38-modernize-node-pnpm-ci-runtime H:scope E:ledger:4df2911d6d8...] Scope recorded for 38. Paths: .github/workflows/ci.yml, .npmrc, .nvmrc.
- [S:2026-07-12-001-task38-modernize-node-pnpm-ci-runtime W:task-38-modernize-node-pnpm-ci-runtime H:witness E:ledger:9bf3b756070...] Delivery witness PASS recorded at ffbf892; report: .aegis/reports/witness-report.json.
- [S:2026-07-13-001-task37-validate-high-risk-architecture-spikes W:task-37-validate-high-risk-architecture-spikes H:witness E:ledger:f288ca09835...] Delivery witness PASS recorded at beea815; report: .aegis/reports/witness-report.json.
- [S:2026-07-13-001-task37-validate-high-risk-architecture-spikes W:task-37-validate-high-risk-architecture-spikes H:witness E:ledger:b72ec5f18b8...] Delivery witness FAIL recorded at e59c9cc; report: .aegis/reports/witness-report.json.
- [S:2026-07-13-001-task37-validate-high-risk-architecture-spikes W:task-37-validate-high-risk-architecture-spikes H:scope E:ledger:3af8b644a23...] Scope recorded for 37. Paths: .plan_state/sync.log, .taskmaster/tasks/task_037.md, .taskmaster/tasks/tasks.json.
- [S:2026-07-13-001-task37-validate-high-risk-architecture-spikes W:task-37-validate-high-risk-architecture-spikes H:witness E:ledger:0c07d788bd7...] Delivery witness PASS recorded at e59c9cc; report: .aegis/reports/witness-report.json.
- [S:2026-07-13-001-task37-validate-high-risk-architecture-spikes W:task-37-validate-high-risk-architecture-spikes H:witness E:ledger:4150072e0e0...] Delivery witness PASS recorded at 7aa9fa7; report: .aegis/reports/witness-report.json.
- [S:2026-07-13-001-task40-migrate-react-next-framework-build-system W:task-40-migrate-react-next-framework-build-system H:scope E:ledger:01551cbe17c...] Scope recorded for 40. Paths: package.json, pnpm-lock.yaml, config/runtime.json.

<!-- AEGIS:END generated-sweh-projection -->
