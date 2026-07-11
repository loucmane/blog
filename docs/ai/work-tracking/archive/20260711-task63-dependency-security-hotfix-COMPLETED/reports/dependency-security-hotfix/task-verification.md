# Task 63 Dependency Security Verification

## Scope

Task 63 is a security hotfix before the broader modernization sequence:

- Task 38 remains responsible for Node, pnpm, Corepack, and CI runtime policy.
- Task 39 remains responsible for real unit, integration, browser, and accessibility tooling.
- Task 40 remains responsible for the major Next.js and React framework migration.

This task does not dismiss advisories, change the verification capability contract, or claim that the repository's full test platform is complete.

## Baseline

Captured on 2026-07-11 before package changes:

| Source | Critical | High | Moderate/medium | Low | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| GitHub Dependabot, open alerts on `main` | 1 | 26 | 27 | 6 | 60 |
| `pnpm audit --json` | 1 | 29 | 29 | 7 | 66 |

The GitHub inventory concentrated 23 alerts in `next@15.3.3`. Its newest applicable fixed floor was `15.5.18` for GHSA-26hh-7cqf-hhc6; the critical React Flight RCE was GHSA-9qr9-h5gf-34mp.

## Remediation

- Upgraded Next.js, `eslint-config-next`, and `@next/eslint-plugin-next` to `15.5.20` without crossing to Next 16.
- Upgraded direct security-relevant backend packages: Express `4.22.2`, Morgan `1.11.0`, and Babel `7.29.7`.
- Upgraded direct security-relevant build packages: Rollup `4.62.2`, PostCSS `8.5.16`, Tailwind CSS `3.4.19`, and ESLint `8.57.1`.
- Added disjoint, major-line-specific pnpm overrides for vulnerable transitive versions only. The Next/PostCSS override is parent-scoped to avoid changing other PostCSS peer contracts.
- Added a structured zero-vulnerability audit policy and artifact.
- Added a production Next.js server smoke harness that verifies a complete `200 text/html` response and terminates the server process group cleanly.
- Made the existing required workspace CI check enforce both the security policy and production smoke.

## Results

| Command/check | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` using the isolated task store | PASS |
| `pnpm test:security-hotfix` | PASS, 5/5 |
| `pnpm security:audit` | PASS, 0 critical/high/moderate/low/info |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS with pre-existing warnings |
| `pnpm build` | PASS for backend, UI, and web |
| `pnpm test:smoke:web` | PASS, HTTP 200, `text/html`, 21,083-byte document |
| `pnpm ci:auto-merge-policy` | PASS, 25 policy + 12 workflow assertions |
| `pnpm ci:agent-skills` | PASS, 23/23 after merging completed Task 51 from main |
| `pnpm ci:taskmaster` | PASS, 31 tasks and 69 dependency references |
| `pnpm ci:aegis` | PASS |
| `pnpm ci:guard` | PASS; 16 known canonical-doc findings remain owned by Task 47 |
| completed-state guard regression suite | PASS, 5/5 |
| `actionlint` v1.7.12, checksum verified from the official release | PASS |
| `git diff --check` | PASS |

## Explicit Residuals

- `pnpm test` still fails because the web and UI packages declare `jest` without installing or configuring it. This is the recorded unsupported baseline, not a regression from Task 63. Task 39 owns replacement with real test execution.
- `@testing-library/react@14.3.1` still declares React 18 peers while the project already uses React 19. Task 39 owns that testing-stack migration.
- ESLint 8 and `next lint` are deprecated. Task 39 owns the flat-config and CLI migration.
- The 60 GitHub alerts remain visible until this branch merges and GitHub refreshes the dependency graph. Post-merge alert recount is a delivery acceptance condition.

## Main Synchronization

PR #19 merged to main as `4b5194c843351577762104248339b0959a564715`. Task 63 then merged that main commit without rebasing. The structured resolution preserved Task 51 as `done`, Task 63 as `in-progress`, both append-only plan-sync histories, and Task 63 as the active plan/session pointer. All verification in the Results table was repeated on the merged tree.

## Decision

The security hotfix is locally verified. It must not use unattended auto-merge because it changes dependency inputs and CI governance while the repository's unit/browser capability contract is still `unsupported`. The protected PR must pass the exact required checks and receive the repository's high-risk merge authorization before merge.
