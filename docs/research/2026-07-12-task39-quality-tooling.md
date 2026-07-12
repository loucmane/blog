# Task 39 TypeScript and Quality Tooling Research

- Research date: 2026-07-12 UTC
- Decision: ADR-0006
- Scope: TypeScript, linting, formatting, unit/integration tests, browser tests, accessibility automation, and their CI projections
- Non-goals: React/Next migration, Tailwind/shadcn migration, product features, deployment, secrets, Aegis runtime/authority, or auto-merge policy

## Baseline

| Surface                  | Pre-Task 39 state                                                                                 | Baseline result                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| TypeScript               | Root/web/UI declarations could resolve different compiler ranges; deprecated TS6 options remained | Existing typecheck passed before migration.                                |
| ESLint                   | Root ESLint 8 and package-local legacy configs                                                    | Existing lint passed but did not provide one explicit repository contract. |
| Formatting               | Broad Prettier range; no enforced check                                                           | No CI formatting evidence.                                                 |
| Unit tests               | Root delegated to package scripts; backend referenced Jest; UI/web runners were missing           | Root test failed because the declared package runners did not exist.       |
| Browser tests            | No Playwright configuration or installed browser contract                                         | Capability reported `unsupported-tracked`.                                 |
| Accessibility automation | None                                                                                              | No automated WCAG-tagged evidence.                                         |
| Builds                   | Backend, UI, and Next application builds                                                          | Baseline build passed.                                                     |
| Security/smoke           | Existing audit and production smoke                                                               | Passed outside the process/network sandbox.                                |

The baseline command logs are retained under the active Task 39 work-tracking report. Existing failures are separated from migration regressions.

## Version Decision Matrix

| Surface                | Baseline                                   | Latest stable observed                      | Selected target          | Support and compatibility                                                                 | Rollback and verification                                                                        |
| ---------------------- | ------------------------------------------ | ------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| TypeScript             | Web `5.8.3`; UI `^5.0`; root not canonical | `7.0.2`; latest API-compatible line `6.0.3` | `6.0.3` exact            | TypeScript 7.0 lacks a programmatic API; typescript-eslint supports `<6.1.0`.             | Revert Task 39; verify every tsconfig, declaration emit, web no-emit, and test/config typecheck. |
| ESLint                 | `8.57.1`                                   | `10.6.0`                                    | `10.6.0` exact           | ESLint 10 is current and typescript-eslint supports ESLint 10.                            | Revert flat config and dependency set; run root and package lint with zero warnings.             |
| React semantic lint    | Legacy plugin without ESLint 10 peer range | `@eslint-react/eslint-plugin` `5.14.5`      | `5.9.5` exact            | Node 22+, ESLint 10.3+, TS5+; selected observed release avoids same-day patch churn.      | Revert dependency/config; missing-key contract proves effective semantic coverage.               |
| typescript-eslint      | Fragmented/older                           | `8.63.0`                                    | `8.63.0` exact           | Official TypeScript range `>=4.8.4 <6.1.0`; ESLint range includes 10.                     | Compiler remains the semantic authority; no broad parser warning suppression.                    |
| Prettier               | `^3.1.0`                                   | `3.9.5`                                     | `3.9.5` exact            | Official install docs recommend exact pinning.                                            | Revert mechanical formatting commit and configuration together if required.                      |
| Vitest                 | Absent                                     | `4.1.10`                                    | `4.1.10` exact           | Stable 4.1 line; ESM-first and compatible with the selected Node/Vite chain.              | Restore prior scripts only by reverting Task 39; all replacement tests must remain meaningful.   |
| Vite                   | No direct test dependency                  | `8.1.4`                                     | `8.1.4` exact, test-only | Vite 8.1 stable; Oxc supports TSX. It does not become the product framework.              | Remove with Vitest if Task 39 is reverted.                                                       |
| Coverage               | Absent                                     | `@vitest/coverage-v8` `4.1.10`              | `4.1.10` exact           | Version-aligned with Vitest.                                                              | Coverage thresholds and include set revert with Task 39.                                         |
| Testing Library React  | Absent                                     | `16.3.2`                                    | `16.3.2` exact           | Current stable React Testing Library release.                                             | Tests remain user-observable; revert with test foundation.                                       |
| Playwright             | Absent                                     | `1.61.1`                                    | `1.61.1` exact           | Stable 1.61 line; browser install is explicit and version-coupled.                        | Delete browser cache separately if desired; repository rollback is the Task 39 revert.           |
| axe Playwright adapter | Absent                                     | `4.12.1` registry version                   | `4.12.1` exact           | Official Playwright integration; automation finds only a subset of accessibility defects. | Revert test/config; no production dependency or state.                                           |
| Node types             | Package-local older range                  | `24.13.3` for selected runtime line         | `24.13.3` exact          | Matches Node 24 foundation and TS6 explicit `types` behavior.                             | Revert root type package and tsconfig projections together.                                      |

