# Configuration

## Tailwind CSS 4

The web app owns one CSS-first Tailwind configuration:

- `packages/web/src/app/globals.css` imports Tailwind, animation utilities, and the typography plugin;
- semantic tokens use `@theme inline` and CSS custom properties;
- dark mode is class-driven through `next-themes`;
- reduced motion and forced colors are independent accessibility media behaviors;
- `packages/web/postcss.config.mjs` uses `@tailwindcss/postcss`;
- `packages/web/components.json` leaves `tailwind.config` empty.

There is no JavaScript/TypeScript `tailwind.config` file and no standalone UI package configuration.

## Owned Components

`packages/web/components.json` describes project-owned source. Base UI is the selected primitive foundation for new or migrated components, but registry output must be reviewed before adoption. Existing customizations are code, not disposable generated artifacts.

The representative current primitive is `packages/web/src/components/theme-menu.tsx`, with behavior tests beside the source and browser coverage in `tests/e2e/homepage.spec.ts`.

## TypeScript and Imports

The web app uses its local `@/*` alias. Removed backend, shared, and UI aliases must not be reintroduced without an accepted architecture decision and a real consumer.

## Runtime Projections

Package scripts, dependency declarations, package semantics, lockfile bytes, workspace bytes, trusted CI support files, and workflow semantics are fail-closed projections in `config/runtime.json`. Recompute only the values justified by the active task; never weaken the checker to accept drift.
