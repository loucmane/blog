# Aegis Managed-Runtime Retry Parity at 432ffc7

## Runtime Commit Parity

- Active source commit: `432ffc7d0bed112426920eb9858b296a440b11b3`
- Manifest runtime source commit: `432ffc7d0bed112426920eb9858b296a440b11b3`
- Runtime source root: `/home/loucmane/codex`
- Reinstall required: no
- Configured enforcement: advisory

## Managed-Asset Hash Parity

| Managed asset | Installed SHA-256 | Stable upstream SHA-256 | Result |
| --- | --- | --- | --- |
| `.claude/scripts/ledger_lib.py` | `7945eb42a39615250b6c2ac65b2f8da6bb19af195c7fc5a90344dbe263f742f4` | `7945eb42a39615250b6c2ac65b2f8da6bb19af195c7fc5a90344dbe263f742f4` | pass |
| `scripts/_aegis_installer.py` | `e9dc3c4b21c112547d650500971f458d025de498dcd816e6ced45aad7210fa03` | `e9dc3c4b21c112547d650500971f458d025de498dcd816e6ced45aad7210fa03` | pass |
| `scripts/codex-guard` | `f0357f210cbd9db4f2dcdabe688465d176e8f9e84e9c8b447659aba460c362d4` | `f0357f210cbd9db4f2dcdabe688465d176e8f9e84e9c8b447659aba460c362d4` | pass |

Byte-for-byte `cmp` checks passed for all three directly installed upstream assets. The
manifest checksums for `AGENTS.md` and `.aegis/contract.md` match their installed content.

## Idempotence

A second `./.aegis/bin/aegis update --target-dir .` preview reported:

- managed creates: 0
- managed modifications: 0
- managed skips: 39
- conflicts: 0
- unsafe paths: 0
- non-managed paths: 0
- manual-review paths: 0

The preview may refresh runtime-pointer timestamps in an apply operation, but it proposes
no managed asset content changes. Runtime status plus this zero-change managed preview is
the authoritative freshness proof for Task 56.
