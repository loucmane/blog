# Identified Convention Conflicts

This document identifies conflicts and inconsistencies discovered during the convention analysis phase.

## 🚨 Critical Conflicts

### 1. Test File Organization Conflict
**Issue**: Multiple test organization patterns found
- Pattern A: `tests/` directory at root level
- Pattern B: `__tests__/` directories co-located with components
- Pattern C: `.test.tsx` files alongside components

**Impact**: Inconsistent test discovery and organization

**Resolution Strategy**:
```
Decision Tree:
├─ Is it a unit test?
│  └─ Yes → Co-locate as `component.test.tsx`
│  └─ No → Continue
├─ Is it an integration test?
│  └─ Yes → Place in `tests/integration/`
│  └─ No → Continue
└─ Is it an E2E test?
   └─ Yes → Place in `tests/e2e/`
```

**Migration Path**:
1. Move all `__tests__/` contents to co-located `.test.tsx` files
2. Create `tests/integration/` and `tests/e2e/` directories
3. Update test runners configuration
4. Remove empty `__tests__/` directories

---

### 2. Configuration File Format Conflict
**Issue**: Mix of `.js` and `.ts` configuration files
- JavaScript: `next.config.js`, `tailwind.config.js`
- TypeScript: `jest.config.ts`, some package configs

**Impact**: Inconsistent type safety in configuration

**Resolution Strategy**:
- Standardize on TypeScript for all configuration files
- Exception: Keep `.js` for tools that don't support `.ts` well

**Migration Path**:
1. Convert `tailwind.config.js` → `tailwind.config.ts`
2. Convert other `.js` configs where TypeScript is supported
3. Add type definitions for config objects
4. Update package.json scripts if needed

---

### 3. Import Style Conflicts
**Issue**: Competing import patterns for React
- Pattern A: `import * as React from 'react'`
- Pattern B: `import React from 'react'`
- Pattern C: Named imports only `import { useState } from 'react'`

**Impact**: Inconsistent code style and potential tree-shaking issues

**Resolution Strategy**:
- Use `import * as React from 'react'` for consistency with forwardRef pattern
- Named imports allowed for hooks and specific utilities

**Migration Path**:
1. Update ESLint to enforce `import * as React`
2. Codemod to update existing imports
3. Update component templates

---

## ⚠️ Medium Priority Conflicts

### 4. Styling Approach Variations
**Issue**: Multiple styling patterns in use
- Tailwind utility classes
- CVA for variants
- Inline style objects (rare)
- CSS modules (legacy)

**Resolution Strategy**:
```
Priority Order:
1. CVA for component variants (complex components)
2. Tailwind utilities (simple styling)
3. Inline styles (dynamic values only)
4. Remove CSS modules (migrate to Tailwind)
```

---

### 5. Error Handling Patterns
**Issue**: Inconsistent error handling approaches
- Try-catch blocks with console.error
- Custom error classes (partial adoption)
- Error boundaries (incomplete coverage)

**Resolution Strategy**:
- Establish error hierarchy with AppError base
- Error boundaries for all route segments
- Standardized error logging

---

### 6. Type Definition Locations
**Issue**: Types defined in multiple locations
- Component files (inline interfaces)
- Dedicated type files
- Shared types package (underutilized)

**Resolution Strategy**:
```
Type Location Rules:
├─ Is it component-specific?
│  └─ Yes → Keep in component file
│  └─ No → Continue
├─ Is it shared within package?
│  └─ Yes → Place in src/types/
│  └─ No → Continue
└─ Is it shared across packages?
   └─ Yes → Place in @minniewinnie/shared
```

---

## ℹ️ Low Priority Conflicts

### 7. Comment Style Inconsistency
**Issue**: Various comment styles
- JSDoc blocks
- Single-line comments
- TODO/FIXME formats

**Resolution**: Establish comment style guide

### 8. Async Pattern Variations
**Issue**: Mix of async/await and promises
**Resolution**: Prefer async/await for readability

### 9. Event Handler Naming
**Issue**: `onClick` vs `handleClick` vs `onClickHandler`
**Resolution**: Standardize on `handleEventName` pattern

---

## 📊 Conflict Resolution Summary

| Conflict | Severity | Resolution Effort | Impact |
|----------|----------|------------------|---------|
| Test Organization | High | Medium | High |
| Config Formats | High | Low | Medium |
| Import Styles | High | Low | Low |
| Styling Patterns | Medium | High | Medium |
| Error Handling | Medium | Medium | High |
| Type Locations | Medium | Medium | Medium |
| Comments | Low | Low | Low |
| Async Patterns | Low | Low | Low |
| Event Handlers | Low | Low | Low |

## 🎯 Resolution Priorities

### Phase 1 (Immediate)
1. Standardize import patterns (automated)
2. Establish test organization structure
3. Configure validation tools

### Phase 2 (Short-term)
1. Migrate configuration files to TypeScript
2. Implement error handling hierarchy
3. Consolidate type definitions

### Phase 3 (Long-term)
1. Complete styling pattern migration
2. Remove legacy patterns
3. Full codebase compliance

## 🔄 Migration Support

For each conflict, we provide:
1. Clear decision criteria
2. Migration scripts/codemods where possible
3. Validation rules to prevent regression
4. Documentation updates

See individual migration guides in the `/migration-guides/` directory.