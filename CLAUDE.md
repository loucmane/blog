# Claude Runtime Entry

This project uses Aegis Foundation with Claude as an adapter.

Before persistent mutation, Claude must be in a READY state:

```bash
bash .claude/scripts/readiness.sh --quick
```

If this project is not initialized yet, run:

```bash
aegis init
```

If this `aegis init` created or changed `.claude/settings.json` or `.claude/scripts/*`, stop before source edits and restart Claude Code in this project. Claude loads hooks at session start; after restart, run `aegis next` and continue.

If readiness is BLOCKED because no current work exists and `.taskmaster/` is present, use Taskmaster as the task authority first:

```bash
task-master next
task-master show <id>
aegis kickoff --task <id> --slug <slug> --title "<title>"
```

Taskmaster done only after Aegis closeout and doctor pass.
After marking Taskmaster done, refresh generated task files with the project helper when present; otherwise run `task-master generate` deliberately and mention that broad refresh in the final report.

If no Taskmaster numeric task is available, infer a short task title from the user's request and start tracked local work with:

```bash
aegis start "<task title>"
```

If `aegis` is not on PATH, use the installed project-local shim: `./.aegis/bin/aegis ...`.

Project hooks route mutation tools through `.claude/scripts/pretooluse-gate.sh`.

Tool routing:

- Use Aegis MCP tools for Aegis workflow state when they are available: inspect, status, next, plan_install, install, start, kickoff for explicit external numeric task ids, log, verify, closeout_ready, closeout, and future reconciliation.
- If Taskmaster is installed and has available work, run `task-master next` and `task-master show <id>` or the Taskmaster MCP equivalent before `aegis kickoff`.
- Use `aegis init` for first-time project setup and `aegis start "<task title>"` for local task kickoff only when no external task id exists.
- Use `aegis ...` or `./.aegis/bin/aegis ...` for the same workflow operations when MCP is unavailable.
- Use native Claude tools for normal implementation work: reading files, editing source, running tests, and inspecting git status or diffs.
- Do not use MCP as a replacement for normal source editing. The installed hooks enforce the workflow around native tool use.
- If `aegis.init` or `aegis.install` reports `client_reload.required=true`, restart Claude before any source edits; then run `aegis next` after the reload.

Normal feature-work loop:

1. Confirm readiness. If Aegis is missing, run `aegis init`. If no current work exists, run `aegis next` or `./.aegis/bin/aegis next`; use Taskmaster next/show plus `aegis kickoff` when Taskmaster provides a numeric task, otherwise infer a task title and run `aegis start "<task title>"`.
2. Record scope with `aegis log --handler claude:scope --evidence <scope-doc-or-file> --note "Confirmed task scope" --plan-step auto --plan-status completed`.
3. Make the task-scoped source change requested by the user with native Edit/Write tools.
4. After the hook records pending tracking, run `aegis log --pending-id current --note "<past-tense note>" --plan-step auto --plan-status completed`.
5. Run task-specific verification and log it with `--plan-step auto --plan-status completed`.
6. Run `aegis verify --strict` or `./.aegis/bin/aegis verify --strict`, then log the strict verification pending event with `aegis log --pending-id current --note "Recorded strict verification evidence" --plan-step auto --plan-status completed`.
7. Run `aegis closeout --dry-run --update-handoff` or call MCP `aegis.closeout_ready` before final closeout.
8. If handoff semantic gates fail, run `aegis handoff repair` or call MCP `aegis.handoff_repair apply=true`, then re-run closeout readiness.
9. Run `aegis closeout --update-handoff` or `./.aegis/bin/aegis closeout --update-handoff`; do not report the task complete until closeout passes.
10. Run read-only `aegis doctor --target-dir .` or call MCP `aegis.doctor` once after closeout; include the health result in the final report.
11. If Taskmaster is in use, run `task-master set-status --id=<id> --status=done` only after closeout and doctor pass. Then refresh generated task files with `python3 scripts/codex-task taskmaster generate-one --id <id>` when that project helper exists; otherwise run `task-master generate` deliberately and report the broad refresh.

After any mutation, use `aegis log --pending-id <id> --note "<past-tense note>" --plan-step auto` before attempting the next mutation. Use explicit `--handler`, `--evidence`, and explicit plan step only when no pending event exists or auto inference reports ambiguity.
Read `.aegis/contract.md` for the shared contract and access policy.

## Continuation

Continuation contract: a short intent (continue / go / proceed / next / resume) advances the Aegis workflow by exactly ONE safe step — resolved from `aegis next` (its `next_safe_action`), never from memory — then re-consult. It is not new authority. Surface and ask before repairs (`aegis repair --apply`), non-dry-run `closeout`, protected/owned paths, switching tasks, or push/PR. Never automatic: merge, force-push, history rewrite, `.aegis/` writes, BLOCKED-readiness bypass, skipping S:W:H:E. "Finish this" still stops at these boundaries. Full text in `.aegis/contract.md`.
