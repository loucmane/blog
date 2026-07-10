# Aegis Managed-Runtime Retry Preview at 432ffc7

- Preview command: `./.aegis/bin/aegis update --target-dir .`
- Stable active upstream source: `432ffc7d0bed112426920eb9858b296a440b11b3`
- Manifest runtime source before retry: `43e9a660c0b58f95c2f97031e16830443b40aa2e`
- Enforcement: advisory

## Safety Result

- Conflicts: 0
- Unsafe paths: 0
- Non-managed paths: 0
- Manual-review paths: 0
- Creates: 0
- Modifies: 5
- Skips: 34
- Product-file safety: safe
- Product, package, lockfile, and unrelated workflow paths: none

## Proposed Managed Modifications

- `AGENTS.md` — refresh only the managed marker block; project-authored operator authority remains outside it.
- `.aegis/contract.md` — refresh the managed workflow contract.
- `.claude/scripts/ledger_lib.py` — refresh the stale managed ledger helper.
- `scripts/_aegis_installer.py` — refresh the installer with upstream managed-divergence protection from PR #257.
- `.aegis/foundation-manifest.json` — refresh managed and runtime source metadata.

All remaining thirty-four managed operations are skips.

## Managed-Divergence Resolution

`scripts/codex-guard`, the governance asset that caused the prior semantic regression, is now classified as `skip` because the reviewed blog guard and the stable upstream asset are byte-identical at SHA-256 `f0357f210cbd9db4f2dcdabe688465d176e8f9e84e9c8b447659aba460c362d4`. The updater therefore does not replace that locally reviewed behavior. This is the required safe resolution of managed-asset divergence.

The upstream checkout’s dirty paths remain unrelated local configuration/state and do not overlap any proposed managed modification.

## Apply Decision

Every deterministic prerequisite is satisfied. Applying this exact preview is authorized; any changed path outside the five managed modifications is a stop condition.
