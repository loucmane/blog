<!-- AEGIS:BEGIN claude-runtime -->
# Claude Runtime Entry

This project uses Aegis Foundation.

At orientation, inspect enforcement mode once:
`aegis enforce status` (or `./.aegis/bin/aegis enforce status`).

## Advisory mode
- Work normally: hooks record evidence and would-block decisions passively; no per-mutation logging or pending-event reconciliation is required.
- Use `aegis brief` for current orientation and `aegis witness` before delivery.
- Do not manually drain advisory pending events or run handoff repair/closeout as routine ceremony.

## Strict mode
- `.aegis/contract.md` is authoritative for readiness, kickoff, logging, verification, and closeout.
- Use `aegis next` to resolve the single sanctioned workflow step.

## Always
- Use native agent tools for source edits, tests, and Git inspection; use Aegis CLI/MCP only for workflow state.
- When Taskmaster is configured, use `task-master next` and `task-master show <id>` for task selection.
- Never write `.aegis/` directly.
- If install/update reports a required client reload, restart that client before mutations.
- Missing hooks or unsupported clients are degraded coverage, not successful capture.

## Continuation

Continuation contract: resolve continue / go / next from live `aegis next`, perform exactly one safe step, then re-consult. Routine repair/closeout/delivery authority comes only from the active repository policy; manual review, protected-path edits, and bypass remain attended. Full text in `.aegis/contract.md`.
<!-- AEGIS:END claude-runtime -->

---

## Active Project Coordination

This section supersedes stale task-selection and continuation wording in the
managed historical block above.

- Beads is the sole active task authority. `.taskmaster/` and the legacy Aegis
  workflow are frozen historical inputs: preserve them, but they must not be
  updated or repaired.
- The project-local agent owns project intent, sequencing, task selection, and
  acceptance. Gas City is the delegated execution layer.
- Consult the native skills `gc-city`, `gc-rigs`, `gc-agents`, `gc-work`, and
  `gc-dispatch`, then use the project-local `gas-city-coordinator` skill.
- The registered rig is `blog`. Invoke the absolute native client at
  `/home/loucmane/gascity/bin/gc` with isolated
  `GC_HOME=/home/loucmane/gascity/home` and explicit `--rig blog` routing for
  Beads operations.
- Never trust inherited `BEADS_*` variables and never use a cross-rig bare `bd`
  command. Every work bead receives a worklog.
- Merge, publishing, destructive cleanup, credential actions, and authority
  changes each retain their existing operator confirmation boundary. No
  coordinator or delegated worker may broaden those boundaries.

## Persistent Worktrees

Before creating or resuming task work, read `docs/ai/WORKTREE_POLICY.md`.
Active development worktrees belong under
`/home/loucmane/dev/blog-worktrees/`; `/tmp` is only for disposable,
reproducible verification. Reuse the worktree that owns the task branch.
