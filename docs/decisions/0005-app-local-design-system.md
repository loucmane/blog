# ADR 0005: Use an App-Local Owned Design System

**Status:** Accepted

**Date:** 2026-07-14

**Task:** 41

## Context

The repository had one product application plus a UI package built independently with Rollup, its own Tailwind/PostCSS pipeline, repeated React declarations, four obsolete themes, and no second consumer. The web app also held an unused Radix/shadcn demonstration tree. That structure increased build, release, dependency, and CSS complexity without protecting a real boundary.

The magazine needs owned editorial typography and components, a safe nontechnical owner workspace, system-aware theming, and measurable accessibility. It does not need a generic component-library product.

## Decision

- Keep one product workspace at `packages/web`.
- Use Tailwind CSS `4.3.2` and `@tailwindcss/postcss` `4.3.2` with CSS-first theme configuration.
- Keep shadcn components as app-local owned source; `components.json` points to the app and leaves the Tailwind 4 config path blank.
- Use stable `@base-ui/react` `1.6.0` for selected new or migrated behavioral primitives. The first accepted primitive is the color-theme menu.
- Use `next-themes` `0.4.6` for system/light/dark persistence and hydration behavior.
- Pin `tailwind-merge` `3.6.0`, `tw-animate-css` `1.4.0`, `@tailwindcss/typography` `0.5.20`, and `lucide-react` `1.24.0` as the reviewed support chain.
- Remove the standalone UI, Express backend, and incomplete shared package after deterministic consumer and replacement proof.
- Remove unused Radix/demo components rather than translating them in bulk. Reintroduce a current primitive only for a proven product use.
- Preserve forced-colors, reduced-motion, focus, keyboard, semantic-token, and responsive mechanics. Do not preserve animal-foundation terminology or hand-authored contrast/gentle product themes.

## Current Evidence and Compatibility

| Choice          | Current stable at review                       | Compatibility and rationale                                                                                                                                                                                                                                        | Verification                                                                   |
| --------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Tailwind CSS    | `4.3.2`                                        | Current stable 4.3 line; official PostCSS integration; CSS-first tokens remove two JS configs and duplicated layers. Tailwind 4 targets Safari 16.4+, Chrome 111+, and Firefox 128+, which matches this new product's modern baseline.                             | Frozen install, CSS contract, Next build, desktop/mobile browser and axe runs. |
| shadcn model    | CLI `4.13.0` reviewed, not installed           | shadcn's July 2026 guidance makes stable Base UI the default for new work while explicitly rejecting forced big-bang migration of working Radix code. This repository owned no production Radix primitive, so removing unused source is safer than translating it. | `components.json`, owned-source inventory, no runtime CLI dependency.          |
| Base UI         | `1.6.0`                                        | Stable, React 19-compatible, and current shadcn default; menu provides APG-aligned keyboard behavior.                                                                                                                                                              | Focused unit test and real Playwright keyboard journey.                        |
| next-themes     | `0.4.6`                                        | React 19-compatible and solves SSR/hydration, system preference, persistence, and no-flash behavior without a custom effect-heavy provider.                                                                                                                        | Hydration-safe wrapper, browser mode change, axe in selected theme.            |
| Styling helpers | `tailwind-merge 3.6.0`, `tw-animate-css 1.4.0` | Current stable Tailwind 4 support; narrow, replaceable helpers.                                                                                                                                                                                                    | Unit/type/build and dependency contracts.                                      |

## Alternatives

- **Keep the UI package:** rejected because no second consumer offsets duplicate toolchains and release surface.
- **Publish a general component library:** outside product scope.
- **Translate every Radix file to Base UI:** rejected because unused demo source has no behavior worth migrating and shadcn itself warns against production big-bang primitive swaps.
- **Keep all Radix files indefinitely:** rejected because they had no current production consumer and created a false support claim.
- **Use four custom themes:** rejected because system forced-colors and reduced-motion are more faithful accessibility mechanisms; product art direction should not masquerade as an accessibility mode.
- **Run the shadcn CLI blindly:** rejected. Current source and dependencies are reviewed before being owned by the app.

## Consequences

- The design system is simpler but intentionally small; future owner-workspace components are added from real journeys.
- There is no independent UI artifact or duplicate build.
- The public and owner surfaces share semantic CSS variables but may compose different editorial layouts.
- Base UI and any future Radix exceptions are chosen component by component and recorded.
- Tailwind 4's modern browser floor is an explicit product baseline.
- Task 42 owns accepted persistence and server-domain boundaries; removing the Express placeholder does not implement a backend.

## Rollback

Revert the Task 41 squash commit to restore the package graph, old provider, and Tailwind 3 pipeline together. No schema, production data, deployment, secret, or irreversible migration is involved. If one Base UI primitive fails a required behavior before merge, replace only that app-local component or retain a proven Radix implementation; do not restore the obsolete package boundary.

## Acceptance Gates

1. Inventory every former UI export, app-local demo component, and workspace consumer.
2. Preserve or replace useful theme and accessibility mechanics before removal.
3. Prove the representative Base UI theme menu with unit, keyboard, focus, mobile, and axe evidence.
4. Remove duplicate React, TypeScript, Tailwind, PostCSS, Rollup, and package builds.
5. Run frozen install twice without drift, typecheck, lint, format, tests/coverage, build, smoke, browser/accessibility, package/runtime contracts, governance, guards, secret scan, and diff checks.
6. Complete independent implementation and adversarial boundary reviews.

## Primary Sources

- [Tailwind CSS v4.3 release](https://tailwindcss.com/blog/tailwindcss-v4-3) — retrieved 2026-07-14.
- [Tailwind CSS v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide) — retrieved 2026-07-14.
- [Tailwind CSS Next.js guide](https://tailwindcss.com/docs/installation/framework-guides/nextjs) — retrieved 2026-07-14.
- [shadcn July 2026 Base UI default](https://ui.shadcn.com/docs/changelog) — retrieved 2026-07-14.
- [shadcn Tailwind v4 guidance](https://ui.shadcn.com/docs/tailwind-v4) — retrieved 2026-07-14.
- [shadcn `components.json` contract](https://ui.shadcn.com/docs/components-json) — retrieved 2026-07-14.
- [Base UI 1.6 releases](https://base-ui.com/react/overview/releases) and [Menu API](https://base-ui.com/react/components/menu) — retrieved 2026-07-14.
- [next-themes repository and release](https://github.com/pacocoursey/next-themes) — retrieved 2026-07-14.
- Official npm registry metadata for the exact package versions above — queried 2026-07-14.
