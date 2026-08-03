---
name: gas-city-coordinator
description: Coordinate this repository's Beads-authoritative work through the native Blog Gas City rig. Use for reconciling work state, selecting or creating beads, proposing dispatch, delegating managed workers, monitoring execution and worklogs, routing review, and accepting evidence-backed delivery; do not use legacy Taskmaster or Aegis workflow state as active authority.
---

# Gas City Coordinator

Coordinate project intent locally and delegate bounded execution to the native
Gas City runtime. Beads is the sole active task authority. `.taskmaster/` and
the legacy Aegis workflow are frozen historical inputs and must not be updated
or repaired.

## Native Context

Consult `gc-city`, `gc-rigs`, `gc-agents`, `gc-work`, and `gc-dispatch` before
using their respective lifecycle, rig, worker, bead, or dispatch operations.

The registered rig is `blog`. Use only the native client and isolated city home:

```text
GC_HOME=/home/loucmane/gascity/home
/home/loucmane/gascity/bin/gc
```

Never trust inherited `BEADS_*` variables. Clear relevant inherited Beads
routing variables before native calls, keep `GC_HOME` explicit, and include
`--rig blog` for every Beads operation. Never use a cross-rig bare `bd` command.
Do not infer the rig from the current directory, a bead prefix, or inherited
environment state when an explicit rig route is available.

## Authority Boundary

The project-local agent owns project intent, sequencing, task selection, scope,
and acceptance. Gas City is the delegated execution layer; workers do not
redefine intent or acceptance criteria.

Merge requires operator confirmation. Publishing requires operator
confirmation. Destructive cleanup requires operator confirmation. Credential
actions require operator confirmation. Authority changes require operator
confirmation. A dispatch proposal, worker result, review verdict, or green test
does not broaden any of those boundaries.

## Lifecycle

1. **Reconcile read-only.** Reconcile repository, Beads, worktrees, and pull
   request state read-only. Identify dirty paths, active branches, existing
   beads, worker sessions, worktrees, and open PRs without repairing or
   normalizing them.
2. **Choose work.** Select or create a rig-scoped bead using the absolute native
   client, isolated `GC_HOME`, and explicit `--rig blog`. Confirm the bead lives
   in the Blog rig and that its scope and acceptance criteria match project
   intent.
3. **Preview delegation.** Propose the dispatch before its first execution.
   Name the bead, managed role, formula, branch/worktree behavior, acceptance
   checks, worklog location, and retained operator boundaries. Do not dispatch
   until the proposal has the authority required by the active operator policy.
4. **Activate workers.** Resume the Blog rig and verify real worker processes,
   not merely configured sessions. Reconcile `gc rig status blog`, session
   state, and host process evidence before treating a worker as available. Use
   `GC_HOME=/home/loucmane/gascity/home /home/loucmane/gascity/bin/gc rig
   resume blog` when resumption is authorized.
5. **Delegate deliberately.** Delegate to an appropriate managed role or
   formula. Prefer a builder for implementation, a reviewer for independent
   review, and a sweeper only for low-risk currency, formatting, or triage.
   Route the existing Blog-rig bead; never create a cross-rig surrogate.
6. **Monitor evidence.** Monitor the bead, session, branch, tests, and worklog.
   Every work bead receives a worklog at the configured Gas City worklog path.
   Require decisions before implementation and durable evidence references for
   mutations, tests, reviews, and handoff.
7. **Review implementation.** Route implementation through review. Keep the
   implementation worker and review evidence distinguishable, return actionable
   findings to the active worker, and re-run acceptance checks on the exact
   reviewed head.
8. **Accept or continue.** Close only with acceptance evidence. Confirm scope,
   test results, review disposition, branch and PR state, and worklog handoff.
   Leave the bead open when evidence is missing, ambiguous, or outside the
   project-local acceptance criteria.

## Routing Pattern

Use an explicit environment and route for every rig-scoped Beads operation:

```bash
env -u BEADS_DIR -u BEADS_DB -u BEADS_DOLT_SERVER_PORT \
  GC_HOME=/home/loucmane/gascity/home \
  /home/loucmane/gascity/bin/gc bd list --rig blog
```

Apply the same isolation to `gc bd create`, `gc bd show`, `gc bd update`, and
`gc bd close`. Use native `gc rig`, `gc session`, and `gc sling` operations for
execution control, with an explicit Blog target or Blog bead identity. Do not
dispatch project work during coordinator bootstrap.
