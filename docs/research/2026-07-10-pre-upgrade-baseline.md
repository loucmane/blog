# Frozen Pre-Upgrade Baseline

**Task:** 36 — Record Frozen Pre-Upgrade Baseline
**Captured:** 2026-07-10 00:05 CEST
**Commit:** `9f804a1cca342dce9c549f4b0dfbded7c2d33a9a`
**Branch:** `feat/task-36-frozen-pre-upgrade-baseline`
**Overall result:** installation is reproducible, but the committed verification surface is not green.

## Scope and Invariants

- No dependency versions, package manifests, lockfiles, product sources, or framework configuration were changed.
- The package manifest and lockfile hashes were identical before and after install, verification, tests, and builds.
- Failures below are pre-existing prototype defects at the merged planning baseline; they are not modernization regressions.
- Ignored local install/build outputs were retained for diagnosis and must not be committed.
- Taskmaster's incidental `migrationNoticeShown` state toggle and generated guard/bytecode artifacts were removed after capture.

## Environment

| Item | Baseline |
| --- | --- |
| Node.js | `v22.16.0` |
| pnpm | `9.0.0` |
| Corepack | `0.32.0` |
| npm | `10.9.2` |
| Operating environment | Linux 6.6.87.1 WSL2, x86_64 |
| Root `packageManager` | `pnpm@9.0.0` |
| Root Node engine | `>=18.0.0` |
| Root pnpm engine | `>=8.0.0` |
| Lockfile format | `9.0` |
| Workspace | Root plus `packages/backend`, `packages/ui`, and `packages/web` |

The committed package-manager declaration therefore matches the requested CI bootstrap runtime: Node 22 and pnpm 9. Runtime modernization remains Task 38 and must not be mixed into the CI bootstrap.

## Package Input Hashes

| File | SHA-256 |
| --- | --- |
| `package.json` | `44aabd6e974b1cd2e3a8d2c47566aeaf21ef82b628816cb5e9782608eab6f805` |
| `pnpm-lock.yaml` | `43b5a6692ba32d906ca4c6e01ed1c5e63392cbcb4453a30cb02ce7a13aeb92e2` |
| `packages/backend/package.json` | `69c2628f45c876e774f9367eb8ca94d70363aee814c970d6715f71907ee13549` |
| `packages/ui/package.json` | `792bc1edc8b1c4d73077771f26962a9eda55e78de809e2d06774e0f126566c9a` |
| `packages/web/package.json` | `68ef66ae7b88e2c93905828c734dd3909b137d17fef48ec144979c6b656b22dd` |

## Verification Results

| Stage | Command | Exit | Result |
| --- | --- | ---: | --- |
| Frozen install | `pnpm install --frozen-lockfile` | 0 | Passed; 993 packages linked from the existing store in 3.3 seconds; lockfile resolution skipped as current. |
| Web typecheck | `pnpm --filter web exec tsc --noEmit` | 1 | Failed with 10 TypeScript errors. |
| UI typecheck | `pnpm --filter @minniewinnie/ui run build:types` | 2 | Failed with one TypeScript error. |
| Root lint | `pnpm lint` | 2 | Failed when the UI package could not find an ESLint configuration. |
| UI lint | `pnpm --filter @minniewinnie/ui lint` | 2 | Failed because no ESLint configuration is discoverable from `packages/ui`. |
| Web lint | `pnpm --filter web lint` | 0 | Passed with 12 warnings. |
| Root tests | `pnpm test` | 1 | Failed when the UI package could not execute `jest`. |
| Backend tests | `pnpm --filter @minniewinnie/backend test -- --runInBand` | 1 | Jest is installed, but no tests exist. |
| UI tests | `pnpm --filter @minniewinnie/ui test -- --runInBand` | 1 | `jest` is not installed for this package. |
| Web tests | `pnpm --filter web test -- --runInBand` | 1 | `jest` is not installed for this package. |
| Backend build | `pnpm --filter @minniewinnie/backend build` | 0 | Passed; Babel compiled four files. |
| UI build | `pnpm --filter @minniewinnie/ui build` | 1 | Failed during declaration generation on the UI type error. |
| Web production build | `pnpm --filter web build` | 1 | Next.js compiled production assets, then its lint/type worker failed. |
| Root build | `pnpm build` | 1 | Failed on the UI build before completing the workspace. |
| Taskmaster dependencies | `task-master validate-dependencies --tag master` | 0 | Passed for 16 tasks and 22 dependencies. |
| Codex guard | `./scripts/codex-guard validate --include-untracked` | 1 | Failed with 16 legacy/workflow-state findings. |
| Codex drift guard | `./scripts/codex-guard drift-check --strict` | 1 | Failed with 16 missing legacy canonical-template findings. |
| Aegis local witness | `./.aegis/bin/aegis witness --target-dir . --base origin/main --json` | 0 | Passed after ledger access was available. |
| Aegis CI witness | `./.aegis/bin/aegis witness --target-dir . --base origin/main --ci --json` | 0 | Passed with local-ledger checks explicitly marked not derivable in CI. |
| Aegis capsule | `./.aegis/bin/aegis brief --check --target-dir .` | 0 | Passed. |

## Pre-Existing Defects

### Type Safety

The web typecheck reports 10 errors across the web app and imported UI source:

