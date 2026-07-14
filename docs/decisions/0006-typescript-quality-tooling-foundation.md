# ADR-0006: Adopt TypeScript 6 and a Unified Quality Tooling Foundation

- Status: accepted; Task 39 delivery gates pending
- Decision owner: project owner
- Decision task: Task 39
- As-of date (UTC): 2026-07-12
- Review/expiry date: 2026-08-12
- Supersedes: the language, lint, formatting, and test targets in ADR-0002

## Decision

Adopt one repository-owned quality toolchain:

- TypeScript `6.0.3` as the only compiler and API package.
- ESLint `10.6.0`, `@eslint/js` `10.0.1`, typescript-eslint `8.63.0`, and `@eslint-react/eslint-plugin` `5.9.5` with one root flat configuration.
- Prettier `3.9.5` with explicit write and check commands.
- Vitest `4.1.10`, Vite `8.1.4`, jsdom `29.1.1`, and Testing Library for unit and integration tests.
- Playwright `1.61.1` and `@axe-core/playwright` `4.12.1` for production-build browser, keyboard, responsive, and automated accessibility checks.
- Vite is test infrastructure only. Next.js remains the product framework until Task 40; no second Vite application or overlapping production build path is introduced.

The root scripts are the canonical developer and CI interface. Package scripts project the same tooling into package-local workflows. CI must install the pinned Chromium build explicitly, enforce formatting, execute coverage-backed tests, build the application, and run browser/accessibility checks against the production server.

## Context

The Task 39 baseline had TypeScript split between package-local ranges, end-of-life ESLint 8, no flat config, a broad Prettier range, and Jest scripts that were absent or non-runnable for the UI and web packages. Unit and browser capabilities were honestly reported as unsupported. The repository had no meaningful coverage, browser, keyboard, or automated accessibility evidence.

TypeScript `7.0.2` is production-stable, but Microsoft states that 7.0 does not ship a programmatic API and recommends TypeScript 6 for utilities such as typescript-eslint until 7.1. typescript-eslint `8.63.0` officially supports TypeScript `>=4.8.4 <6.1.0` and ESLint 10. A dual TypeScript 6/7 compiler would add complexity without product value, so Task 39 uses the latest compatible TypeScript 6 patch only.

ESLint `10.6.0` is the latest stable release reported by the official registry and is on the current supported major. The legacy `eslint-plugin-react` `7.37.5` does not declare ESLint 10 support, so the flat configuration uses the ESLint-10-native `@eslint-react/eslint-plugin`. That project publishes rapidly; Task 39 selects observed `5.9.5` rather than the same-day `5.14.x` line while retaining the required ESLint 10, TypeScript, and React semantic coverage.

## Decision Drivers

- Replace fictional test scripts with executable evidence.
- Keep typechecking separate from Vite/Vitest transpilation.
- Use current supported tooling without prereleases or unsupported peer ranges.
- Preserve the Next.js product build while making Vite's role explicit and non-overlapping.
- Fail closed on script, dependency, lockfile, and CI-stage drift through the runtime contract.
- Make formatting deterministic without hiding semantic migration work.
- Establish real browser and accessibility evidence without pretending existing design debt is fixed.
- Keep the batch independently reversible before Tasks 40 and 41.

## Selected Compatibility Chain

| Boundary                       | Selected contract                                    | Evidence and result                                                                                    |
| ------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| TypeScript → typescript-eslint | TypeScript `6.0.3`; typescript-eslint `8.63.0`       | Official support is TypeScript `<6.1.0`; pass.                                                         |
| ESLint → typescript-eslint     | ESLint `10.6.0`                                      | Official support includes ESLint `^10.0.0`; pass.                                                      |
| ESLint → React semantics       | `@eslint-react/eslint-plugin` `5.9.5`                | Requires Node 22+, ESLint 10.3+, and TypeScript 5+; missing-key contract passes.                       |
| TypeScript → package builds    | One exact root compiler                              | Web no-emit and test/config typecheck pass; Task 41 removed the duplicate UI declaration build.         |
| Vitest → Vite                  | Vitest `4.1.10`; Vite `8.1.4`                        | Vite is used only by the test runner; no product Vite app exists.                                      |
| Vite 8 → TSX                   | Oxc automatic React JSX in `vitest.config.ts`        | Overrides the product root's intentional `jsx: preserve` only for tests.                               |
| Playwright → browser           | Playwright `1.61.1`; pinned Chromium `149.0.7827.55` | Explicit install and desktop/mobile runs pass locally.                                                 |
| Playwright → accessibility     | `@axe-core/playwright` `4.12.1`                      | WCAG-tagged whole-page scan plus keyboard journey; automated results do not replace manual assessment. |
| Quality commands → CI          | Root scripts and canonical runtime hashes            | CI executes and structurally enforces every declared stage.                                            |

