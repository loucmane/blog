# Persistent Git Worktree Policy

## Purpose

Active repository work must survive terminal exits, agent restarts, host crashes,
and routine `/tmp` cleanup without contaminating another task's checkout.

## Canonical Location

- Persistent worktree root: `/home/loucmane/dev/blog-worktrees/`
- Task worktree name: `task-<ID>-<slug>`
- Example: `/home/loucmane/dev/blog-worktrees/task-43-design-lab`

`/tmp` is reserved for disposable verification clones, clean-room checks, and
experiments that can be recreated without losing project work. Do not leave
unique uncommitted implementation or evidence in `/tmp`.

## Session Start

Before creating, switching, or resuming task work:

1. Run `git worktree list --porcelain` from the Blog repository.
2. Identify the worktree that owns the intended branch.
3. Inspect that worktree with `git status --short --branch`.
4. Continue in the existing owning worktree rather than creating a duplicate.
5. Record the absolute worktree path in the active task plan and handoff.

Never reset, restore, stash, copy, or delete an existing dirty worktree merely
to make another checkout available.

## Creating Active Worktrees

Create active task worktrees as persistent siblings of the primary checkout:

```bash
mkdir -p /home/loucmane/dev/blog-worktrees
git worktree add \
  /home/loucmane/dev/blog-worktrees/task-<ID>-<slug> \
  <task-branch>
```

Use the repository's sanctioned Taskmaster and Aegis kickoff workflow before
implementation. The worktree location does not replace task or branch
authority.

## Moving Existing Work

Move an existing worktree with Git so its branch association and dirty state
remain intact:

```bash
git worktree move \
  /tmp/<existing-worktree> \
  /home/loucmane/dev/blog-worktrees/task-<ID>-<slug>
```

Do not manually copy a dirty worktree. Verify the branch and complete status
before and after the move.

## Durability

- Make coherent local checkpoint commits when a task reaches a safe boundary.
- Push only after the task's delivery preconditions pass.
- Treat uncommitted work as recoverable only while its persistent worktree and
  host storage remain healthy; Git commits and remote branches are stronger
  recovery layers.
- Keep generated or disposable verification work outside active task
  worktrees.

## Cleanup

Remove a task worktree only after its pull request is terminal, the intended
commit is present on synchronized `main`, and its working tree is clean.

Use `git worktree remove <path>` from the primary repository. Do not use broad
filesystem deletion, automatic pruning, or cleanup commands against unknown or
dirty worktrees.

## Multi-Agent Continuity

Codex and Claude must read this policy through their root entrypoint reference.
Task plans and handoffs must state the owning worktree path. After compaction,
resume, or subagent return, re-run the session-start checks before mutation.
