# Task 37 Verification

- **Task:** 37 — Validate High-Risk Architecture Spikes
- **Branch:** `feat/task-37-validate-high-risk-architecture-spikes`
- **Base:** `beea81580619aab1d1f9cb2aeb0c98e6cb2c664c`
- **Runtime:** Node 24.18.0, pnpm 11.11.0, Corepack 0.35.0
- **Authority:** `standing-grant:sota-magazine-2026-autonomy-v2`
- **Result:** Pass for Task 37's local, synthetic, and repository gates; live-provider and
  manual assistive-technology gates remain explicitly deferred to their owning tasks.

## Scope Proof

- Retained implementation is isolated under `research/task37/` and is outside the root pnpm
  product workspace.
- Root `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, product source, workflows,
  Aegis managed runtime/authority/enforcement/manifest, deployment, and secrets have no
  retained Task 37 diff.
- Synthetic fixtures are checksummed. Local service credentials are synthetic and bound to
  loopback-only ephemeral containers.
- User-owned `.codex/` remained uninspected and untouched.
- The generated `packages/web/next-env.d.ts` line and Aegis verification timestamp were
  restored after verification so they do not broaden Task 37 scope.

## Architecture Spike Matrix

| Gate | Result | Evidence |
| --- | --- | --- |
| Frozen research install | Pass twice; no lockfile drift | `research/task37/pnpm-lock.yaml` |
| Fixture integrity | Pass; one committed SHA-256 fixture | `research/task37/fixtures/SHA256SUMS` |
| Editor/migration/autosave/scheduler tests | Pass; 4 isolated files containing 21 named test cases, including serialized JSON re-import and hostile rendered-text escaping | `research/task37/tests/*.unit.test.mjs` |
| PostgreSQL/media/restore integration | Pass; 1 end-to-end drill | `research/task37/tests/persistence.integration.test.mjs` |
| Framework build and smoke | Pass | Next 16.2.10 production build, static reader, private preview, health route, generic Node server |
| Advisory skill result | Schema-valid | SHA-256 `8c3f664dd0c6ad7e1667025436cb9fa88c9621a6988ddf6a34bd2cf5b29c0f9d` |

The integration drill used the immutable PostgreSQL 18.4 and VersityGW 1.5.0 image digests
recorded in `docs/research/task-37-architecture-spike-results.md`. It proved migrations,
rollback, Drizzle reads after migration, pg-boss schema/concurrency/transaction behavior,
Sharp rendition, application SHA-256 media integrity, copy to a second S3-compatible
endpoint, custom-format dump, isolated restore, record/document equality, and synthetic owner
credential verification. Containers, networks, and volumes were removed after the run.

## Repository Verification

| Command or gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Pass; zero drift |
| Runtime contract | Pass; 13/13 |
| `pnpm typecheck` | Pass |
| Dependency hotfix contracts | Pass; 7/7 |
| `pnpm security:audit` | Pass; zero advisories at every severity |
| `pnpm lint` | Pass; zero warnings |
| `pnpm format:check` | Pass |
| Unit capability | Supported |
| Quality contracts | Pass; 29/29 |
| `pnpm test:coverage` | Pass; 6 files, 22 tests; 97.01% statements, 92.3% branches, 100% functions, 96.87% lines |
| `pnpm build` | Pass for backend, UI, and web |
| Browser capability | Supported |
| Playwright/accessibility | Pass; 4/4 across desktop and mobile Chromium |
| Production web smoke | Pass; HTTP 200 |
| Auto-merge policy/workflow contracts | Pass; 65/65 and 46/46 |
| Cross-agent skill platform | Pass; 29/29 |
| Taskmaster health | Pass; 36 tasks and 76 dependencies |
| `task-master validate-dependencies` | Pass; 36 tasks, 3 subtasks, 76 dependencies; incidental notice flag reverted |
| Aegis strict verification | Pass; 31 checks, zero required failures, expected advisory warning and one unsupported manual integration |
| `aegis brief --check` | Pass |
| Local and CI witness | Pass |
| Completed-state guard regressions | Pass; 5/5 |
| Legacy guard and plan sync | Pass; exact 16-path Task 47 template-debt inventory retained |
| `actionlint` 1.7.12 | Pass for both workflows |
| Gitleaks 8.30.1 | Pass; 199 commits and approximately 47.67 MB scanned, no leaks |
| `git diff --check` | Pass |

## Environment-Only Retries

- Sandboxed Docker access, loopback binding, and nested trusted-process execution initially
  returned permission errors. The same exact commands passed with the required local runtime
  permissions; no code was weakened to accommodate the sandbox.
- The accessibility baseline ratchet requires different immutable base and head commit SHAs.
  Before the task commit, both refs are necessarily the same base commit, so the ratchet
  correctly refuses to claim evidence. It must run against the exact signed PR head and again
  in protected CI before merge.
- Playwright reported existing Next configuration deprecation/standalone-start warnings. The
  tests passed; Task 40 owns the Next 16 configuration migration rather than Task 37 hiding or
  changing those warnings.
- The editor-shell Axe run covers deterministic JSDOM-supported rules. Color contrast requires
  real layout and is deliberately not represented as proven by JSDOM; Tasks 43/46 own browser
  contrast and manual assistive-technology validation.

## Residual Gates And Rollback

- Manual NVDA/VoiceOver operation and live Neon/R2/Vercel export, restore, billing, cache,
  failure, and credential-off drills remain unproven and must not be represented as complete.
- Task 40 is an independently reversible Next/React migration. If its committed behavior,
  security, portability, performance, or deployment checks fail, revert that PR and evaluate
  React Router against the same criteria.
- The research harness is disposable and imports no product code. Removing `research/task37/`
  rolls back the executable spike without changing application behavior or data.
- Hosted required checks, exact-head witness, independent reviews, and the immutable-SHA
  accessibility ratchet remain delivery gates after the Task 37 commit.
