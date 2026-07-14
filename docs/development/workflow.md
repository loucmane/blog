# Development Workflow

## Runtime

Use the repository contract rather than a global default:

- Node `24.18.0`
- pnpm `11.11.0`
- Corepack `0.35.0` for the committed local activation path

`config/runtime.json`, `.nvmrc`, `package.json`, `pnpm-workspace.yaml`, and protected CI are deterministic projections of that contract.

## Research Before Changes

For version or architecture decisions:

1. inspect the current repository and dependency graph;
2. query official documentation, release notes, support policies, registries, compatibility matrices, and security advisories;
3. select stable, supported, compatible, measurable, and reversible versions;
4. record exact versions and rejected alternatives in an ADR;
5. keep unrelated upgrades in separate tasks and PRs.

No tool or model-memory source is automatically authoritative.

## Common Commands

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:coverage
pnpm test:capability
pnpm build
pnpm test:smoke:web
pnpm test:browser
pnpm security:audit
```

Use `python3 scripts/codex-task taskmaster health` and `task-master validate-dependencies` for Taskmaster graph verification. Use Aegis only for sanctioned workflow state, verification, witness, and closeout operations.

## Workspace Boundaries

The current workspace has two importers: the root toolchain and `packages/web`. Design-system source is app-local. Add another package only after proving an independent deployable unit or a real second consumer.

## Git Delivery

- Work on the active `feat/task-*` branch, never directly on `main`.
- Inspect status, diff, generated files, and secrets before staging.
- Stage an explicit task allowlist; do not use broad `git add .` in a dirty multi-surface worktree.
- Push normally without force or history rewriting.
- Require protected CI and the repository's attended/autonomous-delivery policy before merge.
