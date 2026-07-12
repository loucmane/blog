# Task 38 Modernize Node pnpm and CI Runtime - Implementation Notes

## Planned Workstreams
- Select and pin the current optimal supported runtime from primary-source evidence
- Prove local and CI runtime parity with reproducible frozen installs
- Preserve CI trust boundaries, least privilege, reversibility, and complete evidence

## Implementation Notes
- 2026-07-12 - Added `.nvmrc` and `config/runtime.json` for Node `24.18.0`, pnpm `11.11.0`, Corepack `0.35.0`, root-script semantics, exact dependency build approvals, lockfile format, and immutable action-pin projections.
- 2026-07-12 - Updated root runtime/package-manager metadata in `package.json`; root scripts and application dependency declarations are semantically unchanged. Exact dev-only `yaml@2.9.0` supports fail-closed workflow parsing.
- 2026-07-12 - Moved the existing security override map from the pnpm-11-ignored `package.json#pnpm` field into `pnpm-workspace.yaml` without changing selectors or target versions.
- 2026-07-12 - Added exact-version build approval for `sharp@0.34.5` and `unrs-resolver@1.7.9`; no broad lifecycle-script approval or ignored-build bypass was introduced.
- 2026-07-12 - Updated `.github/workflows/ci.yml` only for Node/pnpm values and the fail-closed runtime contract step. Triggers, permissions, trusted commit resolution, repository-dispatch validation, checkout boundaries, secrets, deployment, required existing commands, and `.github/workflows/auto-merge.yml` are unchanged.
- 2026-07-12 - Added `scripts/ci/check-runtime-contract.mjs` and 13 top-level deterministic tests covering developer/runtime projections, every workspace script/dependency/package semantic, exact lockfile and workspace bytes, pnpm 11 settings, exact job/step enforcement, active runtime, and immutable allowlisted actions across every workflow.
- 2026-07-12 - Deleted obsolete non-auth `.npmrc` settings and moved effective pnpm 11 enforcement to `pnpm-workspace.yaml`: `engineStrict: true`, `nodeVersion: 24.18.0`, `pmOnFail: error`, and `strictDepBuilds: true`.
- 2026-07-12 - Remediated both initial independent-review failure sets; the hardened contract and complete CI-equivalent workspace matrix passed without incidental lockfile drift.
- 2026-07-12 - Hardened the final enforcement step as an exact parsed contract and added package-manifest semantic digests plus adversarial fixtures for flow-style actions, bundled dependencies, skipped enforcement, early success, and ignored failures.
- 2026-07-12 - Added accepted ADR-0003 and marked only ADR-0002's runtime targets superseded; Task 39's language and quality-tooling decisions remain proposed.
- 2026-07-12 - Final adversarial review replaced the partial parser with exact `yaml@2.9.0`, locked the workspace job envelope and full workspace-file digest, and added escaped-key, anchor/alias, job-level bypass, and extra-workspace-key fixtures.
- 2026-07-12 - `pnpm-lock.yaml` contains exactly 10 additive YAML-parser lines. The initial pnpm 11 normalization rewrite was discarded; no pre-existing lock entry changed or disappeared.
- 2026-07-12 - Locked the complete CI workflow-root envelope and added an exact workspace-job environment with empty `BASH_ENV` and `NODE_OPTIONS`; adversarial fixtures reject root environment injection, custom default shells, and job environment replacement.
- 2026-07-12 - Added explicit canonical `shell: bash` to the runtime-contract step and a fixture that rejects inherited-shell execution.
- 2026-07-12 - Moved full lifecycle installation after runtime validation. Added exact whole-CI semantic and action-topology digests, trusted resolver/checker/test file hashes, and fixtures for poisoned pre-runtime steps, unsafe bootstrap controls, resolver drift, and duplicate approved actions.
- 2026-07-12 - PR #29 review removed the unsafe pre-resolver parser/checker/test execution. The context job now contains exactly pinned checkout, pinned Node setup without package cache inputs, and the unchanged resolver. The workspace independently fetches only official `yaml@2.9.0` into trusted-runner temporary storage with isolated npm configs, disabled scripts, explicit registry, and exact integrity verification before the checker imports it.
- 2026-07-12 - Follow-up adversarial review closed the remaining import-time gap: setup-node package-manager autodetection is explicitly disabled before the resolver; the parser directory must not preexist; and the checker verifies exact runner-temp path, regular object types, realpath containment, tarball SHA-512, and the complete package-tree SHA-256 before dynamic import. Absolute-local and symlink attack fixtures prove malicious modules are rejected before execution.
- 2026-07-12 - Final adversarial review removed the CI fallback to repository-resolved YAML. `GITHUB_ACTIONS=true` now requires the verified runner-temp module before import, while local static checks retain the installed exact dependency. A missing-environment process fixture and direct fail-closed probe pass.

