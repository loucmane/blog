# Task 37 Validate High-Risk Architecture Spikes - Findings

## Purpose
Record discoveries, gaps, risks, failed assumptions, and evidence-backed observations for Task 37.

## Findings
- 2026-07-13 - Next.js 16.2.10 is the selected Task 40 framework target. It is stable and
  Active LTS, satisfies the reader/editor SSR and preview requirements, builds and runs on a
  generic Node server, and is the lowest-risk reversible migration from the existing app.
- 2026-07-13 - Tiptap OSS 3.27.3 conditionally passes the structured-editor criteria when it
  is wrapped in an application-owned versioned document envelope, structural validation,
  quarantining for unknown nodes, and a server-owned renderer. Manual assistive-technology
  validation remains mandatory before the owner editor ships.
- 2026-07-13 - PostgreSQL 18.4, reviewable SQL migrations, Drizzle 0.45.2 after schema
  migration, and pg-boss 12.26.0 pass local migration, rollback, concurrency, transaction,
  dump, and restore drills. Live Neon pooling, scale-to-zero, PITR, and cost behavior remain
  provider gates rather than assumed evidence.
- 2026-07-13 - Application-owned SHA-256 metadata over a portable S3 subset passes upload,
  rendition, download, second-endpoint copy, and restored-record verification. ETags are not
  accepted as integrity evidence; live R2 export, multipart, caching, and billing behavior
  remain unproven.
- 2026-07-13 - Initial spike runs exposed five useful defects: Tiptap's default link title
  attribute, a missing accessible name on the inner ProseMirror textbox, a pre-migration
  Drizzle/schema mismatch, missing VersityGW metadata mounts, and blocked Sharp lifecycle
  scripts. Each was fixed at its contract boundary without disabling validation or using an
  unpinned/bypass install.
- 2026-07-13 - TanStack Start remains a release candidate and is rejected for the production
  baseline. React Router is the stable framework fallback; Astro is the split-reader fallback;
  Vite remains tooling rather than a second overlapping application framework.
- 2026-07-13 - The advisory result at
  `reports/agent-skills/task37-architecture-spikes.json` validated against the project skill
  contract with SHA-256
  `8c3f664dd0c6ad7e1667025436cb9fa88c9621a6988ddf6a34bd2cf5b29c0f9d`.
- 2026-07-13 - The sanctioned legacy `codex-task sessions update` helper expects the older
  `### 📝 Progress Log` heading, while Aegis kickoff generated `### Progress Log`. The helper
  failed closed before writing. Required Task 37 evidence was added to the existing human
  progress section without changing Aegis state; upstream compatibility remains follow-up
  dogfood rather than a Task 37 runtime edit.
- 2026-07-13 - Independent review correctly identified that the initial Axe wording omitted
  JSDOM's lack of layout-dependent color-contrast evidence. The retained claim now covers only
  deterministic JSDOM-supported Axe rules; browser contrast and manual assistive-technology
  checks remain Tasks 43/46 gates.
- 2026-07-13 - Independent review also separated Task 37's serialized article/document proof
  from a future full-domain export/import bundle, and deterministic text extraction from search
  ranking/filtering. The ADR now assigns those unresolved production gates to Tasks 42 and 45
  rather than treating them as completed.

## Progress Log
- **2026-07-13 14:48 CEST** - [S:20260713|W:task37-validate-high-risk-architecture-spikes|H:aegis:kickoff|E:.aegis/state/current-work.json] Findings log initialized by Aegis kickoff.
- **2026-07-13 14:50 CEST** - [S:20260713|W:task37-validate-high-risk-architecture-spikes|H:agent:scope|E:docs/research/spike-plan.md] Confirmed Task 37 scope before implementation: retain only a standalone exact-pinned research workspace under research/task37 outside the root pnpm workspace, synthetic nonpersonal fixtures, Task 37 ADR/research outputs, Taskmaster projection, and sanctioned Aegis/plan/session/tracker evidence. Local ephemeral PostgreSQL/S3-compatible containers may use synthetic credentials. Do not change product source, root package manifests or lockfile, workflows, Aegis managed runtime/authority/enforcement/manifest, deployment, production data, or secrets; live-provider criteria without attended credentials remain explicitly unproven rather than fabricated. Preserve user-owned .codex untouched. authority=standing-grant:sota-magazine-2026-autonomy-v2
- **2026-07-13 15:24 CEST** - [S:20260713|W:task37-validate-high-risk-architecture-spikes|H:agent:findings|E:docs/research/task-37-architecture-spike-results.md] Recorded passed local contracts, rejected alternatives, corrected defects, and explicit provider/manual-accessibility gates; authority=standing-grant:sota-magazine-2026-autonomy-v2

<!-- AEGIS:BEGIN generated-sweh-projection -->
<!-- AEGIS:projection-state {"event_count": 25, "last_event_id": "f288ca098351420189e1e2ed09fd67ab", "schema": "legacy-shadow-sweh-projection-v1"} -->

## Generated S:W:H:E Projection

_Generated from the passive Aegis ledger. Human-authored content outside this block is preserved._

- [S:2026-07-10-001-task48-protected-ci-controlled-auto-merge W:task-48-protected-ci-controlled-auto-merge H:delivery E:ledger:0321a47226a...] Delivery state recorded: pr_merged for PR #11 at e26daabfb6a6e36....
- [S:2026-07-10-001-task48-protected-ci-controlled-auto-merge W:task-48-protected-ci-controlled-auto-merge H:delivery E:ledger:0488508e884...] Delivery state recorded: pr_merged for PR #12 at 3565b2998e2250a....
- [S:2026-07-10-001-task56-aegis-managed-runtime-refresh W:task-56-aegis-managed-runtime-refresh H:scope E:ledger:02c9e7baecc...] Scope recorded for 56.
- [S:2026-07-10-001-task56-aegis-managed-runtime-refresh W:task-56-aegis-managed-runtime-refresh H:delivery E:ledger:1223862e374...] Delivery state recorded: pr_draft for PR #16 at 02e5d8de3d7434c....
- [S:2026-07-10-001-task57-v1-cross-agent-skill-system-roadmap W:task-57-v1-cross-agent-skill-system-roadmap H:delivery E:ledger:e486a2b8c7e...] Delivery state recorded: pr_draft for PR #17 at fd455ab75081154....
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

<!-- AEGIS:END generated-sweh-projection -->
