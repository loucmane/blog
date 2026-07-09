# ADR 0005: Prefer an App-Local Owned Design System

**Status:** Proposed; acceptance requires component and workspace audit

**Date:** 2026-07-09

**Task:** 33

## Context

The repository has one product application plus a small shared UI package built independently with Rollup, its own TypeScript/Tailwind versions, and React 18 types. It contains some useful theme and token mechanics, but the package boundary creates duplicate toolchains and does not currently serve a second application. The product needs a bespoke magazine identity and a consistent owner workspace, not a generic design-system demonstration.

## Decision

- Prefer an app-local design system inside the full-stack web application.
- Treat shadcn/ui components as owned source, not a binary library.
- Use Base UI 1.6 primitives for new/migrated components, following shadcn's July 2026 default.
- Preserve intentional tokens, theme mechanics, accessibility behavior, and useful component customizations only after audit.
- Move components progressively and allow temporary Radix/Base UI coexistence only with removal tasks and deadlines.
- Remove the standalone UI package after all imports, builds, tests, and visual behavior are migrated and no concrete reuse case remains.
- Do not preserve four stale product themes or animal/trauma terminology merely because the mechanics are reusable.

## Rationale

An owned app-local system reduces build, release, peer dependency, and CSS duplication for a single application. shadcn states that components are owned and that Base UI is now the stable default for new projects while Radix remains supported. [July 2026 changelog](https://ui.shadcn.com/docs/changelog)

## Alternatives

- Keep the UI package unchanged: rejected because no independent consumer justifies its current complexity.
- Publish a general component library: outside product scope.
- Big-bang Base UI rewrite: rejected because it obscures visual and behavioral regressions.
- Keep Radix indefinitely: acceptable only if audit shows migration cost outweighs benefit for a customized component; record that per component.

## Consequences

- The design-system PR requires visual evidence, not only type/build success.
- Shared domain-independent primitives may be extracted later when a real second consumer exists.
- Magazine art direction remains controlled through templates and tokens rather than arbitrary owner CSS.
- Tailwind 4 migration and component primitive migration should be coordinated but remain reviewable commits.

## Acceptance Gates

1. Inventory every UI export and current consumer.
2. Classify each item as preserve, redesign, replace, or remove.
3. Migrate one representative interactive component with keyboard, focus, screen-reader, and screenshot parity.
4. Verify typography, spacing, color, motion, responsive layout, dark mode if retained, and reduced motion.
5. Remove duplicate React, TypeScript, Tailwind, PostCSS, and build versions.
6. Remove the package only after no import, script, or documented deployment relies on it.

## Rollback

Use component-scoped commits and keep the package until the final consumer is migrated. Revert a component migration independently. If Base UI fails a required behavior, keep the affected Radix primitive and record the exception rather than forcing a rewrite.
