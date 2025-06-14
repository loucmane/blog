# Web Package Tests

This directory contains various tests for the web package.

## Structure

```
tests/
├── integration/        # Integration tests (package imports, etc.)
├── components/         # Test components for manual verification
├── unit/              # Unit tests (future)
└── e2e/               # End-to-end tests (future)
```

## Test Files

### Integration Tests
- `integration/ui-package-imports.test.ts` - Verifies UI package imports work correctly

### Manual Verification
- `verify-ui-imports.mjs` - Node script to check package exports configuration
- `components/TestUIImports.tsx` - React component to test runtime imports

## Running Tests

```bash
# Verify package configuration
node tests/verify-ui-imports.mjs

# Run integration tests (when jest is configured)
pnpm test

# Manual verification - start dev server and visit /test-ui
pnpm dev
# Then visit http://localhost:3000/test-ui
```

## Temporary Test Page

The `/test-ui` route is temporary and should be removed after verifying imports work.