# ADR-0003: Adopt Node 24.18 and pnpm 11.11 as the Runtime Foundation

- Status: accepted
- Decision owner: project owner
- Decision deadline: Task 38 delivery
- As-of date (UTC): 2026-07-12
- Review/expiry date: 2026-07-19
- Supersedes: the runtime-version targets in ADR-0002

## Decision

- Question: Which stable Node, pnpm, Corepack, and GitHub Action versions should define the reproducible pre-framework modernization baseline?
- Selected target: Node `24.18.0`, pnpm `11.11.0`, Node-bundled Corepack `0.35.0` for optional local activation, and the repository's already-current immutable GitHub Action SHAs.
- Reversible boundary: one Task 38 pull request containing runtime declarations, pnpm 11 configuration placement, CI runtime projections, deterministic contracts, and evidence.
- What would invalidate this decision: a security advisory without a compatible patch, a supported dependency that fails under Node 24 or pnpm 11, a non-reproducible frozen install, or a newer patch that becomes the minimum security floor before merge.

## Current Baseline

| Surface | Current version/state | Evidence | Constraint |
| --- | --- | --- | --- |
| Node | `22.16.0` | `node --version`; `.github/workflows/ci.yml` | Predates the June 2026 Node security release. |
| pnpm | `9.0.0` | `pnpm --version`; `package.json` | pnpm 11 changes the supported settings location and removes `packageManagerStrict`. |
| Corepack | `0.32.0` | `corepack --version` | Experimental and not distributed starting with Node 25. |
| Runtime declarations | Broad engines; no developer version file | `package.json`; absent `.nvmrc` | Local and CI versions can drift. |
| Lockfile | Format `9.0` | `pnpm-lock.yaml` | Must remain reproducible; only the exact dev-only YAML parser entries may change. |
| Actions | Current full-SHA pins | `.github/workflows/ci.yml`; `.github/workflows/auto-merge.yml` | Trust boundaries, triggers, and permissions cannot change. |

## Decision Drivers

- Requirements: production LTS, patched security floor, exact developer/CI parity, frozen installation, immutable actions, and independently reversible delivery.
- Constraints: preserve application dependencies and package scripts; do not begin Task 39; do not alter workflow trust boundaries or Aegis assets.
- Non-goals: React, Next.js, TypeScript, lint, formatting, testing-framework, Tailwind, shadcn/ui, product, deployment, or auto-merge changes.
- Criteria and weighting rationale: security and supported lifecycle are mandatory; reproducibility and compatibility outrank novelty; a release published only hours earlier is not selected without a security need.

## Evidence Matrix

