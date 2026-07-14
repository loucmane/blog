# Magazine Web Application

`packages/web` is the single deployable Next.js application for the owner-operated magazine foundation.

## Current Foundation

- Next.js `16.2.10` and React `19.2.7`
- Tailwind CSS `4.3.2` with CSS-first configuration
- app-local, project-owned component source
- Base UI `1.6.0` for deliberately adopted accessible primitives
- `next-themes` for system, light, and dark color preferences
- Vitest, Testing Library, Playwright, and axe verification

The application does not consume a standalone UI package. Styling tokens, theme behavior, and owned components live with their only current consumer. New package boundaries require a proven second consumer and an architecture decision.

## Source Shape

```text
packages/web/
├── public/                    # application-owned static assets
├── src/
│   ├── app/                   # App Router pages and route handlers
│   ├── components/            # app-local owned components
│   ├── domain/                # framework-independent domain contracts
│   ├── lib/                   # server/client helpers and security boundaries
│   └── utils/                 # focused utilities
├── tests/
│   ├── design-system/         # styling and workspace contracts
│   └── framework/             # Next.js boundary contracts
├── components.json            # shadcn-owned source configuration
├── next.config.ts
└── postcss.config.mjs
```

## Commands

Run commands from the repository root with Node `24.18.0` and pnpm `11.11.0`:

```bash
pnpm --filter web dev
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter web test
pnpm --filter web build
```

The protected root verification commands remain authoritative for delivery.

## Design-System Policy

- Keep semantic tokens in `src/app/globals.css`.
- Keep reusable class composition in `src/lib/utils.ts`.
- Add an owned primitive only when a reader or owner journey needs it.
- Review upstream shadcn/Base UI source rather than regenerating customized components blindly.
- Require focused behavior, accessibility, dark-mode, and responsive evidence for every interactive primitive.

Task 42 owns the approved content and persistence foundation. This package must not revive the removed Express placeholder or speculative shared package.
