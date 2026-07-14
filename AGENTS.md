<!-- AEGIS:BEGIN agents-runtime -->
# Agents

This project uses Aegis Foundation.
- Primary agent: `multi`
- Enabled adapters: `claude, codex`

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
<!-- AEGIS:END agents-runtime -->

---

## Active Operator Authority

Before requesting approval for workflow, Git, Taskmaster, Aegis, PR, or merge
actions, read `docs/ai/AEGIS_AUTONOMY_GRANT.md`.

When grant `sota-magazine-2026-autonomy-v2` is active, in scope, unexpired, and
all stated preconditions pass, its allowed actions are already explicitly
authorized by the project owner. Proceed without asking again and record the
grant ID as authority.

For ordinary Taskmaster-backed pull requests, merge authorization comes from
the trusted evidence policy rather than a fresh chat confirmation. When the
exact head is policy-eligible and every required deterministic check passes,
allow the protected auto-merge workflow to squash-merge it, synchronize
`main`, and continue to the next dependency-ready task. Ask only for the
exceptional categories retained by the grant.

This grant is the explicit owner authority referenced by the managed
continuation contract. Its covered actions supersede that contract's generic
ask/never-automatic defaults; the defaults still apply when the grant is
missing, invalid, expired, out of scope, or fails a deterministic precondition.

The grant does not authorize actions listed under its mandatory confirmation
boundaries. The agent must not edit, broaden, renew, or remove the grant without
a new explicit owner instruction.
