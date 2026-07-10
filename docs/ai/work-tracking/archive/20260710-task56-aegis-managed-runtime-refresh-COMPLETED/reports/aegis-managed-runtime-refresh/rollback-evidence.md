# Task 56 Git-First Rollback Evidence

- Owner approval: exact six-path rollback only
- Rollback source: synchronized-main `HEAD` at `8908246b797ac89f5c337990197c0f0b27aeffce`
- Rollback command:

```text
git restore --source=HEAD -- AGENTS.md .aegis/contract.md .aegis/foundation-manifest.json .claude/scripts/ledger_lib.py scripts/_aegis_installer.py scripts/codex-guard
```

## Restored Paths

- `AGENTS.md`
- `.aegis/contract.md`
- `.aegis/foundation-manifest.json`
- `.claude/scripts/ledger_lib.py`
- `scripts/_aegis_installer.py`
- `scripts/codex-guard`

No other path was restored, reset, deleted, or discarded. Task 56 Taskmaster, plan, session, tracking, handoff, findings, decisions, implementation, changelog, preview, apply, failure, and parity evidence remain present. Aegis reports were not cleared.

## Post-Rollback Result

- All six rollback paths match `HEAD`.
- All five completed-state regression tests pass.
- The complete `pnpm ci:guard` legacy baseline passes with its expected sixteen tracked template-drift findings and no baseline errors.
- Raw `scripts/codex-guard validate` and `git diff --check` pass.
- Task 56 remains blocked pending a stable upstream correction.
- The managed update was not retried and will not be committed as a successful refresh.
