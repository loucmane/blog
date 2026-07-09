# Protected CI Bootstrap

**Task:** 48 — Bootstrap Protected CI and Controlled Auto-Merge
**Baseline:** Node 22.16.0, pnpm 9.0.0, lockfile format 9.0
**Delivery boundary:** attended CI workflow pull request only

## Scope

This first Task 48 delivery adds read-only CI and the smallest verified baseline fixes needed to make valid typecheck, lint, and build commands enforceable. It does not add auto-merge, change repository rules, modernize the runtime, update dependency versions, add deployment access, or claim unsupported test coverage.

## Reference Design

The local HP-Fetcher workflows were used as proven structural references:

- `/home/loucmane/dev/hpfetcher/.github/workflows/ci.yml`
- `/home/loucmane/dev/hpfetcher/.github/workflows/auto-merge.yml`

The blog workflow retains pull-request and `main`-push verification, read-only permissions, concurrency cancellation, frozen pnpm installation, deterministic stages, failure artifacts, and separate security checks. HP-Fetcher app/worker directories, Clerk secrets, D1 migrations, `.dev.vars`, split lockfiles, and Vite variables are absent.

## Selected Actions

All action releases were resolved from their official repositories on 2026-07-10 and pinned to immutable commits.

| Action | Stable release | Commit |
| --- | --- | --- |
| [actions/checkout](https://github.com/actions/checkout/releases/tag/v7.0.0) | `v7.0.0` | `9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0` |
| [pnpm/action-setup](https://github.com/pnpm/action-setup/releases/tag/v6.0.9) | `v6.0.9` | `0ebf47130e4866e96fce0953f49152a61190b271` |
| [actions/setup-node](https://github.com/actions/setup-node/releases/tag/v6.4.0) | `v6.4.0` | `48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e` |
| [actions/upload-artifact](https://github.com/actions/upload-artifact/releases/tag/v7.0.1) | `v7.0.1` | `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` |
| [actions/dependency-review-action](https://github.com/actions/dependency-review-action/releases/tag/v5.0.0) | `v5.0.0` | `a1d282b36b6f3519aa1f3fc636f609c47dddb294` |
| [gitleaks/gitleaks-action](https://github.com/gitleaks/gitleaks-action/releases/tag/v3.0.0) | `v3.0.0` | `e0c47f4f8be36e29cdc102c57e68cb5cbf0e8d1e` |

These stable releases use the current Node 24 action runtime internally. The project commands remain pinned to the committed Node 22.16.0 and pnpm 9.0.0 baseline; Task 38 owns project runtime modernization.

## Verification Contract

The planned required checks are:

- `workspace · install · typecheck · lint · tests · build`
- `governance · Taskmaster · Aegis · guards`
- `security · gitleaks`
- `security · dependency review` on pull requests

Workspace stages preserve every exit status while allowing later diagnostic stages to run. A final aggregation step fails the job if any required stage failed or was skipped. Failure logs are uploaded for 14 days.

Taskmaster health uses a repository-owned deterministic schema, dependency, cycle, and roadmap-gate check because Taskmaster 0.43.1 has no `health` command and is not a pinned workspace dependency. Aegis CI uses the committed standalone capsule and witness libraries because `.aegis/bin/aegis` intentionally points to an out-of-repository development runtime unavailable on GitHub runners.

## Unsupported Test Surfaces

The baseline has no runnable unit/integration suite for the UI or web packages, no backend tests, and no direct Playwright or accessibility setup. CI therefore runs explicit capability contracts rather than falsely reporting test success. Those contracts fail when the capability changes, forcing real test commands to replace the bridge.

- **Owner:** Task 39 — Modernize TypeScript Lint Formatting and Tests
- **Removal deadline:** Task 39 quality-tooling pull request
- **Current behavior:** report `unsupported-tracked`; never claim tests ran

## Temporary Compatibility Bridges

| Bridge | Owner | Removal deadline |
| --- | --- | --- |
| `packages/ui/.eslintrc.cjs` uses the currently hoisted ESLint 8 and TypeScript/React plugins so the valid UI lint script can run without a dependency migration. | Task 39 | Replace with the approved unified flat configuration and direct dependency ownership in the Task 39 PR. |
| `CommandDialogProps` derives `children` from cmdk's current component props to bridge duplicate React type identities. | Task 39 | Remove after Task 39 unifies TypeScript and test-tool type resolution; defer to Task 40 only if the approved framework migration owns cmdk replacement. |
| Unit/integration and browser/accessibility capability contracts report `unsupported-tracked`. | Task 39 | Replace with real Vitest/Testing Library/Playwright/axe commands in the Task 39 PR. |
| Exact 16-path legacy drift allowlist. | Task 47 | Before Aegis strict-mode activation; Task 47 must hand off removal if still present. |

The 16 legacy `codex-guard drift-check --strict` findings are held to an exact allowlist. Any added, removed, or changed finding fails CI.

- **Owner:** Task 47 final foundation handoff
- **Removal deadline:** before Aegis strict-mode activation; Task 47 must hand off removal if still present
- **Constraint:** this goal does not retire legacy Aegis scaffolding

## Security and Fork Safety

- Workflow token permissions are globally limited to `contents: read`.
- No repository secret is referenced by code executed from pull requests.
- Gitleaks receives only the event-scoped read token; its default PR comments and internal artifact upload are disabled so the job requires no write permission.
- Two exact historical Gitleaks fingerprints are ignored in `.gitleaksignore`. They are duplicate copies of the same 2025 Next.js server-action build encryption key in committed `.next` artifacts, not an external service credential; no path, rule, commit, or pattern-wide exception is used.
- Dependency review runs only for pull requests and does not post comments or request write access.
- Checkout does not persist credentials.
- Auto-merge remains absent from this pull request and requires a separate attended review after main protection is installed.

## Rollback

Revert the CI bootstrap commit. This removes the workflow, compatibility scripts, baseline fixes, and documentation without changing dependency versions, the lockfile, repository rules, secrets, production data, or deployment state.
