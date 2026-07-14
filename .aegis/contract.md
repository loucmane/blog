# Aegis Foundation Contract

Aegis Foundation is the shared portable runtime for this repository.

## Agent Setup

- Primary agent: `multi`
- Enabled adapters: `claude, codex`

## Access Policy

- `.aegis/` is readable shared foundation state.
- Direct writes to `.aegis/` are not allowed.
- Mutating foundation operations go through `aegis ...`, the project-local `./.aegis/bin/aegis ...` CLI shim, or `aegis.*` MCP tools.
- Taskmaster and Serena are optional integrations. Aegis-native state is sufficient for READY when they are absent.

## Control Plane vs Implementation Tools

- Use Aegis MCP tools, or the project-local Aegis CLI, for Aegis workflow state: init, inspect, plan-install, install, status, next, start, kickoff, log, verify, closeout dry-runs, closeout, and future reconciliation.
- Use native agent tools for normal project implementation: reading files, editing source files, running project tests, and inspecting git status or diffs.
- The installed Aegis runtime, not the MCP session, is responsible for enforcement.
- Installed hooks govern persistent mutations regardless of whether the attempted mutation comes from MCP, Bash, Edit, Write, or another supported tool surface.
- MCP is the bootstrap and control-plane interface. It is not a replacement for the agent's editor, shell, test runner, or normal implementation workflow.
- Claude Code loads `.claude/settings.json` hooks at session start. If Aegis just created or changed Claude settings/hooks, restart Claude before source edits so enforcement is active.

## Verification

- Required gates must pass `aegis verify --strict` before work is declared complete.
- `aegis closeout` is the final completion gate. Do not report task completion until it writes a passing closeout report.
- Missing, non-executable, unconfigured, or failing required gates make verification fail.
- Policy-only gates are documented limitations, not proof of enforcement.

## Work Kickoff

- Start local work with `aegis start "<task title>"` or `./.aegis/bin/aegis start ...` only when no external task id exists.
- If `.taskmaster/tasks/tasks.json` contains available numeric work, run `task-master next` and `task-master show <id>` first, then use explicit `aegis kickoff --task <id> --slug <slug> --title "<title>"`.
- Taskmaster done only after Aegis closeout and doctor pass. Do not run `task-master set-status --status=done` before `aegis closeout` and read-only `aegis doctor` are both healthy.
- After Taskmaster status changes, refresh generated task files. Prefer the project's targeted helper when present (for example `python3 scripts/codex-task taskmaster generate-one --id <id>`); otherwise run `task-master generate` deliberately and report that broad generated-file refresh was used.
- Use explicit `aegis kickoff --task <id> --slug <slug> --title "<title>"` when an external task id already exists.
- Kickoff creates Aegis-native current work state, session, plan, and work-tracking files.
- `.aegis/state/current-work.json` is the portable authority for READY.
- Taskmaster is validated only when no Aegis current-work state exists or when current work explicitly marks Taskmaster required.
- Normal feature work is: confirm readiness and `aegis next`; if no current work exists, use Taskmaster next/show plus `aegis kickoff` when Taskmaster provides a numeric task, otherwise infer a short title from the user's request and run `aegis start "<task title>"`; mark scope complete with `aegis log --plan-step auto`; make the task-scoped code change with native tools; let PostToolUse create pending tracking; run `aegis log --pending-id current --plan-step auto` for the changed source file; run task-specific verification and log it with `--plan-step auto`; run `aegis verify --strict`; log the strict verification report with `--pending-id current --plan-step auto`; run `aegis closeout --dry-run --update-handoff` for preflight; if handoff semantic gates fail, run `aegis handoff repair`; run `aegis closeout --update-handoff`; run read-only `aegis doctor`; only then mark Taskmaster done if Taskmaster is in use.
- After every meaningful mutation, run `aegis log --pending-id <id> --note "<past-tense note>"` to write S:W:H:E entries to the active session, tracker, and event-aware canonical surfaces.
- `aegis log` updates plan state only when `--plan-step` is supplied. This prevents generic evidence logs from accidentally changing an unrelated plan step.
- The next persistent mutation is blocked until pending S:W:H:E tracking is logged; this is what makes the workflow mechanical rather than advisory.
- Omit `--surface` for event-aware defaults. Scope logs update findings, decisions, and handoff; implementation and verification logs update implementation, changelog, and handoff. Use `--surface` only for targeted repairs.
- `aegis closeout --dry-run --update-handoff` checks closeout gates without writing reports, handoff updates, or current-work state.
- `aegis closeout --update-handoff` may refresh Aegis-owned semantic handoff sections before validation. It preserves the Progress Log.

## Continuation Contract

How to interpret a short continuation intent (continue / go / proceed / next / resume). This grants no authority to bypass any gate.

A short continuation intent — "continue", "go", "proceed", "next", "keep going", "resume" — is NOT a new authority. It means: advance the current Aegis workflow by exactly ONE safe step, then re-consult.

Resolve the intent from live runtime state, never from memory or chat history:
- Run `aegis next` (or the `aegis.next` MCP tool) and perform its `next_safe_action` — the single sanctioned step. Run `aegis doctor` when `aegis next` reports a repair or blocked state.
- If readiness is BLOCKED, "continue" means fix workflow state, not mutate.
- When `.taskmaster/tasks/tasks.json` has available work, Taskmaster is the task-selection authority; do not start Aegis-local work to bypass it.
- Perform the brief's one `next_safe_action`, then re-run `aegis next`. Do not chain implement -> log -> verify -> closeout across a single intent.

A bare continuation MAY, without re-asking: read; run read-only inspection and project tests; edit task-scoped source files; `aegis log`; `aegis verify`; `aegis closeout --dry-run`; `aegis doctor`; advance one plan step.

SURFACE before mutation: safe repair plans, closeout preflight, task transitions, delivery scope, and CI remediation. A valid active evidence-gated policy may authorize routine Taskmaster transitions, deterministic safe repairs, verified closeout, commit/push/PR, and CI remediation without another chat approval. Absent, invalid, revoked, attended, disabled-capability, manual-review, or protected/owned-path cases require explicit confirmation. Merge authority comes only from trusted GitHub policy after closeout passes.

NEVER automatic on any intent: force-push, `reset --hard`, `branch -D`, history rewrite, direct `.aegis/` writes, bypassing BLOCKED readiness, skipping S:W:H:E tracking, or delivery outside the active repository policy. A valid active evidence-gated policy may authorize an eligible exact-head merge through trusted CI; absent, invalid, revoked, or attended policy requires owner approval.

Completion-flavored intents ("finish this", "wrap up", "done") advance one safe step like any continuation. They do NOT authorize skipping closeout or the active delivery policy.