## Linting Boundaries

- ESLint flat config applies core recommended rules, typescript-eslint recommended rules, modern React semantic rules, React Hooks rules, JSX accessibility rules, Next recommended/Core Web Vitals rules, and Prettier conflict suppression.
- Type-aware linting is deferred. The TypeScript compiler remains the authoritative semantic check, avoiding duplicated project-service cost in this first reversible batch.
- React-19-only migrations (`forwardRef`, context provider/useContext modernization) and the existing ThemeProvider effect-state refactor are deferred to Task 40, which owns the React migration. The deterministic missing-list-key rule remains blocking and has a focused contract test.
- Task 41 resolved the two temporary Tailwind-config ignores by moving to CSS-first Tailwind 4 and removed the unused `AlertTitle` wrapper plus its file-scoped exception.
- Existing exported `any` defaults and callback parameters remain source-compatible under one file-scoped `no-explicit-any` bridge. Task 42 owns replacing those obsolete prototype contracts with the canonical content model before Task 42 closes; Task 39 does not silently tighten public APIs to `unknown`.
- No broad diagnostic suppression, disabled test, or permanent legacy compatibility flag is accepted.

## Accessibility Baseline Ratchet

The first real axe run found only pre-existing `color-contrast` violations in the legacy design-system demonstration: 15 desktop targets and 16 mobile targets. Changing product colors is outside Task 39 and belongs to Task 41, which already requires visual and accessible verification.

Task 39 therefore records exact rule/impact/selector fingerprints in `tests/e2e/accessibility-baseline.json`. The test still scans the complete page and fails when:

- any critical violation appears;
- any new serious violation appears;
- an existing violation changes target, rule, or impact;
- a baseline entry disappears without an intentional reviewed baseline update; or
- either configured viewport lacks a baseline contract.

No rule within the selected WCAG tag set and no DOM subtree is excluded from axe. Every CI event resolves an exact trusted predecessor and exact verification commit. The baseline checker requires the head path, and the base path after bootstrap, to be exactly one non-executable `100644` Git blob, reads content by the tree-reported blob identifier, and fails closed on missing, malformed, symlink, executable, wrong-type, ambiguous, or non-ancestor evidence. The initial bootstrap separately proves that protected main lacked the path and that the new regular blob has the reviewed SHA-256. Fingerprints may only be removed, never added or rewritten, and browser results must still exactly match. This follows Playwright's official guidance to fingerprint specific known issues instead of snapshotting implementation-heavy results or broadly disabling rules. Task 41 must remove each fingerprint as the corresponding contrast defect is fixed.

Test capability cannot be declared solely from package presence. TypeScript-AST contracts reject skip, todo, only, fixme, conditional, expected-failure, and chained modifiers; require both named browser journeys; and require app-local design-system plus web domain suites. Vitest and Playwright also emit machine-readable results that must contain zero skipped, todo, flaky, unexpected, focused, or failed cases. Both critical browser journeys must pass once in each configured viewport.

## Rejected Alternatives

| Alternative                                             | Why rejected                                                                                       | Reconsider when                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| TypeScript `7.0.2` plus a TypeScript 6 API alias        | Two compilers, two command paths, and no current requirement for TS7-only performance              | TypeScript 7.1 exposes the stable API and the framework/editor/plugin chain supports it.  |
| ESLint `9.x`                                            | Enters end of life on 2026-08-06 and creates another near-term major migration                     | Only as a time-boxed rollback if an uncorrectable ESLint 10 compatibility defect appears. |
| Legacy `eslint-plugin-react` `7.37.5`                   | Its peer range does not declare ESLint 10 support                                                  | When that package officially supports the selected ESLint major.                          |
| Keep Jest                                               | Existing scripts did not provide equivalent runnable coverage and would preserve duplicate runners | Only if a package gains a proven Jest-only requirement.                                   |
| Add a Vite product app                                  | Duplicates Next routing/build/SSR responsibilities and violates the framework decision boundary    | Only after Task 40 rejects Next with measured evidence.                                   |
| Disable axe `color-contrast` or exclude legacy sections | Would hide new defects in the same rule or subtree                                                 | Never; use the exact fingerprint ratchet until Task 41 fixes the debt.                    |
| Make all subjective accessibility findings blocking     | Automation cannot prove WCAG conformance                                                           | Keep deterministic axe/keyboard checks blocking and track manual review separately.       |