## Security, Maintenance, Cost, and Lock-in

| Surface                     | Security and maintenance                                                                                                                                         | Cost and lock-in                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| TypeScript/ESLint/Prettier  | Development-only, established open-source projects; exact pins and the zero-vulnerability audit bound supply-chain drift.                                        | No license fee or runtime dependency; low lock-in because compiler/lint/format changes revert together.  |
| `@eslint-react`             | ESLint-10-native and actively maintained, but its rapid release cadence warrants the observed `5.9.5` pin and review date.                                       | MIT development dependency; low runtime lock-in, moderate lint-rule migration cost.                      |
| Vitest/Vite/Testing Library | Development-only; exact versions, integrity-locked artifacts, fail-closed capability contracts, and coverage gates.                                              | No license fee; moderate test-runner coupling, isolated from the product framework and fully revertible. |
| Playwright/axe              | Official pinned packages and browser version; deterministic CI install, protected-base accessibility ratchet, and no rule suppression within selected WCAG tags. | No license fee; browser download/CI-time cost and moderate locator/baseline coupling.                    |
| `rollup-plugin-dts` `6.4.1` | Existing UI declaration build dependency; upstream is in maintenance mode and warns that response may be slow.                                                   | LGPL-3.0-only and medium maintenance/license coupling; Task 41 must evaluate replacement or removal.     |

No selected Task 39 package executes in the production application. Final dependency audit and full-history secret scanning are release gates, and rollback is one Task 39 revert rather than piecemeal package removal.

## Dependency and Lockfile Boundaries

- Quality dependencies move to the root so every package resolves one compiler, linter, formatter, and test stack.
- Jest is removed after replacement tests execute successfully; no duplicate test runner remains.
- `rollup-plugin-dts` moves only to `6.4.1` because that release supports TypeScript 6. Its maintenance-mode status and LGPL-3.0-only license are accepted only as an existing declaration-build bridge; Task 41 owns replacement/removal evaluation.
- The direct YAML parser remains exact `2.9.0`; the security override resolves the affected YAML 2 range to `2.9.0` so Vite and the runtime parser share the reviewed version.
- `eslint-plugin-import-x` was evaluated and rejected because it added a second native `unrs-resolver` build without a required Task 39 capability. The final lockfile no longer contains `unrs-resolver`, so its obsolete build approval is removed; `sharp@0.34.5` remains the only approved install script.
- No React, React DOM, Next.js, Tailwind, shadcn/Radix, application runtime, or product dependency is upgraded.

## Configuration Decisions

- One root TypeScript compiler; root `types: []` prevents accidental ambient type leakage, while web/test configs opt into Node/Vitest/jest-dom types explicitly.
- Remove deprecated `baseUrl` usage rather than hiding TypeScript 6 deprecations.
- One root ESLint flat config; root and package invocations resolve the web root identically. Modern React semantic lint retains missing-key coverage without installing an ESLint-10-incompatible legacy plugin.
- A file-scoped `no-explicit-any` compatibility bridge preserves existing exported prototype contracts instead of silently changing callback variance or generic defaults. Task 42 must remove the bridge with the canonical content model.
- TypeScript compilation and linting remain separate gates.
- Prettier owns formatting only; ESLint owns diagnostics.
- Vitest uses Oxc automatic React JSX only in the test configuration because the product compiler intentionally preserves JSX.
- Coverage includes representative backend, shared UI, token, and web utility behavior with fail-closed thresholds.
- Playwright runs the production Next server on desktop and mobile Chromium profiles, verifies HTTP/rendering, exercises keyboard theme selection, and runs a WCAG-tagged axe scan.

