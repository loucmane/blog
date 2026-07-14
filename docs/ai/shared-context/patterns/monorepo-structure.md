# Workspace Boundary Pattern

## Current Shape

```text
blog/
├── packages/
│   └── web/          # Next.js reader and owner application
├── tests/            # repository-level CI and browser contracts
├── scripts/          # deterministic engineering/governance helpers
└── docs/             # product, architecture, decisions, and evidence
```

The root and `packages/web` are the only pnpm importers. Design tokens, themes, and owned components are app-local because only the web application consumes them.

## Extraction Rule

Create another workspace package only when at least one condition is proven:

- a separately deployable runtime or worker exists;
- a real second consumer needs a stable public API;
- isolation materially improves security, portability, or independent verification;
- an accepted ADR defines ownership, dependency direction, rollback, and tests.

Do not create backend, shared, or UI packages as placeholders for future possibility. Task 42 owns the first accepted content/persistence boundaries.

## Application Rules

- Route product behavior through `packages/web/src/app`.
- Keep framework-independent domain contracts in `packages/web/src/domain` until extraction criteria are met.
- Keep project-owned UI source in `packages/web/src/components`.
- Keep semantic tokens in `packages/web/src/app/globals.css`.
- Keep experiments out of public `/test` or `/mockup` routes; use focused tests, fixtures, or review artifacts.
- Use the `@/*` web alias; removed package aliases are not compatibility contracts.

Historical documents may mention the old four-package prototype. Current architecture docs and accepted ADRs take precedence.
