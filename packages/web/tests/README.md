# Web Tests

These tests enforce the application boundary rather than a removed package-import demo.

## Suites

- `design-system/design-system-contract.test.ts` verifies the exact Tailwind 4/app-local component chain, CSS-first configuration, accessibility media rules, and absence of obsolete workspace packages.
- `framework/framework-contract.test.ts` verifies the Next.js framework, client/server boundaries, and production configuration.
- Component behavior tests live beside their source, for example `src/components/theme-menu.test.tsx`.
- Full production browser journeys live in the repository-level `tests/e2e/` directory.

## Commands

From the repository root:

```bash
pnpm test
pnpm test:coverage
pnpm test:capability
pnpm test:browser
```

There is no public `/test`, `/test-ui`, or `/mockup` route. New component demonstrations belong in focused tests or review artifacts, not production routing.