## Existing Accessibility Defect

The first full-page axe run found one existing rule category, `color-contrast`, across 15 desktop and 16 mobile targets in the legacy design-system demonstration. Task 39 does not change product colors. Task 41 owns the accessible visual migration.

The committed fingerprint baseline is intentionally exact. It does not disable any rule within the selected WCAG tag set or exclude DOM subtrees. A protected-base ratchet permits removals only; any added/rewritten fingerprint, critical violation, or changed/new serious browser result fails. Base and head are exact ancestor-related commits, the path must be a single `100644` Git blob, and the checker reads bytes by the verified blob identifier instead of following a working-tree symlink. The bootstrap path requires protected-base absence plus the reviewed head digest. Playwright documents this fingerprint approach for pre-existing violations because it is narrower than rule or subtree suppression.

## CI and Trust Boundary Review

- Workflow triggers, permissions, dispatch validation, checkout trust boundaries, secrets, action pins, and the auto-merge workflow are unchanged. The read-only context job adds a fail-closed predecessor output: pull requests use the synthetic merge commit's verified first parent, main pushes use the event's prior SHA, and controlled post-merge dispatches require the squash commit's single parent.
- Workspace CI adds only formatting, real coverage-backed unit/integration tests, explicit Chromium installation, a protected-base accessibility ratchet, and production Playwright/axe execution.
- Every stage remains `continue-on-error` only to preserve failure artifacts; multi-command stages use `set -euo pipefail`, and the final enforcement step fails unless every stage succeeds.
- Static capability checks use the TypeScript AST to reject disabled/focused/conditional/expected-failure modifiers and require both named browser journeys. Machine-readable Vitest and Playwright reports independently require zero skipped, todo, flaky, unexpected, or failed results.
- The canonical runtime contract hashes the updated package scripts, dependency declarations, lockfile, workspace policy, every Task 39 trust-policy script/test, workflow semantics, and exact enforcement stage set.
- Vite/Vitest never execute in a privileged workflow context; they run only after the trusted commit resolver and frozen install in the read-only CI workflow.

## Verification Plan

1. Frozen install twice with no file drift.
2. Runtime static and active contracts plus all adversarial contract cases.
3. Typecheck, root/package lint, and formatting check.
4. Unit/browser capability contracts and coverage thresholds.
5. Package/application build and production smoke.
6. Playwright desktop/mobile, keyboard, and axe baseline runs.
7. Dependency policy/audit, actionlint, workflow contracts, Taskmaster health/dependencies, skill-platform tests, Aegis strict verification/witness, completed-state guards, secret scan, and diff integrity.
8. Independent implementation and CI/trust-boundary reviews.
9. Hosted protected checks on the exact PR head.

## Primary Sources

- https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
- https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/
- https://www.npmjs.com/package/typescript?activeTab=versions
- https://typescript-eslint.io/users/dependency-versions/
- https://eslint.org/version-support/
- https://eslint.org/blog/2026/06/eslint-v10.6.0-released/
- https://www.npmjs.com/package/eslint
- https://www.npmjs.com/package/%40eslint-react/eslint-plugin
- https://prettier.io/docs/install
- https://vitest.dev/blog/vitest-4-1.html
- https://www.npmjs.com/package/vitest
- https://vite.dev/blog/announcing-vite8-1
- https://vite.dev/guide/features
- https://www.npmjs.com/package/vite?activeTab=versions
- https://playwright.dev/docs/release-notes
- https://www.npmjs.com/package/%40playwright/test
- https://playwright.dev/docs/accessibility-testing
- https://www.npmjs.com/package/%40axe-core/playwright
- https://github.com/testing-library/react-testing-library/releases
- https://github.com/dequelabs/axe-core
- https://www.npmjs.com/package/rollup-plugin-dts