## Progress Log
- **2026-07-12 02:02 CEST** - [S:20260712|W:task38-modernize-node-pnpm-ci-runtime|H:aegis:kickoff|E:.aegis/state/current-work.json] Implementation log initialized by Aegis kickoff.
- **2026-07-12 02:12 CEST** - [S:20260712|W:task38-modernize-node-pnpm-ci-runtime|H:bash:date|E:cmd`date "+%Y-%m-%d %H:%M:%S %Z %z"`] Captured authoritative Task 38 evidence timestamp: 2026-07-12 02:12:23 CEST +0200; authority=standing-grant:sota-magazine-2026-autonomy-v2.
- **2026-07-12 02:12 CEST** - [S:20260712|W:task38-modernize-node-pnpm-ci-runtime|H:task-master:set-status|E:.taskmaster/tasks/tasks.json] Moved dependency-ready Taskmaster Task 38 from pending to in-progress through the supported CLI and regenerated only .taskmaster/tasks/task_038.md; restored only the incidental migrationNoticeShown toggle; authority=standing-grant:sota-magazine-2026-autonomy-v2.
- **2026-07-12 02:27 CEST** - [S:20260712|W:task38-modernize-node-pnpm-ci-runtime|H:agent-skill:stack-research-adr|E:reports/agent-skills/task38-runtime-stack-research.json] Recorded advisory stack-research-adr review task38-runtime-stack-research with verdict warn
- **2026-07-12 02:31 CEST** - [S:20260712|W:task38-modernize-node-pnpm-ci-runtime|H:agent:implementation|E:docs/decisions/0003-node-pnpm-runtime-foundation.md] Implemented Task 38 runtime projections and deterministic CI contract: Node 24.18.0, pnpm 11.11.0 with integrity pin, optional bundled Corepack 0.35.0, exact dependency-build approvals, unchanged root scripts and lockfile, immutable existing action pins, and only the authorized ci.yml runtime slice. Also observed that aegis status/next incorrectly used Task 67 stale closeout delivery guidance while current-work and Taskmaster identify active Task 38; no repair or delivery sync was run. authority=standing-grant:sota-magazine-2026-autonomy-v2.

<!-- AEGIS:BEGIN generated-sweh-projection -->
<!-- AEGIS:projection-state {"event_count": 25, "last_event_id": "9bf3b756070c4336b5d7b0ac5f634e11", "schema": "legacy-shadow-sweh-projection-v1"} -->

## Generated S:W:H:E Projection

_Generated from the passive Aegis ledger. Human-authored content outside this block is preserved._

- [S:2026-07-10-001-task48-protected-ci-controlled-auto-merge W:task-48-protected-ci-controlled-auto-merge H:scope E:ledger:070a32fa48a...] Scope recorded for 48. Paths: docs/ai/work-tracking/active/20260710-task48-protected-ci-c..., .taskmaster/tasks/**, .plan_state/**.
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

<!-- AEGIS:END generated-sweh-projection -->
