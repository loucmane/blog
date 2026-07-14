# Upstream Aegis Handoff: Clean-Checkout Hook Trust

## Defect

Strict multi-agent verification requires `codex.hook_trust_guidance`, but the verifier reads the guidance only from `.aegis/reports/install-report.json`. Generated reports are intentionally ignored, so a clean clone or isolated worktree cannot reproduce a previously passing strict verification from tracked state.

## Proven Correction

Use the tracked `codex.hook_trust` manifest gate as the strict-verification authority. Accept it only when exactly one gate has the complete canonical contract:

- `required=false`
- `enforcement=policy`
- `scope=adapter`
- `adapter=codex`
- `path=.codex/hooks.json`
- the exact no-bypass, exact-definition-hash `/hooks` unsupported reason
- `verification.method=manual`
- `verification.failure_mode=unsupported`
- `verification.expected=null`

Map that exact tracked contract to:

- `settings_path=.codex/hooks.json`
- `review_command=/hooks`
- `hash_scope=exact_hook_definition`
- `bypass_allowed=false`
- `source=manifest_gate`

Missing, duplicated, or altered gates must fail closed. Do not fall back to an ignored or locally fabricated install report when a Codex trust gate is present.

## Prototype Paths

- `scripts/_aegis_installer.py`
- `aegis_foundation/assets/scripts/_aegis_installer.py`
- `tests/meta_workflow_guard/test_aegis_installer.py`

Disposable patch: `/tmp/task70-upstream-hook-trust-fix.patch`

SHA-256: `935aa3aee16f9aea2403a039075dbf5e571b5fa5fd25ea0f4e1323acf0e91d9e`

## Acceptance Tests

1. Install a fresh multi-agent target with Claude and Codex.
2. Prove both client reload paths and kickoff tracked work.
3. Delete the generated install report to model a clean checkout.
4. Require strict verification to pass and report `source=manifest_gate`.
5. Alter the tracked trust gate and require strict verification to fail.
6. Preserve root/packaged managed-asset parity.
7. Run the existing installer, reload-marker, strict-verification, schema, and managed-asset parity suites.
8. Verify the real Blog Task 70 checkout passes all 42 strict checks without copying generated reports or state.

## Prototype Results

- New clean-checkout regression: 1 passed.
- Adjacent installer/reload/strict tests: 4 passed.
- Schema and asset-parity tests: 26 passed.
- Blog Task 70 strict verification: 42 checks, zero required failures.
- `git diff --check`: passed.

## Retry Procedure

1. Create a dedicated upstream Taskmaster/Aegis task from current stable upstream main.
2. Reproduce the Blog clean-checkout failure before patching.
3. Apply the three-path correction above and run the full upstream protected suites.
4. Deliver it through an attended upstream PR and synchronize stable main.
5. In the Blog Task 70 worktree, run strict verification using the exact merged upstream source without applying an Aegis update.
6. Confirm the 14 approved `144bd446` managed paths remain byte-identical and advisory enforcement remains configured.
7. Review the separate newer managed-update preview; do not apply it as part of Task 70 without new explicit scope.
8. Complete Task 70 only after all Blog verification and closeout gates pass.
