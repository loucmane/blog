# Convention Documentation Index

> **Generated**: 2025-06-17 | **Agent**: Convention Documenter (Agent 2) | **Confidence**: 89% Overall

## Overview

This directory contains comprehensive convention documentation derived from pattern analysis of the codebase. These conventions represent established patterns with high confidence scores and adoption rates.

## Convention Guides

### 🎯 Critical Conventions (Must Follow)

1. **[Component Development Conventions](./01-component-conventions.md)** - 92% confidence
   - React.forwardRef pattern for all UI components
   - Strict naming conventions (PascalCase components, kebab-case files)
   - CVA for variant management
   - Accessibility requirements (44px touch targets, focus states)

2. **[File Structure Conventions](./02-file-structure-conventions.md)** - 94% confidence
   - Feature-based directory organization
   - shadcn/ui component isolation in `components/ui/`
   - Consistent file naming standards
   - Test organization mirroring source structure

3. **[Type System Conventions](./03-type-system-conventions.md)** - 91% confidence
   - Domain-driven type organization
   - Interface extension patterns
   - Custom error class hierarchy
   - Standardized API response types

### 📦 Important Conventions (Highly Recommended)

4. **[Import/Export Conventions](./04-import-export-conventions.md)** - 89% confidence
   - Strict import ordering (6 groups with blank lines)
   - @ alias for all src imports
   - Named exports only (no defaults)
   - Monorepo package import patterns

5. **[Error Handling Conventions](./05-error-handling-conventions.md)** - 87% confidence
   - Next.js error.tsx boundaries
   - Custom AppError class hierarchy
   - Graceful loading and 404 pages
   - Consistent API error responses

## Quick Start Guide

### For New Developers

1. **Start with Components** - Read [Component Conventions](./01-component-conventions.md) first
2. **Understand Structure** - Review [File Structure](./02-file-structure-conventions.md)
3. **Learn Types** - Study [Type System](./03-type-system-conventions.md)
4. **Master Imports** - Follow [Import/Export](./04-import-export-conventions.md) patterns

### For Code Reviews

Use these checklists during reviews:

#### Component Checklist
- [ ] Uses React.forwardRef pattern
- [ ] Has displayName property
- [ ] Follows naming conventions
- [ ] Includes accessibility features
- [ ] Uses CVA for variants

#### Structure Checklist
- [ ] Files in correct directories
- [ ] Kebab-case file names
- [ ] Tests mirror source structure
- [ ] No files in wrong locations

#### Type Checklist
- [ ] Types in domain files
- [ ] Interfaces extend properly
- [ ] Error classes extend AppError
- [ ] API responses use standard format

#### Import Checklist
- [ ] Correct import order
- [ ] Blank lines between groups
- [ ] @ alias used consistently
- [ ] No default exports

## Convention Priority Matrix

| Convention | Confidence | Adoption | Priority | Impact |
|------------|------------|----------|----------|---------|
| File Naming | 98% | High | Critical | Consistency |
| Component Structure | 95% | High | Critical | Maintainability |
| Directory Organization | 96% | High | Critical | Scalability |
| Type Organization | 95% | High | Critical | Type Safety |
| Import Order | 94% | High | Critical | Readability |
| Error Boundaries | 91% | High | High | Reliability |
| CVA Styling | 90% | High | High | Consistency |
| API Response Format | 92% | Medium | High | Integration |
| Test Organization | 87% | Medium | Medium | Quality |
| Dynamic Imports | 84% | Low | Low | Performance |

## Undocumented Patterns Found

These patterns were discovered but need documentation:

1. **Compound Component Pattern** - Used in Card components
2. **Animation Standards** - Consistent `transition-all duration-300`
3. **Test Strategy** - Integration over unit tests approach
4. **State Management Patterns** - When to use hooks vs context

## Inconsistencies to Address

1. **Config File Extensions** - Mix of .ts and .js (standardize on .ts)
2. **Test Locations** - Both `tests/` and `__tests__/` patterns found

## Implementation Guide

### Setting Up Your Environment

```bash
# Install dependencies
pnpm install

# Configure your editor for import sorting
# Add ESLint rules from the Import/Export guide

# Set up path aliases in your IDE
# Configure TypeScript paths for @ alias
```

### Creating New Components

```bash
# 1. Create component file
touch src/components/ui/new-component.tsx

# 2. Use the component template from conventions
# 3. Add to shadcn tracking document
# 4. Create test file
touch tests/components/ui/new-component.test.tsx
```

## Enforcement Tools

### ESLint Configuration

See individual convention guides for specific ESLint rules to enforce patterns.

### Pre-commit Hooks

```bash
# Add husky for pre-commit checks
pnpm add -D husky lint-staged

# Configure for convention compliance
```

## Convention Evolution

These conventions will evolve as the codebase grows. When proposing changes:

1. **Document the rationale** - Why change?
2. **Show examples** - Before and after
3. **Consider migration** - How to update existing code
4. **Update conventions** - Keep documentation current

## Questions or Clarifications

If conventions seem unclear or conflicting:

1. Check the confidence scores - Higher confidence patterns take precedence
2. Look at recent code examples in the codebase
3. Consider the impact on existing code
4. Discuss with the team before deviating

## Next Steps

1. **Read all convention guides** in order
2. **Review existing code** to see patterns in action
3. **Use the checklists** during development
4. **Contribute improvements** when you find gaps

---

*These conventions were automatically discovered and documented through pattern analysis of the codebase. They represent the collective coding practices with high confidence scores.*