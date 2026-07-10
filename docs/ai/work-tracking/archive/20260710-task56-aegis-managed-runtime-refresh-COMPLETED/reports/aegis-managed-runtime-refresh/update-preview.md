# Aegis Managed-Runtime Update Preview

- Preview command: `./.aegis/bin/aegis update --target-dir .`
- Active upstream source: `3d051ba9937d5e88178e86067e2be4c898897263`
- Manifest runtime source before apply: `43e9a660c0b58f95c2f97031e16830443b40aa2e`
- Enforcement: advisory

## Safety Result

- Conflicts: 0
- Unsafe paths: 0
- Manual-review paths: 0
- Non-managed paths: 0
- Creates: 0
- Modifies: 6
- Skips: 33
- Product-file safety: safe

## Proposed Modifications

- `AGENTS.md` — refresh only the Aegis-managed marker block while preserving project-authored content outside it.
- `.aegis/contract.md` — refresh the managed workflow contract.
- `.claude/scripts/ledger_lib.py` — refresh the stale managed Claude ledger helper.
- `scripts/_aegis_installer.py` — refresh the stale managed installer helper.
- `scripts/codex-guard` — refresh the managed Codex guard.
- `.aegis/foundation-manifest.json` — refresh managed hashes, verification metadata, and runtime source metadata.

The runtime sub-plan also updates `.aegis/runtime.env` metadata and the manifest runtime pointer. The runtime path already points to `/home/loucmane/codex`; no reinstall is required.

## Upstream Worktree Check

Upstream HEAD is exactly `3d051ba9937d5e88178e86067e2be4c898897263`. Its dirty paths are `.codex/deep-work.config.toml` and untracked local Aegis/Codex state directories; none overlap the six managed assets proposed for refresh.

## Dogfood Finding

Top-level `aegis status` reported `current` despite manifest/source commit skew and managed-asset drift. For freshness decisions, use `aegis runtime status` together with a zero-conflict, zero-unsafe-path, zero-manual-review update preview.
