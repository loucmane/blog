# Test Organization Migration Guide

This guide provides step-by-step instructions for migrating from the current mixed test organization to the new standardized structure.

## 📋 Current State Analysis

### Existing Patterns Found:
```
Current Structure:
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── __tests__/
│   │   │       └── Button.test.tsx
│   │   └── Card/
│   │       ├── Card.tsx
│   │       └── Card.test.tsx
├── tests/
│   ├── integration/
│   └── unit/
└── __tests__/
    └── pages/
```

### Target Structure:
```
Target Structure:
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── Button.test.tsx    ✅ Co-located unit test
│   │   └── Card/
│   │       ├── Card.tsx
│   │       └── Card.test.tsx      ✅ Co-located unit test
└── tests/
    ├── integration/               ✅ Integration tests
    │   └── user-flow.test.tsx
    └── e2e/                      ✅ E2E tests
        └── checkout.test.ts
```

## 🚀 Migration Steps

### Step 1: Identify Test Types
```bash
# Run this script to categorize your tests
#!/bin/bash

echo "=== Test Inventory ==="
echo "Unit tests in __tests__:"
find . -path "*/__tests__/*.test.tsx" -type f | wc -l

echo "Co-located tests:"
find . -name "*.test.tsx" -not -path "*/__tests__/*" -not -path "*/tests/*" | wc -l

echo "Tests in tests/ directory:"
find ./tests -name "*.test.*" -type f 2>/dev/null | wc -l
```

### Step 2: Backup Current Tests
```bash
# Create backup
cp -r . ../test-backup-$(date +%Y%m%d)
```

### Step 3: Run Migration Script
```bash
#!/bin/bash
# migrate-test-organization.sh

set -e

echo "🔄 Starting test migration..."

# 1. Move __tests__ unit tests to co-located
find . -path "*/__tests__/*.test.tsx" -type f | while read -r test_file; do
  # Get the parent component directory
  component_dir=$(dirname $(dirname "$test_file"))
  test_name=$(basename "$test_file")
  
  echo "Moving: $test_file → $component_dir/$test_name"
  mv "$test_file" "$component_dir/$test_name"
done

# 2. Clean up empty __tests__ directories
find . -type d -name "__tests__" -empty -delete

# 3. Create new test structure
mkdir -p tests/integration tests/e2e

# 4. Move integration tests
find ./tests/unit -name "*.integration.test.*" -type f 2>/dev/null | while read -r test_file; do
  mv "$test_file" ./tests/integration/
done

echo "✅ Migration complete!"
```

### Step 4: Update Test Configuration

#### Jest Configuration
```typescript
// jest.config.ts
import type { Config } from 'jest'

const config: Config = {
  testMatch: [
    // Unit tests - co-located with components
    '<rootDir>/src/**/*.test.{ts,tsx}',
    // Integration tests
    '<rootDir>/tests/integration/**/*.test.{ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/tests/e2e/', // E2E tests run separately
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default config
```

#### Playwright Configuration (E2E)
```typescript
// playwright.config.ts
import type { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: './tests/e2e',
  outputDir: './tests/e2e/results',
  // ... rest of config
}

export default config
```

### Step 5: Update CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:unit
      - run: pnpm test:integration

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm playwright install
      - run: pnpm test:e2e
```

### Step 6: Update Package Scripts
```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testMatch='<rootDir>/src/**/*.test.{ts,tsx}'",
    "test:integration": "jest --testMatch='<rootDir>/tests/integration/**/*.test.{ts,tsx}'",
    "test:e2e": "playwright test",
    "test:all": "pnpm test:unit && pnpm test:integration && pnpm test:e2e"
  }
}
```

## 🔍 Validation

### Verify Migration Success
```bash
#!/bin/bash
# validate-test-migration.sh

echo "🔍 Validating test migration..."

# Check for remaining __tests__ directories
if find . -type d -name "__tests__" | grep -q .; then
  echo "❌ Found remaining __tests__ directories:"
  find . -type d -name "__tests__"
  exit 1
fi

# Verify test structure
required_dirs=("tests/integration" "tests/e2e")
for dir in "${required_dirs[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "❌ Missing required directory: $dir"
    exit 1
  fi
done

# Count migrated tests
unit_count=$(find ./src -name "*.test.tsx" | wc -l)
integration_count=$(find ./tests/integration -name "*.test.tsx" 2>/dev/null | wc -l)

echo "✅ Migration validated!"
echo "  - Unit tests: $unit_count"
echo "  - Integration tests: $integration_count"
```

## 🐛 Troubleshooting

### Common Issues

1. **Import Path Errors**
   ```typescript
   // Before
   import { Button } from '../Button'
   
   // After - update relative imports
   import { Button } from './Button'
   ```

2. **Test Utils Location**
   ```typescript
   // Create a central test utils location
   // src/test-utils/index.ts
   export * from './render'
   export * from './mocks'
   ```

3. **Coverage Configuration**
   ```json
   // Update jest.config.ts
   {
     "coveragePathIgnorePatterns": [
       "/node_modules/",
       "/tests/e2e/",
       "/.next/"
     ]
   }
   ```

## 📊 Migration Checklist

- [ ] Backup existing tests
- [ ] Run migration script
- [ ] Update Jest configuration
- [ ] Update Playwright configuration
- [ ] Update CI/CD pipelines
- [ ] Update package.json scripts
- [ ] Fix import paths in tests
- [ ] Run all tests to verify
- [ ] Update documentation
- [ ] Communicate changes to team

## 🎯 Success Criteria

- All tests passing in new locations
- No remaining `__tests__` directories
- Clear separation of test types
- CI/CD pipeline running successfully
- Test coverage maintained or improved

## 📚 Additional Resources

- [Jest Configuration Docs](https://jestjs.io/docs/configuration)
- [Playwright Test Organization](https://playwright.dev/docs/test-projects)
- [Testing Best Practices](/docs/ai/shared-context/patterns/testing-patterns.md)