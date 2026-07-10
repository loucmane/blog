# Aegis Managed-Runtime Retry Apply at 432ffc7

- Apply command: `./.aegis/bin/aegis update --target-dir . --apply`
- Apply status: passed
- Applied at: `2026-07-10T15:13:58Z`
- Stable source: `432ffc7d0bed112426920eb9858b296a440b11b3`
- Enforcement after apply: advisory

## Applied Managed Paths

- `AGENTS.md`
- `.aegis/contract.md`
- `.claude/scripts/ledger_lib.py`
- `scripts/_aegis_installer.py`
- `.aegis/foundation-manifest.json`

The apply report recorded five managed modifications, thirty-four skips, zero conflicts,
zero unsafe paths, zero non-managed paths, and zero manual-review paths. No product,
package, lockfile, or unrelated workflow path changed. The locally reviewed
`scripts/codex-guard` was skipped because it already matched stable upstream exactly.

## Preservation

- `AGENTS.md` content outside the Aegis-managed marker remains present.
- Grant `sota-magazine-2026-autonomy-v1` retains SHA-256
  `7ac3c5510c0a10d805c589c5f4832df0ee35f2e22b29b9ef7218c9903d1b0e3e`.
- Prior failed-apply, rollback, and upstream-handoff evidence remains alongside this report.
- The client-reload notice applies to Claude Code after its hook helper changed; this run is
  executing in Codex CLI and did not bypass any Codex guard.
