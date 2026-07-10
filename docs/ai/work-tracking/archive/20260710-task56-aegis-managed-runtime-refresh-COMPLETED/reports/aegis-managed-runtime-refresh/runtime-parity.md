# Aegis Managed-Runtime Parity

- Apply command: `./.aegis/bin/aegis update --target-dir . --apply`
- Apply status: passed
- Applied at: `2026-07-10T13:07:15Z`
- Enforcement after apply: advisory

## Runtime Commit Parity

- Active source commit: `3d051ba9937d5e88178e86067e2be4c898897263`
- Manifest runtime source commit: `3d051ba9937d5e88178e86067e2be4c898897263`
- Runtime source root: `/home/loucmane/codex`
- Reinstall required: no

## Managed-Asset Hash Parity

| Managed asset | Installed SHA-256 | Upstream SHA-256 | Result |
| --- | --- | --- | --- |
| `.claude/scripts/ledger_lib.py` | `7945eb42a39615250b6c2ac65b2f8da6bb19af195c7fc5a90344dbe263f742f4` | `7945eb42a39615250b6c2ac65b2f8da6bb19af195c7fc5a90344dbe263f742f4` | pass |
| `scripts/_aegis_installer.py` | `75ae6bdc0b49894a45c64f511bd258e8e5ba012612b77a1d350cda93a5644af6` | `75ae6bdc0b49894a45c64f511bd258e8e5ba012612b77a1d350cda93a5644af6` | pass |
| `scripts/codex-guard` | `300c042e4a67fac30c58f6e75ff329316ab567656a8ccc74d73095b2830343b4` | `300c042e4a67fac30c58f6e75ff329316ab567656a8ccc74d73095b2830343b4` | pass |

`cmp` passed for all three directly installed source assets. A second full update preview reported zero managed modifications, zero creates, zero conflicts, zero unsafe paths, zero non-managed paths, zero manual reviews, and thirty-nine skips, proving parity for generated managed assets as well.

## Entrypoint Preservation

The only `AGENTS.md` change inside the managed marker is deterministic adapter ordering from `codex, claude` to `claude, codex`. The `Active Operator Authority` section and all content outside the Aegis-managed block remain intact. Grant digest `7ac3c5510c0a10d805c589c5f4832df0ee35f2e22b29b9ef7218c9903d1b0e3e` is unchanged.

## Freshness Rule

Top-level `aegis status` alone is not sufficient for managed-runtime freshness. This task treats matching `aegis runtime status` commits plus zero-change update-preview parity as authoritative.