## Migration and Rollback

- Task 39 is one independently revertible tooling PR after Task 38 and before Tasks 40/41.
- Roll back by reverting the Task 39 squash commit, which restores package manifests, lockfile, root scripts, CI stages, tsconfigs, lint/format/test configs, and tests together.
- No application schema, data, secret, deployment, or production state changes exist.
- If a hosted-only incompatibility appears, correct it inside Task 39 without weakening the declared check. If correction requires framework or visual migration, stop and assign it to the owning task.
- Temporary bridges have explicit owners: Task 41 resolved the Tailwind-config ignores, `AlertTitle` exception, and empty removal-only color-contrast baseline; Task 42 owns removal of the file-scoped legacy `any` compatibility bridge when the obsolete prototype types are replaced.

## Acceptance Gates

- Two consecutive frozen installs with no further lockfile or workspace drift.
- Typecheck, root/package lint, formatting check, Vitest coverage, package/application builds, production smoke, Playwright desktop/mobile, keyboard, and axe baseline checks pass.
- Runtime contract and its full adversarial suite pass with the new script/dependency/lockfile/CI hashes.
- Dependency security policy, actionlint, workflow contracts, Taskmaster health/dependencies, strict Aegis verification/witness, completed-state guards, skill-platform tests, full-history secret scan, and `git diff --check` pass.
- Hosted CI passes all four protected checks on the exact PR head.
- Independent implementation and CI/trust-boundary reviews have no unresolved finding.

## Sources

- [TypeScript 7.0 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) — retrieved 2026-07-12; stable status, missing 7.0 API, and TypeScript 6 bridge guidance.
- [TypeScript 6.0 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) — retrieved 2026-07-12; transition changes and explicit type-library configuration.
- [TypeScript registry versions](https://www.npmjs.com/package/typescript?activeTab=versions) — retrieved 2026-07-12; exact `6.0.3` and `7.0.2` publication state.
- [typescript-eslint dependency support](https://typescript-eslint.io/users/dependency-versions/) — retrieved 2026-07-12; ESLint and TypeScript supported ranges.
- [ESLint version support](https://eslint.org/version-support/) — retrieved 2026-07-12; ESLint 10 current and ESLint 9 maintenance/EOL date.
- [ESLint 10.6 release](https://eslint.org/blog/2026/06/eslint-v10.6.0-released/) — retrieved 2026-07-12.
- [ESLint React package](https://www.npmjs.com/package/%40eslint-react/eslint-plugin) — retrieved 2026-07-12; ESLint/Node/TypeScript requirements and available presets.
- [Prettier installation](https://prettier.io/docs/install) — retrieved 2026-07-12; exact `3.9.5` recommendation.
- [Vitest 4.1 release](https://vitest.dev/blog/vitest-4-1.html) — retrieved 2026-07-12.
- [Vitest registry package](https://www.npmjs.com/package/vitest) — retrieved 2026-07-12; exact `4.1.10` stable package.
- [Vite 8.1 release](https://vite.dev/blog/announcing-vite8-1) and [Vite TypeScript/JSX behavior](https://vite.dev/guide/features) — retrieved 2026-07-12.
- [Vite registry versions](https://www.npmjs.com/package/vite?activeTab=versions) — retrieved 2026-07-12; exact `8.1.4` package.
- [Playwright 1.61 release notes](https://playwright.dev/docs/release-notes) — retrieved 2026-07-12.
- [Playwright registry package](https://www.npmjs.com/package/%40playwright/test) — retrieved 2026-07-12; exact `1.61.1` package.
- [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing) — retrieved 2026-07-12; axe integration, limitations, and known-issue fingerprints.
- [axe Playwright registry package](https://www.npmjs.com/package/%40axe-core/playwright) — retrieved 2026-07-12; exact `4.12.1` package.
- [Testing Library React releases](https://github.com/testing-library/react-testing-library/releases) — retrieved 2026-07-12; `16.3.2` stable release.
- [axe-core repository and support policy](https://github.com/dequelabs/axe-core) — retrieved 2026-07-12.
- [rollup-plugin-dts package](https://www.npmjs.com/package/rollup-plugin-dts) — retrieved 2026-07-12; `6.4.1`, maintenance mode, and LGPL-3.0-only license.