- `ThemeSwitcher` compares a union that excludes `system` against `system`.
- Two RGB conversion implementations index values that strict checking treats as possibly undefined.
- The web command component crosses incompatible React type identities.
- The dropdown checkbox forwards `undefined` under `exactOptionalPropertyTypes`.
- The toast reducer sends an explicitly undefined optional identifier.

The UI declaration build independently confirms the `ThemeSwitcher` error. These are real defects; CI must not suppress them.

### Lint

- `packages/ui` declares a lint script but has no discoverable ESLint configuration.
- `packages/web` lint succeeds but reports 12 warnings, primarily explicit `any` and one value used only as a type.
- The root recursive lint stops at the UI failure, so CI should retain a root gate and provide enough per-package diagnostics to identify the failing package.

### Tests

- `packages/backend` has Jest but no tests.
- `packages/ui` and `packages/web` expose Jest scripts without installing/configuring Jest locally.
- No committed Playwright command, Playwright configuration, accessibility command, or direct Playwright/accessibility dependency exists. Transitive lockfile entries are not a supported test surface.
- CI must not claim unit, integration, end-to-end, or accessibility coverage until real commands and tests exist.

### Builds

- The backend Babel build is green.
- The UI build is blocked by its declaration typecheck.
- Next.js compiles the web application but fails during its validation worker; the explicit web typecheck provides the actionable errors.
- The root workspace build is red because it preserves package failures.

### Governance and Security

- Taskmaster 0.43.1 has no `health` subcommand. Dependency validation is supported and green; CI needs a separate deterministic graph/schema invariant rather than a fictional health command.
- `codex-guard validate` currently mixes actionable Task 36 evidence gaps with legacy date-rollover, archived-folder, session-state, and plan-sync findings.
- `codex-guard drift-check --strict` expects 16 legacy canonical template paths that this project-local Aegis installation does not contain. Retiring or hot-patching that legacy scaffold remains out of scope.
- Aegis CI witness passes, but correctly states that external-ledger verification and local scope globs are not fully derivable in CI. GitHub required checks remain the enforcement authority.
- No local `gitleaks`, TruffleHog, detect-secrets, Trivy, or Semgrep executable is installed.
- A redacted common-signature scan found only an example `ANTHROPIC_API_KEY` placeholder in `.windsurfrules`, not a credential. This is not a substitute for a dedicated scanner.
- Dependency review is unavailable until GitHub Actions exists.

## Protected CI Roadmap Gate

Task 48, **Bootstrap Protected CI and Controlled Auto-Merge**, was added at high priority with Task 36 as a dependency. Task 38 depends directly on Task 48; Tasks 39–47 depend on it transitively. Task 37 remains able to perform non-modernization architecture spikes after Task 36 while CI work is under review.

The HP-Fetcher workflows were reviewed as design references only:

- Preserve read-only CI permissions, pull-request and `main`-push triggers, concurrency cancellation, frozen pnpm install, deterministic stages, and failure artifacts.
- Preserve explicit `auto-merge` labeling, the `workflow_run`/`pull_request:labeled` race handling, direct check-run inspection excluding the merge job, squash merge, and branch deletion.
- Remove all HP-Fetcher app/worker working directories, separate lockfiles, Clerk secrets, D1 setup, `.dev.vars`, and Vite environment assumptions.
- Keep the initial blog CI on Node 22 and pnpm 9.
- Stabilize the real failing commands or create explicit unsupported-check follow-ups before making them required. Do not use broad suppressions, `--passWithNoTests`, or skipped build/type stages to manufacture green CI.
- Add CI first in a dedicated, human-reviewed workflow PR. Configure public-main protection only after the exact successful check names exist.
- Add auto-merge in a separate reviewed change and prove it on a documentation-only canary before using it on eligible low/medium-risk task PRs.

## Baseline Gate Decision

The repository is reproducibly installable but not CI-ready. Task 48 must treat the typecheck, UI lint, missing test tooling/coverage, build failures, guard integration, secret scanning, and dependency review as explicit work. The baseline does not authorize package modernization, framework migration, or weakening any check.

## Post-Closeout Delivery Verification

After deterministic Task 36 closeout and the supported Taskmaster done transition:

- `task-master health` exited 1 because Taskmaster 0.43.1 has no `health` command; no health result is claimed.
- `task-master validate-dependencies --tag master` passed for 16 tasks and 22 dependencies.
- The deterministic graph check passed with no missing dependencies or cycles, Task 36 done, Task 48 dependent on Task 36, and Tasks 38–47 gated by Task 48.
- The supported `task-master set-status 36 done` command normalized master-tag task IDs and dependencies from numbers to strings, recalculated master metadata to 16 tasks/1 done, and removed prior noncanonical metadata fields. Dependency validation and the independent graph check pass after normalization; no manual `tasks.json` rewrite was performed.
- `aegis verify --strict --target-dir .` passed all required workflow checks while enforcement remained advisory.
- Local and CI witness correctly rejected the uncommitted Task 36 done flip. Witness must be rerun after the containing commit and pass before push/PR readiness is claimed.
- `git diff --check` passed.
- `codex-guard validate --include-untracked` exited 1 because closeout intentionally leaves no `-ACTIVE` folder.
- `codex-guard drift-check --strict` continued to report the same 16 missing legacy canonical-template paths. No legacy-scaffolding retirement or suppression was applied.
