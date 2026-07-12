# Task 38 Independent Review Record

- Task: `38` — Modernize Node pnpm and CI Runtime
- Branch: `feat/task-38-modernize-node-pnpm-ci-runtime`
- Review mode: two independent read-only reviews; parent session owns every mutation
- Authority: `standing-grant:sota-magazine-2026-autonomy-v2`

## Review History

1. The initial implementation/completeness and adversarial CI reviews rejected non-exact dependency-build approvals, obsolete pnpm 11 `.npmrc` settings, comment-spoofable CI checks, open workflow action identity, and missing package/lockfile semantic contracts.
2. The first remediation exact-matched build and override maps, deleted obsolete non-auth `.npmrc` settings, parsed CI jobs and steps, locked runtime/final-enforcement steps, allowlisted every workflow action, and hashed workspace package and lockfile semantics.
3. Follow-up review rejected job-level `if`/`continue-on-error` bypasses, lexical YAML action discovery, uncontracted workspace keys, and stale evidence hashes. The checker moved to exact dev-only `yaml@2.9.0`, the lockfile was limited to 10 additive parser lines, the workspace job envelope became exact, and the complete workspace file gained a byte digest.
4. Final bootstrap review rejected inherited workflow environment/default-shell behavior. The checker now exact-matches the full non-job workflow root; the workspace job clears `BASH_ENV` and `NODE_OPTIONS`; and the checker step pins `shell: bash` before it validates the root contract.
5. A final adversarial pass rejected lifecycle-enabled installation before validation, non-exact pre-runtime step/action topology, and unhashed trusted-ref resolver code. CI now bootstraps only the root parser with lifecycle scripts and pnpmfile hooks disabled, validates complete CI semantics and trusted resolver/checker/test hashes, then performs the full frozen install. A fresh isolated copy proved this sequence and unchanged lock bytes.
6. PR #29 exact-head review rejected that pre-delivery design. It proved the context job ran dependency, checker, and test code before trust resolution; proved the root-filtered pnpm bootstrap installed far more than the parser; and identified stale live continuity pointers.
7. Remediation restored the original resolver ordering and made it an explicit contract: context contains only pinned checkout, pinned Node setup without cache/package reads, and the unchanged resolver. The post-resolution workspace obtains only official `yaml@2.9.0` in isolated trusted-runner storage, with scripts disabled, explicit registry and empty npm configs, and exact SHA-512 verification before import.
8. Fresh review rejected accepting an arbitrary absolute parser module before validation, setup-node's implicit package-manager caching default, and continuity pointers that still listed a completed matrix as pending. The second remediation disables automatic context caching, rejects preexisting parser directories, and proves exact path, regular object types, realpath containment, tarball integrity, and full package-tree integrity before dynamic import. Absolute-local and symlink fixtures prove malicious modules never execute.
9. The next implementation/completeness review passed. The adversarial review still rejected a CI-only missing-environment fallback that imported repository-resolved YAML before contract validation. The final patch makes the trusted runner-temp module mandatory whenever `GITHUB_ACTIONS=true`; local fallback remains outside GitHub Actions only, and a missing-module process fixture fails before import.

## Adversarial Fixtures

- Job-level skip and ignored-failure controls.
- Workflow-root environment and custom default shell injection.
- Workspace `BASH_ENV` replacement and checker-shell inheritance.
- Unsafe parser bootstrap flags, extra pre-runtime steps, and duplicate approved actions.
- Trusted post-merge context resolver drift and complete CI semantic/action-topology drift.
- Any repository-controlled run step or pnpm setup before trusted-ref resolution.
- Parser checksum removal, registry substitution, repository-local parser paths, and bootstrap-configuration drift.
- Absolute-local parser injection, symlinked parser modules, modified parser trees, and pre-resolver setup-node automatic package-manager caching.
- Missing `RUNTIME_YAML_MODULE` under `GITHUB_ACTIONS=true` before repository dependency import.
- Escaped and flow-style `uses` keys, aliases, and anchors.
- Mutable and unregistered actions.
- Missing, broad, unresolved, or additional dependency build approvals.
- Removed, shadowed, or unsupported pnpm settings.
- Extra workspace settings and exact lockfile/package semantic drift.

## Pre-PR Verdicts

- Implementation/completeness reviewer `019f55d5-549a-78a1-831b-d4f022dc1f50`: **PASS**. Context prevalidation, standard-event redirect fixtures, both workflow semantic digests, trusted support-file hashes, independent workspace validation, package/lockfile scope, and Task 38 boundaries have no remaining blocker.
- Adversarial CI/trust-boundary reviewer `019f55d5-5a7d-75a2-8ecf-aa0a9df64903`: **PASS**. Scriptless bootstraps, pre-resolver validation, explicit execution controls, exact action topology, runtime/final enforcement, redirect/bypass fixtures, unchanged triggers/permissions/dispatch semantics, and untouched auto-merge workflow bytes have no remaining blocker under attended protected review.

Hosted checks on the committed exact PR head remain a separate required delivery gate and are not represented as completed by these local reviews.

## PR #29 Exact-Head Review

- Published head `ffbf89220dd4d522d09139b98f69d1c9e6136186`: **BLOCKED** by both fresh read-only reviews for the trust-boundary and continuity issues recorded above.
- First remediation review: implementation/completeness reviewer `019f53a5-f8d9-7881-ac27-e423d930f52b` **BLOCKED** stale live pointers; adversarial reviewer `019f53c2-2ce1-78e1-b808-8446ea4f8a85` **BLOCKED** arbitrary absolute parser import and implicit setup-node package-manager caching.
- Second review: implementation/completeness reviewer `019f53a5-f8d9-7881-ac27-e423d930f52b` **PASS**; adversarial reviewer `019f53c2-2ce1-78e1-b808-8446ea4f8a85` **BLOCKED** the missing CI parser environment fallback.
- Final patch status: the complete exact-head local matrix passes after the missing-module guard, and both fresh independent verdicts pass.
- Remaining delivery gate: hosted checks must rerun after the signed follow-up commit is pushed.

## Final Exact-Diff Verdicts

- Implementation/completeness reviewer `019f53a5-f8d9-7881-ac27-e423d930f52b`: **PASS**.
- Adversarial CI/trust-boundary reviewer `019f53c2-2ce1-78e1-b808-8446ea4f8a85`: **PASS**.
- Both verdicts cover the complete current worktree after the final missing-CI-parser guard and exact-head local matrix. Hosted checks remain a separate delivery gate.
