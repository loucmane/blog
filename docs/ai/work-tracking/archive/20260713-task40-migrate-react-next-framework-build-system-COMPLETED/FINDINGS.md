# Task 40 Migrate React Framework and Build System - Findings

## Purpose
Record discoveries, gaps, risks, failed assumptions, and evidence-backed observations for Task 40.

## Findings
- 2026-07-14 - The official npm registry still identifies Next.js `16.2.10`,
  React/React DOM `19.2.7`, `@types/react` `19.2.17`, and
  `@types/react-dom` `19.2.3` as the latest stable releases. Next `16.x` remains
  Active LTS, requires Node `>=20.9.0`, and supports React `^19.0.0`; the
  repository's Node `24.18.0` baseline is compatible. Primary evidence:
  `https://registry.npmjs.org/next/latest`,
  `https://registry.npmjs.org/react/latest`,
  `https://registry.npmjs.org/react-dom/latest`,
  `https://nextjs.org/support-policy`, and
  `https://react.dev/versions`.
- 2026-07-14 - The pre-migration Next `15.5.20` / React `19.1.0` baseline passed
  frozen install, typecheck, lint, 22 unit/integration tests, all package/app
  builds, dependency audit with zero advisories, production HTTP smoke, and four
  desktop/mobile Playwright journeys. Registry access and loopback binding were
  rerun outside the sandbox after deterministic `EPERM` failures; those were
  execution-environment restrictions, not product failures.
- 2026-07-14 - The baseline production server emitted two actionable migration
  warnings: `experimental.typedRoutes` moved to top-level `typedRoutes`, and
  `next start` conflicts with `output: 'standalone'`. Task 40 must remove the
  stale configuration ambiguity and prove one explicit portable Node start path.
- 2026-07-14 - Before this resumed session, an owner-authorized managed Aegis
  rollout installed the current runtime and `.codex/hooks.json` (`3334c040…`).
  The owner confirmed strict verification completed with zero required failures
  and that unrelated source dirt did not contaminate installed assets. The
  rollout is pre-existing infrastructure, not Task 40: preserve it intact,
  leave it unstaged, and keep user-owned `.codex/` untouched and uninspected.
- 2026-07-14 - Next 16's streamed App Router `notFound()` response can retain
  HTTP 200 while rendering the not-found boundary. Preview confidentiality is
  therefore verified by withheld draft content and the explicit not-found UI,
  not by treating the streamed status code as the authorization boundary.
- 2026-07-14 - Next's production server issued Draft Mode redirects and secure
  cookies for its canonical `localhost` origin. The initial browser harness used
  `127.0.0.1`, so the host-only cookie correctly did not cross the origin
  boundary. Aligning the harness to `localhost` proves the production behavior
  without weakening `Secure`, `HttpOnly`, or `SameSite=none`.
- 2026-07-14 - The UI package's Rollup build reports that it drops module-level
  `use client` directives. The Next application consumes the package's source
  exports through `transpilePackages`, and both Turbopack production build and
  browser behavior pass. Task 41 owns the workspace packaging/design-system
  boundary and should decide whether a distributable client-boundary artifact
  is still required.
- 2026-07-14 - Browserslist reports stale `caniuse-lite` data during build. It
  does not invalidate Task 40 behavior, and updating unrelated transitive data
  would violate the reversible framework-only scope; retain it as Task 41 or
  dependency-maintenance follow-up evidence.
- 2026-07-14 - Standard Aegis verification, capsule/brief, witness, and the
  repository Aegis CI contract pass. Strict verification fails only
  `mutation.pending_tracking_empty` because advisory hooks accumulated 97
  pending events, including read-only commands. Root `AGENTS.md` explicitly
  says advisory work requires no per-mutation reconciliation and forbids
  manually draining advisory pending events as routine ceremony. Task 40 must
  not clear that queue or run generic repair to manufacture a strict pass.
- 2026-07-14 - Closeout dry-run does not require a pristine Git tree, but it
  inherits the same pending-event/strict-verification conflict and therefore
  reports 11 required failures with zero warnings. The remaining evidence
  status failures are downstream of keeping verification honestly in progress;
  no final closeout or Taskmaster done transition was attempted.

## Progress Log
- **2026-07-13 16:38 CEST** - [S:20260713|W:task40-migrate-react-next-framework-build-system|H:aegis:kickoff|E:.aegis/state/current-work.json] Findings log initialized by Aegis kickoff.
- **2026-07-14 07:22 CEST** - [S:20260713|W:task40-migrate-react-next-framework-build-system|H:agent:baseline|E:docs/ai/work-tracking/active/20260713-task40-migrate-react-next-framework-build-system-ACTIVE/FINDINGS.md] Revalidated the exact stable Next/React target from primary sources, recorded a green pre-migration baseline and its two framework warnings, and isolated the unrelated managed-runtime update before implementation. authority=standing-grant:sota-magazine-2026-autonomy-v2
- **2026-07-14 08:18 CEST** - [S:20260714|W:task40-migrate-react-next-framework-build-system|H:agent:verification-findings|E:docs/ai/work-tracking/active/20260713-task40-migrate-react-next-framework-build-system-ACTIVE/reports/migrate-react-next-framework-build-system/verification.md] Recorded non-blocking Task 41 packaging and Browserslist follow-ups after green Task 40 behavior verification. authority=standing-grant:sota-magazine-2026-autonomy-v2
- **2026-07-14 08:20 CEST** - [S:20260714|W:task40-migrate-react-next-framework-build-system|H:aegis:closeout-dry-run|E:.aegis/reports/verification-report.json] Recorded the strict-verification/closeout conflict caused solely by advisory pending events; no queue drain, repair, final closeout, or rollout mutation was performed. authority=standing-grant:sota-magazine-2026-autonomy-v2

<!-- AEGIS:BEGIN generated-sweh-projection -->
<!-- AEGIS:projection-state {"event_count": 25, "last_event_id": "01551cbe17ca4a128335019be177321f", "schema": "legacy-shadow-sweh-projection-v1"} -->
- **2026-07-13 16:40 CEST** - [S:20260713|W:task40-migrate-react-next-framework-build-system|H:agent:scope|E:docs/decisions/0005-use-nextjs-16-for-unified-magazine-framework.md] Confirmed Task 40 scope: revalidate and exact-pin the stable Next.js/React pair; migrate only framework, web behavior, framework-bound React types, deterministic tests, and required runtime/task evidence; preserve Task 41 Tailwind/shadcn/workspace work, backend/content persistence, workflows, Aegis runtime/authority/enforcement/manifest, deployment, secrets, and user-owned .codex. authority=standing-grant:sota-magazine-2026-autonomy-v2

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