| Option | Latest stable | Supported lines | Security/maintenance | Compatibility | Migration | Cost | Lock-in/exit | Rollback | Verification | Primary sources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Node 24 | `24.18.0` | Active LTS until maintenance starts 2026-10-20; EOL 2028-04-30 | Includes and supersedes the June 2026 security release | pnpm 11 supports Node 24; repository commands are verified directly | Exact runtime projections | None | Standard Node runtime; revert declaration and CI together | Node `22.23.1` maintenance LTS | Frozen install, typecheck, lint, builds, smoke, audit | [release](https://nodejs.org/en/blog/release/v24.18.0), [schedule](https://github.com/nodejs/Release) |
| Node 26 | `26.5.0` | Current; planned LTS October 2026 | Supported but not production LTS yet | Unnecessary major risk | Larger | None | Standard Node runtime | Node 24 | Reject before implementation | [release policy](https://nodejs.org/en/about/previous-releases), [release index](https://nodejs.org/download/release/index.json) |
| Node 22 | `22.23.1` | Maintenance LTS; EOL 2027-04-30 | Patched fallback with shorter runway | Compatible with pnpm 11 | Small | None | Standard Node runtime | N/A | Reserved rollback test | [schedule](https://github.com/nodejs/Release), [release](https://nodejs.org/en/blog/release/v22.23.1) |
| pnpm 11.12 | `11.12.0` | Current stable major | Contains no required security floor beyond 11.11 | Compatible with Node 24 | Same migration | None | Standard npm registry package | pnpm 11.11 | Re-query after observation window | [release](https://github.com/pnpm/pnpm/releases/tag/v11.12.0) |
| pnpm 11.11 | `11.11.0` selected | Current stable major | Fixes lockfile/package-name traversal and credential disclosure paths | Requires Node `>=22.13`; candidate frozen install passed | Move settings to `pnpm-workspace.yaml` | None | Exact registry package with integrity pin | Time-boxed pnpm 10 bridge only if required | Frozen install twice and unchanged dependency graph | [release](https://github.com/pnpm/pnpm/releases/tag/v11.11.0), [registry](https://registry.npmjs.org/pnpm/11.11.0), [installation](https://pnpm.io/installation) |
| Corepack | `0.35.0` | Bundled with Node 24; removed starting Node 25 | Experimental adapter, not the CI authority | Node 24.18 bundles the selected version | Local `corepack enable pnpm` only | None | Removable; direct exact pnpm install is the exit | Use npm or official pnpm installer | Active-version contract | [Node docs](https://nodejs.org/download/release/v25.8.0/docs/api/corepack.html), [Corepack](https://github.com/nodejs/corepack), [pnpm installation](https://pnpm.io/installation) |
| YAML parser | `2.9.0` | Current stable | Maintained parser; no runtime install script | Node `>=14.6`; dev-only under Node 24 | Direct exact dependency and 10 additive lockfile lines | None | Removable with the runtime contract | Revert parser/checker together | Escaped-key, flow-style, alias, and anchor fixtures | [registry](https://www.npmjs.com/package/yaml), [repository](https://github.com/eemeli/yaml) |

## Compatibility Chain

| Pairing/boundary | Evidence | Result | Gap or bridge |
| --- | --- | --- | --- |
| Node 24.18 → pnpm 11.11 | Registry engine `>=22.13`; pnpm compatibility table includes Node 24 | Pass | None |
| pnpm 11 → workspace settings | pnpm 11 reads non-auth project settings only from `pnpm-workspace.yaml` and replaces `packageManagerStrict` with `pmOnFail` | Required migration | Delete obsolete `.npmrc` settings; use `engineStrict: true`, `nodeVersion: 24.18.0`, `pmOnFail: error`, and `strictDepBuilds: true`. |
| pnpm 11 → lockfile 9.0 | Runtime migration itself required no rewrite; exact `yaml@2.9.0` workflow parsing adds only an importer, integrity-pinned package record, and snapshot | Pass | Require two clean frozen installs and reject unrelated pnpm normalization churn. |
| pnpm 11 → dependency build scripts | First CI-mode install identified only `sharp@0.34.5` and `unrs-resolver@1.7.9`; both are locked transitive dependencies required by Next image support and ESLint resolution | Exact-version allowlist | Any future package/version fails with `ERR_PNPM_IGNORED_BUILDS` pending review. |
| package metadata → CI | Deterministic runtime contract parses YAML 1.2 exactly and compares canonical runtime, complete workspace-job controls, all workspace script/dependency declarations, `.nvmrc`, exact workspace file/maps, lockfile bytes, and every decoded workflow action reference | Pass by construction | Hosted CI validates the exact PR head. |
| CI actions → GitHub runner | All action references remain at verified release commit SHAs | Pass | No action update is required in Task 38. |

## Selected Option

- Why it wins: Node 24.18 is patched Active LTS with the longest production runway; pnpm 11.11 is the minimum current release carrying the July security fixes, while 11.12 was only hours old at decision time.
- Accepted consequences: pnpm settings move to `pnpm-workspace.yaml`; exact runtime projections require intentional future updates.
- Dependency build policy: allow only the currently locked `sharp@0.34.5` and `unrs-resolver@1.7.9` install scripts. pnpm 11 must fail closed if a future version or another package introduces an unreviewed build script.
- Package-manager failure policy: use `pmOnFail: error`; no obsolete non-auth pnpm setting remains in `.npmrc`.
- Known risks: pnpm 11.11 is fresh, so the decision expires after one week and hosted CI remains mandatory.
- Evidence confidence: high for release/support facts and action SHAs; medium for whole-repository compatibility until the full local and hosted matrices pass.

## Rejected Alternatives

| Alternative | Why rejected now | What would change the decision |
| --- | --- | --- |
| Node 26 | Current-only, not LTS | Successful LTS transition and a later dedicated runtime task |
| Node 22 as primary | Maintenance-only with shorter runway | A Node 24 incompatibility that cannot be corrected inside Task 38 |
| pnpm 11.12 | Published only hours before the decision; no required security delta | Observation time or a security/correctness requirement before merge |
| pnpm 10 | Previous maintained line and lacks the selected major's security posture | Time-boxed emergency compatibility bridge with a removal task |
| Corepack as CI authority | Experimental and disappearing from Node distribution | A future supported Node contract that restores durable distribution |

## Migration And Rollback

- Reversible batches: Task 38 alone changes runtime declarations, package-manager configuration location, exact dev-only YAML parsing, CI runtime projections, contracts, and evidence.
- Temporary bridges, owner, and removal deadline: none introduced; Corepack is optional local convenience, not a CI dependency.
- Rollback triggers: frozen-install drift, runtime-specific command failure, action/runtime incompatibility, or unresolved hosted check failure.
- Rollback procedure: revert the Task 38 squash commit, including the YAML parser's 10 additive lockfile lines; if the old runtime has an unresolved security issue, use Node `22.23.1` with pnpm `11.11.0` while correcting the Node 24 failure rather than treating `22.16.0`/pnpm 9 as a steady state.
- Data/backup implications: none; no application data or schema changes.

## Verification Gates

- Frozen installation: exact Node/pnpm active contract, two consecutive `pnpm install --frozen-lockfile` runs, and unchanged dependency resolution.
- Typecheck/lint/tests/build: preserve existing commands and run typecheck, lint, capability contracts, package/application builds, and production smoke.
- Compatibility and security checks: zero-advisory audit, actionlint, workflow contracts, full-history Gitleaks, Taskmaster health/dependencies, strict Aegis verification, witness, guards, and diff integrity.
- Product, accessibility, performance, and operational checks when applicable: no product behavior changes; current browser/unit capability remains honestly unsupported until Task 39.

## Open Questions And Evidence Gaps

| ID | Question/gap | Consequence | Owner | Next primary source |
| --- | --- | --- | --- | --- |
| PNPM-SOAK | Does pnpm 11.11 remain the best stable security floor after one week? | Re-query before merge if delivery extends beyond the review date. | Task 38 | [pnpm releases](https://github.com/pnpm/pnpm/releases) |
| HOSTED-CI | Does GitHub's hosted runner execute the exact pinned runtime/action chain? | Merge remains blocked until all hosted checks pass. | Task 38 | Exact PR check runs |

## Sources

- https://nodejs.org/en/about/previous-releases — retrieved 2026-07-12; production LTS policy.
- https://nodejs.org/en/blog/release/v24.18.0 — retrieved 2026-07-12; selected Node release.
- https://nodejs.org/en/blog/release/v24.17.0 — retrieved 2026-07-12; June security floor superseded by 24.18.
- https://github.com/nodejs/Release — retrieved 2026-07-12; support schedule.
- https://pnpm.io/installation — retrieved 2026-07-12; compatibility and Corepack guidance.
- https://github.com/orgs/pnpm/discussions/11377 — retrieved 2026-07-12; authoritative pnpm 11 migration guidance, `.npmrc` scope, and removed package-manager settings.
- https://pnpm.io/settings — retrieved 2026-07-12; `engineStrict`, `nodeVersion`, `pmOnFail`, `strictDepBuilds`, and `allowBuilds` contracts.
- https://github.com/pnpm/pnpm/releases/tag/v11.11.0 — retrieved 2026-07-12; selected pnpm security/correctness fixes.
- https://github.com/pnpm/pnpm/releases/tag/v11.12.0 — retrieved 2026-07-12; newest but unsoaked alternative.
- https://github.com/nodejs/corepack — retrieved 2026-07-12; distribution and package-manager pin behavior.
- https://www.npmjs.com/package/yaml — retrieved 2026-07-12; current stable `2.9.0`, Node engine floor, and package metadata.
- https://github.com/eemeli/yaml — retrieved 2026-07-12; maintained YAML 1.2 parser source and documentation.
- https://docs.github.com/en/actions/reference/security/secure-use — retrieved 2026-07-12; immutable action pinning.
