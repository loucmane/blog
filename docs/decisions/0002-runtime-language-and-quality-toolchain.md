# ADR 0002: Modernize Runtime, Language, and Quality Tooling in Separate Batches

**Status:** Proposed

**Runtime target note:** ADR-0003 supersedes this ADR's Node, pnpm, Corepack, and CI-runtime versions. The Task 39 language and quality-tooling sequence remains proposed and must be re-queried at implementation time.

**Date:** 2026-07-09

**Task:** 33

## Context

The repository permits Node 18, declares pnpm 9, runs locally on Node 22, mixes TypeScript and Tailwind versions, uses end-of-line ESLint 8, has broken or incomplete Jest scripts, and has no CI. TypeScript 7.0.2 was released one day before this research and is production-stable, but it has no programmatic API until 7.1. Current typescript-eslint supports TypeScript only below 6.1.

## Decision

Modernize in independently reversible batches:

1. Node 24.18 LTS, pinned pnpm 11.10, developer version declaration, engines, Corepack, and GitHub Actions runtime.
2. TypeScript 6.0.3, ESLint 10.6, typescript-eslint 8.63, Prettier 3.9, explicit typecheck scripts, and flat lint configuration.
3. Vitest 4.1, Testing Library 16.3, Playwright 1.61, axe-core 4.12, and meaningful smoke/integration coverage.
4. React 19.2 and Next 16.2 in the framework batch.
5. Tailwind 4.3 and design-system migration in a visual batch.

Re-query versions and advisories at each implementation PR. Pin exact runtime/tool versions where reproducibility matters; allow controlled patch automation only after baseline stabilization.

## Rationale

- Node recommends production use of Active or Maintenance LTS. [Node releases](https://nodejs.org/en/about/previous-releases)
- pnpm 11 requires Node at least 22.13, so runtime precedes package manager.
- TypeScript 6 is the compatibility bridge recommended by Microsoft for tools needing the compiler API while TypeScript 7 matures. [TypeScript 7 transition](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- The quality stack adds actual verification instead of preserving empty Jest commands.
- Separate commits and PRs make regressions attributable and rollback practical.

## Consequences

- TypeScript 6 default and deprecation changes must be fixed intentionally in every tsconfig.
- TypeScript 7 receives a later task after framework, eslint, editor, and tooling compatibility is proven; no permanent dual compiler.
- CI must run the same commands developers run and use full-SHA action pins. [GitHub secure use](https://docs.github.com/en/actions/reference/security/secure-use)
- Formatting-only churn must not hide semantic migration changes.
- Existing failures will be recorded before upgrades and cannot be suppressed broadly.

## Acceptance Gates

- Clean frozen install from a fresh checkout.
- Explicit `typecheck`, `lint`, `format:check`, unit/integration, and build commands.
- Package and app builds on Node 24 locally and in CI.
- Playwright smoke and axe checks where runnable.
- No unexplained peer dependency warnings or duplicate core versions.
- Security advisory review and least-privilege workflow permissions.
- Clean working tree after every gate.

## Rollback

Each numbered batch is a separate pull request. Revert only the failing batch and restore its lockfile, runtime declarations, scripts, and CI together. Never force the later batch to pass with broad suppressions or legacy flags.
