# Workspace Structure

## Current Shape

```text
blog/
├── packages/
│   └── web/                 # Next.js reader and owner application
│       ├── src/app/         # Routes, layouts, handlers, and global styling
│       ├── src/components/  # App-local owned components
│       ├── src/lib/         # Application and domain helpers
│       └── tests/           # Package contracts
├── tests/                   # Cross-application browser and CI contracts
├── docs/                    # Canonical product, architecture, and delivery evidence
├── package.json             # Root commands and shared development tooling
├── pnpm-workspace.yaml      # Explicit `packages/web` workspace boundary
└── pnpm-lock.yaml           # Reproducible dependency graph
```

## Boundary Rules

- `packages/web` owns the public magazine, protected owner workspace, route handlers, design system, and future app-owned domain modules.
- Shared root tooling exists only when it governs the whole repository.
- Do not create a package for organizational aesthetics. Require a second consumer, independent deployment, materially different runtime, or a separately versioned contract.
- Keep reader-only code free from editor runtimes; lazy owner-workspace boundaries must remain explicit when Task 43 begins.
- Persistence and background-job boundaries belong to Task 42 and its accepted ADRs, not to a placeholder Express service.

## Removed Prototype Boundaries

Task 41 removed:

- `packages/ui`, which duplicated React, TypeScript, Tailwind, PostCSS, and Rollup for one consumer;
- `packages/backend`, an unused Express animal-foundation placeholder;
- `packages/shared`, an incomplete non-package with no live consumer;
- stale aliases, tests, docs, and demo routes that existed only to prove those boundaries.

Useful theme behavior moved into the application before removal. The full audit is in [design-system-component-inventory.md](./design-system-component-inventory.md).
