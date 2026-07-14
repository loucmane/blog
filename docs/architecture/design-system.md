# App-Local Design System

## Boundary

The magazine has one product application, `packages/web`. Its theme, tokens, utilities, and shadcn-style components live with that application as owned source. There is no separately built UI package, release artifact, or second Tailwind pipeline.

Create a package boundary only after a concrete second consumer proves that versioning, build, and release complexity is cheaper than app-local ownership.

## Stack

- Tailwind CSS `4.3.2` with the `@tailwindcss/postcss` integration and CSS-first configuration.
- `@tailwindcss/typography` `0.5.20` for controlled editorial prose surfaces.
- shadcn's copy-and-own model; `components.json` describes app-local placement and keeps the Tailwind 4 config path blank.
- Stable `@base-ui/react` `1.6.0` for selected new or migrated behavioral primitives.
- `next-themes` `0.4.6` for no-flash system, light, and dark preference handling.
- `tailwind-merge` `3.6.0`, `clsx` `2.1.1`, `tw-animate-css` `1.4.0`, and `lucide-react` `1.24.0` as the narrow styling and icon support chain.

The shadcn CLI is research and generation tooling, not a hidden runtime dependency. Generated components are reviewed and owned in this repository.

## Source Layout

```text
packages/web/
├── components.json
├── postcss.config.mjs
└── src/
    ├── app/globals.css
    ├── components/
    │   ├── theme-menu.tsx
    │   └── theme-provider.tsx
    └── lib/utils.ts
```

`globals.css` is the canonical token and theme projection. Component files use semantic utilities such as `bg-background`, `text-foreground`, and `border-border`; they do not own arbitrary palette values.

## Accessibility and Theme Policy

- The user chooses system, light, or dark mode. The system option remains the default.
- High-contrast behavior comes from operating-system forced colors, not a hand-authored pseudo-accessibility theme.
- Reduced-motion preferences collapse nonessential animation and smooth scrolling.
- Interactive primitives require keyboard, focus, screen-reader, desktop/mobile browser, and axe evidence.
- Touch targets in owner-facing and global controls target at least 44 CSS pixels.
- Product art direction may vary by editorial template, but owner-authored content cannot inject arbitrary CSS.

## Component Intake

1. Confirm a real product use case.
2. Prefer semantic HTML when no behavioral primitive is needed.
3. Compare the current shadcn Base UI and Radix sources; choose per component, not by bulk migration.
4. Copy reviewed source into `packages/web/src/components` and preserve `data-slot` hooks where useful.
5. Add focused unit and browser behavior tests before relying on the component.
6. Record intentional deviations from upstream.

The removed prototype inventory and replacement proof are recorded in [the Task 41 component inventory](./design-system-component-inventory.md).
