# App-Local Component Registry

## Ownership

shadcn-style components are owned application source under `packages/web/src/components`. The repository does not maintain a speculative component inventory or a separately built UI package.

## Current Registered Primitive

| Component   | Foundation           | Consumer                 | Evidence                                                                                       |
| ----------- | -------------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| `ThemeMenu` | Base UI Menu `1.6.0` | public application shell | colocated unit test, design-system contract, desktop/mobile Playwright keyboard and axe checks |

`ThemeProvider` wraps `next-themes` and owns system, light, and dark preference. Reduced motion and forced colors are browser accessibility preferences, not additional product themes.

## Adding a Component

1. Prove a reader or owner journey requires the primitive.
2. Review the current shadcn registry source and underlying primitive release notes.
3. Add project-owned source app-locally; do not blindly overwrite customizations.
4. Use semantic tokens and preserve visible focus, forced-colors, reduced-motion, keyboard, touch-target, and mobile behavior.
5. Add focused positive and deny-path tests.
6. Run typecheck, lint, formatting, unit/coverage, production build/smoke, Playwright/axe, and visual review.
7. Record the component and rationale in the design-system inventory or ADR.

The removed 2025 demo inventory and `/test`/`/mockup` routes are historical scaffolding, not an installation backlog. See `docs/architecture/design-system-component-inventory.md` for the audited disposition.
