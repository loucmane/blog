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

## Adversarial Fixtures

- Job-level skip and ignored-failure controls.
- Workflow-root environment and custom default shell injection.
- Workspace `BASH_ENV` replacement and checker-shell inheritance.
- Unsafe parser bootstrap flags, extra pre-runtime steps, and duplicate approved actions.
- Trusted post-merge context resolver drift and complete CI semantic/action-topology drift.
- Escaped and flow-style `uses` keys, aliases, and anchors.
- Mutable and unregistered actions.
- Missing, broad, unresolved, or additional dependency build approvals.
- Removed, shadowed, or unsupported pnpm settings.
- Extra workspace settings and exact lockfile/package semantic drift.

## Final Verdicts

- Implementation/completeness reviewer `019f55d5-549a-78a1-831b-d4f022dc1f50`: **PASS**. Context prevalidation, standard-event redirect fixtures, both workflow semantic digests, trusted support-file hashes, independent workspace validation, package/lockfile scope, and Task 38 boundaries have no remaining blocker.
- Adversarial CI/trust-boundary reviewer `019f55d5-5a7d-75a2-8ecf-aa0a9df64903`: **PASS**. Scriptless bootstraps, pre-resolver validation, explicit execution controls, exact action topology, runtime/final enforcement, redirect/bypass fixtures, unchanged triggers/permissions/dispatch semantics, and untouched auto-merge workflow bytes have no remaining blocker under attended protected review.

Hosted checks on the committed exact PR head remain a separate required delivery gate and are not represented as completed by these local reviews.
