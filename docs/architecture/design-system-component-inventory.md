# Task 41 Design-System and Workspace Inventory

## Classification Rule

Production routes, active package contracts, and current browser journeys establish a consumer. A demo route, import-smoke test, stale documentation claim, or speculative second app does not justify a package boundary.

## Former `packages/ui` Exports

| Export or surface | Consumer before Task 41 | Classification | Replacement or proof |
| --- | --- | --- | --- |
| `ThemeProvider` / `useTheme` | Root layout, demo route, import tests | Redesign | App-local `theme-provider.tsx` delegates system/light/dark persistence and no-flash behavior to `next-themes`. |
| `ThemeSwitcher` | Home and mockup routes | Redesign | App-local `theme-menu.tsx` uses stable Base UI menu semantics with keyboard, focus, browser, and axe coverage. |
| `Button` | Package test only | Remove | No production consumer; future buttons are owned per real product use. |
| `useMediaQuery` | Import test only | Remove | No production consumer; CSS remains the default responsive mechanism. |
| color, spacing, typography, breakpoint, animation tokens | Tailwind config and import tests | Revise | Semantic CSS variables and Tailwind 4 theme projection replace runtime TypeScript token objects. |
| light and dark theme objects | Import tests | Revise | Canonical CSS variables preserve the supported visual modes. |
| contrast and gentle theme objects | Demo and import tests | Supersede | Forced-colors and reduced-motion media features preserve the accessibility mechanics without obsolete product themes. |
| base CSS and Tailwind config | Web global CSS/config | Replace | One CSS-first Tailwind 4 pipeline in `packages/web`. |
| Rollup/type declaration build | Package scripts only | Remove | No distribution consumer; Next compiles app-local source directly. |

## Former App-Local Prototype Components

| Components | Only live consumer | Classification |
| --- | --- | --- |
| `alert`, `checkbox`, `command`, `dialog`, `input`, `select`, `sheet`, `textarea`, `toast`, `toaster` | `/test` design-system demonstration | Remove; reintroduce reviewed current source only when owner workflows require it. |
| `button`, `card` | `/test` and obsolete `/mockup` | Remove; neither current reader route required them. |
| `aspect-ratio`, `avatar`, `badge`, `dropdown-menu`, `hover-card`, `popover`, `progress`, `scroll-area`, `separator`, `skeleton`, `switch`, `tabs` | No production route | Remove. |
| `use-toast` | `/test` only | Remove. |

The removal eliminates every obsolete Radix and `cmdk` dependency instead of pretending unused source is a supported component catalog. Base UI adoption remains component-scoped; it is not a bulk translation.

## Workspace Boundaries

| Boundary | Evidence | Decision |
| --- | --- | --- |
| `packages/ui` | One application consumer, duplicate build and styling toolchains | Remove after app-local theme replacement. |
| `packages/backend` | No product imports; placeholder routes and animal-foundation README | Remove. Task 42 creates accepted full-stack domain boundaries. |
| `packages/shared` | No manifest, no live import, speculative types only | Remove. Extract only after a real second consumer exists. |
| `packages/web` | All current reader, preview, route-handler, browser, and package behavior | Keep as the sole product workspace. |

## Verification Contract

Removal is accepted only when frozen installation is stable, no removed import remains, package and test-capability contracts pass, Next builds, production smoke passes, the theme menu works by keyboard on desktop and mobile, both themes have zero serious axe violations, and the final lockfile contains none of the removed workspace packages.
