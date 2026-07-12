# Task 38 Modernize Node pnpm and CI Runtime - Decisions

## Purpose
Record decisions before implementation, including options considered, rationale, and evidence.

## Decisions
- 2026-07-12 - Use Aegis-native current work as the portable workflow authority for this task, with `authority=standing-grant:sota-magazine-2026-autonomy-v2` and the explicit Task-38-only workflow authorization from the project owner. Taskmaster remains required for roadmap truth; Serena is unavailable and will not be fabricated.
- 2026-07-12 - Treat Task 67's `delivery_unknown` result as recorded Aegis dogfood evidence and continue through the documented kickoff contract for completed prior work. Do not run generic repair, delivery sync, or mutate Task 67.
- 2026-07-12 - Keep Task 38 independently reversible: runtime declarations, package-manager activation, lockfile metadata, CI runtime projections, deterministic contracts, and evidence move together; framework, language, lint, format, and test-framework upgrades remain Task 39 or later.
- 2026-07-12 - Select Node `24.18.0` Active LTS, pnpm `11.11.0` with registry integrity hash, and Node-bundled Corepack `0.35.0` for optional local activation. CI keeps explicit pnpm `11.11.0` under the immutable pnpm/action-setup SHA so pull-request metadata cannot select the CI package-manager version.
- 2026-07-12 - Use `config/runtime.json` as the reviewed canonical version contract. `.nvmrc`, `package.json`, `pnpm-workspace.yaml`, the lockfile format, active commands, CI values, and action pins are deterministic projections validated by `scripts/ci/check-runtime-contract.mjs` and adversarial tests.
- 2026-07-12 - Use exact dev-only `yaml@2.9.0` for YAML 1.2 workflow parsing rather than a partial or lexical parser. The runtime contract runs after frozen install, rejects YAML aliases/anchors/merge keys/explicit tags, and treats every decoded `uses` key as an action-inventory entry.
- 2026-07-12 - Permit only the 10-line additive lockfile delta required to declare, integrity-pin, and snapshot `yaml@2.9.0`; reject pnpm 11's unrelated lockfile normalization churn.
- 2026-07-12 - Exact-match the CI workflow root and workspace job execution envelope. Keep root triggers, permissions, and concurrency byte-semantically unchanged while explicitly clearing `BASH_ENV` and `NODE_OPTIONS` for every workspace step.
- 2026-07-12 - Pin `shell: bash` on the runtime-contract step itself rather than relying on the exact-but-self-validated absence of workflow defaults.
- 2026-07-12 - Bootstrap only the exact root YAML parser with lifecycle scripts and pnpmfile hooks disabled, validate the complete CI semantic digest and trusted support-file hashes, then permit the full frozen workspace install. Treat protected policy and attended review—not PR-controlled CI—as the authority for this workflow-changing Task 38 PR.
- 2026-07-12 - Preserve existing trusted-ref and dispatch resolution semantics, but prevalidate their workflow and external resolver bytes in the context job before the resolver executes. This stays inside Task 38's runtime/assertion authorization without changing checkout selection rules.
- 2026-07-12 - Do not select just-published pnpm `11.12.0` absent a required security delta. Re-query by 2026-07-19 or immediately before merge if the decision window expires.
- 2026-07-12 - Approve only the locked `sharp@0.34.5` and `unrs-resolver@1.7.9` lifecycle scripts identified by pnpm 11's fail-closed install; reject broad names, placeholders, and unrelated build scripts.
- 2026-07-12 - Keep strict-verification reports as evidence but exclude the generated Aegis manifest timestamp from Task 38, because the owner authorized no manifest or managed-runtime change in this task.

## Progress Log
- **2026-07-12 02:02 CEST** - [S:20260712|W:task38-modernize-node-pnpm-ci-runtime|H:aegis:kickoff|E:.aegis/state/current-work.json] Decisions log initialized by Aegis kickoff.
- **2026-07-12 02:05 CEST** - [S:20260712|W:task38-modernize-node-pnpm-ci-runtime|H:agent:scope|E:docs/ai/work-tracking/active/20260712-task38-modernize-node-pnpm-ci-runtime-ACTIVE/FINDINGS.md] Confirmed Task 38 scope from synchronized main; preserved user-owned untracked .codex/; reproduced aegis next delivery_unknown for completed taskmaster:67 as a guidance-ordering defect; limited implementation to runtime/toolchain projections, deterministic contracts, and the explicitly authorized runtime-only .github/workflows/ci.yml slice; excluded product, framework, application dependency, auto-merge, authority, Aegis managed asset, manifest, trigger, permission, secret, deployment, and trust-boundary changes; authority=standing-grant:sota-magazine-2026-autonomy-v2; grant_sha256=89ac60905034896537c3a4d794bf22a5d1fc0ccdab926ae93977c6ffc550e095.

<!-- AEGIS:BEGIN generated-sweh-projection -->
<!-- AEGIS:projection-state {"event_count": 25, "last_event_id": "0c5190e9690f49fdadb5cea718aaef07", "schema": "legacy-shadow-sweh-projection-v1"} -->

## Generated S:W:H:E Projection

_Generated from the passive Aegis ledger. Human-authored content outside this block is preserved._

- [S:2026-07-10-001-task48-protected-ci-controlled-auto-merge W:task-48-protected-ci-controlled-auto-merge H:delivery E:ledger:86b189a0d39...] Delivery state recorded: pr_open for PR #10 at 1cf557a92c8e132....
- [S:2026-07-10-001-task48-protected-ci-controlled-auto-merge W:task-48-protected-ci-controlled-auto-merge H:scope E:ledger:bb214df3ac5...] Scope recorded for 48. Paths: docs/research/2026-07-10-controlled-auto-merge-canary.md, docs/ai/work-tracking/active/20260710-task48-protected-ci-c..., plans/2026-07-10-task48-protected-ci-controlled-auto-merge.....
- [S:2026-07-10-001-task48-protected-ci-controlled-auto-merge W:task-48-protected-ci-controlled-auto-merge H:delivery E:ledger:24d1841aa7b...] Delivery state recorded: pr_merged for PR #10 at 5a345df073862bb....
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

<!-- AEGIS:END generated-sweh-projection -->
