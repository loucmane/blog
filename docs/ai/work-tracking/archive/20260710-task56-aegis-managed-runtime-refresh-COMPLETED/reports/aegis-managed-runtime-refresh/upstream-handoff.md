# Upstream Aegis Handoff: Managed Guard Semantic Regression

## Source Transition

- Previously recorded manifest source: `43e9a660c0b58f95c2f97031e16830443b40aa2e`
- Attempted active source: `3d051ba9937d5e88178e86067e2be4c898897263`
- Blog baseline restored from: `8908246b797ac89f5c337990197c0f0b27aeffce`

## Update Paths

- `AGENTS.md`
- `.aegis/contract.md`
- `.aegis/foundation-manifest.json`
- `.claude/scripts/ledger_lib.py`
- `scripts/_aegis_installer.py`
- `scripts/codex-guard`

## Root Cause

The managed update safely passed its mechanical preview but replaced the blog’s post-install completed-archive guard behavior with an upstream managed asset that lacks that behavior. This caused all five completed-state guard regressions to fail.

The upstream `scripts/codex-guard` replacement removed:

- `CURRENT_WORK_STATE_PATH` resolution through `.aegis/state/current-work.json`;
- fallback from an absent/empty `docs/ai/work-tracking/active/` root to the completed Aegis archive recorded in current work state;
- containment validation requiring the completed path to remain under `docs/ai/work-tracking/archive/` and end in `-COMPLETED`;
- archive-root participation when collecting changed guarded work-tracking files.

## Failing Regression Tests

- `test_prefers_the_single_active_tracker`
- `test_uses_completed_aegis_archive_when_no_active_folder_exists`
- `test_uses_completed_aegis_archive_when_active_root_is_absent`
- `test_rejects_completed_path_outside_the_archive`
- `test_requires_active_or_completed_work_tracking`

All five failed with `KeyError: 'CURRENT_WORK_STATE_PATH'` immediately after update apply and passed after the exact six-path Git rollback.

## Why Preview Classified It Safe

The updater recognized `scripts/codex-guard` as installer-managed, found no unsafe path or manifest-declared customization, and compared it only with the current upstream managed asset. It did not detect that the installed governance file had locally diverged after installation through reviewed PR #13, and the update preview did not run the repository’s semantic completed-state regression suite. Therefore it reported zero conflicts and zero manual-review paths despite a behaviorally incompatible overwrite.

## Required Remediation

1. Upstream must incorporate the completed-archive fallback and its regression tests, or provide an explicit supported extension mechanism.
2. The updater must not classify replacement of a locally diverged managed governance asset as mechanically safe without detecting the semantic/local divergence.

## Required Upstream Acceptance Tests

- Preserve a single active tracker when present.
- Resolve a completed tracker from `.aegis/state/current-work.json` when the active root is empty.
- Resolve the completed tracker when the active root does not exist in a fresh checkout.
- Reject completed paths outside the configured archive root or without a `-COMPLETED` suffix.
- Reject non-completed current-work state when no active tracker exists.
- Detect a locally diverged managed governance asset and classify replacement as conflict/manual review unless an explicit supported extension or reviewed override applies.
- Apply the update to a fixture containing the PR #13 behavior, then pass the repository legacy guard baseline and a zero-managed-change follow-up preview.

## Exact Retry Procedure

1. Wait for a stable upstream commit containing both remediation requirements; do not consume an unmerged change.
2. Confirm the blog working tree contains only Task 56 evidence and that Task 56 remains blocked.
3. Set Task 56 back to `in-progress` through Taskmaster and regenerate only `task_056.md`.
4. Run `./.aegis/bin/aegis runtime status --target-dir .` and record active/manifest source commits.
5. Run `./.aegis/bin/aegis update --target-dir .` without `--apply`.
6. Require zero conflicts, unsafe paths, non-managed paths, and manual-review paths; inspect every proposed operation and verify managed governance divergence is explicitly handled.
7. Run `./.aegis/bin/aegis update --target-dir . --apply` only after those conditions pass.
8. Prove source-commit and managed-asset hash parity.
9. Run all five completed-state tests, `pnpm ci:guard`, strict Aegis verification, `aegis brief --check`, witness, Taskmaster health/dependency validation, scoped and hosted secret scans, and `git diff --check`.
10. Close Task 56 only after every gate passes, then commit and open the required attended governance PR without `auto-merge`.

## Remediation Availability

Upstream remediation merged as `432ffc7d0bed112426920eb9858b296a440b11b3` (`fix(aegis): prevent managed update regressions (#257)`). Task 56 resumed against this exact stable target; the prior `3d051ba` evidence remains historical and must not be overwritten.
