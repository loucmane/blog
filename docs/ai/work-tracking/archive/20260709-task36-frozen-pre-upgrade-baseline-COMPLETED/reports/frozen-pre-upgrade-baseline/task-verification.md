# Task 36 Baseline Verification Evidence

## Snapshot

- Commit: `9f804a1cca342dce9c549f4b0dfbded7c2d33a9a`
- Runtime: Node `v22.16.0`, pnpm `9.0.0`
- Canonical report: `docs/research/2026-07-10-pre-upgrade-baseline.md`
- Package manifests and `pnpm-lock.yaml` were byte-identical before and after verification.

## Outcomes

- Frozen install: passed.
- Web and UI typechecks: failed on pre-existing type errors.
- Root lint: failed because the UI package lacks ESLint configuration; web lint passed with warnings.
- Root and package tests: failed because UI/web Jest tooling is absent and backend has no tests.
- Backend build: passed.
- UI, web, and root builds: failed on the recorded validation defects.
- Taskmaster dependency validation: passed for 16 tasks and 22 dependencies.
- Aegis local witness, CI witness, and capsule check: passed.
- Legacy Codex guard validation and drift checks: failed on the recorded project/workflow compatibility findings.
- No supported Playwright/accessibility command or dedicated local secret scanner exists.

## Classification

These failures existed at the merged pre-modernization commit. They are baseline defects, not migration regressions. No dependency, package, product, lockfile, or workflow implementation change was made while recording them.
