---
classification: internal
bead: blog-si9a
---

# Next 16.4.5 security hotfix worklog

## 2026-11-22 — why and route

- On 2026-11-22 npm published seven moderate advisories for `next` (npm advisory ids 1247486, 1247712, 1248078, 1248080, 1248083, 1248084, 1248085). All are fixed in 16.4.5. The repository pinned 16.4.1, so CI's `DEPENDENCY_SECURITY` stage (`pnpm security:audit`, zero-vulnerability policy) failed on every PR, starting with #166 (blog-0046.4), whose other stages were all green.
- The lanes tool could not admit this Bead: blog-0046.4's admitted lane reserves `packages/web/tests/framework/framework-contract.test.ts` until #166 merges, and #166 could not merge before this fix. On the operator's explicit choice, the coordinator made the change on a branch outside lanes (`fix/blog-si9a-next-16.4.5`, from main `1cfd0c6`).
- No dependency exception was possible: the policy rejects an exception once a release above the vulnerable range is published.

## 2026-11-22 — change

- `next` (packages/web) and `@next/eslint-plugin-next` (root) 16.4.1 → 16.4.5, exact pins. No other manifest change.
- `pnpm-workspace.yaml` overrides `next@16.4.1>postcss` and `next@16.4.1>sharp` renamed to `next@16.4.5>…` with unchanged values (8.5.23 and 0.35.5). next 16.4.5 still depends on postcss 8.5.23 and optionally on sharp ^0.35.5. The `config/runtime.json` overrides mirror is updated to match.
- `pnpm-lock.yaml` refreshed on the host with `pnpm install` (pnpm 11.11.0, Node 24.18.0). The diff changes only the `next`, `@next/env`, `@next/eslint-plugin-next` and `@next/swc-*` versions and integrity hashes.
- Version pins updated in `packages/web/tests/framework/framework-contract.test.ts` and `tests/ci/security-hotfix.test.mjs`, including the two regex pins on the workspace overrides. A comment names the 2026-11-22 advisories.
- `config/runtime.json` digests recomputed with `scripts/ci/check-runtime-contract.mjs`'s own exports: `lockfileSha256`, `workspaceFileSha256`, `dependencyDeclarationsSha256`, `packageManifestSemanticsSha256` and the trusted-file digest of `tests/ci/security-hotfix.test.mjs`. `packageScriptsSha256` and `rootScriptsSha256` are unchanged.

## 2026-11-22 — host verification

| Check                                                | Result                               |
| ---------------------------------------------------- | ------------------------------------ |
| `node scripts/ci/check-runtime-contract.mjs`         | passed                               |
| `pnpm security:audit`                                | passed, 0 advisories of any severity |
| `node --test tests/ci/*.test.mjs`                    | 172/172                              |
| typecheck, lint, format:check, test:quality-contract | exit 0                               |
| unit chain with coverage (`--maxWorkers=8`)          | 2892/2892, 173 files                 |
| `pnpm test:content:integration`, two runs            | 108/108 both, no unhandled errors    |
| web build, `test:browser`                            | 74/74                                |
| `test:smoke:web`                                     | passed (200)                         |
