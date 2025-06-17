# Convention Validation Tools

This directory contains validation configurations and tools to enforce the discovered conventions in the Mom's Blog codebase.

## 📋 Contents

### 1. ESLint Configuration (`eslint-conventions.js`)
Comprehensive ESLint rules enforcing:
- Component structure patterns (forwardRef, displayName)
- File naming conventions (kebab-case)
- Import ordering rules
- Export patterns (named exports only)
- TypeScript conventions
- Accessibility requirements

### 2. Prettier Configuration (`prettier-conventions.json`)
Code formatting rules ensuring:
- Consistent spacing and indentation
- Import sorting matching our conventions
- Line ending standardization
- React/JSX formatting

### 3. TypeScript Configuration (`tsconfig-conventions.json`)
Type checking configuration with:
- Strict type checking enabled
- Path aliases configured
- Module resolution settings
- Comprehensive compiler checks

### 4. Custom Validation Script (`validate-conventions.ts`)
Standalone validation tool that checks:
- File naming patterns
- Component structure compliance
- Import order validation
- Type organization
- Error handling patterns
- Accessibility standards
- Directory structure

## 🚀 Usage

### ESLint Integration
```bash
# Copy to your project root
cp eslint-conventions.js /path/to/project/.eslintrc.js

# Run linting
pnpm eslint src --ext ts,tsx
```

### Prettier Integration
```bash
# Copy to your project root
cp prettier-conventions.json /path/to/project/.prettierrc.json

# Format code
pnpm prettier --write "src/**/*.{ts,tsx}"
```

### TypeScript Configuration
```bash
# Extend in your tsconfig.json
{
  "extends": "./tsconfig-conventions.json",
  "compilerOptions": {
    // Your project-specific overrides
  }
}
```

### Custom Validation Script
```bash
# Make executable
chmod +x validate-conventions.ts

# Run validation
./validate-conventions.ts

# Or with tsx
tsx validate-conventions.ts
```

## 📊 Validation Rules Summary

### Critical Rules (Errors)
- ❌ Missing `displayName` on forwardRef components
- ❌ Default exports (except Next.js pages)
- ❌ Interface names with "I" prefix
- ❌ Missing "use client" directive in error.tsx
- ❌ Import order violations

### Important Rules (Warnings)
- ⚠️ Components not using forwardRef pattern
- ⚠️ Missing focus-visible states
- ⚠️ Touch targets smaller than 44px
- ⚠️ Hooks not prefixed with "use-"

### Informational Rules
- ℹ️ Directory structure compliance
- ℹ️ Type organization patterns
- ℹ️ Accessibility attributes

## 🔧 Customization

Each tool can be customized for your specific needs:

1. **ESLint**: Modify rules in `eslint-conventions.js`
2. **Prettier**: Adjust formatting in `prettier-conventions.json`
3. **TypeScript**: Override settings in your local `tsconfig.json`
4. **Validation Script**: Add custom checks to `validate-conventions.ts`

## 📝 Pre-commit Hook Example

```bash
#!/bin/sh
# .husky/pre-commit

# Run convention validation
npx tsx docs/evolution/orchestration/outputs/1-discovery/v1/validation/validate-conventions.ts

# Run ESLint
npx eslint src --ext ts,tsx --max-warnings 0

# Format check
npx prettier --check "src/**/*.{ts,tsx}"
```

## 🎯 Compliance Goals

- **Phase 1**: 80% compliance score
- **Phase 2**: 90% compliance score
- **Phase 3**: 95%+ compliance score

## 📚 Related Documentation

- [Convention Quick Reference](../conventions/QUICK-REFERENCE.md)
- [Component Conventions](../conventions/01-component-conventions.md)
- [File Structure Conventions](../conventions/02-file-structure-conventions.md)
- [Type System Conventions](../conventions/03-type-system-conventions.md)
- [Import/Export Conventions](../conventions/04-import-export-conventions.md)
- [Error Handling Conventions](../conventions/05-error-handling-conventions.md)