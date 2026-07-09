<!-- AEGIS:BEGIN agents-runtime -->
# Agents

This project is managed by Aegis Foundation.

- Primary agent: `multi`
- Enabled adapters: `codex, claude`
- Shared contract: `.aegis/contract.md`
- Agents may read `.aegis/` directly.
- Agents must not write `.aegis/` directly; use Aegis MCP tools or the project-local Aegis CLI.
- Aegis MCP/CLI is the workflow control plane. Use native agent tools for normal source edits, test runs, and git inspection.

## Continuation

Continuation contract: a short intent (continue / go / proceed / next / resume) advances the Aegis workflow by exactly ONE safe step — resolved from `aegis next` (its `next_safe_action`), never from memory — then re-consult. It is not new authority. Surface and ask before repairs (`aegis repair --apply`), non-dry-run `closeout`, protected/owned paths, switching tasks, or push/PR. Never automatic: merge, force-push, history rewrite, `.aegis/` writes, BLOCKED-readiness bypass, skipping S:W:H:E. "Finish this" still stops at these boundaries. Full text in `.aegis/contract.md`.
<!-- AEGIS:END agents-runtime -->

---

## Active Operator Authority

Before requesting approval for workflow, Git, Taskmaster, Aegis, PR, or merge
actions, read `docs/ai/AEGIS_AUTONOMY_GRANT.md`.

When grant `sota-magazine-2026-autonomy-v1` is active, in scope, unexpired, and
all stated preconditions pass, its allowed actions are already explicitly
authorized by the project owner. Proceed without asking again and record the
grant ID as authority.

The grant does not authorize actions listed under its mandatory confirmation
boundaries. The agent must not edit, broaden, renew, or remove the grant without
a new explicit owner instruction.

---

## Existing Agent Instructions

# Agents

This project is managed by Aegis Foundation.

- Primary agent: `claude`
- Enabled adapters: `claude`
- Shared contract: `.aegis/contract.md`
- Agents may read `.aegis/` directly.
- Agents must not write `.aegis/` directly; use Aegis MCP tools or the project-local Aegis CLI.
- Aegis MCP/CLI is the workflow control plane. Use native agent tools for normal source edits, test runs, and git inspection.

## Continuation

Continuation contract: a short intent (continue / go / proceed / next / resume) advances the Aegis workflow by exactly ONE safe step — resolved from `aegis next` (its `next_safe_action`), never from memory — then re-consult. It is not new authority. Surface and ask before repairs (`aegis repair --apply`), non-dry-run `closeout`, protected/owned paths, switching tasks, or push/PR. Never automatic: merge, force-push, history rewrite, `.aegis/` writes, BLOCKED-readiness bypass, skipping S:W:H:E. "Finish this" still stops at these boundaries. Full text in `.aegis/contract.md`.
