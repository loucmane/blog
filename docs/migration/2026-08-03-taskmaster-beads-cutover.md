# Taskmaster to Beads authority cutover

Date: 2026-08-03

## Decision

Beads is the sole task authority for the blog project from this cutover
forward. The complete authoritative Taskmaster `master` tag was imported once;
Taskmaster is now frozen evidence and must never be edited, regenerated, or
re-imported.

The `legacy-2025` tag is historical and non-authoritative. It was not imported
into Beads: its metadata does not satisfy the reviewed converter contract, and
inventing metadata is forbidden. It remains byte-exact in the frozen
Taskmaster source. A separate, one-way Obsidian archive is an operator-owned
view with no write-back path.

## Frozen source identity

- Authoritative worktree head: `7d34cf241d233e81d682138de7a2929d46b36d5a`
- Authoritative tag: `master`
- Authoritative records: 43 (39 top-level tasks and 4 subtasks)
- Frozen `tasks.json` SHA-256:
  `18f7893da5d0dbb23900dfd07d7e76990354a740ef3e62f5a2d1b1f0f5a97833`
- Frozen-snapshot receipt SHA-256:
  `86f5845855d788771ff5a72e13091f82dd6c6ac6f8af2a521c12bff89550f05a`

The root checkout's older 39-record copy is also frozen and
non-authoritative. Its SHA-256 is
`fbf3494997810831e91c293f28ec62d301debcdf72da32d247f6956c16701a72`.
If PR #40 later merges through normal Git work, the repository copy may
converge with the authoritative snapshot. That does not authorize another
migration.

The legacy `scripts/codex-task taskmaster health` helper still expects the
retired `aegis_foundation` package. It is intentionally frozen unrepaired with
the old workflow; it is not a native-city health check.

## Tag-boundary audit

The read-only audit found zero cross-tag dependency references in both
directions:

- `master` -> `legacy-2025`: 0; all 80 dependency endpoints resolve within
  `master`.
- `legacy-2025` -> `master`: 0; all 41 dependency endpoints resolve within
  `legacy-2025`.

Taskmaster dependency identifiers were tag-local; no qualified cross-tag
encoding was present. The audit and archive-content scan receipt SHA-256 is
`aa384b81e5daa87fa1af63c826f50baf1a9d42872d9c5ffb64a1721d78eb82c0`.
The credential, Tier-B transcript, raw-provider-output, email-address, and
host-user-path scan returned zero hits across all `legacy-2025` scalar text.

## Native migration proof

The reviewed bridge was run from template head
`0416e5bd848813b5da01ed55e18e6cf9ffa2802e`, converter version `1.3.0`,
against native rig `blog` with prefix `blog`.

The current native interface requires a rig registration before `gc bd` can
address its store. The rig was therefore registered suspended as an empty
pre-authority target. No bead or worker existed before the empty-target proof;
authority changed only after the complete two-pass reconciliation below.

- Empty export: 0 records.
- Dry run: 43 accepted, 43 would be created, target remained empty.
- First import: 43 created.
- Exact reconciliation: 43 identities and provenance rows, 80 blocker edges,
  4 hierarchy edges, 26 closed, 3 in progress, and 14 open.
- Identical second import: 0 created, 43 skipped.
- First and final exports: byte-identical, SHA-256
  `bebf36ed339d50a2ee97e0181c7702ef22809076cd921f934cf323ebdbaba354`.
- Conversion artifact-set SHA-256:
  `8c77ed14d0838732fa927f0f84141fb391f515b0d455b6fcad1fbe5ee71d3f9a`.
- Migration receipt SHA-256:
  `fa15dd85401442fd4ec95d588a2d3ae3e50043826d8eca0c00dd2523436f2046`.

The first registration attempt refused before creating a rig or `.beads`
store because its bounded shell omitted the isolated Dolt path. Its preserved
diagnostic receipt SHA-256 is
`b1910acb6eea99b86fbc293f2af00efed4526a564957fd5c950b615fe11c2ffa`;
the successful retry used the explicit native toolchain path.

## Continuation

Taskmaster Task 43 and subtask 43.1 are now Beads `blog-0043` and
`blog-0043.1`, both `in_progress`, with external references
`taskmaster:master:43` and `taskmaster:master:43.1`. All continuation and
disposition work happens through Beads. Closed and cancelled work remains as
provenance; no migrated record is deleted to tidy history.
